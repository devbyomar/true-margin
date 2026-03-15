import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/time-entries/[id]/stop
 * Stop (clock out) an active time entry. Creates a linked cost entry.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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

  // Fetch the time entry
  const { data: timeEntry, error: fetchError } = await supabase
    .from("time_entries")
    .select("*")
    .eq("id", id)
    .eq("company_id", dbUser.company_id)
    .single();

  if (fetchError || !timeEntry) {
    return NextResponse.json(
      { error: "Time entry not found" },
      { status: 404 }
    );
  }

  if (timeEntry.stopped_at) {
    return NextResponse.json(
      { error: "This timer has already been stopped" },
      { status: 409 }
    );
  }

  const now = new Date();
  const startedAt = new Date(timeEntry.started_at);
  const hoursRaw = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
  const hours = Math.round(hoursRaw * 100) / 100;
  const labourRate = timeEntry.labour_rate ?? 85;
  const amount = Math.round(hours * labourRate * 100) / 100;

  // Create a cost entry for the labour
  const { data: costEntry, error: costError } = await supabase
    .from("cost_entries")
    .insert({
      job_id: timeEntry.job_id,
      company_id: dbUser.company_id,
      logged_by: user.id,
      source: timeEntry.source === "sms" ? "sms" : "manual",
      category: "labour",
      description: `${hours}h labour${timeEntry.notes ? ` — ${timeEntry.notes}` : ""}`,
      amount,
      validation_status: "validated",
    })
    .select("id")
    .single();

  if (costError || !costEntry) {
    return NextResponse.json(
      { error: "Failed to create cost entry" },
      { status: 500 }
    );
  }

  // Update the time entry
  const { data: updated, error: updateError } = await supabase
    .from("time_entries")
    .update({
      stopped_at: now.toISOString(),
      hours,
      amount,
      cost_entry_id: costEntry.id,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: updated });
}
