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
  const [confirmTarget, setConfirmTarget] = useState<{ label: string; value: JobStatus } | null>(null);

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
      setConfirmTarget(null);
    }
  }

  function handleOptionClick(opt: { label: string; value: JobStatus }) {
    // Dangerous transitions get confirmation
    if (opt.value === "closed") {
      setConfirmTarget(opt);
      setOpen(false);
    } else {
      handleStatusChange(opt.value);
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
                onClick={() => handleOptionClick(opt)}
                className="flex w-full items-center px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                aria-label={opt.label}
              >
                {opt.value === "closed" && (
                  <svg className="mr-1.5 h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Confirmation dialog for dangerous actions (Close Job) */}
      {confirmTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 animate-fade-in" onClick={() => setConfirmTarget(null)} aria-hidden="true" />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-6 shadow-lg animate-scale-in"
            role="alertdialog"
            aria-modal="true"
            aria-label={COPY.STATUS_CHANGE_CONFIRM}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{confirmTarget.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{COPY.STATUS_CHANGE_CONFIRM}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmTarget(null)} disabled={loading}>
                {COPY.CANCEL}
              </Button>
              <Button size="sm" onClick={() => handleStatusChange(confirmTarget.value)} disabled={loading}>
                {loading ? COPY.LOADING : confirmTarget.label}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
