"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { COPY } from "@/lib/copy";

const changeOrderSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
});

type ChangeOrderFormValues = z.infer<typeof changeOrderSchema>;

interface ChangeOrderFormProps {
  jobId: string;
  jobName: string;
}

export function ChangeOrderForm({ jobId, jobName }: ChangeOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangeOrderFormValues>({
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
    },
  });

  async function onSubmit(values: ChangeOrderFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/change-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          title: values.title,
          description: values.description || null,
          amount: values.amount,
        }),
      });

      const json = await res.json() as { error?: string };

      if (!res.ok) {
        setError(json.error ?? COPY.ERROR_GENERIC);
        return;
      }

      router.push(`/dashboard/jobs/${jobId}`);
      router.refresh();
    } catch {
      setError(COPY.ERROR_GENERIC);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 rounded-xl border bg-white p-5 shadow-card">
        <p className="text-sm text-muted-foreground">
          Creating change order for{" "}
          <span className="font-semibold text-foreground">{jobName}</span>
        </p>
      </div>

      {error && (
        <div
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-card space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="co-title"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {COPY.CO_TITLE}
              <span className="text-red-500" aria-hidden="true"> *</span>
            </label>
            <input
              id="co-title"
              type="text"
              placeholder="e.g. Additional return air duct"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label={COPY.CO_TITLE}
              {...register("title", { required: "Title is required", minLength: { value: 2, message: "Min 2 characters" } })}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="co-description"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {COPY.CO_DESCRIPTION}
            </label>
            <textarea
              id="co-description"
              rows={4}
              placeholder="Describe the scope of the change order..."
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              aria-label={COPY.CO_DESCRIPTION}
              {...register("description")}
            />
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="co-amount"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {COPY.CO_AMOUNT}
              <span className="text-red-500" aria-hidden="true"> *</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                id="co-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="flex h-10 w-full rounded-lg border border-input bg-background pl-7 pr-14 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label={COPY.CO_AMOUNT}
                {...register("amount", {
                  required: "Amount is required",
                  valueAsNumber: true,
                  min: { value: 0.01, message: "Must be greater than 0" },
                })}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                CAD
              </span>
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            aria-label={COPY.CANCEL}
          >
            {COPY.CANCEL}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-emerald-500/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            aria-label="Create change order"
          >
            {isSubmitting ? (
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
                Creating...
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Create Change Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
