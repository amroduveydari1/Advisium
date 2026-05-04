import type { AdsAccount, AdsReport } from "@/types";

const ACCOUNTS: AdsAccount[] = [
	{ id: "demo-account", name: "Advisium Demo Ads" },
	{ id: "northwind-account", name: "Northwind Search" },
	{ id: "atlas-account", name: "Atlas Demand Gen" },
];

function getSeed(accountId: string): number {
	return accountId.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

export async function getAdsAccounts(_accessToken: string): Promise<AdsAccount[]> {
	return ACCOUNTS;
}

export async function getAdsReport(
	_accessToken: string,
	accountId: string,
): Promise<AdsReport> {
	const seed = getSeed(accountId);
	const totalSpend30d = 4200 + (seed % 3500);
	const totalConversions30d = 35 + (seed % 45);

	return {
		accountId,
		totalSpend30d,
		totalConversions30d,
		avgCpc: Number((1.15 + (seed % 90) / 100).toFixed(2)),
		avgCtr: Number((3.4 + (seed % 22) / 10).toFixed(1)),
		campaigns: [
			{
				id: `${accountId}-search-core`,
				name: "Search | Core Terms",
				type: "SEARCH",
				status: "ENABLED",
				dailyBudget: 85,
				conversions30d: Math.round(totalConversions30d * 0.48),
			},
			{
				id: `${accountId}-brand`,
				name: "Search | Brand Protection",
				type: "SEARCH",
				status: "ENABLED",
				dailyBudget: 30,
				conversions30d: Math.round(totalConversions30d * 0.22),
			},
			{
				id: `${accountId}-retargeting`,
				name: "Display | Retargeting",
				type: "DISPLAY",
				status: "PAUSED",
				dailyBudget: 18,
				conversions30d: Math.round(totalConversions30d * 0.08),
			},
		],
	};
}
