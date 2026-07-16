// NYC Council Schedule C Discretionary Funding — real, sourced data.
//
// Every figure in this file is derived from BetaNYC's public Schedule C dataset:
//   https://github.com/BetaNYC/New-York-City-Budget/tree/main/data
// Primary sources per fiscal year (FY09-FY27):
//   data/fy{NN}/schedule_c/fy{NN}_schedule_c_reconciliation.txt  (category totals, GRAND TOTAL, award counts)
//   data/fy{NN}/schedule_c/fy{NN}_schedule_c_awards.csv          (row-level awards: category, member, org, EIN, amount, agency — FY15+)
//   data/fy{NN}/schedule_c/fy{NN}_schedule_c_initiatives.csv     (named initiative programs and totals)
//   data/fy27/capital/fy27_capital_projects.csv                 (capital budget line items, with a real borough code)
//
// Data-quality notes (see BetaNYC's own data/QA-REPORT.md):
// - "GRAND TOTAL" figures use the reconciliation file's "printed" (adopted) column, not the
//   "initiatives" (working-paper) column, since the two differ by a reconciliation variance in
//   some years (see RECONCILIATION_VARIANCES below).
// - Award-level CSVs (agency, EIN, per-grant amount) only exist from FY15 onward. FY09-FY14 are
//   "early-era" filings with category-level totals only — no award count or agency breakdown exists
//   for those years, so those fields are left undefined rather than estimated.
// - In every year's awards.csv, a large share of dollars carries no "agency" tag at all (recorded
//   directly against a category/initiative rather than a specific city agency) — this is preserved
//   honestly below as an "Unattributed" pool rather than force-assigned to an agency.
// - The Schedule C dataset has no borough field for discretionary awards. The one real per-borough
//   breakdown available in this repo is the FY27 capital budget file, which is used for the
//   "Capital Budget by Borough" panel — a different budget instrument than Schedule C, labeled as such.
// - Council district numbers below are parsed directly from each member's own real award records
//   (e.g. "Council District 36" appearing in a program name); the borough each district sits in is
//   standard, stable NYC Council district geography (public record, not sourced from this repo).

export interface AgencyBudget {
  id: string;
  name: string;
  fullName: string;
  totalFunds: number;
  allocationsCount: number;
  averageAward: number;
  color: string;
  description: string;
  keyInitiatives: string[];
}

export interface FocusAreaBudget {
  name: string;
  totalFunds: number;
  percentage: number;
  color: string;
}

export interface CapitalBoroughBudget {
  name: string;
  totalFunds: number;
  allocationsCount: number;
}

export interface BudgetInitiative {
  name: string;
  agency: string;
  description: string;
  averageGrant: string;
  fundingLevel: string;
}

export interface HistoricalTrend {
  year: string;
  totalFunds: number;
  grantsCount?: number;
  avgGrant?: number;
  socialServices: number;
  youthEducation: number;
  artsCulture: number;
  healthWellness: number;
  environmentPublicSpace: number;
}

export interface TrendingTopic {
  topic: string;
  category: string;
  fy2020: number; // In millions
  fy2022: number;
  fy2024: number;
  fy2026: number;
  growthRate: string;
  description: string;
}

// Sourced from BetaNYC Schedule C reconciliation files (GRAND TOTAL "printed" column + awards lines):
//   FY27: data/fy27/schedule_c/fy27_schedule_c_reconciliation.txt (GRAND TOTAL 655,764,999; awards 6,118 rows)
//   FY26: data/fy26/schedule_c/fy26_schedule_c_reconciliation.txt (GRAND TOTAL 665,080,021 printed; awards 5,838 rows)
// Average grant = GRAND TOTAL / awards count. Prev-year fields drive the YoY % change on the ledger cards.
export const NYC_BUDGET_OVERVIEW = {
  fiscalYear: "FY2027",
  priorFiscalYear: "FY2026",
  totalDiscretionary: 655764999,       // FY27 GRAND TOTAL (printed)
  totalDiscretionaryPrev: 665080021,   // FY26 GRAND TOTAL (printed)
  totalAllocations: 6118,              // FY27 awards rows
  totalAllocationsPrev: 5838,          // FY26 awards rows
  averageGrant: 107186,                // 655,764,999 / 6,118
  averageGrantPrev: 113923,            // 665,080,021 / 5,838
  lastUpdated: "FY2027 Adopted Schedule C (BetaNYC reconciliation)",
  sourceRepo: "https://github.com/BetaNYC/New-York-City-Budget",
  sourceFile: "data/fy27/schedule_c/fy27_schedule_c_reconciliation.txt"
};

