export type TargetCountry = "TR" | "US" | "UK" | "AE" | "DE" | "SA" | "CA" | "AU";

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

export interface CampaignDraftAdGroup {
	name: string;
	keywords?: string[];
	audienceSignals?: string[];
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
}

export interface CampaignDraft {
	totalDailyBudget: number;
	totalMonthlyBudget: number;
	warnings: string[];
	campaigns: DraftCampaign[];
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
	landingPageNotes: StrategySection;
	risks: RiskWarning[];
	optimizationRoadmap: RoadmapPhase[];
	draft: CampaignDraft;
}
