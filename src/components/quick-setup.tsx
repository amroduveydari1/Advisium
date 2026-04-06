"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TargetCountry, CampaignGoal, PlatformPreference } from "@/types";

const COUNTRIES: { code: TargetCountry; name: string; flag: string }[] = [
  { code: "TR", name: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "US", name: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "UK", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "AE", name: "UAE", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "DE", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "SA", name: "Saudi Arabia", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "CA", name: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "AU", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
];

const GOALS: { value: CampaignGoal; label: string; desc: string }[] = [
  { value: "sales", label: "Sales", desc: "Drive online purchases" },
  { value: "leads", label: "Leads", desc: "Capture form submissions" },
  { value: "traffic", label: "Traffic", desc: "Increase website visits" },
  { value: "awareness", label: "Awareness", desc: "Build brand recognition" },
];

const PLATFORMS: { value: PlatformPreference; label: string; rec: boolean }[] =
  [
    { value: "auto", label: "Let system decide", rec: true },
    { value: "google", label: "Google Ads only", rec: false },
    { value: "both", label: "Google + Meta", rec: false },
  ];

export function QuickSetup() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState("https://www.shopier.com/lavoggue/45889878");
  const [country, setCountry] = useState<TargetCountry | "">("TR");
  const [goal, setGoal] = useState<CampaignGoal | "">("sales");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [platformPreference, setPlatformPreference] =
    useState<PlatformPreference>("auto");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const isValid =
    websiteUrl && country && goal && monthlyBudget && Number(monthlyBudget) > 0;

  async function handleGenerate() {
    if (!isValid || !country || !goal) return;
    setError("");
    setGenerating(true);

    const setup = {
      websiteUrl,
      country,
      goal,
      monthlyBudget: Number(monthlyBudget),
      currency: "USD",
      platformPreference,
    };

    try {
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Strategy generation failed");
      }
      const strategy = await res.json();
      sessionStorage.setItem("advisium_setup", JSON.stringify(setup));
      sessionStorage.setItem("advisium_strategy", JSON.stringify(strategy));
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quick Setup</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Tell us the basics. We&apos;ll infer the rest from your website and
          campaign inputs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Country</Label>
              <Select
                value={country}
                onValueChange={(v) => setCountry(v as TargetCountry)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Campaign Goal</Label>
              <Select
                value={goal}
                onValueChange={(v) => setGoal(v as CampaignGoal)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Monthly Budget (USD)</Label>
            <Input
              id="budget"
              type="number"
              min={1}
              placeholder="3000"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Platform Preference</Label>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlatformPreference(p.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left text-sm transition-colors",
                    platformPreference === p.value
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-border hover:border-muted-foreground/50",
                  )}
                >
                  <div className="font-medium">{p.label}</div>
                  {p.rec && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Recommended
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            onClick={handleGenerate}
            disabled={!isValid || generating}
            size="lg"
            className="w-full"
          >
            {generating ? "Generating Strategy..." : "Generate Strategy"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
