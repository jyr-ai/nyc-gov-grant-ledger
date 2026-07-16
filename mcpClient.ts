// BetaNYC NYC-Budget MCP client.
//
// Spawns BetaNYC's official Model Context Protocol server — the npm package
// `@betanyc/nyc-budget-mcp` (https://github.com/BetaNYC/New-York-City-Budget/tree/main/mcp) —
// as a stdio subprocess and exposes its 7 real, data-backed tools to our own
// server-side AI calls. The MCP ships a prebuilt SQLite index built directly
// from this app's data source (the BetaNYC Schedule C / capital CSVs), so every
// answer the LLM produces through these tools is traced to the real repository,
// not the model's parametric memory.
//
// Tools exposed by the server (see the MCP README):
//   search_awards, get_awards_by_ein, search_transparency_resolutions,
//   get_legistar_link, search_capital_projects, get_terms_conditions,
//   list_available_fiscal_years
//
// This module is dual-mode safe: it runs under `tsx server.ts` (ESM, dev) and
// under the esbuild CJS bundle (`dist/server.cjs`, prod on Vercel). The MCP SDK
// is ESM-only, so it is always loaded via dynamic import(); the server binary is
// resolved via the CJS `require.resolve` when available (prod bundle) and via a
// cwd-relative path otherwise (dev).

import path from "path";
import fs from "fs";
import os from "os";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface McpToolCallRecord {
  name: string;
  args: Record<string, any>;
  resultText: string;
}

// A tolerant reference to a connected MCP client (typed loosely because the SDK
// is imported dynamically).
type AnyMcpClient = {
  connect: (transport: any) => Promise<void>;
  listTools: () => Promise<{ tools: McpTool[] }>;
  callTool: (req: { name: string; arguments?: Record<string, any> }) => Promise<any>;
  close: () => Promise<void>;
};

let cachedClient: AnyMcpClient | null = null;
let cachedTools: McpTool[] | null = null;
let connectPromise: Promise<AnyMcpClient> | null = null;

// How long to wait for the subprocess handshake before giving up. Kept well
// under the Vercel function maxDuration so a stuck spawn fails fast and honestly.
const CONNECT_TIMEOUT_MS = 15000;

/** Resolve the absolute path to the installed MCP server entry (dist/index.js). */
function resolveMcpEntry(): string {
  // Prod: the esbuild CJS bundle runs in a real CommonJS module with `require`.
  try {
    // @ts-ignore - `require` only exists in the CJS bundle, not in ESM/tsx dev.
    if (typeof require !== "undefined" && require.resolve) {
      // @ts-ignore
      return require.resolve("@betanyc/nyc-budget-mcp");
    }
  } catch {
    /* fall through to cwd-relative resolution */
  }
  // Dev (tsx/ESM) and fallback: node_modules under the project root.
  const candidate = path.join(
    process.cwd(),
    "node_modules/@betanyc/nyc-budget-mcp/dist/index.js"
  );
  if (fs.existsSync(candidate)) return candidate;
  throw new Error(
    "Could not resolve @betanyc/nyc-budget-mcp. Run `npm install` so the BetaNYC MCP server is present in node_modules."
  );
}

// Stage the MCP server into a WRITABLE temp dir before spawning it.
//
// Why this is necessary: the published package opens its SQLite index with
// `new Database(path, { readonly: true })`, and the shipped `budget.db` is in
// WAL journal mode. Opening a WAL database — even read-only — requires SQLite to
// create a `-shm` shared-memory file next to the database. On serverless hosts
// (Vercel/AWS Lambda) the deployment filesystem, including `node_modules`, is
// mounted READ-ONLY, so that `-shm` create fails with EROFS and surfaces as
// SQLITE_CANTOPEN ("unable to open database file"). Locally it works only
// because the dev filesystem is writable.
//
// Fix: copy the server's `dist/`, `package.json`, and `data/budget.db` into
// `os.tmpdir()` (the one writable location on Lambda), convert the copied DB out
// of WAL mode so no sidecar files are needed at all, and run the server from
// there. A `node_modules` symlink back to the real install lets the relocated
// ESM entry still resolve better-sqlite3 / the MCP SDK / zod.
const STAGE_DIR = path.join(os.tmpdir(), "nyc-budget-mcp-stage");
let stagedEntry: string | null = null;

