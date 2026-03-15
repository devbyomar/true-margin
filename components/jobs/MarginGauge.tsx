"use client";

import { useEffect, useState } from "react";
import type { MarginStatus } from "@/types";
import { COPY } from "@/lib/copy";

interface MarginGaugeProps {
  estimatedMarginPct: number;
  actualMarginPct: number;
  status: MarginStatus;
  contractValue: number;
  actualCost: number;
  estimatedCost: number;
}

const STATUS_CONFIG: Record<
  MarginStatus,
  { color: string; bg: string; ring: string; label: string; icon: string }
> = {
  on_track: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-500/20",
    label: COPY.STATUS_ON_TRACK,
    icon: "✓",
  },
  at_risk: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-500/20",
    label: COPY.STATUS_AT_RISK,
    icon: "!",
  },
  over_budget: {
    color: "text-red-600",
    bg: "bg-red-50",
    ring: "ring-red-500/20",
    label: COPY.STATUS_OVER_BUDGET,
    icon: "✕",
  },
};

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function MarginGauge({
  estimatedMarginPct,
  actualMarginPct,
  status,
  contractValue,
  actualCost,
  estimatedCost,
}: MarginGaugeProps) {
  const [displayed, setDisplayed] = useState(0);
  const config = STATUS_CONFIG[status];
  const variance = actualMarginPct - estimatedMarginPct;
  const varianceSign = variance >= 0 ? "+" : "";

  // Animate the number on mount
  useEffect(() => {
    const target = actualMarginPct;
    const duration = 600;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(target * eased);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [actualMarginPct]);

  const spentPct = contractValue > 0 ? Math.min((actualCost / contractValue) * 100, 100) : 0;
  const budgetPct = contractValue > 0 ? Math.min((estimatedCost / contractValue) * 100, 100) : 0;

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-card">
      {/* Main margin display */}
      <div className="flex flex-col items-center px-6 py-8">
        <p
          className={`text-6xl font-bold tabular-nums tracking-tighter ${config.color} transition-colors duration-300`}
          aria-label={`Current margin: ${actualMarginPct.toFixed(1)} percent`}
        >
          {displayed.toFixed(1)}%
        </p>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {COPY.CURRENT_MARGIN}
        </p>

        {/* Status badge */}
        <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${config.bg} ${config.color} ${config.ring}`}>
          <span className="text-[10px]">{config.icon}</span>
          {config.label}
        </div>

        {/* Variance line */}
        <p className="mt-3 text-xs text-muted-foreground">
          Estimated: {estimatedMarginPct.toFixed(1)}% · {COPY.VARIANCE}:{" "}
          <span className={variance >= 0 ? "text-emerald-600" : "text-red-600"}>
            {varianceSign}{variance.toFixed(1)}%
          </span>
        </p>
      </div>

      {/* Budget progress bar */}
      <div className="border-t bg-muted/20 px-6 py-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Budget spent</span>
          <span className="font-medium tabular-nums">{formatCAD(actualCost)} / {formatCAD(contractValue)}</span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
          {/* Budget estimate marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-foreground/20 z-10"
            style={{ left: `${budgetPct}%` }}
            title={`Budget: ${formatCAD(estimatedCost)}`}
          />
          {/* Actual cost bar */}
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              status === "on_track"
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : status === "at_risk"
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : "bg-gradient-to-r from-red-400 to-red-500"
            }`}
            style={{ width: `${spentPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground/70">
          <span>$0</span>
          <span>{formatCAD(contractValue)}</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 divide-x border-t">
        <div className="px-4 py-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Contract</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{formatCAD(contractValue)}</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Est. Cost</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{formatCAD(estimatedCost)}</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Actual</p>
          <p className={`mt-0.5 text-sm font-bold tabular-nums ${actualCost > estimatedCost ? "text-red-600" : "text-emerald-600"}`}>
            {formatCAD(actualCost)}
          </p>
        </div>
      </div>
    </div>
  );
}
