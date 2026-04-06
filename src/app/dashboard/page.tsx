"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ScoreRing } from "@/components/score-ring";
import { StrategySection } from "@/components/strategy-section";
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

export default function DashboardPage() {
  const router = useRouter();
  const [strategy, setStrategy] = useState<StrategyOutput | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("advisium_strategy");
    if (raw) {
      setStrategy(JSON.parse(raw));
    } else {
      router.push("/");
    }
  }, [router]);

  if (!strategy) return null;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Your Strategy
            </h1>
            <p className="mt-1 text-muted-foreground">
              {strategy.meta.websiteUrl} &middot; {strategy.meta.country}{" "}
              &middot; {strategy.meta.goal}
            </p>
          </div>
          <Button onClick={() => router.push("/draft")}>
            Review Draft &rarr;
          </Button>
        </div>

        {/* Scores */}
        <Card>
          <CardContent className="flex items-center justify-around py-6">
            <ScoreRing
              score={strategy.scores.overall.score}
              label="Overall"
              size={90}
            />
            <ScoreRing
              score={strategy.scores.tracking.score}
              label="Tracking"
            />
            <ScoreRing
              score={strategy.scores.adReadiness.score}
              label="Ad Ready"
            />
            <ScoreRing
              score={strategy.scores.budgetRealism.score}
              label="Budget"
            />
            <ScoreRing
              score={strategy.scores.marketDifficulty.score}
              label="Market"
            />
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {strategy.summary}
            </p>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="mb-2">
                {strategy.platformRecommendation.platform}
              </Badge>
              <ul className="mt-2 space-y-1">
                {strategy.platformRecommendation.reasoning.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Campaign Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="mb-2">
                {strategy.campaignTypeRecommendation.type}
              </Badge>
              <ul className="mt-2 space-y-1">
                {strategy.campaignTypeRecommendation.reasoning.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Geo Targeting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex gap-1">
                {strategy.geoTargeting.targets.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
              <ul className="mt-2 space-y-1">
                {strategy.geoTargeting.reasoning.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Sections */}
        <StrategySection
          title="Market Assessment"
          items={strategy.marketAssessment.items}
        />
        <StrategySection
          title="Campaign Architecture"
          items={strategy.campaignArchitecture.items}
        />
        <StrategySection
          title="Landing Page Analysis"
          items={strategy.landingPageNotes.items}
        />

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategy.budgetAnalysis.allocations.map((alloc, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span>{alloc.label}</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${alloc.percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-medium">
                    {alloc.percentage}%
                  </span>
                </div>
              </div>
            ))}
            <Separator />
            {strategy.budgetAnalysis.notes.map((note, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                &middot; {note}
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Risks */}
        {strategy.risks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Risks &amp; Warnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {strategy.risks.map((risk, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        risk.severity === "critical"
                          ? "destructive"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {risk.severity}
                    </Badge>
                    <span className="text-sm font-medium">{risk.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {risk.description}
                  </p>
                  <p className="text-xs text-blue-400">
                    &rarr; {risk.mitigation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Roadmap */}
        <Card>
          <CardHeader>
            <CardTitle>Optimization Roadmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {strategy.optimizationRoadmap.map((phase, i) => (
              <div key={i}>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium">
                    {phase.phase}: {phase.title}
                  </span>
                </div>
                <div className="ml-8 space-y-1">
                  {phase.actions.map((action, j) => (
                    <p key={j} className="text-sm text-muted-foreground">
                      &rarr; {action}
                    </p>
                  ))}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {phase.kpis.map((kpi, k) => (
                      <Badge
                        key={k}
                        variant="secondary"
                        className="text-xs"
                      >
                        {kpi}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
