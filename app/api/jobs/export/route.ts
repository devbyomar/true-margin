import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateMargin } from "@/lib/margin-calculator";
import type { Job } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allJobs = (jobs ?? []) as Job[];

  // Build CSV
  const headers = [
    "Job Name",
    "Customer",
    "Address",
    "Job Type",
    "Status",
    "SMS Code",
    "Contract Value (CAD)",
    "Estimated Cost (CAD)",
    "Actual Cost (CAD)",
    "Estimated Margin %",
    "Actual Margin %",
    "Profit/Loss (CAD)",
    "Status",
    "Created",
    "Closed",
  ];

  const rows = allJobs.map((job) => {
    const margin = calculateMargin({
      contractValue: job.contract_value,
      estimatedLabourHours: job.estimated_labour_hours,
      labourRate: job.estimated_labour_rate ?? 85,
      estimatedMaterials: job.estimated_materials,
      estimatedSubcontractor: job.estimated_subcontractor,
      overheadRate: job.estimated_overhead_rate ?? 15,
      actualCost: job.actual_cost,
    });

    return [
      csvEscape(job.name),
      csvEscape(job.customer_name ?? ""),
      csvEscape(job.customer_address ?? ""),
      job.job_type ?? "",
      job.status,
      job.sms_code ?? "",
      job.contract_value.toFixed(2),
      margin.estimatedCost.toFixed(2),
      margin.actualCost.toFixed(2),
      margin.estimatedMarginPct.toFixed(1),
      margin.actualMarginPct.toFixed(1),
      margin.actualGrossProfit.toFixed(2),
      margin.status,
      job.created_at ? new Date(job.created_at).toISOString().split("T")[0] : "",
      job.closed_at ? new Date(job.closed_at).toISOString().split("T")[0] : "",
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="truemargin-jobs-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