// Real FY27 agency breakdown, computed directly from fy27_schedule_c_awards.csv (group by `agency`).
// "Unattributed" is not a gap in this dataset — it is the largest single slice ($438.2M / 1,744 rows):
// dollars recorded against a category/initiative in the source CSV with no specific city-agency tag.
// Shown honestly as its own entry rather than folded into a named agency.
export const AGENCY_BUDGET_DATA: AgencyBudget[] = [
  {
    id: "DYCD",
    name: "DYCD",
    fullName: "Department of Youth & Community Development",
    totalFunds: 63062289,
    allocationsCount: 1515,
    averageAward: Math.round(63062289 / 1515),
    color: "#003B71",
    description: "The single largest agency-tagged share of FY27 Schedule C awards: youth programming, after-school services, workforce/job training, and community development lines.",
    keyInitiatives: ["Cultural After-School Adventure (CASA)", "Job Training and Placement Initiative", "Afterschool Enrichment Initiative", "Adult Literacy (NYC RISE)"]
  },
  {
    id: "DCLA",
    name: "DCLA",
    fullName: "Department of Cultural Affairs",
    totalFunds: 35103157,
    allocationsCount: 1223,
    averageAward: Math.round(35103157 / 1223),
    color: "#F27D26",
    description: "Cultural institutions, community arts groups, museums, theaters, and neighborhood arts programming.",
    keyInitiatives: ["Cultural After-School Adventure (CASA)", "SU-CASA", "Coalition Theaters of Color"]
  },
  {
    id: "DSS_HRA",
    name: "DSS/HRA",
    fullName: "Department of Social Services / Human Resources Administration",
    totalFunds: 14268750,
    allocationsCount: 474,
    averageAward: Math.round(14268750 / 474),
    color: "#8F8D83",
    description: "Immigrant legal services, domestic violence support, homelessness prevention, and public-benefits navigation.",
    keyInitiatives: ["Immigrant Legal Providers Support Network", "Domestic Violence and Empowerment (DoVE) Initiative", "Legal Services for Low-Income and Working-Class New Yorkers"]
  },
  {
    id: "DFTA",
    name: "DFTA",
    fullName: "Department for the Aging",
    totalFunds: 12014748,
    allocationsCount: 447,
    averageAward: Math.round(12014748 / 447),
    color: "#134074",
    description: "Senior center programming, case management, and Naturally Occurring Retirement Community (NORC) support.",
    keyInitiatives: ["Naturally Occurring Retirement Communities (NORCs)", "Older Adult Center Improvements", "Social Adult Day Care"]
  },
  {
    id: "DHMH",
    name: "DOHMH",
    fullName: "Department of Health & Mental Hygiene",
    totalFunds: 7041750,
    allocationsCount: 122,
    averageAward: Math.round(7041750 / 122),
    color: "#D46B13",
    description: "Mental health services, opioid prevention, maternal/infant health, and community clinics.",
    keyInitiatives: ["NYC 988 Crisis Intervention and Suicide Prevention Hotline", "Trauma Recovery Centers", "Opioid Prevention and Treatment"]
  },
  {
    id: "DPR",
    name: "DPR",
    fullName: "Department of Parks & Recreation",
    totalFunds: 6205934,
    allocationsCount: 166,
    averageAward: Math.round(6205934 / 166),
    color: "#546A7B",
    description: "Parks programming, greening initiatives, and neighborhood open-space maintenance.",
    keyInitiatives: ["Parks Equity Initiative", "Swim Safety", "NYC Cleanup"]
  },
  {
    id: "SBS",
    name: "SBS",
    fullName: "Department of Small Business Services",
    totalFunds: 5890277,
    allocationsCount: 159,
    averageAward: Math.round(5890277 / 159),
    color: "#B5B3A9",
    description: "Small-business assistance, workforce development, and worker-cooperative support.",
    keyInitiatives: ["Job Training and Placement Initiative", "Day Laborer Workforce Initiative", "MWBE Accelerator"]
  },
  {
    id: "HPD",
    name: "HPD",
    fullName: "Housing Preservation & Development",
    totalFunds: 2852054,
    allocationsCount: 75,
    averageAward: Math.round(2852054 / 75),
    color: "#7B8A7A",
    description: "Tenant advocacy, housing preservation outreach, and foreclosure-prevention counseling.",
    keyInitiatives: ["Community Housing Preservation Strategies", "Stabilizing NYC", "Tax Lien Sale Outreach and Assistance"]
  },
  {
    id: "OTHER",
    name: "Other Agencies",
    fullName: "DCWP, DSNY, DOE, CUNY, DHS, NYPD, FDNY, ACS, and 13 smaller agencies",
    totalFunds: 20432588,
    allocationsCount: 193,
    averageAward: Math.round(20432588 / 193),
    color: "#C84B31",
    description: "Roll-up of every other agency-tagged FY27 award (each individually under $6M), including DCWP, DSNY, DOE, CUNY, HPD-adjacent clerks, DHS, NYPD, FDNY, ACS, NYPL, DOT, QBPL, and borough-president offices.",
    keyInitiatives: ["CUNY Public Service Training Corps", "Community Composting (DSNY)", "Support for Arts Instruction (DOE)"]
  },
  {
    id: "UNATTRIBUTED",
    name: "Unattributed",
    fullName: "Citywide Initiative Pool (no agency tag in source data)",
    totalFunds: 438239865,
    allocationsCount: 1744,
    averageAward: Math.round(438239865 / 1744),
    color: "#546A7B",
    description: "The largest slice of FY27 Schedule C dollars — recorded against a funding category or named initiative in BetaNYC's award-level data, but without a specific city-agency tag. Includes most of the Speaker's Initiative and many multi-agency programs (e.g. \"A Greener NYC\", \"NYC Cleanup\") that span several agencies at once.",
    keyInitiatives: ["Speaker's Initiative to Address Citywide Needs", "New York Immigrant Family Unity Project", "Alternatives to Incarceration and Reentry Programs"]
  }
];

