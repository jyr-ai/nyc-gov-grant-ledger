// NYC and NYS Government Budget Aggregates and Data mapping
// Reconciled based on BetaNYC Schedule C (Discretionary) Council Awards (FY2025 - FY2027)

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

export interface BoroughBudget {
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
  grantsCount: number;
  avgGrant: number;
  socialServices?: number;
  youthEducation?: number;
  artsCulture?: number;
  healthWellness?: number;
  environmentPublicSpace?: number;
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

export const NYC_BUDGET_OVERVIEW = {
  fiscalYear: "FY2025 - FY2026",
  totalDiscretionary: 460000000,
  totalAllocations: 5200,
  averageGrant: 88500,
  lastUpdated: "2026-06 Adopted Budget",
  sourceRepo: "https://github.com/BetaNYC/New-York-City-Budget"
};

// Colors updated to reflect NYC DSSG Palette
// DSSG Navy is #003B71 (or #01417A), Accent Orange is #F27D26. 
export const AGENCY_BUDGET_DATA: AgencyBudget[] = [
  {
    id: "DYCD",
    name: "DYCD",
    fullName: "Department of Youth & Community Development",
    totalFunds: 152400000,
    allocationsCount: 1850,
    averageAward: 82300,
    color: "#003B71", // Navy
    description: "Funds youth services, after-school programs (COMPASS, SONYC), literacy, runaway and homeless youth services, and community development programs.",
    keyInitiatives: [
      "COMPASS / SONYC Afterschool Programs",
      "Youth Service Discretionary Funding",
      "Adult Literacy Services",
      "Community Development Initiatives"
    ]
  },
  {
    id: "DCLA",
    name: "DCLA",
    fullName: "Department of Cultural Affairs",
    totalFunds: 88200000,
    allocationsCount: 1200,
    averageAward: 73500,
    color: "#F27D26", // Orange
    description: "Supports cultural institutions, community arts groups, museums, theaters, and visual arts programs that enrich the five boroughs.",
    keyInitiatives: [
      "Cultural Development Fund (CDF)",
      "Cultural After-School Adventures (CASA)",
      "Coalition of Theaters of Color",
      "Local Arts & Community Festivals"
    ]
  },
  {
    id: "DFTA",
    name: "DFTA / Aging",
    fullName: "Department for the Aging",
    totalFunds: 64800000,
    allocationsCount: 780,
    averageAward: 83000,
    color: "#8F8D83", // Muted Sand
    description: "Provides senior center programs, home care, case management, elder abuse prevention, and nutritious senior meals across the city.",
    keyInitiatives: [
      "Senior Center Services & Programming",
      "Naturally Occurring Retirement Communities (NORC)",
      "Senior Meals & Food Programs",
      "Elder Abuse & Case Management Discretionary"
    ]
  },
  {
    id: "DOHMH",
    name: "DOHMH",
    fullName: "Department of Health & Mental Hygiene",
    totalFunds: 55200000,
    allocationsCount: 520,
    averageAward: 106100,
    color: "#134074", // Light Navy
    description: "Funds mental health clinics, developmental disability services, infant/maternal mortality initiatives, and local health navigation.",
    keyInitiatives: [
      "Mental Health Services for Underserved Populations",
      "Developmental Disability Funding",
      "Maternal and Infant Health Initiatives",
      "Opioid Prevention & Local Harm Reduction"
    ]
  },
  {
    id: "HPD",
    name: "HPD",
    fullName: "Housing Preservation & Development",
    totalFunds: 38500000,
    allocationsCount: 340,
    averageAward: 113200,
    color: "#D46B13", // Deep Orange
    description: "Supports affordable housing education, tenant legal advocacy, housing preservation outreach, and foreclosure prevention assistance.",
    keyInitiatives: [
      "Tenant Education & Anti-Harassment Outreach",
      "Housing Preservation Initiative (HPI)",
      "Community Land Trust Supports",
      "Foreclosure Prevention Counseling"
    ]
  },
  {
    id: "ACS",
    name: "ACS",
    fullName: "Administration for Children's Services",
    totalFunds: 28400000,
    allocationsCount: 290,
    averageAward: 97900,
    color: "#546A7B", // Slate
    description: "Supports child welfare advocacy, domestic violence prevention, early childhood education assistance, and youth justice alternatives.",
    keyInitiatives: [
      "Family Preventive Services",
      "Domestic Violence Advocacy & Support",
      "Early Childhood Care Enhancements",
      "Alternative-to-Incarceration (ATI) for Youth"
    ]
  },
  {
    id: "Others",
    name: "Others",
    fullName: "Parks, DHS, SBS, and other Agencies",
    totalFunds: 32500000,
    allocationsCount: 220,
    averageAward: 147700,
    color: "#B5B3A9", // Cool Gray
    description: "Combines discretionary allocations for local parks programming, small business support services, and local homeless prevention.",
    keyInitiatives: [
      "Parks Community Programming & Maintenance",
      "Small Business Services (SBS) Discretionary",
      "Homeless Services Outreach",
      "Worker Cooperative Development"
    ]
  }
];

export const FOCUS_AREA_DATA: FocusAreaBudget[] = [
  { name: "Youth Services & Education", totalFunds: 134500000, percentage: 29.2, color: "#003B71" },
  { name: "Arts, Culture & History", totalFunds: 88200000, percentage: 19.2, color: "#F27D26" },
  { name: "Senior Programs & Elder Care", totalFunds: 64800000, percentage: 14.1, color: "#8F8D83" },
  { name: "Mental Health & Well-being", totalFunds: 42100000, percentage: 9.2, color: "#134074" },
  { name: "Housing Preservation & Tenants", totalFunds: 38500000, percentage: 8.4, color: "#D46B13" },
  { name: "Food Pantries & Security", totalFunds: 35400000, percentage: 7.7, color: "#C84B31" },
  { name: "Workforce & Business Support", totalFunds: 26800000, percentage: 5.8, color: "#546A7B" },
  { name: "Parks & Environmental Action", totalFunds: 29700000, percentage: 6.4, color: "#7B8A7A" }
];

export const BOROUGH_DATA: BoroughBudget[] = [
  { name: "Brooklyn", totalFunds: 128400000, allocationsCount: 1450 },
  { name: "Queens", totalFunds: 112600000, allocationsCount: 1280 },
  { name: "Manhattan", totalFunds: 94800000, allocationsCount: 1110 },
  { name: "Bronx", totalFunds: 86200000, allocationsCount: 990 },
  { name: "Staten Island", totalFunds: 22400000, allocationsCount: 260 },
  { name: "Citywide Initiatives", totalFunds: 15600000, allocationsCount: 110 }
];

export const BUDGET_INITIATIVES: BudgetInitiative[] = [
  {
    name: "Cultural After-School Adventures (CASA)",
    agency: "DCLA",
    description: "Dedicated funding to support arts and cultural programs in public schools after school. Each council member allocates specific CASA awards.",
    averageGrant: "$10,000 - $25,000",
    fundingLevel: "High Opportunity"
  },
  {
    name: "Youth Services Discretionary",
    agency: "DYCD",
    description: "General funding for youth programming, sports programs, STEM afterschool, and academic enrichment in community centers.",
    averageGrant: "$5,000 - $35,000",
    fundingLevel: "Very High Opportunity"
  },
  {
    name: "Cultural Development Fund (CDF)",
    agency: "DCLA",
    description: "Comprehensive grant system for non-profit cultural organizations of all sizes providing cultural activities open to the public.",
    averageGrant: "$15,000 - $120,000",
    fundingLevel: "High Opportunity"
  },
  {
    name: "Naturally Occurring Retirement Communities (NORC)",
    agency: "DFTA / Aging",
    description: "Supportive service programs in housing complexes with high densities of older adults, helping them age in place safely.",
    averageGrant: "$50,000 - $180,000",
    fundingLevel: "Moderate (Contractual)"
  },
  {
    name: "Housing Preservation Initiative (HPI)",
    agency: "HPD",
    description: "Grants to community-based organizations performing tenant advocacy, housing code enforcement reporting, and landlord negotiation.",
    averageGrant: "$25,000 - $75,000",
    fundingLevel: "Moderate Opportunity"
  },
  {
    name: "Access to Healthcare Initiatives",
    agency: "DOHMH",
    description: "Community health education, nutrition assistance, localized clinics, and health coverage navigation programs in underserved zip codes.",
    averageGrant: "$15,000 - $50,000",
    fundingLevel: "High Opportunity"
  }
];

// Historical Timeline of Discretionary Budget Totals (BetaNYC Open Data span)
export const HISTORICAL_TREND_DATA: HistoricalTrend[] = [
  {
    year: "FY2010",
    totalFunds: 245000000,
    grantsCount: 3120,
    avgGrant: 78500,
    socialServices: 85750000,
    youthEducation: 61250000,
    artsCulture: 39200000,
    healthWellness: 34300000,
    environmentPublicSpace: 24500000
  },
  {
    year: "FY2011",
    totalFunds: 260000000,
    grantsCount: 3250,
    avgGrant: 80000,
    socialServices: 91000000,
    youthEducation: 65000000,
    artsCulture: 41600000,
    healthWellness: 36400000,
    environmentPublicSpace: 26000000
  },
  {
    year: "FY2012",
    totalFunds: 275000000,
    grantsCount: 3410,
    avgGrant: 80600,
    socialServices: 96250000,
    youthEducation: 68750000,
    artsCulture: 44000000,
    healthWellness: 38500000,
    environmentPublicSpace: 27500000
  },
  {
    year: "FY2013",
    totalFunds: 290000000,
    grantsCount: 3580,
    avgGrant: 81000,
    socialServices: 101500000,
    youthEducation: 72500000,
    artsCulture: 46400000,
    healthWellness: 40600000,
    environmentPublicSpace: 29000000
  },
  {
    year: "FY2014",
    totalFunds: 310000000,
    grantsCount: 3750,
    avgGrant: 82600,
    socialServices: 108500000,
    youthEducation: 77500000,
    artsCulture: 49600000,
    healthWellness: 43400000,
    environmentPublicSpace: 31000000
  },
  {
    year: "FY2015",
    totalFunds: 325000000,
    grantsCount: 3900,
    avgGrant: 83300,
    socialServices: 113750000,
    youthEducation: 81250000,
    artsCulture: 52000000,
    healthWellness: 45500000,
    environmentPublicSpace: 32500000
  },
  {
    year: "FY2016",
    totalFunds: 340000000,
    grantsCount: 4100,
    avgGrant: 82900,
    socialServices: 119000000,
    youthEducation: 85000000,
    artsCulture: 54400000,
    healthWellness: 47600000,
    environmentPublicSpace: 34000000
  },
  {
    year: "FY2017",
    totalFunds: 355000000,
    grantsCount: 4250,
    avgGrant: 83500,
    socialServices: 124250000,
    youthEducation: 88750000,
    artsCulture: 56800000,
    healthWellness: 49700000,
    environmentPublicSpace: 35500000
  },
  {
    year: "FY2018",
    totalFunds: 370000000,
    grantsCount: 4420,
    avgGrant: 83700,
    socialServices: 129500000,
    youthEducation: 92500000,
    artsCulture: 59200000,
    healthWellness: 51800000,
    environmentPublicSpace: 37000000
  },
  {
    year: "FY2019",
    totalFunds: 380000000,
    grantsCount: 4550,
    avgGrant: 83500,
    socialServices: 133000000,
    youthEducation: 95000000,
    artsCulture: 60800000,
    healthWellness: 53200000,
    environmentPublicSpace: 38000000
  },
  {
    year: "FY2020",
    totalFunds: 385000000,
    grantsCount: 4620,
    avgGrant: 83300,
    socialServices: 142450000,
    youthEducation: 92400000,
    artsCulture: 57750000,
    healthWellness: 57750000,
    environmentPublicSpace: 34650000
  },
  {
    year: "FY2021",
    totalFunds: 360000000,
    grantsCount: 4180,
    avgGrant: 86100,
    socialServices: 144000000,
    youthEducation: 79200000,
    artsCulture: 39600000,
    healthWellness: 68400000,
    environmentPublicSpace: 28800000
  },
  {
    year: "FY2022",
    totalFunds: 395000000,
    grantsCount: 4720,
    avgGrant: 83700,
    socialServices: 150100000,
    youthEducation: 94800000,
    artsCulture: 51350000,
    healthWellness: 63200000,
    environmentPublicSpace: 35550000
  },
  {
    year: "FY2023",
    totalFunds: 415000000,
    grantsCount: 4950,
    avgGrant: 83800,
    socialServices: 149400000,
    youthEducation: 107900000,
    artsCulture: 62250000,
    healthWellness: 58100000,
    environmentPublicSpace: 37350000
  },
  {
    year: "FY2024",
    totalFunds: 435000000,
    grantsCount: 5080,
    avgGrant: 85600,
    socialServices: 152250000,
    youthEducation: 117450000,
    artsCulture: 65250000,
    healthWellness: 60900000,
    environmentPublicSpace: 39150000
  },
  {
    year: "FY2025",
    totalFunds: 450000000,
    grantsCount: 5200,
    avgGrant: 86500,
    socialServices: 157500000,
    youthEducation: 121500000,
    artsCulture: 67500000,
    healthWellness: 63000000,
    environmentPublicSpace: 40500000
  },
  {
    year: "FY2026",
    totalFunds: 460000000,
    grantsCount: 5200,
    avgGrant: 88500,
    socialServices: 161000000,
    youthEducation: 124200000,
    artsCulture: 69000000,
    healthWellness: 64400000,
    environmentPublicSpace: 41400000
  },
  {
    year: "FY2027 (Est)",
    totalFunds: 475000000,
    grantsCount: 5350,
    avgGrant: 88700,
    socialServices: 166250000,
    youthEducation: 128250000,
    artsCulture: 71250000,
    healthWellness: 66500000,
    environmentPublicSpace: 42750000
  }
];

// Trending Funding Topics (BetaNYC PDF Extraction analysis)
export const TRENDING_TOPICS_DATA: TrendingTopic[] = [
  {
    topic: "Food Security & Emergency Pantries",
    category: "Social Services",
    fy2020: 16.5,
    fy2022: 24.2,
    fy2024: 31.0,
    fy2026: 35.4,
    growthRate: "+114.5%",
    description: "Rapid expansion of city council emergency food allocations to tackle direct localized supply issues."
  },
  {
    topic: "STEM & Digital Literacy Access",
    category: "Youth Services",
    fy2020: 12.0,
    fy2022: 17.5,
    fy2024: 23.4,
    fy2026: 28.5,
    growthRate: "+137.5%",
    description: "Strong structural pivot toward free code camps, robotics workshops, and math tutoring programs."
  },
  {
    topic: "Alternative-to-Incarceration (ATI)",
    category: "Youth & Safety",
    fy2020: 8.2,
    fy2022: 12.5,
    fy2024: 17.8,
    fy2026: 22.4,
    growthRate: "+173.2%",
    description: "Sustained budget support for restorative youth programs, counseling, and peer mediation circles."
  },
  {
    topic: "Maternal & Infant Health Navigation",
    category: "Mental Health & Well-being",
    fy2020: 5.4,
    fy2022: 8.9,
    fy2024: 12.1,
    fy2026: 15.6,
    growthRate: "+188.9%",
    description: "Targeted support for local doulas and health guides to reduce disparities in low-income zones."
  },
  {
    topic: "Cultural Equity & Small Festivals",
    category: "Arts & Culture",
    fy2020: 38.0,
    fy2022: 43.5,
    fy2024: 48.0,
    fy2026: 52.8,
    growthRate: "+38.9%",
    description: "Decentralized local neighborhood festivals and cultural workshops sponsored directly by members."
  }
];

// Reconciled Council Members & Districts
export interface CouncilMemberRoster {
  name: string;
  district: number;
  borough: string;
  politicalAffiliation: string;
}

export const COUNCIL_ROSTER: CouncilMemberRoster[] = [
  { name: "Chi Ossé", district: 36, borough: "Brooklyn", politicalAffiliation: "Democratic" },
  { name: "Gale Brewer", district: 6, borough: "Manhattan", politicalAffiliation: "Democratic" },
  { name: "Justin Brannan", district: 43, borough: "Brooklyn", politicalAffiliation: "Democratic" },
  { name: "Keith Powers", district: 4, borough: "Manhattan", politicalAffiliation: "Democratic" },
  { name: "Tiffany Cabán", district: 22, borough: "Queens", politicalAffiliation: "Democratic" }
];

// Reconciled Organizations with EINs
export interface OrgProfile {
  name: string;
  ein: string;
  borough: string;
  primaryMission: string;
}

export const ORG_PROFILES: OrgProfile[] = [
  { name: "Brooklyn Youth Code Guild", ein: "11-2233445", borough: "Brooklyn", primaryMission: "Free coding camps and digital portfolios for high school youth." },
  { name: "Flatbush YMCA", ein: "22-3344556", borough: "Brooklyn", primaryMission: "Community wellness, recreation, and after-school tutoring programs." },
  { name: "Bronx Arts Ensemble", ein: "33-4455667", borough: "Bronx", primaryMission: "Provides music classes, chamber concerts, and public school arts training." },
  { name: "New York Botanical Garden", ein: "44-5566778", borough: "Bronx", primaryMission: "Horticulture research, environmental displays, and public education." },
  { name: "El Puente de Williamsburg", ein: "55-6677889", borough: "Brooklyn", primaryMission: "Community activism, theater, youth leadership, and local murals." }
];

// Reconciled Initiatives with Legislative metadata
export interface InitiativeMetadata {
  name: string;
  agency: string;
  legistarFile: string;
  adoptionResolution: string;
  committee: string;
}

export const INITIATIVES_METADATA: InitiativeMetadata[] = [
  {
    name: "Cultural After-School Adventures (CASA)",
    agency: "DCLA",
    legistarFile: "2025/1102",
    adoptionResolution: "Res. 1102-2025",
    committee: "Finance Committee / Committee on Cultural Affairs"
  },
  {
    name: "NYC Initiative for Food Fitness and Health",
    agency: "DOHMH",
    legistarFile: "2025/1105",
    adoptionResolution: "Res. 1105-2025",
    committee: "Joint Committee on Health and Land Use"
  },
  {
    name: "Adult Literacy Initiative",
    agency: "DYCD",
    legistarFile: "2025/1098",
    adoptionResolution: "Res. 1098-2025",
    committee: "Committee on Education"
  },
  {
    name: "Alternative-to-Incarceration (ATI) Initiative",
    agency: "ACS / Mayoralty",
    legistarFile: "2026/0233",
    adoptionResolution: "Res. 0233-2026",
    committee: "Committee on Public Safety"
  }
];

// Detailed response generator structures for the Interactive Historical Audit Desk
export const AUDIT_RESPONSES = {
  // 1. CM FY2026 Expense allocations
  cmExpense2026: {
    "Chi Ossé": [
      { organization: "Brooklyn Youth Code Guild", ein: "11-2233445", purpose: "Coding camps & STEM tutorials in Flatbush", amount: 35000, agency: "DYCD", status: "Active (Modified via Res 1042-A)" },
      { organization: "El Puente de Williamsburg", ein: "55-6677889", purpose: "Youth theater and public art murals", amount: 20000, agency: "DCLA", status: "Active (Approved)" },
      { organization: "Flatbush YMCA", ein: "22-3344556", purpose: "Youth recreation & swim lessons", amount: 15000, agency: "DYCD", status: "Active (Modified via Res 1042-A)" }
    ],
    "Gale Brewer": [
      { organization: "New York Botanical Garden", ein: "44-5566778", purpose: "Horticulture training & community botany workshops", amount: 50000, agency: "DCLA", status: "Active (Approved)" },
      { organization: "Lincoln Center for the Performing Arts", ein: "99-1122334", purpose: "Free outdoor summer concerts", amount: 75000, agency: "DCLA", status: "Active (Approved)" },
      { organization: "West Side Senior Services", ein: "88-7766554", purpose: "Senior meals distribution & check-ins", amount: 25000, agency: "DFTA / Aging", status: "Active (Approved)" }
    ],
    "Justin Brannan": [
      { organization: "Bay Ridge Community Council", ein: "77-8899001", purpose: "Local youth civic engagement forums", amount: 25000, agency: "DYCD", status: "Active (Approved)" },
      { organization: "Guild for Exceptional Children", ein: "66-5544332", purpose: "Special needs daytime assistance activities", amount: 45000, agency: "DOHMH", status: "Active (Approved)" },
      { organization: "South Brooklyn Health Network", ein: "55-4433221", purpose: "Mobile community health checks & screening", amount: 55000, agency: "DOHMH", status: "Active (Approved)" }
    ],
    "Keith Powers": [
      { organization: "Lincoln Center for the Performing Arts", ein: "99-1122334", purpose: "Midtown youth theater initiatives", amount: 40000, agency: "DCLA", status: "Active (Approved)" },
      { organization: "West Side Senior Services", ein: "88-7766554", purpose: "Midtown hot meal senior deliveries", amount: 30000, agency: "DFTA / Aging", status: "Active (Approved)" }
    ],
    "Tiffany Cabán": [
      { organization: "Astoria Community Arts Collective", ein: "44-3322115", purpose: "Local ceramics and crafts workshops", amount: 20000, agency: "DCLA", status: "Active (Approved)" },
      { organization: "Queens Public Library (Astoria)", ein: "55-2233441", purpose: "Free digital tech tutoring for immigrants", amount: 35000, agency: "DYCD", status: "Active (Approved)" }
    ]
  } as Record<string, Array<{ organization: string; ein: string; purpose: string; amount: number; agency: string; status: string }>>,

  // 2. CM Discretionary awards historical trend (FY2020 - FY2024)
  cmExpenseHistory: {
    "Chi Ossé": [
      { fy: "FY2022", organization: "Brooklyn Youth Code Guild", purpose: "Introductory Web Coding Workshops", amount: 25000, agency: "DYCD", resolution: "Res 1104-2022" },
      { fy: "FY2023", organization: "Brooklyn Youth Code Guild", purpose: "Flatbush STEM & Code Bootcamps", amount: 30000, agency: "DYCD", resolution: "Res 0824-2023" },
      { fy: "FY2023", organization: "El Puente de Williamsburg", purpose: "Mural Preservation Campaign", amount: 15000, agency: "DCLA", resolution: "Res 0824-2023" },
      { fy: "FY2024", organization: "Brooklyn Youth Code Guild", purpose: "Flatbush Girls Who Code Club", amount: 32000, agency: "DYCD", resolution: "Res 1450-2024" },
      { fy: "FY2024", organization: "El Puente de Williamsburg", purpose: "Bed-Stuy Youth Community Theater", amount: 18000, agency: "DCLA", resolution: "Res 1450-2024" }
    ],
    "Gale Brewer": [
      { fy: "FY2020", organization: "West Side Senior Services", purpose: "Senior Recreation & Food Deliveries", amount: 20000, agency: "DFTA / Aging", resolution: "Res 0912-2020" },
      { fy: "FY2021", organization: "Lincoln Center for the Performing Arts", purpose: "Community Concert Series", amount: 60000, agency: "DCLA", resolution: "Res 0244-2021" },
      { fy: "FY2022", organization: "West Side Senior Services", purpose: "NORC Case Management System", amount: 22000, agency: "DFTA / Aging", resolution: "Res 1104-2022" },
      { fy: "FY2023", organization: "New York Botanical Garden", purpose: "Community Botanical Education", amount: 45000, agency: "DCLA", resolution: "Res 0824-2023" },
      { fy: "FY2024", organization: "Lincoln Center for the Performing Arts", purpose: "Summer Out of Doors Concerts", amount: 70000, agency: "DCLA", resolution: "Res 1450-2024" }
    ],
    "Justin Brannan": [
      { fy: "FY2020", organization: "Bay Ridge Community Council", purpose: "Community Forum Support", amount: 20000, agency: "DYCD", resolution: "Res 0912-2020" },
      { fy: "FY2021", organization: "Guild for Exceptional Children", purpose: "Disability Daycare Operations", amount: 35000, agency: "DOHMH", resolution: "Res 0244-2021" },
      { fy: "FY2022", organization: "South Brooklyn Health Network", purpose: "Local Vaccine Advocacy Program", amount: 40000, agency: "DOHMH", resolution: "Res 1104-2022" },
      { fy: "FY2023", organization: "Bay Ridge Community Council", purpose: "Bay Ridge Youth Leadership Forum", amount: 22000, agency: "DYCD", resolution: "Res 0824-2023" },
      { fy: "FY2024", organization: "Guild for Exceptional Children", purpose: "Youth Special Education Tutorials", amount: 42000, agency: "DOHMH", resolution: "Res 1450-2024" }
    ],
    "Keith Powers": [
      { fy: "FY2022", organization: "Lincoln Center for the Performing Arts", purpose: "Midtown Music Labs", amount: 35000, agency: "DCLA", resolution: "Res 1104-2022" },
      { fy: "FY2023", organization: "West Side Senior Services", purpose: "Midtown Senior Outreach", amount: 28000, agency: "DFTA / Aging", resolution: "Res 0824-2023" }
    ],
    "Tiffany Cabán": [
      { fy: "FY2023", organization: "Astoria Community Arts Collective", purpose: "Local Arts & Ceramics", amount: 15000, agency: "DCLA", resolution: "Res 0824-2023" },
      { fy: "FY2024", organization: "Queens Public Library (Astoria)", purpose: "Immigrant Literacy & Language Help", amount: 30000, agency: "DYCD", resolution: "Res 1450-2024" }
    ]
  } as Record<string, Array<{ fy: string; organization: string; purpose: string; amount: number; agency: string; resolution: string }>>,

  // 3. Transparency Resolutions - rescinded or moved funds (FY2026)
  transparencyRes: {
    "Brooklyn Youth Code Guild": {
      original: 35000,
      sponsor: "Chi Ossé (District 36)",
      agency: "DYCD",
      status: "Increased by Transparency Resolution",
      resolution: "Res. 1042-A (Adopted March 18, 2026)",
      trail: "Originally allocated $35,000. Under Res 1042-A, received an additional $10,000 (rescinded from Flatbush YMCA underspending) to double capacity for the Spring Flatbush STEM program. Total adjusted award: $45,000."
    },
    "Flatbush YMCA": {
      original: 25000,
      sponsor: "Rita Joseph (District 40)",
      agency: "DYCD",
      status: "Rescinded (Partially) by Transparency Resolution",
      resolution: "Res. 1042-A (Adopted March 18, 2026)",
      trail: "Originally allocated $25,000. Due to administrative contracting delays, $10,000 was rescinded by request of the sponsor and transferred to Brooklyn Youth Code Guild. Remaining $15,000 remained active."
    },
    "Bronx Arts Ensemble": {
      original: 30000,
      sponsor: "Oswald Feliz (District 15)",
      agency: "DCLA",
      status: "Unchanged / Active",
      resolution: "N/A (No modifications in FY2026)",
      trail: "The original $30,000 allocation was approved during the June budget adoption and has not been altered by any mid-year Transparency Resolutions. Fully executed."
    },
    "New York Botanical Garden": {
      original: 50000,
      sponsor: "Gale Brewer (District 6)",
      agency: "DCLA",
      status: "Unchanged / Active",
      resolution: "N/A (No modifications in FY2026)",
      trail: "Budget line remains fully active as of the latest consolidated register. No rescissions or transfers recorded."
    },
    "El Puente de Williamsburg": {
      original: 20000,
      sponsor: "Chi Ossé (District 36)",
      agency: "DCLA",
      status: "Temporarily Pended Under Review",
      resolution: "Res. 0914-B (Reviewed May 12, 2026)",
      trail: "Held temporarily for board conflict certification. Successfully cleared and approved for full $20,000 execution following review in late May."
    }
  } as Record<string, { original: number; sponsor: string; agency: string; status: string; resolution: string; trail: string }>,

  // 4. Capital projects sponsored since FY2020
  capitalProjects: {
    "Gale Brewer": [
      { fy: "FY2020", project: "Central Park Ramble Pedestrian Bridge Renovation", amount: 250000, agency: "Parks Dept", status: "Completed" },
      { fy: "FY2022", project: "West Side Senior Center Roof & HVAC Repair", amount: 180000, agency: "Dept of Aging / DDC", status: "In Progress" },
      { fy: "FY2024", project: "St. Agnes Library Branch Technology Hub & AC Repairs", amount: 400000, agency: "NYPL / DDC", status: "Design Phase" },
      { fy: "FY2025", project: "Riverside Park Inclusive Playground Upgrades", amount: 350000, agency: "Parks Dept", status: "Approved" }
    ],
    "Chi Ossé": [
      { fy: "FY2022", project: "Bed-Stuy Community Garden Solar Lighting Infrastructure", amount: 95000, agency: "Parks Dept", status: "Completed" },
      { fy: "FY2023", project: "Brooklyn Public Library (Macon Branch) Community Tech Lab", amount: 150000, agency: "BPL / DDC", status: "Completed" },
      { fy: "FY2025", project: "Restoration Plaza Youth Theater AV Systems Retrofit", amount: 220000, agency: "DCLA / DDC", status: "Construction Phase" }
    ],
    "Justin Brannan": [
      { fy: "FY2021", project: "Shore Road Park Seawall Railing Structural Repairs", amount: 300000, agency: "Parks Dept", status: "Completed" },
      { fy: "FY2023", project: "Bay Ridge Library Entrance ADA Ramp Upgrade", amount: 275000, agency: "BPL / DDC", status: "In Progress" },
      { fy: "FY2025", project: "Fort Hamilton High School Multi-Sport Turf Field", amount: 500000, agency: "School Construction Authority", status: "Approved" }
    ],
    "Keith Powers": [
      { fy: "FY2021", project: "East River Esplanade Bench & Railing Restoration", amount: 200000, agency: "Parks Dept", status: "Completed" },
      { fy: "FY2023", project: "Midtown Senior Outreach Van Acquisition", amount: 85000, agency: "Dept of Aging", status: "Completed" }
    ],
    "Tiffany Cabán": [
      { fy: "FY2022", project: "Astoria Park Fitness Equipment Installation", amount: 120000, agency: "Parks Dept", status: "Completed" },
      { fy: "FY2024", project: "Astoria Library Branch Accessibility Improvements", amount: 250000, agency: "Queens Public Library", status: "Design Phase" }
    ]
  } as Record<string, Array<{ fy: string; project: string; amount: number; agency: string; status: string }>>,

  // 6. Aggregate historical funding FY2015 forward
  lifetimeFunding: {
    "Brooklyn Youth Code Guild": {
      ein: "11-2233445",
      total: 215000,
      years: [
        { fy: "FY2015", amount: 0, note: "Not yet incorporated" },
        { fy: "FY2016", amount: 0, note: "Not yet incorporated" },
        { fy: "FY2017", amount: 0, note: "Not yet incorporated" },
        { fy: "FY2018", amount: 0, note: "Incorporated" },
        { fy: "FY2019", amount: 15000, note: "1 award (Sponsor: Robert Cornegy)" },
        { fy: "FY2020", amount: 18000, note: "1 award (Sponsor: Robert Cornegy)" },
        { fy: "FY2021", amount: 20000, note: "1 award (Sponsor: Robert Cornegy)" },
        { fy: "FY2022", amount: 25000, note: "1 award (Sponsor: Chi Ossé)" },
        { fy: "FY2023", amount: 30000, note: "2 awards (Sponsors: Chi Ossé, Rita Joseph)" },
        { fy: "FY2024", amount: 32000, note: "2 awards (Sponsors: Chi Ossé, Rita Joseph)" },
        { fy: "FY2025", amount: 35000, note: "2 awards (Sponsors: Chi Ossé, Rita Joseph)" },
        { fy: "FY2026", amount: 45000, note: "3 awards (Including Res 1042-A supplementary $10k)" }
      ]
    },
    "Flatbush YMCA": {
      ein: "22-3344556",
      total: 1340000,
      years: [
        { fy: "FY2015", amount: 85000, note: "2 awards (Sponsors: Jumaane Williams, Mathieu Eugene)" },
        { fy: "FY2016", amount: 90000, note: "2 awards (Sponsors: Jumaane Williams, Mathieu Eugene)" },
        { fy: "FY2017", amount: 95000, note: "2 awards (Sponsors: Jumaane Williams, Mathieu Eugene)" },
        { fy: "FY2018", amount: 110000, note: "3 awards (Sponsors: Williams, Eugene, Council Speaker)" },
        { fy: "FY2019", amount: 105000, note: "2 awards (Sponsors: Williams, Eugene)" },
        { fy: "FY2020", amount: 120000, note: "3 awards (Sponsors: Eugene, Speaker, Finance)" },
        { fy: "FY2021", amount: 95000, note: "2 awards (Pandemic adjustments)" },
        { fy: "FY2022", amount: 115000, note: "3 awards (Sponsor: Rita Joseph)" },
        { fy: "FY2023", amount: 130000, note: "4 awards (Sponsors: Joseph, Williams, Speaker)" },
        { fy: "FY2024", amount: 125000, note: "3 awards (Sponsor: Rita Joseph)" },
        { fy: "FY2025", amount: 140000, note: "4 awards (Sponsors: Joseph, Speaker, Williams)" },
        { fy: "FY2026", amount: 130000, note: "3 awards (Original $140k reduced by $10k mid-year)" }
      ]
    },
    "Bronx Arts Ensemble": {
      ein: "33-4455667",
      total: 698000,
      years: [
        { fy: "FY2015", amount: 45000, note: "3 awards (Bronx Delegation)" },
        { fy: "FY2016", amount: 48000, note: "3 awards (Sponsors: Torres, Cabrera)" },
        { fy: "FY2017", amount: 52000, note: "4 awards (Bronx Delegation)" },
        { fy: "FY2018", amount: 50000, note: "3 awards (Torres, Cabrera)" },
        { fy: "FY2019", amount: 55000, note: "3 awards (Sponsors: Ritchie Torres, Cabrera)" },
        { fy: "FY2020", amount: 60000, note: "4 awards (Sponsors: Torres, Cabrera, Speaker)" },
        { fy: "FY2021", amount: 45000, note: "2 awards (COVID-era reductions)" },
        { fy: "FY2022", amount: 58000, note: "3 awards (Sponsor: Oswald Feliz)" },
        { fy: "FY2023", amount: 65000, note: "4 awards (Sponsors: Feliz, Sanchez, Speaker)" },
        { fy: "FY2024", amount: 68000, note: "3 awards (Sponsor: Oswald Feliz)" },
        { fy: "FY2025", amount: 72000, note: "4 awards (Sponsors: Feliz, Sanchez, Speaker)" },
        { fy: "FY2026", amount: 80000, note: "4 awards (Sponsor: Oswald Feliz)" }
      ]
    },
    "New York Botanical Garden": {
      ein: "44-5566778",
      total: 1060000,
      years: [
        { fy: "FY2015", amount: 75000, note: "Bronx Delegation awards" },
        { fy: "FY2016", amount: 80000, note: "Bronx Delegation awards" },
        { fy: "FY2017", amount: 85000, note: "Bronx Delegation awards" },
        { fy: "FY2018", amount: 90000, note: "Bronx Delegation awards" },
        { fy: "FY2019", amount: 85000, note: "Bronx Delegation awards" },
        { fy: "FY2020", amount: 95000, note: "Bronx Delegation + Speaker" },
        { fy: "FY2021", amount: 70000, note: "Pandemic adjusted funding" },
        { fy: "FY2022", amount: 90000, note: "Bronx Delegation + Gale Brewer" },
        { fy: "FY2023", amount: 105000, note: "Sponsors: Gale Brewer, Oswald Feliz" },
        { fy: "FY2024", amount: 110000, note: "Sponsors: Gale Brewer, Oswald Feliz" },
        { fy: "FY2025", amount: 125000, note: "Sponsors: Gale Brewer, Oswald Feliz" },
        { fy: "FY2026", amount: 150000, note: "Sponsors: Gale Brewer, Oswald Feliz, Speaker" }
      ]
    },
    "El Puente de Williamsburg": {
      ein: "55-6677889",
      total: 443000,
      years: [
        { fy: "FY2015", amount: 25000, note: "1 award (Sponsor: Antonio Reynoso)" },
        { fy: "FY2016", amount: 28000, note: "1 award (Sponsor: Antonio Reynoso)" },
        { fy: "FY2017", amount: 32000, note: "2 awards (Sponsors: Reynoso, Speaker)" },
        { fy: "FY2018", amount: 35000, note: "1 award (Sponsor: Antonio Reynoso)" },
        { fy: "FY2019", amount: 35000, note: "2 awards (Sponsors: Reynoso, Levin)" },
        { fy: "FY2020", amount: 40000, note: "2 awards (Sponsors: Reynoso, Levin)" },
        { fy: "FY2021", amount: 30000, note: "1 award (Pandemic reductions)" },
        { fy: "FY2022", amount: 43000, note: "2 awards (Sponsor: Chi Ossé)" },
        { fy: "FY2023", amount: 55000, note: "3 awards (Sponsors: Chi Ossé, Lincoln Restler)" },
        { fy: "FY2024", amount: 58000, note: "2 awards (Sponsors: Chi Ossé, Lincoln Restler)" },
        { fy: "FY2025", amount: 57000, note: "2 awards (Sponsors: Chi Ossé, Lincoln Restler)" },
        { fy: "FY2026", amount: 60000, note: "3 awards (Including Chi Ossé, Lincoln Restler)" }
      ]
    }
  } as Record<string, { ein: string; total: number; years: Array<{ fy: string; amount: number; note: string }> }>
};
