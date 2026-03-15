import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const StartSchema = z.object({
  job_id: z.string().uuid(),
  notes: z.string().optional(),
});

/**
 * GET /api/time-entries
 * List time entries. Optional ?job_id= filter, ?active=true for active only.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("job_id");
  const activeOnly = searchParams.get("active") === "true";

  let query = supabase
    .from("time_entries")
    .select("*, users:user_id(full_name)")
    .order("created_at", { ascending: false });

  if (jobId) {
    query = query.eq("job_id", jobId);
  }

  if (activeOnly) {
    query = query.is("stopped_at", null);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * POST /api/time-entries
 * Start a new time entry (clock in).
 */
export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const parsed = StartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check if user already has an active timer
  const { data: active } = await supabase
    .from("time_entries")
    .select("id, job_id")
    .eq("user_id", user.id)
    .is("stopped_at", null)
    .limit(1);

  if (active && active.length > 0) {
    return NextResponse.json(
      { error: "You already have an active timer. Stop it first." },
      { status: 409 }
    );
  }

  // Verify job belongs to company
  const { data: job } = await supabase
    .from("jobs")
    .select("id, estimated_labour_rate")
    .eq("id", parsed.data.job_id)
    .eq("company_id", dbUser.company_id)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Get labour rate
  const { data: company } = await supabase
    .from("companies")
    .select("labour_rate")
    .eq("id", dbUser.company_id)
    .single();

  const labourRate = job.estimated_labour_rate ?? company?.labour_rate ?? 85;

  const { data: entry, error: insertError } = await supabase
    .from("time_entries")
    .insert({
      job_id: parsed.data.job_id,
      company_id: dbUser.company_id,
      user_id: user.id,
      started_at: new Date().toISOString(),
      labour_rate: labourRate,
      source: "manual",
      notes: parsed.data.notes ?? null,
    })
    .select("*")
    .single();

  if (insertError || !entry) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to start timer" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: entry }, { status: 201 });
}
