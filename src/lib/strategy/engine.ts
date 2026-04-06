import {
  GA4Report,
  AdsReport,
  QuickSetup,
  StrategyOutput,
  StrategySection,
  StrategyItem,
  RiskWarning,
  BudgetAllocation,
  RoadmapPhase,
} from "@/types";
import { getCountryProfile, CountryProfile } from "@/lib/countries";
import { calculateScores, getBudgetTier } from "./scoring";
import { generateCampaignDraft } from "@/lib/drafts/google-ads-draft";

// ─── Helpers ────────────────────────────────────────────────────────────────

function si(text: string, type?: StrategyItem["type"]): StrategyItem {
  return { text, type };
}

function sec(title: string, icon: string, items: StrategyItem[]): StrategySection {
  return { title, icon, items };
}

// ─── Platform Recommendation ────────────────────────────────────────────────

function recommendPlatform(
  setup: QuickSetup,
  ga4: GA4Report,
  ads: AdsReport,
  country: CountryProfile,
): { platform: string; reasoning: string[] } {
  if (setup.platformPreference === "google") {
    return { platform: "Google Ads", reasoning: ["User preference: Google Ads only"] };
  }

  const reasoning: string[] = [];
  const socialTraffic = ga4.channelMix.find((c) => c.channel === "Social");
  const paidTraffic = ga4.channelMix.find((c) => c.channel === "Paid Search");
  const hasAdsCampaigns = ads.campaigns.filter((c) => c.status === "ENABLED").length > 0;

  if (setup.platformPreference === "both") {
    reasoning.push("User preference: multi-platform approach");
    reasoning.push(`Google Ads strength in ${country.name}: ${country.googleAdsStrength}/10`);
    reasoning.push(`Meta Ads strength in ${country.name}: ${country.metaAdsStrength}/10`);
    return { platform: "Google Ads + Meta Ads", reasoning };
  }

  // Auto-decide
  if (setup.goal === "sales" || setup.goal === "leads") {
    reasoning.push(`${setup.goal} goal favors Google Ads (high-intent search traffic)`);
    if (hasAdsCampaigns) reasoning.push("Existing Google Ads campaigns provide optimization data");
    if (country.googleAdsStrength >= 8) reasoning.push(`Strong Google Ads platform in ${country.name}`);
    return { platform: "Google Ads", reasoning };
  }

  if (setup.goal === "awareness") {
    reasoning.push("Awareness goal benefits from social reach");
    if (socialTraffic && socialTraffic.percentage > 15) reasoning.push(`Social already drives ${socialTraffic.percentage}% of traffic`);
    return { platform: "Google Ads + Meta Ads", reasoning };
  }

  if (paidTraffic && paidTraffic.percentage > 15) {
    reasoning.push(`Paid search already drives ${paidTraffic.percentage}% of traffic`);
  }

  return { platform: "Google Ads", reasoning };
}

// ─── Campaign Type Recommendation ───────────────────────────────────────────

function recommendCampaignType(
  setup: QuickSetup,
  ga4: GA4Report,
  ads: AdsReport,
): { type: string; reasoning: string[] } {
  const reasoning: string[] = [];
  const hasPurchase = ga4.keyEvents.some((e) => e.name === "purchase");
  const hasExistingPmax = ads.campaigns.some((c) => c.type === "PERFORMANCE_MAX" && c.status === "ENABLED");
  const hasExistingSearch = ads.campaigns.some((c) => c.type === "SEARCH" && c.status === "ENABLED");
  const conversions = ads.totalConversions30d;

  if (setup.goal === "sales" && hasPurchase) {
    if (conversions > 50 || hasExistingPmax) {
      reasoning.push("Performance Max works well for sales with conversion data");
      reasoning.push(`${conversions} conversions in 30 days provide optimization signal`);
      if (hasExistingSearch) reasoning.push("Complement existing Search campaigns");
      return { type: "Performance Max", reasoning };
    }
    reasoning.push("Search campaigns recommended to build conversion data first");
    reasoning.push("Move to Performance Max after 30+ conversions in 30 days");
    return { type: "Search", reasoning };
  }

  if (setup.goal === "leads") {
    reasoning.push("Search campaigns capture high-intent lead queries");
    reasoning.push("Add lead form extensions for direct capture");
    return { type: "Search", reasoning };
  }

  if (setup.goal === "awareness") {
    reasoning.push("Display/Video campaigns maximise reach at low CPM");
    return { type: "Display + Video", reasoning };
  }

  if (setup.goal === "traffic") {
    if (hasExistingSearch) {
      reasoning.push("Expand existing Search with broader match types");
      return { type: "Search (broad)", reasoning };
    }
    reasoning.push("Search campaigns for targeted traffic acquisition");
    return { type: "Search", reasoning };
  }

  return { type: "Search", reasoning: ["Default recommendation for new accounts"] };
}

