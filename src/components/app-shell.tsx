"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { path: "/setup", label: "Setup" },
  { path: "/dashboard", label: "Strategy" },
  { path: "/draft", label: "Draft" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => s.path === pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-xl font-bold tracking-tight">Advisium</div>
          <nav className="flex items-center gap-1">
            {STEPS.map((step, i) => (
              <div key={step.path} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                      i < currentIndex && "bg-blue-500/20 text-blue-400",
                      i === currentIndex && "bg-blue-500 text-white",
                      i > currentIndex && "bg-muted text-muted-foreground",
                    )}
                  >
                    {i < currentIndex ? "✓" : i + 1}
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs sm:inline",
                      i === currentIndex
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-px w-6",
                      i < currentIndex ? "bg-blue-500/40" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
