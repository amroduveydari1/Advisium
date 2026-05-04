import type { CountryProfile } from "@/lib/countries";
import type { AdsReport, CampaignDraft, GA4Report, MetaCampaign, QuickSetup, WebsiteAnalysis } from "@/types";

function getLanguage(country: CountryProfile): string {
	if (country.code === "TR") return "Turkish";
	if (country.code === "DE") return "German";
	if (country.code === "AE" || country.code === "SA") return "Arabic + English";
	if (country.code === "CA") return "English (+ French for Quebec)";
	return "English";
}

function buildGoogleHeadlines(websiteAnalysis: WebsiteAnalysis, setup: QuickSetup, country: CountryProfile): string[] {
	const base = websiteAnalysis.adCopyIdeas[0];
	const extra: string[] = [
		`Shop Now in ${country.name}`,
		`Official Website`,
		`Fast & Secure Delivery`,
		`Best Price Guaranteed`,
		`Limited Time Offer`,
		`Trusted by Thousands`,
		`Free Returns Available`,
		`New ${new Date().getFullYear()} Collection`,
		`Top Rated in ${country.name}`,
		`24/7 Customer Support`,
		`Buy Now – Easy Checkout`,
		`Quality You Can Trust`,
	];
	const headlines = [
		base.headline1,
		base.headline2,
		base.headline3,
		websiteAnalysis.adCopyIdeas[1]?.headline1 || extra[0],
		websiteAnalysis.adCopyIdeas[1]?.headline2 || extra[1],
		websiteAnalysis.adCopyIdeas[2]?.headline1 || extra[2],
		websiteAnalysis.adCopyIdeas[2]?.headline2 || extra[3],
		...extra.slice(4),
	].slice(0, 15);
	return headlines;
}

function buildGoogleDescriptions(websiteAnalysis: WebsiteAnalysis): string[] {
	const all: string[] = [];
	for (const idea of websiteAnalysis.adCopyIdeas) {
		if (idea.description1) all.push(idea.description1.slice(0, 90));
		if (idea.description2) all.push(idea.description2.slice(0, 90));
	}
	return all.slice(0, 4);
}

function buildSitelinkExtensions(setup: QuickSetup): string[] {
	if (setup.goal === "sales") {
		return ["Shop New Arrivals", "Sale & Offers", "Track My Order", "Return Policy"];
	}
	if (setup.goal === "leads") {
		return ["Get a Free Quote", "Our Services", "Success Stories", "Contact Us"];
	}
	if (setup.goal === "awareness") {
		return ["About Us", "Our Story", "Latest News", "Follow Us on Social"];
	}
	return ["Browse Products", "Best Sellers", "Customer Reviews", "Contact Us"];
}

function buildCalloutExtensions(websiteAnalysis: WebsiteAnalysis, country: CountryProfile): string[] {
	const base = ["Free Shipping Available", "Secure Payment", "Easy Returns", "Trusted Brand"];
	const extra: string[] = [];
	if (country.mobileFirst) extra.push("Mobile-Friendly Experience");
	if (websiteAnalysis.industry.includes("Fashion")) extra.push("New Arrivals Weekly");
	if (websiteAnalysis.industry.includes("Food")) extra.push("Order in 2 Minutes");
	if (websiteAnalysis.industry.includes("Real Estate")) extra.push("Free Property Consultation");
	if (websiteAnalysis.industry.includes("Technology")) extra.push("Free 14-Day Trial");
	return [...base, ...extra].slice(0, 6);
}

