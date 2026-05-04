import type { AdsReport, GA4Report, QuickSetup, StrategyScores } from "@/types";
import type { CountryProfile } from "@/lib/countries";

function clampScore(value: number): number {
	return Math.max(0, Math.min(100, Math.round(value)));
}

export function getBudgetTier(
	monthlyBudget: number,
	costLevel: CountryProfile["costLevel"],
): "micro" | "low" | "medium" | "high" | "enterprise" {
	const thresholds = {
		"very-low": [400, 1200, 3500, 9000],
		low: [600, 1800, 5000, 12000],
		medium: [1000, 3000, 7500, 18000],
		high: [1500, 4500, 12000, 25000],
		"very-high": [2500, 7000, 18000, 35000],
	} as const;

	const [micro, low, medium, high] = thresholds[costLevel];
	if (monthlyBudget < micro) return "micro";
	if (monthlyBudget < low) return "low";
	if (monthlyBudget < medium) return "medium";
	if (monthlyBudget < high) return "high";
	return "enterprise";
}

export function calculateScores(
	ga4: GA4Report,
	ads: AdsReport,
	setup: QuickSetup,
	country: CountryProfile,
): StrategyScores {
	const purchaseEvent = ga4.keyEvents.find((event) => event.name === "purchase");
	const leadEvent = ga4.keyEvents.find((event) => event.name === "generate_lead");
	const activeCampaigns = ads.campaigns.filter((campaign) => campaign.status === "ENABLED").length;
	const budgetTier = getBudgetTier(setup.monthlyBudget, country.costLevel);

	const tracking = clampScore(
		35 +
			(purchaseEvent ? 30 : 0) +
			(leadEvent ? 20 : 0) +
			Math.max(0, 15 - ga4.engagement.bounceRate * 10),
	);

	const adReadiness = clampScore(
		30 +
			Math.min(25, ads.totalConversions30d * 0.5) +
			activeCampaigns * 8 +
			Math.max(0, 15 - ga4.engagement.bounceRate * 20),
	);

	const budgetRealismBase = {
		micro: 35,
		low: 52,
		medium: 68,
		high: 82,
		enterprise: 92,
	}[budgetTier];

	const marketDifficulty = clampScore(
		100 -
			(country.competitionLevel === "extreme"
				? 45
				: country.competitionLevel === "high"
					? 32
					: country.competitionLevel === "medium"
						? 20
						: 10) -
			(country.costLevel === "very-high"
				? 20
				: country.costLevel === "high"
					? 12
					: country.costLevel === "medium"
						? 6
						: 0),
	);

	const budgetRealism = clampScore(
		budgetRealismBase +
			(setup.goal === "awareness" ? 6 : 0) -
			(country.budgetPressure === "high" ? 6 : 0),
	);

	const overall = clampScore(
		tracking * 0.25 +
			adReadiness * 0.3 +
			budgetRealism * 0.25 +
			marketDifficulty * 0.2,
	);

	return {
		overall: {
			score: overall,
			rationale: ["Weighted blend of tracking, account readiness, budget, and market conditions."],
		},
		tracking: {
			score: tracking,
			rationale: [
				purchaseEvent ? "Purchase event detected." : "Purchase event not detected.",
				leadEvent ? "Lead event detected." : "Lead event not detected.",
			],
		},
		adReadiness: {
			score: adReadiness,
			rationale: [
				`${activeCampaigns} active campaign(s) available for learning.`,
				`${ads.totalConversions30d} recent conversions found in Ads.`,
			],
		},
		budgetRealism: {
			score: budgetRealism,
			rationale: [`Budget assessed as ${budgetTier} for ${country.name}.`],
		},
		marketDifficulty: {
			score: marketDifficulty,
			rationale: [`Competition is ${country.competitionLevel} with ${country.costLevel} acquisition costs.`],
		},
	};
}
