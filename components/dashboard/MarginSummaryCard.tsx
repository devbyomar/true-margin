"use client";

import { COPY } from "@/lib/copy";

interface MarginSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "danger";
}

export function MarginSummaryCard({
  title,
  value,
  subtitle,
  variant = "default",
}: MarginSummaryCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p
        className={`mt-2 text-3xl font-bold tracking-tight ${
          variant === "danger" ? "text-red-600" : "text-foreground"
        }`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

// Re-export COPY for convenience
export { COPY };
