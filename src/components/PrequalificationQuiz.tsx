import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, BookOpen, ChevronDown, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";

export default function PrequalificationQuiz() {
  // Quiz State
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  
  // Accordion State
  const [activeAccordion, setActiveAccordion] = useState<string | null>("passport");

  const quizQuestions = [
    {
      id: 1,
      question: "Are you registered as an active 501(c)(3) tax-exempt non-profit organization?",
      description: "Discretionary funding is restricted to IRS-registered 501(c)(3) entities or organizations utilizing an approved 501(c)(3) fiscal sponsor."
    },
    {
      id: 2,
      question: "Do you have a Board of Directors containing at least 3 unrelated members?",
      description: "Both NYC and NYS regulations mandate an active, independent governing board. Related members (e.g. spouses, family) cannot make up the majority."
    },
    {
      id: 3,
      question: "Are you registered and pre-cleared in the NYC PASSPort digital portal?",
      description: "NYC PASSPort (Procurement and Sourcing Solutions Portal) is mandatory. Without an approved profile and disclosures, you cannot contract with the City."
    },
    {
      id: 4,
      question: "Have you filed your annual NYS Charities Bureau registration (CHAR500) for the last fiscal cycle?",
      description: "New York State requires all charities operating or fundraising in NYS to register annually. Missing CHAR500 filings will block any state or city awards."
    },
    {
      id: 5,
      question: "Are you registered and prequalified in the NYS SFS (Statewide Financial System)?",
      description: "For NY State Department grants (like NYSCA or Office of Mental Health), prequalification in SFS is required BEFORE the application deadline."
    },
    {
      id: 6,
      question: "Do you maintain a physical office, facility, or active programmatic footprint in New York State?",
      description: "Funds must be spent exclusively on services benefiting residents of the local communities and boroughs specified in the budget lines."
    }
  ];

  const handleAnswer = (questionId: number, value: boolean) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const calculateResults = () => {
    const totalQuestions = quizQuestions.length;
    const yesCount = Object.values(answers).filter(val => val === true).length;
    const answeredCount = Object.keys(answers).length;

    return {
      score: Math.round((yesCount / totalQuestions) * 100),
      isFullyReady: yesCount === totalQuestions,
      incomplete: answeredCount < totalQuestions,
      yesCount,
      totalQuestions
    };
  };

  const results = calculateResults();

  const toggleAccordion = (id: string) => {
    if (activeAccordion === id) {
      setActiveAccordion(null);
    } else {
      setActiveAccordion(id);
    }
  };

  return (
    <div className="space-y-8" id="prequalification-section">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="prequal-layout-grid">
        
        {/* Quiz Column */}
        <div className="lg:col-span-6 space-y-6" id="readiness-quiz-card">
          <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] space-y-4">
            <div>
              <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">Diagnostic Desk</span>
              <h3 className="text-xl font-serif font-black text-[#1A1A1A] flex items-center gap-2" id="quiz-header">
                <ShieldCheck className="w-5 h-5 text-[#F27D26]" />
                NYC/NYS Grant Readiness Diagnostic
              </h3>
              <p className="text-xs text-[#555] leading-relaxed font-sans mt-1.5">
                Take our quick compliance check. Government grants require strict administrative rigor. Failing any of these steps will result in immediate disqualification or administrative holds.
              </p>
            </div>

            <div className="space-y-4" id="quiz-questions-list">
              {quizQuestions.map((q) => {
                const answer = answers[q.id];
                return (
                  <div key={q.id} className="p-4 rounded-none bg-[#F0EEE6]/70 border border-[#1A1A1A]/10 space-y-2" id={`q-item-${q.id}`}>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-xs font-serif font-bold text-[#1A1A1A] leading-relaxed">
                        {q.id}. {q.question}
                      </span>
                      <div className="flex gap-1.5 shrink-0" id={`q-buttons-${q.id}`}>
                        <button
                          type="button"
                          id={`btn-q-${q.id}-yes`}
                          onClick={() => handleAnswer(q.id, true)}
                          className={`text-[10.5px] px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            answer === true
                              ? "bg-[#1A1A1A] border-[#1A1A1A] text-[#F9F8F3]"
                              : "bg-[#F9F8F3] border border-[#1A1A1A]/30 text-[#1A1A1A] hover:border-[#1A1A1A]"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          id={`btn-q-${q.id}-no`}
                          onClick={() => handleAnswer(q.id, false)}
                          className={`text-[10.5px] px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            answer === false
                              ? "bg-red-700 border-red-700 text-white"
                              : "bg-[#F9F8F3] border border-[#1A1A1A]/30 text-[#1A1A1A] hover:border-[#1A1A1A]"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-[#555] leading-relaxed" id={`q-desc-${q.id}`}>
                      {q.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2" id="quiz-submit-container">
              <button
                id="btn-submit-readiness"
                onClick={() => setSubmitted(true)}
                disabled={results.incomplete}
                className="w-full py-3 px-4 bg-[#1A1A1A] hover:bg-[#F27D26] disabled:opacity-40 text-white rounded-none font-bold uppercase tracking-widest border-2 border-[#1A1A1A] transition-all cursor-pointer text-xs"
              >
                {results.incomplete ? "Answer All Questions to See Diagnostic" : "Run Diagnostic Analysis"}
              </button>
            </div>
          </div>

          {/* Quiz Results Card */}
          {submitted && !results.incomplete && (
            <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] space-y-4" id="quiz-results-card">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E3DB]" id="quiz-results-header">
                <h4 className="font-serif font-black text-base text-[#1A1A1A]">Readiness Assessment</h4>
                <span className={`px-2.5 py-1 rounded-none text-xs font-mono font-bold uppercase tracking-wider ${
                  results.score === 100 
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300" 
                    : results.score >= 60 
                    ? "bg-[#F0EEE6] text-[#F27D26] border border-[#F27D26]/40" 
                    : "bg-red-50 text-red-800 border border-red-300"
                }`} id="quiz-score-badge">
                  {results.score}% Compliant
                </span>
              </div>

              {results.isFullyReady ? (
                <div className="p-4 bg-[#F0EEE6] rounded-none border-l-4 border-emerald-600 flex gap-3 text-[#1A1A1A] text-xs leading-relaxed" id="results-compliant-box">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-serif font-black block text-[#1A1A1A] mb-1">Status: Government Ready</span> Your organization meets the baseline technical requirements for both NYC and NYS applications. You can proceed with confidence to register and submit proposals for active discretionary and agency solicitations.
                  </div>
                </div>
              ) : (
                <div className="space-y-4" id="results-noncompliant-box">
                  <div className="p-4 bg-[#F0EEE6] rounded-none border-l-4 border-[#F27D26] flex gap-3 text-[#1A1A1A] text-xs leading-relaxed" id="results-warning-box">
                    <AlertCircle className="w-5 h-5 text-[#F27D26] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-serif font-black block text-[#1A1A1A] mb-1">Action Items Detected</span> You missed one or more compliance checkpoints. You are eligible to submit application drafts, but you <span className="font-bold underline">cannot receive or execute any contract funds</span> until you resolve these compliance milestones.
                    </div>
                  </div>

                  <div className="space-y-2.5 pl-2 text-xs text-[#1A1A1A] leading-relaxed" id="remedies-list">
                    <span className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[9px] block mb-1">To-Do Items to Achieve Compliance:</span>
                    {answers[1] === false && (
                      <div className="flex gap-2 items-start" id="remedy-1">
                        <span className="text-red-600 font-mono font-bold">■</span>
                        <span>Incorporate as a non-profit or find a formal 501(c)(3) fiscal sponsor to house your projects.</span>
                      </div>
                    )}
                    {answers[2] === false && (
                      <div className="flex gap-2 items-start" id="remedy-2">
                        <span className="text-red-600 font-mono font-bold">■</span>
                        <span>Recruit independent board members. Under the NYS Not-for-Profit Corporation Law, related members should not vote on self-interested items.</span>
                      </div>
                    )}
                    {answers[3] === false && (
                      <div className="flex gap-2 items-start" id="remedy-3">
                        <span className="text-[#F27D26] font-mono font-bold">■</span>
                        <span>Create a profile in <span className="font-bold underline">NYC PASSPort</span> immediately. Complete your digital disclosures and associate with your EIN.</span>
                      </div>
                    )}
                    {answers[4] === false && (
                      <div className="flex gap-2 items-start" id="remedy-4">
                        <span className="text-[#F27D26] font-mono font-bold">■</span>
                        <span>Register with the NYS Attorney General Charities Bureau and submit your CHAR500 tax filing online.</span>
                      </div>
                    )}
                    {answers[5] === false && (
                      <div className="flex gap-2 items-start" id="remedy-5">
                        <span className="text-[#F27D26] font-mono font-bold">■</span>
                        <span>Create your <span className="font-bold underline">NYS Statewide Financial System (SFS)</span> portal account and complete the online Prequalification document.</span>
                      </div>
                    )}
                    {answers[6] === false && (
                      <div className="flex gap-2 items-start" id="remedy-6">
                        <span className="text-[#F27D26] font-mono font-bold">■</span>
                        <span>Secure or outline a clear localized programmatic presence in NY State to qualify as an active provider.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portal Information Column */}
        <div className="lg:col-span-6 space-y-6" id="portals-guide-card">
          <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] space-y-4">
            <div>
              <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">Framework Manual</span>
              <h3 className="text-xl font-serif font-black text-[#1A1A1A] flex items-center gap-2" id="portals-header">
                <BookOpen className="w-5 h-5 text-[#F27D26]" />
                Step-by-Step Portal Prequalification Manual
              </h3>
              <p className="text-xs text-[#555] leading-relaxed font-sans mt-1.5">
                Applying for government grants in NY requires registering in distinct digital hubs. Below is the official step-by-step framework to navigate them successfully.
              </p>
            </div>

            {/* Expandable Accordions */}
            <div className="space-y-3.5" id="portals-accordion">
              
              {/* NYC PASSPort Accordion */}
              <div className="border border-[#1A1A1A] rounded-none overflow-hidden" id="accordion-passport">
                <button
                  id="btn-accordion-passport"
                  onClick={() => toggleAccordion("passport")}
                  className={`w-full p-4 text-left font-serif font-black text-sm flex justify-between items-center transition-colors cursor-pointer ${
                    activeAccordion === "passport" ? "bg-[#F0EEE6] text-[#1A1A1A]" : "bg-transparent text-[#1A1A1A] hover:bg-[#F0EEE6]/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-none bg-[#F27D26]" />
                    1. NYC PASSPort Portal (Mandatory for City Funding)
                  </span>
                  {activeAccordion === "passport" ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {activeAccordion === "passport" && (
                  <div className="p-5 bg-[#F9F8F3] border-t border-[#1A1A1A] text-xs text-[#444] leading-relaxed space-y-3" id="passport-desc">
                    <p>
                      <span className="font-serif font-bold text-[#1A1A1A]">What it is:</span> PASSPort (Procurement and Sourcing Solutions Portal) is NYC's central digital procurement system. All non-profits receiving Council discretionary grants or agency contracts must complete registration here.
                    </p>
                    <p className="font-serif font-bold text-[#1A1A1A]">Essential Milestones:</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-[11px]">
                      <li><span className="font-semibold text-[#1A1A1A]">Account Creation:</span> Create an NYC.ID account and register your organization's legal name, EIN, and contact info.</li>
                      <li><span className="font-semibold text-[#1A1A1A]">The HHS Accelerator Vault:</span> Upload organizational essentials (IRS Determination Letter, Bylaws, CHAR500, audited financial statements or 990s). This keeps files ready for all proposals.</li>
                      <li><span className="font-semibold text-[#1A1A1A]">Complete Disclosures:</span> Principal officers and board members must complete the required digital disclosures to verify administrative trust.</li>
                    </ul>
                    <div className="p-4 bg-[#F0EEE6] border-l-2 border-[#F27D26] text-[#1A1A1A] rounded-none text-[11px]" id="passport-tip">
                      <span className="font-bold">Pro-Tip:</span> The discretionary application opens every January on the <a href="https://council.nyc.gov/discretionary/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#F27D26]">NYC Council Discretionary Portal</a>. You must file this separate form in addition to registering in PASSPort!
                    </div>
                  </div>
                )}
              </div>

              {/* NYS SFS Accordion */}
              <div className="border border-[#1A1A1A] rounded-none overflow-hidden" id="accordion-sfs">
                <button
                  id="btn-accordion-sfs"
                  onClick={() => toggleAccordion("sfs")}
                  className={`w-full p-4 text-left font-serif font-black text-sm flex justify-between items-center transition-colors cursor-pointer ${
                    activeAccordion === "sfs" ? "bg-[#F0EEE6] text-[#1A1A1A]" : "bg-transparent text-[#1A1A1A] hover:bg-[#F0EEE6]/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-none bg-[#1A1A1A]" />
                    2. NYS SFS Portal (Mandatory for State Grants)
                  </span>
                  {activeAccordion === "sfs" ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {activeAccordion === "sfs" && (
                  <div className="p-4 bg-[#F9F8F3] border-t border-[#1A1A1A] text-xs text-[#444] leading-relaxed space-y-3" id="sfs-desc">
                    <p>
                      <span className="font-serif font-bold text-[#1A1A1A]">What it is:</span> The Statewide Financial System (SFS) replaced the old NYS Grants Gateway. It handles prequalification, bidding, and financial disbursements for all NY State agencies (e.g. Department of State, State Council on the Arts).
                    </p>
                    <p className="font-serif font-bold text-[#1A1A1A]">Milestones to Prequalify:</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-[11px]">
                      <li><span className="font-semibold text-[#1A1A1A]">Get an SFS Vendor ID:</span> Submit a substitute W-9 form to secure your formal 10-digit Vendor ID.</li>
                      <li><span className="font-semibold text-[#1A1A1A]">Submit the Prequalification Document:</span> Upload standard board lists, certificate of incorporation, by-laws, and recent IRS submissions.</li>
                      <li><span className="font-semibold text-[#1A1A1A]">Annual Document Vault Audit:</span> Submit fresh financial audits or IRS Form 990 annually to keep your status marked as <span className="text-emerald-700 font-bold">Prequalified</span>.</li>
                    </ul>
                    <div className="p-4 bg-[#F0EEE6] border-l-2 border-[#F27D26] text-[#1A1A1A] rounded-none text-[11px]" id="sfs-tip">
                      <span className="font-bold">Crucial Note:</span> State grants will instantly filter out any applicant not in "Prequalified" status inside SFS at the time of the proposal deadline. Do not wait for an RFP to launch to complete this!
                    </div>
                  </div>
                )}
              </div>

              {/* NYS Charities Registration Accordion */}
              <div className="border border-[#1A1A1A] rounded-none overflow-hidden" id="accordion-charities">
                <button
                  id="btn-accordion-charities"
                  onClick={() => toggleAccordion("charities")}
                  className={`w-full p-4 text-left font-serif font-black text-sm flex justify-between items-center transition-colors cursor-pointer ${
                    activeAccordion === "charities" ? "bg-[#F0EEE6] text-[#1A1A1A]" : "bg-transparent text-[#1A1A1A] hover:bg-[#F0EEE6]/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-none bg-[#F27D26]" />
                    3. NYS Charities Bureau (CHAR500 Filing)
                  </span>
                  {activeAccordion === "charities" ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {activeAccordion === "charities" && (
                  <div className="p-4 bg-[#F9F8F3] border-t border-[#1A1A1A] text-xs text-[#444] leading-relaxed space-y-3" id="charities-desc">
                    <p>
                      <span className="font-serif font-bold text-[#1A1A1A]">What it is:</span> The Charities Bureau of the NYS Attorney General's Office regulates all organizations conducting charitable activity or soliciting donations inside New York State.
                    </p>
                    <p className="font-serif font-bold text-[#1A1A1A]">Requirements & Filing Rules:</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-[11px]">
                      <li><span className="font-semibold text-[#1A1A1A]">Charities Registration:</span> File Form CHAR410 to secure your registration code.</li>
                      <li><span className="font-semibold text-[#1A1A1A]">CHAR500 Annual Filing:</span> Non-profits must file CHAR500 annually (within 4.5 months of fiscal year-end, concurrent with federal 990 filing).</li>
                      <li><span className="font-semibold text-[#1A1A1A]">Audited Financial Statements:</span> Under current thresholds, organizations with gross revenues above $1,000,000 must upload formal CPA Audits.</li>
                    </ul>
                    <div className="p-4 bg-[#F0EEE6] border-l-2 border-[#F27D26] text-[#1A1A1A] rounded-none text-[11px]" id="charities-tip">
                      <span className="font-bold">Public Registry Audit:</span> NYC PASSPort checks your Charities Registry Status automatically via live API feeds. If marked as "Delinquent" or "Suspended" by NY State, your city contract will be blocked!
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
