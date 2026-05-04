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
  LaunchPhase,
  SocialMediaPlan,
  SocialPlatformPlan,
  OutcomeProjection,
  WebsiteAnalysis,
  CROSuggestion,
  AdCopyIdea,
  ProposalData,
  ProposalPhase,
  BenchmarkInsights,
  RecommendationConfidence,
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

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildOutcomeProjection(
  setup: QuickSetup,
  country: CountryProfile,
  dailyBudget: number,
  days: number,
  channel: "search" | "social",
): OutcomeProjection {
  const budget = dailyBudget * days;
  const estimatedClicks = channel === "search"
    ? budget / Math.max(country.avgCpcSearch, 0.1)
    : (budget / Math.max(country.avgCpmSocial, 0.5)) * 1000 * 0.01;

  const baseCvrByGoal: Record<QuickSetup["goal"], number> = {
    sales: 0.018,
    leads: 0.04,
    traffic: 0.012,
    awareness: 0.007,
  };

  const trustMultiplier = country.trustSensitivity === "high" ? 0.9 : country.trustSensitivity === "low" ? 1.05 : 1;
  const localizationMultiplier = country.localizationImportance === "critical" ? 0.92 : 1;
  const cvr = baseCvrByGoal[setup.goal] * trustMultiplier * localizationMultiplier;

  const conversionsBase = estimatedClicks * cvr;

  const subscribeRateByGoal: Record<QuickSetup["goal"], number> = {
    sales: 0.55,
    leads: 0.75,
    traffic: 0.6,
    awareness: 0.45,
  };

  const subscribersBase = conversionsBase * subscribeRateByGoal[setup.goal];

  const conversionsMin = Math.max(1, Math.floor(conversionsBase * 0.75));
  const conversionsMax = Math.max(conversionsMin, Math.ceil(conversionsBase * 1.25));
  const subscribersMin = Math.max(1, Math.floor(subscribersBase * 0.75));
  const subscribersMax = Math.max(subscribersMin, Math.ceil(subscribersBase * 1.25));

  return {
    conversionsMin,
    conversionsMax,
    subscribersMin,
    subscribersMax,
    assumptions: [
      `Projections are for traffic landing on ${setup.websiteUrl}`,
      `Estimated ${Math.round(estimatedClicks).toLocaleString()} clicks over ${days} day(s)`,
      `Conversion rate model: ${(cvr * 100).toFixed(1)}% for ${setup.goal}`,
      "Ranges include +/-25% variance for auction and creative performance",
    ],
  };
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

function buildBenchmarkInsights(
  setup: QuickSetup,
  ga4: GA4Report,
  ads: AdsReport,
  country: CountryProfile,
): BenchmarkInsights {
  const currentCtr = ads.avgCtr;
  const ctrBenchmark = setup.goal === "awareness" ? 1.5 : setup.goal === "traffic" ? 2.0 : 3.5;

  const currentCpc = ads.avgCpc;
  const cpcBenchmark = country.avgCpcSearch;

  const estimatedClicks = currentCpc > 0 ? ads.totalSpend30d / currentCpc : 0;
  const cvr = estimatedClicks > 0 ? (ads.totalConversions30d / estimatedClicks) * 100 : 0;
  const cvrBenchmark = setup.goal === "sales" ? 2.0 : setup.goal === "leads" ? 4.0 : 1.5;

  const cpa = ads.totalConversions30d > 0 ? ads.totalSpend30d / ads.totalConversions30d : 0;
  const cpaBenchmark = setup.goal === "sales" ? country.avgCpcSearch * 25 : country.avgCpcSearch * 18;

  const bounceRate = ga4.engagement.bounceRate * 100;
  const bounceBenchmark = 45;

  const metrics: BenchmarkInsights["metrics"] = [
    {
      name: "CTR",
      current: `${currentCtr.toFixed(1)}%`,
      benchmark: `${ctrBenchmark.toFixed(1)}%+`,
      status: currentCtr >= ctrBenchmark ? "good" : currentCtr >= ctrBenchmark * 0.7 ? "watch" : "improve",
      explanation: "Measures ad-message relevance. Higher CTR usually means stronger audience fit.",
    },
    {
      name: "CPC",
      current: `$${currentCpc.toFixed(2)}`,
      benchmark: `$${cpcBenchmark.toFixed(2)} avg`,
      status: currentCpc <= cpcBenchmark ? "good" : currentCpc <= cpcBenchmark * 1.25 ? "watch" : "improve",
      explanation: "Shows traffic efficiency. Lower CPC gives more clicks from the same budget.",
    },
    {
      name: "Conversion Rate",
      current: `${cvr.toFixed(1)}%`,
      benchmark: `${cvrBenchmark.toFixed(1)}%+`,
      status: cvr >= cvrBenchmark ? "good" : cvr >= cvrBenchmark * 0.7 ? "watch" : "improve",
      explanation: "Indicates how well clicks turn into leads or sales.",
    },
    {
      name: "CPA",
      current: cpa > 0 ? `$${cpa.toFixed(2)}` : "n/a",
      benchmark: `$${cpaBenchmark.toFixed(2)} target`,
      status: cpa === 0 ? "watch" : cpa <= cpaBenchmark ? "good" : cpa <= cpaBenchmark * 1.2 ? "watch" : "improve",
      explanation: "Tracks acquisition cost. Lower CPA improves profitability.",
    },
    {
      name: "Bounce Rate",
      current: `${bounceRate.toFixed(0)}%`,
      benchmark: `< ${bounceBenchmark}%`,
      status: bounceRate <= bounceBenchmark ? "good" : bounceRate <= 55 ? "watch" : "improve",
      explanation: "Reflects landing-page quality and audience-message alignment.",
    },
  ];

  const notes = [
    `Benchmarks are adapted for ${country.name} market cost levels and your ${setup.goal} goal.`,
    "Use this section to explain performance health to clients before scaling spend.",
    "Targets should be reviewed every 30 days as account data quality improves.",
  ];

  return { market: country.name, metrics, notes };
}

function buildConfidenceScores(
  setup: QuickSetup,
  ga4: GA4Report,
  ads: AdsReport,
  scores: StrategyOutput["scores"],
): RecommendationConfidence[] {
  const hasConversionEvent = ga4.keyEvents.some((e) => e.name === "purchase" || e.name === "generate_lead");
  const activeCampaigns = ads.campaigns.filter((c) => c.status === "ENABLED").length;

  const trackingConfidence = clampScore(
    35 +
    (hasConversionEvent ? 40 : 0) +
    (ads.totalConversions30d > 20 ? 20 : ads.totalConversions30d > 0 ? 10 : 0)
  );

  const platformConfidence = clampScore(
    45 +
    (ga4.totalSessions > 5000 ? 20 : ga4.totalSessions > 1000 ? 10 : 0) +
    (activeCampaigns > 0 ? 20 : 0) +
    (setup.platformPreference === "auto" ? 0 : 10)
  );

  const budgetConfidence = clampScore(35 + scores.budgetRealism.score * 0.65);
  const forecastConfidence = clampScore((trackingConfidence * 0.45) + (budgetConfidence * 0.3) + (platformConfidence * 0.25));

  return [
    {
      area: "Tracking Reliability",
      score: trackingConfidence,
      note: hasConversionEvent
        ? "Conversion events are available, which improves optimization accuracy."
        : "Missing or weak conversion tracking lowers confidence in optimization decisions.",
    },
    {
      area: "Platform Recommendation",
      score: platformConfidence,
      note: "Confidence is based on traffic volume, campaign history, and setup preference signals.",
    },
    {
      area: "Budget Fit",
      score: budgetConfidence,
      note: "Higher confidence means current budget can support consistent testing and learning.",
    },
    {
      area: "Performance Forecast",
      score: forecastConfidence,
      note: "Forecast confidence combines tracking quality, budget realism, and available account data.",
    },
  ];
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

// ─── Launch Phases ──────────────────────────────────────────────────────────

function buildLaunchPhases(
  setup: QuickSetup,
  country: CountryProfile,
  tier: string,
): LaunchPhase[] {
  const daily = Math.round(setup.monthlyBudget / 30);
  const p1Daily = Math.max(5, Math.round(daily * 0.4 / 5) * 5);
  const p2Daily = Math.max(5, Math.round(daily * 0.65 / 5) * 5);
  const p3Daily = Math.max(5, Math.round(daily / 5) * 5);

  const isSearch = setup.goal === "sales" || setup.goal === "leads" || setup.goal === "traffic";
  const isSocial = setup.goal === "awareness";

  const phases: LaunchPhase[] = [
    {
      phase: "Phase 1",
      title: "Test & Learn",
      duration: "Days 1–14",
      dailyBudget: p1Daily,
      monthlyEquivalent: p1Daily * 30,
      budgetNote: "40% of target — keeps risk low while gathering real data",
      focus: "Prove the funnel works end-to-end before scaling",
      channels: isSearch ? ["Google Search"] : ["Meta (Facebook/Instagram)"],
      actions: [
        "Verify all conversion tracking fires correctly (GA4 + Ads tags)",
        "Launch 1 core campaign with tight audience / keyword set",
        `Set daily cap at $${p1Daily} — do NOT raise it yet`,
        "Use manual CPC or Maximise Clicks bidding",
        "Review search term reports / audience insights every 2 days",
        "Document cost-per-click and early conversion signals",
      ],
      kpis: [
        "Tracking verified (0 gaps)",
        `CTR > ${isSearch ? "3%" : "1.5%"}`,
        "No policy violations",
        "First 5–10 conversions collected",
      ],
      projection: buildOutcomeProjection(setup, country, p1Daily, 14, isSearch ? "search" : "social"),
    },
    {
      phase: "Phase 2",
      title: "Optimise & Grow",
      duration: "Days 15–30",
      dailyBudget: p2Daily,
      monthlyEquivalent: p2Daily * 30,
      budgetNote: "65% of target — scale only what's proving profitable",
      focus: "Cut waste, double down on winners, add retargeting",
      channels: isSearch
        ? ["Google Search", "Google Retargeting (Display)"]
        : ["Meta (Facebook/Instagram)", "Instagram Stories/Reels"],
      actions: [
        `Raise daily budget to $${p2Daily} on campaigns with positive ROAS/CPA`,
        "Add negative keywords / exclusion audiences from Phase 1 data",
        "Launch retargeting campaign targeting website visitors (last 30 days)",
        "A/B test 2 headline / creative variations",
        isSocial ? "Test Reels/Stories format alongside feed ads" : "Expand to 2–3 top-performing ad groups",
        "Switch to Maximise Conversions if 15+ conversions collected",
      ],
      kpis: [
        `CPA trending toward target ($${Math.round(setup.monthlyBudget / 30 / 0.5)} or less)`,
        "Retargeting campaign live",
        "At least 2 creatives in rotation",
        "20+ conversions accumulated",
      ],
      projection: buildOutcomeProjection(setup, country, p2Daily, 16, isSearch ? "search" : "social"),
    },
    {
      phase: "Phase 3",
      title: "Scale & Diversify",
      duration: "Month 2 onwards",
      dailyBudget: p3Daily,
      monthlyEquivalent: p3Daily * 30,
      budgetNote: "Full target budget — add new channels and automation",
      focus: "Maximise volume at proven CPA, expand to social & retargeting",
      channels: [
        ...(isSearch ? ["Google Search", "Performance Max"] : ["Meta (Facebook/Instagram)"]),
        country.metaAdsStrength >= 7 && isSearch ? "Meta Ads (top-of-funnel)" : "",
        country.tiktokStrength >= 7 ? "TikTok Ads (awareness)" : "",
      ].filter(Boolean) as string[],
      actions: [
        `Set full daily budget $${p3Daily} across all active campaigns`,
        tier === "medium" || tier === "high" || tier === "enterprise"
          ? "Launch Performance Max to complement Search campaigns"
          : "Expand keyword themes in winning ad groups",
        "Enable automated bidding (Target CPA / Target ROAS)",
        country.metaAdsStrength >= 7 ? `Launch Meta Ads with $${Math.round(p3Daily * 0.3)} daily budget for top-of-funnel reach` : "Monitor brand search volume growth",
        country.tiktokStrength >= 7 ? "Test TikTok In-Feed Ads with short creative (9–15 sec)" : "Expand Google Display retargeting audiences",
        "Set up monthly performance review cadence",
        "Plan seasonal campaigns based on " + country.seasonalPeaks[0],
      ],
      kpis: [
        "Automated bidding active and stable",
        "Multi-channel attribution set up",
        "MoM conversion volume growing > 15%",
        "ROAS / CPA consistently at or below target",
      ],
      projection: buildOutcomeProjection(setup, country, p3Daily, 30, isSearch ? "search" : "social"),
    },
  ];

  return phases;
}

// ─── Social Media Plan ───────────────────────────────────────────────────────

function buildSocialMediaPlan(
  setup: QuickSetup,
  country: CountryProfile,
): SocialMediaPlan {
  const daily = Math.round(setup.monthlyBudget / 30);
  const platforms: SocialPlatformPlan[] = [];

  // Meta (Facebook / Instagram)
  if (country.metaAdsStrength >= 6) {
    const metaBudget = setup.goal === "awareness"
      ? Math.round(daily * 0.6 / 5) * 5
      : Math.round(daily * 0.3 / 5) * 5;
    const isPrimary = country.metaAdsStrength >= 8 && (setup.goal === "awareness" || setup.goal === "sales");
    platforms.push({
      platform: "Meta (Facebook / Instagram)",
      priority: isPrimary ? "primary" : "secondary",
      dailyBudget: Math.max(5, metaBudget),
      objective: setup.goal === "awareness" ? "Brand Awareness / Reach" : setup.goal === "leads" ? "Lead Generation" : "Conversions",
      adFormats: ["Single Image / Carousel (Feed)", "Reels (15–30 sec)", "Stories"],
      audienceTips: [
        `Target ${country.name} — ${country.mobileFirst ? "mobile placements first" : "all placements"}`,
        "Build Custom Audience from website visitors (Pixel required)",
        "Create Lookalike Audience from existing customers (1–3%)",
        country.localizationImportance === "critical" ? `Use ${country.name} native language in copy` : "Test local vs. English creatives",
      ],
      notes: [
        `Meta strength in ${country.name}: ${country.metaAdsStrength}/10`,
        `Avg CPM: ~$${country.avgCpmSocial}`,
        ...(country.notes.filter((n) => n.toLowerCase().includes("instagram") || n.toLowerCase().includes("meta") || n.toLowerCase().includes("facebook")).slice(0, 2)),
      ],
      projection: buildOutcomeProjection(setup, country, Math.max(5, metaBudget), 30, "social"),
    });
  }

  // TikTok
  if (country.tiktokStrength >= 6) {
    const tiktokBudget = Math.max(10, Math.round(daily * 0.2 / 5) * 5);
    platforms.push({
      platform: "TikTok Ads",
      priority: country.tiktokStrength >= 8 ? "secondary" : "optional",
      dailyBudget: tiktokBudget,
      objective: setup.goal === "awareness" ? "Reach & Video Views" : "Traffic / Conversions",
      adFormats: ["In-Feed Ads (9–15 sec vertical video)", "TopView (premium launch)"],
      audienceTips: [
        "Audience skews 18–34 — strong for fashion, beauty, food, entertainment",
        "Creative must feel native — avoid corporate/polished look",
        "Hook in first 2 seconds is critical to stop the scroll",
        `Minimum $${tiktokBudget}/day to exit the learning phase`,
      ],
      notes: [
        `TikTok strength in ${country.name}: ${country.tiktokStrength}/10`,
        "Separate creatives from other platforms — TikTok requires vertical native video",
        country.tiktokStrength >= 9 ? "High-priority channel for this market" : "Good secondary reach channel",
      ],
      projection: buildOutcomeProjection(setup, country, tiktokBudget, 30, "social"),
    });
  }

  // LinkedIn
  if (country.linkedinStrength >= 6 && (setup.goal === "leads" || setup.goal === "awareness")) {
    const linkedinBudget = Math.max(15, Math.round(daily * 0.25 / 5) * 5);
    platforms.push({
      platform: "LinkedIn Ads",
      priority: setup.goal === "leads" && country.linkedinStrength >= 7 ? "secondary" : "optional",
      dailyBudget: linkedinBudget,
      objective: setup.goal === "leads" ? "Lead Gen Forms" : "Brand Awareness",
      adFormats: ["Sponsored Content", "Lead Gen Forms", "Message Ads"],
      audienceTips: [
        "Target by job title, seniority, company size — ideal for B2B",
        "Use Lead Gen Forms (pre-filled) for higher conversion rate",
        `LinkedIn CPCs are high ($${(country.avgCpcSearch * 4).toFixed(1)}–$${(country.avgCpcSearch * 8).toFixed(1)}) — qualify audience tightly`,
      ],
      notes: [
        `LinkedIn strength in ${country.name}: ${country.linkedinStrength}/10`,
        "Best for B2B products, SaaS, professional services, education",
        "Minimum $15/day recommended to gather data",
      ],
      projection: buildOutcomeProjection(setup, country, linkedinBudget, 30, "social"),
    });
  }

  // Snapchat for Gulf/Middle East
  if ((country.code === "AE" || country.code === "SA") && (setup.goal === "awareness" || setup.goal === "sales")) {
    platforms.push({
      platform: "Snapchat Ads",
      priority: "secondary",
      dailyBudget: Math.max(10, Math.round(daily * 0.15 / 5) * 5),
      objective: "Reach / App Installs / Conversions",
      adFormats: ["Snap Ads (vertical video)", "Story Ads", "Collection Ads"],
      audienceTips: [
        "Strong reach among 18–34 in Gulf region",
        "Arabic creatives perform significantly better",
        "Use Snapchat Pixel for retargeting website visitors",
      ],
      notes: [
        `Snapchat is a top-3 platform in ${country.name}`,
        "Ramadan period sees 2–3x engagement spikes",
      ],
      projection: buildOutcomeProjection(setup, country, Math.max(10, Math.round(daily * 0.15 / 5) * 5), 30, "social"),
    });
  }

  const totalDailyBudget = platforms.reduce((sum, p) => sum + p.dailyBudget, 0);

  const primaryPlatform = platforms.find((p) => p.priority === "primary");
  const strategy = primaryPlatform
    ? `Lead with ${primaryPlatform.platform} as your primary paid social channel. Layer in secondary platforms once Phase 2 is running profitably. Keep social spend to ~30% of total budget in Phase 1, scaling to 40–50% in Phase 3.`
    : `Start with search ads to capture existing demand, then layer social channels in Phase 3 for top-of-funnel reach. Social budgets should represent 25–35% of total spend.`;

  return { platforms, totalDailyBudget, strategy };
}

// ─── Website Analysis ────────────────────────────────────────────────────────

interface BusinessProfile {
  businessType: string;
  industry: string;
  products: string[];
  primaryKeywords: string[];
  longTailKeywords: string[];
  negativeKeywords: string[];
  adCopyIdeas: AdCopyIdea[];
}

function detectBusinessProfile(url: string, goal: string): BusinessProfile {
  const lower = url.toLowerCase();
  const domain = lower.replace(/https?:\/\/(www\.)?/, "").split("/")[0];

  // Fashion / Clothing
  if (
    lower.includes("fashion") || lower.includes("cloth") || lower.includes("wear") ||
    lower.includes("dress") || lower.includes("boutique") || lower.includes("style") ||
    lower.includes("lavoggue") || lower.includes("shopier") || lower.includes("apparel") ||
    lower.includes("outfit") || lower.includes("tshirt") || lower.includes("jeans")
  ) {
    return {
      businessType: "Fashion & Apparel Store",
      industry: "E-Commerce / Fashion",
      products: ["Clothing", "Accessories", "Seasonal Collections", "Lifestyle Products"],
      primaryKeywords: [
        "women's fashion online", "buy clothes online", "trendy outfits", "fashion store",
        "online clothing store", "new collection", "style shop", "affordable fashion",
      ],
      longTailKeywords: [
        "buy stylish women's dresses online", "trendy casual outfits for women",
        "affordable fashion clothing free shipping", "best online boutique for women",
        "unique clothing styles for young women", "fashion shop new arrivals",
        "buy outfit online same day delivery", "women summer collection sale",
      ],
      negativeKeywords: ["free", "DIY", "pattern sewing", "used clothes", "second hand", "thrift"],
      adCopyIdeas: [
        {
          headline1: "Shop the New Collection",
          headline2: "Free Shipping on Orders $50+",
          headline3: "Trendy Styles for Every Occasion",
          description1: "Discover handpicked fashion pieces that match your style. New arrivals every week — shop now and express yourself.",
          description2: "Affordable prices, fast delivery, and easy returns. Your perfect outfit is just one click away.",
        },
        {
          headline1: "Fashion That Speaks for You",
          headline2: "Up to 40% Off Seasonal Sale",
          headline3: "Shop Online – Fast Delivery",
          description1: "Find the latest trends in women's fashion. Curated collections designed for modern lifestyles.",
          description2: "Limited stock available. Shop the sale now and get free shipping on your first order.",
        },
        {
          headline1: "Your Style, Your Rules",
          headline2: "New Arrivals Every Week",
          headline3: "Easy Returns | Secure Checkout",
          description1: "Explore a curated selection of outfits, accessories, and must-haves. Update your wardrobe today.",
          description2: "Thousands of happy customers. Join the community and shop the latest fashion drops now.",
        },
      ],
    };
  }

  // E-commerce / Generic Store
  if (
    lower.includes("shop") || lower.includes("store") || lower.includes("market") ||
    lower.includes("buy") || lower.includes("sale") || lower.includes("product") ||
    lower.includes("ecom") || lower.includes("cart")
  ) {
    return {
      businessType: "Online Store / E-Commerce",
      industry: "E-Commerce / Retail",
      products: ["Consumer Products", "Branded Goods", "Specialty Items"],
      primaryKeywords: [
        "buy online", "online shopping", "shop now", "best deals",
        "official store", "order online", "fast delivery", "shop " + domain,
      ],
      longTailKeywords: [
        "best deals online shopping free shipping", "buy quality products online",
        "trusted online store fast delivery", "shop online secure checkout",
        "best price guaranteed online", "top rated products online",
        "order online get delivered home", "buy now pay later options",
      ],
      negativeKeywords: ["free download", "crack", "pirate", "DIY", "how to make"],
      adCopyIdeas: [
        {
          headline1: "Official Online Store",
          headline2: "Fast Delivery | Best Prices",
          headline3: "Secure Checkout Guaranteed",
          description1: "Shop our full range of products with confidence. Easy returns, fast shipping, and exclusive online deals.",
          description2: "Join thousands of satisfied customers. Order today and get your products delivered to your door.",
        },
        {
          headline1: "Shop Smart, Save More",
          headline2: "Exclusive Online Offers",
          headline3: "Order Now – Ships Today",
          description1: "Browse our top-rated products and enjoy unbeatable online prices. Limited-time offers available.",
          description2: "Fast, secure, and hassle-free shopping experience. Your satisfaction is our guarantee.",
        },
        {
          headline1: "Best Deals Available Now",
          headline2: "Free Shipping on All Orders",
          headline3: "100% Secure Payment",
          description1: "Discover the best selection of products at prices you'll love. Shop the latest deals online.",
          description2: "Safe payment, fast delivery, easy returns. Start shopping now and save on your order.",
        },
      ],
    };
  }

  // Restaurant / Food
  if (
    lower.includes("food") || lower.includes("restaurant") || lower.includes("cafe") ||
    lower.includes("kitchen") || lower.includes("eat") || lower.includes("meal") ||
    lower.includes("delivery") || lower.includes("pizza") || lower.includes("burger")
  ) {
    return {
      businessType: "Restaurant / Food Service",
      industry: "Food & Beverage",
      products: ["Dining", "Food Delivery", "Catering", "Takeaway"],
      primaryKeywords: [
        "restaurant near me", "order food online", "best food delivery", "dine in restaurant",
        "food delivery app", "order pizza online", "best restaurant", "food near me",
      ],
      longTailKeywords: [
        "best restaurant for lunch near me", "order healthy food online delivery",
        "family restaurant open now", "best local food delivery fast",
        "restaurant catering for events", "order food online 30 minute delivery",
      ],
      negativeKeywords: ["recipe", "cooking class", "how to cook", "DIY food", "food blog"],
      adCopyIdeas: [
        {
          headline1: "Order Food Online – Fast",
          headline2: "Fresh Meals Delivered to You",
          headline3: "Order Now | 30-Min Delivery",
          description1: "Enjoy restaurant-quality food delivered hot and fresh. Browse our menu and place your order in seconds.",
          description2: "Quick delivery, fresh ingredients, irresistible taste. Your next favourite meal is ready.",
        },
        {
          headline1: "Taste the Difference",
          headline2: "Fresh Ingredients Every Day",
          headline3: "Dine In or Get It Delivered",
          description1: "We prepare every dish with fresh, quality ingredients. Whether dining in or ordering online — we've got you covered.",
          description2: "Order now and enjoy a special first-order discount. Fast delivery, every time.",
        },
        {
          headline1: "Best Restaurant in Your Area",
          headline2: "Special Offers Every Day",
          headline3: "Reservations Open Now",
          description1: "Join hundreds of happy diners. Fresh menus, friendly service, and an atmosphere you'll love.",
          description2: "Book your table or order online today. Family-friendly, affordable, and absolutely delicious.",
        },
      ],
    };
  }

  // Real Estate
  if (
    lower.includes("real") || lower.includes("estate") || lower.includes("property") ||
    lower.includes("homes") || lower.includes("realty") || lower.includes("apartment") ||
    lower.includes("house") || lower.includes("rent") || lower.includes("mortgage")
  ) {
    return {
      businessType: "Real Estate Agency",
      industry: "Real Estate",
      products: ["Properties for Sale", "Rental Listings", "Property Consulting"],
      primaryKeywords: [
        "buy property", "homes for sale", "real estate agency", "apartments for rent",
        "find your home", "luxury apartments", "property investment", "real estate listings",
      ],
      longTailKeywords: [
        "buy apartment in prime location", "best real estate agency near me",
        "affordable homes for first-time buyers", "luxury villas for sale",
        "residential properties available now", "invest in real estate today",
      ],
      negativeKeywords: ["free", "DIY", "rent to own scam", "real estate exam", "license test"],
      adCopyIdeas: [
        {
          headline1: "Find Your Dream Home Today",
          headline2: "Hundreds of Listings Available",
          headline3: "Expert Agents Ready to Help",
          description1: "Browse our exclusive property listings. Our expert agents help you find the perfect home within your budget.",
          description2: "Trusted by thousands of buyers and sellers. Start your property search with us today.",
        },
        {
          headline1: "Top Real Estate Agency",
          headline2: "Buy, Sell or Rent Property",
          headline3: "Get a Free Consultation",
          description1: "Whether you're buying, selling, or investing — our experienced team guides you every step of the way.",
          description2: "Schedule a free consultation today and discover your best property options.",
        },
        {
          headline1: "Premium Properties Available",
          headline2: "Exclusive Listings Updated Daily",
          headline3: "Invest with Confidence",
          description1: "Access our curated selection of premium properties. Let our experts help you make the right investment decision.",
          description2: "Trusted real estate professionals. Decades of experience in local and international markets.",
        },
      ],
    };
  }

  // SaaS / Tech / Software
  if (
    lower.includes("saas") || lower.includes("app") || lower.includes("software") ||
    lower.includes("tech") || lower.includes("platform") || lower.includes("cloud") ||
    lower.includes("digital") || lower.includes("ai") || lower.includes("tool") ||
    lower.includes("service") || lower.includes("solution")
  ) {
    return {
      businessType: "SaaS / Digital Platform",
      industry: "Technology / Software",
      products: ["Software Subscription", "Digital Tools", "API / Platform Access"],
      primaryKeywords: [
        "best software solution", "online platform", "business tool", "digital solution",
        "try for free", "SaaS platform", "productivity software", "automation tool",
      ],
      longTailKeywords: [
        "best business software for small companies", "cloud-based tool for teams",
        "affordable SaaS solution for startups", "automate your business workflow",
        "top-rated software platform free trial", "online tool to save time and money",
      ],
      negativeKeywords: ["free crack", "pirate", "how to hack", "open source alternative", "free forever"],
      adCopyIdeas: [
        {
          headline1: "Grow Your Business Faster",
          headline2: "Try Free for 14 Days",
          headline3: "No Credit Card Required",
          description1: "Our platform helps businesses automate, scale, and succeed. Thousands of companies trust us every day.",
          description2: "Start your free trial today. Simple onboarding, powerful results, cancel anytime.",
        },
        {
          headline1: "The All-in-One Platform",
          headline2: "Save Hours Every Week",
          headline3: "Join 10,000+ Happy Users",
          description1: "Streamline your operations with our intuitive platform. Automate repetitive tasks and focus on growth.",
          description2: "Affordable pricing for every team size. Get started in minutes — no technical knowledge required.",
        },
        {
          headline1: "Smart Tools for Smart Teams",
          headline2: "Integrates with Your Stack",
          headline3: "Award-Winning Customer Support",
          description1: "Built for modern businesses. Connect all your tools and work smarter with data-driven insights.",
          description2: "Rated 4.9/5 by thousands of users. See why teams choose us over the competition.",
        },
      ],
    };
  }

  // Default / Generic Business
  return {
    businessType: "Business / Professional Services",
    industry: "Professional Services",
    products: ["Services", "Consulting", "Solutions"],
    primaryKeywords: [
      domain + " official", "best " + (goal === "leads" ? "service provider" : "online store"),
      "trusted professional", "top-rated service", "book now", "get quote",
      "contact us today", "professional solution",
    ],
    longTailKeywords: [
      "best professional service near me", "trusted company for quality results",
      "book a free consultation online", "top-rated business solution provider",
      "affordable professional services online", "get instant quote for services",
    ],
    negativeKeywords: ["free", "DIY", "how to", "tutorial", "course", "learn"],
    adCopyIdeas: [
      {
        headline1: "Professional Service You Trust",
        headline2: "Get a Free Quote Today",
        headline3: "Fast Results | Expert Team",
        description1: "We deliver high-quality results tailored to your needs. Trusted by hundreds of satisfied clients.",
        description2: "Contact us today for a free consultation. Our team is ready to help you achieve your goals.",
      },
      {
        headline1: "Quality You Can Count On",
        headline2: "Experienced Team | Great Value",
        headline3: "Start Today – Easy Process",
        description1: "Years of experience delivering exceptional results. We take care of the details so you can focus on growth.",
        description2: "Simple, transparent pricing. Get started with a free consultation — no commitment required.",
      },
      {
        headline1: "Your Success Is Our Goal",
        headline2: "Book a Free Consultation",
        headline3: "Proven Results | Happy Clients",
        description1: "We combine expertise with personalised service to deliver real outcomes. Let's work together.",
        description2: "Hundreds of clients have achieved their goals with us. See what we can do for your business.",
      },
    ],
  };
}

function buildWebsiteAnalysis(
  setup: QuickSetup,
  ga4: GA4Report,
  country: CountryProfile,
): WebsiteAnalysis {
  const profile = detectBusinessProfile(setup.websiteUrl, setup.goal);

  const croSuggestions: CROSuggestion[] = [];

  // Bounce rate
  if (ga4.engagement.bounceRate > 0.55) {
    croSuggestions.push({
      category: "Engagement",
      issue: `High bounce rate of ${(ga4.engagement.bounceRate * 100).toFixed(0)}% — visitors are leaving without engaging.`,
      fix: "Add a compelling above-the-fold value proposition, a clear CTA, and reduce page load time.",
      priority: "high",
    });
  }

  // Mobile
  const mobileShare = ga4.deviceSplit.find((d) => d.device.toLowerCase().includes("mobile"))?.percentage || 0;
  if (country.mobileFirst && mobileShare > 0) {
    croSuggestions.push({
      category: "Mobile UX",
      issue: `${mobileShare}% of your visitors are on mobile — ensure the experience is seamless.`,
      fix: "Verify mobile page speed (target < 3s), large touch targets, and a simplified checkout/lead form.",
      priority: "high",
    });
  }

  // Conversion tracking
  const hasPurchase = ga4.keyEvents.some((e) => e.name === "purchase");
  if (!hasPurchase && (setup.goal === "sales" || setup.goal === "leads")) {
    croSuggestions.push({
      category: "Tracking",
      issue: "No purchase/lead conversion events detected in GA4.",
      fix: "Install Google Tag Manager and configure purchase/lead events before launching paid ads.",
      priority: "high",
    });
  }

  // Trust signals
  if (country.trustSensitivity === "high") {
    croSuggestions.push({
      category: "Trust & Social Proof",
      issue: `${country.name} users are highly trust-sensitive — lacking reviews/ratings will hurt conversions.`,
      fix: "Add customer reviews, trust badges (SSL, secure payment), and social proof (follower counts, media mentions).",
      priority: "medium",
    });
  }

  // Localisation
  if (country.localizationImportance === "critical") {
    croSuggestions.push({
      category: "Localisation",
      issue: `Content in ${country.name} must be in the native language to convert effectively.`,
      fix: `Translate all landing pages, ad copy, and CTAs into ${country.code === "TR" ? "Turkish" : country.code === "DE" ? "German" : country.code === "SA" || country.code === "AE" ? "Arabic" : "the local language"}.`,
      priority: "high",
    });
  }

  // Low engagement pages
  const lowPages = ga4.topLandingPages.filter((p) => p.engagementRate < 0.4 && p.sessions > 500);
  if (lowPages.length > 0) {
    croSuggestions.push({
      category: "Landing Pages",
      issue: `${lowPages.length} high-traffic landing page(s) have low engagement (< 40%).`,
      fix: "Run heatmap analysis, A/B test headlines and hero images, and simplify the page structure.",
      priority: "medium",
    });
  }

  // CTA
  croSuggestions.push({
    category: "Call to Action",
    issue: "Ad destination pages need strong, visible CTAs aligned with the ad's promise.",
    fix: "Use action-oriented CTAs (\"Shop Now\", \"Get Free Quote\", \"Book Today\") above the fold with contrasting colors.",
    priority: "medium",
  });

  // Page speed (generic suggestion)
  croSuggestions.push({
    category: "Page Speed",
    issue: "Page speed directly impacts both Quality Score and conversion rates.",
    fix: "Target < 3s load on mobile. Compress images, enable lazy loading, and use a CDN for static assets.",
    priority: "low",
  });

  const seoScore = Math.min(100, Math.max(20,
    70 -
    (ga4.engagement.bounceRate > 0.55 ? 15 : 0) -
    (hasPurchase ? 0 : 10) -
    (country.localizationImportance === "critical" ? 10 : 0) +
    (ga4.engagement.engagementRate > 0.6 ? 10 : 0),
  ));

  const adReadinessScore = Math.min(100, Math.max(10,
    65 -
    (ga4.engagement.bounceRate > 0.55 ? 20 : 0) -
    (hasPurchase ? 0 : 20) +
    (ga4.totalSessions > 1000 ? 10 : 0) +
    (ga4.engagement.engagementRate > 0.5 ? 10 : 0),
  ));

  return {
    businessType: profile.businessType,
    industry: profile.industry,
    detectedProducts: profile.products,
    primaryKeywords: profile.primaryKeywords,
    longTailKeywords: profile.longTailKeywords,
    negativeKeywords: profile.negativeKeywords,
    improvementSuggestions: croSuggestions,
    seoScore,
    adReadinessScore,
    adCopyIdeas: profile.adCopyIdeas,
  };
}

// ─── Proposal Builder ────────────────────────────────────────────────────────

function buildProposal(
  setup: QuickSetup,
  country: CountryProfile,
  platform: string,
  launchPhases: LaunchPhase[],
  websiteAnalysis: WebsiteAnalysis,
): ProposalData {
  const monthly = setup.monthlyBudget;
  const daily = Math.round(monthly / 30);

  const urlObj = (() => { try { return new URL(setup.websiteUrl); } catch { return null; } })();
  const clientName = urlObj ? urlObj.hostname.replace("www.", "").split(".")[0].charAt(0).toUpperCase() + urlObj.hostname.replace("www.", "").split(".")[0].slice(1) : "Your Business";
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const phases: ProposalPhase[] = [
    {
      number: 1,
      title: "Foundation & Setup",
      duration: "Week 1–2",
      description: "We audit your current digital presence, set up tracking infrastructure, and build the campaign architecture ready for launch.",
      deliverables: [
        "Full website & analytics audit report",
        "Google Tag Manager + GA4 conversion tracking setup",
        "Google Ads account structure (campaigns, ad groups, keywords)",
        "Meta Business Manager setup & Pixel installation",
        "Audience research & competitor analysis",
        "Ad copy variations (3 sets per platform)",
      ],
      budget: Math.round(monthly * 0.1),
      channels: ["Google Ads", "Meta Ads", "Google Analytics 4"],
    },
    {
      number: 2,
      title: "Launch & Test",
      duration: "Week 3–4",
      description: "We go live with controlled budgets, monitoring performance daily and making rapid optimisations based on early data.",
      deliverables: [
        `Live campaigns on ${platform}`,
        "Daily performance monitoring & bid adjustments",
        "A/B testing of 2+ ad creative variations",
        "Negative keyword optimisation",
        "First performance report (weekly)",
        "Audience signal refinement",
      ],
      budget: Math.round(daily * 0.4 * 14),
      channels: platform.includes("Meta") ? ["Google Search", "Meta (Facebook/Instagram)"] : ["Google Search"],
    },
    {
      number: 3,
      title: "Optimise & Scale",
      duration: "Month 2",
      description: "We double down on what's working, cut what's not, and begin scaling winning campaigns to capture more market share.",
      deliverables: [
        "Retargeting campaign launch",
        "Budget scaling on top-performing campaigns",
        "Performance Max or automated bidding activation",
        "Landing page CRO recommendations",
        "Monthly comprehensive report",
        "Strategy review & next-phase planning",
      ],
      budget: Math.round(daily * 0.65 * 30),
      channels: ["Google Search", "Google Display", "Meta Retargeting"],
    },
    {
      number: 4,
      title: "Growth & Multi-Channel",
      duration: "Month 3+",
      description: "With proven results and strong data, we expand to additional channels, automate bidding, and focus on maximising ROI.",
      deliverables: [
        "Performance Max campaign expansion",
        "Additional platform integration (if applicable)",
        "Automated bidding strategy (Target CPA/ROAS)",
        "Lookalike audience campaigns",
        "Seasonal campaign planning",
        "Executive monthly KPI dashboards",
      ],
      budget: monthly,
      channels: ["Google Search", "Performance Max", "Meta Ads", country.tiktokStrength >= 7 ? "TikTok Ads" : "Google Display"],
    },
  ];

  const objectives: string[] = [];
  if (setup.goal === "sales") {
    objectives.push(`Drive qualified online sales from ${country.name} market`);
    objectives.push("Achieve measurable ROAS (Return on Ad Spend) within 30 days");
    objectives.push("Build retargeting audiences for repeat purchase campaigns");
  } else if (setup.goal === "leads") {
    objectives.push("Generate high-quality leads from targeted audiences");
    objectives.push("Build a consistent lead pipeline with measurable cost-per-lead");
    objectives.push("Nurture leads through retargeting and email capture");
  } else if (setup.goal === "awareness") {
    objectives.push("Build brand awareness and recognition in the target market");
    objectives.push("Grow website traffic and social following by 40%+ in 90 days");
    objectives.push("Create retargeting audiences for future conversion campaigns");
  } else {
    objectives.push("Drive consistent, qualified website traffic from paid channels");
    objectives.push("Reduce cost-per-click through continuous optimisation");
    objectives.push("Build lookalike audiences from high-value visitors");
  }
  objectives.push(`Establish ${websiteAnalysis.businessType} as a trusted brand in ${country.name}`);
  objectives.push("Deliver transparent, data-driven reporting every 30 days");

  const kpis: string[] = [
    setup.goal === "sales" ? "Return on Ad Spend (ROAS) ≥ 3x" :
    setup.goal === "leads" ? "Cost per Lead (CPL) within target range" :
    "Cost per Click (CPC) below market average",
    "Click-through Rate (CTR) above industry benchmark",
    "Conversion Rate improvement vs. baseline",
    "Monthly budget utilisation ≥ 90%",
    "Quality Score ≥ 7/10 across all ad groups",
    "Month-over-month performance improvement",
  ];

  return {
    clientName,
    websiteUrl: setup.websiteUrl,
    preparedBy: "Advisium Digital Agency",
    date: today,
    executive: `This proposal outlines a comprehensive ${setup.goal} marketing plan for ${clientName}, targeting the ${country.name} market with a monthly investment of ${setup.currency} ${monthly.toLocaleString()}. Our strategy combines ${platform} with data-driven optimisation to deliver measurable results within the first 30 days.`,
    phases,
    totalBudget: monthly * 3,
    totalDuration: "3+ Months",
    objectives,
    kpis,
  };
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
  const launchPhases = buildLaunchPhases(setup, country, tier);
  const socialMediaPlan = buildSocialMediaPlan(setup, country);
  const websiteAnalysis = buildWebsiteAnalysis(setup, ga4, country);
  const benchmarkInsights = buildBenchmarkInsights(setup, ga4, ads, country);
  const confidenceScores = buildConfidenceScores(setup, ga4, ads, scores);
  const draft = generateCampaignDraft(setup, ga4, ads, country, campaignType.type, websiteAnalysis);
  const proposal = buildProposal(setup, country, platform.platform, launchPhases, websiteAnalysis);

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
    websiteAnalysis,
    platformRecommendation: platform,
    campaignTypeRecommendation: campaignType,
    geoTargeting: geo,
    marketAssessment: market,
    campaignArchitecture: architecture,
    budgetAnalysis: budget,
    benchmarkInsights,
    confidenceScores,
    landingPageNotes: landingPages,
    risks,
    optimizationRoadmap: roadmap,
    launchPhases,
    socialMediaPlan,
    draft,
    proposal,
  };
}
