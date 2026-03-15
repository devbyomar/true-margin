import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ValidationSchema = z.object({
  entry_ids: z.array(z.string().uuid()),
  action: z.enum(["validate", "reject"]),
});

/**
 * POST /api/cost-entries/validate
 * Validate or reject one or more cost entries.
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
    .select("company_id, role")
    .eq("id", user.id)
    .single();
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only owners and PMs can validate
  if (!["owner", "pm"].includes(dbUser.role)) {
    return NextResponse.json(
      { error: "Only owners and project managers can validate cost entries" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = ValidationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { entry_ids, action } = parsed.data;
  const newStatus = action === "validate" ? "validated" : "rejected";

  // Update all entries — RLS ensures company scoping
  const { data: updated, error: updateError } = await supabase
    .from("cost_entries")
    .update({ validation_status: newStatus })
    .in("id", entry_ids)
    .eq("company_id", dbUser.company_id)
    .select("id, job_id");

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  // The trigger will auto-recalculate actual_cost for affected jobs

  return NextResponse.json({
    data: {
      updated_count: updated?.length ?? 0,
      status: newStatus,
    },
  });
}
