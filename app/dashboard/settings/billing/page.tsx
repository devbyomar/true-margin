import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COPY } from "@/lib/copy";
import { BillingClient } from "@/components/billing/BillingClient";
import { SettingsShell } from "@/components/settings/SettingsShell";
import type { Plan, SubscriptionStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    redirect("/login");
  }

  const { data: company } = await supabase
    .from("companies")
    .select(
      "plan, subscription_status, stripe_customer_id, stripe_subscription_id"
    )
    .eq("id", profile.company_id)
    .single();

  if (!company) {
    redirect("/login");
  }

  return (
    <SettingsShell
      activeTab="billing"
      title={COPY.BILLING_TITLE}
      description={COPY.BILLING_SUBTITLE}
    >
      <BillingClient
        currentPlan={company.plan as Plan}
        subscriptionStatus={company.subscription_status as SubscriptionStatus}
        hasStripeCustomer={!!company.stripe_customer_id}
        hasSubscription={!!company.stripe_subscription_id}
        isOwner={profile.role === "owner"}
      />
    </SettingsShell>
  );
}