// Real FY27 category breakdown — every category from the Schedule C reconciliation's 25-row
// summary table, sourced from fy27_schedule_c_reconciliation.txt (percentage of the real GRAND TOTAL).
export const FOCUS_AREA_DATA: FocusAreaBudget[] = [
  { name: "Speaker's Initiative to Address Citywide Needs", totalFunds: 86522049, percentage: 13.2, color: "#003B71" },
  { name: "Immigrant Services", totalFunds: 86417141, percentage: 13.2, color: "#F27D26" },
  { name: "Community Development", totalFunds: 45225000, percentage: 6.9, color: "#8F8D83" },
  { name: "Education", totalFunds: 43284300, percentage: 6.6, color: "#134074" },
  { name: "Mental Health Services", totalFunds: 40767110, percentage: 6.2, color: "#D46B13" },
  { name: "Cultural Organizations", totalFunds: 34350000, percentage: 5.2, color: "#546A7B" },
  { name: "Criminal Justice Services", totalFunds: 33470153, percentage: 5.1, color: "#B5B3A9" },
  { name: "Small Business Services and Workforce Development", totalFunds: 33252902, percentage: 5.1, color: "#7B8A7A" },
  { name: "Older Adult Services", totalFunds: 31990323, percentage: 4.9, color: "#C84B31" },
  { name: "All Other Categories (16 lines)", totalFunds: 220486021, percentage: 33.6, color: "#D9A406" }
];

// Real FY27 capital budget by borough — data/fy27/capital/fy27_capital_projects.csv, grouped by the
// file's own `boro` field (K/Q/M/X/R). This is capital construction funding, a different budget
// instrument than Schedule C discretionary awards (which has no borough field in the source data),
// so it is labeled distinctly below rather than presented as a Schedule C borough breakdown.
export const CAPITAL_BY_BOROUGH: CapitalBoroughBudget[] = [
  { name: "Manhattan", totalFunds: 303755000, allocationsCount: 379 },
  { name: "Queens", totalFunds: 265423000, allocationsCount: 348 },
  { name: "Brooklyn", totalFunds: 239109000, allocationsCount: 341 },
  { name: "Bronx", totalFunds: 172733000, allocationsCount: 217 },
  { name: "Staten Island", totalFunds: 82139000, allocationsCount: 101 },
  { name: "Citywide", totalFunds: 356000, allocationsCount: 2 }
];

// Real named initiatives, cross-referenced between fy27_schedule_c_initiatives.csv (program totals)
// and fy27_schedule_c_awards.csv (award-level $ range, used for "Average Grant").
export const BUDGET_INITIATIVES: BudgetInitiative[] = [
  {
    name: "Cultural After-School Adventures (CASA)",
    agency: "DCLA / DYCD",
    description: "781 real FY27 awards, every one exactly $20,000 — funds arts and cultural programs in public schools after school, one CASA award per council member.",
    averageGrant: "$20,000 (fixed)",
    fundingLevel: "Very High Opportunity (781 awards)"
  },
  {
    name: "NYC Cleanup",
    agency: "DPR / DSNY / DCLA / DYCD / DOE / SBS",
    description: "Multi-agency neighborhood cleanup and beautification program; 197 real FY27 awards ranging from small community grants to larger district-wide contracts.",
    averageGrant: "$5,000 - $280,000",
    fundingLevel: "High Opportunity (197 awards)"
  },
  {
    name: "Naturally Occurring Retirement Communities (NORCs)",
    agency: "DFTA",
    description: "Supportive service programs in housing complexes with high densities of older adults; 35 real FY27 awards.",
    averageGrant: "$10,000 - $2,078,463",
    fundingLevel: "Moderate Opportunity (35 awards)"
  },
  {
    name: "Legal Services for Low-Income and Working-Class New Yorkers",
    agency: "DSS/HRA",
    description: "Civil legal aid and tenant/worker advocacy organizations; 19 real FY27 awards.",
    averageGrant: "$30,000 - $2,100,000",
    fundingLevel: "Moderate Opportunity (19 awards)"
  },
  {
    name: "Job Training and Placement Initiative",
    agency: "DYCD / SBS",
    description: "Workforce development and job placement programs; 9 real FY27 awards.",
    averageGrant: "$25,000 - $5,255,000",
    fundingLevel: "Selective Opportunity (9 awards)"
  }
];

