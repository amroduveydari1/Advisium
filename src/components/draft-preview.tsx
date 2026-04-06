"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CampaignDraft } from "@/types";

interface DraftPreviewProps {
  draft: CampaignDraft;
  accountId: string;
}

export function DraftPreview({ draft, accountId }: DraftPreviewProps) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/drafts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, accountId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create draft");
      }
      setCreated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Campaign Draft</h2>
          <p className="text-sm text-muted-foreground">
            ${draft.totalDailyBudget}/day &middot; $
            {draft.totalMonthlyBudget}/month &middot;{" "}
            {draft.campaigns.length} campaign(s)
          </p>
        </div>
        {!created ? (
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "Create Draft in Google Ads"}
          </Button>
        ) : (
          <Badge className="bg-green-500/20 text-green-400">
            Draft Created
          </Badge>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {draft.warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="mb-2 text-sm font-medium text-yellow-400">Notes</p>
          <ul className="space-y-1">
            {draft.warnings.map((w, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                &middot; {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft.campaigns.map((campaign, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{campaign.name}</CardTitle>
              <Badge variant="outline">{campaign.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <div className="text-muted-foreground">Daily Budget</div>
                <div className="font-medium">${campaign.dailyBudget}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bidding</div>
                <div className="font-medium">{campaign.biddingStrategy}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Geo</div>
                <div className="font-medium">
                  {campaign.geoTargets.join(", ")}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Language</div>
                <div className="font-medium">{campaign.language}</div>
              </div>
            </div>

            {campaign.adGroups.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-sm font-medium">Ad Groups</p>
                  <div className="space-y-3">
                    {campaign.adGroups.map((ag, j) => (
                      <div
                        key={j}
                        className="rounded border border-border/50 p-3"
                      >
                        <p className="text-sm font-medium">{ag.name}</p>
                        {ag.keywords && ag.keywords.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {ag.keywords.map((kw, k) => (
                              <Badge
                                key={k}
                                variant="secondary"
                                className="text-xs"
                              >
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {ag.audienceSignals && ag.audienceSignals.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {ag.audienceSignals.map((sig, k) => (
                              <Badge
                                key={k}
                                variant="outline"
                                className="text-xs"
                              >
                                {sig}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {campaign.notes.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  {campaign.notes.map((note, n) => (
                    <p key={n} className="text-xs text-muted-foreground">
                      &middot; {note}
                    </p>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