// ─── Geo Targeting ──────────────────────────────────────────────────────────

function recommendGeo(
  setup: QuickSetup,
  ga4: GA4Report,
  country: CountryProfile,
): { targets: string[]; reasoning: string[] } {
  const reasoning: string[] = [];
  const targets: string[] = [country.name];

  const existingTraffic = ga4.sessionsByCountry.find(
    (s) => s.country.toLowerCase().includes(country.name.toLowerCase())
  );
  if (existingTraffic) {
    reasoning.push(`${country.name} already represents ${existingTraffic.percentage}% of traffic`);
  }
  reasoning.push(`Market cost level: ${country.costLevel}`);
  if (country.mobileFirst) reasoning.push("Mobile-first — ensure mobile geo targeting");

  return { targets, reasoning };
}

// ─── Market Assessment ──────────────────────────────────────────────────────

function buildMarketAssessment(ga4: GA4Report, ads: AdsReport, country: CountryProfile): StrategySection {
  const items: StrategyItem[] = [];

  items.push(si(`Average search CPC in ${country.name}: ~$${country.avgCpcSearch}`, "metric"));
  items.push(si(`Average social CPM: ~$${country.avgCpmSocial}`, "metric"));
  items.push(si(`Competition level: ${country.competitionLevel}`, "insight"));
  items.push(si(`E-commerce adoption: ${country.ecomAdoption}`, "insight"));

  if (country.mobileFirst) items.push(si("Mobile-first market — prioritise mobile UX", "warning"));
  if (country.trustSensitivity === "high") items.push(si("High trust sensitivity — invest in reviews and social proof", "action"));
  if (country.localizationImportance === "critical") items.push(si("Native-language ads are essential — English will underperform", "warning"));

  // GA4-derived insights
  const topDevice = ga4.deviceSplit.sort((a, b) => b.sessions - a.sessions)[0];
  items.push(si(`Your traffic: ${topDevice.device} ${topDevice.percentage}%`, "metric"));

  const topChannel = ga4.channelMix.sort((a, b) => b.sessions - a.sessions)[0];
  items.push(si(`Top traffic channel: ${topChannel.channel} (${topChannel.percentage}%)`, "metric"));

  if (ads.avgCpc > 0) items.push(si(`Your current avg CPC: $${ads.avgCpc.toFixed(2)}`, "metric"));
  if (ads.avgCtr > 0) items.push(si(`Your current avg CTR: ${ads.avgCtr}%`, "metric"));

  country.notes.forEach((n) => items.push(si(n, "insight")));

  return sec("Market Assessment", "Globe", items);
}

// ─── Campaign Architecture ──────────────────────────────────────────────────

