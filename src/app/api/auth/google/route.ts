import { NextResponse } from "next/server";
import { isDemoMode, getAuthUrl } from "@/lib/integrations/google-auth";

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ demo: true });
  }

  const analyticsUrl = getAuthUrl("analytics");
  const adsUrl = getAuthUrl("ads");
  return NextResponse.json({ demo: false, analyticsUrl, adsUrl });
}
