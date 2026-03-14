"use client";

import type { Job, MarginStatus } from "@/types";

interface JobCardProps {
  job: Job;
  status: MarginStatus;
}

const STATUS_BORDER: Record<MarginStatus, string> = {
  on_track: "border-l-green-600",
  at_risk: "border-l-amber-600",
  over_budget: "border-l-red-600",
};

export function JobCard({ job, status }: JobCardProps) {
  return (
    <div
      className={`rounded-lg border border-l-4 bg-card p-4 shadow-sm transition-colors hover:bg-muted/50 ${STATUS_BORDER[status]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{job.name}</h3>
          {job.customer_name && (
            <p className="text-sm text-muted-foreground">{job.customer_name}</p>
          )}
        </div>
        <span className="text-xs font-medium uppercase text-muted-foreground">
          {job.sms_code}
        </span>
      </div>
    </div>
  );
}
