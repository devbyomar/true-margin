"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

interface TimeEntryRow {
  id: string;
  started_at: string;
  stopped_at: string | null;
  hours: number | null;
  amount: number | null;
  notes: string | null;
  source: string;
  users: { full_name: string | null } | null;
}

interface TimeTrackerProps {
  jobId: string;
  timeEntries: TimeEntryRow[];
}

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function ActiveTimerDisplay({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    function update() {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <span className="font-mono text-lg font-bold text-primary tabular-nums">
      {elapsed}
    </span>
  );
}

export function TimeTracker({ jobId, timeEntries }: TimeTrackerProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeEntry = timeEntries.find((e) => !e.stopped_at);
  const completedEntries = timeEntries.filter((e) => e.stopped_at);

  const totalHours = completedEntries.reduce(
    (sum, e) => sum + (e.hours ?? 0),
    0
  );
  const totalAmount = completedEntries.reduce(
    (sum, e) => sum + (e.amount ?? 0),
    0
  );

  const handleStart = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error: string };
        setError(body.error ?? "Failed to start timer");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }, [jobId, router]);

  const handleStop = useCallback(async () => {
    if (!activeEntry) return;
    setIsStopping(true);
    setError(null);
    try {
      const res = await fetch(`/api/time-entries/${activeEntry.id}/stop`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error: string };
        setError(body.error ?? "Failed to stop timer");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsStopping(false);
    }
  }, [activeEntry, router]);

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-card">
      <div className="border-b px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          {COPY.TIME_TRACKING_TITLE}
        </h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Active timer */}
        {activeEntry ? (
          <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div>
              <p className="text-xs font-medium text-primary mb-1">
                {COPY.TIME_ACTIVE}
              </p>
              <ActiveTimerDisplay startedAt={activeEntry.started_at} />
              <p className="text-xs text-muted-foreground mt-1">
                {activeEntry.users?.full_name ?? "You"} ·{" "}
                {formatDateTime(activeEntry.started_at)}
              </p>
              {activeEntry.notes && (
                <p className="text-xs text-muted-foreground/70 mt-0.5 italic">
                  {activeEntry.notes}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStop}
              disabled={isStopping}
              className="gap-1.5"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              {isStopping ? "Stopping…" : COPY.TIME_CLOCK_OUT}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {COPY.TIME_NO_ACTIVE}
            </p>
            <Button
              size="sm"
              onClick={handleStart}
              disabled={isStarting}
              className="gap-1.5 shadow-sm shadow-emerald-500/20"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              {isStarting ? "Starting…" : COPY.TIME_CLOCK_IN}
            </Button>
          </div>
        )}

        {error && (
          <div
            className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Summary */}
        {completedEntries.length > 0 && (
          <div className="flex items-center gap-4 rounded-lg bg-muted/30 px-4 py-2.5">
            <div>
              <p className="text-[11px] text-muted-foreground">Total</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {formatDuration(totalHours)}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-[11px] text-muted-foreground">Labour Cost</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {formatCAD(totalAmount)}
              </p>
            </div>
          </div>
        )}

        {/* History */}
        {completedEntries.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              {COPY.TIME_HISTORY}
            </h4>
            <div className="space-y-1">
              {completedEntries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-xs hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {entry.users?.full_name ?? "Unknown"}
                    </p>
                    <p className="text-muted-foreground truncate">
                      {formatDateTime(entry.started_at)}
                      {entry.notes ? ` · ${entry.notes}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-semibold text-foreground tabular-nums">
                      {formatDuration(entry.hours ?? 0)}
                    </p>
                    <p className="text-muted-foreground tabular-nums">
                      {formatCAD(entry.amount ?? 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
