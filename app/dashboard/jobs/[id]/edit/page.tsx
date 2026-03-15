import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobEditor } from "@/components/jobs/JobEditor";
import { COPY } from "@/lib/copy";
import type { Job } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !job) notFound();

  const typedJob = job as Job;

  const { data: company } = await supabase
    .from("companies")
    .select("id, labour_rate, overhead_rate")
    .eq("id", typedJob.company_id)
    .single();

  if (!company) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {COPY.EDIT_JOB}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the estimate and details for <span className="font-medium text-foreground">{typedJob.name}</span>.
        </p>
      </div>
      <JobEditor
        job={typedJob}
        defaultLabourRate={company.labour_rate}
        defaultOverheadRate={company.overhead_rate}
      />
    </div>
  );
}
