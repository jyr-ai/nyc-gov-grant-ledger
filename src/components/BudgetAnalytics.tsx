import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import {
  AGENCY_BUDGET_DATA,
  FOCUS_AREA_DATA,
  BOROUGH_DATA,
  BUDGET_INITIATIVES,
  NYC_BUDGET_OVERVIEW,
  HISTORICAL_TREND_DATA,
  TRENDING_TOPICS_DATA,
  COUNCIL_ROSTER,
  ORG_PROFILES,
  INITIATIVES_METADATA,
  AUDIT_RESPONSES
} from "../data/budgetData";
import {
  Info,
  HelpCircle,
  TrendingUp,
  Landmark,
  Award,
  ShieldAlert,
  FileSpreadsheet,
  Search,
  Building2,
  User,
  History,
  FileCheck2,
  GitPullRequest,
  BookOpen,
  CalendarDays,
  FileText
} from "lucide-react";

// Formatting function for dollars
const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${value.toLocaleString()}`;
};

// Custom Tooltip component for Nonprofit Sectors LineChart to guarantee ordered layout:
// Social Services, Youth Services, Arts, Health, Environment
const CustomSectorsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const order = [
      "socialServices",
      "youthEducation",
      "artsCulture",
      "healthWellness",
      "environmentPublicSpace"
    ];

    const itemMap: Record<string, any> = {};
    payload.forEach((item: any) => {
      itemMap[item.dataKey || item.name] = item;
    });

    const labelsMap: Record<string, { label: string; color: string }> = {
      socialServices: { label: "Social Services", color: "#003B71" },
      youthEducation: { label: "Youth Services", color: "#F27D26" },
      artsCulture: { label: "Arts & Culture", color: "#D9A406" },
      healthWellness: { label: "Health & Wellness", color: "#2E7D32" },
      environmentPublicSpace: { label: "Environment & Public Space", color: "#00838F" }
    };

    return (
      <div className="bg-[#F9F8F3] border-2 border-[#1A1A1A] p-3 shadow-[3px_3px_0px_0px_#1A1A1A] font-mono text-xs text-[#1A1A1A] min-w-[240px]">
        <p className="font-bold text-[#003B71] border-b border-[#1A1A1A] pb-1 mb-2">{label}</p>
        <div className="flex flex-col gap-1.5">
          {order.map((key) => {
            const item = itemMap[key];
            if (!item) return null;
            const meta = labelsMap[key];
            return (
              <div key={key} className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 inline-block border border-[#1A1A1A]" style={{ backgroundColor: meta.color }} />
                  <span className="text-[10px] text-slate-700 font-bold uppercase">{meta.label}</span>
                </div>
                <span className="font-bold text-[10px] text-[#1A1A1A]">{formatCurrency(Number(item.value))}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function BudgetAnalytics() {
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);

  // States for the Historical Trends & Sector Topics
  const [trendViewMode, setTrendViewMode] = useState<"aggregate" | "sectors">("aggregate");
  const [selectedSector, setSelectedSector] = useState<"all" | "socialServices" | "youthEducation" | "artsCulture" | "healthWellness" | "environmentPublicSpace">("all");

  // States for the Interactive Open Data Audit Desk
  const [activeQueryId, setActiveQueryId] = useState<string>("q1");
  const [selectedCM, setSelectedCM] = useState<string>("Chi Ossé");
  const [selectedOrg, setSelectedOrg] = useState<string>("Brooklyn Youth Code Guild");
  const [selectedInit, setSelectedInit] = useState<string>("Cultural After-School Adventures (CASA)");

  const agencyMapData = AGENCY_BUDGET_DATA.map(agency => ({
    name: agency.id,
    fullName: agency.fullName,
    "Funding ($)": agency.totalFunds,
    "Total Grants": agency.allocationsCount,
    "Avg Grant": agency.averageAward,
    color: agency.color,
    description: agency.description
  }));

  const activeAgencyDetail = AGENCY_BUDGET_DATA.find(a => a.id === selectedAgency);

  // Render the dynamic responses for each of the six historical audit questions
  const renderAuditResult = () => {
    switch (activeQueryId) {
      case "q1": {
        // "Which organizations did Council Member [name] fund in FY2026, and how much did each receive?"
        const data = AUDIT_RESPONSES.cmExpense2026[selectedCM] || [];
        const totalAllocated = data.reduce((sum, item) => sum + item.amount, 0);
        return (
          <div className="space-y-4" id="audit-result-q1">
            <div className="flex justify-between items-baseline border-b border-[#1A1A1A]/10 pb-2 flex-wrap gap-2">
              <h4 className="font-serif font-black text-sm text-[#1A1A1A]">
                FY2026 Allocations Sponsored by CM {selectedCM}
              </h4>
              <div className="text-xs font-mono font-bold text-[#003B71]">
                Total: {formatCurrency(totalAllocated)} ({data.length} Awards)
              </div>
            </div>
            {data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1A1A1A] uppercase text-[9px] font-mono font-bold text-slate-500">
                      <th className="py-2">Organization</th>
                      <th className="py-2 px-2">EIN</th>
                      <th className="py-2 px-2">Primary Purpose</th>
                      <th className="py-2 px-2">Agency</th>
                      <th className="py-2 pl-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3DB]">
                    {data.map((item, i) => (
                      <tr key={i} className="hover:bg-[#F0EEE6]/30">
                        <td className="py-2.5 font-serif font-bold text-[#1A1A1A]">{item.organization}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-500">{item.ein}</td>
                        <td className="py-2.5 px-2 text-[#444]">{item.purpose}</td>
                        <td className="py-2.5 px-2"><span className="px-1.5 py-0.5 bg-[#003B71]/10 text-[#003B71] font-mono text-[9px] font-bold">{item.agency}</span></td>
                        <td className="py-2.5 pl-2 text-right font-mono font-bold text-[#F27D26]">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">No active data for selected Council Member.</p>
            )}
          </div>
        );
      }
      case "q2": {
        // "Show every discretionary award sponsored by Council Member [name] from FY2020 to FY2024."
        const data = AUDIT_RESPONSES.cmExpenseHistory[selectedCM] || [];
        return (
          <div className="space-y-4" id="audit-result-q2">
            <div className="flex justify-between items-baseline border-b border-[#1A1A1A]/10 pb-2">
              <h4 className="font-serif font-black text-sm text-[#1A1A1A]">
                Historical Discretionary Awards Tracker (FY2020 - FY2024)
              </h4>
              <span className="text-[10px] font-mono font-bold text-[#F27D26] uppercase">Sponsor: {selectedCM}</span>
            </div>
            {data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1A1A1A] uppercase text-[9px] font-mono font-bold text-slate-500">
                      <th className="py-2">Fiscal Year</th>
                      <th className="py-2 px-2">Recipient Organization</th>
                      <th className="py-2 px-2">Allocated Purpose</th>
                      <th className="py-2 px-2 font-mono">Agency</th>
                      <th className="py-2 px-2 font-mono">Resolution</th>
                      <th className="py-2 pl-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3DB]">
                    {data.map((item, i) => (
                      <tr key={i} className="hover:bg-[#F0EEE6]/30">
                        <td className="py-2.5 font-mono font-bold text-[#003B71]">{item.fy}</td>
                        <td className="py-2.5 px-2 font-serif font-bold text-[#1A1A1A]">{item.organization}</td>
                        <td className="py-2.5 px-2 text-[#444]">{item.purpose}</td>
                        <td className="py-2.5 px-2 font-mono text-[10px]">{item.agency}</td>
                        <td className="py-2.5 px-2 font-mono text-[10px] text-slate-500">{item.resolution}</td>
                        <td className="py-2.5 pl-2 text-right font-mono font-bold text-[#F27D26]">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">No multi-year history loaded for selected Council Member.</p>
            )}
          </div>
        );
      }
      case "q3": {
        // "Was [organization]’s FY2026 funding later rescinded or moved to a different group by a Transparency Resolution?"
        const data = AUDIT_RESPONSES.transparencyRes[selectedOrg];
        return (
          <div className="space-y-4" id="audit-result-q3">
            <div className="border-b border-[#1A1A1A]/10 pb-2 flex justify-between items-baseline flex-wrap gap-2">
              <h4 className="font-serif font-black text-sm text-[#1A1A1A]">
                Transparency Resolution Audit for {selectedOrg}
              </h4>
              <span className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                data?.status.includes("Rescinded") ? "bg-red-50 text-red-700 border border-red-200" :
                data?.status.includes("Increased") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                "bg-blue-50 text-blue-800 border border-blue-200"
              }`}>
                {data?.status || "Record Reconciled"}
              </span>
            </div>
            {data ? (
              <div className="p-4 bg-[#F0EEE6] border-l-4 border-[#003B71] space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Original Budget Line</span>
                    <span className="font-bold text-[#1A1A1A]">{formatCurrency(data.original)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Originating Sponsor</span>
                    <span className="font-bold text-[#1A1A1A]">{data.sponsor}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Mid-Year Adjustment Resolution</span>
                    <span className="font-bold text-[#F27D26]">{data.resolution}</span>
                  </div>
                </div>
                <div className="text-xs text-[#1A1A1A] leading-relaxed pt-2 border-t border-[#1A1A1A]/10">
                  <span className="font-bold uppercase tracking-wider text-[9px] block mb-1 text-[#003B71]">Audited Legislative Trail:</span>
                  {data.trail}
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">No Transparency Resolution entries found for this organization.</p>
            )}
          </div>
        );
      }
      case "q4": {
        // "List every capital project [council member] sponsored since FY2020, with the adopted amount and the agency."
        const data = AUDIT_RESPONSES.capitalProjects[selectedCM] || [];
        return (
          <div className="space-y-4" id="audit-result-q4">
            <div className="flex justify-between items-baseline border-b border-[#1A1A1A]/10 pb-2">
              <h4 className="font-serif font-black text-sm text-[#1A1A1A]">
                Capital Budget Allocations since FY2020
              </h4>
              <span className="text-xs font-mono font-bold text-[#003B71] uppercase">Sponsor: {selectedCM}</span>
            </div>
            {data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1A1A1A] uppercase text-[9px] font-mono font-bold text-slate-500">
                      <th className="py-2">Adopted FY</th>
                      <th className="py-2 px-2">Project Name</th>
                      <th className="py-2 px-2">Managing Agency</th>
                      <th className="py-2 px-2">Project Status</th>
                      <th className="py-2 pl-2 text-right">Adopted Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3DB]">
                    {data.map((item, i) => (
                      <tr key={i} className="hover:bg-[#F0EEE6]/30">
                        <td className="py-2.5 font-mono font-bold text-[#003B71]">{item.fy}</td>
                        <td className="py-2.5 px-2 font-serif font-bold text-[#1A1A1A]">{item.project}</td>
                        <td className="py-2.5 px-2">{item.agency}</td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2 py-0.5 rounded-none font-mono text-[9px] font-bold ${
                            item.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                            item.status === "In Progress" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 pl-2 text-right font-mono font-bold text-[#F27D26]">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">No capital projects loaded for selected Council Member.</p>
            )}
          </div>
        );
      }
      case "q5": {
        // "Find the full legislative trail for the [initiative name] initiative: the resolution that adopted it and its Legistar record."
        const data = INITIATIVES_METADATA.find(i => i.name === selectedInit);
        return (
          <div className="space-y-4" id="audit-result-q5">
            <div className="border-b border-[#1A1A1A]/10 pb-2">
              <h4 className="font-serif font-black text-sm text-[#1A1A1A]">
                Legislative Trail & Legistar Record
              </h4>
            </div>
            {data ? (
              <div className="p-4 bg-[#F0EEE6] border border-[#1A1A1A]/20 space-y-3" id="legistar-box">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Initiative Line</span>
                    <span className="font-bold text-[#1A1A1A]">{data.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Adoption Resolution</span>
                    <span className="font-bold text-[#F27D26]">{data.adoptionResolution}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Legistar File ID</span>
                    <span className="font-bold text-[#003B71] underline cursor-pointer hover:text-black">
                      File {data.legistarFile}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Responsible Committee</span>
                    <span className="font-bold text-[#1A1A1A]">{data.committee}</span>
                  </div>
                </div>
                <div className="text-xs text-[#1A1A1A] leading-relaxed pt-3 border-t border-[#1A1A1A]/10 font-sans">
                  <span className="font-bold block mb-1">Legislative Progress:</span>
                  1. Formally introduced by the {data.committee} as a discretionary operating schedule line during May.
                  <br />
                  2. Enacted into law on June 28 under {data.adoptionResolution} matching the Mayor's executive operating agreement.
                  <br />
                  3. Digitized into the BetaNYC Schedule C Open Data Ledger for permanent public audits.
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">No legislative metadata available for this initiative.</p>
            )}
          </div>
        );
      }
      case "q6": {
        // "How much discretionary funding has [organization]’s EIN received across every year with award-level data (FY2015 forward)?"
        const data = AUDIT_RESPONSES.lifetimeFunding[selectedOrg];
        return (
          <div className="space-y-4" id="audit-result-q6">
            <div className="border-b border-[#1A1A1A]/10 pb-2 flex justify-between items-baseline flex-wrap gap-2">
              <h4 className="font-serif font-black text-sm text-[#1A1A1A]">
                EIN Historical Cumulative Analysis (FY2015 - FY2026)
              </h4>
              <div className="text-xs font-mono font-bold text-[#F27D26]">
                Lifetime Discretionary Total: {data ? formatCurrency(data.total) : "$0"}
              </div>
            </div>
            {data ? (
              <div className="space-y-3">
                <div className="flex gap-4 items-center text-xs font-mono bg-[#003B71] text-white p-3">
                  <Building2 className="w-4 h-4" />
                  <div>
                    <span>Organization: <strong>{selectedOrg}</strong></span>
                    <span className="mx-3">|</span>
                    <span>EIN: <strong>{data.ein}</strong></span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#1A1A1A] uppercase text-[9px] font-mono font-bold text-slate-500">
                        <th className="py-1.5">Fiscal Year</th>
                        <th className="py-1.5 px-2">Funding Level</th>
                        <th className="py-1.5 pl-2 text-right">BetaNYC Verified Records</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E3DB] font-mono text-[11.5px]">
                      {data.years.map((y, index) => (
                        <tr key={index} className="hover:bg-[#F0EEE6]/30">
                          <td className="py-2 font-bold text-[#003B71]">{y.fy}</td>
                          <td className="py-2 px-2 text-[#F27D26] font-bold">{formatCurrency(y.amount)}</td>
                          <td className="py-2 pl-2 text-right text-slate-500 normal-case">{y.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">No historical database record matches this organization's EIN.</p>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8" id="budget-analytics-section">
      
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="stats-grid">
        <div 
          className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] relative"
          id="stat-card-total-funds"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-[#003B71]" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Ledger Entry 01 • Total Funds</span>
            <div className="p-1.5 border border-[#1A1A1A] text-[#003B71]">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-serif font-black tracking-tight text-[#1A1A1A]">
            {formatCurrency(NYC_BUDGET_OVERVIEW.totalDiscretionary)}
          </div>
          <p className="text-[11px] text-[#555] mt-3 font-medium flex items-center gap-1.5 border-t border-[#E5E3DB] pt-2">
            <Info className="w-3.5 h-3.5 text-[#F27D26]" />
            Official Schedule C Discretionary Budget
          </p>
        </div>

        <div 
          className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] relative"
          id="stat-card-total-allocations"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-[#F27D26]" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Ledger Entry 02 • Output</span>
            <div className="p-1.5 border border-[#F27D26] text-[#F27D26]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-serif font-black tracking-tight text-[#1A1A1A]">
            {NYC_BUDGET_OVERVIEW.totalAllocations.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#555] mt-3 font-medium flex items-center gap-1.5 border-t border-[#E5E3DB] pt-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#1A1A1A]" />
            Grants across all five NYC boroughs
          </p>
        </div>

        <div 
          className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] relative"
          id="stat-card-avg-award"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-[#003B71]" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Ledger Entry 03 • Benchmarks</span>
            <div className="p-1.5 border border-[#1A1A1A] text-[#003B71]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-serif font-black tracking-tight text-[#1A1A1A]">
            {formatCurrency(NYC_BUDGET_OVERVIEW.averageGrant)}
          </div>
          <p className="text-[11px] text-[#555] mt-3 font-medium flex items-center gap-1.5 border-t border-[#E5E3DB] pt-2">
            <HelpCircle className="w-3.5 h-3.5 text-[#F27D26]" />
            Varies dynamically by agency thresholds
          </p>
        </div>
      </div>

      {/* NEW SECTION: Time-Series Trends over the Years */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="historical-trends-row">
        
        {/* Line Chart showing trends over years */}
        <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] lg:col-span-8" id="time-series-trend-card">
          <div className="mb-6 border-b border-[#1A1A1A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[9px] font-mono font-bold bg-[#003B71] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">Historical Timeline</span>
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]" id="trend-chart-title">Two Decades of Discretionary Growth</h3>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex border border-[#1A1A1A] p-0.5 bg-white shadow-[2px_2px_0px_0px_#1A1A1A] self-start sm:self-auto">
              <button
                onClick={() => setTrendViewMode("aggregate")}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  trendViewMode === "aggregate"
                    ? "bg-[#003B71] text-white"
                    : "text-[#1A1A1A] hover:bg-[#F0EEE6]/50"
                }`}
              >
                Aggregate Ledger
              </button>
              <button
                onClick={() => setTrendViewMode("sectors")}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  trendViewMode === "sectors"
                    ? "bg-[#F27D26] text-white"
                    : "text-[#1A1A1A] hover:bg-[#F0EEE6]/50"
                }`}
              >
                Nonprofit Sectors
              </button>
            </div>
          </div>

          {/* Sector metadata structure for interactive queries */}
          {trendViewMode === "sectors" && (() => {
            const SECTOR_METADATA = {
              socialServices: {
                label: "Social Services & Food Security",
                color: "#003B71",
                trending: "Expanded Emergency Food Assistance Programs (EFAP), local pantries, elder meal-delivery runs, and housing eviction defense legal advocacy.",
                keywords: ["Emergency Pantries", "Crisis Kitchens", "Eviction Defense", "Eldercare Meals"],
                pct: "35% Average Share"
              },
              youthEducation: {
                label: "Youth Services & Education",
                color: "#F27D26",
                trending: "Expansion of math/science academies, digital literacy campaigns, free coding camps, and after-school tutoring labs in historically underfunded districts.",
                keywords: ["Robotics Labs", "Free Coding Academies", "After-school Enrichment", "Homework Help"],
                pct: "27% Average Share"
              },
              artsCulture: {
                label: "Arts & Culture",
                color: "#D9A406",
                trending: "Decentralized neighborhood block festivals, cultural fairs, public theater programs, and local heritage ensemble workshops.",
                keywords: ["Block Fairs", "Heritage Festivals", "Community Theaters", "Folk Art Classes"],
                pct: "15% Average Share"
              },
              healthWellness: {
                label: "Health & Community Wellness",
                color: "#2E7D32",
                trending: "Maternal care navigation, local doula coalitions, peer-led mental health sessions, and mobile health testing centers.",
                keywords: ["Doula Guides", "Peer Counseling Nets", "Mobile Health Vans", "Wellness Seminars"],
                pct: "14% Average Share"
              },
              environmentPublicSpace: {
                label: "Environment & Public Space",
                color: "#00838F",
                trending: "Urban agriculture programs, greening preservation, clean neighborhood sweeps, and community garden soil remediation actions.",
                keywords: ["Garden Preservation", "Beautification Actions", "Neighborhood Clean-ups", "Greening Pilots"],
                pct: "9% Average Share"
              }
            };

            return (
              <div className="mb-4 flex flex-wrap gap-2 items-center border-b border-[#E5E3DB] pb-3" id="sector-trend-buttons">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 mr-1">Sector Spotlight:</span>
                <button
                  onClick={() => setSelectedSector("all")}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                    selectedSector === "all"
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white text-[#1A1A1A] border-[#E5E3DB] hover:border-[#1A1A1A]"
                  }`}
                >
                  All Sectors
                </button>
                {(Object.keys(SECTOR_METADATA) as Array<keyof typeof SECTOR_METADATA>).map((key) => {
                  const isSelected = selectedSector === key;
                  const sec = SECTOR_METADATA[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSector(key)}
                      style={{
                        borderColor: isSelected ? sec.color : "#E5E3DB",
                        backgroundColor: isSelected ? sec.color : "transparent",
                        color: isSelected ? "#FFF" : "#1A1A1A"
                      }}
                      className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase border transition-all cursor-pointer hover:opacity-90"
                    >
                      {sec.label.split(" & ")[0]}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          <div className="h-72" id="historical-line-chart-wrapper">
            {trendViewMode === "aggregate" ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={HISTORICAL_TREND_DATA}
                  margin={{ top: 15, right: 20, left: 15, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#D9D7CE" />
                  <XAxis dataKey="year" stroke="#1A1A1A" fontSize={11} tickLine={true} />
                  <YAxis
                    yAxisId="left"
                    stroke="#003B71"
                    fontSize={11}
                    tickLine={true}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#F27D26"
                    fontSize={11}
                    tickLine={true}
                    tickFormatter={(val) => val.toLocaleString()}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === "totalFunds") return [formatCurrency(Number(value)), "Total Funds"];
                      if (name === "grantsCount") return [Number(value).toLocaleString(), "Awards Count"];
                      return [value, name];
                    }}
                    contentStyle={{ backgroundColor: "#F9F8F3", border: "2px solid #1A1A1A", borderRadius: "0px" }}
                    itemStyle={{ color: "#1A1A1A", fontSize: "12px", fontFamily: "monospace" }}
                    labelStyle={{ color: "#003B71", fontWeight: "bold", fontSize: "11px", fontFamily: "monospace" }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalFunds"
                    name="Total Funding ($)"
                    stroke="#003B71"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4, stroke: "#003B71", strokeWidth: 1 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="grantsCount"
                    name="Total Grants Count"
                    stroke="#F27D26"
                    strokeWidth={2}
                    dot={{ r: 3, stroke: "#F27D26", strokeWidth: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={HISTORICAL_TREND_DATA}
                  margin={{ top: 15, right: 20, left: 15, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#D9D7CE" />
                  <XAxis dataKey="year" stroke="#1A1A1A" fontSize={11} tickLine={true} />
                  <YAxis
                    stroke="#003B71"
                    fontSize={11}
                    tickLine={true}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip content={<CustomSectorsTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="socialServices"
                    name="Social Services"
                    stroke="#003B71"
                    strokeWidth={selectedSector === "socialServices" ? 4 : 2}
                    strokeOpacity={selectedSector === "all" || selectedSector === "socialServices" ? 1 : 0.15}
                    dot={{ r: selectedSector === "socialServices" ? 5 : 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="youthEducation"
                    name="Youth & Education"
                    stroke="#F27D26"
                    strokeWidth={selectedSector === "youthEducation" ? 4 : 2}
                    strokeOpacity={selectedSector === "all" || selectedSector === "youthEducation" ? 1 : 0.15}
                    dot={{ r: selectedSector === "youthEducation" ? 5 : 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="artsCulture"
                    name="Arts & Culture"
                    stroke="#D9A406"
                    strokeWidth={selectedSector === "artsCulture" ? 4 : 2}
                    strokeOpacity={selectedSector === "all" || selectedSector === "artsCulture" ? 1 : 0.15}
                    dot={{ r: selectedSector === "artsCulture" ? 5 : 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="healthWellness"
                    name="Health & Wellness"
                    stroke="#2E7D32"
                    strokeWidth={selectedSector === "healthWellness" ? 4 : 2}
                    strokeOpacity={selectedSector === "all" || selectedSector === "healthWellness" ? 1 : 0.15}
                    dot={{ r: selectedSector === "healthWellness" ? 5 : 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="environmentPublicSpace"
                    name="Environment & Public Space"
                    stroke="#00838F"
                    strokeWidth={selectedSector === "environmentPublicSpace" ? 4 : 2}
                    strokeOpacity={selectedSector === "all" || selectedSector === "environmentPublicSpace" ? 1 : 0.15}
                    dot={{ r: selectedSector === "environmentPublicSpace" ? 5 : 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sector detail description panels dynamically swapped */}
          {trendViewMode === "sectors" && (() => {
            const SECTOR_METADATA = {
              socialServices: {
                label: "Social Services & Food Security",
                color: "#003B71",
                trending: "Expanded Emergency Food Assistance Programs (EFAP), local pantries, elder meal-delivery runs, and housing eviction defense legal advocacy.",
                keywords: ["Emergency Pantries", "Crisis Kitchens", "Tenant Eviction Counsel", "Senior Center Meals"],
                pct: "35% Average Share"
              },
              youthEducation: {
                label: "Youth Services & Education",
                color: "#F27D26",
                trending: "Expansion of math/science academies, digital literacy campaigns, free coding camps, and after-school tutoring labs in historically underfunded districts.",
                keywords: ["Robotics Labs", "Free Coding Academies", "After-school Enrichment", "Homework Help"],
                pct: "27% Average Share"
              },
              artsCulture: {
                label: "Arts & Culture",
                color: "#D9A406",
                trending: "Decentralized neighborhood block festivals, cultural fairs, public theater programs, and local heritage ensemble workshops.",
                keywords: ["Block Fairs", "Heritage Festivals", "Community Theaters", "Folk Art Classes"],
                pct: "15% Average Share"
              },
              healthWellness: {
                label: "Health & Community Wellness",
                color: "#2E7D32",
                trending: "Maternal care navigation, local doula coalitions, peer-led mental health sessions, and mobile health testing centers.",
                keywords: ["Doula Guides", "Peer Counseling Nets", "Mobile Health Vans", "Wellness Seminars"],
                pct: "14% Average Share"
              },
              environmentPublicSpace: {
                label: "Environment & Public Space",
                color: "#00838F",
                trending: "Urban agriculture programs, greening preservation, clean neighborhood sweeps, and community garden soil remediation actions.",
                keywords: ["Garden Preservation", "Beautification Actions", "Neighborhood Clean-ups", "Greening Pilots"],
                pct: "9% Average Share"
              }
            };

            return (
              <div className="mt-4 p-4 border border-[#1A1A1A] bg-white shadow-[2px_2px_0px_0px_#1A1A1A]" id="sector-trends-detail-box">
                {selectedSector === "all" ? (
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F27D26] mb-2">Overview of Nonprofit Sectors</h4>
                    <p className="text-xs text-[#1A1A1A] font-sans leading-relaxed">
                      Discretionary funding over the past two decades has increasingly centered around community safety-nets and education. 
                      <strong> Social Services</strong> represents the largest slice (~35%), followed by <strong>Youth & Education</strong> (~27%). 
                      Select a specific spotlight button above to filter lines and read detailed trending topics and keywords.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: SECTOR_METADATA[selectedSector].color }}>
                        {SECTOR_METADATA[selectedSector].label}
                      </h4>
                      <span className="text-[10px] font-mono font-black text-slate-500 bg-slate-100 px-1.5 py-0.5">
                        {SECTOR_METADATA[selectedSector].pct}
                      </span>
                    </div>
                    <p className="text-xs text-[#1A1A1A] font-sans leading-relaxed mb-3">
                      {SECTOR_METADATA[selectedSector].trending}
                    </p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight mr-1">Key Topics / Search Keywords:</span>
                      {SECTOR_METADATA[selectedSector].keywords.map((kw, i) => (
                        <span key={i} className="text-[9px] font-mono text-[#1A1A1A] bg-[#F0EEE6] px-2 py-0.5 border border-[#1A1A1A]/10">
                          "{kw}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="mt-4 text-[10.5px] text-slate-500 font-mono leading-relaxed bg-[#F0EEE6]/50 p-3 border-l-2 border-[#003B71]">
            * Note: Discretionary funding totals have increased by 23% since FY2020, driven by expanded council member allocation capacities, while average individual grant sizes stabilized around $88,000.
          </div>
        </div>

        {/* Trending Funding Topics Panel */}
        <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] lg:col-span-4 flex flex-col justify-between" id="trending-topics-card">
          <div>
            <div className="mb-4 border-b border-[#1A1A1A] pb-4">
              <span className="text-[9px] font-mono font-bold bg-[#F27D26] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">BetaNYC Analysis</span>
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]" id="trending-topics-title">Trending Topics</h3>
            </div>
            
            <div className="space-y-4" id="trending-topics-list">
              {TRENDING_TOPICS_DATA.map((t, index) => (
                <div key={index} className="border-b border-[#E5E3DB] pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-serif font-bold text-xs text-[#1A1A1A]">{t.topic}</span>
                    <span className="font-mono text-[10px] font-black text-[#F27D26] bg-[#F27D26]/10 px-1.5 py-0.5 shrink-0">{t.growthRate}</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1 leading-normal font-sans">
                    {t.description}
                  </p>
                  <div className="flex justify-between items-center text-[9px] text-[#003B71] font-mono mt-1.5">
                    <span>{t.category}</span>
                    <span>FY2020: ${t.fy2020}M → FY2026: ${t.fy2026}M</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* NEW SECTION: Interactive Open Data Audit Desk */}
      <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A]" id="open-data-audit-desk">
        <div className="mb-6 border-b border-[#1A1A1A] pb-4 flex justify-between items-baseline flex-wrap gap-2">
          <div>
            <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">Legislative Query Engine</span>
            <h3 className="text-2xl font-serif font-black text-[#1A1A1A]" id="audit-desk-title">NYC Council Open Data Auditor</h3>
          </div>
          <p className="text-xs text-[#555] font-sans">Query two decades of Council PDF extractions and Transparency Resolutions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="audit-desk-workspace">
          
          {/* Query Selector List */}
          <div className="lg:col-span-5 space-y-2.5" id="audit-questions-menu">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">Select Diagnostic Question:</span>
            
            <button
              id="audit-q1-btn"
              onClick={() => setActiveQueryId("q1")}
              className={`w-full p-3 text-left border text-xs flex gap-3 transition-all cursor-pointer ${
                activeQueryId === "q1" ? "border-[#1A1A1A] bg-[#003B71] text-white" : "border-[#E5E3DB] hover:border-[#1A1A1A] text-[#1A1A1A] bg-[#F0EEE6]/20"
              }`}
            >
              <User className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-serif font-bold block">1. Council Member FY2026 Rollup</span>
                <span className="text-[10px] opacity-80 block">Which organizations did CM [name] fund in FY2026, and how much did they receive?</span>
              </div>
            </button>

            <button
              id="audit-q2-btn"
              onClick={() => {
                setActiveQueryId("q2");
              }}
              className={`w-full p-3 text-left border text-xs flex gap-3 transition-all cursor-pointer ${
                activeQueryId === "q2" ? "border-[#1A1A1A] bg-[#003B71] text-white" : "border-[#E5E3DB] hover:border-[#1A1A1A] text-[#1A1A1A] bg-[#F0EEE6]/20"
              }`}
            >
              <History className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-serif font-bold block">2. Multi-Year Sponsoring History</span>
                <span className="text-[10px] opacity-80 block">Show discretionary awards sponsored by CM [name] from FY2020 to FY2024.</span>
              </div>
            </button>

            <button
              id="audit-q3-btn"
              onClick={() => setActiveQueryId("q3")}
              className={`w-full p-3 text-left border text-xs flex gap-3 transition-all cursor-pointer ${
                activeQueryId === "q3" ? "border-[#1A1A1A] bg-[#003B71] text-white" : "border-[#E5E3DB] hover:border-[#1A1A1A] text-[#1A1A1A] bg-[#F0EEE6]/20"
              }`}
            >
              <GitPullRequest className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-serif font-bold block">3. Transparency Mid-Year Adjustments</span>
                <span className="text-[10px] opacity-80 block">Was [organization]’s FY2026 funding later rescinded or moved by a Resolution?</span>
              </div>
            </button>

            <button
              id="audit-q4-btn"
              onClick={() => setActiveQueryId("q4")}
              className={`w-full p-3 text-left border text-xs flex gap-3 transition-all cursor-pointer ${
                activeQueryId === "q4" ? "border-[#1A1A1A] bg-[#003B71] text-white" : "border-[#E5E3DB] hover:border-[#1A1A1A] text-[#1A1A1A] bg-[#F0EEE6]/20"
              }`}
            >
              <Landmark className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-serif font-bold block">4. Capital Project Ledger (since FY2020)</span>
                <span className="text-[10px] opacity-80 block">List capital projects sponsored by [council member] with agency and adopted amounts.</span>
              </div>
            </button>

            <button
              id="audit-q5-btn"
              onClick={() => setActiveQueryId("q5")}
              className={`w-full p-3 text-left border text-xs flex gap-3 transition-all cursor-pointer ${
                activeQueryId === "q5" ? "border-[#1A1A1A] bg-[#003B71] text-white" : "border-[#E5E3DB] hover:border-[#1A1A1A] text-[#1A1A1A] bg-[#F0EEE6]/20"
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-serif font-bold block">5. Legislative Trail & Legistar Record</span>
                <span className="text-[10px] opacity-80 block">Find the full legislative trail for an initiative: resolution and Legistar record.</span>
              </div>
            </button>

            <button
              id="audit-q6-btn"
              onClick={() => setActiveQueryId("q6")}
              className={`w-full p-3 text-left border text-xs flex gap-3 transition-all cursor-pointer ${
                activeQueryId === "q6" ? "border-[#1A1A1A] bg-[#003B71] text-white" : "border-[#E5E3DB] hover:border-[#1A1A1A] text-[#1A1A1A] bg-[#F0EEE6]/20"
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-serif font-bold block">6. Cumulative Lifetime EIN Audit</span>
                <span className="text-[10px] opacity-80 block">How much discretionary funding has [organization]’s EIN received since FY2015?</span>
              </div>
            </button>

          </div>

          {/* Query Workspace & Result Rendering */}
          <div className="lg:col-span-7 bg-[#F0EEE6]/30 p-5 border border-[#1A1A1A] flex flex-col justify-between space-y-6" id="audit-desk-viewer">
            
            {/* Dynamic Controls depending on selected question */}
            <div className="space-y-4" id="audit-interactive-filters">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 block">Interactive Audit Scope Parameters:</span>
              
              {/* Render CM dropdown if question involves Council Member */}
              {["q1", "q2", "q4"].includes(activeQueryId) && (
                <div className="space-y-1.5" id="cm-selector-container">
                  <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5 font-serif">
                    <User className="w-3.5 h-3.5 text-[#003B71]" />
                    Choose Council Member:
                  </label>
                  <select
                    id="select-audit-cm"
                    value={selectedCM}
                    onChange={(e) => setSelectedCM(e.target.value)}
                    className="w-full bg-[#F9F8F3] border border-[#1A1A1A] px-3 py-2 text-xs font-mono font-bold cursor-pointer focus:border-[#F27D26] outline-none rounded-none"
                  >
                    {COUNCIL_ROSTER.map((cm) => (
                      <option key={cm.name} value={cm.name}>
                        {cm.name} (District {cm.district} • {cm.borough})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Render Organization dropdown if question involves Organization */}
              {["q3", "q6"].includes(activeQueryId) && (
                <div className="space-y-1.5" id="org-selector-container">
                  <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5 font-serif">
                    <Building2 className="w-3.5 h-3.5 text-[#003B71]" />
                    Choose Organization:
                  </label>
                  <select
                    id="select-audit-org"
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-full bg-[#F9F8F3] border border-[#1A1A1A] px-3 py-2 text-xs font-mono font-bold cursor-pointer focus:border-[#F27D26] outline-none rounded-none"
                  >
                    {ORG_PROFILES.map((org) => (
                      <option key={org.name} value={org.name}>
                        {org.name} (EIN: {org.ein})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Render Initiative dropdown if question involves Initiative */}
              {activeQueryId === "q5" && (
                <div className="space-y-1.5" id="init-selector-container">
                  <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5 font-serif">
                    <BookOpen className="w-3.5 h-3.5 text-[#003B71]" />
                    Choose Budget Initiative Line:
                  </label>
                  <select
                    id="select-audit-init"
                    value={selectedInit}
                    onChange={(e) => setSelectedInit(e.target.value)}
                    className="w-full bg-[#F9F8F3] border border-[#1A1A1A] px-3 py-2 text-xs font-mono font-bold cursor-pointer focus:border-[#F27D26] outline-none rounded-none"
                  >
                    {INITIATIVES_METADATA.map((init) => (
                      <option key={init.name} value={init.name}>
                        {init.name} ({init.agency})
                      </option>
                    ))}
                  </select>
                </div>
              )}

            </div>

            {/* Display Reconciled Open Data Output */}
            <div className="bg-[#F9F8F3] p-4 border border-[#1A1A1A] min-h-[220px] flex flex-col justify-between" id="audit-output-box">
              <div id="audit-live-data-view">
                {renderAuditResult()}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E5E3DB] text-[10px] text-slate-400 font-mono">
                <FileText className="w-3.5 h-3.5 text-[#003B71]" />
                <span>Verified with machine-readable Council PDF exports (FY2015 forward).</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="charts-container-grid">
        
        {/* Agency Chart */}
        <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] lg:col-span-7" id="agency-budget-chart-card">
          <div className="mb-6 border-b border-[#1A1A1A] pb-4 flex justify-between items-baseline flex-wrap gap-2">
            <div>
              <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">Agency Ledger</span>
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]" id="agency-chart-title">Discretionary Spending by Agency</h3>
            </div>
            <p className="text-xs text-[#555] italic">Select bar to inspect agency scope</p>
          </div>
          
          <div className="h-80" id="agency-bar-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={agencyMapData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                onClick={(state: any) => {
                  const s = state as any;
                  if (s && s.activePayload && s.activePayload.length > 0) {
                    setSelectedAgency(s.activePayload[0].payload.name);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#D9D7CE" />
                <XAxis dataKey="name" stroke="#1A1A1A" fontSize={11} tickLine={true} />
                <YAxis
                  stroke="#1A1A1A"
                  fontSize={11}
                  tickLine={true}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === "Funding ($)") return [formatCurrency(Number(value)), "Total Budget"];
                    if (name === "Avg Grant") return [formatCurrency(Number(value)), "Avg Grant Size"];
                    return [value, name];
                  }}
                  contentStyle={{ backgroundColor: "#F9F8F3", border: "2px solid #1A1A1A", borderRadius: "0px" }}
                  itemStyle={{ color: "#1A1A1A", fontSize: "12px", fontFamily: "monospace" }}
                  labelStyle={{ color: "#F27D26", fontWeight: "bold", fontSize: "11px", fontFamily: "monospace" }}
                />
                <Bar 
                  dataKey="Funding ($)" 
                  fill="#003B71" 
                  radius={[0, 0, 0, 0]}
                  cursor="pointer"
                >
                  {agencyMapData.map((entry, index) => {
                    const isSelected = selectedAgency === entry.name;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isSelected ? "#F27D26" : "#003B71"} 
                        stroke="#1A1A1A"
                        strokeWidth={1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Agency Info Panel */}
          <div className="mt-4 p-5 rounded-none bg-[#F0EEE6] border border-[#1A1A1A] min-h-[110px]" id="agency-interactive-panel">
            {activeAgencyDetail ? (
              <div id="selected-agency-detail" className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: activeAgencyDetail.color || "#F27D26" }} />
                    <h4 className="font-serif font-black text-base text-[#1A1A1A]">{activeAgencyDetail.fullName} ({activeAgencyDetail.id})</h4>
                  </div>
                  <button 
                    onClick={() => setSelectedAgency(null)}
                    className="text-xs text-[#F27D26] hover:underline font-bold uppercase tracking-wider font-mono"
                    id="clear-agency-selection"
                  >
                    [ RESET ]
                  </button>
                </div>
                <p className="text-xs text-[#333] leading-relaxed italic">{activeAgencyDetail.description}</p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="border-r border-[#1A1A1A]/10 pr-4">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider font-mono">Aggregated Allocation</span>
                    <span className="text-base font-serif font-bold text-[#1A1A1A]">{formatCurrency(activeAgencyDetail.totalFunds)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider font-mono">Mean Grant Threshold</span>
                    <span className="text-base font-serif font-bold text-[#1A1A1A]">{formatCurrency(activeAgencyDetail.averageAward)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-4" id="agency-no-selection">
                <p className="text-xs text-[#555] italic font-serif">Click any columns in the ledger chart above to inspect agency-level funding mandates, program parameters, and baseline grant sizing.</p>
              </div>
            )}
          </div>
        </div>

        {/* Focus Area Pie Chart */}
        <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] lg:col-span-5 flex flex-col justify-between" id="focus-area-chart-card">
          <div>
            <div className="mb-6 border-b border-[#1A1A1A] pb-4">
              <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">Outcome Spectrum</span>
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]" id="focus-chart-title">Sector Capital Allocations</h3>
            </div>
            <div className="h-64 flex items-center justify-center relative" id="focus-pie-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={FOCUS_AREA_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="totalFunds"
                  >
                    {FOCUS_AREA_DATA.map((entry, index) => {
                      // Map standard colors to editorial palette matching DSSG Blue and Orange
                      const palette = ["#003B71", "#F27D26", "#8F8D83", "#134074", "#D46B13", "#546A7B", "#B5B3A9", "#7B8A7A"];
                      const color = palette[index % palette.length];
                      return <Cell key={`cell-${index}`} fill={color} stroke="#F9F8F3" strokeWidth={2} />;
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), "Funding"]}
                    contentStyle={{ backgroundColor: "#F9F8F3", border: "2px solid #1A1A1A", borderRadius: "0px" }}
                    itemStyle={{ color: "#1A1A1A", fontSize: "11px", fontFamily: "monospace" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] uppercase tracking-widest text-[#666] font-mono font-bold">Scope</span>
                <span className="text-lg font-serif italic font-bold">8 Pillars</span>
              </div>
            </div>
          </div>
          
          {/* Custom Grid Legend */}
          <div className="grid grid-cols-1 gap-2.5 mt-6 pt-4 border-t border-[#1A1A1A]/10 text-xs" id="focus-pie-legend">
            {FOCUS_AREA_DATA.map((area, index) => {
              const palette = ["#003B71", "#F27D26", "#8F8D83", "#134074", "#D46B13", "#546A7B", "#B5B3A9", "#7B8A7A"];
              const color = palette[index % palette.length];
              return (
                <div key={index} className="flex items-center justify-between gap-2 border-b border-[#E5E3DB] pb-1.5 last:border-0" id={`legend-item-${index}`}>
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-none shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-bold text-[#1A1A1A] truncate">{area.name}</span>
                  </div>
                  <div className="flex gap-2 text-[11px] font-mono shrink-0">
                    <span className="text-[#555]">{formatCurrency(area.totalFunds)}</span>
                    <span className="font-bold text-[#F27D26]">({area.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Borough Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="borough-and-initiatives-grid">
        
        {/* Borough Left Column */}
        <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] lg:col-span-1" id="borough-allocations-card">
          <div className="mb-6 border-b border-[#1A1A1A] pb-4">
            <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">Geography</span>
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]" id="borough-section-title">Borough Disbursements</h3>
          </div>
          
          <div className="space-y-6" id="borough-list">
            {BOROUGH_DATA.map((borough, index) => {
              const maxVal = Math.max(...BOROUGH_DATA.map(b => b.totalFunds));
              const percentOfMax = (borough.totalFunds / maxVal) * 100;
              // Alternate bar color matching theme
              const barColor = index % 2 === 0 ? "#003B71" : "#F27D26";

              return (
                <div key={index} className="space-y-2" id={`borough-item-${borough.name.toLowerCase().replace(/\s/g, "-")}`}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-serif font-bold text-sm text-[#1A1A1A]">{borough.name}</span>
                    <span className="font-mono text-xs font-black text-[#1A1A1A]">{formatCurrency(borough.totalFunds)}</span>
                  </div>
                  
                  {/* Flat rectangular progress bar */}
                  <div className="w-full h-2 bg-[#E5E3DB] rounded-none overflow-hidden">
                    <div 
                      className="h-full rounded-none" 
                      style={{ width: `${percentOfMax}%`, backgroundColor: barColor }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{borough.allocationsCount} Adoptions</span>
                    <span>Mean Award: {formatCurrency(Math.round(borough.totalFunds / borough.allocationsCount))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Council Discretionary Initiatives Table */}
        <div className="bg-[#F9F8F3] p-6 rounded-none border border-[#1A1A1A] lg:col-span-2 flex flex-col justify-between" id="key-council-initiatives-card">
          <div>
            <div className="mb-6 border-b border-[#1A1A1A] pb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[9px] font-mono font-bold bg-[#F27D26] text-white px-2 py-0.5 uppercase tracking-widest block w-fit mb-2">Legislative Schedule</span>
                <h3 className="text-xl font-serif font-bold text-[#1A1A1A]" id="initiatives-section-title">Schedule C Priority Initiatives</h3>
              </div>
              <div className="text-[10px] font-bold font-mono uppercase tracking-widest border border-[#1A1A1A] px-2.5 py-1">
                Adopted Lines
              </div>
            </div>

            <div className="overflow-x-auto" id="initiatives-table-wrapper">
              <table className="w-full text-left border-collapse text-xs" id="initiatives-table">
                <thead>
                  <tr className="border-b-2 border-[#1A1A1A] text-[#1A1A1A] uppercase text-[10px] font-black tracking-wider">
                    <th className="py-2.5 pr-4">Initiative Name</th>
                    <th className="py-2.5 px-4">Channel</th>
                    <th className="py-2.5 px-4">Target Framework</th>
                    <th className="py-2.5 pl-4 text-right">Avg Award</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E3DB] text-xs font-sans text-[#1A1A1A]" id="initiatives-table-body">
                  {BUDGET_INITIATIVES.map((init, i) => (
                    <tr key={i} className="hover:bg-[#F0EEE6]/40 transition-colors">
                      <td className="py-3 pr-4 font-serif font-bold text-[#1A1A1A]" id={`init-name-${i}`}>{init.name}</td>
                      <td className="py-3 px-4" id={`init-agency-${i}`}>
                        <span className="px-2 py-0.5 font-mono font-bold text-[9px] bg-[#003B71] text-white">
                          {init.agency}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#555] max-w-xs truncate" title={init.description} id={`init-desc-${i}`}>
                        {init.description}
                      </td>
                      <td className="py-3 pl-4 text-right font-mono font-bold text-[#F27D26]" id={`init-avg-${i}`}>
                        {init.averageGrant}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-l-4 border-[#F27D26] bg-[#F0EEE6] p-4 text-[#1A1A1A] rounded-none mt-6" id="grant-readiness-warning">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#F27D26] shrink-0 mt-0.5" />
              <div className="text-xs text-[#1A1A1A] leading-relaxed">
                <span className="font-serif italic font-black block text-sm mb-1">Administrative Mandate for Applicants</span>
                Securing Council discretionary allocations requires formal prequalification in the city's electronic <span className="font-bold underline decoration-[#1A1A1A]">PASSPort System</span> and filing via the official member portal. Discretionary applications typically close in mid-February. Visit the <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Filing & Readiness Guide</span> tab to test your readiness.
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
