"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { COPY, JOB_TYPE_OPTIONS } from "@/lib/copy";
import type { MarginStatus } from "@/types";

// ---------- Types ----------

interface ReportSummary {
  totalJobs: number;
  jobsWithValue: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgMargin: number;
}

interface MonthlyMargin {
  month: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
  jobCount: number;
}

interface TypeMargin {
  type: string;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
  jobCount: number;
}

interface JobSummaryRow {
  id: string;
  name: string;
  customerName: string | null;
  jobType: string | null;
  status: string;
  contractValue: number;
  actualCost: number;
  profit: number;
  marginPct: number;
  estimatedMarginPct: number;
  variancePct: number;
  marginStatus: MarginStatus;
  createdAt: string;
  closedAt: string | null;
}

interface ReportData {
  summary: ReportSummary;
  marginByMonth: MonthlyMargin[];
  marginByType: TypeMargin[];
  jobSummary: JobSummaryRow[];
}

// ---------- Helpers ----------

const PERIODS = [
  { value: "this_month", label: COPY.REPORTS_PERIOD_THIS_MONTH },
  { value: "last_3", label: COPY.REPORTS_PERIOD_LAST_3 },
  { value: "last_6", label: COPY.REPORTS_PERIOD_LAST_6 },
  { value: "this_year", label: COPY.REPORTS_PERIOD_THIS_YEAR },
  { value: "all", label: COPY.REPORTS_PERIOD_ALL_TIME },
] as const;

const JOB_TYPE_LABELS: Record<string, string> = {};
for (const opt of JOB_TYPE_OPTIONS) {
  JOB_TYPE_LABELS[opt.value] = opt.label;
}

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const STATUS_COLOR: Record<MarginStatus, string> = {
  on_track: "text-green-600",
  at_risk: "text-amber-600",
  over_budget: "text-red-600",
};

const STATUS_BG: Record<MarginStatus, string> = {
  on_track: "bg-green-100 text-green-700",
  at_risk: "bg-amber-100 text-amber-700",
  over_budget: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<MarginStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  over_budget: "Over Budget",
};

// ---------- Component ----------

