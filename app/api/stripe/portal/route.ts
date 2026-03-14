import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session and returns the URL.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from("users")
      .select("company_id")
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
      .select("stripe_customer_id")
      .eq("id", profile.company_id)
      .single();

    if (!company?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session." },
      { status: 500 }
    );
  }
}
