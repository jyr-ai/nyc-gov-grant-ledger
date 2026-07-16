import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import {
  NYC_BUDGET_OVERVIEW,
  AGENCY_BUDGET_DATA,
  FOCUS_AREA_DATA,
  CAPITAL_BY_BOROUGH,
  BUDGET_INITIATIVES
} from "./src/data/budgetData.js"; // .js extension required for Node ESM on Vercel (resolves to the .ts source)
import {
  getMcpTools,
  callMcpToolText,
  getMcpStatus,
  toGeminiFunctionDeclarations,
  toAnthropicTools,
  type McpToolCallRecord
} from "./mcpClient.js";

export const app = express();
const PORT = 3000;

// Anthropic model used for all Claude calls. Keep this to a model your API key
// actually has access to — an inaccessible/legacy id returns HTTP 404
// (not_found_error), which looks like a failure even when the key is valid.
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

// Middleware for parsing JSON
app.use(express.json());

// Initialize Gemini Client Lazily/Safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Extract JSON safely from AI text outputs
function extractJson(text: string): any {
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const jsonStr = text.substring(startIndex, endIndex + 1);
      return JSON.parse(jsonStr);
    }
    throw e;
  }
}

// Test connection to Anthropic's Claude API
async function testAnthropicConnection(apiKey: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: "Respond with the word SUCCESS"
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic status ${response.status}: ${text}`);
  }

  const data: any = await response.json();
  return data.content?.[0]?.text?.trim() || "";
}

// High-level AI helper. Primary engine is Google Gemini; Anthropic Claude is the
// automatic fallback used only if Gemini is unconfigured or errors.
async function generateAIContent(
  systemInstruction: string,
  userPrompt: string,
  geminiSchema?: any
): Promise<any> {
  let geminiError: any = null;

  // Primary: Gemini
  const geminiClient = getGeminiClient();
  if (geminiClient) {
    try {
      console.log("Attempting to call Gemini API (Primary)...");
      const config: any = {
        systemInstruction,
        responseMimeType: "application/json"
      };
      if (geminiSchema) {
        config.responseSchema = geminiSchema;
      }

      const response = await geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config
      });

      const text = response.text;
      if (text) {
        return extractJson(text);
      }
      throw new Error("No text response from Gemini API.");
    } catch (err: any) {
      console.error("Gemini API call failed, attempting backup Anthropic API...", err);
      geminiError = err;
    }
  } else {
    console.log("Gemini key unconfigured, attempting backup Anthropic API...");
    geminiError = new Error("GEMINI_API_KEY is not configured.");
  }

  // Fallback: Anthropic Claude
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const hasAnthropic = anthropicApiKey && anthropicApiKey !== "MY_ANTHROPIC_API_KEY";
  if (!hasAnthropic) {
    throw new Error(`Primary AI (Gemini) failed: ${geminiError.message}. No backup Anthropic API key configured.`);
  }

  try {
    console.log("Attempting to call Anthropic API (Fallback)...");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        system: systemInstruction + "\n\nCRITICAL: Your output MUST be a strict JSON object. Do not include any introductory or concluding text outside the JSON block.",
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API returned status ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    const textContent = data.content?.[0]?.text;
    if (!textContent) {
      throw new Error("Empty content received from Anthropic API.");
    }

    return extractJson(textContent);
  } catch (anthropicErr: any) {
    console.error("Anthropic fallback also failed:", anthropicErr);
    throw new Error(`Both primary and backup AI services failed.\nGemini error: ${geminiError.message}\nAnthropic error: ${anthropicErr.message}`);
  }
}

// ===========================================================================
// BetaNYC MCP-powered AI agent
// ===========================================================================
// The tools below are BetaNYC's real NYC-Budget MCP server tools, backed by the
// same Schedule C / capital CSV data source the analytics dashboard traces to.
// The agent loop lets the LLM (Gemini primary, Claude fallback) decide which
// tools to call, executes them against the live MCP, and feeds the real results
// back until it can answer — so every figure is grounded in the source, never
// invented.

const BUDGET_AGENT_SYSTEM = `You are the "Budget Agent", an expert analyst for NYC Council discretionary (Schedule C) funding, embedded in The City Ledger app.

You have live tools backed by BetaNYC's official NYC-Budget dataset (Schedule C award-level data FY2015–FY2027, §254 capital projects, Terms & Conditions, Transparency Resolutions, and the Legistar crosswalk). ALWAYS answer questions about specific organizations, EINs, council members, agencies, initiatives, dollar amounts, award counts, capital projects, or fiscal-year figures by calling these tools and reporting what they return. Never guess or rely on memory for a number that a tool can look up.

Rules of engagement:
- Prefer a tool call over a guess. If a question needs data, call a tool.
- \`fiscal_year\` arguments are NUMBERS like 2027 (meaning FY2027), not strings.
- Respect the data's real coverage. Award/EIN-level data exists only FY2015–FY2027; FY2009–FY2014 are initiatives-only. If asked about a year or dataset outside coverage, say so plainly (call list_available_fiscal_years when unsure).
- A single EIN can be a fiscal sponsor pooling many programs (e.g. 13-2612524, Fund for the City of New York). When isolating one grantee, also filter by \`program\`.
- Cite concrete figures from tool output (org name, fiscal year, dollar amount, sponsoring member). Be concise and factual; use plain language and correct public-sector terms (Schedule C, OTPS/PS, PASSPort).
- If the tools genuinely return nothing, say the data shows no matching records rather than inventing an answer.
- Attribute the data to BetaNYC's NYC-Budget dataset when giving a substantive answer.`;

const MAX_AGENT_STEPS = 6;

// ---- Gemini function-calling agent loop -----------------------------------
async function runGeminiAgent(
  systemInstruction: string,
  history: Array<{ role: string; content: string }>,
  tools: any[]
): Promise<{ answer: string; toolCalls: McpToolCallRecord[] }> {
  const client = getGeminiClient();
  if (!client) throw new Error("GEMINI_API_KEY is not configured.");

  const functionDeclarations = toGeminiFunctionDeclarations(tools);
  // Seed the conversation from the provided history (user/assistant turns).
  const contents: any[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const toolCalls: McpToolCallRecord[] = [];

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    const response: any = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations }]
      }
    });

    const candidate = response.candidates?.[0];
    const parts: any[] = candidate?.content?.parts || [];
    const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);

    if (!calls.length) {
      return { answer: response.text || "", toolCalls };
    }

    // Record the model's turn (including its function-call parts).
    contents.push({ role: "model", parts });

    // Execute each requested tool against the real MCP and feed results back.
    const responseParts: any[] = [];
    for (const call of calls) {
      const name = call.name;
      const args = call.args || {};
      let resultText: string;
      try {
        resultText = await callMcpToolText(name, args);
      } catch (err: any) {
        resultText = `Tool error: ${err?.message || String(err)}`;
      }
      toolCalls.push({ name, args, resultText });
      responseParts.push({
        functionResponse: { name, response: { result: resultText } }
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  // Ran out of steps — ask the model for a final answer with no more tools.
  const finalResp: any = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: { systemInstruction }
  });
  return { answer: finalResp.text || "", toolCalls };
}

