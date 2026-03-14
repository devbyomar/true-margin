import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";
import { COPY } from "@/lib/copy";
import type { Company } from "@/types";
import { SettingsShell } from "@/components/settings/SettingsShell";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the user's company
  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    redirect("/login");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single();

  if (!company) {
    redirect("/login");
  }

  return (
    <SettingsShell
      activeTab="company"
      title={COPY.SETTINGS_TITLE}
      description="Manage your company details and job defaults."
    >
      <CompanySettingsForm company={company as Company} />
    </SettingsShell>
  );
}
