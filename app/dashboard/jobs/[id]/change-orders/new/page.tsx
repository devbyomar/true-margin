import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangeOrderForm } from "@/components/jobs/ChangeOrderForm";
import { COPY } from "@/lib/copy";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function NewChangeOrderPage({ params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch job to verify access and get name
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, name")
    .eq("id", id)
    .single();

  if (error || !job) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="mb-2">
          <Link
            href={`/dashboard/jobs/${id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Back to job"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            {COPY.BACK}
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {COPY.NEW_CHANGE_ORDER}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a change order that can be sent to the customer for approval.
        </p>
      </div>

      <ChangeOrderForm jobId={id} jobName={job.name} />
    </div>
  );
}
