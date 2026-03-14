"use client";

import { useState } from "react";
import { COPY } from "@/lib/copy";
import type { ChangeOrderStatus } from "@/types";

interface ChangeOrderItem {
  id: string;
  created_at: string;
  number: number | null;
  title: string;
  description: string | null;
  amount: number;
  status: ChangeOrderStatus;
  signed_by_name: string | null;
  signed_at: string | null;
  users: { full_name: string | null } | null;
}

interface ChangeOrderListProps {
  changeOrders: ChangeOrderItem[];
  jobId: string;
}

const STATUS_CONFIG: Record<
  ChangeOrderStatus,
  { label: string; className: string; icon: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-500/20",
    icon: "⏳",
  },
  approved: {
    label: "Approved",
    className: "bg-green-50 text-green-700 ring-green-500/20",
    icon: "✓",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 ring-red-500/20",
    icon: "✗",
  },
};

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ChangeOrderList({ changeOrders, jobId }: ChangeOrderListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const total = changeOrders.reduce((sum, co) => sum + co.amount, 0);
  const approvedTotal = changeOrders
    .filter((co) => co.status === "approved")
    .reduce((sum, co) => sum + co.amount, 0);

  function copyApprovalLink(coId: string) {
    const url = `${appUrl}/approve/${coId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(coId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  if (changeOrders.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border bg-white shadow-card">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {COPY.CHANGE_ORDER_TITLE}s
          </h3>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold tabular-nums text-muted-foreground">
            0
          </span>
        </div>
        <div className="px-5 py-8 text-center">
          <svg
            className="mx-auto h-8 w-8 text-muted-foreground/40"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="mt-2 text-xs text-muted-foreground">
            No change orders yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-card">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          {COPY.CHANGE_ORDER_TITLE}s
        </h3>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold tabular-nums text-muted-foreground">
          {changeOrders.length}
        </span>
      </div>

      <div className="divide-y">
        {changeOrders.map((co, index) => {
          const config = STATUS_CONFIG[co.status];
          return (
            <div
              key={co.id}
              className="px-5 py-4 transition-colors hover:bg-muted/30"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      CO-{String(co.number ?? 0).padStart(3, "0")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${config.className}`}
                    >
                      {config.icon} {config.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground truncate">
                    {co.title}
                  </p>
                  {co.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {co.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{formatDate(co.created_at)}</span>
                    {co.signed_by_name && (
                      <span>
                        Signed by {co.signed_by_name}
                        {co.signed_at ? ` on ${formatDate(co.signed_at)}` : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCAD(co.amount)}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* PDF download */}
                    <button
                      onClick={() => window.open(`/api/change-orders/${co.id}/pdf?t=${Date.now()}`, '_blank')}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Download PDF"
                      title="Download PDF"
                      type="button"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>

                    {/* Copy approval link (only for pending) */}
                    {co.status === "pending" && (
                      <button
                        onClick={() => copyApprovalLink(co.id)}
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-md border bg-white px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Copy approval link"
                        title="Copy approval link for customer"
                      >
                        {copiedId === co.id ? (
                          <>
                            <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.068a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
                            </svg>
                            Share
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="border-t bg-muted/30 px-5 py-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            Total ({changeOrders.length} change order
            {changeOrders.length !== 1 ? "s" : ""})
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatCAD(total)}
          </span>
        </div>
        {approvedTotal > 0 && approvedTotal !== total && (
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-green-600">Approved total</span>
            <span className="font-semibold tabular-nums text-green-600">
              {formatCAD(approvedTotal)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
