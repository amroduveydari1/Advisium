"use client";
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DraftPreview } from "@/components/draft-preview";
import { Button } from "@/components/ui/button";
import type { StrategyOutput } from "@/types";

export default function DraftPage() {
  const router = useRouter();
  const [strategy, setStrategy] = useState<StrategyOutput | null>(null);
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("advisium_strategy");
    const acct = sessionStorage.getItem("advisium_account") || "";
    if (raw) {
      setStrategy(JSON.parse(raw));
      setAccountId(acct);
    } else {
      router.push("/");
    }
  }, [router]);

  if (!strategy) return null;

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Campaign Drafts</p>
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Google Ads &amp; Meta campaign structure ready for review and launch.
            </p>
          </div>
          <Button size="sm" onClick={() => router.push("/proposal")} className="shrink-0">
            Generate Proposal →
          </Button>
        </div>
        <DraftPreview draft={strategy.draft} accountId={accountId} />
        <div className="flex flex-col gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Next Step: Client Proposal</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Generate a professional agency proposal PDF for your client.
            </p>
          </div>
          <Button onClick={() => router.push("/proposal")}>Generate Proposal →</Button>
        </div>
      </div>
    </AppShell>
  );
}
