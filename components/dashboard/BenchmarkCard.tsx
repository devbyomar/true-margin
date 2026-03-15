"use client";

import { useState, useEffect } from "react";
import { COPY } from "@/lib/copy";

interface BenchmarkComparison {
  job_type: string;
  your_avg_margin: number;
  your_job_count: number;
  industry_avg_margin: number | null;
  industry_median_margin: number | null;
  industry_sample_size: number;
  percentile: number | null;
  above_average: boolean | null;
}

interface BenchmarkResponse {
  overall_avg_margin: number;
  total_closed_jobs: number;
  comparisons: BenchmarkComparison[];
}

const JOB_TYPE_LABELS: Record<string, string> = {
  hvac_install: "HVAC Install",
  hvac_service: "HVAC Service",
  plumbing: "Plumbing",
  electrical: "Electrical",
  roofing: "Roofing",
  other: "Other",
};

export function BenchmarkCard() {
  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBenchmarks() {
      try {
        const res = await fetch("/api/benchmarks");
        if (res.ok) {
          const result = (await res.json()) as { data: BenchmarkResponse };
          setData(result.data);
        }
      } catch {
        // Silently fail — benchmark is supplementary info
      } finally {
        setLoading(false);
      }
    }
    void loadBenchmarks();
  }, []);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border bg-white shadow-card animate-pulse">
        <div className="border-b px-5 py-3">
          <div className="h-4 w-40 rounded bg-muted" />
        </div>
        <div className="p-5 space-y-3">
          <div className="h-16 rounded bg-muted/50" />
          <div className="h-16 rounded bg-muted/50" />
        </div>
      </div>
    );
  }

  if (!data || data.total_closed_jobs === 0) {
    return (
      <div className="overflow-hidden rounded-xl border bg-white shadow-card">
        <div className="border-b px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {COPY.BENCHMARK_TITLE}
          </h3>
        </div>
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {COPY.BENCHMARK_NO_DATA}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Close some jobs to see margin comparisons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-card">
      <div className="border-b px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          {COPY.BENCHMARK_TITLE}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {COPY.BENCHMARK_SUBTITLE}
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Overall avg */}
        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
          <div>
            <p className="text-[11px] text-muted-foreground">
              {COPY.BENCHMARK_YOUR_MARGIN}
            </p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {data.overall_avg_margin.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">
              {COPY.BENCHMARK_SAMPLE_SIZE}
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {data.total_closed_jobs} {COPY.BENCHMARK_JOBS}
            </p>
          </div>
        </div>

        {/* By job type */}
        {data.comparisons.map((comp) => (
          <div key={comp.job_type} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                {JOB_TYPE_LABELS[comp.job_type] ?? comp.job_type}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {comp.your_avg_margin.toFixed(1)}%
                </span>
                {comp.industry_avg_margin !== null && (
                  <>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {comp.industry_avg_margin.toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className={`h-full rounded-full transition-all ${
                  comp.above_average === true
                    ? "bg-emerald-400"
                    : comp.above_average === false
                      ? "bg-amber-400"
                      : "bg-blue-400"
                }`}
                style={{
                  width: `${Math.min(Math.max(comp.your_avg_margin, 0), 100)}%`,
                }}
              />
              {comp.industry_avg_margin !== null && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground/30"
                  style={{
                    left: `${Math.min(Math.max(comp.industry_avg_margin, 0), 100)}%`,
                  }}
                  title={`Industry avg: ${comp.industry_avg_margin.toFixed(1)}%`}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground/70">
                {comp.your_job_count} {COPY.BENCHMARK_JOBS}
              </span>
              {comp.above_average !== null && (
                <span
                  className={`font-medium ${comp.above_average ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {comp.above_average
                    ? COPY.BENCHMARK_ABOVE_AVG
                    : COPY.BENCHMARK_BELOW_AVG}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
