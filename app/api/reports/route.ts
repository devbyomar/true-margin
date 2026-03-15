import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateMargin } from "@/lib/margin-calculator";
import type { Job } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "No company found" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "all";

  // Build date filter
  let dateFilter: string | null = null;
  const now = new Date();

  switch (period) {
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = start.toISOString();
      break;
    }
    case "last_3": {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      dateFilter = start.toISOString();
      break;
    }
    case "last_6": {
      const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      dateFilter = start.toISOString();
      break;
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      dateFilter = start.toISOString();
      break;
    }
    default:
      dateFilter = null;
  }

  // Fetch all jobs (with optional date filter)
  let query = supabase
    .from("jobs")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (dateFilter) {
    query = query.gte("created_at", dateFilter);
  }

  const { data: jobs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allJobs = (jobs ?? []) as Job[];

  // Compute margins for each job
  const jobsWithMargin = allJobs
    .filter((j) => j.contract_value > 0)
    .map((job) => {
      const margin = calculateMargin({
        contractValue: job.contract_value,
        estimatedLabourHours: job.estimated_labour_hours,
        labourRate: job.estimated_labour_rate ?? 85,
        estimatedMaterials: job.estimated_materials,
        estimatedSubcontractor: job.estimated_subcontractor,
        overheadRate: job.estimated_overhead_rate ?? 15,
        actualCost: job.actual_cost,
      });
      return { job, margin };
    });

  // Summary stats
  const totalRevenue = jobsWithMargin.reduce((s, j) => s + j.job.contract_value, 0);
  const totalCost = jobsWithMargin.reduce((s, j) => s + j.margin.actualCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin =
    jobsWithMargin.length > 0
      ? jobsWithMargin.reduce((s, j) => s + j.margin.actualMarginPct, 0) / jobsWithMargin.length
      : 0;

  // Margin by month
  const monthlyMap = new Map<string, { revenue: number; cost: number; count: number }>();

  for (const { job, margin } of jobsWithMargin) {
    const date = new Date(job.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(key) ?? { revenue: 0, cost: 0, count: 0 };
    existing.revenue += job.contract_value;
    existing.cost += margin.actualCost;
    existing.count += 1;
    monthlyMap.set(key, existing);
  }

  const marginByMonth = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      label: formatMonthLabel(month),
      revenue: round2(data.revenue),
      cost: round2(data.cost),
      profit: round2(data.revenue - data.cost),
      marginPct: data.revenue > 0 ? round2(((data.revenue - data.cost) / data.revenue) * 100) : 0,
      jobCount: data.count,
    }));

  // Margin by job type
  const typeMap = new Map<string, { revenue: number; cost: number; count: number }>();

  for (const { job, margin } of jobsWithMargin) {
    const jobType = job.job_type ?? "other";
    const existing = typeMap.get(jobType) ?? { revenue: 0, cost: 0, count: 0 };
    existing.revenue += job.contract_value;
    existing.cost += margin.actualCost;
    existing.count += 1;
    typeMap.set(jobType, existing);
  }

  const marginByType = Array.from(typeMap.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([type, data]) => ({
      type,
      revenue: round2(data.revenue),
      cost: round2(data.cost),
      profit: round2(data.revenue - data.cost),
      marginPct: data.revenue > 0 ? round2(((data.revenue - data.cost) / data.revenue) * 100) : 0,
      jobCount: data.count,
    }));

  // Per-job summary
  const jobSummary = jobsWithMargin.map(({ job, margin }) => ({
    id: job.id,
    name: job.name,
    customerName: job.customer_name,
    jobType: job.job_type,
    status: job.status,
    contractValue: job.contract_value,
    actualCost: margin.actualCost,
    profit: margin.actualGrossProfit,
    marginPct: margin.actualMarginPct,
    estimatedMarginPct: margin.estimatedMarginPct,
    variancePct: margin.variancePct,
    marginStatus: margin.status,
    createdAt: job.created_at,
    closedAt: job.closed_at,
  }));

  return NextResponse.json({
    data: {
      summary: {
        totalJobs: allJobs.length,
        jobsWithValue: jobsWithMargin.length,
        totalRevenue: round2(totalRevenue),
        totalCost: round2(totalCost),
        totalProfit: round2(totalProfit),
        avgMargin: round2(avgMargin),
      },
      marginByMonth,
      marginByType,
      jobSummary,
    },
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-CA", { month: "short", year: "numeric" });
}