// Real 19-year historical timeline (FY09-FY27), parsed from every year's Schedule C reconciliation
// file — organized, sourced copies of which live in this repo under
// data/schedule-c-reconciliation/ (fyNN.json, parsed from BetaNYC's fyNN_schedule_c_reconciliation.txt,
// plus raw/fyNN.txt for the original text and index.json for a quick cross-reference).
// `totalFunds` is the GRAND TOTAL (printed/adopted column) for every year — 100% real, 100% of the time.
// `grantsCount` is the real, sourced "awards: N rows" count from each year's reconciliation file, and is
// populated for FY2015-FY2027 (every year that has an award/EIN-level breakdown at all). FY2009-FY2014
// ("early-era" filings) are the only years left undefined: those source PDFs reconcile at the
// initiative-line level only (see `initiativesRowCount` in the JSON files) and never emitted an
// award-level table, so there is no real per-grant count to report for those six years.
// `avgGrant` = totalFunds / grantsCount, matching the convention already used for the FY2027 ledger
// card. Award-level dollar coverage (the sum of individually-attributed awards) is well below 100% of
// totalFunds in most years — see the README in data/schedule-c-reconciliation/ for the coverage caveat.
// Sector splits (socialServices/youthEducation/artsCulture/healthWellness/environmentPublicSpace) are
// a full, 100%-reconciled partition of every year's real category table into 5 buckets — every
// category name across all 19 years (including legacy names like "Senior Services" or "Youth and
// Community Development") is mapped to exactly one bucket; see BetaNYC/New-York-City-Budget analysis.
export const HISTORICAL_TREND_DATA: HistoricalTrend[] = [
  { year: "FY2009", totalFunds: 363383804, socialServices: 66729055, youthEducation: 206270000, artsCulture: 21800000, healthWellness: 67584749, environmentPublicSpace: 1000000 },
  { year: "FY2010", totalFunds: 313771129, socialServices: 81721129, youthEducation: 91197000, artsCulture: 71898000, healthWellness: 67955000, environmentPublicSpace: 1000000 },
  { year: "FY2011", totalFunds: 317676672, socialServices: 131759422, youthEducation: 82245000, artsCulture: 66827000, healthWellness: 29024750, environmentPublicSpace: 7820500 },
  { year: "FY2012", totalFunds: 276092050, socialServices: 118211760, youthEducation: 47520000, artsCulture: 96348790, healthWellness: 6191000, environmentPublicSpace: 7820500 },
  { year: "FY2013", totalFunds: 312874891, socialServices: 140834154, youthEducation: 94438237, artsCulture: 33800000, healthWellness: 24582500, environmentPublicSpace: 19220000 },
  { year: "FY2014", totalFunds: 304793605, socialServices: 156147004, youthEducation: 85325000, artsCulture: 28749000, healthWellness: 30135601, environmentPublicSpace: 4437000 },
  { year: "FY2015", totalFunds: 233438000, grantsCount: 652, avgGrant: 358034, socialServices: 87460000, youthEducation: 102683000, artsCulture: 14600000, healthWellness: 13295000, environmentPublicSpace: 15400000 },
  { year: "FY2016", totalFunds: 333886574, grantsCount: 335, avgGrant: 996676, socialServices: 232953919, youthEducation: 17052000, artsCulture: 18821000, healthWellness: 48131855, environmentPublicSpace: 16927800 },
  { year: "FY2017", totalFunds: 279908300, grantsCount: 364, avgGrant: 768979, socialServices: 180699881, youthEducation: 33096000, artsCulture: 27314500, healthWellness: 17107334, environmentPublicSpace: 21690585 },
  { year: "FY2018", totalFunds: 302086000, grantsCount: 480, avgGrant: 629346, socialServices: 191746559, youthEducation: 31266000, artsCulture: 36199500, healthWellness: 20795800, environmentPublicSpace: 22078141 },
  { year: "FY2019", totalFunds: 338301000, grantsCount: 846, avgGrant: 399883, socialServices: 218362097, youthEducation: 32195000, artsCulture: 28422879, healthWellness: 46068024, environmentPublicSpace: 13253000 },
  { year: "FY2020", totalFunds: 404372774, grantsCount: 2841, avgGrant: 142335, socialServices: 258295521, youthEducation: 50970000, artsCulture: 31582879, healthWellness: 50286024, environmentPublicSpace: 13238350 },
  { year: "FY2021", totalFunds: 304268931, grantsCount: 1810, avgGrant: 168104, socialServices: 187762635, youthEducation: 20850256, artsCulture: 41997724, healthWellness: 41371716, environmentPublicSpace: 12286600 },
  { year: "FY2022", totalFunds: 465728895, grantsCount: 1492, avgGrant: 312151, socialServices: 325305234, youthEducation: 21550000, artsCulture: 35797879, healthWellness: 54512432, environmentPublicSpace: 28563350 },
  { year: "FY2023", totalFunds: 486446095, grantsCount: 1848, avgGrant: 263228, socialServices: 247389337, youthEducation: 83928217, artsCulture: 49595000, healthWellness: 81040041, environmentPublicSpace: 24493500 },
  { year: "FY2024", totalFunds: 471875565, grantsCount: 5368, avgGrant: 87905, socialServices: 256683683, youthEducation: 61736169, artsCulture: 50050000, healthWellness: 78185113, environmentPublicSpace: 25220600 },
  { year: "FY2025", totalFunds: 534913682, grantsCount: 5646, avgGrant: 94742, socialServices: 306066473, youthEducation: 64436169, artsCulture: 50050000, healthWellness: 82895440, environmentPublicSpace: 31465600 },
  { year: "FY2026", totalFunds: 665080021, grantsCount: 5838, avgGrant: 113923, socialServices: 406587864, youthEducation: 94653217, artsCulture: 34350000, healthWellness: 98495440, environmentPublicSpace: 30993500 },
  { year: "FY2027", totalFunds: 655764999, grantsCount: 6118, avgGrant: 107186, socialServices: 395837843, youthEducation: 94513217, artsCulture: 34350000, healthWellness: 99320439, environmentPublicSpace: 31743500 }
];

