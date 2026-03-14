import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/team
 * Returns all team members + pending invites for the current company.
 */
export async function GET() {
  try {
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

    // Fetch team members
    const { data: members, error: membersErr } = await supabase
      .from("users")
      .select("id, full_name, email:phone, role, is_active, created_at")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: true });

    if (membersErr) {
      return NextResponse.json(
        { error: membersErr.message },
        { status: 500 }
      );
    }

    // We need the email from auth.users — fetch via supabase admin if we have service key
    // For now, return phone as a fallback; the real email comes from the invite record
    // Actually, let's also fetch pending invites
    const { data: invites, error: invitesErr } = await supabase
      .from("invites")
      .select("id, email, role, status, created_at, expires_at")
      .eq("company_id", profile.company_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (invitesErr) {
      return NextResponse.json(
        { error: invitesErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        members: members ?? [],
        invites: invites ?? [],
        currentUserRole: profile.role,
      },
    });
  } catch (error) {
    console.error("Team fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["pm", "crew_lead"]),
});

/**
 * POST /api/team
 * Sends a team invite. Only owners and PMs can invite.
 */
export async function POST(request: NextRequest) {
  try {
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

    // Only owners and PMs can invite
    if (profile.role !== "owner" && profile.role !== "pm") {
      return NextResponse.json(
        { error: "Only owners and project managers can invite team members." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Check if user with this email already exists in the company
    // (we can't easily check email from auth.users via PostgREST,
    //  so check invites table for duplicates)
    const { data: existingInvite } = await supabase
      .from("invites")
      .select("id, status")
      .eq("company_id", profile.company_id)
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite has already been sent to this email." },
        { status: 409 }
      );
    }

    // Generate a unique invite token
    const token = crypto.randomBytes(32).toString("hex");

    // Create the invite
    const { data: invite, error: insertErr } = await supabase
      .from("invites")
      .insert({
        company_id: profile.company_id,
        invited_by: user.id,
        email: email.toLowerCase(),
        role,
        token,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: insertErr.message },
        { status: 500 }
      );
    }

    // Send invite email via Resend (if configured)
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Get company name for the email
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .single();

    const inviteUrl = `${appUrl}/invite/${token}`;

    if (resendKey && fromEmail) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email.toLowerCase()],
            subject: `You're invited to join ${company?.name ?? "a team"} on TrueMargin`,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #2a9d6e;">You've been invited to TrueMargin</h2>
                <p>${company?.name ?? "A team"} has invited you to join as a <strong>${role === "pm" ? "Project Manager" : "Crew Lead"}</strong>.</p>
                <p>TrueMargin helps trade contractors track real-time job profitability — from estimate to close.</p>
                <a href="${inviteUrl}" style="display: inline-block; background: #2a9d6e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                  Accept Invite
                </a>
                <p style="color: #888; font-size: 13px;">This invite expires in 7 days.</p>
                <p style="color: #888; font-size: 13px;">If you didn't expect this invite, you can ignore this email.</p>
              </div>
            `,
          }),
        });

        if (!emailRes.ok) {
          console.error("Resend email failed:", await emailRes.text());
        }
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
        // Don't fail the invite creation if email fails
      }
    } else {
      console.log(`[DEV] Invite email would be sent to ${email}`);
      console.log(`[DEV] Invite URL: ${inviteUrl}`);
    }

    return NextResponse.json({
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        inviteUrl,
      },
    });
  } catch (error) {
    console.error("Team invite error:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
