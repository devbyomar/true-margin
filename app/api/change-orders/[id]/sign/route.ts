import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

export const dynamic = "force-dynamic";

const signChangeOrderSchema = z.object({
  signed_by_name: z.string().min(2, "Name must be at least 2 characters"),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/change-orders/[id]/sign — customer approves a change order (no auth required)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = signChangeOrderSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  // Use service role client since this is a public endpoint (no auth)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op
        },
      },
    }
  );

  // Find the change order
  const { data: changeOrder, error: fetchError } = await supabase
    .from("change_orders")
    .select("id, status, job_id, amount")
    .eq("id", id)
    .single();

  if (fetchError || !changeOrder) {
    return NextResponse.json(
      { error: "Change order not found" },
      { status: 404 }
    );
  }

  if (changeOrder.status !== "pending") {
    return NextResponse.json(
      { error: "This change order has already been processed" },
      { status: 400 }
    );
  }

  // Update the change order with signature info
  const { data: updatedCo, error: updateError } = await supabase
    .from("change_orders")
    .update({
      status: "approved",
      signed_by_name: parsed.data.signed_by_name,
      signed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  // Update the job's contract_value to include the approved change order amount
  const { data: job } = await supabase
    .from("jobs")
    .select("contract_value")
    .eq("id", changeOrder.job_id)
    .single();

  if (job) {
    await supabase
      .from("jobs")
      .update({
        contract_value: job.contract_value + changeOrder.amount,
      })
      .eq("id", changeOrder.job_id);
  }

  return NextResponse.json({ data: updatedCo });
}
