import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  role: z.enum(["pm", "crew_lead"]).optional(),
  is_active: z.boolean().optional(),
});

/**
 * PATCH /api/team/[id]
 * Update a team member's role or active status. Owner only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    if (profile.role !== "owner") {
      return NextResponse.json(
        { error: "Only the account owner can update team members." },
        { status: 403 }
      );
    }

    // Can't edit yourself
    if (memberId === user.id) {
      return NextResponse.json(
        { error: "You cannot change your own role." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.role !== undefined) updates.role = parsed.data.role;
    if (parsed.data.is_active !== undefined)
      updates.is_active = parsed.data.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Verify member belongs to same company
    const { data: member, error: memberErr } = await supabase
      .from("users")
      .select("id, company_id")
      .eq("id", memberId)
      .eq("company_id", profile.company_id)
      .single();

    if (memberErr || !member) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    const { error: updateErr } = await supabase
      .from("users")
      .update(updates)
      .eq("id", memberId);

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team member update error:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/[id]
 * Deactivate a team member. Owner only.
 * We don't actually delete — just set is_active = false.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    if (profile.role !== "owner") {
      return NextResponse.json(
        { error: "Only the account owner can remove team members." },
        { status: 403 }
      );
    }

    if (memberId === user.id) {
      return NextResponse.json(
        { error: "You cannot deactivate yourself." },
        { status: 400 }
      );
    }

    // Verify member belongs to same company
    const { data: member } = await supabase
      .from("users")
      .select("id")
      .eq("id", memberId)
      .eq("company_id", profile.company_id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    const { error: updateErr } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", memberId);

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team member deactivate error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate team member" },
      { status: 500 }
    );
  }
}
