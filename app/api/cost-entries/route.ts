import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createCostEntrySchema = z.object({
  job_id: z.string().uuid("Invalid job ID"),
  category: z.enum(["labour", "materials", "subcontractor", "equipment", "other"]),
  description: z.string().nullable().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  source: z.enum(["manual", "sms", "import"]).optional().default("manual"),
  receipt_url: z.string().url().nullable().optional(),
  sms_raw: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = request.nextUrl.searchParams.get("job_id");

  let query = supabase
    .from("cost_entries")
    .select("*, users:logged_by(full_name)")
    .order("created_at", { ascending: false });

  if (jobId) {
    query = query.eq("job_id", jobId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's company_id
  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "No company found" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createCostEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  // Verify the job belongs to the user's company
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", parsed.data.job_id)
    .eq("company_id", profile.company_id)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { data: entry, error } = await supabase
    .from("cost_entries")
    .insert({
      ...parsed.data,
      company_id: profile.company_id,
      logged_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: entry }, { status: 201 });
}
