import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileSpreadsheet, 
  Sparkles, 
  Landmark, 
  ShieldCheck, 
  Compass,
  FileText,
  Info,
  ExternalLink,
  ChevronRight,
  GitFork
} from "lucide-react";
import BudgetAnalytics from "./components/BudgetAnalytics";
import GrantMatcher from "./components/GrantMatcher";
import ProposalDrafter from "./components/ProposalDrafter";
import PrequalificationQuiz from "./components/PrequalificationQuiz";
import BudgetAgent from "./components/BudgetAgent";
import { fetchApi } from "./lib/apiError";

type TabType = "analytics" | "matcher" | "drafter" | "prequal";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("analytics");

  // Shared state to bridge the AI Matcher with the Drafting Assistant
  const [prefillAgency, setPrefillAgency] = useState("");
  const [prefillOrg, setPrefillOrg] = useState("");
  const [prefillMission, setPrefillMission] = useState("");

  // Gemini & Fallback API Key diagnostic states
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testDetails, setTestDetails] = useState<string>("");
  const [activeProvider, setActiveProvider] = useState<string>("");

  const handleTestKey = async () => {
    setTestStatus("testing");
    setTestDetails("");
    setActiveProvider("");
    const { ok, data, report } = await fetchApi("/api/health/gemini");
    if (ok && data?.ok) {
      setTestStatus("success");
      setTestDetails(data.message || "Connected successfully!");
      setActiveProvider(data.provider || "gemini");
    } else {
      setTestStatus("error");
      // Prefer the app's own JSON error; otherwise fall back to the classified
      // report (e.g. "Serverless function crashed" + HTTP status).
      const detail =
        data?.error ||
        (report ? `${report.title} — HTTP ${report.httpStatus} ${report.httpStatusText}` : "Verification failed.");
      setTestDetails(detail);
    }
  };

  const handleSelectAgencyForDraft = (agency: string, orgName: string, mission: string) => {
    setPrefillAgency(agency);
    setPrefillOrg(orgName);
    setPrefillMission(mission);
    setActiveTab("drafter"); // Switch to the Drafting Assistant
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] text-[#1A1A1A] font-sans flex flex-col antialiased" id="main-applet-root">
      
      {/* Editorial Header */}
      <header className="border-b-2 border-[#1A1A1A] mx-4 sm:mx-8 pt-8 pb-5 flex flex-col md:flex-row justify-between items-start gap-6" id="app-header">
        {/* Left Side: Title and Subtitle */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 mb-1 bg-[#F27D26] text-white text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 w-fit">
            <span>Grant Navigator</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tighter leading-none text-[#1A1A1A] uppercase">
            THE CITY LEDGER
          </h1>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold mt-1 text-[#555] leading-relaxed">
            NYC Government Spending & Grant Analysis • Vol. 26
          </p>
        </div>

        {/* Right Side: Logo at the top-right, budget stats and link below it */}
        <div className="flex flex-col items-start md:items-end gap-4 self-stretch md:self-auto md:text-right">
          {/* Custom brand identity box at the top right, 25% smaller, minimized whitespace */}
          <a
            href="https://www.nyc-dssg.org"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white px-6 py-4 border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] shrink-0 w-60 sm:w-72 flex flex-col justify-center items-start leading-none select-none self-start md:self-end hover:shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            id="brand-logo-container"
          >
            <span className="font-serif font-black tracking-tighter text-[#003B71] text-[34px] sm:text-[40px] leading-none">DSSG-NYC</span>
            <span className="text-[#F27D26] font-mono font-bold text-[11px] sm:text-[13px] uppercase tracking-tight mt-2 leading-tight">
              organized by Data Diplomats
            </span>
          </a>
          
          {/* Budget stats and source code button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 w-full md:w-auto md:text-right mt-1">
            <div className="md:text-right">
              <div className="text-3xl sm:text-4xl font-serif font-black italic text-[#003B71]">$112.4B</div>
              <div className="text-[9px] uppercase tracking-widest font-bold text-[#666]">FY25/FY26 Adopted Operating Budget</div>
            </div>
            
            <div className="shrink-0">
              <a 
                href="https://github.com/BetaNYC/New-York-City-Budget" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-[10px] text-[#1A1A1A] hover:bg-[#003B71] hover:text-white font-bold uppercase tracking-wider bg-transparent px-3 py-2 border-2 border-[#1A1A1A] transition-all rounded-none"
                id="btn-source-repo"
              >
                <GitFork className="w-3 h-3 text-[#F27D26]" />
                <span>BetaNYC Data</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Sub-header (Tabs & Gemini Diagnostics) */}
      <div className="mx-4 sm:mx-8 border-b border-[#1A1A1A]/20 sticky top-0 md:top-0 z-40 bg-[#F9F8F3]/95 backdrop-blur-xs py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="navigation-tabs-bar">
        <div className="flex space-x-1 sm:space-x-3 overflow-x-auto scrollbar-none" id="tabs-container">
          
          <button
            id="tab-btn-analytics"
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 transition-all whitespace-nowrap cursor-pointer rounded-none border-2 ${
              activeTab === "analytics"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-transparent border-transparent text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span className="font-serif italic font-semibold">Adopted Budget Analytics</span>
          </button>

          <button
            id="tab-btn-matcher"
            onClick={() => setActiveTab("matcher")}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 transition-all whitespace-nowrap cursor-pointer rounded-none border-2 ${
              activeTab === "matcher"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-transparent border-transparent text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span className="font-serif italic font-semibold">AI Grant Matcher</span>
          </button>

          <button
            id="tab-btn-drafter"
            onClick={() => setActiveTab("drafter")}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 transition-all whitespace-nowrap cursor-pointer rounded-none border-2 ${
              activeTab === "drafter"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-transparent border-transparent text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="font-serif italic font-semibold">Proposal Drafting Assistant</span>
          </button>

          <button
            id="tab-btn-prequal"
            onClick={() => setActiveTab("prequal")}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 transition-all whitespace-nowrap cursor-pointer rounded-none border-2 ${
              activeTab === "prequal"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-transparent border-transparent text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-serif italic font-semibold">Filing & Readiness Guide</span>
          </button>

        </div>

        {/* Gemini & Fallback AI API Diagnostic Section */}
        <div className="flex items-center gap-2 self-start md:self-auto" id="gemini-diagnostic-widget">
          {testStatus === "idle" && (
            <button
              onClick={handleTestKey}
              className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#003B71] text-white hover:bg-[#F27D26] px-3.5 py-1.5 transition-all border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer"
            >
              ⚡ Test AI Connection
            </button>
          )}
          {testStatus === "testing" && (
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white text-blue-700 px-3 py-1.5 border-2 border-[#1A1A1A] flex items-center gap-2 shadow-[2px_2px_0px_0px_#1A1A1A] animate-pulse">
              <span className="w-2 h-2 rounded-full bg-blue-700 animate-ping shrink-0" />
              <span>Testing connection...</span>
            </div>
          )}
          {testStatus === "success" && (
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-3 py-1.5 border-2 border-[#1A1A1A] flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#1A1A1A]">
                <span className="text-emerald-600">✓</span>
                <span>{activeProvider === "anthropic" ? "Claude Backup Active" : "Gemini Online"}</span>
              </div>
              <button
                onClick={handleTestKey}
                className="text-[10px] font-mono font-bold text-slate-500 hover:text-slate-800 underline uppercase tracking-wider px-1 cursor-pointer"
                title="Retest Connection"
              >
                Retest
              </button>
            </div>
          )}
          {testStatus === "error" && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-50 text-rose-800 px-3 py-1.5 border-2 border-rose-600 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#1A1A1A]">
                <span>⚠️</span>
                <span>Connection Error</span>
              </div>
              <div className="text-[10px] text-[#1A1A1A] font-mono max-w-[180px] truncate bg-white px-2 py-1 border border-slate-300" title={testDetails}>
                {testDetails}
              </div>
              <button
                onClick={handleTestKey}
                className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1A1A1A] text-white hover:bg-[#003B71] px-2.5 py-1.5 border-2 border-[#1A1A1A] shadow-[1px_1px_0px_0px_#1A1A1A] cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Stage */}
      <main className="flex-1 mx-4 sm:mx-8 py-6" id="primary-content-stage">
        
        {/* Banner with notice of local application purpose */}
        <div className="border-l-4 border-[#F27D26] bg-[#F0EEE6] p-5 mb-8 flex items-start gap-4 rounded-none" id="main-notice-banner">
          <Info className="w-5 h-5 text-[#F27D26] shrink-0 mt-0.5" />
          <div className="text-xs text-[#1A1A1A] leading-relaxed space-y-1">
            <span className="font-serif italic font-bold text-sm block mb-1 text-[#1A1A1A]">Editorial Note & Grant Seeker Pathway</span>
            This interactive ledger integrates official NYC adopted-budget aggregates sourced from the <span className="font-bold underline decoration-[#F27D26]">BetaNYC dataset</span>. We map these schedules directly against non-profit structures to help community groups, charities, and organizers qualify, align, and prepare successful grant proposals for NYC Council and NY State departments.
          </div>
        </div>

        {/* Dynamic transition content tab viewport */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="w-full"
            id="viewport-motion-wrapper"
          >
            {activeTab === "analytics" && <BudgetAnalytics />}
            {activeTab === "matcher" && <GrantMatcher onSelectAgencyForDraft={handleSelectAgencyForDraft} />}
            {activeTab === "drafter" && (
              <ProposalDrafter 
                prefillAgency={prefillAgency} 
                prefillOrg={prefillOrg} 
                prefillMission={prefillMission} 
              />
            )}
            {activeTab === "prequal" && <PrequalificationQuiz />}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Editorial Footer */}
      <footer className="bg-[#1A1A1A] text-[#F9F8F3] py-8 px-6 sm:px-8 mt-12 text-[10px] tracking-widest uppercase" id="app-footer">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="space-y-1.5">
            <p className="font-bold" id="footer-copyright">
              NYC.gov/Budget • Data Ref: BetaNYC-NYC-Budget-Repo
            </p>
            <p className="text-[9px] text-[#A3A3A3] normal-case tracking-normal max-w-2xl leading-relaxed" id="footer-data-attribution">
              Built using machine-readable, reconciled NYC adopted-budget files (Schedule C) provided by <a href="https://beta.nyc" target="_blank" rel="noopener noreferrer" className="underline hover:text-white font-medium">BetaNYC</a>. The Budget Agent, Grant Matcher, and Drafting Assistant are grounded in real award records queried live through BetaNYC's <a href="https://github.com/BetaNYC/New-York-City-Budget/tree/main/mcp" target="_blank" rel="noopener noreferrer" className="underline hover:text-white font-medium">NYC-Budget MCP</a> server, generated server-side using Google Gemini Flash (Anthropic Claude fallback).
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[#A3A3A3] font-mono">
            <span>FY2025-Q3 Data</span>
            <span>Terms of Audit</span>
            <span>Analysis Engine v4.0.1</span>
          </div>
        </div>
      </footer>

      {/* Floating conversational Budget Agent — available on every tab */}
      <BudgetAgent />

    </div>
  );
}
