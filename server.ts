import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import {
  NYC_BUDGET_OVERVIEW,
  AGENCY_BUDGET_DATA,
  FOCUS_AREA_DATA,
  BOROUGH_DATA,
  BUDGET_INITIATIVES
} from "./src/data/budgetData"; // Import without extension

const app = express();
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

// 1. Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API Key is missing.",
        needsKey: true,
        message: "Please configure your GEMINI_API_KEY in the Settings > Secrets panel of your AI Studio Workspace."
      });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
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
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response from Gemini API.");
    }

    const parsedData = JSON.parse(text.trim());
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

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API Key is missing.",
        needsKey: true,
        message: "Please configure your GEMINI_API_KEY in the Settings > Secrets panel."
      });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            statementOfNeed: { type: Type.STRING },
            programDesign: { type: Type.STRING },
            performanceMetrics: { type: Type.STRING },
            budgetNarrative: { type: Type.STRING }
          },
          required: ["statementOfNeed", "programDesign", "performanceMetrics", "budgetNarrative"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response from Gemini API for proposal draft.");
    }

    const parsedData = JSON.parse(text.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error in drafting proposal:", err);
    res.status(500).json({ error: "Failed to generate AI proposal draft.", details: err.message });
  }
});

// 5. Setup Vite dev or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Express with Vite middleware (development)...");
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

startServer();