function buildArchitecture(
  setup: QuickSetup,
  ads: AdsReport,
  tier: string,
): StrategySection {
  const items: StrategyItem[] = [];
  const activeCampaigns = ads.campaigns.filter((c) => c.status === "ENABLED");

  if (activeCampaigns.length > 0) {
    items.push(si(`${activeCampaigns.length} active campaign(s) currently running`, "metric"));
    activeCampaigns.forEach((c) => {
      items.push(si(`→ ${c.name} (${c.type}) — $${c.dailyBudget}/day, ${c.conversions30d} conv/30d`, "metric"));
    });
    items.push(si("Recommendation: optimize existing campaigns before adding new ones", "action"));
  }

  if (tier === "micro" || tier === "low") {
    items.push(si("Single campaign focus — avoid splitting limited budget", "action"));
    items.push(si("Start with core conversion campaign targeting highest-intent audiences", "action"));
  } else if (tier === "medium") {
    items.push(si("2–3 campaign structure recommended", "action"));
    items.push(si("Campaign 1: Core conversion (60% budget)", "action"));
    items.push(si("Campaign 2: Retargeting (25% budget)", "action"));
    items.push(si("Campaign 3: Prospecting/testing (15% budget)", "action"));
  } else {
    items.push(si("Full-funnel campaign structure", "action"));
    items.push(si("Awareness → Consideration → Conversion → Retention tiers", "action"));
    items.push(si("Allocate 10–15% to experimental campaigns", "action"));
  }

  items.push(si("Naming: [Type]_[Goal]_[Audience]_[Date]", "insight"));

  return sec("Campaign Architecture", "LayoutGrid", items);
}

// ─── Landing Page Notes ─────────────────────────────────────────────────────

function buildLandingPageNotes(ga4: GA4Report): StrategySection {
  const items: StrategyItem[] = [];
  const sorted = [...ga4.topLandingPages].sort((a, b) => b.conversions - a.conversions);

  items.push(si(`${sorted.length} landing pages analysed from GA4 data`, "metric"));

  sorted.slice(0, 5).forEach((lp) => {
    const engPct = (lp.engagementRate * 100).toFixed(0);
    items.push(si(
      `${lp.path} — ${lp.sessions.toLocaleString()} sessions, ${engPct}% engagement, ${lp.conversions} conversions`,
      lp.engagementRate > 0.6 ? "insight" : "warning"
    ));
  });

  const bestPage = sorted[0];
  if (bestPage) {
    items.push(si(`Best converter: ${bestPage.path} — use as primary ad destination`, "action"));
  }

  const lowEngagement = ga4.topLandingPages.filter((lp) => lp.engagementRate < 0.4 && lp.sessions > 1000);
  if (lowEngagement.length > 0) {
    items.push(si(`${lowEngagement.length} high-traffic page(s) have low engagement — optimise before driving more ad traffic`, "warning"));
  }

  if (ga4.engagement.bounceRate > 0.5) {
    items.push(si(`Overall bounce rate ${(ga4.engagement.bounceRate * 100).toFixed(0)}% — landing page improvements needed`, "warning"));
  }

  return sec("Landing Page Notes", "FileText", items);
}

// ─── Budget Analysis ────────────────────────────────────────────────────────

