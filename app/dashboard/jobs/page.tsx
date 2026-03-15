import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateMargin } from "@/lib/margin-calculator";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import type { Job, MarginStatus } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  estimating: COPY.STATUS_ESTIMATING,
  active: COPY.STATUS_ACTIVE,
  on_hold: COPY.STATUS_ON_HOLD,
  closed: COPY.STATUS_CLOSED,
};

const STATUS_BADGE: Record<string, string> = {
  estimating: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  on_hold: "bg-amber-100 text-amber-700",
  closed: "bg-gray-100 text-gray-700",
};

const MARGIN_BORDER: Record<MarginStatus, string> = {
  on_track: "border-l-green-500",
  at_risk: "border-l-amber-500",
  over_budget: "border-l-red-500",
};

const MARGIN_STATUS_LABEL: Record<MarginStatus, string> = {
  on_track: COPY.STATUS_ON_TRACK,
  at_risk: COPY.STATUS_AT_RISK,
  over_budget: COPY.STATUS_OVER_BUDGET,
};

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const dynamic = "force-dynamic";

interface JobsPageProps {
  searchParams: Promise<{ status?: string; filter?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const statusFilter = params.status; // e.g. "active", "estimating", "closed"
  const marginFilter = params.filter; // e.g. "at_risk"

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("company_id, companies(labour_rate, overhead_rate)")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    redirect("/login");
  }

  const company = profile.companies as unknown as {
    labour_rate: number;
    overhead_rate: number;
  } | null;

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  // Apply status filter if present (e.g. ?status=active)
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: jobs } = await query;

  let jobList = (jobs ?? []) as Job[];

  // Apply margin-based filter client-side (requires computing margins)
  if (marginFilter === "at_risk") {
    jobList = jobList.filter((job) => {
      const labourRate = job.estimated_labour_rate ?? company?.labour_rate ?? 85;
      const overheadRate = job.estimated_overhead_rate ?? company?.overhead_rate ?? 15;
      const margin = calculateMargin({
        contractValue: job.contract_value,
        estimatedLabourHours: job.estimated_labour_hours,
        labourRate,
        estimatedMaterials: job.estimated_materials,
        estimatedSubcontractor: job.estimated_subcontractor,
        overheadRate,
        actualCost: job.actual_cost,
      });
      return margin.status === "at_risk" || margin.status === "over_budget";
    });
  }

  const activeFilterLabel = marginFilter === "at_risk"
    ? "At Risk"
    : statusFilter
      ? STATUS_LABELS[statusFilter] ?? statusFilter
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {COPY.JOBS_TITLE}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {jobList.length} {jobList.length === 1 ? "job" : "jobs"}{activeFilterLabel ? " matching filter" : " total"}
          </p>
        </div>
        <Link href="/dashboard/jobs/new">
          <Button className="shadow-lg shadow-emerald-500/25" aria-label={COPY.NEW_JOB}>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {COPY.NEW_JOB}
          </Button>
        </Link>
      </div>

      {/* Active filter pill */}
      {activeFilterLabel && (
        <div className="flex items-center gap-2 animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 border border-emerald-200">
            Filtered: {activeFilterLabel}
            <Link
              href="/dashboard/jobs"
              className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200 text-emerald-700 hover:bg-emerald-300 transition-colors"
              aria-label="Clear filter"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </span>
        </div>
      )}

      {jobList.length === 0 ? (
        <div className="relative overflow-hidden rounded-xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-8 text-center md:p-12 animate-fade-in">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100/50" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-teal-100/30" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card">
              <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No jobs yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Create your first job estimate to start tracking margins in real-time.
            </p>
            <Link href="/dashboard/jobs/new" className="mt-6 inline-block">
              <Button className="shadow-lg shadow-emerald-500/25">{COPY.NEW_JOB}</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {jobList.map((job, index) => {
            const labourRate =
              job.estimated_labour_rate ?? company?.labour_rate ?? 85;
            const overheadRate =
              job.estimated_overhead_rate ?? company?.overhead_rate ?? 15;

            const margin = calculateMargin({
              contractValue: job.contract_value,
              estimatedLabourHours: job.estimated_labour_hours,
              labourRate,
              estimatedMaterials: job.estimated_materials,
              estimatedSubcontractor: job.estimated_subcontractor,
              overheadRate,
              actualCost: job.actual_cost,
            });

            return (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="group block animate-slide-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div
                  className={`relative overflow-hidden rounded-xl border border-l-4 bg-white p-4 shadow-card transition-all duration-300 hover:shadow-card-hover ${MARGIN_BORDER[margin.status]}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-semibold truncate text-foreground group-hover:text-emerald-600 transition-colors">{job.name}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            STATUS_BADGE[job.status] ?? ""
                          }`}
                        >
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
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                          Contract
                        </p>
                        <p className="font-semibold tabular-nums text-foreground">
                          {formatCAD(job.contract_value)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                          Est. Margin
                        </p>
                        <p className="font-semibold tabular-nums text-foreground">
                          {margin.estimatedMarginPct.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                          Actual
                        </p>
                        <p
                          className={`font-bold tabular-nums ${
                            margin.actualMarginPct >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {job.actual_cost > 0
                            ? `${margin.actualMarginPct.toFixed(1)}%`
                            : "—"}
                        </p>
                      </div>
                      <div className="hidden items-center gap-1.5 sm:flex">
                        <div className={`h-2 w-2 rounded-full ${
                          margin.status === "on_track" ? "bg-emerald-500" :
                          margin.status === "at_risk" ? "bg-amber-500" : "bg-red-500"
                        }`} />
                        <p className="text-xs font-medium text-muted-foreground">
                          {MARGIN_STATUS_LABEL[margin.status]}
                        </p>
                      </div>
                      <svg className="h-5 w-5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
