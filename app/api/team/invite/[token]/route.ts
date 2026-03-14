import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Create a service-role client for public invite lookups.
 * Token-based invite lookup must work for unauthenticated users.
 */
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/team/invite/[token]
 * Validates an invite token. Used by the public invite acceptance page.
 * Does NOT require authentication.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    // Use service-role client since this is a public endpoint
    const supabase = createServiceClient();

    const { data: invite, error } = await supabase
      .from("invites")
      .select(
        `
        id,
        email,
        role,
        status,
        expires_at,
        company:companies(name)
      `
      )
      .eq("token", token)
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: "Invite not found or has been revoked." },
        { status: 404 }
      );
    }

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired. Please ask your admin for a new one." },
        { status: 410 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "This invite has already been used." },
        { status: 410 }
      );
    }

    const companyData = invite.company as unknown as { name: string } | null;

    return NextResponse.json({
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        companyName: companyData?.name ?? "Unknown Company",
      },
    });
  } catch (error) {
    console.error("Invite validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/invite/[token]
 * Accepts an invite. The user must be authenticated (they sign up first, then accept).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must create an account or log in first." },
        { status: 401 }
      );
    }

    // Fetch the invite
    const { data: invite, error: inviteErr } = await supabase
      .from("invites")
      .select("id, email, role, status, expires_at, company_id")
      .eq("token", token)
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json(
        { error: "Invite not found." },
        { status: 404 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "This invite has already been used." },
        { status: 410 }
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired." },
        { status: 410 }
      );
    }

    // Verify the authenticated user's email matches the invite
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `This invite was sent to ${invite.email}. Please sign in with that email address.`,
        },
        { status: 403 }
      );
    }

    // Check if user already belongs to a company
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id, company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile?.company_id) {
      // User already has a company — update their company_id + role
      const { error: updateErr } = await supabase
        .from("users")
        .update({
          company_id: invite.company_id,
          role: invite.role,
        })
        .eq("id", user.id);

      if (updateErr) {
        return NextResponse.json(
          { error: updateErr.message },
          { status: 500 }
        );
      }
    } else if (!existingProfile) {
      // Create a new user profile linked to the invite's company
      const { error: insertErr } = await supabase.from("users").insert({
        id: user.id,
        company_id: invite.company_id,
        full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Team Member",
        phone: user.phone ?? null,
        role: invite.role,
      });

      if (insertErr) {
        return NextResponse.json(
          { error: insertErr.message },
          { status: 500 }
        );
      }
    }

    // Mark invite as accepted
    const { error: acceptErr } = await supabase
      .from("invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq("id", invite.id);

    if (acceptErr) {
      console.error("Failed to mark invite as accepted:", acceptErr);
      // Don't fail — user is already linked to the company
    }

    return NextResponse.json({
      success: true,
      message: "Welcome to the team!",
      redirectTo: "/dashboard",
    });
  } catch (error) {
    console.error("Invite accept error:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
