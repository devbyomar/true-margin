import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripeInstance(): Stripe | null {
  if (_stripe) return _stripe;
  if (process.env.STRIPE_SECRET_KEY) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Returns the Stripe instance, throwing if not configured.
 * Use this in API routes that require Stripe.
 */
export function getStripe(): Stripe {
  const instance = getStripeInstance();
  if (!instance) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment."
    );
  }
  return instance;
}

/** @deprecated Use getStripe() instead for lazy initialization */
export const stripe = getStripeInstance();

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