function buildBudgetAnalysis(
  setup: QuickSetup,
  ads: AdsReport,
  country: CountryProfile,
  tier: string,
): { allocations: BudgetAllocation[]; notes: string[] } {
  const budget = setup.monthlyBudget;
  const notes: string[] = [];
  const allocations: BudgetAllocation[] = [];

  notes.push(`Monthly budget: ${setup.currency} ${budget.toLocaleString()} (${tier} tier for ${country.name})`);
  notes.push(`Daily target: ${setup.currency} ${Math.round(budget / 30).toLocaleString()}/day`);

  if (ads.totalSpend30d > 0) {
    notes.push(`Current monthly spend: $${ads.totalSpend30d.toLocaleString()}`);
    const change = ((budget - ads.totalSpend30d) / ads.totalSpend30d * 100).toFixed(0);
    notes.push(`Budget change: ${Number(change) >= 0 ? "+" : ""}${change}%`);
  }

  // Allocations
  if (setup.goal === "sales") {
    allocations.push({ label: "Search / Shopping", percentage: 50, amount: Math.round(budget * 0.5), note: "High-intent conversion" });
    allocations.push({ label: "Performance Max", percentage: 30, amount: Math.round(budget * 0.3), note: "AI-driven sales" });
    allocations.push({ label: "Retargeting", percentage: 15, amount: Math.round(budget * 0.15), note: "Re-engage visitors" });
    allocations.push({ label: "Testing", percentage: 5, amount: Math.round(budget * 0.05), note: "New audiences / creatives" });
  } else if (setup.goal === "leads") {
    allocations.push({ label: "Search", percentage: 60, amount: Math.round(budget * 0.6), note: "High-intent lead capture" });
    allocations.push({ label: "Display Retargeting", percentage: 25, amount: Math.round(budget * 0.25), note: "Nurture visitors" });
    allocations.push({ label: "Testing", percentage: 15, amount: Math.round(budget * 0.15), note: "New channels / audiences" });
  } else if (setup.goal === "awareness") {
    allocations.push({ label: "Display / Video", percentage: 50, amount: Math.round(budget * 0.5), note: "Maximum reach" });
    allocations.push({ label: "Social", percentage: 30, amount: Math.round(budget * 0.3), note: "Audience engagement" });
    allocations.push({ label: "Search (brand)", percentage: 20, amount: Math.round(budget * 0.2), note: "Capture brand interest" });
  } else {
    allocations.push({ label: "Search", percentage: 55, amount: Math.round(budget * 0.55), note: "Targeted traffic" });
    allocations.push({ label: "Display", percentage: 30, amount: Math.round(budget * 0.3), note: "Broader reach" });
    allocations.push({ label: "Testing", percentage: 15, amount: Math.round(budget * 0.15), note: "Experimentation" });
  }

  return { allocations, notes };
}

// ─── Risks ──────────────────────────────────────────────────────────────────

function buildRisks(
  ga4: GA4Report,
  ads: AdsReport,
  setup: QuickSetup,
  country: CountryProfile,
  tier: string,
): RiskWarning[] {
  const risks: RiskWarning[] = [];

  if (tier === "micro") {
    risks.push({
      title: "Very Low Budget",
      description: "Budget is extremely limited for this market. Expect slow data collection.",
      severity: "critical",
      mitigation: "Focus on single campaign, single audience. Avoid splitting budget.",
    });
  }

  if (ads.totalConversions30d === 0 && ads.campaigns.length === 0) {
    risks.push({
      title: "No Historical Data",
      description: "No campaign history means no optimization signals for automated bidding.",
      severity: "high",
      mitigation: "Start with manual CPC or Maximise Clicks. Switch to automated after 30+ conversions.",
    });
  }

  if (ga4.engagement.bounceRate > 0.55) {
    risks.push({
      title: "High Bounce Rate",
      description: `${(ga4.engagement.bounceRate * 100).toFixed(0)}% bounce rate indicates landing page issues.`,
      severity: "high",
      mitigation: "Optimise landing pages before scaling ad spend.",
    });
  }

  const purchaseEvents = ga4.keyEvents.find((e) => e.name === "purchase");
  if (!purchaseEvents && setup.goal === "sales") {
    risks.push({
      title: "No Purchase Tracking",
      description: "Purchase events not detected in GA4. Cannot measure true ROAS.",
      severity: "critical",
      mitigation: "Implement purchase event tracking before launching campaigns.",
    });
  }

  if (country.localizationImportance === "critical") {
    risks.push({
      title: "Localisation Required",
      description: `${country.name} requires native-language ads for effective performance.`,
      severity: "high",
      mitigation: "Invest in professional translation for all ad assets and landing pages.",
    });
  }

  country.commonMistakes.forEach((m) => {
    risks.push({ title: `${country.name} Mistake`, description: m, severity: "medium", mitigation: "Review your setup against this common issue." });
  });

  return risks;
}

// ─── Optimization Roadmap ───────────────────────────────────────────────────

