import type { GA4Property, GA4Report } from "@/types";

const PROPERTIES: GA4Property[] = [
	{ id: "demo-property", displayName: "Advisium Demo Store" },
	{ id: "northwind-property", displayName: "Northwind Growth Site" },
	{ id: "atlas-property", displayName: "Atlas Lead Gen" },
];

function getSeed(propertyId: string): number {
	return propertyId.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

export async function getGA4Properties(_accessToken: string): Promise<GA4Property[]> {
	return PROPERTIES;
}

export async function getGA4Report(
	_accessToken: string,
	propertyId: string,
): Promise<GA4Report> {
	const seed = getSeed(propertyId);
	const totalSessions = 18000 + (seed % 9000);
	const purchaseConversions = 20 + (seed % 35);
	const leadConversions = 45 + (seed % 40);
	const bounceRate = 0.32 + (seed % 18) / 100;

	return {
		propertyId,
		totalSessions,
		engagement: {
			bounceRate,
			engagementRate: Number((1 - bounceRate).toFixed(2)),
		},
		channelMix: [
			{ channel: "Organic Search", sessions: Math.round(totalSessions * 0.38), percentage: 38 },
			{ channel: "Paid Search", sessions: Math.round(totalSessions * 0.24), percentage: 24 },
			{ channel: "Direct", sessions: Math.round(totalSessions * 0.18), percentage: 18 },
			{ channel: "Social", sessions: Math.round(totalSessions * 0.14), percentage: 14 },
			{ channel: "Referral", sessions: Math.round(totalSessions * 0.06), percentage: 6 },
		],
		sessionsByCountry: [
			{ country: "United States", sessions: Math.round(totalSessions * 0.42), percentage: 42 },
			{ country: "United Kingdom", sessions: Math.round(totalSessions * 0.19), percentage: 19 },
			{ country: "Germany", sessions: Math.round(totalSessions * 0.12), percentage: 12 },
			{ country: "Canada", sessions: Math.round(totalSessions * 0.1), percentage: 10 },
			{ country: "Turkey", sessions: Math.round(totalSessions * 0.07), percentage: 7 },
			{ country: "Other", sessions: Math.round(totalSessions * 0.1), percentage: 10 },
		],
		deviceSplit: [
			{ device: "mobile", sessions: Math.round(totalSessions * 0.62), percentage: 62 },
			{ device: "desktop", sessions: Math.round(totalSessions * 0.31), percentage: 31 },
			{ device: "tablet", sessions: Math.round(totalSessions * 0.07), percentage: 7 },
		],
		keyEvents: [
			{ name: "purchase", conversions: purchaseConversions },
			{ name: "generate_lead", conversions: leadConversions },
			{ name: "begin_checkout", conversions: purchaseConversions * 3 },
		],
		topLandingPages: [
			{ path: "/", sessions: Math.round(totalSessions * 0.29), engagementRate: 0.71, conversions: purchaseConversions },
			{ path: "/pricing", sessions: Math.round(totalSessions * 0.18), engagementRate: 0.66, conversions: Math.round(purchaseConversions * 0.6) },
			{ path: "/collections/best-sellers", sessions: Math.round(totalSessions * 0.15), engagementRate: 0.58, conversions: Math.round(purchaseConversions * 0.45) },
			{ path: "/contact", sessions: Math.round(totalSessions * 0.09), engagementRate: 0.63, conversions: Math.round(leadConversions * 0.4) },
			{ path: "/blog/how-to-choose", sessions: Math.round(totalSessions * 0.12), engagementRate: 0.37, conversions: Math.round(leadConversions * 0.12) },
			{ path: "/landing/spring-sale", sessions: Math.round(totalSessions * 0.08), engagementRate: 0.34, conversions: Math.round(purchaseConversions * 0.18) },
		],
	};
}
