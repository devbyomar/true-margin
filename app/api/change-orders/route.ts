import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createChangeOrderSchema = z.object({
  job_id: z.string().uuid(),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().nullable().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
});

// GET /api/change-orders?job_id=xxx — list change orders for a job
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = request.nextUrl.searchParams.get("job_id");
  if (!jobId) {
    return NextResponse.json(
      { error: "job_id query parameter is required" },
      { status: 400 }
    );
  }

  const { data: changeOrders, error } = await supabase
    .from("change_orders")
    .select("*, users:created_by(full_name)")
    .eq("job_id", jobId)
    .order("number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: changeOrders });
}

// POST /api/change-orders — create a new change order
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = createChangeOrderSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  // Verify the user has access to this job
  const { data: userRecord } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!userRecord) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, company_id")
    .eq("id", parsed.data.job_id)
    .eq("company_id", userRecord.company_id)
    .single();

  if (!job) {
    return NextResponse.json(
      { error: "Job not found or access denied" },
      { status: 404 }
    );
  }

  // Get next change order number for this job
  const { data: lastCo } = await supabase
    .from("change_orders")
    .select("number")
    .eq("job_id", parsed.data.job_id)
    .order("number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (lastCo?.number ?? 0) + 1;

  const { data: changeOrder, error: insertError } = await supabase
    .from("change_orders")
    .insert({
      job_id: parsed.data.job_id,
      company_id: userRecord.company_id,
      created_by: user.id,
      number: nextNumber,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      amount: parsed.data.amount,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: changeOrder }, { status: 201 });
}
