// Robust API response handling + human-readable error reporting.
//
// The AI endpoints normally return JSON, but when the Vercel serverless
// function crashes or times out, the platform returns a PLAIN-TEXT body such as
// "A server error has occurred" (500) or "FUNCTION_INVOCATION_TIMEOUT" (504).
// Calling `response.json()` on that throws "Unexpected token 'A'…", which hides
// the real problem. This module reads the body defensively and turns any
// failure into a structured, displayable report.

export interface ApiErrorReport {
  ok: false;
  endpoint: string;
  httpStatus: number;          // 0 = request never reached the server (network)
  httpStatusText: string;
  contentType: string;
  timestamp: string;
  durationMs: number;
  title: string;               // short human label
  explanation: string;         // what it means + what to do
  serverMessage?: string;      // message the app's own code returned, if JSON
  serverDetails?: string;      // details field, if JSON
  rawBody: string;             // exact bytes the server sent back (truncated)
}

const MAX_RAW = 4000;

export interface ReadResult {
  ok: boolean;
  status: number;
  data: any | null;      // parsed JSON, when the body was valid JSON
  report: ApiErrorReport | null; // populated only on failure
}

// Fetch a JSON API endpoint and never throw on a non-JSON / error body.
export async function fetchApi(
  endpoint: string,
  init?: RequestInit
): Promise<ReadResult> {
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(endpoint, init);
  } catch (networkErr: any) {
    // Request never completed (DNS, connection refused, CORS, offline…)
    return {
      ok: false,
      status: 0,
      data: null,
      report: {
        ok: false,
        endpoint,
        httpStatus: 0,
        httpStatusText: "No response",
        contentType: "",
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - started,
        title: "Could not reach the server",
        explanation:
          "The browser never got a response. The deployment may be down, the request was blocked (network/CORS), or you are offline. If the site itself loads, the API function likely failed to start.",
        serverMessage: networkErr?.message,
        rawBody: ""
      }
    };
  }

  const durationMs = Date.now() - started;
  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  // Try to parse JSON regardless of content-type (some hosts mislabel).
  let parsed: any = null;
  let isJson = false;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
      isJson = true;
    } catch {
      isJson = false;
    }
  }

  // Success path: 2xx and a JSON body the caller can use.
  if (response.ok && isJson) {
    return { ok: true, status: response.status, data: parsed, report: null };
  }

  // Anything else is a failure we describe in detail.
  const { title, explanation } = classify(response.status, raw, isJson, parsed);

  return {
    ok: false,
    status: response.status,
    data: isJson ? parsed : null,
    report: {
      ok: false,
      endpoint,
      httpStatus: response.status,
      httpStatusText: response.statusText,
      contentType,
      timestamp: new Date().toISOString(),
      durationMs,
      title,
      explanation,
      serverMessage: isJson ? parsed?.error ?? parsed?.message : undefined,
      serverDetails: isJson ? parsed?.details : undefined,
      rawBody: raw.length > MAX_RAW ? raw.slice(0, MAX_RAW) + "…[truncated]" : raw
    }
  };
}