// ---- Anthropic tool-use agent loop ----------------------------------------
async function runAnthropicAgent(
  systemInstruction: string,
  history: Array<{ role: string; content: string }>,
  tools: any[]
): Promise<{ answer: string; toolCalls: McpToolCallRecord[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "MY_ANTHROPIC_API_KEY") {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  const anthropicTools = toAnthropicTools(tools);
  const messages: any[] = history.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content
  }));
  const toolCalls: McpToolCallRecord[] = [];

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: systemInstruction,
        tools: anthropicTools,
        messages
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API returned status ${response.status}: ${text}`);
    }

    const data: any = await response.json();
    const content: any[] = data.content || [];
    messages.push({ role: "assistant", content });

    if (data.stop_reason !== "tool_use") {
      const answer = content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { answer, toolCalls };
    }

    const toolResults: any[] = [];
    for (const block of content) {
      if (block.type !== "tool_use") continue;
      let resultText: string;
      try {
        resultText = await callMcpToolText(block.name, block.input || {});
      } catch (err: any) {
        resultText = `Tool error: ${err?.message || String(err)}`;
      }
      toolCalls.push({ name: block.name, args: block.input || {}, resultText });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: resultText
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  // Out of steps — force a final text answer without tools.
  const finalResp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemInstruction,
      messages
    })
  });
  const finalData: any = await finalResp.json();
  const answer = (finalData.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();
  return { answer, toolCalls };
}

// Provider-agnostic agent runner: Gemini primary, Anthropic fallback.
async function runBudgetAgent(
  history: Array<{ role: string; content: string }>
): Promise<{ answer: string; provider: string; toolCalls: McpToolCallRecord[] }> {
  const tools = await getMcpTools(); // throws if the MCP subprocess can't start

  const geminiKey = process.env.GEMINI_API_KEY;
  const hasGemini = geminiKey && geminiKey !== "MY_GEMINI_API_KEY";
  let geminiError: any = null;

  if (hasGemini) {
    try {
      const { answer, toolCalls } = await runGeminiAgent(BUDGET_AGENT_SYSTEM, history, tools);
      return { answer, provider: "gemini", toolCalls };
    } catch (err) {
      console.error("Budget Agent: Gemini failed, trying Anthropic...", err);
      geminiError = err;
    }
  }

  const { answer, toolCalls } = await runAnthropicAgent(BUDGET_AGENT_SYSTEM, history, tools);
  return { answer, provider: geminiError ? "anthropic (gemini failed)" : "anthropic", toolCalls };
}

// ---- Real-data grounding for the Matcher / Drafter ------------------------
// Maps free-text mission/population language to the real Schedule C category
// names present in the BetaNYC dataset, so we can pull actual FY2027 awards to
// ground the AI recommendations instead of letting the model free-associate.
const CATEGORY_KEYWORDS: Array<{ match: RegExp; category: string }> = [
  { match: /immigra|asylum|refugee|newcomer/i, category: "Immigrant Services" },
  { match: /mental health|behavioral|suicide|crisis|trauma/i, category: "Mental Health Services" },
  { match: /senior|older adult|aging|elderly|norc/i, category: "Older Adult Services" },
  { match: /food|pantry|hunger|nutrition|meal/i, category: "Food Initiatives" },
  { match: /art|culture|cultural|museum|theater|music|dance/i, category: "Cultural Organizations" },
  { match: /legal|tenant|eviction|civil rights|know your rights/i, category: "Legal Services" },
  { match: /youth|child|after.?school|teen|student|stem|tutor|educat/i, category: "Youth Services" },
  { match: /job|workforce|employ|career|training|small business/i, category: "Small Business Services and Workforce Development" },
  { match: /violence|criminal justice|reentry|gun|safety/i, category: "Criminal Justice Services" },
  { match: /housing|homeless|shelter|foreclosure/i, category: "Housing" },
  { match: /health|clinic|maternal|wellness|hiv|opioid/i, category: "Health Services" }
];

async function buildRealDataGrounding(opts: {
  orgName?: string;
  mission?: string;
  targetPopulation?: string;
}): Promise<{ text: string; grounded: boolean }> {
  const haystack = `${opts.mission || ""} ${opts.targetPopulation || ""}`;
  const categories: string[] = [];
  for (const { match, category } of CATEGORY_KEYWORDS) {
    if (match.test(haystack) && !categories.includes(category)) categories.push(category);
    if (categories.length >= 3) break;
  }

  const sections: string[] = [];
  try {
    // 1) Has this exact organization been funded before? (real award history)
    if (opts.orgName && opts.orgName.trim().length >= 4) {
      const orgHits = await callMcpToolText("search_awards", {
        organization: opts.orgName.trim(),
        limit: 6
      });
      if (orgHits && !/^0 award|no result|\(no result\)/i.test(orgHits)) {
        sections.push(`PRIOR AWARD HISTORY for "${opts.orgName}" (from BetaNYC Schedule C):\n${orgHits}`);
      }
    }

    // 2) Real FY2027 awards in the categories this org's mission aligns to.
    for (const category of categories) {
      const catHits = await callMcpToolText("search_awards", {
        category,
        fiscal_year: 2027,
        limit: 6
      });
      if (catHits) {
        sections.push(`REAL FY2027 "${category}" awards (sample from BetaNYC Schedule C):\n${catHits}`);
      }
    }
  } catch (err: any) {
    return {
      text: "",
      grounded: false
    };
  }

  if (!sections.length) return { text: "", grounded: false };
  return {
    text:
      "GROUNDING — REAL DATA FROM BetaNYC's NYC-Budget MCP (use these actual awards, organizations, sponsors, and dollar amounts to justify your recommendations; do not contradict them):\n\n" +
      sections.join("\n\n"),
    grounded: true
  };
}

// 1. Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Connection Diagnostic Endpoint (Gemini primary, Anthropic Claude fallback)
app.get("/api/health/gemini", async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const hasGemini = geminiKey && geminiKey !== "MY_GEMINI_API_KEY";
  const hasAnthropic = anthropicKey && anthropicKey !== "MY_ANTHROPIC_API_KEY";

  if (!hasGemini && !hasAnthropic) {
    return res.json({
      ok: false,
      error: "No AI API keys configured.",
      details: "Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY are configured in environment variables."
    });
  }

  // Primary: Gemini
  if (hasGemini) {
    try {
      console.log("Health Check: Testing Gemini (primary)...");
      const ai = getGeminiClient();
      if (!ai) {
        throw new Error("Unable to initialize Gemini client.");
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hello! Respond with exactly the single word 'SUCCESS' if you can read this."
      });
      const text = response.text?.trim() || "";
      return res.json({
        ok: true,
        provider: "gemini",
        model: "gemini-2.5-flash",
        responseSample: text,
        message: "Primary AI (Google Gemini) successfully authenticated and responded! Your Gemini API Key is active."
      });
    } catch (geminiError: any) {
      console.warn("Health Check: Gemini failed, trying fallback check on Anthropic...", geminiError);

      if (hasAnthropic) {
        try {
          const anthropicResponse = await testAnthropicConnection(anthropicKey);
          return res.json({
            ok: true,
            provider: "anthropic",
            model: CLAUDE_MODEL,
            responseSample: anthropicResponse,
            message: `Primary AI (Gemini) failed: ${geminiError.message}. Successfully failed-over to backup Anthropic Claude API!`
          });
        } catch (anthropicError: any) {
          return res.json({
            ok: false,
            error: "Both AI providers failed.",
            details: `Gemini failure: ${geminiError.message}. Anthropic failure: ${anthropicError.message}`,
            advice: "Please double check both your GEMINI_API_KEY and ANTHROPIC_API_KEY configurations."
          });
        }
      } else {
        return res.json({
          ok: false,
          error: "Primary AI (Gemini) failed and no backup key is configured.",
          details: geminiError.message,
          advice: "Configure ANTHROPIC_API_KEY as a backup or fix your GEMINI_API_KEY setup."
        });
      }
    }
  }

  // If only Anthropic is configured
  if (hasAnthropic) {
    try {
      const anthropicResponse = await testAnthropicConnection(anthropicKey);
      return res.json({
        ok: true,
        provider: "anthropic",
        model: CLAUDE_MODEL,
        responseSample: anthropicResponse,
        message: "Backup AI (Anthropic Claude) successfully authenticated and responded! (Gemini API key is unconfigured)."
      });
    } catch (anthropicError: any) {
      return res.json({
        ok: false,
        error: "Anthropic API check failed.",
        details: anthropicError.message,
        advice: "Double check your ANTHROPIC_API_KEY value and ensure it is valid."
      });
    }
  }

  return res.json({
    ok: false,
    error: "Unknown state."
  });
});

// Detailed AI diagnostics endpoint. Safe to expose publicly: it never returns
// full secret values, only presence, a masked preview, and live-test results.
// Open /api/debug on the deployed URL to see exactly why the keys are/aren't working.
app.get("/api/debug", async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const mask = (k?: string) => {
    if (!k) return null;
    if (k.length <= 8) return `***(length ${k.length})`;
    return `${k.slice(0, 4)}…${k.slice(-4)} (length ${k.length})`;
  };

  const anthropicConfigured = !!anthropicKey && anthropicKey !== "MY_ANTHROPIC_API_KEY";
  const geminiConfigured = !!geminiKey && geminiKey !== "MY_GEMINI_API_KEY";

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    runtime: {
      onVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV || null,
      nodeEnv: process.env.NODE_ENV || null,
      region: process.env.VERCEL_REGION || null
    },
    model: CLAUDE_MODEL,
    env: {
      ANTHROPIC_API_KEY: {
        present: anthropicKey !== undefined,
        isPlaceholder: anthropicKey === "MY_ANTHROPIC_API_KEY",
        configured: anthropicConfigured,
        preview: mask(anthropicKey),
        looksValidPrefix: anthropicConfigured ? anthropicKey!.startsWith("sk-ant-") : null
      },
      GEMINI_API_KEY: {
        present: geminiKey !== undefined,
        isPlaceholder: geminiKey === "MY_GEMINI_API_KEY",
        configured: geminiConfigured,
        preview: mask(geminiKey),
        looksValidPrefix: geminiConfigured ? geminiKey!.startsWith("AIza") : null
      }
    },
    liveTests: {} as any
  };

  if (anthropicConfigured) {
    try {
      const sample = await testAnthropicConnection(anthropicKey!);
      diagnostics.liveTests.anthropic = { ok: true, model: CLAUDE_MODEL, responseSample: sample };
    } catch (err: any) {
      diagnostics.liveTests.anthropic = { ok: false, error: err.message };
    }
  } else {
    diagnostics.liveTests.anthropic = { ok: false, skipped: true, reason: "ANTHROPIC_API_KEY not configured" };
  }

  if (geminiConfigured) {
    try {
      const ai = getGeminiClient();
      if (!ai) throw new Error("Unable to initialize Gemini client.");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Respond with exactly the single word SUCCESS."
      });
      diagnostics.liveTests.gemini = { ok: true, model: "gemini-2.5-flash", responseSample: response.text?.trim() || "" };
    } catch (err: any) {
      diagnostics.liveTests.gemini = { ok: false, error: err.message };
    }
  } else {
    diagnostics.liveTests.gemini = { ok: false, skipped: true, reason: "GEMINI_API_KEY not configured" };
  }

  if (diagnostics.liveTests.anthropic.ok || diagnostics.liveTests.gemini.ok) {
    diagnostics.summary = "At least one AI provider authenticated successfully.";
  } else if (!anthropicConfigured && !geminiConfigured) {
    diagnostics.summary =
      "No AI API keys are configured. Add GEMINI_API_KEY and/or ANTHROPIC_API_KEY under Vercel → Project → Settings → Environment Variables (scope: Production AND Preview), then redeploy.";
  } else {
    diagnostics.summary =
      "Key(s) present but the live test failed — see liveTests[].error for the exact provider response (401 = invalid/expired key, 404 = model not accessible, 429 = quota/billing).";
  }

  res.json(diagnostics);
});

// 2. Budget Stats Endpoint
app.get("/api/budget/stats", (req, res) => {
  res.json({
    overview: NYC_BUDGET_OVERVIEW,
    agencies: AGENCY_BUDGET_DATA,
    focusAreas: FOCUS_AREA_DATA,
    capitalByBorough: CAPITAL_BY_BOROUGH,
    initiatives: BUDGET_INITIATIVES
  });
});

// 3. Grant AI Matchmaker Endpoint
app.post("/api/grant/match", async (req, res) => {
  try {
    const { orgName, mission, targetPopulation, targetBoroughs, budgetSize } = req.body;

    if (!orgName || !mission) {
      return res.status(400).json({ error: "Organization Name and Mission statement are required." });
    }

    // Pull real, matching FY2027 Schedule C awards from BetaNYC's MCP so the
    // recommendations are grounded in the actual data source, not the model's memory.
    const grounding = await buildRealDataGrounding({ orgName, mission, targetPopulation });

    // System instruction to guide the matching process
    const systemInstruction = `You are an expert NYC Council and NYS Government Grant Writer and Budget Analyst.
