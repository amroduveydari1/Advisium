import { NextRequest, NextResponse } from "next/server";
import { getAdsReport } from "@/lib/integrations/google-ads";

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  try {
    // Production: extract access token from cookie
    const report = await getAdsReport("demo", accountId);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "Failed to fetch Ads report" }, { status: 500 });
  }
}
