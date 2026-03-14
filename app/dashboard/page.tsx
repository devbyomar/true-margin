import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COPY } from "@/lib/copy";

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

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  // Fetch active job count
  const { count: activeJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("company_id", profile?.company_id ?? "")
    .in("status", ["active", "estimating"]);

  const { count: totalJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("company_id", profile?.company_id ?? "");

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
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{activeJobs ?? 0}</p>
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
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">0</p>
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
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Across active jobs this month</p>
          </div>
        </div>
      </div>

      {/* Quick actions / empty state */}
      <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        {(activeJobs ?? 0) === 0 ? (
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
          <div className="rounded-xl border bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              <Link
                href="/dashboard/jobs"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                View all jobs →
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Job activity feed will appear here as costs are logged.
            </p>
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
