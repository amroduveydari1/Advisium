import { NextResponse } from "next/server";
import { getAdsAccounts } from "@/lib/integrations/google-ads";

export async function GET() {
  try {
    // Production: extract access token from cookie
    const accounts = await getAdsAccounts("demo");
    return NextResponse.json({ accounts });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Ads accounts" }, { status: 500 });
  }
}
