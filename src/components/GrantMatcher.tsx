import React, { useState } from "react";
import { Sparkles, Loader2, ArrowRight, CheckCircle2, AlertCircle, Landmark, Compass, HelpCircle, Copy, Check, ServerCrash } from "lucide-react";
import { fetchApi, formatReport, type ApiErrorReport } from "../lib/apiError";

interface GrantMatcherProps {
  onSelectAgencyForDraft: (agency: string, orgName: string, mission: string) => void;
}

export default function GrantMatcher({ onSelectAgencyForDraft }: GrantMatcherProps) {
  // Form State
  const [orgName, setOrgName] = useState("");
  const [mission, setMission] = useState("");
  const [targetPopulation, setTargetPopulation] = useState("General Public");
  const [targetBoroughs, setTargetBoroughs] = useState<string[]>(["Brooklyn"]);
  const [budgetSize, setBudgetSize] = useState("Under $100k");

  // API State
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [errorReport, setErrorReport] = useState<ApiErrorReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const populations = [
    "Youth / Children",
    "Seniors / Older Adults",
    "Low-Income Families",
    "Homeless Individuals",
    "Immigrants / Asylum Seekers",
    "People with Disabilities",
    "Veterans",
    "General Public"
  ];

  const boroughs = ["Brooklyn", "Bronx", "Manhattan", "Queens", "Staten Island", "Citywide"];

  const budgetSizes = [
    "Under $100k",
    "$100k - $500k",
    "$500k - $1.5M",
    "Over $1.5M"
  ];

  const toggleBorough = (b: string) => {
    if (targetBoroughs.includes(b)) {
      if (targetBoroughs.length > 1) {
        setTargetBoroughs(targetBoroughs.filter(item => item !== b));
      }
    } else {
      setTargetBoroughs([...targetBoroughs, b]);
    }
  };

  const runLoaderSimulation = () => {
    setLoadingStep(0);
    const steps = [
      "Analyzing mission and focus areas...",
      "Matching against Schedule C discretionary budget initiatives...",
      "Retrieving average agency grant size trends...",
      "Consulting PASSPort prequalification requirements...",
      "Structuring agency recommendations..."
    ];
    
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setLoadingStep(current);
      } else {
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  };

  const handleMatch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!orgName.trim() || !mission.trim()) {
      setError("Please provide both an Organization Name and a clear Mission Statement.");
      setErrorDetails(null);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setNeedsKey(false);
    setErrorReport(null);
    setResult(null);

    const cleanupInterval = runLoaderSimulation();

    const { ok, data, report } = await fetchApi("/api/grant/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgName,
        mission,
        targetPopulation,
        targetBoroughs,
        budgetSize
      })
    });

    cleanupInterval();
    setLoading(false);

    if (ok) {
      setResult(data);
      return;
    }

    // Failure: surface the real, structured error.
    console.error("Match failed:", report);
    if (data?.needsKey) {
      setNeedsKey(true);
      setError(data.message || data.error);
      return;
    }
    setErrorReport(report);
  };

  const handleCopyReport = async () => {
    if (!errorReport) return;
    try {
      await navigator.clipboard.writeText(formatReport(errorReport));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const loadingMessages = [
    "Analyzing mission and focus areas...",
    "Matching against Schedule C discretionary budget initiatives...",
    "Retrieving average agency grant size trends...",
    "Consulting PASSPort prequalification requirements...",
    "Structuring agency recommendations..."
  ];

  return (
    <div className="space-y-8" id="grant-matcher-section">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="grant-matcher-layout-grid">
        
        {/* Form Column */}
        <div className="lg:col-span-5" id="matcher-form-card">
          <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] space-y-6">
            <div>
              <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">Analysis Hub</span>
              <h3 className="text-xl font-serif font-black text-[#1A1A1A] flex items-center gap-2" id="matcher-form-header">
                <Compass className="w-5 h-5 text-[#F27D26]" />
                AI Grant Alignment Navigator
              </h3>
              <p className="text-xs text-[#555] mt-1.5 leading-relaxed font-sans">
                Describe your non-profit organization and your goals. Our server-side intelligence will parse current Schedule C discretionary funding lines to identify your strongest targets.
              </p>
            </div>

            <form onSubmit={handleMatch} className="space-y-4" id="matcher-form">
              <div id="form-org-name-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 font-mono">
                  Organization Name
                </label>
                <input
                  id="input-org-name"
                  type="text"
                  required
                  placeholder="e.g. Brooklyn Youth Code Guild"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A]"
                />
              </div>

              <div id="form-mission-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 font-mono">
                  Mission Statement & Core Activities
                </label>
                <textarea
                  id="input-mission"
                  required
                  rows={4}
                  placeholder="Describe your goals, e.g. We provide free coding workshops and STEM tutoring to low-income high school students in Flatbush. We help them prepare for software internships and build digital portfolios."
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A] leading-relaxed"
                />
              </div>

              <div id="form-population-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 font-mono">
                  Primary Target Population
                </label>
                <select
                  id="input-population"
                  value={targetPopulation}
                  onChange={(e) => setTargetPopulation(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A]"
                >
                  {populations.map((pop, i) => (
                    <option key={i} value={pop}>{pop}</option>
                  ))}
                </select>
              </div>

              <div id="form-boroughs-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-2 font-mono">
                  Target Boroughs
                </label>
                <div className="flex flex-wrap gap-1.5" id="borough-buttons">
                  {boroughs.map((b, i) => {
                    const isSelected = targetBoroughs.includes(b);
                    return (
                      <button
                        key={i}
                        type="button"
                        id={`btn-borough-${b.toLowerCase().replace(/\s/g, "-")}`}
                        onClick={() => toggleBorough(b)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-none border-2 font-mono font-bold tracking-wider uppercase transition-all ${
                          isSelected
                            ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
                            : "bg-[#F9F8F3] border-[#1A1A1A]/30 text-[#1A1A1A] hover:border-[#1A1A1A]"
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div id="form-budget-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 font-mono">
                  Operating Budget Size (Annual)
                </label>
                <select
                  id="input-budget-size"
                  value={budgetSize}
                  onChange={(e) => setBudgetSize(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A]"
                >
                  {budgetSizes.map((sz, i) => (
                    <option key={i} value={sz}>{sz}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div 
                  className={`p-4 rounded-none text-xs flex flex-col gap-2 border-2 ${
                    needsKey 
                      ? "bg-[#F0EEE6] border-[#F27D26] text-[#1A1A1A]" 
                      : "bg-[#F0EEE6] border-red-600 text-[#1A1A1A]"
                  }`}
                  id="matcher-form-error"
                >
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 text-[#F27D26]" />
                    <div className="leading-relaxed">
                      <span className="font-bold">{needsKey ? "Key Action Required:" : "System Error:"}</span> {error}
                    </div>
                  </div>
                  {errorDetails && (
                    <div className="mt-2 pl-8 text-[11px] font-mono text-rose-800 bg-white/55 p-2 border border-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text" id="matcher-error-details">
                      <div className="font-bold uppercase tracking-wider text-[9px] mb-1 text-rose-900">Backend Debug Trace:</div>
                      {errorDetails}
                    </div>
                  )}
                </div>
              )}

              <button
                id="btn-submit-matching"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#1A1A1A] hover:bg-[#F27D26] disabled:opacity-50 text-white rounded-none font-bold uppercase tracking-widest border-2 border-[#1A1A1A] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#F27D26]" />
                    <span>Executing Model...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Alignment Match</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7" id="matcher-results-column">
          {loading ? (
            <div className="bg-[#F9F8F3] rounded-none border border-[#1A1A1A] p-12 flex flex-col items-center justify-center h-full min-h-[450px]" id="matcher-loading-card">
              <Loader2 className="w-10 h-10 text-[#F27D26] animate-spin mb-4" />
              <div className="text-center space-y-3">
                <span className="text-[10px] font-mono font-bold bg-[#1A1A1A] text-white px-2.5 py-0.5 uppercase tracking-widest">Processing</span>
                <h4 className="font-serif font-black text-xl text-[#1A1A1A]">Running AI Budget Analysis</h4>
                <p className="text-xs text-[#F27D26] font-bold max-w-sm px-4 italic font-serif">
                  {loadingMessages[loadingStep]}
                </p>
                <p className="text-[10px] text-[#555] max-w-xs leading-relaxed mx-auto font-mono">
                  Comparing goals with direct agency allocations, contract thresholds, and Council schedules.
                </p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6" id="matcher-results-wrapper">
              
              {/* Relevance Score Banner */}
              <div className="border-4 border-[#1A1A1A] bg-[#1A1A1A] p-6 text-[#F9F8F3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-none" id="relevance-banner">
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-bold bg-[#F27D26] text-white px-2 py-0.5 uppercase tracking-widest">Alignment Dispatch</span>
                  <h4 className="text-2xl font-serif font-black italic text-white" id="result-org-title">{result.relevanceScore}% Grant Alignment Rating</h4>
                  <p className="text-xs text-[#E5E3DB] leading-relaxed max-w-md" id="result-summary">
                    {result.analysisSummary}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center bg-transparent border-2 border-[#F9F8F3] px-5 py-3 rounded-none shrink-0" id="result-gauge">
                  <span className="text-[9px] font-mono font-bold text-[#E5E3DB] uppercase tracking-wider mb-1">Index</span>
                  <span className="text-3xl font-serif font-black text-[#F27D26]">{result.relevanceScore}</span>
                </div>
              </div>

              {/* Recommended Agencies */}
              <div className="space-y-4" id="recommended-agencies-container">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A]" id="recommended-agencies-header">
                  RECOMMENDED DISCRETIONARY CHANNELS
                </h3>
                
                <div className="grid grid-cols-1 gap-4" id="agencies-cards-grid">
                  {result.recommendedAgencies?.map((item: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="bg-[#F9F8F3] p-5 rounded-none border border-[#1A1A1A] flex flex-col justify-between hover:border-[#F27D26] transition-colors relative"
                      id={`agency-card-${item.agency.toLowerCase()}`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3 pb-2 border-b border-[#E5E3DB] flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 font-mono font-bold text-[9px] bg-[#1A1A1A] text-white">
                              {item.agency}
                            </span>
                            <span className="font-serif font-black text-[#1A1A1A] text-sm">{item.name}</span>
                          </div>
                          <span className="text-xs font-bold text-[#F27D26] font-mono">
                            Est: {item.estimatedGrantRange}
                          </span>
                        </div>
                        <p className="text-xs text-[#333] leading-relaxed mb-4" id={`agency-rationale-${idx}`}>
                          <span className="font-serif font-bold italic text-slate-900">Alignment Rationale:</span> {item.rationale}
                        </p>
                        
                        <div className="space-y-2 mb-4" id={`agency-budget-lines-${idx}`}>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider font-mono">Priority Budget Initiatives:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.budgetLines?.map((line: string, lIdx: number) => (
                              <span key={lIdx} className="bg-[#F0EEE6] border border-[#1A1A1A]/20 text-[10px] px-2 py-0.5 rounded-none font-mono text-[#1A1A1A]">
                                {line}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#E5E3DB] pt-3 flex justify-end">
                        <button
                          id={`btn-draft-proposal-${item.agency.toLowerCase()}`}
                          onClick={() => onSelectAgencyForDraft(item.agency, orgName, mission)}
                          className="flex items-center gap-1.5 text-xs text-[#F27D26] hover:underline font-mono font-bold uppercase tracking-wider cursor-pointer"
                        >
                          <span>Draft Proposal with AI</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* State Opportunities */}
              <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] space-y-4" id="nys-opportunities-card">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2" id="state-opps-header">
                  <Landmark className="w-4 h-4 text-[#F27D26]" />
                  State-Level Grant Tracks
                </h3>
                <div className="divide-y divide-[#E5E3DB]" id="nys-opportunities-list">
                  {result.nysOpportunities?.map((item: any, idx: number) => (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0" id={`nys-opp-item-${idx}`}>
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <span className="font-serif font-black text-sm text-[#1A1A1A]">{item.program}</span>
                        <span className="text-[9px] px-2 py-0.5 font-mono font-bold rounded-none bg-[#1A1A1A] text-white shrink-0">
                          {item.department}
                        </span>
                      </div>
                      <p className="text-xs text-[#555] leading-relaxed mb-3" id={`nys-opp-desc-${idx}`}>
                        {item.description}
                      </p>
                      {item.prequalificationRequired && (
                        <div className="inline-flex items-center gap-1 bg-[#F0EEE6] border border-[#F27D26] text-[#F27D26] text-[9.5px] px-2.5 py-0.5 rounded-none font-bold uppercase tracking-wider font-mono">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          NYS SFS Prequalification Required
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps / Checklist */}
              <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] space-y-4" id="roadmap-card">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A]" id="roadmap-header">
                  Filing & Prequalification Steps
                </h3>
                <div className="grid grid-cols-1 gap-3.5" id="roadmap-steps-list">
                  {result.applicationChecklist?.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 bg-[#F0EEE6]/50 p-4 rounded-none border border-[#1A1A1A]/10" id={`checklist-item-${idx}`}>
                      <div className="w-6 h-6 rounded-none bg-[#1A1A1A] text-[#F9F8F3] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h4 className="font-serif font-black text-sm text-[#1A1A1A]">{item.step}</h4>
                          <span className="text-[9px] uppercase font-mono font-bold text-slate-500">
                            Portal: {item.portal}
                          </span>
                        </div>
                        <p className="text-xs text-[#555] leading-relaxed" id={`checklist-item-desc-${idx}`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority alignment suggestions */}
              <div className="border-l-4 border-[#F27D26] bg-[#F0EEE6] p-5 rounded-none space-y-3" id="alignment-suggestions-card">
                <h4 className="text-xs uppercase font-extrabold text-[#1A1A1A] tracking-wider font-mono flex items-center gap-1.5" id="suggestions-header">
                  <Compass className="w-4 h-4 text-[#F27D26]" />
                  STRATEGIC PITCH & FRAMING STRATEGY
                </h4>
                <ul className="space-y-2.5 text-xs text-[#1A1A1A] leading-relaxed" id="suggestions-list">
                  {result.priorityAlignmentSuggestions?.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start" id={`suggestion-item-${idx}`}>
                      <span className="text-[#F27D26] font-bold font-mono">■</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ) : errorReport ? (
            <div className="bg-[#F9F8F3] rounded-none border-2 border-red-600 shadow-[4px_4px_0px_0px_#dc2626] min-h-[450px]" id="matcher-error-report">
              {/* Report header */}
              <div className="bg-red-600 text-white px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ServerCrash className="w-5 h-5 shrink-0" />
                  <span className="font-mono font-bold uppercase tracking-widest text-[11px]">AI Service Error Report</span>
                </div>
                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/15 hover:bg-white/25 px-2.5 py-1 border border-white/40 transition-colors cursor-pointer"
                  title="Copy full report to clipboard"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy report"}
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Diagnosis */}
                <div>
                  <div className="text-lg font-serif font-black text-[#1A1A1A]">{errorReport.title}</div>
                  <p className="text-xs text-[#333] leading-relaxed mt-1">{errorReport.explanation}</p>
                </div>

                {/* Facts grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-[#F0EEE6] border border-[#1A1A1A]/15 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-wider text-[#777]">HTTP Status</div>
                    <div className="font-bold text-[#1A1A1A]">
                      {errorReport.httpStatus === 0 ? "No response" : `${errorReport.httpStatus} ${errorReport.httpStatusText}`}
                    </div>
                  </div>
                  <div className="bg-[#F0EEE6] border border-[#1A1A1A]/15 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-wider text-[#777]">Duration</div>
                    <div className="font-bold text-[#1A1A1A]">{errorReport.durationMs} ms</div>
                  </div>
                  <div className="bg-[#F0EEE6] border border-[#1A1A1A]/15 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-wider text-[#777]">Endpoint</div>
                    <div className="font-bold text-[#1A1A1A] break-all">{errorReport.endpoint}</div>
                  </div>
                  <div className="bg-[#F0EEE6] border border-[#1A1A1A]/15 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-wider text-[#777]">Content-Type</div>
                    <div className="font-bold text-[#1A1A1A] break-all">{errorReport.contentType || "(none)"}</div>
                  </div>
                </div>

                {/* Server-provided message, when present */}
                {(errorReport.serverMessage || errorReport.serverDetails) && (
                  <div className="border-l-4 border-[#F27D26] bg-[#F0EEE6] px-4 py-2.5">
                    <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-[#777] mb-1">Server message</div>
                    {errorReport.serverMessage && <div className="text-xs text-[#1A1A1A] font-medium">{errorReport.serverMessage}</div>}
                    {errorReport.serverDetails && <div className="text-[11px] text-[#555] mt-1 font-mono break-words">{errorReport.serverDetails}</div>}
                  </div>
                )}

                {/* Raw response body — the actual bytes from the server */}
                <div>
                  <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-[#777] mb-1">Raw server response</div>
                  <pre className="text-[10px] leading-relaxed bg-[#1A1A1A] text-[#E5E3DB] p-3 overflow-auto max-h-52 whitespace-pre-wrap break-words font-mono border border-[#1A1A1A]">
{errorReport.rawBody || "(empty response body)"}
                  </pre>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleMatch as any}
                    className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1A1A1A] text-white hover:bg-[#003B71] px-3 py-1.5 border-2 border-[#1A1A1A] transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                  <span className="text-[10px] text-[#777] font-mono">Tip: open <span className="font-bold">/api/debug</span> on the deployment for a live key + provider check.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F9F8F3] rounded-none border border-dashed border-[#1A1A1A] p-12 flex flex-col items-center justify-center h-full min-h-[450px]" id="matcher-empty-card">
              <Compass className="w-12 h-12 text-[#1A1A1A]/30 mb-3" />
              <div className="text-center space-y-2 max-w-sm">
                <h4 className="font-serif font-black text-lg text-[#1A1A1A]">No Active Alignment Record</h4>
                <p className="text-xs text-[#555] leading-relaxed">
                  Submit organization details on the left. Our server-side Gemini intelligence will cross-examine current NYC agency structures and output custom opportunities.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