function buildMetaCampaigns(
	setup: QuickSetup,
	country: CountryProfile,
	websiteAnalysis: WebsiteAnalysis,
	totalDailyBudget: number,
): MetaCampaign[] {
	const metaBudget = Math.max(5, Math.round(totalDailyBudget * 0.4));
	const retargetingBudget = Math.max(5, Math.round(totalDailyBudget * 0.15));
	const idea0 = websiteAnalysis.adCopyIdeas[0];
	const idea1 = websiteAnalysis.adCopyIdeas[1] || idea0;
	const idea2 = websiteAnalysis.adCopyIdeas[2] || idea0;

	const metaObjective = setup.goal === "sales" ? "Conversions" :
		setup.goal === "leads" ? "Lead Generation" :
		setup.goal === "awareness" ? "Brand Awareness / Reach" : "Traffic";

	const ageRange = websiteAnalysis.industry.includes("Fashion") ? "18–35" :
		websiteAnalysis.industry.includes("Real Estate") ? "28–55" :
		websiteAnalysis.industry.includes("Technology") ? "22–45" :
		"22–45";

	const prospectingInterests = websiteAnalysis.primaryKeywords.slice(0, 5);
	const lookalikeInterests = ["Website visitors (last 30 days)", "Engaged with Page", "1% Lookalike Audience"];

	const campaigns: MetaCampaign[] = [
		{
			name: `Meta | Prospecting | ${country.code} | ${setup.goal.toUpperCase()}`,
			objective: metaObjective,
			dailyBudget: metaBudget,
			adSets: [
				{
					name: "Cold – Broad Interest Targeting",
					audience: "New Audiences",
					ageRange,
					interests: prospectingInterests,
					placements: ["Facebook Feed", "Instagram Feed", "Instagram Reels", "Facebook Stories"],
					dailyBudget: Math.round(metaBudget * 0.6),
					primaryText: idea0.description1,
					headline: idea0.headline1,
					description: idea0.description2,
					callToAction: setup.goal === "sales" ? "Shop Now" : setup.goal === "leads" ? "Learn More" : setup.goal === "awareness" ? "Learn More" : "Visit Website",
				},
				{
					name: "Interest – Targeted Audience",
					audience: "Interest-Based",
					ageRange,
					interests: websiteAnalysis.longTailKeywords.slice(0, 4),
					placements: ["Instagram Feed", "Instagram Reels", "Facebook Feed"],
					dailyBudget: Math.round(metaBudget * 0.4),
					primaryText: idea1.description1,
					headline: idea1.headline2,
					description: idea1.description2,
					callToAction: setup.goal === "sales" ? "Shop Now" : setup.goal === "leads" ? "Get Quote" : "Learn More",
				},
			],
			notes: [
				`Meta platform strength in ${country.name}: ${country.metaAdsStrength}/10`,
				`CPM estimate: ~$${country.avgCpmSocial} in ${country.name}`,
				country.localizationImportance === "critical" ? `Use ${country.code === "TR" ? "Turkish" : country.code === "DE" ? "German" : "Arabic"} copy for better performance` : "Test local language vs. English creatives",
				"Install Meta Pixel before launching — conversion events required",
				"Test Reels format in parallel with Feed placements for lower CPMs",
			],
		},
		{
			name: `Meta | Retargeting | ${country.code} | Website Visitors`,
			objective: "Conversions",
			dailyBudget: retargetingBudget,
			adSets: [
				{
					name: "Retargeting – Website Visitors (Last 30d)",
					audience: "Custom Audience – Website",
					ageRange: "18–65",
					interests: lookalikeInterests,
					placements: ["Facebook Feed", "Instagram Feed", "Messenger"],
					dailyBudget: Math.round(retargetingBudget * 0.7),
					primaryText: idea2.description1,
					headline: idea2.headline1,
					description: idea2.description2,
					callToAction: setup.goal === "sales" ? "Buy Now" : setup.goal === "leads" ? "Contact Us" : "Learn More",
				},
				{
					name: "Lookalike 1% – Best Customers",
					audience: "Lookalike Audience (1%)",
					ageRange,
					interests: ["Lookalike of purchasers / leads (1%)"],
					placements: ["Facebook Feed", "Instagram Feed", "Instagram Reels"],
					dailyBudget: Math.round(retargetingBudget * 0.3),
					primaryText: idea1.description1,
					headline: idea1.headline1,
					description: idea1.description2,
					callToAction: setup.goal === "sales" ? "Shop Now" : "Learn More",
				},
			],
			notes: [
				"Retargeting audiences require the Meta Pixel to be installed and firing",
				"Exclude recent purchasers/converters from retargeting audiences",
				"Refresh creatives every 2–3 weeks to avoid ad fatigue",
				"Lookalike audiences require minimum 100 source events to activate",
			],
		},
	];

	return campaigns;
}

