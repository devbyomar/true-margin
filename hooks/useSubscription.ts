"use client";

import { useCallback, useEffect, useState } from "react";
import type { Plan, SubscriptionStatus, UserRole } from "@/types";

interface SubscriptionState {
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  hasStripeCustomer: boolean;
  hasSubscription: boolean;
  role: UserRole;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  plan: "starter",
  subscriptionStatus: "trialing",
  hasStripeCustomer: false,
  hasSubscription: false,
  role: "owner",
  isLoading: true,
  error: null,
};

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>(initialState);

  const fetchSubscription = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const res = await fetch("/api/stripe/subscription");
      if (!res.ok) {
        throw new Error("Failed to fetch subscription info.");
      }

      const json = await res.json() as {
        data: {
          plan: Plan;
          subscriptionStatus: SubscriptionStatus;
          hasStripeCustomer: boolean;
          hasSubscription: boolean;
          role: UserRole;
        };
      };

      setState({
        plan: json.data.plan,
        subscriptionStatus: json.data.subscriptionStatus,
        hasStripeCustomer: json.data.hasStripeCustomer,
        hasSubscription: json.data.hasSubscription,
        role: json.data.role,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  const isActive =
    state.subscriptionStatus === "active" ||
    state.subscriptionStatus === "trialing";

  const isPastDue = state.subscriptionStatus === "past_due";
  const isCanceled = state.subscriptionStatus === "canceled";
  const isOwner = state.role === "owner";

  const startCheckout = useCallback(
    async (plan: Plan) => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const json = await res.json() as { error: string };
        throw new Error(json.error ?? "Failed to start checkout.");
      }

      const json = await res.json() as { url: string };
      if (json.url) {
        window.location.href = json.url;
      }
    },
    []
  );

  const openPortal = useCallback(async () => {
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
    });

    if (!res.ok) {
      const json = await res.json() as { error: string };
      throw new Error(json.error ?? "Failed to open billing portal.");
    }

    const json = await res.json() as { url: string };
    if (json.url) {
      window.location.href = json.url;
    }
  }, []);

  return {
    ...state,
    isActive,
    isPastDue,
    isCanceled,
    isOwner,
    refetch: fetchSubscription,
    startCheckout,
    openPortal,
  };
}
