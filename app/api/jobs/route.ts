import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createJobSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(2),
  customer_name: z.string().nullable().optional(),
  customer_address: z.string().nullable().optional(),
  job_type: z.string().nullable().optional(),
  contract_value: z.number().min(0),
  estimated_labour_hours: z.number().min(0),
  estimated_labour_rate: z.number().min(0).nullable().optional(),
  estimated_materials: z.number().min(0),
  estimated_subcontractor: z.number().min(0),
  estimated_overhead_rate: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["estimating", "active", "on_hold", "closed"]).optional(),
});

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
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: jobs });
}

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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  // Verify user belongs to the company
  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profile?.company_id !== parsed.data.company_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      ...parsed.data,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: job }, { status: 201 });
}
