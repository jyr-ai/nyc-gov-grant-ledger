import React, { useState, useEffect } from "react";
import { Landmark, FileText, Loader2, Copy, Check, Sparkles, AlertTriangle, BookOpen } from "lucide-react";

interface ProposalDrafterProps {
  prefillAgency: string;
  prefillOrg: string;
  prefillMission: string;
}

export default function ProposalDrafter({ prefillAgency, prefillOrg, prefillMission }: ProposalDrafterProps) {
  // Form state
  const [orgName, setOrgName] = useState("");
  const [mission, setMission] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("");
  const [programName, setProgramName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [requestedAmount, setRequestedAmount] = useState(25000);

  // Sync with prefills when they change
  useEffect(() => {
    if (prefillOrg) setOrgName(prefillOrg);
    if (prefillMission) setMission(prefillMission);
    if (prefillAgency) setSelectedAgency(prefillAgency);
  }, [prefillOrg, prefillMission, prefillAgency]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [draft, setDraft] = useState<any | null>(null);

  const handleCopy = async (text: string, sectionKey: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedSection(sectionKey);
        setTimeout(() => setCopiedSection(null), 2000);
      }
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  const handleDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !mission.trim() || !selectedAgency.trim() || !programName.trim()) {
      setError("Please fill out the core program and agency details before drafting.");
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsKey(false);
    setDraft(null);

    try {
      const response = await fetch("/api/grant/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          mission,
          selectedAgency,
          programName,
          targetAudience,
          requestedAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsKey) {
          setNeedsKey(true);
          setError(data.message || data.error);
        } else {
          setError(data.error || "Failed to generate concept draft.");
        }
        return;
      }

      setDraft(data);
    } catch (err: any) {
      console.error("Drafting error:", err);
      setError("An unexpected network error occurred while generating. Verify that your server has compiled successfully.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="proposal-drafter-section">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="drafter-layout-grid">
        
        {/* Form Column */}
        <div className="lg:col-span-5" id="drafter-form-card">
          <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] space-y-6">
            <div>
              <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">Drafting Desk</span>
              <h3 className="text-xl font-serif font-black text-[#1A1A1A] flex items-center gap-2" id="drafter-form-header">
                <FileText className="w-5 h-5 text-[#F27D26]" />
                Discretionary Proposal Drafter
              </h3>
              <p className="text-xs text-[#555] mt-1.5 leading-relaxed font-sans">
                Provide core metrics and programmatic objectives. Our server-side Gemini intelligence will generate highly structured, audit-ready grant components.
              </p>
            </div>

            <form onSubmit={handleDraft} className="space-y-4" id="drafter-form">
              <div id="drafter-org-name-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 font-mono">
                  Organization Name
                </label>
                <input
                  id="drafter-input-org"
                  type="text"
                  required
                  placeholder="e.g. Brooklyn Youth Code Guild"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A]"
                />
              </div>

              <div id="drafter-agency-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 font-mono">
                  Target NYC Agency / Funding Channel
                </label>
                <input
                  id="drafter-input-agency"
                  type="text"
                  required
                  placeholder="e.g. DYCD (Youth Discretionary)"
                  value={selectedAgency}
                  onChange={(e) => setSelectedAgency(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A]"
                />
              </div>

              <div id="drafter-program-name-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 font-mono">
                  Proposed Program Name
                </label>
                <input
                  id="drafter-input-program"
                  type="text"
                  required
                  placeholder="e.g. Flatbush Girls Who Code Club"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A]"
                />
              </div>

              <div id="drafter-audience-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 font-mono">
                  Target Audience / Participants
                </label>
                <input
                  id="drafter-input-audience"
                  type="text"
                  placeholder="e.g. High school girls in Flatbush, Brooklyn"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A]"
                />
              </div>

              <div id="drafter-amount-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 font-mono">
                  Requested Funding Amount ($)
                </label>
                <input
                  id="drafter-input-amount"
                  type="number"
                  required
                  min={1000}
                  max={250000}
                  step={1000}
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A]"
                />
              </div>

              <div id="drafter-mission-group">
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 font-mono">
                  Core Mission Summary
                </label>
                <textarea
                  id="drafter-input-mission"
                  required
                  rows={3}
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A] leading-relaxed"
                />
              </div>

              {error && (
                <div 
                  className={`p-4 rounded-none text-xs flex gap-3 border-2 ${
                    needsKey 
                      ? "bg-[#F0EEE6] border-[#F27D26] text-[#1A1A1A]" 
                      : "bg-[#F0EEE6] border-red-600 text-[#1A1A1A]"
                  }`}
                  id="drafter-form-error"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 text-[#F27D26]" />
                  <div className="leading-relaxed">
                    <span className="font-bold">{needsKey ? "Key Action Required:" : "System Error:"}</span> {error}
                  </div>
                </div>
              )}

              <button
                id="btn-submit-drafting"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#1A1A1A] hover:bg-[#F27D26] disabled:opacity-50 text-white rounded-none font-bold uppercase tracking-widest border-2 border-[#1A1A1A] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#F27D26]" />
                    <span>Compiling Narrative...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Draft Grant Proposal</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7" id="drafter-results-column">
          {loading ? (
            <div className="bg-[#F9F8F3] rounded-none border border-[#1A1A1A] p-12 flex flex-col items-center justify-center h-full min-h-[450px]" id="drafter-loading-card">
              <Loader2 className="w-10 h-10 text-[#F27D26] animate-spin mb-4" />
              <div className="text-center space-y-3">
                <span className="text-[10px] font-mono font-bold bg-[#1A1A1A] text-white px-2.5 py-0.5 uppercase tracking-widest">Processing</span>
                <h4 className="font-serif font-black text-xl text-[#1A1A1A]">Writing Compliance-Aligned Drafts</h4>
                <p className="text-xs text-[#F27D26] font-bold max-w-sm px-4 italic font-serif mx-auto">
                  Constructing Statement of Need, Performance Metrics, and OTPS Narratives...
                </p>
                <p className="text-[10px] text-[#555] max-w-xs leading-relaxed mx-auto font-mono">
                  Synthesizing NYC socio-demographic indicators and budgeting regulations (PS vs OTPS) to deliver audit-ready application components.
                </p>
              </div>
            </div>
          ) : draft ? (
            <div className="space-y-6" id="draft-results-wrapper">
              
              {/* Draft Success Banner */}
              <div className="border-4 border-[#1A1A1A] bg-[#1A1A1A] p-6 text-[#F9F8F3] flex items-center justify-between gap-4 rounded-none" id="draft-success-banner">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold bg-[#F27D26] text-white px-2 py-0.5 uppercase tracking-widest">Compiler Output</span>
                  <h4 className="text-xl font-serif font-black italic text-white" id="draft-success-title">Draft Compiled Successfully</h4>
                  <p className="text-xs text-[#E5E3DB] leading-relaxed" id="draft-success-subtitle">
                    Fitted for {selectedAgency} discretionary review. Copy segments to your clipboard.
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-[#F27D26] shrink-0 opacity-90" />
              </div>

              {/* Sections Stack */}
              <div className="space-y-6" id="draft-sections-stack">
                
                {/* 1. Statement of Need */}
                <div className="bg-[#F9F8F3] rounded-none border border-[#1A1A1A]" id="draft-section-need">
                  <div className="p-4 border-b border-[#1A1A1A] bg-[#F0EEE6] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Section 1: Statement of Need
                    </span>
                    <button
                      id="btn-copy-need"
                      onClick={() => handleCopy(draft.statementOfNeed, "need")}
                      className="text-xs text-[#F27D26] hover:underline font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                    >
                      {copiedSection === "need" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Section</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-6 text-sm text-[#1A1A1A] leading-relaxed font-serif whitespace-pre-line space-y-3" id="draft-need-content">
                    {draft.statementOfNeed}
                  </div>
                </div>

                {/* 2. Program Design */}
                <div className="bg-[#F9F8F3] rounded-none border border-[#1A1A1A]" id="draft-section-design">
                  <div className="p-4 border-b border-[#1A1A1A] bg-[#F0EEE6] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Section 2: Program Design & Activities
                    </span>
                    <button
                      id="btn-copy-design"
                      onClick={() => handleCopy(draft.programDesign, "design")}
                      className="text-xs text-[#F27D26] hover:underline font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                    >
                      {copiedSection === "design" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Section</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-6 text-sm text-[#1A1A1A] leading-relaxed font-serif whitespace-pre-line space-y-3" id="draft-design-content">
                    {draft.programDesign}
                  </div>
                </div>

                {/* 3. Performance Metrics */}
                <div className="bg-[#F9F8F3] rounded-none border border-[#1A1A1A]" id="draft-section-metrics">
                  <div className="p-4 border-b border-[#1A1A1A] bg-[#F0EEE6] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Section 3: Performance Metrics & Compliance
                    </span>
                    <button
                      id="btn-copy-metrics"
                      onClick={() => handleCopy(draft.performanceMetrics, "metrics")}
                      className="text-xs text-[#F27D26] hover:underline font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                    >
                      {copiedSection === "metrics" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Section</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-6 text-sm text-[#1A1A1A] leading-relaxed font-serif whitespace-pre-line space-y-3" id="draft-metrics-content">
                    {draft.performanceMetrics}
                  </div>
                </div>

                {/* 4. Budget Narrative */}
                <div className="bg-[#F9F8F3] rounded-none border border-[#1A1A1A]" id="draft-section-budget">
                  <div className="p-4 border-b border-[#1A1A1A] bg-[#F0EEE6] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Section 4: PS & OTPS Budget Narrative
                    </span>
                    <button
                      id="btn-copy-budget"
                      onClick={() => handleCopy(draft.budgetNarrative, "budget")}
                      className="text-xs text-[#F27D26] hover:underline font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                    >
                      {copiedSection === "budget" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Section</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-6 text-sm text-[#1A1A1A] leading-relaxed font-serif whitespace-pre-line space-y-3" id="draft-budget-content">
                    {draft.budgetNarrative}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-[#F9F8F3] rounded-none border border-dashed border-[#1A1A1A] p-12 flex flex-col items-center justify-center h-full min-h-[450px]" id="drafter-empty-card">
              <FileText className="w-12 h-12 text-[#1A1A1A]/30 mb-3" />
              <div className="text-center space-y-2 max-w-sm">
                <h4 className="font-serif font-black text-lg text-[#1A1A1A]">No Active Document Draft</h4>
                <p className="text-xs text-[#555] leading-relaxed">
                  Fill out the parameters on the left and hit "Draft Grant Proposal". Or, trigger a pre-filled draft directly from any agency recommendation inside the <span className="font-bold underline">AI Grant Matcher</span>.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
