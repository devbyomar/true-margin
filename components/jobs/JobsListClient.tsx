"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import type { MarginStatus } from "@/types";

interface JobRow {
  id: string;
  name: string;
  customer_name: string | null;
  sms_code: string | null;
  contract_value: number;
  actual_cost: number;
  status: string;
  estimatedMarginPct: number;
  actualMarginPct: number;
  marginStatus: MarginStatus;
}

interface JobsListClientProps {
  jobs: JobRow[];
}

const STATUS_BADGE: Record<string, string> = {
  estimating: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  on_hold: "bg-amber-100 text-amber-700",
  closed: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<string, string> = {
  estimating: "Estimating",
  active: "Active",
  on_hold: "On Hold",
  closed: "Closed",
};

const MARGIN_BORDER: Record<MarginStatus, string> = {
  on_track: "border-l-green-500",
  at_risk: "border-l-amber-500",
  over_budget: "border-l-red-500",
};

const MARGIN_STATUS_LABEL: Record<MarginStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  over_budget: "Over Budget",
};

const PAGE_SIZE = 25;

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function JobsListClient({ jobs }: JobsListClientProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        (j.customer_name && j.customer_name.toLowerCase().includes(q)) ||
        (j.sms_code && j.sms_code.toLowerCase().includes(q))
    );
  }, [jobs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageJobs = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function handleExportCSV() {
    window.open("/api/jobs/export", "_blank");
  }

  return (
    <div className="space-y-4">
      {/* Search + Export row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={COPY.SEARCH_JOBS}
            className="flex h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50"
            aria-label={COPY.SEARCH_JOBS}
          />
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border bg-white px-3 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted/50 active:scale-[0.98]"
          aria-label={COPY.EXPORT_CSV}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {COPY.EXPORT_CSV}
        </button>
      </div>

      {/* Job cards */}
      {pageJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim() ? "No jobs match your search." : "No jobs found."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pageJobs.map((job, index) => (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="group block animate-slide-up"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div
                className={`relative overflow-hidden rounded-xl border border-l-4 bg-white p-4 shadow-card transition-all duration-300 hover:shadow-card-hover ${MARGIN_BORDER[job.marginStatus]}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-semibold truncate text-foreground group-hover:text-emerald-600 transition-colors">
                        {job.name}
                      </h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[job.status] ?? ""}`}>
                        {STATUS_LABELS[job.status] ?? job.status}
                      </span>
                    </div>
                    {job.customer_name && (
                      <p className="mt-0.5 text-sm text-muted-foreground truncate">
                        {job.customer_name}
                        {job.sms_code && (
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {job.sms_code}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Contract</p>
                      <p className="font-semibold tabular-nums text-foreground">{formatCAD(job.contract_value)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Est. Margin</p>
                      <p className="font-semibold tabular-nums text-foreground">{job.estimatedMarginPct.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Actual</p>
                      <p className={`font-bold tabular-nums ${job.actualMarginPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {job.actual_cost > 0 ? `${job.actualMarginPct.toFixed(1)}%` : "—"}
                      </p>
                    </div>
                    <div className="hidden items-center gap-1.5 sm:flex">
                      <div className={`h-2 w-2 rounded-full ${
                        job.marginStatus === "on_track" ? "bg-emerald-500" :
                        job.marginStatus === "at_risk" ? "bg-amber-500" : "bg-red-500"
                      }`} />
                      <p className="text-xs font-medium text-muted-foreground">{MARGIN_STATUS_LABEL[job.marginStatus]}</p>
                    </div>
                    <svg className="h-5 w-5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Previous page"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  i === currentPage
                    ? "bg-primary text-primary-foreground"
                    : "border hover:bg-muted/50"
                }`}
                aria-label={`Page ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
