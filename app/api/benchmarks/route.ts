import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateMargin } from "@/lib/margin-calculator";

export const dynamic = "force-dynamic";

/**
 * GET /api/benchmarks
 * Get benchmark data for the current user's job types and province.
 * Also returns the user's own averages for comparison.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("province, labour_rate, overhead_rate")
    .eq("id", dbUser.company_id)
    .single();

  // Get user's own closed jobs with margins
  const { data: userJobs } = await supabase
    .from("jobs")
    .select(
      "id, job_type, contract_value, estimated_labour_hours, estimated_labour_rate, estimated_materials, estimated_subcontractor, estimated_overhead_rate, actual_cost"
    )
    .eq("company_id", dbUser.company_id)
    .eq("status", "closed");

  // Calculate user's margins by job type
  const userMarginsByType: Record<
    string,
    { margins: number[]; avgMargin: number }
  > = {};

  for (const job of userJobs ?? []) {
    const jobType = job.job_type ?? "other";
    const labourRate =
      job.estimated_labour_rate ?? company?.labour_rate ?? 85;
    const overheadRate =
      job.estimated_overhead_rate ?? company?.overhead_rate ?? 15;

    const m = calculateMargin({
      contractValue: job.contract_value,
      estimatedLabourHours: job.estimated_labour_hours,
      labourRate,
      estimatedMaterials: job.estimated_materials,
      estimatedSubcontractor: job.estimated_subcontractor,
      overheadRate,
      actualCost: job.actual_cost,
    });

    if (!userMarginsByType[jobType]) {
      userMarginsByType[jobType] = { margins: [], avgMargin: 0 };
    }
    userMarginsByType[jobType].margins.push(m.actualMarginPct);
  }

  // Calculate averages
  for (const [type, data] of Object.entries(userMarginsByType)) {
    if (data.margins.length > 0) {
      userMarginsByType[type]!.avgMargin =
        Math.round(
          (data.margins.reduce((a, b) => a + b, 0) / data.margins.length) *
            100
        ) / 100;
    }
  }

  // Fetch benchmark data (from cache table)
  const { data: benchmarks } = await supabase
    .from("benchmarks_cache")
    .select("*")
    .order("sample_size", { ascending: false });

  // Build response
  const comparisons = Object.entries(userMarginsByType).map(
    ([jobType, userData]) => {
      // Find matching benchmark
      const benchmark = (benchmarks ?? []).find(
        (b) =>
          b.job_type === jobType &&
          (b.province === company?.province || !b.province)
      );

      // Determine percentile rank
      let percentile: number | null = null;
      if (benchmark && benchmark.sample_size > 0) {
        const userAvg = userData.avgMargin;
        if (userAvg <= benchmark.p25_margin_pct) percentile = 25;
        else if (userAvg <= benchmark.median_margin_pct) percentile = 50;
        else if (userAvg <= benchmark.p75_margin_pct) percentile = 75;
        else percentile = 90;
      }

      return {
        job_type: jobType,
        your_avg_margin: userData.avgMargin,
        your_job_count: userData.margins.length,
        industry_avg_margin: benchmark?.avg_margin_pct ?? null,
        industry_median_margin: benchmark?.median_margin_pct ?? null,
        industry_sample_size: benchmark?.sample_size ?? 0,
        percentile,
        above_average: benchmark
          ? userData.avgMargin > benchmark.avg_margin_pct
          : null,
      };
    }
  );

  // Overall user stats
  const allMargins = Object.values(userMarginsByType).flatMap(
    (d) => d.margins
  );
  const overallAvg =
    allMargins.length > 0
      ? Math.round(
          (allMargins.reduce((a, b) => a + b, 0) / allMargins.length) * 100
        ) / 100
      : 0;

  return NextResponse.json({
    data: {
      overall_avg_margin: overallAvg,
      total_closed_jobs: allMargins.length,
      comparisons,
    },
  });
}
