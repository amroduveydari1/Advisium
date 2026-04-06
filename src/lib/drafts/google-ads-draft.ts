import type { CountryProfile } from "@/lib/countries";
import type { AdsReport, CampaignDraft, GA4Report, QuickSetup } from "@/types";

function getLanguage(country: CountryProfile): string {
	if (country.code === "TR") return "Turkish";
	if (country.code === "DE") return "German";
	if (country.code === "AE" || country.code === "SA") return "Arabic + English";
	if (country.code === "CA") return "English (+ French for Quebec)";
	return "English";
}

function keywordThemes(setup: QuickSetup): string[] {
	if (setup.goal === "sales") {
		return ["buy online", "pricing", "best deals", "free shipping"];
	}
	if (setup.goal === "leads") {
		return ["get quote", "book consultation", "near me", "services"];
	}
	if (setup.goal === "awareness") {
		return ["brand terms", "category terms", "audience interests"];
	}
	return ["learn more", "compare options", "category keywords", "reviews"];
}

export function generateCampaignDraft(
	setup: QuickSetup,
	ga4: GA4Report,
	ads: AdsReport,
	country: CountryProfile,
	campaignType: string,
): CampaignDraft {
	const totalDailyBudget = Math.max(10, Math.round(setup.monthlyBudget / 30));
	const coreBudget = Math.max(6, Math.round(totalDailyBudget * 0.7));
	const retargetingBudget = Math.max(4, totalDailyBudget - coreBudget);
	const topLandingPage = [...ga4.topLandingPages].sort((a, b) => b.conversions - a.conversions)[0];
	const activeCampaigns = ads.campaigns.filter((campaign) => campaign.status === "ENABLED").length;

	const campaigns = [
		{
			name: `${campaignType} | Core | ${country.code}`,
			type: campaignType,
			dailyBudget: coreBudget,
			biddingStrategy:
				setup.goal === "sales"
					? "Maximize Conversions"
					: setup.goal === "traffic"
						? "Maximize Clicks"
						: "Maximize Conversion Value",
			geoTargets: [country.name],
			language: getLanguage(country),
			adGroups: [
				{
					name: "Core Intent",
					keywords: keywordThemes(setup),
				},
				{
					name: "Brand + Competitor",
					keywords: ["brand", "alternatives", "reviews", "pricing"],
				},
			],
			notes: [
				`Primary destination: ${topLandingPage?.path || "/"}`,
				`${activeCampaigns} active campaign(s) found in account history.`,
			],
		},
		{
			name: `Retargeting | Visitors | ${country.code}`,
			type: "DISPLAY",
			dailyBudget: retargetingBudget,
			biddingStrategy: "Maximize Conversions",
			geoTargets: [country.name],
			language: getLanguage(country),
			adGroups: [
				{
					name: "Engaged Visitors",
					audienceSignals: ["Visited pricing page", "Added to cart", "Viewed product pages"],
				},
			],
			notes: [
				"Exclude recent converters from retargeting audience.",
				"Refresh creatives every 2-3 weeks to avoid fatigue.",
			],
		},
	];

	return {
		totalDailyBudget,
		totalMonthlyBudget: setup.monthlyBudget,
		warnings: [
			country.localizationImportance === "critical"
				? `Local language creative is required for ${country.name}.`
				: `Align ad copy with ${country.name} market expectations.`,
			ga4.engagement.bounceRate > 0.5
				? "Landing-page engagement is weak; improve page quality before scaling."
				: "Landing-page engagement is acceptable for launch.",
		],
		campaigns,
	};
}
