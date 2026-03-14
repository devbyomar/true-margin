import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    })
  : (null as unknown as Stripe);

/**
 * Returns the Stripe instance, throwing if not configured.
 * Use this in API routes that require Stripe.
 */
export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment."
    );
  }
  return stripe;
}

/** Plan configuration — maps internal plan names to Stripe price IDs. */
export const PLAN_CONFIG = {
  starter: {
    name: "Starter",
    price: 149,
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    features: [
      "Up to 5 users",
      "Up to 30 jobs/month",
      "SMS cost logging",
      "Change order PDFs",
      "Real-time margin tracking",
    ],
    userLimit: 5,
    jobLimit: 30,
  },
  growth: {
    name: "Growth",
    price: 349,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID ?? "",
    features: [
      "Up to 15 users",
      "Unlimited jobs",
      "SMS cost logging",
      "Change order PDFs",
      "Priority support",
      "Margin reports",
    ],
    userLimit: 15,
    jobLimit: Infinity,
    popular: true,
  },
  scale: {
    name: "Scale",
    price: 699,
    priceId: process.env.STRIPE_SCALE_PRICE_ID ?? "",
    features: [
      "Unlimited users",
      "Unlimited jobs",
      "SMS cost logging",
      "Change order PDFs",
      "Priority support",
      "Margin reports",
      "API access",
      "Multi-location (coming soon)",
    ],
    userLimit: Infinity,
    jobLimit: Infinity,
  },
} as const;

export type PlanKey = keyof typeof PLAN_CONFIG;
