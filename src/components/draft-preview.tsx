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
import { cn } from "@/lib/utils";
import type { CampaignDraft } from "@/types";

interface DraftPreviewProps {
  draft: CampaignDraft;
  accountId: string;
}

function GoogleAdPreview({ headline1, headline2, headline3, desc1, desc2, url }: {
  headline1: string; headline2: string; headline3: string;
  desc1: string; desc2: string; url: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white/5 p-4 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ad Preview</p>
      <p className="text-[11px] text-muted-foreground truncate">{url}</p>
      <p className="text-base font-semibold text-blue-400 leading-snug">
        {headline1} | {headline2} | {headline3}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc1}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc2}</p>
    </div>
  );
}

function MetaAdPreview({ headline, primaryText, description, cta }: {
  headline: string; primaryText: string; description: string; cta: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white/5 overflow-hidden">
      <div className="h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">[ Creative Asset ]</p>
      </div>
      <div className="p-4 space-y-1">
        <p className="text-sm font-semibold leading-snug">{headline}</p>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{primaryText}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="pt-2">
          <Badge variant="secondary" className="text-xs">{cta} →</Badge>
        </div>
      </div>
    </div>
  );
}

export function DraftPreview({ draft, accountId }: DraftPreviewProps) {
  const [activeTab, setActiveTab] = useState<"google" | "meta">("google");
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

  const hasMeta = draft.metaCampaigns && draft.metaCampaigns.length > 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Campaign Drafts</h2>
          <p className="text-sm text-muted-foreground">
            ${draft.totalDailyBudget}/day &middot; ${draft.totalMonthlyBudget.toLocaleString()}/month &middot; {draft.campaigns.length} Google campaign{draft.campaigns.length !== 1 ? "s" : ""}{hasMeta ? ` + ${draft.metaCampaigns!.length} Meta campaign${draft.metaCampaigns!.length !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        {!created ? (
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "Push Draft to Google Ads"}
          </Button>
        ) : (
          <Badge className="bg-green-500/20 text-green-400 px-3 py-1.5">Draft Created ✓</Badge>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Warnings */}
      {draft.warnings.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-1">
          <p className="text-sm font-semibold text-yellow-400">Important Notes</p>
          {draft.warnings.map((w, i) => (
            <p key={i} className="text-xs text-muted-foreground">· {w}</p>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
        {(["google", "meta"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "google" ? "Google Ads" : "Meta Ads"}
            {tab === "google" && <Badge variant="secondary" className="ml-2 text-[10px]">{draft.campaigns.length}</Badge>}
            {tab === "meta" && hasMeta && <Badge variant="secondary" className="ml-2 text-[10px]">{draft.metaCampaigns!.length}</Badge>}
          </button>
        ))}
      </div>

      {/* Google Ads Tab */}
      {activeTab === "google" && (
        <div className="space-y-6">
          {draft.campaigns.map((campaign, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{campaign.notes?.[2] || ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">{campaign.type}</Badge>
                    <Badge variant="secondary" className="text-xs">${campaign.dailyBudget}/day</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Campaign Info */}
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Bidding</p>
                    <p className="font-medium text-xs">{campaign.biddingStrategy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Geo</p>
                    <p className="font-medium text-xs">{campaign.geoTargets.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Language</p>
                    <p className="font-medium text-xs">{campaign.language}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Daily Budget</p>
                    <p className="font-medium text-xs">${campaign.dailyBudget}</p>
                  </div>
                </div>

                {/* Sitelinks + Callouts */}
                {(campaign.sitelinkExtensions?.length || campaign.calloutExtensions?.length) && (
                  <div className="space-y-2">
                    {campaign.sitelinkExtensions && campaign.sitelinkExtensions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Sitelink Extensions</p>
                        <div className="flex flex-wrap gap-1">
                          {campaign.sitelinkExtensions.map((s, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {campaign.calloutExtensions && campaign.calloutExtensions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Callout Extensions</p>
                        <div className="flex flex-wrap gap-1">
                          {campaign.calloutExtensions.map((s, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Ad Groups */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold">Ad Groups ({campaign.adGroups.length})</p>
                  {campaign.adGroups.map((ag, j) => (
                    <div key={j} className="rounded-xl border border-border/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{ag.name}</p>
                        <Badge variant="outline" className="text-[10px]">Ad Group {j + 1}</Badge>
                      </div>

                      {/* Ad Preview */}
                      {ag.headlines && ag.headlines.length >= 3 && ag.descriptions && ag.descriptions.length >= 2 && (
                        <GoogleAdPreview
                          headline1={ag.headlines[0]}
                          headline2={ag.headlines[1]}
                          headline3={ag.headlines[2]}
                          desc1={ag.descriptions[0]}
                          desc2={ag.descriptions[1]}
                          url={campaign.geoTargets[0] || "example.com"}
                        />
                      )}

                      {/* Keywords */}
                      {ag.keywords && ag.keywords.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Target Keywords</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ag.keywords.map((kw, k) => (
                              <Badge key={k} variant="secondary" className="text-xs font-mono font-normal">{kw}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Negative Keywords */}
                      {ag.negativeKeywords && ag.negativeKeywords.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Negative Keywords</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ag.negativeKeywords.map((kw, k) => (
                              <Badge key={k} variant="outline" className="text-xs font-mono font-normal text-red-400 border-red-500/30">-{kw}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Audience Signals */}
                      {ag.audienceSignals && ag.audienceSignals.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Audience Signals</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ag.audienceSignals.map((sig, k) => (
                              <Badge key={k} variant="outline" className="text-xs">{sig}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All Headlines */}
                      {ag.headlines && ag.headlines.length > 3 && (
                        <details className="cursor-pointer">
                          <summary className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">All Headlines ({ag.headlines.length})</summary>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {ag.headlines.map((h, k) => (
                              <Badge key={k} variant="secondary" className="text-xs font-normal">{h}</Badge>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {campaign.notes.length > 0 && (
                  <div className="rounded-lg bg-muted/30 px-3 py-2 space-y-0.5">
                    {campaign.notes.filter((n) => n).map((note, j) => (
                      <p key={j} className="text-xs text-muted-foreground">· {note}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Meta Ads Tab */}
      {activeTab === "meta" && hasMeta && (
        <div className="space-y-6">
          {draft.metaCampaigns!.map((campaign, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Objective: {campaign.objective}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs w-fit">${campaign.dailyBudget}/day</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Ad Sets */}
                <div className="space-y-5">
                  {campaign.adSets.map((adSet, j) => (
                    <div key={j} className="rounded-xl border border-border/50 p-4 space-y-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">{adSet.name}</p>
                          <p className="text-xs text-muted-foreground">{adSet.audience} · Age {adSet.ageRange}</p>
                        </div>
                        <Badge variant="outline" className="text-xs w-fit">${adSet.dailyBudget}/day</Badge>
                      </div>

                      {/* Ad Preview */}
                      <MetaAdPreview
                        headline={adSet.headline}
                        primaryText={adSet.primaryText}
                        description={adSet.description}
                        cta={adSet.callToAction}
                      />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Interests / Targeting</p>
                          <div className="flex flex-wrap gap-1">
                            {adSet.interests.map((int, k) => (
                              <Badge key={k} variant="secondary" className="text-xs font-normal">{int}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Placements</p>
                          <div className="flex flex-wrap gap-1">
                            {adSet.placements.map((pl, k) => (
                              <Badge key={k} variant="outline" className="text-xs">{pl}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {campaign.notes.length > 0 && (
                  <div className="rounded-lg bg-muted/30 px-3 py-2 space-y-0.5">
                    {campaign.notes.map((note, j) => (
                      <p key={j} className="text-xs text-muted-foreground">· {note}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "meta" && !hasMeta && (
        <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">No Meta campaigns generated for this setup.</p>
          <p className="mt-1 text-xs text-muted-foreground">Change Platform Preference to "Google + Meta" and regenerate.</p>
        </div>
      )}
    </div>
  );
}
