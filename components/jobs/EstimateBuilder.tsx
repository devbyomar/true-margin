"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { COPY, JOB_TYPE_OPTIONS, COST_CATEGORY_OPTIONS } from "@/lib/copy";
import {
  getSuggestionsForTrade,
  UNIT_OPTIONS,
  PHASE_TEMPLATES,
} from "@/lib/trade-data";
import type { CostCategory, MarginStatus, UnitType } from "@/types";

// ---- Schema for job-level fields ----

const jobSchema = z.object({
  name: z.string().min(2, "Job name is required"),
  customer_name: z.string().optional(),
  customer_address: z.string().optional(),
  job_type: z.string().optional(),
  contract_value: z.number().min(0, "Contract value must be positive"),
  estimated_overhead_rate: z
    .number()
    .min(0, "Overhead rate must be positive")
    .max(100, "Overhead rate must be 100% or less"),
  notes: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

// ---- Line item local state ----

interface LineItem {
  tempId: string;
  category: CostCategory;
  description: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  phaseName: string;
  vendorName: string;
}

// ---- Phase local state ----

interface Phase {
  tempId: string;
  name: string;
  sortOrder: number;
}

function newLineItem(): LineItem {
  return {
    tempId: crypto.randomUUID(),
    category: "materials",
    description: "",
    quantity: 1,
    unit: "each",
    unitPrice: 0,
    phaseName: "",
    vendorName: "",
  };
}

// ---- Props ----

interface EstimateBuilderProps {
  companyId: string;
  defaultLabourRate: number;
  defaultOverheadRate: number;
}

const STATUS_COLORS: Record<MarginStatus, string> = {
  on_track: "text-green-600",
  at_risk: "text-amber-600",
  over_budget: "text-red-600",
};

const STATUS_BG: Record<MarginStatus, string> = {
  on_track: "bg-green-50 border-green-200",
  at_risk: "bg-amber-50 border-amber-200",
  over_budget: "bg-red-50 border-red-200",
};

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

export function EstimateBuilder({
  companyId,
  defaultLabourRate,
  defaultOverheadRate,
}: EstimateBuilderProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);

  // Phases state
  const [phases, setPhases] = useState<Phase[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      name: "",
      customer_name: "",
      customer_address: "",
      job_type: "",
      contract_value: 0,
      estimated_overhead_rate: defaultOverheadRate,
      notes: "",
    },
  });

  const contractValue = watch("contract_value");
  const overheadRate = watch("estimated_overhead_rate");
  const jobTypeValue = watch("job_type");

  // ---- Line-item helpers ----

  const updateLineItem = useCallback(
    (tempId: string, field: keyof LineItem, value: string | number) => {
      setLineItems((prev) =>
        prev.map((item) =>
          item.tempId === tempId ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const removeLineItem = useCallback((tempId: string) => {
    setLineItems((prev) => prev.filter((item) => item.tempId !== tempId));
  }, []);

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, newLineItem()]);
  }, []);

  // ---- Phase helpers ----

  const loadTemplatePhases = useCallback(() => {
    const key = jobTypeValue ?? "";
    const templates = PHASE_TEMPLATES[key];
    if (templates) {
      setPhases(
        templates.map((t) => ({
          tempId: crypto.randomUUID(),
          name: t.name,
          sortOrder: t.sortOrder,
        }))
      );
    }
  }, [jobTypeValue]);

  const addPhase = useCallback(() => {
    setPhases((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        name: "",
        sortOrder: prev.length,
      },
    ]);
  }, []);

  const updatePhase = useCallback(
    (tempId: string, name: string) => {
      setPhases((prev) =>
        prev.map((p) => (p.tempId === tempId ? { ...p, name } : p))
      );
    },
    []
  );

  const removePhase = useCallback((tempId: string) => {
    setPhases((prev) => prev.filter((p) => p.tempId !== tempId));
  }, []);

  // ---- Computed totals ----

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const item of lineItems) {
      const t = item.quantity * item.unitPrice;
      totals[item.category] = (totals[item.category] ?? 0) + t;
    }
    return totals;
  }, [lineItems]);

  const totalEstimatedDirectCost = useMemo(() => {
    return lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  }, [lineItems]);

  // Margin calc from line items
  const margin = useMemo(() => {
    const directCost = totalEstimatedDirectCost;
    const overheadAmount = directCost * ((overheadRate || 0) / 100);
    const estimatedCost = directCost + overheadAmount;
    const cv = contractValue || 0;
    const estimatedGrossProfit = cv - estimatedCost;
    const estimatedMarginPct =
      cv > 0 ? (estimatedGrossProfit / cv) * 100 : 0;

    let status: MarginStatus = "on_track";
    if (estimatedMarginPct < 10) status = "at_risk";
    if (estimatedMarginPct < 0) status = "over_budget";

    return {
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      estimatedGrossProfit: Math.round(estimatedGrossProfit * 100) / 100,
      estimatedMarginPct: Math.round(estimatedMarginPct * 100) / 100,
      status,
    };
  }, [totalEstimatedDirectCost, contractValue, overheadRate]);

  // ---- Suggestion options for combobox ----

  const descriptionOptions = useMemo(() => {
    const suggestions = getSuggestionsForTrade(jobTypeValue || null);
    return suggestions.map((s) => ({
      value: s.description,
      label: s.description,
      hint: s.category,
    }));
  }, [jobTypeValue]);

  const phaseOptions = useMemo(() => {
    return phases.map((p) => ({
      value: p.name,
      label: p.name,
    }));
  }, [phases]);

  // ---- Submit ----

  async function onSubmit(data: JobFormValues) {
    setIsLoading(true);
    setError(null);

    // Compute lump-sum backwards-compat fields from line items
    const labourTotal = categoryTotals["labour"] ?? 0;
    const materialsTotal = categoryTotals["materials"] ?? 0;
    const subTotal = categoryTotals["subcontractor"] ?? 0;
    const labourHours =
      defaultLabourRate > 0 ? labourTotal / defaultLabourRate : 0;

    const supabase = createClient();

    // 1. Create the job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        company_id: companyId,
        name: data.name,
        customer_name: data.customer_name || null,
        customer_address: data.customer_address || null,
        job_type: data.job_type || null,
        contract_value: data.contract_value,
        estimated_labour_hours: Math.round(labourHours * 100) / 100,
        estimated_labour_rate: defaultLabourRate,
        estimated_materials: materialsTotal,
        estimated_subcontractor: subTotal,
        estimated_overhead_rate: data.estimated_overhead_rate,
        notes: data.notes || null,
        status: "estimating",
      })
      .select("id")
      .single();

    if (jobError || !job) {
      setError(jobError?.message ?? "Failed to create job.");
      setIsLoading(false);
      return;
    }

    // 2. Create phases (if any)
    const phaseIdMap = new Map<string, string>();
    if (phases.length > 0) {
      const validPhases = phases.filter((p) => p.name.trim());
      if (validPhases.length > 0) {
        const { data: createdPhases, error: phaseError } = await supabase
          .from("job_phases")
          .insert(
            validPhases.map((p) => ({
              job_id: job.id,
              company_id: companyId,
              name: p.name.trim(),
              sort_order: p.sortOrder,
              status: "pending",
            }))
          )
          .select("id, name");

        if (phaseError) {
          console.error("Phase creation error:", phaseError);
        } else if (createdPhases) {
          for (const cp of createdPhases) {
            phaseIdMap.set(cp.name, cp.id);
          }
        }
      }
    }

    // 3. Create estimate line items
    const validItems = lineItems.filter(
      (item) => item.description.trim() && item.unitPrice > 0
    );
    if (validItems.length > 0) {
      const { error: lineItemError } = await supabase
        .from("estimate_line_items")
        .insert(
          validItems.map((item, i) => ({
            job_id: job.id,
            company_id: companyId,
            phase_id: item.phaseName
              ? phaseIdMap.get(item.phaseName) ?? null
              : null,
            category: item.category,
            description: item.description.trim(),
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unitPrice,
            sort_order: i,
          }))
        );

      if (lineItemError) {
        console.error("Line item creation error:", lineItemError);
      }
    }

    router.push(`/dashboard/jobs/${job.id}`);
    router.refresh();
  }

  // ---- Preview card ----

  const previewCard = (
    <Card
      className={`border transition-colors ${
        contractValue > 0 ? STATUS_BG[margin.status] : ""
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Margin Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-center">
          <p
            className={`text-5xl font-bold tabular-nums transition-colors ${
              contractValue > 0
                ? STATUS_COLORS[margin.status]
                : "text-muted-foreground"
            }`}
            aria-label={`Estimated margin: ${margin.estimatedMarginPct.toFixed(1)}%`}
          >
            {margin.estimatedMarginPct.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {COPY.ESTIMATED_MARGIN}
          </p>
        </div>

        <div className="space-y-2 border-t pt-4">
          {(
            ["labour", "materials", "subcontractor", "equipment", "other"] as const
          ).map((cat) => {
            const total = categoryTotals[cat] ?? 0;
            if (total === 0) return null;
            return (
              <div key={cat} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{cat}</span>
                <span className="font-medium tabular-nums">
                  {formatCAD(total)}
                </span>
              </div>
            );
          })}
          {totalEstimatedDirectCost > 0 && (overheadRate ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Overhead ({overheadRate}%)</span>
              <span className="font-medium tabular-nums">
                {formatCAD(
                  totalEstimatedDirectCost * ((overheadRate || 0) / 100)
                )}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="font-medium">{COPY.ESTIMATED_COST}</span>
            <span className="font-semibold tabular-nums">
              {formatCAD(margin.estimatedCost)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">{COPY.ESTIMATED_PROFIT}</span>
            <span
              className={`font-semibold tabular-nums ${
                margin.estimatedGrossProfit >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatCAD(margin.estimatedGrossProfit)}
            </span>
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground">
            {lineItems.filter((i) => i.description.trim()).length} line item
            {lineItems.filter((i) => i.description.trim()).length !== 1
              ? "s"
              : ""}
            {phases.length > 0 &&
              ` · ${phases.length} phase${phases.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div
              className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Details</CardTitle>
              <CardDescription>
                Basic information about the job and customer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{COPY.JOB_NAME}</Label>
                <Input
                  id="name"
                  placeholder="Furnace replacement — 42 Oak Ave"
                  aria-label={COPY.JOB_NAME}
                  disabled={isLoading}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">{COPY.CUSTOMER_NAME}</Label>
                  <Input
                    id="customer_name"
                    placeholder="John Smith"
                    aria-label={COPY.CUSTOMER_NAME}
                    disabled={isLoading}
                    {...register("customer_name")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_type">{COPY.JOB_TYPE}</Label>
                  <Select
                    value={jobTypeValue}
                    onValueChange={(value) =>
                      setValue("job_type", value, { shouldValidate: true })
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="job_type" aria-label={COPY.JOB_TYPE}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPE_OPTIONS.map((jt) => (
                        <SelectItem key={jt.value} value={jt.value}>
                          {jt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_address">
                  {COPY.CUSTOMER_ADDRESS}
                </Label>
                <Input
                  id="customer_address"
                  placeholder="42 Oak Ave, Mississauga, ON"
                  aria-label={COPY.CUSTOMER_ADDRESS}
                  disabled={isLoading}
                  {...register("customer_address")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contract Value & Overhead */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contract</CardTitle>
              <CardDescription>
                The total contract value and overhead rate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contract_value">{COPY.CONTRACT_VALUE}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="contract_value"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      placeholder="0.00"
                      aria-label={COPY.CONTRACT_VALUE}
                      disabled={isLoading}
                      {...register("contract_value", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.contract_value && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.contract_value.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="estimated_overhead_rate">
                      {COPY.OVERHEAD_RATE}
                    </Label>
                    <span className="group relative">
                      <svg
                        className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                        />
                      </svg>
                      <span
                        className="pointer-events-none absolute -top-2 left-1/2 z-50 -translate-x-1/2 -translate-y-full w-56 rounded-lg bg-foreground px-3 py-2 text-xs text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
                        role="tooltip"
                      >
                        {COPY.OVERHEAD_TOOLTIP}
                      </span>
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="estimated_overhead_rate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="pr-7"
                      aria-label={COPY.OVERHEAD_RATE}
                      disabled={isLoading}
                      {...register("estimated_overhead_rate", {
                        valueAsNumber: true,
                      })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  {errors.estimated_overhead_rate && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.estimated_overhead_rate.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Phases */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-lg">{COPY.PHASES_TITLE}</CardTitle>
                  <CardDescription>
                    Break the job into phases to track progress and costs per
                    stage.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {jobTypeValue &&
                    PHASE_TEMPLATES[jobTypeValue] &&
                    phases.length === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadTemplatePhases}
                        className="text-xs"
                      >
                        {COPY.LOAD_TEMPLATE_PHASES}
                      </Button>
                    )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPhase}
                    className="text-xs"
                  >
                    {COPY.ADD_PHASE}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {phases.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  {phases.map((phase, i) => (
                    <div key={phase.tempId} className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <Input
                        value={phase.name}
                        onChange={(e) =>
                          updatePhase(phase.tempId, e.target.value)
                        }
                        placeholder="Phase name…"
                        className="flex-1"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => removePhase(phase.tempId)}
                        className="rounded-md p-1.5 text-muted-foreground/40 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Remove phase"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Estimate Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-lg">
                    {COPY.LINE_ITEMS_TITLE}
                  </CardTitle>
                  <CardDescription>
                    Add individual cost items. Select from suggestions or type
                    your own.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addLineItem}
                  disabled={isLoading}
                  className="shadow-sm shadow-emerald-500/20"
                >
                  <svg
                    className="mr-1.5 h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  {COPY.ADD_LINE_ITEM}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lineItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  {COPY.LINE_ITEM_EMPTY}
                </p>
              ) : (
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <LineItemRow
                      key={item.tempId}
                      item={item}
                      index={index}
                      descriptionOptions={descriptionOptions}
                      phaseOptions={phaseOptions}
                      jobType={jobTypeValue || null}
                      disabled={isLoading}
                      onUpdate={updateLineItem}
                      onRemove={removeLineItem}
                    />
                  ))}

                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-sm font-semibold text-foreground">
                      Subtotal ({lineItems.length} item
                      {lineItems.length !== 1 ? "s" : ""})
                    </span>
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {formatCAD(totalEstimatedDirectCost)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{COPY.NOTES}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                placeholder="Any notes about this job…"
                aria-label={COPY.NOTES}
                disabled={isLoading}
                {...register("notes")}
              />
            </CardContent>
          </Card>

          <div className="lg:hidden">{previewCard}</div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              aria-label={COPY.CANCEL}
            >
              {COPY.CANCEL}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              aria-label={COPY.CREATE_JOB}
            >
              {isLoading ? "Creating…" : COPY.CREATE_JOB}
            </Button>
          </div>
        </form>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-8">{previewCard}</div>
      </div>
    </div>
  );
}

// ============================================================
// Line Item Row Component
// ============================================================

interface LineItemRowProps {
  item: LineItem;
  index: number;
  descriptionOptions: { value: string; label: string; hint?: string }[];
  phaseOptions: { value: string; label: string }[];
  jobType: string | null;
  disabled: boolean;
  onUpdate: (
    tempId: string,
    field: keyof LineItem,
    value: string | number
  ) => void;
  onRemove: (tempId: string) => void;
}

function LineItemRow({
  item,
  index,
  descriptionOptions,
  phaseOptions,
  jobType,
  disabled,
  onUpdate,
  onRemove,
}: LineItemRowProps) {
  const handleDescriptionChange = useCallback(
    (value: string) => {
      onUpdate(item.tempId, "description", value);

      // Look up in suggestions for auto-fill
      const suggestions = getSuggestionsForTrade(jobType);
      const match = suggestions.find(
        (s) => s.description.toLowerCase() === value.toLowerCase()
      );
      if (match) {
        onUpdate(item.tempId, "category", match.category);
        onUpdate(item.tempId, "unit", match.defaultUnit);
        if (match.defaultUnitPrice) {
          onUpdate(item.tempId, "unitPrice", match.defaultUnitPrice);
        }
      }
    },
    [item.tempId, jobType, onUpdate]
  );

  const lineTotal = item.quantity * item.unitPrice;

  return (
    <div className="rounded-lg border bg-muted/10 p-3 space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          #{index + 1}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums text-foreground">
            {formatCAD(lineTotal)}
          </span>
          <button
            type="button"
            onClick={() => onRemove(item.tempId)}
            className="rounded-md p-1 text-muted-foreground/40 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label={`Remove line item #${index + 1}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">{COPY.LINE_ITEM_DESCRIPTION}</Label>
          <Combobox
            options={descriptionOptions}
            value={item.description}
            onChange={handleDescriptionChange}
            placeholder={COPY.LINE_ITEM_SEARCH_HINT}
            disabled={disabled}
            allowCustom
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{COPY.LINE_ITEM_CATEGORY}</Label>
          <select
            value={item.category}
            onChange={(e) =>
              onUpdate(item.tempId, "category", e.target.value)
            }
            disabled={disabled}
            className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50"
          >
            {COST_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{COPY.LINE_ITEM_QUANTITY}</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.quantity || ""}
            onChange={(e) =>
              onUpdate(
                item.tempId,
                "quantity",
                parseFloat(e.target.value) || 0
              )
            }
            placeholder="1"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{COPY.LINE_ITEM_UNIT}</Label>
          <select
            value={item.unit}
            onChange={(e) =>
              onUpdate(item.tempId, "unit", e.target.value)
            }
            disabled={disabled}
            className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50"
          >
            {UNIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{COPY.LINE_ITEM_UNIT_PRICE}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="pl-7"
              value={item.unitPrice || ""}
              onChange={(e) =>
                onUpdate(
                  item.tempId,
                  "unitPrice",
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="0.00"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {phaseOptions.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs">{COPY.LINE_ITEM_PHASE}</Label>
            <select
              value={item.phaseName}
              onChange={(e) =>
                onUpdate(item.tempId, "phaseName", e.target.value)
              }
              disabled={disabled}
              className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50"
            >
              <option value="">No phase</option>
              {phaseOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs">{COPY.LINE_ITEM_VENDOR}</Label>
          <Input
            value={item.vendorName}
            onChange={(e) =>
              onUpdate(item.tempId, "vendorName", e.target.value)
            }
            placeholder={COPY.VENDOR_SEARCH_HINT}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
