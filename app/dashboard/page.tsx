import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateMargin } from "@/lib/margin-calculator";
import { COPY } from "@/lib/copy";
import type { Job, MarginStatus } from "@/types";

export const dynamic = "force-dynamic";

const MARGIN_STATUS_COLOR: Record<MarginStatus, string> = {
  on_track: "text-green-600",
  at_risk: "text-amber-600",
  over_budget: "text-red-600",
};

const MARGIN_BORDER: Record<MarginStatus, string> = {
  on_track: "border-l-green-500",
  at_risk: "border-l-amber-500",
  over_budget: "border-l-red-500",
};

const STATUS_BADGE: Record<string, string> = {
  estimating: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  on_hold: "bg-amber-100 text-amber-700",
  closed: "bg-gray-100 text-gray-700",
};

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function computeJobMargin(job: Job) {
  return calculateMargin({
    contractValue: job.contract_value,
    estimatedLabourHours: job.estimated_labour_hours,
    labourRate: job.estimated_labour_rate ?? 85,
    estimatedMaterials: job.estimated_materials,
    estimatedSubcontractor: job.estimated_subcontractor,
    overheadRate: job.estimated_overhead_rate ?? 15,
    actualCost: job.actual_cost,
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, company_id")
    .eq("id", user.id)
    .single();

  const companyId = profile?.company_id ?? "";
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  // Fetch active jobs with data for margin calculation
  const { data: activeJobRows } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", companyId)
    .in("status", ["active", "estimating"])
    .order("created_at", { ascending: false });

  const activeJobs = activeJobRows ?? [];

  const { count: totalJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  // Compute margins for all active jobs
  const jobsWithMargin = activeJobs.map((job) => {
    const margin = computeJobMargin(job as Job);
    return { job: job as Job, margin };
  });

  // Compute live stats
  const atRiskCount = jobsWithMargin.filter(
    (j) => j.margin.status === "at_risk" || j.margin.status === "over_budget"
  ).length;

  const jobsWithContractValue = jobsWithMargin.filter(
    (j) => j.job.contract_value > 0
  );
  const avgMargin =
    jobsWithContractValue.length > 0
      ? jobsWithContractValue.reduce((sum, j) => sum + j.margin.actualMarginPct, 0) /
        jobsWithContractValue.length
      : null;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Good {getGreeting()}, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s how your business is doing today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: "100ms" }}>
        {/* Active Jobs */}
        <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-emerald-500/[0.08] transition-transform group-hover:scale-125" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{activeJobs.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{totalJobs ?? 0} total all time</p>
          </div>
        </div>

        {/* At Risk Jobs */}
        <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-amber-500/[0.08] transition-transform group-hover:scale-125" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">At Risk</p>
            </div>
            <p className={`mt-3 text-3xl font-bold tabular-nums ${atRiskCount > 0 ? "text-red-600" : "text-foreground"}`}>
              {atRiskCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Jobs over budget or at risk</p>
          </div>
        </div>

        {/* Avg Margin */}
        <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover sm:col-span-2 lg:col-span-1">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-blue-500/[0.08] transition-transform group-hover:scale-125" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Margin</p>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
              {avgMargin !== null ? `${avgMargin.toFixed(1)}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Across {jobsWithContractValue.length} active job{jobsWithContractValue.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Job table or empty state */}
      <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        {activeJobs.length === 0 ? (
          <div className="relative overflow-hidden rounded-xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-8 text-center md:p-12">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100/50" />
            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-teal-100/30" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card">
                <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Create your first job</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Start tracking margins by creating a job estimate. You&apos;ll see real-time profitability as costs come in.
              </p>
              <Link
                href="/dashboard/jobs/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40 active:scale-[0.98]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {COPY.NEW_JOB}
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-white shadow-card">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Active Jobs</h2>
              <Link
                href="/dashboard/jobs"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                View all →
              </Link>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">Job</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Contract</th>
                    <th className="px-6 py-3 text-right">Est. Margin</th>
                    <th className="px-6 py-3 text-right">Actual Margin</th>
                    <th className="px-6 py-3 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jobsWithMargin.map(({ job, margin }) => (
                    <tr
                      key={job.id}
                      className={`border-l-4 ${MARGIN_BORDER[margin.status]} transition-colors hover:bg-muted/20`}
                    >
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/jobs/${job.id}`} className="font-medium text-foreground hover:text-emerald-600 transition-colors">
                          {job.name}
                        </Link>
                        {job.sms_code && (
                          <span className="ml-2 text-xs text-muted-foreground">{job.sms_code}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{job.customer_name ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[job.status] ?? ""}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm tabular-nums text-muted-foreground">
                        {formatCAD(job.contract_value)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm tabular-nums font-medium">
                        {margin.estimatedMarginPct.toFixed(1)}%
                      </td>
                      <td className={`px-6 py-4 text-right text-sm tabular-nums font-semibold ${MARGIN_STATUS_COLOR[margin.status]}`}>
                        {job.contract_value > 0 ? `${margin.actualMarginPct.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm tabular-nums">
                        <span className={margin.varianceDollar >= 0 ? "text-green-600" : "text-red-600"}>
                          {margin.varianceDollar >= 0 ? "+" : ""}{formatCAD(margin.varianceDollar)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {jobsWithMargin.map(({ job, margin }) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className={`block border-l-4 ${MARGIN_BORDER[margin.status]} px-4 py-4 transition-colors hover:bg-muted/20`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{job.name}</p>
                      <p className="text-xs text-muted-foreground">{job.customer_name ?? "No customer"}</p>
                    </div>
                    <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[job.status] ?? ""}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Contract: </span>
                      <span className="font-medium tabular-nums">{formatCAD(job.contract_value)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Margin: </span>
                      <span className={`font-semibold tabular-nums ${MARGIN_STATUS_COLOR[margin.status]}`}>
                        {job.contract_value > 0 ? `${margin.actualMarginPct.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium tabular-nums ${margin.varianceDollar >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {margin.varianceDollar >= 0 ? "+" : ""}{formatCAD(margin.varianceDollar)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
