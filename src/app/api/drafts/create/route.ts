import { NextRequest, NextResponse } from "next/server";
import type { CampaignDraft } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { draft, accountId } = body as {
      draft: CampaignDraft;
      accountId?: string;
    };

    const resolvedAccountId = accountId || "demo-account";

    if (!draft) {
      return NextResponse.json({ error: "Missing draft" }, { status: 400 });
    }

    if (!draft.campaigns || draft.campaigns.length === 0) {
      return NextResponse.json({ error: "No campaigns in draft" }, { status: 400 });
    }

    // Production: call Google Ads API to create campaigns as PAUSED
    // Demo mode: return success
    return NextResponse.json({
      success: true,
      message: `${draft.campaigns.length} campaign draft(s) created as PAUSED`,
      campaignsCreated: draft.campaigns.map((c) => ({
        name: c.name,
        type: c.type,
        dailyBudget: c.dailyBudget,
      })),
      accountId: resolvedAccountId,
    });
  } catch {
    return NextResponse.json({ error: "Draft creation failed" }, { status: 500 });
  }
}
