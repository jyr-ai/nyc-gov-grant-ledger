import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import {
  NYC_BUDGET_OVERVIEW,
  AGENCY_BUDGET_DATA,
  FOCUS_AREA_DATA,
  BOROUGH_DATA,
  BUDGET_INITIATIVES
} from "./src/data/budgetData.js"; // .js extension required for Node ESM on Vercel (resolves to the .ts source)

export const app = express();
const PORT = 3000;

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
      model: "claude-3-5-sonnet-20241022",
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

// High-level AI helper that handles Anthropic Claude with fallback to Gemini
async function generateAIContent(
  systemInstruction: string,
  userPrompt: string,
  geminiSchema?: any
): Promise<any> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const hasAnthropic = anthropicApiKey && anthropicApiKey !== "MY_ANTHROPIC_API_KEY";
  let anthropicError: any = null;

  if (hasAnthropic) {
    try {
      console.log("Attempting to call Anthropic API (Primary)...");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
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
    } catch (err: any) {
      console.error("Anthropic API call failed, attempting backup Gemini API...", err);
      anthropicError = err;
    }
  } else {
    console.log("Anthropic key unconfigured, attempting backup Gemini API...");
    anthropicError = new Error("ANTHROPIC_API_KEY is not configured.");
  }

  // Fallback to Gemini
  const geminiClient = getGeminiClient();
  if (!geminiClient) {
    throw new Error(`Primary AI (Anthropic) failed: ${anthropicError.message}. No backup Gemini API key configured.`);
  }

  try {
    console.log("Attempting to call Gemini API (Fallback)...");
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
  } catch (geminiErr: any) {
    console.error("Gemini Fallback also failed:", geminiErr);
    throw new Error(`Both primary and backup AI services failed.\nAnthropic error: ${anthropicError.message}\nGemini error: ${geminiErr.message}`);
  }
}

// 1. Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Connection Diagnostic Endpoint (Anthropic with Gemini Fallback)
app.get("/api/health/gemini", async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const hasGemini = geminiKey && geminiKey !== "MY_GEMINI_API_KEY";
  const hasAnthropic = anthropicKey && anthropicKey !== "MY_ANTHROPIC_API_KEY";

  if (!hasGemini && !hasAnthropic) {
    return res.json({
      ok: false,
      error: "No AI API keys configured.",
      details: "Neither ANTHROPIC_API_KEY nor GEMINI_API_KEY are configured in environment variables."
    });
  }

  // Try Anthropic first
  if (hasAnthropic) {
    try {
      console.log("Health Check: Testing Anthropic...");
      const anthropicResponse = await testAnthropicConnection(anthropicKey);
      return res.json({
        ok: true,
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        responseSample: anthropicResponse,
        message: "Primary AI (Anthropic Claude) successfully authenticated and responded! Your Anthropic API Key is active."
      });
    } catch (anthropicError: any) {
      console.warn("Health Check: Anthropic failed, trying fallback check on Gemini...", anthropicError);
      
      if (hasGemini) {
        try {
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
            message: `Primary AI (Anthropic) failed: ${anthropicError.message}. Successfully failed-over to backup Gemini API!`
          });
        } catch (geminiError: any) {
          return res.json({
            ok: false,
            error: "Both AI providers failed.",
            details: `Anthropic failure: ${anthropicError.message}. Gemini failure: ${geminiError.message}`,
            advice: "Please double check both your ANTHROPIC_API_KEY and GEMINI_API_KEY configurations."
          });
        }
      } else {
        return res.json({
          ok: false,
          error: "Primary AI (Anthropic) failed and no backup key is configured.",
          details: anthropicError.message,
          advice: "Configure GEMINI_API_KEY as a backup or fix your ANTHROPIC_API_KEY setup."
        });
      }
    }
  }

  // If only Gemini is configured
  if (hasGemini) {
    try {
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
        message: "Backup AI (Gemini) successfully authenticated and responded! (Anthropic API key is unconfigured)."
      });
    } catch (geminiError: any) {
      return res.json({
        ok: false,
        error: "Gemini API check failed.",
        details: geminiError.message,
        advice: "Double check your GEMINI_API_KEY value and ensure it is valid."
      });
    }
  }

  return res.json({
    ok: false,
    error: "Unknown state."
  });
});

// 2. Budget Stats Endpoint
app.get("/api/budget/stats", (req, res) => {
  res.json({
    overview: NYC_BUDGET_OVERVIEW,
    agencies: AGENCY_BUDGET_DATA,
    focusAreas: FOCUS_AREA_DATA,
    boroughs: BOROUGH_DATA,
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

    // System instruction to guide the matching process
    const systemInstruction = `You are an expert NYC Council and NYS Government Grant Writer and Budget Analyst. 
Your goal is to analyze non-profit missions, matching them with accurate government funding channels, discretionary initiatives, and prequalification pathways in NYC (e.g., PASSPort) and NYS (e.g., SFS/Grants Gateway).
Always speak objectively, with professional composure, using clear human labels and precise public sector terminology (Schedule C, OTPS, PS, Charities Registration, etc.).`;

    const userPrompt = `Analyze this non-profit and map them to potential NYC Council Discretionary funding channels, NYS grants, and prequalification steps:
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

    const systemInstruction = `You are an expert NYC discretionary grant draft writer. 
You write extremely professional, high-impact proposal drafts. 
Avoid jargon-loaded AI phrases; instead, speak in clear, outcome-focused language with human-centric and realistic metrics.`;

    const userPrompt = `Help write an official discretionary grant concept draft for:
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
