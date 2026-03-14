import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLAN_CONFIG } from "@/lib/stripe";
import type { Plan } from "@/types";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  plan: z.enum(["starter", "growth", "scale"]),
});

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for a new subscription.
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

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid plan. Must be one of: starter, growth, scale." },
        { status: 400 }
      );
    }

    const { plan } = parsed.data;
    const planConfig = PLAN_CONFIG[plan];

    if (!planConfig.priceId) {
      return NextResponse.json(
        { error: "Stripe price ID not configured for this plan." },
        { status: 500 }
      );
    }

    // Get user's company
    const { data: profile } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: "No company found for this user." },
        { status: 404 }
      );
    }

    const { data: company } = await supabase
      .from("companies")
      .select("stripe_customer_id, name")
      .eq("id", profile.company_id)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: "Company not found." },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Create or reuse Stripe customer
    let customerId = company.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: company.name,
        metadata: {
          company_id: profile.company_id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save the Stripe customer ID
      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", profile.company_id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/settings/billing?success=true`,
      cancel_url: `${appUrl}/dashboard/settings/billing?canceled=true`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          company_id: profile.company_id,
          plan: plan as Plan,
        },
      },
      metadata: {
        company_id: profile.company_id,
        plan: plan as Plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
