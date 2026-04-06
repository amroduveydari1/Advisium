"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GA4Property, AdsAccount } from "@/types";

export function ConnectAccounts() {
  const router = useRouter();
  const [ga4Connected, setGa4Connected] = useState(false);
  const [ga4Properties, setGa4Properties] = useState<GA4Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [adsConnected, setAdsConnected] = useState(false);
  const [adsAccounts, setAdsAccounts] = useState<AdsAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const canContinue = !!selectedProperty && !!selectedAccount;

  async function connectGA4() {
    setLoading("ga4");
    try {
      const res = await fetch("/api/analytics/properties");
      const data = await res.json();
      setGa4Properties(data.properties);
      setGa4Connected(true);
    } finally {
      setLoading(null);
    }
  }

  async function connectAds() {
    setLoading("ads");
    try {
      const res = await fetch("/api/ads/accounts");
      const data = await res.json();
      setAdsAccounts(data.accounts);
      setAdsConnected(true);
    } finally {
      setLoading(null);
    }
  }

  function handleContinue() {
    sessionStorage.setItem("advisium_property", selectedProperty);
    sessionStorage.setItem("advisium_account", selectedAccount);
    router.push("/setup");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Connect Your Accounts
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Link your analytics and advertising accounts to power data-driven
          strategy.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={ga4Connected ? "border-blue-500/30" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {ga4Connected && (
                <span className="text-green-400">&#10003;</span>
              )}
              Google Analytics 4
            </CardTitle>
            <CardDescription>
              Traffic, engagement, conversions, and top landing pages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!ga4Connected ? (
              <Button
                onClick={connectGA4}
                disabled={loading === "ga4"}
                className="w-full"
                variant="outline"
              >
                {loading === "ga4"
                  ? "Connecting..."
                  : "Connect Google Analytics"}
              </Button>
            ) : (
              <Select
                value={selectedProperty}
                onValueChange={setSelectedProperty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {ga4Properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card className={adsConnected ? "border-blue-500/30" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {adsConnected && (
                <span className="text-green-400">&#10003;</span>
              )}
              Google Ads
            </CardTitle>
            <CardDescription>
              Campaign performance, spend, conversions, and targeting data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!adsConnected ? (
              <Button
                onClick={connectAds}
                disabled={loading === "ads"}
                className="w-full"
                variant="outline"
              >
                {loading === "ads" ? "Connecting..." : "Connect Google Ads"}
              </Button>
            ) : (
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {adsAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      </div>

      {canContinue && (
        <div className="flex justify-end">
          <Button onClick={handleContinue} size="lg">
            Continue to Setup &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}
