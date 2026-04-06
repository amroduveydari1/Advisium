import { NextRequest, NextResponse } from "next/server";
import { getGA4Report } from "@/lib/integrations/google-analytics";

export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  try {
    // Production: extract access token from cookie
    const report = await getGA4Report("demo", propertyId);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "Failed to fetch GA4 report" }, { status: 500 });
  }
}
