import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Plan, SubscriptionStatus } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Create a service-role Supabase client for webhook processing.
 * Webhooks don't have user sessions — we need admin access.
 */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service role credentials.");
  }
  return createClient(url, key);
}

/**
 * Map Stripe subscription status to our internal status.
 */
function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (stripeStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "active";
  }
}

/**
 * Extract the plan name from subscription metadata or price lookup.
 */
function extractPlan(subscription: Stripe.Subscription): Plan | null {
  // Check metadata first
  const metaPlan = subscription.metadata?.plan;
  if (metaPlan === "starter" || metaPlan === "growth" || metaPlan === "scale") {
    return metaPlan;
  }

  // Fall back to price ID matching
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return null;

  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter";
  if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) return "growth";
  if (priceId === process.env.STRIPE_SCALE_PRICE_ID) return "scale";

  return null;
}

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription lifecycle.
 *
 * IMPORTANT: Uses raw body for signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set.");
      return NextResponse.json(
        { error: "Webhook secret not configured." },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header." },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Handle relevant events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const companyId =
          subscription.metadata?.company_id ?? null;

        const status = mapSubscriptionStatus(subscription.status);
        const plan = extractPlan(subscription);

        // Find company by Stripe customer ID or metadata
        let targetCompanyId = companyId;

        if (!targetCompanyId) {
          const { data: company } = await supabase
            .from("companies")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          targetCompanyId = company?.id ?? null;
        }

        if (!targetCompanyId) {
          console.error(
            "Could not find company for Stripe customer:",
            customerId
          );
          // Return 200 so Stripe doesn't retry
          return NextResponse.json({ received: true });
        }

        // Update company subscription fields
        const updateData: Record<string, unknown> = {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          subscription_status: status,
        };

        if (plan) {
          updateData.plan = plan;
        }

        const { error: updateError } = await supabase
          .from("companies")
          .update(updateData)
          .eq("id", targetCompanyId);

        if (updateError) {
          console.error("Failed to update company subscription:", updateError);
        } else {
          console.log(
            `Updated company ${targetCompanyId}: status=${status}, plan=${plan ?? "unchanged"}`
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const companyId = subscription.metadata?.company_id ?? null;
        let targetCompanyId = companyId;

        if (!targetCompanyId) {
          const { data: company } = await supabase
            .from("companies")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          targetCompanyId = company?.id ?? null;
        }

        if (targetCompanyId) {
          await supabase
            .from("companies")
            .update({
              subscription_status: "canceled" as SubscriptionStatus,
              stripe_subscription_id: null,
            })
            .eq("id", targetCompanyId);

          console.log(`Subscription canceled for company ${targetCompanyId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          const { data: company } = await supabase
            .from("companies")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (company) {
            await supabase
              .from("companies")
              .update({
                subscription_status: "past_due" as SubscriptionStatus,
              })
              .eq("id", company.id);

            console.log(`Payment failed for company ${company.id} — marked as past_due`);
          }
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }
}