export function generateCampaignDraft(
	setup: QuickSetup,
	ga4: GA4Report,
	ads: AdsReport,
	country: CountryProfile,
	campaignType: string,
	websiteAnalysis: WebsiteAnalysis,
): CampaignDraft {
	const totalDailyBudget = Math.max(10, Math.round(setup.monthlyBudget / 30));
	const coreBudget = Math.max(6, Math.round(totalDailyBudget * 0.6));
	const retargetingBudget = Math.max(4, Math.round(totalDailyBudget * 0.25));
	const brandBudget = Math.max(3, totalDailyBudget - coreBudget - retargetingBudget);

	const topLandingPage = [...ga4.topLandingPages].sort((a, b) => b.conversions - a.conversions)[0];
	const activeCampaigns = ads.campaigns.filter((campaign) => campaign.status === "ENABLED").length;

	const headlines = buildGoogleHeadlines(websiteAnalysis, setup, country);
	const descriptions = buildGoogleDescriptions(websiteAnalysis);
	const sitelinks = buildSitelinkExtensions(setup);
	const callouts = buildCalloutExtensions(websiteAnalysis, country);

	const coreKeywords = [
		...websiteAnalysis.primaryKeywords.slice(0, 5),
	];
	const longTailKeywords = websiteAnalysis.longTailKeywords.slice(0, 6);
	const negativeKeywords = websiteAnalysis.negativeKeywords.slice(0, 8);

	const campaigns = [
		{
			name: `Search | Core | ${country.code} | ${setup.goal.toUpperCase()}`,
			type: campaignType,
			dailyBudget: coreBudget,
			biddingStrategy: setup.goal === "sales" ? "Maximize Conversions" :
				setup.goal === "traffic" ? "Maximize Clicks" :
				setup.goal === "leads" ? "Maximize Conversions" :
				"Maximize Clicks",
			geoTargets: [country.name],
			language: getLanguage(country),
			adGroups: [
				{
					name: "Core Intent – Primary Keywords",
					keywords: coreKeywords.map((kw) => `[${kw}]`),
					negativeKeywords,
					headlines,
					descriptions,
				},
				{
					name: "Long-Tail – High Intent",
					keywords: longTailKeywords.map((kw) => `"${kw}"`),
					negativeKeywords,
					headlines: headlines.slice(0, 10),
					descriptions: descriptions.slice(0, 4),
				},
				{
					name: "Brand + Competitor",
					keywords: [
						`[${websiteAnalysis.businessType.split(" ")[0].toLowerCase()} brand]`,
						`"${websiteAnalysis.businessType.split(" ")[0].toLowerCase()} alternatives"`,
						`"${websiteAnalysis.businessType.split(" ")[0].toLowerCase()} reviews"`,
						`"best ${websiteAnalysis.industry.split("/")[0].trim().toLowerCase()}"`,
					],
					negativeKeywords,
					headlines: [
						`Official ${websiteAnalysis.businessType.split(" ")[0]}`,
						"Trusted Brand | Best Value",
						"Compare & Choose Us",
						...headlines.slice(8, 15),
					],
					descriptions: descriptions.slice(0, 2),
				},
			],
			notes: [
				`Primary destination: ${topLandingPage?.path || "/"}`,
				`${activeCampaigns} active campaign(s) found in account history.`,
				`Industry: ${websiteAnalysis.industry} | Business type: ${websiteAnalysis.businessType}`,
				"All keyword groups use Responsive Search Ads (RSA) — Google will auto-optimise best combinations",
			],
			sitelinkExtensions: sitelinks,
			calloutExtensions: callouts,
		},
		{
			name: `Display | Retargeting | ${country.code} | Visitors`,
			type: "DISPLAY",
			dailyBudget: retargetingBudget,
			biddingStrategy: "Maximize Conversions",
			geoTargets: [country.name],
			language: getLanguage(country),
			adGroups: [
				{
					name: "Retargeting – Website Visitors",
					audienceSignals: [
						"All website visitors (last 30 days)",
						"Visited product / service pages",
						"Abandoned cart (if applicable)",
						"Engaged users (scroll depth > 50%)",
					],
					headlines: [
						"Still Thinking? Come Back",
						"You Left Something Behind",
						"Special Offer Just for You",
						"Limited Time Deal Available",
					],
					descriptions: [
						"Pick up where you left off. Your selection is still available — order now before it's gone.",
						"We noticed you're interested. Come back and complete your order with an exclusive offer.",
					],
				},
			],
			notes: [
				"Exclude recent converters (last 30 days) from audience",
				"Refresh banner creatives every 2–3 weeks to prevent ad fatigue",
				"Use frequency caps: max 5 impressions/user/day",
			],
			sitelinkExtensions: [],
			calloutExtensions: [],
		},
		{
			name: `Search | Brand | ${country.code} | Branded`,
			type: "SEARCH",
			dailyBudget: brandBudget,
			biddingStrategy: "Target Impression Share (top 90%)",
			geoTargets: [country.name],
			language: getLanguage(country),
			adGroups: [
				{
					name: "Brand Terms",
					keywords: [
						`[${websiteAnalysis.businessType.toLowerCase().split(" ")[0]}]`,
						`"${websiteAnalysis.businessType.toLowerCase().split(" ")[0]} official"`,
						`"${websiteAnalysis.businessType.toLowerCase().split(" ")[0]} website"`,
					],
					negativeKeywords: [],
					headlines: [
						`Official ${websiteAnalysis.businessType.split(" ")[0]} Website`,
						"Visit Our Official Store",
						"Authentic | Best Price",
						"Shop the Official Collection",
					],
					descriptions: [
						`Welcome to the official ${websiteAnalysis.businessType} website. Browse our full range and shop with confidence.`,
						"Authentic products, official guarantees, and fast delivery. This is the only official source.",
					],
				},
			],
			notes: [
				"Brand campaign protects against competitor bidding on your brand name",
				"Keep CPCs low with high Quality Scores from high relevance",
				"Monitor impression share — ensure you own 90%+ of your brand terms",
			],
			sitelinkExtensions: sitelinks.slice(0, 2),
			calloutExtensions: callouts.slice(0, 4),
		},
	];

	// Include Meta campaigns if platform preference is "both" or if meta strength is high
	const includeMeta = setup.platformPreference === "both" ||
		(setup.platformPreference === "auto" && setup.goal === "awareness");
	const metaCampaigns = includeMeta ? buildMetaCampaigns(setup, country, websiteAnalysis, totalDailyBudget) : buildMetaCampaigns(setup, country, websiteAnalysis, totalDailyBudget);

	return {
		totalDailyBudget,
		totalMonthlyBudget: setup.monthlyBudget,
		warnings: [
			country.localizationImportance === "critical"
				? `⚠ Native-language creative is required for ${country.name} — all copy must be translated before launch.`
				: `Align all ad copy with ${country.name} market expectations and cultural tone.`,
			ga4.engagement.bounceRate > 0.5
				? "⚠ Landing-page engagement is weak — optimise page quality before scaling ad spend or expect high CPAs."
				: "Landing-page engagement is acceptable for initial launch.",
			"All campaigns should run in \"learning\" mode for at least 7 days before making bidding changes.",
		],
		campaigns,
		metaCampaigns,
	};
}

