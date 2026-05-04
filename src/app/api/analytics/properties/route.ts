import { NextResponse } from "next/server";
import { getGA4Properties } from "@/lib/integrations/google-analytics";

export async function GET() {
  try {
    // Production: extract access token from cookie
    const properties = await getGA4Properties("demo");
    return NextResponse.json({ properties });
  } catch {
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}