// Real category-level growth, FY2020 -> FY2026, parsed directly from each year's reconciliation
// category table (fy20/fy22/fy24/fy26_schedule_c_reconciliation.txt).
export const TRENDING_TOPICS_DATA: TrendingTopic[] = [
  {
    topic: "Immigrant Services",
    category: "Social Services",
    fy2020: 12.5, fy2022: 13.6, fy2024: 30.8, fy2026: 86.1,
    growthRate: "+589.3%",
    description: "Real Schedule C category total. Grew from $12.5M (FY20) to $86.1M (FY26) as immigrant legal-services and rapid-response initiatives expanded sharply."
  },
  {
    topic: "Food Initiatives",
    category: "Social Services",
    fy2020: 2.5, fy2022: 25.7, fy2024: 10.9, fy2026: 27.0,
    growthRate: "+977.5%",
    description: "Real Schedule C category total. Rose from $2.5M (FY20) to $27.0M (FY26), reflecting expanded food-pantry and community-food-access funding."
  },
  {
    topic: "Mental Health Services",
    category: "Health & Wellness",
    fy2020: 5.1, fy2022: 5.1, fy2024: 24.5, fy2026: 40.6,
    growthRate: "+694.8%",
    description: "Real Schedule C category total. Jumped from $5.1M (FY20/FY22) to $40.6M (FY26) with new crisis-hotline and youth mental-health lines."
  },
  {
    topic: "Cultural Organizations",
    category: "Arts & Culture",
    fy2020: 12.3, fy2022: 13.9, fy2024: 34.4, fy2026: 34.4,
    growthRate: "+180.3%",
    description: "Real Schedule C category total. Grew from $12.3M (FY20) to $34.4M (FY24-26), where it has held steady for two consecutive fiscal years."
  },
  {
    topic: "Criminal Justice Services",
    category: "Public Safety",
    fy2020: 31.9, fy2022: 33.9, fy2024: 28.7, fy2026: 33.4,
    growthRate: "+4.8%",
    description: "Real Schedule C category total. The most stable of the tracked categories — funding has stayed in the $29M-$34M range every year since FY20."
  }
];

// Real NYC Council members who sponsored FY27 Schedule C awards (data/fy27/schedule_c/fy27_schedule_c_awards.csv,
// `member` column, ranked by total sponsored dollars). District numbers are parsed directly from each
// member's own award program text (e.g. "...- Council District 36"); borough is standard NYC Council
// district geography (public record — not itself a field in the BetaNYC dataset).
export interface CouncilMemberRoster {
  name: string;
  district: number;
  borough: string;
}

export const COUNCIL_ROSTER: CouncilMemberRoster[] = [
  { name: "Osse", district: 36, borough: "Brooklyn" },
  { name: "Brewer", district: 6, borough: "Manhattan" },
  { name: "Caban", district: 22, borough: "Queens" },
  { name: "Restler", district: 33, borough: "Brooklyn" },
  { name: "Brooks-Powers", district: 31, borough: "Queens" }
];

// Real organizations that received FY27 Schedule C awards, with real EINs (data/fy27/schedule_c/fy27_schedule_c_awards.csv).
export interface OrgProfile {
  name: string;
  ein: string;
  borough: string;
  primaryMission: string;
}

export const ORG_PROFILES: OrgProfile[] = [
  { name: "Girls Who Code, Inc.", ein: "30-0728021", borough: "Citywide", primaryMission: "Coding education and computer-science pathways for girls and young women." },
  { name: "Bronx River Art Center, Inc.", ein: "13-3261148", borough: "Bronx", primaryMission: "Community arts education, exhibitions, and youth arts programming in the Bronx." },
  { name: "SCAN-Harbor, Inc.", ein: "13-2912963", borough: "Bronx / Multi-Borough", primaryMission: "Youth development, school-based programming, and community-center services." },
  { name: "Doe Fund, Inc., The", ein: "13-3412540", borough: "Citywide", primaryMission: "Workforce development and transitional employment (Ready, Willing & Able) for people rebuilding self-sufficiency." },
  { name: "Open Space Alliance for North Brooklyn, Inc.", ein: "01-0849087", borough: "Brooklyn", primaryMission: "Parks stewardship and open-space programming in North Brooklyn (McCarren Park and beyond)." }
];

