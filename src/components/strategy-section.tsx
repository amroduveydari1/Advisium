import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StrategyItem } from "@/types";

interface StrategySectionProps {
  title: string;
  items: StrategyItem[];
}

const ICONS: Record<string, string> = {
  insight: "\u{1F4A1}",
  warning: "\u26A0\uFE0F",
  action: "\u2192",
  metric: "\u{1F4CA}",
};

export function StrategySection({ title, items }: StrategySectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 shrink-0">
                {ICONS[item.type || "insight"]}
              </span>
              <span
                className={
                  item.type === "warning"
                    ? "text-yellow-400"
                    : "text-muted-foreground"
                }
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