export function ReportsClient() {
  const [period, setPeriod] = useState("all");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?period=${p}`);
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Failed to load reports");
      }
      const json = await res.json() as { data: ReportData };
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : COPY.ERROR_GENERIC);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReport(period);
  }, [period, fetchReport]);

  return (
    <div className="space-y-8">
      {/* Header + period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{COPY.REPORTS_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{COPY.REPORTS_SUBTITLE}</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                period === p.value
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={`Filter to ${p.label}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted/30" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl border bg-muted/30" />
          <div className="h-64 animate-pulse rounded-xl border bg-muted/30" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            onClick={() => void fetchReport(period)}
            className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-500"
          >
            Try again
          </button>
        </div>
      )}

      {/* Data loaded */}
      {data && !loading && !error && (
        <>
          {data.summary.jobsWithValue === 0 ? (
            /* Empty state */
            <div className="relative overflow-hidden rounded-xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-8 text-center md:p-12">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100/50" />
              <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-teal-100/30" />
              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card">
                  <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0116.5 19.875V4.125z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">No report data yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  {COPY.REPORTS_NO_DATA}
                </p>
                <Link
                  href="/dashboard/jobs/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400"
                >
                  {COPY.NEW_JOB}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up">
                <SummaryCard
                  label={COPY.REPORTS_TOTAL_REVENUE}
                  value={formatCAD(data.summary.totalRevenue)}
                  sub={`${data.summary.jobsWithValue} job${data.summary.jobsWithValue !== 1 ? "s" : ""}`}
                  color="emerald"
                />
                <SummaryCard
                  label={COPY.REPORTS_TOTAL_COST}
                  value={formatCAD(data.summary.totalCost)}
                  sub="Actual costs incurred"
                  color="slate"
                />
                <SummaryCard
                  label={COPY.REPORTS_TOTAL_PROFIT}
                  value={formatCAD(data.summary.totalProfit)}
                  sub={data.summary.totalProfit >= 0 ? "Gross profit" : "Net loss"}
                  color={data.summary.totalProfit >= 0 ? "blue" : "red"}
                />
                <SummaryCard
                  label={COPY.REPORTS_AVG_MARGIN}
                  value={`${data.summary.avgMargin.toFixed(1)}%`}
                  sub="Average across jobs"
                  color={data.summary.avgMargin >= 20 ? "emerald" : data.summary.avgMargin >= 10 ? "amber" : "red"}
                />
              </div>

              {/* Margin by Month */}
              {data.marginByMonth.length > 0 && (
                <div className="rounded-xl border bg-white shadow-card animate-slide-up" style={{ animationDelay: "100ms" }}>
                  <div className="border-b px-6 py-4">
                    <h2 className="text-lg font-semibold text-foreground">{COPY.REPORTS_MARGIN_BY_MONTH}</h2>
                  </div>

                  {/* Bar chart visualization */}
                  <div className="px-6 py-6">
                    <div className="flex items-end gap-2" style={{ height: 200 }}>
                      {data.marginByMonth.map((m) => {
                        const maxMargin = Math.max(...data.marginByMonth.map((x) => Math.abs(x.marginPct)), 1);
                        const height = Math.max((Math.abs(m.marginPct) / maxMargin) * 160, 8);
                        const isNegative = m.marginPct < 0;
                        return (
                          <div key={m.month} className="group flex flex-1 flex-col items-center gap-1">
                            <div className="relative flex w-full flex-col items-center">
                              {/* Tooltip */}
                              <div className="pointer-events-none absolute -top-16 z-10 hidden rounded-lg bg-foreground px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                                <p className="font-semibold">{m.label}</p>
                                <p>{m.jobCount} job{m.jobCount !== 1 ? "s" : ""} · {formatCAD(m.profit)} profit</p>
                              </div>
                              {/* Bar */}
                              <div
                                className={`w-full max-w-[48px] rounded-t-md transition-all group-hover:opacity-80 ${
                                  isNegative ? "bg-red-400" : "bg-emerald-400"
                                }`}
                                style={{ height }}
                              />
                              {/* Percentage label */}
                              <p className={`mt-1 text-xs font-semibold tabular-nums ${isNegative ? "text-red-600" : "text-emerald-600"}`}>
                                {m.marginPct.toFixed(0)}%
                              </p>
                            </div>
                            <p className="mt-1 text-[10px] text-muted-foreground">{m.label.split(" ")[0]}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Monthly table */}
                  <div className="overflow-x-auto border-t">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          <th className="px-6 py-3">Month</th>
                          <th className="px-6 py-3 text-right">Jobs</th>
                          <th className="px-6 py-3 text-right">Revenue</th>
                          <th className="px-6 py-3 text-right">Cost</th>
                          <th className="px-6 py-3 text-right">Profit</th>
                          <th className="px-6 py-3 text-right">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm">
                        {data.marginByMonth.map((m) => (
                          <tr key={m.month} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-3 font-medium">{m.label}</td>
                            <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">{m.jobCount}</td>
                            <td className="px-6 py-3 text-right tabular-nums">{formatCAD(m.revenue)}</td>
                            <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">{formatCAD(m.cost)}</td>
                            <td className={`px-6 py-3 text-right tabular-nums font-medium ${m.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCAD(m.profit)}
                            </td>
                            <td className={`px-6 py-3 text-right tabular-nums font-semibold ${m.marginPct >= 20 ? "text-green-600" : m.marginPct >= 10 ? "text-amber-600" : "text-red-600"}`}>
                              {m.marginPct.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Margin by Job Type */}
              {data.marginByType.length > 0 && (
                <div className="rounded-xl border bg-white shadow-card animate-slide-up" style={{ animationDelay: "200ms" }}>
                  <div className="border-b px-6 py-4">
                    <h2 className="text-lg font-semibold text-foreground">{COPY.REPORTS_MARGIN_BY_TYPE}</h2>
                  </div>
                  <div className="divide-y">
                    {data.marginByType.map((t) => {
                      const label = JOB_TYPE_LABELS[t.type] ?? t.type;
                      const maxRevenue = Math.max(...data.marginByType.map((x) => x.revenue), 1);
                      const barWidth = (t.revenue / maxRevenue) * 100;
                      return (
                        <div key={t.type} className="px-6 py-4 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3">
                                <p className="text-sm font-medium text-foreground">{label}</p>
                                <span className="text-xs text-muted-foreground">
                                  {t.jobCount} job{t.jobCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div className="mt-2 h-2 w-full rounded-full bg-muted/50">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    t.marginPct >= 20 ? "bg-emerald-400" : t.marginPct >= 10 ? "bg-amber-400" : "bg-red-400"
                                  }`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                            <div className="ml-6 flex items-center gap-6 text-right">
                              <div>
                                <p className="text-xs text-muted-foreground">Revenue</p>
                                <p className="text-sm font-medium tabular-nums">{formatCAD(t.revenue)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Profit</p>
                                <p className={`text-sm font-medium tabular-nums ${t.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {formatCAD(t.profit)}
                                </p>
                              </div>
                              <div className="w-16">
                                <p className="text-xs text-muted-foreground">Margin</p>
                                <p className={`text-sm font-semibold tabular-nums ${t.marginPct >= 20 ? "text-green-600" : t.marginPct >= 10 ? "text-amber-600" : "text-red-600"}`}>
                                  {t.marginPct.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Job Summary Table */}
              <div className="rounded-xl border bg-white shadow-card animate-slide-up" style={{ animationDelay: "300ms" }}>
                <div className="border-b px-6 py-4">
                  <h2 className="text-lg font-semibold text-foreground">{COPY.REPORTS_JOB_SUMMARY}</h2>
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3">Job</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Contract</th>
                        <th className="px-6 py-3 text-right">Cost</th>
                        <th className="px-6 py-3 text-right">Profit</th>
                        <th className="px-6 py-3 text-right">Est. Margin</th>
                        <th className="px-6 py-3 text-right">Actual Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {data.jobSummary.map((j) => (
                        <tr key={j.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-3">
                            <Link href={`/dashboard/jobs/${j.id}`} className="font-medium text-foreground hover:text-emerald-600 transition-colors">
                              {j.name}
                            </Link>
                            {j.customerName && (
                              <p className="text-xs text-muted-foreground">{j.customerName}</p>
                            )}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {JOB_TYPE_LABELS[j.jobType ?? ""] ?? j.jobType ?? "—"}
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BG[j.marginStatus]}`}>
                              {STATUS_LABEL[j.marginStatus]}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums">{formatCAD(j.contractValue)}</td>
                          <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">{formatCAD(j.actualCost)}</td>
                          <td className={`px-6 py-3 text-right tabular-nums font-medium ${j.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCAD(j.profit)}
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">
                            {j.estimatedMarginPct.toFixed(1)}%
                          </td>
                          <td className={`px-6 py-3 text-right tabular-nums font-semibold ${STATUS_COLOR[j.marginStatus]}`}>
                            {j.marginPct.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="divide-y md:hidden">
                  {data.jobSummary.map((j) => (
                    <Link
                      key={j.id}
                      href={`/dashboard/jobs/${j.id}`}
                      className="block px-4 py-4 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{j.name}</p>
                          <p className="text-xs text-muted-foreground">{j.customerName ?? "No customer"}</p>
                        </div>
                        <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BG[j.marginStatus]}`}>
                          {STATUS_LABEL[j.marginStatus]}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Contract: </span>
                          <span className="font-medium tabular-nums">{formatCAD(j.contractValue)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit: </span>
                          <span className={`font-medium tabular-nums ${j.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCAD(j.profit)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Margin: </span>
                          <span className={`font-semibold tabular-nums ${STATUS_COLOR[j.marginStatus]}`}>
                            {j.marginPct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ---------- Summary Card ----------

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "emerald" | "blue" | "amber" | "red" | "slate";
}) {
  const bgMap = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-600",
  };
  const orbMap = {
    emerald: "bg-emerald-500/[0.08]",
    blue: "bg-blue-500/[0.08]",
    amber: "bg-amber-500/[0.08]",
    red: "bg-red-500/[0.08]",
    slate: "bg-slate-500/[0.08]",
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
      <div className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full ${orbMap[color]} transition-transform group-hover:scale-125`} />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgMap[color]}`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
        <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
