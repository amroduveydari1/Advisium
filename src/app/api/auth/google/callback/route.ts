import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, exchangeCodeForTokens } from "@/lib/integrations/google-auth";

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
  }

  try {
    await exchangeCodeForTokens(code);
    // Production: store tokens in encrypted httpOnly cookie
    return NextResponse.redirect(new URL("/?connected=true", request.url));
  } catch {
    return NextResponse.json({ error: "Token exchange failed" }, { status: 500 });
  }
}