async function convertDbOutOfWal(dbFile: string): Promise<void> {
  try {
    const mod: any = await import("better-sqlite3");
    const Database = mod.default || mod;
    const db = new Database(dbFile);
    db.pragma("wal_checkpoint(TRUNCATE)");
    db.pragma("journal_mode=DELETE");
    db.close();
  } catch {
    // Best-effort. Even without the conversion, the DB now lives on a writable
    // filesystem (tmp), so SQLite can create the WAL sidecars it needs.
  }
  for (const suffix of ["-wal", "-shm"]) {
    try {
      fs.rmSync(dbFile + suffix, { force: true });
    } catch {
      /* ignore */
    }
  }
}

/**
 * Copy the installed MCP server to a writable temp dir and return the path to
 * its relocated entry. Idempotent: reuses an existing stage within a warm
 * process/container.
 */
async function stageMcpServer(): Promise<string> {
  if (stagedEntry && fs.existsSync(stagedEntry)) return stagedEntry;

  const installedEntry = resolveMcpEntry(); // <pkg>/dist/index.js
  const pkgDir = path.dirname(path.dirname(installedEntry)); // <pkg>
  const nodeModulesRoot = path.dirname(path.dirname(pkgDir)); // .../node_modules

  const stageEntry = path.join(STAGE_DIR, "dist", "index.js");
  const stageDb = path.join(STAGE_DIR, "data", "budget.db");
  const stageNodeModules = path.join(STAGE_DIR, "node_modules");

  // If a previous invocation already staged everything, reuse it.
  if (fs.existsSync(stageEntry) && fs.existsSync(stageDb) && fs.existsSync(stageNodeModules)) {
    stagedEntry = stageEntry;
    return stageEntry;
  }

  fs.mkdirSync(path.join(STAGE_DIR, "data"), { recursive: true });

  // Relocate the code + database (fresh copy — never the stale WAL sidecars).
  fs.cpSync(path.join(pkgDir, "dist"), path.join(STAGE_DIR, "dist"), { recursive: true });
  const pkgJson = path.join(pkgDir, "package.json");
  if (fs.existsSync(pkgJson)) fs.copyFileSync(pkgJson, path.join(STAGE_DIR, "package.json"));
  fs.copyFileSync(path.join(pkgDir, "data", "budget.db"), stageDb);

  await convertDbOutOfWal(stageDb);

  // Let the relocated ESM entry resolve its dependencies from the real install.
  if (!fs.existsSync(stageNodeModules)) {
    try {
      fs.symlinkSync(nodeModulesRoot, stageNodeModules, "dir");
    } catch {
      // Symlink unsupported/blocked — fall back to running from the original
      // location and hope the FS is writable (dev). Signaled by returning the
      // installed entry instead of the staged one.
      stagedEntry = installedEntry;
      return installedEntry;
    }
  }

  stagedEntry = stageEntry;
  return stageEntry;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

/** Lazily spawn + connect the MCP server, caching the connection for reuse. */
async function connect(): Promise<AnyMcpClient> {
  if (cachedClient) return cachedClient;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    // Run from a writable temp copy so the read-only-filesystem WAL problem
    // (SQLITE_CANTOPEN on serverless) can't occur.
    const entry = await stageMcpServer();
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { StdioClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/stdio.js"
    );

    const transport = new StdioClientTransport({
      command: process.execPath, // the running node binary — no reliance on PATH/npx
      args: [entry],
      stderr: "ignore",
    });

    const client = new Client(
      { name: "the-city-ledger", version: "1.0.0" },
      { capabilities: {} }
    ) as unknown as AnyMcpClient;

    await withTimeout(client.connect(transport), CONNECT_TIMEOUT_MS, "MCP connect");
    cachedClient = client;
    return client;
  })();

  try {
    return await connectPromise;
  } catch (err) {
    // Reset so a later request can retry a fresh spawn.
    connectPromise = null;
    cachedClient = null;
    throw err;
  }
}