// Detailed response generator structures for the Interactive Historical Audit Desk.
// Every organization, EIN, council member, dollar amount, and program description below is pulled
// directly from BetaNYC's real award-level CSVs (FY15-FY27) or the FY27 capital-projects CSV — none
// of it is invented. Two features present in earlier drafts of this app had no basis anywhere in the
// source repository and have been removed rather than replaced with equally fake "real-looking" data:
// per-organization mid-year "Transparency Resolution" rescission narratives, and Legistar/legislative
// file numbers. In their place, Q3 now surfaces the real reconciliation variances BetaNYC's own
// parser flags between each year's "initiatives" worksheet and the "printed" adopted Schedule C.
export const AUDIT_RESPONSES = {
  // 1. Real FY27 member-item awards sponsored by each roster member (top 5 by dollar amount).
  cmExpenseCurrent: {
    "Osse": [
      { organization: "Association of Community Employment Programs for the Homeless, Inc.", ein: "13-3846431", purpose: "Council District 36", amount: 110000, agency: "DYCD" },
      { organization: "Justice Innovation, Inc.", ein: "85-2810883", purpose: "Council District 36", amount: 85000, agency: "DSS/HRA" },
      { organization: "Bridge Street Development Corporation", ein: "11-3250772", purpose: "Quincy Senior Center - Council District 36", amount: 77500, agency: "DFTA" },
      { organization: "Council on the Environment, Inc.", ein: "13-2765465", purpose: "Fresh Produce Box Program - Council District 36", amount: 50000, agency: "DYCD" },
      { organization: "Urban Justice Center", ein: "13-3442022", purpose: "Council District 36", amount: 45000, agency: "DSS/HRA" }
    ],
    "Caban": [
      { organization: "Association of Community Employment Programs for the Homeless, Inc.", ein: "13-3846431", purpose: "Sanitation Services - Council District 22", amount: 260000, agency: "DYCD" },
      { organization: "Spanish Speaking Elderly Council - RAICES", ein: "11-2730462", purpose: "NYCHA Astoria Houses Campus - Older Adult Services", amount: 48000, agency: "DFTA" },
      { organization: "Child Center of NY, Inc., The", ein: "11-1733454", purpose: "Domestic Violence & Empowerment Programming - Council District 22", amount: 45000, agency: "DSS/HRA" },
      { organization: "Arab-American Family Support Center, Inc., The", ein: "11-3167245", purpose: "Anti-Violence Programming - Council District 22", amount: 40000, agency: "DSS/HRA" },
      { organization: "Violence Intervention Program", ein: "13-3540337", purpose: "Restorative Justice Program - Council District 22", amount: 30000, agency: "DYCD" }
    ],
    "Brewer": [
      { organization: "Goddard Riverside Community Center", ein: "13-1893908", purpose: "Greenkeepers & TOP Opportunities - Council District 6", amount: 250000, agency: "DYCD" },
      { organization: "American Museum of Natural History", ein: "13-6162659", purpose: "Cultural Workforce Pathways", amount: 225000, agency: "DCLA" },
      { organization: "Goddard Riverside Community Center", ein: "13-1893908", purpose: "Creating Opportunities for Amsterdam", amount: 100000, agency: "DYCD" }
    ],
    "Restler": [
      { organization: "Association of Community Employment Programs for the Homeless, Inc.", ein: "13-3846431", purpose: "Sanitation Cleanup - Council District 33", amount: 160000, agency: "DYCD" },
      { organization: "Southside United Housing Development Fund Corporation", ein: "23-7439716", purpose: "Council District 33", amount: 150000, agency: "HPD" }
    ],
    "Brooks-Powers": [
      { organization: "City University of New York", ein: "13-3893536", purpose: "CUNY School of Urban and Labor Studies", amount: 177000, agency: "CUNY" }
    ]
  } as Record<string, Array<{ organization: string; ein: string; purpose: string; amount: number; agency: string }>>,

  // 2. Real per-member sponsored awards across FY2024-FY2027 (top 2 by dollar amount per year).
  cmExpenseHistory: {
    "Osse": [
      { fy: "FY2024", organization: "Department of Sanitation", purpose: "Cleanup Services - Council District 36", amount: 128750, agency: "DSNY" },
      { fy: "FY2024", organization: "Bridge Street Development Corporation", purpose: "Council District 36", amount: 92500, agency: "DFTA" },
      { fy: "FY2025", organization: "Department of Sanitation", purpose: "Supplemental Sanitation Services - Council District 36", amount: 128750, agency: "DSNY" },
      { fy: "FY2026", organization: "BRIC Arts Media Brooklyn, Inc.", purpose: "Council District 36", amount: 200000, agency: "DCLA" },
      { fy: "FY2027", organization: "Association of Community Employment Programs for the Homeless, Inc.", purpose: "Council District 36", amount: 110000, agency: "DYCD" }
    ],
    "Caban": [
      { fy: "FY2024", organization: "Association of Community Employment Programs for the Homeless, Inc.", purpose: "Sanitation Services - Council District 22", amount: 260000, agency: "DYCD" },
      { fy: "FY2025", organization: "Queensboro Council for Social Welfare, Inc.", purpose: "Domestic Violence Education Program", amount: 60000, agency: "DSS/HRA" },
      { fy: "FY2026", organization: "Association of Community Employment Programs for the Homeless, Inc.", purpose: "Sanitation Services - Council District 22", amount: 260000, agency: "DYCD" },
      { fy: "FY2027", organization: "Association of Community Employment Programs for the Homeless, Inc.", purpose: "Sanitation Services - Council District 22", amount: 260000, agency: "DYCD" }
    ],
    "Brewer": [
      { fy: "FY2024", organization: "Goddard Riverside Community Center", purpose: "Green Keepers/TOP Opportunities", amount: 200000, agency: "DYCD" },
      { fy: "FY2025", organization: "Goddard Riverside Community Center", purpose: "Green Keepers/TOP Opportunities - Council District 6", amount: 200000, agency: "DYCD" },
      { fy: "FY2026", organization: "Goddard Riverside Community Center", purpose: "Green Keepers/TOP Opportunities - Council District 6", amount: 200000, agency: "DYCD" },
      { fy: "FY2027", organization: "Goddard Riverside Community Center", purpose: "Greenkeepers & TOP Opportunities - Council District 6", amount: 250000, agency: "DYCD" }
    ],
    "Restler": [
      { fy: "FY2024", organization: "Association of Community Employment Programs for the Homeless, Inc.", purpose: "Council District 33", amount: 135000, agency: "DYCD" },
      { fy: "FY2025", organization: "Southside United Housing Development Fund Corporation", purpose: "Council District 33", amount: 150000, agency: "HPD" },
      { fy: "FY2026", organization: "ExpandED Schools, Inc.", purpose: "High-Impact Tutoring", amount: 300000, agency: "DYCD" },
      { fy: "FY2027", organization: "Association of Community Employment Programs for the Homeless, Inc.", purpose: "Sanitation Cleanup - Council District 33", amount: 160000, agency: "DYCD" }
    ],
    "Brooks-Powers": [
      { fy: "FY2024", organization: "Association of Community Employment Programs for the Homeless, Inc.", purpose: "Council District 31", amount: 85000, agency: "DYCD" },
      { fy: "FY2025", organization: "City University of New York", purpose: "CUNY School of Urban and Labor Studies", amount: 177000, agency: "CUNY" },
      { fy: "FY2026", organization: "City University of New York", purpose: "CUNY School of Urban and Labor Studies", amount: 177000, agency: "CUNY" },
      { fy: "FY2027", organization: "City University of New York", purpose: "CUNY School of Urban and Labor Studies", amount: 177000, agency: "CUNY" }
    ]
  } as Record<string, Array<{ fy: string; organization: string; purpose: string; amount: number; agency: string }>>,

  // 3. Real reconciliation variances: every year where BetaNYC's own reconciliation flagged a
  // difference between a category's "initiatives" worksheet total and its "printed" adopted total
  // (data/fy{NN}/schedule_c/fy{NN}_schedule_c_reconciliation.txt, "DIFF" rows). This replaces a
  // fabricated per-organization "Transparency Resolution" narrative with the real, dated variance
  // ledger BetaNYC's parser actually produces.
  reconciliationVariances: [
    { fy: "FY2009", category: "Health Services and Prevention", initiatives: 25531000, printed: 26031000, diff: -500000 },
    { fy: "FY2011", category: "Education", initiatives: 21205000, printed: 20955000, diff: 250000 },
    { fy: "FY2016", category: "Criminal Justice Services", initiatives: 14957500, printed: 15657500, diff: -700000 },
    { fy: "FY2017", category: "Mental Health Services", initiatives: 11895534, printed: 11895334, diff: 200 },
    { fy: "FY2018", category: "Children's Services", initiatives: 14360000, printed: 14460000, diff: -100000 },
    { fy: "FY2022", category: "Veterans Services", initiatives: 5120500, printed: 5835000, diff: -714500 },
    { fy: "FY2024", category: "Criminal Justice Services", initiatives: 28711645, printed: 28658710, diff: 52935 },
    { fy: "FY2025", category: "Education", initiatives: 39974300, printed: 39924300, diff: 50000 },
    { fy: "FY2026", category: "Immigrant Services", initiatives: 86092141, printed: 86091341, diff: 800 }
  ] as Array<{ fy: string; category: string; initiatives: number; printed: number; diff: number }>,

  // 4. Real FY27 capital projects by sponsor (data/fy27/capital/fy27_capital_projects.csv).
  // Osse and Caban have no recorded capital projects in the FY27 file — shown as a real, empty result
  // rather than substituted with placeholder projects.
  capitalProjects: {
    "Brewer": [
      { project: "AMNH Roof Replacement", amount: 4000000, agency: "Cultural Institutions", boro: "Manhattan" },
      { project: "The Met Improved Accessibility and Mobility", amount: 3000000, agency: "Cultural Institutions", boro: "Manhattan" },
      { project: "Metropolitan Opera Fly System Pipes", amount: 2350000, agency: "Cultural Institutions", boro: "Manhattan" }
    ],
    "Restler": [
      { project: "Goodwill NY/NJ Brooklyn HQ/Service Center Purchase", amount: 2500000, agency: "Human Resources", boro: "Brooklyn" },
      { project: "I.S. 318 Supplemental Cooling", amount: 800000, agency: "Education", boro: "Brooklyn" },
      { project: "The Noel Pointer Foundation", amount: 642000, agency: "Cultural Institutions", boro: "Brooklyn" }
    ],
    "Brooks-Powers": [
      { project: "Brookville Park Recreation Center", amount: 5000000, agency: "Parks", boro: "Queens" },
      { project: "Queens United Middle School Gym Supplemental Cooling", amount: 1000000, agency: "Education", boro: "Queens" },
      { project: "Springfield Gardens Phase 5", amount: 500000, agency: "Highways", boro: "Queens" }
    ],
    "Osse": [],
    "Caban": []
  } as Record<string, Array<{ project: string; amount: number; agency: string; boro: string }>>,

  // 6. Real lifetime EIN-level funding, FY2015-FY2027 — every year and dollar figure below comes from
  // matching each organization's real EIN across 13 years of fy{NN}_schedule_c_awards.csv. Years with
  // no matching award are real absences (not gaps in tracking), shown as $0.
  lifetimeFunding: {
    "Girls Who Code, Inc.": {
      ein: "30-0728021",
      total: 624356,
      years: [
        { fy: "FY2015", amount: 0, note: "No award on record" },
        { fy: "FY2016", amount: 0, note: "No award on record" },
        { fy: "FY2017", amount: 0, note: "No award on record" },
        { fy: "FY2018", amount: 0, note: "No award on record" },
        { fy: "FY2019", amount: 50000, note: "1 award" },
        { fy: "FY2020", amount: 70000, note: "1 award" },
        { fy: "FY2021", amount: 63000, note: "1 award" },
        { fy: "FY2022", amount: 70000, note: "1 award" },
        { fy: "FY2023", amount: 70000, note: "1 award" },
        { fy: "FY2024", amount: 75339, note: "1 award" },
        { fy: "FY2025", amount: 75339, note: "1 award" },
        { fy: "FY2026", amount: 75339, note: "1 award" },
        { fy: "FY2027", amount: 75339, note: "1 award" }
      ]
    },
    "Bronx River Art Center, Inc.": {
      ein: "13-3261148",
      total: 460000,
      years: [
        { fy: "FY2015", amount: 0, note: "No award on record" },
        { fy: "FY2016", amount: 0, note: "No award on record" },
        { fy: "FY2017", amount: 0, note: "No award on record" },
        { fy: "FY2018", amount: 0, note: "No award on record" },
        { fy: "FY2019", amount: 0, note: "No award on record" },
        { fy: "FY2020", amount: 10000, note: "1 award (sponsor: Diaz)" },
        { fy: "FY2021", amount: 50000, note: "1 award" },
        { fy: "FY2022", amount: 0, note: "No award on record" },
        { fy: "FY2023", amount: 60000, note: "1 award" },
        { fy: "FY2024", amount: 95000, note: "3 awards (sponsors: Stevens, Velazquez)" },
        { fy: "FY2025", amount: 85000, note: "3 awards (sponsors: Dinowitz, Feliz)" },
        { fy: "FY2026", amount: 85000, note: "3 awards (sponsors: Dinowitz, Feliz)" },
        { fy: "FY2027", amount: 75000, note: "2 awards (sponsor: Feliz)" }
      ]
    },
    "SCAN-Harbor, Inc.": {
      ein: "13-2912963",
      total: 1460203,
      years: [
        { fy: "FY2015", amount: 20000, note: "1 award" },
        { fy: "FY2016", amount: 721200, note: "2 awards" },
        { fy: "FY2017", amount: 0, note: "No award on record" },
        { fy: "FY2018", amount: 80000, note: "1 award" },
        { fy: "FY2019", amount: 0, note: "No award on record" },
        { fy: "FY2020", amount: 80000, note: "1 award" },
        { fy: "FY2021", amount: 102000, note: "2 awards (sponsor: Gibson)" },
        { fy: "FY2022", amount: 102000, note: "2 awards (sponsor: Gibson)" },
        { fy: "FY2023", amount: 20000, note: "1 award (sponsor: Stevens)" },
        { fy: "FY2024", amount: 110000, note: "3 awards" },
        { fy: "FY2025", amount: 145003, note: "5 awards (sponsors: Ayala, Bronx Delegation)" },
        { fy: "FY2026", amount: 0, note: "No award on record" },
        { fy: "FY2027", amount: 80000, note: "2 awards" }
      ]
    },
    "Doe Fund, Inc., The": {
      ein: "13-3412540",
      total: 768250,
      years: [
        { fy: "FY2015", amount: 43750, note: "2 awards (sponsor: Rosenthal)" },
        { fy: "FY2016", amount: 0, note: "No award on record" },
        { fy: "FY2017", amount: 0, note: "No award on record" },
        { fy: "FY2018", amount: 0, note: "No award on record" },
        { fy: "FY2019", amount: 0, note: "No award on record" },
        { fy: "FY2020", amount: 20000, note: "1 award (sponsor: Eugene)" },
        { fy: "FY2021", amount: 0, note: "No award on record" },
        { fy: "FY2022", amount: 150000, note: "1 award (sponsor: Gennaro)" },
        { fy: "FY2023", amount: 250000, note: "1 award" },
        { fy: "FY2024", amount: 140000, note: "2 awards (sponsors: Mealy, Stevens)" },
        { fy: "FY2025", amount: 20000, note: "1 award (sponsor: Bottcher)" },
        { fy: "FY2026", amount: 64500, note: "3 awards (sponsors: Bottcher, Salaam)" },
        { fy: "FY2027", amount: 80000, note: "3 awards (sponsors: Mealy, Salaam, Wilson)" }
      ]
    },
    "Open Space Alliance for North Brooklyn, Inc.": {
      ein: "01-0849087",
      total: 328000,
      years: [
        { fy: "FY2015", amount: 0, note: "No award on record" },
        { fy: "FY2016", amount: 0, note: "No award on record" },
        { fy: "FY2017", amount: 0, note: "No award on record" },
        { fy: "FY2018", amount: 0, note: "No award on record" },
        { fy: "FY2019", amount: 0, note: "No award on record" },
        { fy: "FY2020", amount: 28000, note: "2 awards (sponsor: Levin)" },
        { fy: "FY2021", amount: 0, note: "No award on record" },
        { fy: "FY2022", amount: 0, note: "No award on record" },
        { fy: "FY2023", amount: 0, note: "No award on record" },
        { fy: "FY2024", amount: 75000, note: "4 awards (sponsors: Brooklyn Delegation, Restler)" },
        { fy: "FY2025", amount: 80000, note: "4 awards (sponsor: Restler)" },
        { fy: "FY2026", amount: 65000, note: "3 awards (sponsors: Gutierrez, Restler)" },
        { fy: "FY2027", amount: 80000, note: "3 awards (sponsors: Gutierrez, Restler)" }
      ]
    }
  } as Record<string, { ein: string; total: number; years: Array<{ fy: string; amount: number; note: string }> }>
};
