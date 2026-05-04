"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ScoreRing } from "@/components/score-ring";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { StrategyOutput } from "@/types";

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-red-500/30 bg-red-500/5",
  medium: "border-yellow-500/30 bg-yellow-500/5",
  low: "border-blue-500/30 bg-blue-500/5",
};

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 45 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-sm font-semibold">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [strategy, setStrategy] = useState<StrategyOutput | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("advisium_strategy");
    if (raw) setStrategy(JSON.parse(raw));
    else router.push("/");
  }, [router]);

  if (!strategy) return null;
  const wa = strategy.websiteAnalysis;

  return (
    <AppShell>
      <div className="space-y-10">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Marketing Strategy</p>
            <h1 className="text-3xl font-bold tracking-tight">Strategy Report</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {strategy.meta.websiteUrl} &middot; {strategy.meta.country} &middot;{" "}
              <span className="capitalize">{strategy.meta.goal}</span> goal &middot; ${strategy.meta.monthlyBudget.toLocaleString()}/mo
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => router.push("/draft")}>View Campaigns →</Button>
            <Button size="sm" onClick={() => router.push("/proposal")}>Generate Proposal →</Button>
          </div>
        </div>

        {/* Website Analysis */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Website Analysis</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Detected Business</p>
                    <p className="mt-0.5 text-xl font-bold">{wa.businessType}</p>
                    <p className="text-sm text-muted-foreground">{wa.industry}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">SEO Readiness</p>
                      <p className="text-2xl font-bold text-blue-400">{wa.seoScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ad Readiness</p>
                      <p className="text-2xl font-bold text-emerald-400">{wa.adReadinessScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Products / Services Detected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wa.detectedProducts.map((p, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Readiness Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Overall", score: strategy.scores.overall.score },
                  { label: "Tracking", score: strategy.scores.tracking.score },
                  { label: "Ad Ready", score: strategy.scores.adReadiness.score },
                  { label: "Budget", score: strategy.scores.budgetRealism.score },
                  { label: "Market", score: strategy.scores.marketDifficulty.score },
                ].map(({ label, score }) => (
                  <div key={label}>
                    <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                    <ScoreBar value={score} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* CRO Suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Website Improvement Recommendations</CardTitle>
              <p className="text-xs text-muted-foreground">Address these before scaling ad spend to maximise ROAS</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {wa.improvementSuggestions.map((s, i) => (
                  <div key={i} className={`rounded-lg border p-3 ${PRIORITY_COLORS[s.priority]}`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold">{s.category}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{s.priority} priority</Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80">{s.issue}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">→ {s.fix}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Primary Keywords</CardTitle>
                <p className="text-xs text-muted-foreground">Exact match — high intent targeting</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {wa.primaryKeywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">{kw}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Long-Tail Keywords</CardTitle>
                <p className="text-xs text-muted-foreground">Lower competition, higher conversion intent</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {wa.longTailKeywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal">{kw}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ad Copy Ideas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ad Copy Ideas</CardTitle>
              <p className="text-xs text-muted-foreground">Tailored headline &amp; description variations for your business</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {wa.adCopyIdeas.map((idea, i) => (
                  <div key={i} className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Variation {i + 1}</p>
                    <p className="text-xs font-semibold text-blue-400 leading-relaxed">
                      {idea.headline1} | {idea.headline2} | {idea.headline3}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{idea.description1}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{idea.description2}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Platform Strategy */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Platform Strategy</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Recommended Platform", value: strategy.platformRecommendation.platform, reasons: strategy.platformRecommendation.reasoning },
              { title: "Campaign Type", value: strategy.campaignTypeRecommendation.type, reasons: strategy.campaignTypeRecommendation.reasoning },
              { title: "Geo Targeting", value: strategy.geoTargeting.targets.join(", "), reasons: strategy.geoTargeting.reasoning },
            ].map(({ title, value, reasons }) => (
              <Card key={title}>
                <CardContent className="pt-5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
                  <Badge className="text-xs px-2 py-0.5">{value}</Badge>
                  <ul className="space-y-1 pt-1">
                    {reasons.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground">→ {r}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Budget Allocation */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Budget Allocation</h2>
          <Card>
            <CardContent className="pt-5 space-y-3">
              {strategy.budgetAnalysis.allocations.map((alloc, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium">{alloc.label}</div>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${alloc.percentage}%` }} />
                    </div>
                  </div>
                  <div className="w-10 text-right text-sm font-semibold">{alloc.percentage}%</div>
                  <div className="hidden w-24 text-right text-xs text-muted-foreground sm:block">${alloc.amount.toLocaleString()}/mo</div>
                  <div className="hidden text-xs text-muted-foreground lg:block">{alloc.note}</div>
                </div>
              ))}
              <Separator />
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {strategy.budgetAnalysis.notes.map((note, i) => (
                  <p key={i} className="text-xs text-muted-foreground">· {note}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3-Phase Launch Plan */}
        {strategy.launchPhases?.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">3-Phase Launch Plan</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {strategy.launchPhases.map((phase, i) => {
                const accentColors = ["border-t-amber-500", "border-t-blue-500", "border-t-emerald-500"];
                return (
                  <Card key={i} className={`border-t-2 overflow-hidden ${accentColors[i]}`}>
                    <CardContent className="pt-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{phase.phase} · {phase.duration}</p>
                          <p className="mt-0.5 text-base font-bold">{phase.title}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold">${phase.dailyBudget}<span className="text-xs font-normal text-muted-foreground">/day</span></p>
                          <p className="text-xs text-muted-foreground">${phase.monthlyEquivalent.toLocaleString()}/mo</p>
                        </div>
                      </div>
                      <p className="text-xs italic text-muted-foreground">{phase.budgetNote}</p>
                      <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Estimated Outcomes</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Conversions</p>
                            <p className="text-sm font-bold">{phase.projection?.conversionsMin ?? "—"}–{phase.projection?.conversionsMax ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Channels</p>
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {phase.channels.slice(0, 2).map((ch, j) => (
                                <span key={j} className="text-[10px] text-muted-foreground">{ch}{j < 1 && phase.channels.length > 1 ? "," : ""}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-0.5">
                        {phase.actions.slice(0, 4).map((a, j) => (
                          <li key={j} className="text-xs text-muted-foreground">→ {a}</li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-1">
                        {phase.kpis.slice(0, 3).map((kpi, j) => (
                          <Badge key={j} variant="secondary" className="text-[10px]">{kpi}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Risks */}
        {strategy.risks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Risks &amp; Warnings</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {strategy.risks.map((risk, i) => (
                <div key={i} className={`rounded-lg border p-4 ${
                  risk.severity === "critical" ? "border-red-500/30 bg-red-500/5" :
                  risk.severity === "high" ? "border-orange-500/30 bg-orange-500/5" :
                  "border-yellow-500/20 bg-yellow-500/5"
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={risk.severity === "critical" ? "destructive" : "outline"} className="text-[10px] capitalize">{risk.severity}</Badge>
                    <span className="text-sm font-semibold">{risk.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">{risk.description}</p>
                  <p className="text-xs text-blue-400">→ {risk.mitigation}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Optimisation Roadmap */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Optimisation Roadmap</h2>
          <Card>
            <CardContent className="pt-5">
              <div className="space-y-6">
                {strategy.optimizationRoadmap.map((phase, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">{i + 1}</div>
                      {i < strategy.optimizationRoadmap.length - 1 && <div className="mt-1 h-full w-px bg-border" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold">{phase.phase}: {phase.title}</p>
                      <ul className="mt-1 space-y-0.5">
                        {phase.actions.map((action, j) => (
                          <li key={j} className="text-xs text-muted-foreground">→ {action}</li>
                        ))}
                      </ul>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {phase.kpis.map((kpi, k) => (
                          <Badge key={k} variant="secondary" className="text-[10px]">{kpi}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Banner */}
        <div className="flex flex-col gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Ready to launch?</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Review your Google Ads &amp; Meta campaigns, then generate the client proposal PDF.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => router.push("/draft")}>View Campaigns</Button>
            <Button onClick={() => router.push("/proposal")}>Generate Proposal</Button>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
