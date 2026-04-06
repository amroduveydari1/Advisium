import { NextRequest, NextResponse } from "next/server";
import { getGA4Report } from "@/lib/integrations/google-analytics";
import { getAdsReport } from "@/lib/integrations/google-ads";
import { generateStrategy } from "@/lib/strategy/engine";
import type { QuickSetup, TargetCountry, CampaignGoal, PlatformPreference } from "@/types";

const VALID_COUNTRIES: TargetCountry[] = ["TR", "US", "UK", "AE", "DE", "SA", "CA", "AU"];
const VALID_GOALS: CampaignGoal[] = ["sales", "leads", "traffic", "awareness"];
const VALID_PLATFORMS: PlatformPreference[] = ["auto", "google", "both"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, accountId, setup } = body as {
      propertyId?: string;
      accountId?: string;
      setup: QuickSetup;
    };

    if (!setup) {
      return NextResponse.json({ error: "Missing setup" }, { status: 400 });
    }

    if (!setup.websiteUrl || !setup.country || !setup.goal || !setup.monthlyBudget) {
      return NextResponse.json({ error: "Incomplete setup data" }, { status: 400 });
    }

    if (!VALID_COUNTRIES.includes(setup.country)) {
      return NextResponse.json({ error: "Invalid country" }, { status: 400 });
    }
    if (!VALID_GOALS.includes(setup.goal)) {
      return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
    }
    if (!VALID_PLATFORMS.includes(setup.platformPreference)) {
      return NextResponse.json({ error: "Invalid platform preference" }, { status: 400 });
    }
    if (setup.monthlyBudget <= 0 || setup.monthlyBudget > 1000000) {
      return NextResponse.json({ error: "Budget must be between 1 and 1,000,000" }, { status: 400 });
    }

    const resolvedPropertyId = propertyId || "demo-property";
    const resolvedAccountId = accountId || "demo-account";

    // Production: extract access token from cookie
    const [ga4, ads] = await Promise.all([
      getGA4Report("demo", resolvedPropertyId),
      getAdsReport("demo", resolvedAccountId),
    ]);

    const strategy = generateStrategy(ga4, ads, setup);
    return NextResponse.json(strategy);
  } catch {
    return NextResponse.json({ error: "Strategy generation failed" }, { status: 500 });
  }
}
