"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COPY, COST_CATEGORY_OPTIONS } from "@/lib/copy";
import type { CostCategory } from "@/types";
import type { DocumentScanLineItem } from "@/types";

interface InvoiceScannerProps {
  jobId: string;
}

export function InvoiceScanner({ jobId }: InvoiceScannerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<DocumentScanLineItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLineItems([]);
      setSelectedItems(new Set());

      // Validate
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      if (!allowed.includes(file.type)) {
        setError("Unsupported file type. Use JPG, PNG, WebP, or PDF.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum 10MB.");
        return;
      }

      // Show preview for images
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      }

      setIsUploading(true);
      setIsProcessing(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("job_id", jobId);

        const res = await fetch("/api/ocr/scan", {
          method: "POST",
          body: formData,
        });

        setIsUploading(false);

        if (!res.ok) {
          const body = (await res.json()) as { error: string };
          setError(body.error ?? COPY.OCR_FAILED);
          setIsProcessing(false);
          return;
        }

        const result = (await res.json()) as {
          data: {
            scan_id: string;
            status: string;
            line_items: DocumentScanLineItem[];
          };
        };

        if (
          result.data.status === "failed" ||
          result.data.line_items.length === 0
        ) {
          setError(COPY.OCR_NO_ITEMS);
          setIsProcessing(false);
          return;
        }

        setLineItems(result.data.line_items);
        // Select all items by default
        setSelectedItems(
          new Set(result.data.line_items.map((_, i) => i))
        );
      } catch {
        setError(COPY.OCR_FAILED);
      } finally {
        setIsUploading(false);
        setIsProcessing(false);
      }
    },
    [jobId]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function toggleItem(index: number) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function updateItem(
    index: number,
    field: keyof DocumentScanLineItem,
    value: string | number
  ) {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  async function handleAddSelected() {
    const selected = lineItems.filter((_, i) => selectedItems.has(i));
    if (selected.length === 0) return;

    setIsAdding(true);
    setError(null);

    try {
      // Add each line item as a cost entry
      const promises = selected.map((item) =>
        fetch("/api/cost-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: jobId,
            category: item.category,
            description: item.description,
            amount: item.amount,
            source: "import",
            validation_status: "pending",
          }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length > 0) {
        setError(`${failed.length} of ${selected.length} items failed to add.`);
      } else {
        // Success — reset and close
        setLineItems([]);
        setSelectedItems(new Set());
        setPreviewUrl(null);
        setShowScanner(false);
        router.refresh();
      }
    } catch {
      setError("Failed to add items. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }

  if (!showScanner) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowScanner(true)}
        className="gap-1.5"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
          />
        </svg>
        {COPY.OCR_TITLE}
      </Button>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-card animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {COPY.OCR_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {COPY.OCR_SUBTITLE}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setShowScanner(false);
            setLineItems([]);
            setPreviewUrl(null);
            setError(null);
          }}
        >
          {COPY.CANCEL}
        </Button>
      </div>

      <div className="p-5 space-y-4">
        {/* Upload area */}
        {lineItems.length === 0 && (
          <div
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/20 hover:border-primary/40"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isProcessing ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {isUploading ? COPY.OCR_UPLOADING : COPY.OCR_PROCESSING}
                </p>
                <p className="text-xs text-muted-foreground">
                  This may take a few seconds…
                </p>
              </div>
            ) : (
              <>
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Invoice preview"
                    className="max-h-48 rounded-lg mb-3 shadow-sm"
                  />
                ) : (
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-3">
                    <svg
                      className="h-6 w-6 text-muted-foreground/50"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                  </div>
                )}
                <p className="text-sm font-medium text-foreground">
                  {COPY.OCR_DRAG_DROP}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {COPY.OCR_SUPPORTED}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Extracted line items */}
        {lineItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {COPY.OCR_REVIEW_ITEMS}
              </h3>
              <span className="text-xs text-muted-foreground">
                {selectedItems.size} of {lineItems.length} selected
              </span>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    selectedItems.has(index)
                      ? "border-primary/30 bg-primary/5"
                      : "border-muted opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(index)}
                    onChange={() => toggleItem(index)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "category",
                            e.target.value
                          )
                        }
                        className="flex h-8 w-full rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm"
                      >
                        {COST_CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        className="flex h-8 w-full rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm"
                      />

                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="flex h-8 w-full rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm tabular-nums"
                      />
                    </div>

                    {item.confidence === "low" && (
                      <p className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                          />
                        </svg>
                        {COPY.OCR_LOW_CONFIDENCE}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setLineItems([]);
                  setSelectedItems(new Set());
                  setPreviewUrl(null);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleAddSelected}
                disabled={selectedItems.size === 0 || isAdding}
                className="shadow-sm shadow-emerald-500/20"
              >
                {isAdding
                  ? "Adding…"
                  : `${COPY.OCR_CONFIRM_SELECTED} (${selectedItems.size})`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
