"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COPY, COST_CATEGORY_OPTIONS } from "@/lib/copy";
import type { CostCategory } from "@/types";

// ---- Icons (inline SVGs) ----
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

// ---- Delete confirmation dialog ----
function DeleteConfirmDialog({
  open,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 animate-fade-in" onClick={onCancel} aria-hidden="true" />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-6 shadow-lg animate-scale-in"
        role="alertdialog"
        aria-modal="true"
        aria-label={COPY.DELETE_COST_ENTRY}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <WarningIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{COPY.DELETE_COST_ENTRY}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{COPY.DELETE_COST_CONFIRM}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            {COPY.CANCEL}
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting…" : COPY.DELETE}
          </Button>
        </div>
      </div>
    </>
  );
}

interface CostEntryRow {
  id: string;
  created_at: string;
  category: CostCategory;
  description: string | null;
  amount: number;
  source: string;
  receipt_url: string | null;
  validation_status: string;
  users: { full_name: string | null } | null;
}

interface CostFeedProps {
  jobId: string;
  entries: CostEntryRow[];
}

interface EditFormState {
  category: CostCategory;
  description: string;
  amount: string;
}

const CATEGORY_ICONS: Record<CostCategory, { icon: string; bg: string; text: string }> = {
  labour: { icon: "👷", bg: "bg-blue-50", text: "text-blue-600" },
  materials: { icon: "📦", bg: "bg-amber-50", text: "text-amber-600" },
  subcontractor: { icon: "🤝", bg: "bg-purple-50", text: "text-purple-600" },
  equipment: { icon: "🔧", bg: "bg-slate-50", text: "text-slate-600" },
  other: { icon: "📋", bg: "bg-gray-50", text: "text-gray-600" },
};

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  manual: { label: COPY.SOURCE_MANUAL, className: "bg-muted text-muted-foreground" },
  sms: { label: COPY.SOURCE_SMS, className: "bg-blue-50 text-blue-600" },
  import: { label: COPY.SOURCE_IMPORT, className: "bg-purple-50 text-purple-600" },
};

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function CostFeed({ jobId, entries }: CostFeedProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<CostCategory>("materials");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Validation state
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ category: "materials", description: "", amount: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Receipt upload state
  const [uploadingReceiptId, setUploadingReceiptId] = useState<string | null>(null);
  const [removingReceiptId, setRemovingReceiptId] = useState<string | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const receiptTargetId = useRef<string | null>(null);

  const pendingCount = entries.filter(
    (e) => e.validation_status === "pending"
  ).length;

  const resetForm = useCallback(() => {
    setCategory("materials");
    setDescription("");
    setAmount("");
    setError(null);
  }, []);

  // ---- Edit handlers ----
  function startEditing(entry: CostEntryRow) {
    setEditingId(entry.id);
    setEditForm({
      category: entry.category,
      description: entry.description ?? "",
      amount: String(entry.amount),
    });
    setEditError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(entryId: string) {
    setIsSavingEdit(true);
    setEditError(null);

    const numericAmount = parseFloat(editForm.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setEditError("Please enter a valid amount.");
      setIsSavingEdit(false);
      return;
    }

    try {
      const res = await fetch(`/api/cost-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editForm.category,
          description: editForm.description.trim() || null,
          amount: numericAmount,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error: string };
        setEditError(body.error ?? "Failed to save changes.");
        setIsSavingEdit(false);
        return;
      }

      setEditingId(null);
      router.refresh();
    } catch {
      setEditError(COPY.ERROR_GENERIC);
    } finally {
      setIsSavingEdit(false);
    }
  }

  // ---- Receipt handlers ----
  function triggerReceiptUpload(entryId: string) {
    receiptTargetId.current = entryId;
    receiptInputRef.current?.click();
  }

  async function handleReceiptFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const entryId = receiptTargetId.current;
    if (!file || !entryId) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    setUploadingReceiptId(entryId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/cost-entries/${entryId}/receipt`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = (await res.json()) as { error: string };
        alert(body.error ?? "Upload failed.");
        return;
      }

      router.refresh();
    } catch {
      alert(COPY.ERROR_GENERIC);
    } finally {
      setUploadingReceiptId(null);
      receiptTargetId.current = null;
    }
  }

  async function removeReceipt(entryId: string) {
    setRemovingReceiptId(entryId);
    try {
      const res = await fetch(`/api/cost-entries/${entryId}/receipt`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setRemovingReceiptId(null);
    }
  }

  // ---- Validation handlers ----
  async function handleValidation(
    entryIds: string[],
    action: "validate" | "reject"
  ) {
    setValidatingIds((prev) => {
      const next = new Set(prev);
      entryIds.forEach((id) => next.add(id));
      return next;
    });

    try {
      const res = await fetch("/api/cost-entries/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_ids: entryIds, action }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setValidatingIds((prev) => {
        const next = new Set(prev);
        entryIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  }

  async function handleApproveAll() {
    const pendingIds = entries
      .filter((e) => e.validation_status === "pending")
      .map((e) => e.id);
    if (pendingIds.length > 0) {
      await handleValidation(pendingIds, "validate");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cost-entries/${deleteTarget}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/cost-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          category,
          description: description.trim() || null,
          amount: numericAmount,
          source: "manual",
        }),
      });

      if (!res.ok) {
        const body = await res.json() as { error: string };
        setError(body.error ?? "Failed to add entry.");
        setIsSubmitting(false);
        return;
      }

      resetForm();
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-card">
      {/* Hidden file input for receipt uploads */}
      <input
        ref={receiptInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleReceiptFile}
        aria-label={COPY.UPLOAD_RECEIPT}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">{COPY.COST_FEED_TITLE}</h2>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold tabular-nums text-muted-foreground">
            {entries.length}
          </span>
          {pendingCount > 0 && (
            <span className="flex h-5 items-center gap-1 rounded-full bg-amber-50 px-2 text-[11px] font-bold tabular-nums text-amber-600 ring-1 ring-inset ring-amber-500/20">
              {pendingCount} {COPY.VALIDATION_PENDING_COUNT}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleApproveAll}
              className="text-xs gap-1"
            >
              <CheckIcon className="h-3 w-3" />
              {COPY.VALIDATION_APPROVE_ALL}
            </Button>
          )}
          <Button
            size="sm"
            variant={showForm ? "outline" : "default"}
            className={showForm ? "" : "shadow-sm shadow-emerald-500/20"}
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) resetForm();
            }}
            aria-label={showForm ? COPY.CANCEL : COPY.ADD_COST_ENTRY}
          >
            {showForm ? (
              COPY.CANCEL
            ) : (
              <>
                <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                {COPY.ADD_COST_ENTRY}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className="border-b bg-muted/20 px-5 py-4 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600" role="alert">
                {error}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="cost-category" className="text-xs">{COPY.COST_CATEGORY}</Label>
                <select
                  id="cost-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CostCategory)}
                  className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50"
                  aria-label={COPY.COST_CATEGORY}
                >
                  {COST_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cost-desc" className="text-xs">{COPY.COST_DESCRIPTION}</Label>
                <Input
                  id="cost-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Copper pipe fittings"
                  disabled={isSubmitting}
                  aria-label={COPY.COST_DESCRIPTION}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cost-amount" className="text-xs">{COPY.COST_AMOUNT}</Label>
                <Input
                  id="cost-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={isSubmitting}
                  aria-label={COPY.COST_AMOUNT}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !amount}
                className="shadow-sm shadow-emerald-500/20"
              >
                {isSubmitting ? "Adding..." : "Add Entry"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
            <svg className="h-6 w-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No cost entries yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Add entries manually or have crew text them in via SMS.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {entries.map((entry, index) => {
            const cat = CATEGORY_ICONS[entry.category] ?? CATEGORY_ICONS.other;
            const sourceBadge = SOURCE_BADGE[entry.source] ?? { label: entry.source, className: "bg-muted text-muted-foreground" };
            const isEditing = editingId === entry.id;
            const isUploadingReceipt = uploadingReceiptId === entry.id;
            const isRemovingReceipt = removingReceiptId === entry.id;

            return (
              <div
                key={entry.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* ---- Normal (view) row ---- */}
                {!isEditing && (
                  <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20">
                    {/* Category icon */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cat.bg}`}>
                      <span className="text-sm" aria-hidden="true">{cat.icon}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.description ?? entry.category}
                        </p>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${sourceBadge.className}`}>
                          {sourceBadge.label}
                        </span>
                        {entry.validation_status === "pending" && (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/20">
                            {COPY.VALIDATION_PENDING}
                          </span>
                        )}
                        {entry.validation_status === "rejected" && (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20">
                            {COPY.VALIDATION_REJECTED}
                          </span>
                        )}
                        {/* Receipt badge */}
                        {entry.receipt_url && (
                          <a
                            href={entry.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-100 transition-colors"
                            title={COPY.VIEW_RECEIPT}
                          >
                            <PaperclipIcon className="h-2.5 w-2.5" />
                            {COPY.RECEIPT_LABEL}
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.users?.full_name ?? "Unknown"} · {formatDate(entry.created_at)} {formatTime(entry.created_at)}
                      </p>
                    </div>

                    {/* Amount */}
                    <p className={`shrink-0 text-sm font-bold tabular-nums ${entry.validation_status === "rejected" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {formatCAD(entry.amount)}
                    </p>

                    {/* Validation buttons for pending entries */}
                    {entry.validation_status === "pending" && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => handleValidation([entry.id], "validate")}
                          disabled={validatingIds.has(entry.id)}
                          className="rounded-md p-1.5 text-emerald-600/60 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                          aria-label={`Approve: ${entry.description ?? entry.category}`}
                          title={COPY.VALIDATION_APPROVE}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleValidation([entry.id], "reject")}
                          disabled={validatingIds.has(entry.id)}
                          className="rounded-md p-1.5 text-red-400/60 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label={`Reject: ${entry.description ?? entry.category}`}
                          title={COPY.VALIDATION_REJECT}
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Action buttons: receipt · edit · delete */}
                    <div className="flex shrink-0 gap-0.5">
                      {/* Upload / replace receipt */}
                      <button
                        onClick={() => triggerReceiptUpload(entry.id)}
                        disabled={isUploadingReceipt}
                        className="rounded-md p-1.5 text-muted-foreground/40 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                        aria-label={entry.receipt_url ? COPY.UPLOAD_RECEIPT : COPY.ATTACH_RECEIPT}
                        title={entry.receipt_url ? COPY.UPLOAD_RECEIPT : COPY.ATTACH_RECEIPT}
                      >
                        {isUploadingReceipt ? (
                          <span className="flex h-4 w-4 items-center justify-center">
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          </span>
                        ) : (
                          <PaperclipIcon className="h-4 w-4" />
                        )}
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={() => startEditing(entry)}
                        className="rounded-md p-1.5 text-muted-foreground/40 transition-colors hover:bg-amber-50 hover:text-amber-600"
                        aria-label={`${COPY.EDIT_ENTRY}: ${entry.description ?? entry.category}`}
                        title={COPY.EDIT_ENTRY}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setDeleteTarget(entry.id)}
                        className="rounded-md p-1.5 text-muted-foreground/40 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`${COPY.DELETE_COST_ENTRY}: ${entry.description ?? entry.category}`}
                        title={COPY.DELETE}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ---- Edit (inline form) row ---- */}
                {isEditing && (
                  <div className="border-l-4 border-amber-400 bg-amber-50/30 px-5 py-4 animate-slide-up">
                    {editError && (
                      <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600" role="alert">
                        {editError}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`edit-cat-${entry.id}`} className="text-xs">{COPY.COST_CATEGORY}</Label>
                        <select
                          id={`edit-cat-${entry.id}`}
                          value={editForm.category}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value as CostCategory }))}
                          disabled={isSavingEdit}
                          className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50"
                          aria-label={COPY.COST_CATEGORY}
                        >
                          {COST_CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`edit-desc-${entry.id}`} className="text-xs">{COPY.COST_DESCRIPTION}</Label>
                        <Input
                          id={`edit-desc-${entry.id}`}
                          value={editForm.description}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="e.g. Copper pipe fittings"
                          disabled={isSavingEdit}
                          aria-label={COPY.COST_DESCRIPTION}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`edit-amt-${entry.id}`} className="text-xs">{COPY.COST_AMOUNT}</Label>
                        <Input
                          id={`edit-amt-${entry.id}`}
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                          placeholder="0.00"
                          disabled={isSavingEdit}
                          aria-label={COPY.COST_AMOUNT}
                        />
                      </div>
                    </div>

                    {/* Receipt row in edit mode */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {entry.receipt_url && (
                        <>
                          <a
                            href={entry.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100 transition-colors"
                          >
                            <ExternalLinkIcon className="h-3 w-3" />
                            {COPY.VIEW_RECEIPT}
                          </a>
                          <button
                            onClick={() => removeReceipt(entry.id)}
                            disabled={isRemovingReceipt}
                            className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-600/20 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <XIcon className="h-3 w-3" />
                            {isRemovingReceipt ? "Removing…" : COPY.REMOVE_RECEIPT}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => triggerReceiptUpload(entry.id)}
                        disabled={isUploadingReceipt}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-600/20 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        <PaperclipIcon className="h-3 w-3" />
                        {isUploadingReceipt ? COPY.UPLOADING_RECEIPT : (entry.receipt_url ? COPY.UPLOAD_RECEIPT : COPY.ATTACH_RECEIPT)}
                      </button>
                      <span className="text-[10px] text-muted-foreground">{COPY.RECEIPT_FORMATS}</span>
                    </div>

                    {/* Save / Cancel */}
                    <div className="mt-3 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSavingEdit}>
                        {COPY.CANCEL}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveEdit(entry.id)}
                        disabled={isSavingEdit || !editForm.amount}
                        className="shadow-sm shadow-emerald-500/20"
                      >
                        {isSavingEdit ? COPY.EDITING_ENTRY : COPY.SAVE_ENTRY}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
