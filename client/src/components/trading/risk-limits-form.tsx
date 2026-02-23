import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RiskPolicy } from "@shared/trading-types";

interface RiskLimitsFormProps {
  policy: RiskPolicy | undefined;
  pending: boolean;
  onSave: (patch: Partial<RiskPolicy>) => void;
}

const fieldConfig: Array<{ key: keyof RiskPolicy; label: string; step: string }> = [
  { key: "perMarketMaxExposurePct", label: "Per-market max exposure (%)", step: "0.1" },
  { key: "perCategoryMaxExposurePct", label: "Per-category max exposure (%)", step: "0.1" },
  { key: "dailyDrawdownThrottlePct", label: "Daily drawdown throttle (%)", step: "0.1" },
  { key: "weeklyHardKillSwitchPct", label: "Weekly hard kill switch (%)", step: "0.1" },
  { key: "fractionalKelly", label: "Fractional Kelly", step: "0.01" },
  { key: "minimumEdgeBps", label: "Minimum edge (bps)", step: "1" },
  { key: "minimumConfidence", label: "Minimum confidence", step: "0.01" },
  { key: "liquidityDepthMultiple", label: "Liquidity depth multiple", step: "0.1" },
  { key: "maxDepthWindowBps", label: "Depth window (bps)", step: "1" },
  { key: "maxSpreadPct", label: "Max spread (%)", step: "0.1" },
  { key: "requoteIntervalSeconds", label: "Requote interval (seconds)", step: "1" },
];

export function RiskLimitsForm({ policy, pending, onSave }: RiskLimitsFormProps) {
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!policy) {
      return;
    }

    const nextDraft: Record<string, string> = {};
    for (const field of fieldConfig) {
      nextDraft[field.key] = String(policy[field.key]);
    }
    setDraft(nextDraft);
  }, [policy]);

  const hasChanges = useMemo(() => {
    if (!policy) {
      return false;
    }

    return fieldConfig.some((field) => String(policy[field.key]) !== draft[field.key]);
  }, [policy, draft]);

  const handleSave = () => {
    if (!policy) {
      return;
    }

    const patch: Partial<RiskPolicy> = {};
    for (const field of fieldConfig) {
      const current = String(policy[field.key]);
      const next = draft[field.key];
      if (next === undefined || next === current) {
        continue;
      }
      const numeric = Number(next);
      if (Number.isFinite(numeric)) {
        patch[field.key] = numeric as never;
      }
    }

    onSave(patch);
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-medium">Risk Limits</h3>
        <p className="text-sm text-muted-foreground">All limits apply immediately to the autonomous executor.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fieldConfig.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={`risk-${field.key}`}>{field.label}</Label>
            <Input
              id={`risk-${field.key}`}
              type="number"
              step={field.step}
              value={draft[field.key] || ""}
              onChange={(event) => {
                setDraft((prev) => ({
                  ...prev,
                  [field.key]: event.target.value,
                }));
              }}
              data-testid={`input-risk-${field.key}`}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!policy || !hasChanges || pending}
          data-testid="button-save-risk-policy"
        >
          Save Risk Policy
        </Button>
      </div>
    </Card>
  );
}