/** Return the MCP tool catalog (cached after first fetch). */
export async function getMcpTools(): Promise<McpTool[]> {
  if (cachedTools) return cachedTools;
  const client = await connect();
  const { tools } = await client.listTools();
  cachedTools = tools;
  return tools;
}

/** Call one MCP tool and return its text output (the tools return text content). */
export async function callMcpToolText(
  name: string,
  args: Record<string, any>
): Promise<string> {
  const client = await connect();
  const res = await withTimeout(
    client.callTool({ name, arguments: args }),
    CONNECT_TIMEOUT_MS,
    `MCP tool ${name}`
  );
  const parts: any[] = res?.content || [];
  const text = parts
    .filter((p) => p?.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("\n")
    .trim();
  if (res?.isError) {
    return `Tool error: ${text || "unknown MCP tool error"}`;
  }
  return text || "(no result)";
}

/** Liveness probe for the /api/health/mcp diagnostic. Never throws. */
export async function getMcpStatus(): Promise<{
  ok: boolean;
  tools?: string[];
  sample?: string;
  error?: string;
}> {
  try {
    const tools = await getMcpTools();
    const sample = await callMcpToolText("list_available_fiscal_years", {});
    return {
      ok: true,
      tools: tools.map((t) => t.name),
      sample: sample.slice(0, 300),
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// Schema adapters — turn the MCP JSON-Schema tool definitions into the shapes
// each LLM provider's tool/function-calling API expects.
// ---------------------------------------------------------------------------

/** JSON-Schema type string -> @google/genai Type enum name. */
function geminiType(jsonType: string): string {
  switch (jsonType) {
    case "string":
      return "STRING";
    case "number":
      return "NUMBER";
    case "integer":
      return "INTEGER";
    case "boolean":
      return "BOOLEAN";
    case "array":
      return "ARRAY";
    case "object":
      return "OBJECT";
    default:
      return "STRING";
  }
}

function convertSchemaForGemini(schema: any): any {
  if (!schema || typeof schema !== "object") return { type: "OBJECT", properties: {} };
  const out: any = { type: geminiType(schema.type || "object") };
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;
  if (schema.type === "object" && schema.properties) {
    out.properties = {};
    for (const [key, val] of Object.entries<any>(schema.properties)) {
      out.properties[key] = convertSchemaForGemini(val);
    }
    if (Array.isArray(schema.required) && schema.required.length) {
      out.required = schema.required;
    }
  }
  if (schema.type === "array" && schema.items) {
    out.items = convertSchemaForGemini(schema.items);
  }
  return out;
}

/** Build a Gemini `functionDeclarations` array from the MCP tool catalog. */
export function toGeminiFunctionDeclarations(tools: McpTool[]): any[] {
  return tools.map((t) => {
    const decl: any = {
      name: t.name,
      description: (t.description || "").slice(0, 1024),
    };
    const props = t.inputSchema?.properties;
    // Gemini rejects an empty parameter object; omit `parameters` for no-arg tools.
    if (props && Object.keys(props).length > 0) {
      decl.parameters = convertSchemaForGemini(t.inputSchema);
    }
    return decl;
  });
}

/** Build an Anthropic `tools` array from the MCP tool catalog. */
export function toAnthropicTools(tools: McpTool[]): any[] {
  return tools.map((t) => ({
    name: t.name,
    description: (t.description || "").slice(0, 1024),
    input_schema: t.inputSchema || { type: "object", properties: {} },
  }));
}
