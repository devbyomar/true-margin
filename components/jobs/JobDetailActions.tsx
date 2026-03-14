"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import type { JobStatus } from "@/types";

interface JobDetailActionsProps {
  jobId: string;
  currentStatus: JobStatus;
}

const NEXT_STATUSES: Record<JobStatus, { label: string; value: JobStatus }[]> = {
  estimating: [
    { label: "Mark Active", value: "active" },
    { label: "Put On Hold", value: "on_hold" },
  ],
  active: [
    { label: "Put On Hold", value: "on_hold" },
    { label: "Close Job", value: "closed" },
  ],
  on_hold: [
    { label: "Resume (Active)", value: "active" },
    { label: "Close Job", value: "closed" },
  ],
  closed: [
    { label: "Re-open (Active)", value: "active" },
  ],
};

export function JobDetailActions({ jobId, currentStatus }: JobDetailActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const options = NEXT_STATUSES[currentStatus] ?? [];

  async function handleStatusChange(newStatus: JobStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  if (options.length === 0) return null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={loading}
        aria-label="Change job status"
        aria-expanded={open}
      >
        {loading ? (
          COPY.LOADING
        ) : (
          <>
            <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
            Status
          </>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border bg-white shadow-lg animate-scale-in">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className="flex w-full items-center px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                aria-label={opt.label}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
