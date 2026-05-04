import { TargetCountry } from "@/types";

export interface CountryProfile {
  code: TargetCountry;
  name: string;
  currency: string;
  costLevel: "very-low" | "low" | "medium" | "high" | "very-high";
  competitionLevel: "low" | "medium" | "high" | "extreme";
  googleAdsStrength: number; // 1-10
  metaAdsStrength: number; // 1-10
  tiktokStrength: number; // 1-10
  linkedinStrength: number; // 1-10
  trustSensitivity: "low" | "medium" | "high";
  mobileFirst: boolean;
  localizationImportance: "low" | "medium" | "critical";
  budgetPressure: "low" | "medium" | "high";
  avgCpcSearch: number; // USD
  avgCpmSocial: number; // USD
  ecomAdoption: "low" | "medium" | "high";
  topIndustries: string[];
  notes: string[];
  seasonalPeaks: string[];
  commonMistakes: string[];
}

export const COUNTRY_PROFILES: Record<TargetCountry, CountryProfile> = {
  TR: {
    code: "TR",
    name: "Turkey",
    currency: "TRY",
    costLevel: "low",
    competitionLevel: "medium",
    googleAdsStrength: 8,
    metaAdsStrength: 9,
    tiktokStrength: 7,
    linkedinStrength: 4,
    trustSensitivity: "high",
    mobileFirst: true,
    localizationImportance: "critical",
    budgetPressure: "high",
    avgCpcSearch: 0.15,
    avgCpmSocial: 1.2,
    ecomAdoption: "high",
    topIndustries: ["ecommerce", "tourism", "real-estate", "education", "food-delivery"],
    notes: [
      "Turkish language ads perform 3-5x better than English",
      "Instagram is the dominant social platform for ads",
      "Mobile traffic exceeds 85% in most niches",
      "Price sensitivity is extremely high — emphasize value and discounts",
      "Local payment methods (credit card installments) boost conversion significantly",
    ],
    seasonalPeaks: ["Black Friday (Kasım)", "Ramadan/Bayram", "Summer tourism season", "Back to school (September)"],
    commonMistakes: [
      "Running English-only campaigns",
      "Ignoring mobile optimization",
      "Not offering installment options",
      "Setting budgets without accounting for TRY inflation",
    ],
  },
  US: {
    code: "US",
    name: "United States",
    currency: "USD",
    costLevel: "very-high",
    competitionLevel: "extreme",
    googleAdsStrength: 10,
    metaAdsStrength: 9,
    tiktokStrength: 8,
    linkedinStrength: 9,
    trustSensitivity: "medium",
    mobileFirst: false,
    localizationImportance: "low",
    budgetPressure: "low",
    avgCpcSearch: 2.5,
    avgCpmSocial: 12.0,
    ecomAdoption: "high",
    topIndustries: ["saas", "ecommerce", "finance", "healthcare", "real-estate"],
    notes: [
      "Highest ad costs globally — requires tight optimization",
      "Audiences expect polished creatives and fast landing pages",
      "Privacy regulations (CCPA) affect tracking in California",
      "Google Shopping and Performance Max dominate e-commerce",
      "LinkedIn Ads effective for B2B with $50+ average CPC",
    ],
    seasonalPeaks: ["Black Friday/Cyber Monday", "Back to school (Aug)", "Holiday season (Nov-Dec)", "Super Bowl (Feb)"],
    commonMistakes: [
      "Underbidding in competitive niches",
      "Ignoring negative keywords — wasted spend is massive",
      "Not A/B testing creatives aggressively",
      "Neglecting landing page optimization",
    ],
  },
  UK: {
    code: "UK",
    name: "United Kingdom",
    currency: "GBP",
    costLevel: "high",
    competitionLevel: "high",
    googleAdsStrength: 9,
    metaAdsStrength: 8,
    tiktokStrength: 7,
    linkedinStrength: 8,
    trustSensitivity: "high",
    mobileFirst: false,
    localizationImportance: "medium",
    budgetPressure: "medium",
    avgCpcSearch: 1.8,
    avgCpmSocial: 9.0,
    ecomAdoption: "high",
    topIndustries: ["finance", "retail", "saas", "education", "property"],
    notes: [
      "British English spelling and tone matter for credibility",
      "GDPR compliance is strictly enforced — cookie consent required",
      "Strong preference for established brands with social proof",
      "Google Shopping is dominant for retail",
      "Trustpilot reviews heavily influence purchase decisions",
    ],
    seasonalPeaks: ["Boxing Day sales", "January sales", "Black Friday", "Summer bank holidays"],
    commonMistakes: [
      "Using American English in ad copy",
      "Ignoring GDPR cookie consent requirements",
      "Underestimating the power of trust signals",
      "Not targeting by region (London vs. rest of UK)",
    ],
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    costLevel: "high",
    competitionLevel: "high",
    googleAdsStrength: 8,
    metaAdsStrength: 9,
    tiktokStrength: 8,
    linkedinStrength: 7,
    trustSensitivity: "high",
    mobileFirst: true,
    localizationImportance: "critical",
    budgetPressure: "medium",
    avgCpcSearch: 1.5,
    avgCpmSocial: 8.0,
    ecomAdoption: "high",
    topIndustries: ["real-estate", "luxury", "tourism", "finance", "food-delivery"],
    notes: [
      "Bilingual campaigns (Arabic + English) essential for reach",
      "Instagram and Snapchat are primary social platforms",
      "Premium positioning works — audiences have high purchasing power",
      "Ramadan is the biggest advertising season",
      "WhatsApp is widely used for lead follow-up",
    ],
    seasonalPeaks: ["Ramadan", "Dubai Shopping Festival (Jan)", "National Day (Dec)", "Summer sales"],
    commonMistakes: [
      "Running only English campaigns and missing Arabic-speaking audience",
      "Ignoring Ramadan timing adjustments",
      "Not adapting visuals for cultural sensitivity",
      "Underpricing premium products for this market",
    ],
  },
  DE: {
    code: "DE",
    name: "Germany",
    currency: "EUR",
    costLevel: "high",
    competitionLevel: "high",
    googleAdsStrength: 9,
    metaAdsStrength: 7,
    tiktokStrength: 5,
    linkedinStrength: 6,
    trustSensitivity: "high",
    mobileFirst: false,
    localizationImportance: "critical",
    budgetPressure: "medium",
    avgCpcSearch: 1.6,
    avgCpmSocial: 7.5,
    ecomAdoption: "high",
    topIndustries: ["automotive", "manufacturing", "saas", "finance", "retail"],
    notes: [
      "German-language ads are mandatory — English ads have very low CTR",
      "Strict GDPR enforcement — privacy-first approach required",
      "Desktop usage remains significant for B2B",
      "Strong preference for Gütesiegel (trust seals) and Impressum compliance",
      "Invoice payment (Rechnung) is preferred in e-commerce",
    ],
    seasonalPeaks: ["Christmas markets (Nov-Dec)", "Winter sales (January)", "Easter", "Black Friday (growing)"],
    commonMistakes: [
      "Running English campaigns in German market",
      "Ignoring Impressum legal requirements",
      "Not offering preferred payment methods (SEPA, Rechnung)",
      "Underestimating GDPR tracking restrictions",
    ],
  },
  SA: {
    code: "SA",
    name: "Saudi Arabia",
    currency: "SAR",
    costLevel: "medium",
    competitionLevel: "medium",
    googleAdsStrength: 7,
    metaAdsStrength: 9,
    tiktokStrength: 9,
    linkedinStrength: 5,
    trustSensitivity: "high",
    mobileFirst: true,
    localizationImportance: "critical",
    budgetPressure: "low",
    avgCpcSearch: 0.8,
    avgCpmSocial: 4.0,
    ecomAdoption: "medium",
    topIndustries: ["real-estate", "automotive", "food-delivery", "fashion", "tourism"],
    notes: [
      "Arabic-first approach mandatory — most audiences Arabic-speaking",
      "Snapchat and TikTok have massive reach among youth",
      "Vision 2030 is driving rapid digital transformation",
      "Gender-specific advertising considerations important",
      "Cash on delivery still significant in e-commerce",
    ],
    seasonalPeaks: ["Ramadan", "Hajj season", "Saudi National Day (Sep)", "White Friday (Nov)"],
    commonMistakes: [
      "Using Western imagery without cultural adaptation",
      "Ignoring prayer time scheduling in ad delivery",
      "Not differentiating between Riyadh, Jeddah, and Dammam audiences",
      "Missing WhatsApp as a conversion channel",
    ],
  },
  CA: {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    costLevel: "high",
    competitionLevel: "high",
    googleAdsStrength: 9,
    metaAdsStrength: 8,
    tiktokStrength: 7,
    linkedinStrength: 8,
    trustSensitivity: "medium",
    mobileFirst: false,
    localizationImportance: "medium",
    budgetPressure: "medium",
    avgCpcSearch: 1.9,
    avgCpmSocial: 8.5,
    ecomAdoption: "high",
    topIndustries: ["real-estate", "finance", "saas", "education", "retail"],
    notes: [
      "Bilingual market — French required for Quebec audiences",
      "CASL anti-spam law affects email marketing and retargeting",
      "Cross-border shopping to US is common — compete on convenience",
      "Similar audience behavior to US but lower competition",
      "Strong mobile banking adoption aids conversion",
    ],
    seasonalPeaks: ["Boxing Day", "Black Friday", "Back to school (Sep)", "Canada Day (Jul)"],
    commonMistakes: [
      "Ignoring French-language requirements for Quebec",
      "Not complying with CASL regulations",
      "Using US pricing without CAD conversion",
      "Treating Canada as identical to US market",
    ],
  },
  AU: {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    costLevel: "high",
    competitionLevel: "high",
    googleAdsStrength: 9,
    metaAdsStrength: 8,
    tiktokStrength: 7,
    linkedinStrength: 7,
    trustSensitivity: "medium",
    mobileFirst: false,
    localizationImportance: "medium",
    budgetPressure: "medium",
    avgCpcSearch: 1.7,
    avgCpmSocial: 8.0,
    ecomAdoption: "high",
    topIndustries: ["real-estate", "finance", "education", "mining", "tourism"],
    notes: [
      "Smaller population means audience exhaustion happens faster",
      "Strong preference for Australian brands and local businesses",
      "Afterpay/Buy Now Pay Later is dominant in e-commerce",
      "Seasonal calendar is inverted — summer is Dec-Feb",
      "Regional targeting important (Sydney/Melbourne vs rural)",
    ],
    seasonalPeaks: ["Boxing Day", "EOFY sales (June)", "Click Frenzy (Nov)", "Black Friday (growing)"],
    commonMistakes: [
      "Using Northern Hemisphere seasonal timing",
      "Not offering Buy Now Pay Later options",
      "Targeting too broadly for small population",
      "Ignoring time zone differences for ad scheduling",
    ],
  },
};

export function getCountryProfile(code: TargetCountry): CountryProfile {
  return COUNTRY_PROFILES[code];
}

export function getCountryCostMultiplier(code: TargetCountry): number {
  const multipliers: Record<string, number> = {
    "very-low": 0.3,
    low: 0.6,
    medium: 1.0,
    high: 1.5,
    "very-high": 2.0,
  };
  return multipliers[COUNTRY_PROFILES[code].costLevel] ?? 1.0;
}

export function getCountryCompetitionFactor(code: TargetCountry): number {
  const factors: Record<string, number> = {
    low: 0.7,
    medium: 1.0,
    high: 1.3,
    extreme: 1.6,
  };
  return factors[COUNTRY_PROFILES[code].competitionLevel] ?? 1.0;
}