Your goal is to analyze non-profit missions, matching them with accurate government funding channels, discretionary initiatives, and prequalification pathways in NYC (e.g., PASSPort) and NYS (e.g., SFS/Grants Gateway).
Always speak objectively, with professional composure, using clear human labels and precise public sector terminology (Schedule C, OTPS, PS, Charities Registration, etc.).
${grounding.grounded
  ? "You have been given REAL, current NYC Council Schedule C award records (below) retrieved live from BetaNYC's NYC-Budget dataset. Base your recommended budget lines, initiative names, and grant-range estimates on these actual awards. Prefer initiative names and dollar ranges that appear in the real data."
  : "Base your analysis on well-known, real NYC Council Schedule C initiatives (e.g. CASA, NYC Cleanup, NORCs, Immigrant Legal Services)."}`;

    const userPrompt = `${grounding.grounded ? grounding.text + "\n\n---\n\n" : ""}Analyze this non-profit and map them to potential NYC Council Discretionary funding channels, NYS grants, and prequalification steps:
    - Organization Name: "${orgName}"
    - Mission / Program Goals: "${mission}"
    - Target Population: "${targetPopulation || "General Public"}"
    - Target Boroughs: "${Array.isArray(targetBoroughs) ? targetBoroughs.join(", ") : (targetBoroughs || "Citywide")}"
    - Operating Budget Size: "${budgetSize || "Under $100k"}"

    Your analysis MUST be formatted in a strict, parsed JSON structure to allow direct rendering in the UI. Ensure you return ONLY valid JSON matching this schema:
    {
      "relevanceScore": number (1 to 100),
      "analysisSummary": "string summarizing how well their work aligns with NYC/NYS priorities",
      "recommendedAgencies": [
        {
          "agency": "string (e.g., DYCD, DCLA, DFTA, HPD, DOHMH)",
          "name": "string (Full Agency Name)",
          "rationale": "string detailing why this agency fits",
          "budgetLines": ["string naming specific budget line or discretionary initiative like CASA or Youth Services"],
          "estimatedGrantRange": "string (e.g., $10k - $30k)"
        }
      ],
      "nysOpportunities": [
        {
          "program": "string program name",
          "department": "string NYS Department name (e.g., NYSCA, NYS Department of State, NYS Office of Mental Health)",
          "description": "string outlining the state funding stream and why it applies",
          "prequalificationRequired": boolean
        }
      ],
      "applicationChecklist": [
        {
          "step": "string title",
          "description": "string concrete description",
          "portal": "string (PASSPort, NYS SFS, or Charities Registration)"
        }
      ],
      "priorityAlignmentSuggestions": [
        "string action items on how to frame their proposal to align with current city/state priority items (e.g. mental health, digital literacy, support services)"
      ]
    }`;

    const MATCH_RESPONSE_SCHEMA = {
      type: Type.OBJECT,
      properties: {
        relevanceScore: { type: Type.INTEGER },
        analysisSummary: { type: Type.STRING },
        recommendedAgencies: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              agency: { type: Type.STRING },
              name: { type: Type.STRING },
              rationale: { type: Type.STRING },
              budgetLines: { type: Type.ARRAY, items: { type: Type.STRING } },
              estimatedGrantRange: { type: Type.STRING }
            },
            required: ["agency", "name", "rationale", "budgetLines", "estimatedGrantRange"]
          }
        },
        nysOpportunities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              program: { type: Type.STRING },
              department: { type: Type.STRING },
              description: { type: Type.STRING },
              prequalificationRequired: { type: Type.BOOLEAN }
            },
            required: ["program", "department", "description", "prequalificationRequired"]
          }
        },
        applicationChecklist: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.STRING },
              description: { type: Type.STRING },
              portal: { type: Type.STRING }
            },
            required: ["step", "description", "portal"]
          }
        },
        priorityAlignmentSuggestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: [
        "relevanceScore",
        "analysisSummary",
        "recommendedAgencies",
        "nysOpportunities",
        "applicationChecklist",
        "priorityAlignmentSuggestions"
      ]
    };

    const parsedData = await generateAIContent(systemInstruction, userPrompt, MATCH_RESPONSE_SCHEMA);
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error in matching grant:", err);
    res.status(500).json({ error: "Failed to generate AI grant matches.", details: err.message });
  }
});

// 4. Discretionary Grant Concept Draft Writer Endpoint
app.post("/api/grant/draft", async (req, res) => {
  try {
    const { orgName, mission, selectedAgency, programName, targetAudience, requestedAmount } = req.body;

    if (!orgName || !mission || !selectedAgency || !programName) {
      return res.status(400).json({ error: "Required details: Organization, Mission, Target Agency, and Program Name." });
    }

    // Ground the draft in real, comparable Schedule C awards for this org / focus area.
    const grounding = await buildRealDataGrounding({ orgName, mission, targetPopulation: targetAudience });

    const systemInstruction = `You are an expert NYC discretionary grant draft writer.
