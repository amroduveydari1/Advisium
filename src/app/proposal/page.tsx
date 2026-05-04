"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { StrategyOutput } from "@/types";

const PHASE_COLORS = [
  { bg: "bg-amber-500", light: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" },
  { bg: "bg-blue-500", light: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400" },
  { bg: "bg-violet-500", light: "bg-violet-500/10 border-violet-500/30", text: "text-violet-400" },
  { bg: "bg-emerald-500", light: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" },
];

export default function ProposalPage() {
  const router = useRouter();
  const proposalRef = useRef<HTMLDivElement>(null);
  const [strategy, setStrategy] = useState<StrategyOutput | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("advisium_strategy");
    if (raw) setStrategy(JSON.parse(raw));
    else router.push("/");
  }, [router]);

  async function handleDownloadPDF() {
    if (!proposalRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const element = proposalRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0a0a0a",
        logging: false,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const canvasAspect = canvas.height / canvas.width;
      const imgHeight = pageWidth * canvasAspect;

      let position = 0;
      let remaining = imgHeight;

      while (remaining > 0) {
        if (position > 0) pdf.addPage();
        const srcY = (position / imgHeight) * canvas.height;
        const srcH = Math.min((pageHeight / imgHeight) * canvas.height, canvas.height - srcY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcH;
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
          const sliceData = sliceCanvas.toDataURL("image/png");
          const sliceH = (srcH / canvas.height) * imgHeight;
          pdf.addImage(sliceData, "PNG", 0, 0, pageWidth, sliceH);
        }
        position += pageHeight;
        remaining -= pageHeight;
      }

      const clientName = strategy?.proposal.clientName || "Client";
      pdf.save(`Advisium-Proposal-${clientName}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setDownloading(false);
    }
  }

  if (!strategy) return null;

  const p = strategy.proposal;
  const wa = strategy.websiteAnalysis;

  return (
    <AppShell>
      <div className="space-y-6">

        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Final Step</p>
            <h1 className="text-3xl font-bold tracking-tight">Client Proposal</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Professional agency proposal — ready to download as PDF.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="shrink-0"
          >
            {downloading ? "Generating PDF…" : "↓ Download PDF"}
          </Button>
        </div>

        {/* ──────────────── PROPOSAL DOCUMENT ──────────────── */}
        <div
          ref={proposalRef}
          className="rounded-2xl border border-border/60 bg-[#0a0a0a] overflow-hidden"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >

          {/* Cover */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-[#0a0a0a] to-[#0a0a0a] px-10 py-16">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 40%)",
            }} />
            <div className="relative">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold tracking-tight text-white">Advisium</p>
                  <p className="text-xs text-white/50">Digital Marketing Agency</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/50">Prepared</p>
                  <p className="text-xs text-white/70">{p.date}</p>
                </div>
              </div>

              <div className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Marketing Proposal</p>
                <h1 className="text-4xl font-bold text-white leading-tight">
                  Digital Marketing<br />
                  Full Plan
                </h1>
                <p className="mt-2 text-lg text-white/60">for {p.clientName}</p>
              </div>

              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Website</p>
                  <p className="text-sm text-white/80">{p.websiteUrl}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Industry</p>
                  <p className="text-sm text-white/80">{wa.industry}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Market</p>
                  <p className="text-sm text-white/80">{strategy.meta.country}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Investment</p>
                  <p className="text-sm text-white/80">${strategy.meta.monthlyBudget.toLocaleString()}/month</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Duration</p>
                  <p className="text-sm text-white/80">{p.totalDuration}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-10 py-12 space-y-14">

            {/* Executive Summary */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-border/40" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Executive Summary</p>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-6">
                <p className="text-sm leading-relaxed text-foreground/80">{p.executive}</p>
              </div>
            </section>

            {/* Objectives */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-border/40" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Campaign Objectives</p>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {p.objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/10 p-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                      {i + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">{obj}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Website Snapshot */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-border/40" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Website Assessment</p>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3 mb-4">
                {[
                  { label: "Business Type", value: wa.businessType },
                  { label: "SEO Readiness", value: `${wa.seoScore}/100` },
                  { label: "Ad Readiness", value: `${wa.adReadinessScore}/100` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-border/40 bg-muted/10 p-5 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Key Improvements Needed Before Launch</p>
                <div className="space-y-2">
                  {wa.improvementSuggestions.filter((s) => s.priority === "high").map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[9px] font-bold text-red-400">!</span>
                      <p className="text-xs text-foreground/70">{s.issue} → <span className="text-foreground/50">{s.fix}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Phases */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-border/40" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Work Plan & Phases</p>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="space-y-5">
                {p.phases.map((phase, i) => {
                  const c = PHASE_COLORS[i % PHASE_COLORS.length];
                  return (
                    <div key={i} className={`rounded-2xl border ${c.light} overflow-hidden`}>
                      <div className={`${c.bg} px-6 py-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                            {phase.number}
                          </div>
                          <div>
                            <p className="text-base font-bold text-white">{phase.title}</p>
                            <p className="text-xs text-white/70">{phase.duration}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/60">Est. Investment</p>
                          <p className="text-lg font-bold text-white">${phase.budget.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="px-6 py-5 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">What We&apos;ll Do</p>
                          <p className="text-sm leading-relaxed text-foreground/70 mb-3">{phase.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {phase.channels.map((ch, j) => (
                              <Badge key={j} variant="outline" className={`text-[10px] ${c.text}`}>{ch}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deliverables</p>
                          <ul className="space-y-1">
                            {phase.deliverables.map((d, j) => (
                              <li key={j} className="flex items-start gap-2">
                                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${c.bg}`} />
                                <span className="text-xs text-foreground/70">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* KPIs */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-border/40" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Key Performance Indicators</p>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {p.kpis.map((kpi, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/10 p-4">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80">{kpi}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Investment Summary */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-border/40" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Investment Summary</p>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="rounded-2xl border border-border/40 bg-muted/10 overflow-hidden">
                <div className="px-6 py-4 space-y-2">
                  {p.phases.map((phase, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${PHASE_COLORS[i % PHASE_COLORS.length].bg}`} />
                        <span className="text-sm">{phase.title}</span>
                        <span className="text-xs text-muted-foreground">{phase.duration}</span>
                      </div>
                      <span className="text-sm font-semibold">${phase.budget.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-6 py-4 bg-blue-500/10 border-t border-blue-500/20">
                  <div>
                    <p className="text-sm font-semibold">Total Investment (3 Months)</p>
                    <p className="text-xs text-muted-foreground">Ad spend + management across all channels</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">${p.totalBudget.toLocaleString()}</p>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-border/40" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Next Steps</p>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { step: "01", title: "Approve Proposal", desc: "Review and sign off on the marketing plan and budget allocation." },
                  { step: "02", title: "Onboarding Call", desc: "30-minute kickoff to align on goals, access, and timelines." },
                  { step: "03", title: "Campaign Launch", desc: "We go live within 5 business days of onboarding completion." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="rounded-xl border border-border/40 bg-muted/10 p-5 text-center">
                    <p className="text-3xl font-bold text-blue-500/30 mb-2">{step}</p>
                    <p className="text-sm font-semibold mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Footer */}
            <div>
              <Separator className="mb-8" />
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-base font-bold">Advisium Digital Agency</p>
                <p className="text-xs text-muted-foreground">Prepared for {p.clientName} · {p.date}</p>
                <p className="text-xs text-muted-foreground">This proposal is confidential and prepared exclusively for {p.clientName}.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex items-center justify-center gap-4 py-4">
          <Button variant="outline" onClick={() => router.push("/draft")}>← Back to Campaigns</Button>
          <Button onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? "Generating…" : "↓ Download PDF Proposal"}
          </Button>
        </div>

      </div>
    </AppShell>
  );
}
