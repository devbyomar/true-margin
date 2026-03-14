"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { COPY } from "@/lib/copy";

interface ChangeOrderData {
  id: string;
  created_at: string;
  number: number | null;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  signed_by_name: string | null;
  signed_at: string | null;
  jobs: {
    name: string;
    customer_name: string | null;
    customer_address: string | null;
  } | null;
  companies: {
    name: string;
    address: string | null;
    phone: string | null;
    province: string | null;
    tax_number: string | null;
  } | null;
}

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

export default function ApproveChangeOrderPage() {
  const params = useParams();
  const coId = params.id as string;
  const [co, setCo] = useState<ChangeOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const fetchCo = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/change-orders/${id}`);
      const json = await res.json() as { data?: ChangeOrderData; error?: string };
      if (!res.ok || !json.data) {
        setError(json.error ?? "Change order not found");
        return;
      }
      setCo(json.data);
    } catch {
      setError(COPY.ERROR_GENERIC);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (coId) {
      fetchCo(coId);
    }
  }, [coId, fetchCo]);

  async function handleApprove() {
    if (!coId || !name.trim()) return;
    setSigning(true);
    setError(null);

    try {
      const res = await fetch(`/api/change-orders/${coId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signed_by_name: name.trim() }),
      });

      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? COPY.ERROR_GENERIC);
        return;
      }

      setSigned(true);
    } catch {
      setError(COPY.ERROR_GENERIC);
    } finally {
      setSigning(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-pulse text-center">
          <div className="mx-auto h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="mt-4 text-sm text-muted-foreground">{COPY.LOADING}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !co) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-card text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Change Order Not Found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!co) return null;

  const company = co.companies;
  const job = co.jobs;
  const isAlreadySigned = co.status === "approved" || co.status === "rejected";

  // Success state after signing
  if (signed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-card text-center animate-scale-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">
            Change Order Approved
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you, {name}. Your approval has been recorded for{" "}
            <span className="font-semibold">{co.title}</span>.
          </p>
          <div className="mt-6">
            <a
              href={`/api/change-orders/${coId}/pdf?t=${Date.now()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              aria-label="Download signed PDF"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Signed PDF
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
      <div className="mx-auto max-w-lg">
        {/* Company header */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-primary">
            {company?.name ?? COPY.APP_NAME}
          </h1>
          {company?.address && (
            <p className="mt-1 text-xs text-muted-foreground">
              {company.address}
            </p>
          )}
        </div>

        {/* Change order card */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-card animate-fade-in">
          {/* Title area */}
          <div className="border-b bg-gradient-to-r from-primary/5 to-transparent px-6 py-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">
                CO-{String(co.number ?? 0).padStart(3, "0")}
              </span>
              <span>•</span>
              <span>{formatDate(co.created_at)}</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-foreground">
              {co.title}
            </h2>
          </div>

          <div className="divide-y">
            {/* Job info */}
            <div className="px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Job
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {job?.name ?? "—"}
              </p>
              {job?.customer_name && (
                <p className="text-xs text-muted-foreground">
                  {job.customer_name}
                  {job.customer_address ? ` • ${job.customer_address}` : ""}
                </p>
              )}
            </div>

            {/* Description */}
            {co.description && (
              <div className="px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                  {co.description}
                </p>
              </div>
            )}

            {/* Amount */}
            <div className="px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Amount
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {formatCAD(co.amount)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  CAD
                </span>
              </p>
            </div>

            {/* Already signed */}
            {isAlreadySigned ? (
              <div className="px-6 py-5">
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-green-800">
                      This change order has been approved
                    </span>
                  </div>
                  {co.signed_by_name && (
                    <p className="mt-2 text-xs text-green-700">
                      Approved by {co.signed_by_name}
                      {co.signed_at ? ` on ${formatDate(co.signed_at)}` : ""}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Approval form */
              <div className="px-6 py-5">
                {error && (
                  <div
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    {error}
                  </div>
                )}
                <p className="mb-4 text-sm text-muted-foreground">
                  By entering your name and clicking approve, you are
                  authorizing this change order.
                </p>
                <div className="mb-4">
                  <label
                    htmlFor="signer-name"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Your Full Name
                    <span className="text-red-500" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  </label>
                  <input
                    id="signer-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label="Your full name"
                  />
                </div>
                <button
                  onClick={handleApprove}
                  disabled={signing || name.trim().length < 2}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-emerald-500/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  aria-label={COPY.CO_APPROVE}
                >
                  {signing ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
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
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      {COPY.CO_APPROVE}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Footer with tax number */}
          {company?.tax_number && (
            <div className="border-t bg-muted/30 px-6 py-3">
              <p className="text-[10px] text-muted-foreground">
                HST/GST Reg. No. {company.tax_number}
              </p>
            </div>
          )}
        </div>

        {/* Powered by */}
        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          Powered by {COPY.APP_NAME}
        </p>
      </div>
    </div>
  );
}