You write extremely professional, high-impact proposal drafts.
Avoid jargon-loaded AI phrases; instead, speak in clear, outcome-focused language with human-centric and realistic metrics.
${grounding.grounded
  ? "You have REAL NYC Council Schedule C award records (below) from BetaNYC's NYC-Budget dataset for comparable organizations and initiatives. Ground the statement of need and budget narrative in realistic amounts consistent with these actual awards."
  : ""}`;

    const userPrompt = `${grounding.grounded ? grounding.text + "\n\n---\n\n" : ""}Help write an official discretionary grant concept draft for:
    - Organization Name: "${orgName}"
    - Mission: "${mission}"
    - Selected Funding Agency/Pathway: "${selectedAgency}"
    - Proposed Program Name: "${programName}"
    - Target Audience/Participants: "${targetAudience || "Underserved local community residents"}"
    - Requested Discretionary Funding: "$${requestedAmount || "25,000"}"

    Draft the following 4 sections. Keep the response formatted in strict JSON structure with keys:
    {
      "statementOfNeed": "string detailing the socio-economic and community need, with realistic NYC citations (e.g. poverty indexes, educational gaps, lack of arts access)",
      "programDesign": "string outlining core activities, calendar/schedule, staffing pattern, and logistics",
      "performanceMetrics": "string naming 3 quantitative and 2 qualitative metrics they will use to measure progress in compliance with PASSPort reporting",
      "budgetNarrative": "string explaining how the requested amount of $${requestedAmount || "25,000"} will be allocated between Personal Services (PS) (e.g., instructors, project managers) and Other Than Personal Services (OTPS) (supplies, insurance, food, local travel)"
    }`;

    const DRAFT_RESPONSE_SCHEMA = {
      type: Type.OBJECT,
      properties: {
        statementOfNeed: { type: Type.STRING },
        programDesign: { type: Type.STRING },
        performanceMetrics: { type: Type.STRING },
        budgetNarrative: { type: Type.STRING }
      },
      required: ["statementOfNeed", "programDesign", "performanceMetrics", "budgetNarrative"]
    };

    const parsedData = await generateAIContent(systemInstruction, userPrompt, DRAFT_RESPONSE_SCHEMA);
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error in drafting proposal:", err);
    res.status(500).json({ error: "Failed to generate AI proposal draft.", details: err.message });
  }
});

// 5. MCP diagnostic — verifies the BetaNYC NYC-Budget MCP subprocess can spawn
// and answer. Open /api/health/mcp on the deployment to confirm live tool access.
app.get("/api/health/mcp", async (req, res) => {
  const status = await getMcpStatus();
  res.json({
    server: "@betanyc/nyc-budget-mcp",
    source: "https://github.com/BetaNYC/New-York-City-Budget/tree/main/mcp",
    ...status
  });
});

// 6. Budget Agent — conversational agent that answers NYC budget questions by
// calling BetaNYC's real MCP tools (Gemini primary, Claude fallback).
app.post("/api/agent/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "A 'message' string is required." });
    }

    // Normalize + bound the prior turns, then append the new user message.
    const priorTurns: Array<{ role: string; content: string }> = Array.isArray(history)
      ? history
          .filter(
            (m: any) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim()
          )
          .slice(-10)
          .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }))
      : [];

    const conversation = [
      ...priorTurns,
      { role: "user", content: message.slice(0, 4000) }
    ];

    const { answer, provider, toolCalls } = await runBudgetAgent(conversation);
    res.json({
      answer,
      provider,
      toolCalls: toolCalls.map((t) => ({
        name: t.name,
        args: t.args,
        // Trim tool output for the UI trace; full text already informed the model.
        resultPreview: t.resultText.slice(0, 600)
      }))
    });
  } catch (err: any) {
    console.error("Error in Budget Agent chat:", err);
    res.status(500).json({
      error: "The Budget Agent could not complete your request.",
      details: err?.message || String(err)
    });
  }
});

// Any unmatched /api/* route returns JSON (never the SPA HTML or a platform page)
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API route not found.",
    details: `No handler for ${req.method} ${req.originalUrl}`
  });
});

// Global error handler: guarantees a JSON body even if a handler throws, so the
// client never has to parse Vercel's plain-text "A server error has occurred".
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled server error:", err);
  if (res.headersSent) return;
  res.status(500).json({
    error: "Internal server error.",
    details: err?.message || String(err)
  });
});

// 5. Setup Vite dev or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Express with Vite middleware (development)...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
