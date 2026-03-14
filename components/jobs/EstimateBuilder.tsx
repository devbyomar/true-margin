"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { calculateMargin } from "@/lib/margin-calculator";
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
import { COPY, JOB_TYPE_OPTIONS } from "@/lib/copy";
import type { MarginStatus } from "@/types";

const jobSchema = z.object({
  name: z.string().min(2, "Job name is required"),
  customer_name: z.string().optional(),
  customer_address: z.string().optional(),
  job_type: z.string().optional(),
  contract_value: z.number().min(0, "Contract value must be positive"),
  estimated_labour_hours: z
    .number()
    .min(0, "Labour hours must be positive"),
  estimated_labour_rate: z
    .number()
    .min(0, "Labour rate must be positive"),
  estimated_materials: z
    .number()
    .min(0, "Materials estimate must be positive"),
  estimated_subcontractor: z
    .number()
    .min(0, "Subcontractor estimate must be positive"),
  estimated_overhead_rate: z
    .number()
    .min(0, "Overhead rate must be positive")
    .max(100, "Overhead rate must be 100% or less"),
  notes: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

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
      estimated_labour_hours: 0,
      estimated_labour_rate: defaultLabourRate,
      estimated_materials: 0,
      estimated_subcontractor: 0,
      estimated_overhead_rate: defaultOverheadRate,
      notes: "",
    },
  });

  // Watch all fields for live preview
  const contractValue = watch("contract_value");
  const labourHours = watch("estimated_labour_hours");
  const labourRate = watch("estimated_labour_rate");
  const materials = watch("estimated_materials");
  const subcontractor = watch("estimated_subcontractor");
  const overheadRate = watch("estimated_overhead_rate");
  const jobTypeValue = watch("job_type");

  const margin = useMemo(() => {
    return calculateMargin({
      contractValue: contractValue || 0,
      estimatedLabourHours: labourHours || 0,
      labourRate: labourRate || 0,
      estimatedMaterials: materials || 0,
      estimatedSubcontractor: subcontractor || 0,
      overheadRate: overheadRate || 0,
      actualCost: 0,
    });
  }, [contractValue, labourHours, labourRate, materials, subcontractor, overheadRate]);

  // Compute individual cost line items for the preview
  const labourCost = (labourHours || 0) * (labourRate || 0);
  const materialsCost = materials || 0;
  const subCost = subcontractor || 0;

  async function onSubmit(data: JobFormValues) {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: job, error: insertError } = await supabase
      .from("jobs")
      .insert({
        company_id: companyId,
        name: data.name,
        customer_name: data.customer_name || null,
        customer_address: data.customer_address || null,
        job_type: data.job_type || null,
        contract_value: data.contract_value,
        estimated_labour_hours: data.estimated_labour_hours,
        estimated_labour_rate: data.estimated_labour_rate,
        estimated_materials: data.estimated_materials,
        estimated_subcontractor: data.estimated_subcontractor,
        estimated_overhead_rate: data.estimated_overhead_rate,
        notes: data.notes || null,
        status: "estimating",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    router.push(`/dashboard/jobs/${job.id}`);
    router.refresh();
  }

  const previewCard = (
    <Card className={`border transition-colors ${contractValue > 0 ? STATUS_BG[margin.status] : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Margin Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Big margin number */}
        <div className="text-center">
          <p
            className={`text-5xl font-bold tabular-nums transition-colors ${
              contractValue > 0 ? STATUS_COLORS[margin.status] : "text-muted-foreground"
            }`}
            aria-label={`Estimated margin: ${margin.estimatedMarginPct.toFixed(1)}%`}
          >
            {margin.estimatedMarginPct.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {COPY.ESTIMATED_MARGIN}
          </p>
        </div>

        {/* Cost breakdown */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Labour</span>
            <span className="font-medium tabular-nums">
              {formatCAD(labourCost)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Materials</span>
            <span className="font-medium tabular-nums">
              {formatCAD(materialsCost)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subcontractor</span>
            <span className="font-medium tabular-nums">
              {formatCAD(subCost)}
            </span>
          </div>
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
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form — 2 columns on desktop */}
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

          {/* Estimate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estimate</CardTitle>
              <CardDescription>
                Enter the contract value and cost estimates. The margin preview
                updates as you type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estimated_labour_hours">
                    {COPY.LABOUR_HOURS}
                  </Label>
                  <Input
                    id="estimated_labour_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    aria-label={COPY.LABOUR_HOURS}
                    disabled={isLoading}
                    {...register("estimated_labour_hours", {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.estimated_labour_hours && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.estimated_labour_hours.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_labour_rate">
                    {COPY.LABOUR_RATE}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="estimated_labour_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      aria-label={COPY.LABOUR_RATE}
                      disabled={isLoading}
                      {...register("estimated_labour_rate", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {errors.estimated_labour_rate && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.estimated_labour_rate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estimated_materials">
                    {COPY.MATERIALS_ESTIMATE}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="estimated_materials"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      placeholder="0.00"
                      aria-label={COPY.MATERIALS_ESTIMATE}
                      disabled={isLoading}
                      {...register("estimated_materials", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {errors.estimated_materials && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.estimated_materials.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_subcontractor">
                    {COPY.SUBCONTRACTOR_ESTIMATE}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="estimated_subcontractor"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      placeholder="0.00"
                      aria-label={COPY.SUBCONTRACTOR_ESTIMATE}
                      disabled={isLoading}
                      {...register("estimated_subcontractor", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {errors.estimated_subcontractor && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.estimated_subcontractor.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_overhead_rate">
                  {COPY.OVERHEAD_RATE}
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="notes">{COPY.NOTES}</Label>
                <Textarea
                  id="notes"
                  placeholder="Any notes about this job…"
                  aria-label={COPY.NOTES}
                  disabled={isLoading}
                  {...register("notes")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mobile margin preview */}
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

      {/* Desktop margin preview (sticky sidebar) */}
      <div className="hidden lg:block">
        <div className="sticky top-8">{previewCard}</div>
      </div>
    </div>
  );
}
