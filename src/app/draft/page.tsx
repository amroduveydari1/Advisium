"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DraftPreview } from "@/components/draft-preview";
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Draft</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Review the campaign structure before creating it in Google Ads.
          </p>
        </div>
        <DraftPreview draft={strategy.draft} accountId={accountId} />
      </div>
    </AppShell>
  );
}
