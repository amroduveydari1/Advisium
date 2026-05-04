export type TargetCountry = "TR" | "US" | "UK" | "AE" | "DE" | "SA" | "CA" | "AU";

// ─── Website Analysis ────────────────────────────────────────────────────────

export interface CROSuggestion {
  category: string;
  issue: string;
  fix: string;
  priority: "high" | "medium" | "low";
}

export interface AdCopyIdea {
  headline1: string;
  headline2: string;
  headline3: string;
  description1: string;
  description2: string;
}

export interface WebsiteAnalysis {
  businessType: string;
  industry: string;
  detectedProducts: string[];
  primaryKeywords: string[];
  longTailKeywords: string[];
  negativeKeywords: string[];
  improvementSuggestions: CROSuggestion[];
  seoScore: number;
  adReadinessScore: number;
  adCopyIdeas: AdCopyIdea[];
}

// ─── Meta Ads ───────────────────────────────────────────────────────────────

export interface MetaAdSet {
  name: string;
  audience: string;
  ageRange: string;
  interests: string[];
  placements: string[];
  dailyBudget: number;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
}

export interface MetaCampaign {
  name: string;
  objective: string;
  dailyBudget: number;
  adSets: MetaAdSet[];
  notes: string[];
}

// ─── Proposal ───────────────────────────────────────────────────────────────

export interface ProposalPhase {
  number: number;
  title: string;
  duration: string;
  description: string;
  deliverables: string[];
  budget: number;
  channels: string[];
}

export interface ProposalData {
  clientName: string;
  websiteUrl: string;
  preparedBy: string;
  date: string;
  executive: string;
  phases: ProposalPhase[];
  totalBudget: number;
  totalDuration: string;
  objectives: string[];
  kpis: string[];
}

export type CampaignGoal = "sales" | "leads" | "traffic" | "awareness";

export type PlatformPreference = "auto" | "google" | "both";

export interface QuickSetup {
	websiteUrl: string;
	country: TargetCountry;
	goal: CampaignGoal;
	monthlyBudget: number;
	currency: string;
	platformPreference: PlatformPreference;
}

export interface GA4Property {
	id: string;
	displayName: string;
}

export interface AdsAccount {
	id: string;
	name: string;
}

export interface ChannelMetric {
	channel: string;
	sessions: number;
	percentage: number;
}

export interface CountrySessionMetric {
	country: string;
	sessions: number;
	percentage: number;
}

export interface DeviceMetric {
	device: string;
	sessions: number;
	percentage: number;
}

export interface KeyEventMetric {
	name: string;
	conversions: number;
}

export interface LandingPageMetric {
	path: string;
	sessions: number;
	engagementRate: number;
	conversions: number;
}

export interface GA4Report {
	propertyId: string;
	totalSessions: number;
	engagement: {
		bounceRate: number;
		engagementRate: number;
	};
	channelMix: ChannelMetric[];
	sessionsByCountry: CountrySessionMetric[];
	deviceSplit: DeviceMetric[];
	keyEvents: KeyEventMetric[];
	topLandingPages: LandingPageMetric[];
}

export interface AdsCampaignReport {
	id: string;
	name: string;
	type: string;
	status: "ENABLED" | "PAUSED";
	dailyBudget: number;
	conversions30d: number;
}

export interface AdsReport {
	accountId: string;
	campaigns: AdsCampaignReport[];
	totalSpend30d: number;
	totalConversions30d: number;
	avgCpc: number;
	avgCtr: number;
}

export interface StrategyItem {
	text: string;
	type?: "insight" | "warning" | "action" | "metric";
}

export interface StrategySection {
	title: string;
	icon: string;
	items: StrategyItem[];
}

export interface RiskWarning {
	title: string;
	description: string;
	severity: "critical" | "high" | "medium" | "low";
	mitigation: string;
}

export interface BudgetAllocation {
	label: string;
	percentage: number;
	amount: number;
	note: string;
}

export interface RoadmapPhase {
	phase: string;
	title: string;
	actions: string[];
	kpis: string[];
}

export interface OutcomeProjection {
	conversionsMin: number;
	conversionsMax: number;
	subscribersMin: number;
	subscribersMax: number;
	assumptions: string[];
}

export interface LaunchPhase {
	phase: string; // "Phase 1", "Phase 2", "Phase 3"
	title: string;
	duration: string; // e.g. "Days 1–14"
	dailyBudget: number; // USD
	monthlyEquivalent: number;
	budgetNote: string;
	focus: string;
	channels: string[];
	actions: string[];
	kpis: string[];
	projection: OutcomeProjection;
}

export interface SocialPlatformPlan {
	platform: string;
	priority: "primary" | "secondary" | "optional";
	dailyBudget: number;
	objective: string;
	adFormats: string[];
	audienceTips: string[];
	notes: string[];
	projection: OutcomeProjection;
}

export interface SocialMediaPlan {
	platforms: SocialPlatformPlan[];
	totalDailyBudget: number;
	strategy: string;
}

export interface StrategyScore {
	score: number;
	rationale: string[];
}

export interface StrategyScores {
	overall: StrategyScore;
	tracking: StrategyScore;
	adReadiness: StrategyScore;
	budgetRealism: StrategyScore;
	marketDifficulty: StrategyScore;
}

export interface BenchmarkMetricInsight {
	name: string;
	current: string;
	benchmark: string;
	status: "good" | "watch" | "improve";
	explanation: string;
}

export interface BenchmarkInsights {
	market: string;
	metrics: BenchmarkMetricInsight[];
	notes: string[];
}

export interface RecommendationConfidence {
	area: string;
	score: number;
	note: string;
}

export interface CampaignDraftAdGroup {
	name: string;
	keywords?: string[];
	negativeKeywords?: string[];
	audienceSignals?: string[];
	headlines?: string[];
	descriptions?: string[];
}

export interface DraftCampaign {
	name: string;
	type: string;
	dailyBudget: number;
	biddingStrategy: string;
	geoTargets: string[];
	language: string;
	adGroups: CampaignDraftAdGroup[];
	notes: string[];
	sitelinkExtensions?: string[];
	calloutExtensions?: string[];
}

export interface CampaignDraft {
	totalDailyBudget: number;
	totalMonthlyBudget: number;
	warnings: string[];
	campaigns: DraftCampaign[];
	metaCampaigns?: MetaCampaign[];
}

export interface StrategyOutput {
	meta: {
		generatedAt: string;
		websiteUrl: string;
		country: string;
		goal: CampaignGoal;
		monthlyBudget: number;
		currency: string;
		estimatedTimeToResults: string;
	};
	scores: StrategyScores;
	summary: string;
	websiteAnalysis: WebsiteAnalysis;
	platformRecommendation: {
		platform: string;
		reasoning: string[];
	};
	campaignTypeRecommendation: {
		type: string;
		reasoning: string[];
	};
	geoTargeting: {
		targets: string[];
		reasoning: string[];
	};
	marketAssessment: StrategySection;
	campaignArchitecture: StrategySection;
	budgetAnalysis: {
		allocations: BudgetAllocation[];
		notes: string[];
	};
	benchmarkInsights: BenchmarkInsights;
	confidenceScores: RecommendationConfidence[];
	landingPageNotes: StrategySection;
	risks: RiskWarning[];
	optimizationRoadmap: RoadmapPhase[];
	launchPhases: LaunchPhase[];
	socialMediaPlan: SocialMediaPlan;
	draft: CampaignDraft;
	proposal: ProposalData;
}
