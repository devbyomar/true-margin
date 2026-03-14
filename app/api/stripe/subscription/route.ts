import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/stripe/subscription
 * Returns the current company's subscription info.
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
      return NextResponse.json(
        { error: "No company found." },
        { status: 404 }
      );
    }

    const { data: company } = await supabase
      .from("companies")
      .select(
        "plan, subscription_status, stripe_customer_id, stripe_subscription_id"
      )
      .eq("id", profile.company_id)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: "Company not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        plan: company.plan,
        subscriptionStatus: company.subscription_status,
        hasStripeCustomer: !!company.stripe_customer_id,
        hasSubscription: !!company.stripe_subscription_id,
        role: profile.role,
      },
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription info." },
      { status: 500 }
    );
  }
}
