"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  label: string;
  size?: number;
}

export function ScoreRing({ score, label, size = 80 }: ScoreRingProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 80
      ? "stroke-green-400"
      : score >= 60
        ? "stroke-blue-400"
        : score >= 40
          ? "stroke-yellow-400"
          : "stroke-red-400";

  const textColor =
    score >= 80
      ? "text-green-400"
      : score >= 60
        ? "text-blue-400"
        : score >= 40
          ? "text-yellow-400"
          : "text-red-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            className="text-muted/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-700", strokeColor)}
          />
        </svg>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center text-lg font-bold",
            textColor,
          )}
        >
          {score}
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
