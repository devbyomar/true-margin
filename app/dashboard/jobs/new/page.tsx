import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EstimateBuilder } from "@/components/jobs/EstimateBuilder";
import { COPY } from "@/lib/copy";

export default async function NewJobPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
    .select("id, labour_rate, overhead_rate")
    .eq("id", profile.company_id)
    .single();

  if (!company) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {COPY.CREATE_JOB}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build your estimate and see your margin in real time.
        </p>
      </div>
      <EstimateBuilder
        companyId={company.id}
        defaultLabourRate={company.labour_rate}
        defaultOverheadRate={company.overhead_rate}
      />
    </div>
  );
}