function classify(
  status: number,
  raw: string,
  isJson: boolean,
  parsed: any
): { title: string; explanation: string } {
  const body = (raw || "").toUpperCase();

  // Daily usage quota exhausted (checked FIRST so it wins even when the quota
  // signal is wrapped inside a 500 "both providers failed" body). Gemini's free
  // tier caps generate_content at a fixed number of requests PER DAY; once hit it
  // returns 429 RESOURCE_EXHAUSTED until the quota resets (midnight Pacific). This
  // is a usage limit, NOT a network/server fault, and must be labeled as such.
  if (
    status === 429 ||
    body.includes("RESOURCE_EXHAUSTED") ||
    body.includes("EXCEEDED YOUR CURRENT QUOTA") ||
    body.includes("QUOTA EXCEEDED FOR METRIC") ||
    body.includes("FREE_TIER_REQUESTS") ||
    body.includes("PERDAY")
  ) {
    return {
      title: "Daily usage limit reached",
      explanation:
        "The AI provider's per-day request quota has been used up (Gemini free tier allows only a fixed number of requests per day). This is a usage limit, not a network or server error — no fix is needed on your side. The quota resets automatically (Gemini resets at midnight Pacific); the app also falls back to the Anthropic Claude engine when Gemini is exhausted. To raise the ceiling, enable billing on the Gemini API project."
    };
  }

  // Vercel platform crash — the function threw or failed to boot/bundle.
  if (
    body.includes("FUNCTION_INVOCATION_FAILED") ||
    body.includes("A SERVER ERROR HAS OCCURRED") ||
    (status === 500 && !isJson)
  ) {
    return {
      title: "Serverless function crashed (Vercel)",
      explanation:
        "The API function returned a platform error page instead of JSON, so it crashed or failed to start before your code ran. This is a deployment issue, not your API key. Check Vercel → your project → the deployment → Logs (Runtime) for the real stack trace. Common causes: a build/bundling error, a module that can't be resolved at cold start, or an uncaught exception."
    };
  }

  // Function timeout.
  if (status === 504 || body.includes("FUNCTION_INVOCATION_TIMEOUT") || body.includes("TIMED OUT")) {
    return {
      title: "Function timed out",
      explanation:
        "The AI request took longer than the Vercel function time limit (10s default; 60s max on Hobby, 300s on Pro). Set `maxDuration` in vercel.json, lower `max_tokens`, or upgrade the plan."
    };
  }

  // Auth / model problems surfaced by our own code (JSON) or the provider text.
  if (body.includes("INVALID X-API-KEY") || body.includes("AUTHENTICATION_ERROR") || status === 401) {
    return {
      title: "API key rejected (401)",
      explanation:
        "The AI provider rejected the key. Verify ANTHROPIC_API_KEY / GEMINI_API_KEY in Vercel → Settings → Environment Variables (Production AND Preview), that it is not the placeholder, and redeploy."
    };
  }
  if (body.includes("NOT_FOUND_ERROR") || body.includes("MODEL:") || body.includes("API_KEY_INVALID")) {
    return {
      title: "Model or key not available",
      explanation:
        "The provider returned a not-found/invalid error — usually the requested model isn't available to this key, or the key is invalid. Check the raw response below for the exact model id / message."
    };
  }

  if (status === 400) {
    return {
      title: "Bad request (400)",
      explanation:
        parsed?.error ||
        "The server rejected the request payload. Make sure required fields (Organization Name, Mission) are filled in."
    };
  }

  if (status === 404 && !isJson) {
    return {
      title: "Endpoint not found (404)",
      explanation:
        "The API route was not found on the deployment. Check the vercel.json rewrite that maps /api/* to the function, and that the function deployed."
    };
  }

  // Generic fallback — still show whatever the server said.
  return {
    title: `Request failed (${status || "no status"})`,
    explanation:
      (isJson && (parsed?.error || parsed?.details)) ||
      "The server returned an unexpected response. See the raw body below."
  };
}

// Flatten a report into copy-pasteable plain text (for a "Copy report" button).
export function formatReport(r: ApiErrorReport): string {
  return [
    `AI Grant Matcher — Error Report`,
    `Time:        ${r.timestamp}`,
    `Endpoint:    ${r.endpoint}`,
    `HTTP status: ${r.httpStatus} ${r.httpStatusText}`,
    `Duration:    ${r.durationMs} ms`,
    `Content-Type:${r.contentType || "(none)"}`,
    `Diagnosis:   ${r.title}`,
    `Meaning:     ${r.explanation}`,
    r.serverMessage ? `Server error: ${r.serverMessage}` : "",
    r.serverDetails ? `Server details: ${r.serverDetails}` : "",
    ``,
    `Raw server response:`,
    r.rawBody || "(empty body)"
  ]
    .filter(Boolean)
    .join("\n");
}