function buildRoadmap(ads: AdsReport, tier: string): RoadmapPhase[] {
  const hasActive = ads.campaigns.some((c) => c.status === "ENABLED");

  const phases: RoadmapPhase[] = [
    {
      phase: "Week 1–2",
      title: hasActive ? "Audit & Optimise" : "Setup & Launch",
      actions: hasActive
        ? [
          "Audit existing campaigns against new strategy",
          "Pause underperforming ad groups",
          "Add negative keywords from search term reports",
          "Verify conversion tracking across all campaigns",
        ]
        : [
          "Finalise tracking setup (GA4 + Ads conversion tags)",
          "Build campaign structure per architecture plan",
          "Set conservative daily budgets (50% of target)",
          "Launch and verify tracking fires correctly",
        ],
      kpis: ["All tracking verified", "Campaigns live and spending", "No policy violations"],
    },
    {
      phase: "Week 3–4",
      title: "Initial Optimisation",
      actions: [
        "Review search term reports — add negatives",
        "Pause underperforming keywords/audiences",
        "Scale budget to 75–100% if metrics are on track",
        "Test first creative variation",
      ],
      kpis: ["CPC trending downward", "CTR improving", "First conversion data compiled"],
    },
    {
      phase: "Month 2",
      title: "Scale & Expand",
      actions: [
        "Scale winning campaigns by 20% weekly",
        "Launch retargeting campaigns",
        "Test new audiences or keyword themes",
        "Generate first monthly report",
      ],
      kpis: ["Conversion volume growing", "CPA within target range", "Month-over-month improvement"],
    },
    {
      phase: "Month 3+",
      title: "Advanced Optimisation",
      actions: [
        "Switch to automated bidding if 30+ conversions/month",
        tier === "high" || tier === "enterprise" ? "Explore Performance Max" : "Evaluate campaign expansion opportunities",
        "Implement cross-channel attribution",
        "Plan seasonal campaigns",
      ],
      kpis: ["Automated bidding active", "ROAS/CPA at target", "Scaling plan in place"],
    },
  ];

  return phases;
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export function generateStrategy(
  ga4: GA4Report,
  ads: AdsReport,
  setup: QuickSetup,
): StrategyOutput {
  const country = getCountryProfile(setup.country);
  const scores = calculateScores(ga4, ads, setup, country);
  const tier = getBudgetTier(setup.monthlyBudget, country.costLevel);

  const platform = recommendPlatform(setup, ga4, ads, country);
  const campaignType = recommendCampaignType(setup, ga4, ads);
  const geo = recommendGeo(setup, ga4, country);
  const market = buildMarketAssessment(ga4, ads, country);
  const architecture = buildArchitecture(setup, ads, tier);
  const landingPages = buildLandingPageNotes(ga4);
  const budget = buildBudgetAnalysis(setup, ads, country, tier);
  const risks = buildRisks(ga4, ads, setup, country, tier);
  const roadmap = buildRoadmap(ads, tier);
  const draft = generateCampaignDraft(setup, ga4, ads, country, campaignType.type);

  const activeCampaigns = ads.campaigns.filter((c) => c.status === "ENABLED").length;
  const summary = [
    `Strategy for ${setup.websiteUrl} targeting ${country.name} with a ${setup.goal} goal.`,
    `Budget: ${setup.currency} ${setup.monthlyBudget.toLocaleString()}/month (${tier} tier).`,
    `${activeCampaigns} active campaign(s) detected.`,
    `${ga4.totalSessions.toLocaleString()} sessions and ${ads.totalConversions30d} conversions in the last 30 days.`,
    `Recommended platform: ${platform.platform}. Recommended campaign type: ${campaignType.type}.`,
    `Overall readiness score: ${scores.overall.score}/100.`,
  ].join(" ");

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      websiteUrl: setup.websiteUrl,
      country: country.name,
      goal: setup.goal,
      monthlyBudget: setup.monthlyBudget,
      currency: setup.currency,
      estimatedTimeToResults: tier === "micro" || tier === "low" ? "8–12 weeks" : tier === "medium" ? "4–8 weeks" : "2–4 weeks",
    },
    scores,
    summary,
    platformRecommendation: platform,
    campaignTypeRecommendation: campaignType,
    geoTargeting: geo,
    marketAssessment: market,
    campaignArchitecture: architecture,
    budgetAnalysis: budget,
    landingPageNotes: landingPages,
    risks,
    optimizationRoadmap: roadmap,
    draft,
  };
}
