import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateCostEntrySchema = z.object({
  category: z.enum(["labour", "materials", "subcontractor", "equipment", "other"]).optional(),
  description: z.string().nullable().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0").optional(),
  validation_status: z.enum(["pending", "validated", "rejected"]).optional(),
  receipt_url: z.string().url().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  vendor_id: z.string().uuid().nullable().optional(),
  quantity: z.number().min(0).nullable().optional(),
  unit: z.string().nullable().optional(),
  unit_price: z.number().min(0).nullable().optional(),
  phase_id: z.string().uuid().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateCostEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { data: entry, error } = await supabase
    .from("cost_entries")
    .update(parsed.data)
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!entry) {
    return NextResponse.json({ error: "Cost entry not found" }, { status: 404 });
  }

  return NextResponse.json({ data: entry });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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

  const { error } = await supabase
    .from("cost_entries")
    .delete()
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
