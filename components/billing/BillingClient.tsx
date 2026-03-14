"use client";

import { useCallback, useState } from "react";
import { COPY } from "@/lib/copy";
import { PLAN_CONFIG, type PlanKey } from "@/lib/stripe";
import type { Plan, SubscriptionStatus } from "@/types";

interface BillingClientProps {
  currentPlan: Plan;
  subscriptionStatus: SubscriptionStatus;
  hasStripeCustomer: boolean;
  hasSubscription: boolean;
  isOwner: boolean;
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const config: Record<
    SubscriptionStatus,
    { label: string; className: string }
  > = {
    active: {
      label: COPY.SUBSCRIPTION_ACTIVE,
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    trialing: {
      label: COPY.SUBSCRIPTION_TRIALING,
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    past_due: {
      label: COPY.SUBSCRIPTION_PAST_DUE,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    canceled: {
      label: COPY.SUBSCRIPTION_CANCELED,
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const c = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${c.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "active"
            ? "bg-emerald-500"
            : status === "trialing"
              ? "bg-blue-500"
              : status === "past_due"
                ? "bg-amber-500"
                : "bg-red-500"
        }`}
        aria-hidden="true"
      />
      {c.label}
    </span>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

export function BillingClient({
  currentPlan,
  subscriptionStatus,
  hasStripeCustomer,
  hasSubscription,
  isOwner,
}: BillingClientProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive =
    subscriptionStatus === "active" || subscriptionStatus === "trialing";

  const handleSelectPlan = useCallback(
    async (plan: PlanKey) => {
      if (!isOwner) return;
      setLoadingPlan(plan);
      setError(null);

      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });

        const json = (await res.json()) as { url?: string; error?: string };

        if (!res.ok) {
          throw new Error(json.error ?? "Failed to start checkout.");
        }

        if (json.url) {
          window.location.href = json.url;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoadingPlan(null);
      }
    },
    [isOwner]
  );

  const handleOpenPortal = useCallback(async () => {
    if (!isOwner) return;
    setPortalLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const json = (await res.json()) as { url?: string; error?: string };

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to open billing portal.");
      }

      if (json.url) {
        window.location.href = json.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setPortalLoading(false);
    }
  }, [isOwner]);

  const planOrder: PlanKey[] = ["starter", "growth", "scale"];
  const currentPlanIndex = planOrder.indexOf(currentPlan);

  return (
    <div className="space-y-8">
      {/* Status banner */}
      {subscriptionStatus === "past_due" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Payment past due
            </p>
            <p className="mt-0.5 text-sm text-amber-700">
              {COPY.BILLING_PAST_DUE_WARNING}
            </p>
          </div>
        </div>
      )}

      {subscriptionStatus === "canceled" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">
              Subscription canceled
            </p>
            <p className="mt-0.5 text-sm text-red-700">
              {COPY.BILLING_CANCELED_WARNING}
            </p>
          </div>
        </div>
      )}

      {/* Current plan info card */}
      <div className="rounded-xl border bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {COPY.CURRENT_PLAN}
              </h2>
              <StatusBadge status={subscriptionStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {isActive
                ? `You're on the ${PLAN_CONFIG[currentPlan].name} plan.`
                : COPY.BILLING_NO_SUBSCRIPTION}
            </p>
          </div>

          {hasStripeCustomer && hasSubscription && isOwner && (
            <button
              type="button"
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
              aria-label={COPY.PLAN_MANAGE}
            >
              {portalLoading ? (
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
              )}
              {COPY.PLAN_MANAGE}
            </button>
          )}
        </div>

        {hasStripeCustomer && hasSubscription && (
          <p className="mt-3 text-xs text-muted-foreground">
            {COPY.BILLING_PORTAL_DESC}
          </p>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Choose your plan
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {planOrder.map((planKey, index) => {
            const plan = PLAN_CONFIG[planKey];
            const isCurrent = planKey === currentPlan && isActive;
            const isPopular = "popular" in plan && plan.popular;
            const isUpgrade = index > currentPlanIndex;
            const isDowngrade = index < currentPlanIndex;
            const isLoading = loadingPlan === planKey;

            let buttonLabel: string = COPY.PLAN_SELECT;
            if (isCurrent) {
              buttonLabel = COPY.PLAN_CURRENT_BADGE;
            } else if (isActive && isUpgrade) {
              buttonLabel = COPY.PLAN_UPGRADE;
            } else if (isActive && isDowngrade) {
              buttonLabel = COPY.PLAN_DOWNGRADE;
            }

            return (
              <div
                key={planKey}
                className={`relative flex flex-col rounded-xl border p-6 transition-all ${
                  isPopular
                    ? "border-emerald-300 shadow-lg shadow-emerald-500/10"
                    : "border-gray-200 shadow-card"
                } ${isCurrent ? "ring-2 ring-emerald-500 ring-offset-2" : ""} bg-white`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25">
                      {COPY.PLAN_POPULAR_BADGE}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tabular-nums text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {COPY.PLAN_MONTHLY}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isCurrent) return;
                    if (isActive && hasSubscription) {
                      // For upgrades/downgrades, redirect to portal
                      void handleOpenPortal();
                    } else {
                      void handleSelectPlan(planKey);
                    }
                  }}
                  disabled={isCurrent || isLoading || !isOwner}
                  className={`mt-auto flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                    isCurrent
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : isPopular
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-500/40 disabled:opacity-50"
                        : "border border-gray-200 bg-white text-foreground shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  }`}
                  aria-label={`${buttonLabel} - ${plan.name} plan`}
                >
                  {isLoading && (
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  {isCurrent && (
                    <CheckIcon className="h-4 w-4 text-emerald-600" />
                  )}
                  {buttonLabel}
                </button>

                {!isOwner && !isCurrent && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Only the account owner can change plans.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trial info */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {COPY.PLAN_TRIAL_BADGE}
            </p>
            <p className="mt-0.5 text-sm text-blue-700">
              All plans include a 14-day free trial. No credit card required to
              start. You&apos;ll only be charged after your trial ends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
