"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COPY, PROVINCE_OPTIONS } from "@/lib/copy";
import type { Company } from "@/types";
import {
  Building2,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Percent,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

const settingsSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  province: z.string().min(2, "Please select a province"),
  tax_number: z.string().optional(),
  labour_rate: z
    .number()
    .min(0, "Labour rate must be positive")
    .max(999, "Labour rate seems too high"),
  overhead_rate: z
    .number()
    .min(0, "Overhead rate must be positive")
    .max(100, "Overhead rate must be 100% or less"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface CompanySettingsFormProps {
  company: Company;
}

export function CompanySettingsForm({ company }: CompanySettingsFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: company.name,
      phone: company.phone ?? "",
      address: company.address ?? "",
      province: company.province ?? "",
      tax_number: company.tax_number ?? "",
      labour_rate: company.labour_rate,
      overhead_rate: company.overhead_rate,
    },
  });

  const provinceValue = watch("province");

  async function onSubmit(data: SettingsFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("companies")
      .update({
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        province: data.province,
        tax_number: data.tax_number || null,
        labour_rate: data.labour_rate,
        overhead_rate: data.overhead_rate,
      })
      .eq("id", company.id);

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
    router.refresh();

    // Clear success after 3s
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Status banners */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-slide-up"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Settings saved successfully.
        </div>
      )}

      {/* ─── Company Information ─── */}
      <section>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Company Information
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 ml-6">
            These details appear on change order PDFs and invoices.
          </p>
        </div>

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {/* Company name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-5 py-4 border-b border-dashed">
            <Label htmlFor="name" className="text-sm font-medium text-muted-foreground pt-2.5">
              {COPY.COMPANY_NAME}
            </Label>
            <div className="sm:col-span-2">
              <Input
                id="name"
                aria-label={COPY.COMPANY_NAME}
                disabled={isLoading}
                className="border-0 bg-muted/40 focus-visible:bg-white focus-visible:ring-1"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          {/* Phone + Province */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-5 py-4 border-b border-dashed">
            <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground pt-2.5 flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {COPY.COMPANY_PHONE}
            </Label>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="phone"
                type="tel"
                placeholder="(416) 555-0123"
                aria-label={COPY.COMPANY_PHONE}
                disabled={isLoading}
                className="border-0 bg-muted/40 focus-visible:bg-white focus-visible:ring-1"
                {...register("phone")}
              />
              <div>
                <Select
                  value={provinceValue}
                  onValueChange={(value) => {
                    setValue("province", value, { shouldValidate: true });
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    id="province"
                    aria-label={COPY.PROVINCE}
                    className="border-0 bg-muted/40 focus:bg-white focus:ring-1"
                  >
                    <SelectValue placeholder="Province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCE_OPTIONS.map((prov) => (
                      <SelectItem key={prov.value} value={prov.value}>
                        {prov.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.province && (
                  <p className="text-xs text-destructive mt-1" role="alert">
                    {errors.province.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-5 py-4 border-b border-dashed">
            <Label htmlFor="address" className="text-sm font-medium text-muted-foreground pt-2.5 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {COPY.COMPANY_ADDRESS}
            </Label>
            <div className="sm:col-span-2">
              <Input
                id="address"
                placeholder="123 Main St, Mississauga, ON"
                aria-label={COPY.COMPANY_ADDRESS}
                disabled={isLoading}
                className="border-0 bg-muted/40 focus-visible:bg-white focus-visible:ring-1"
                {...register("address")}
              />
            </div>
          </div>

          {/* Tax number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-5 py-4">
            <Label htmlFor="tax_number" className="text-sm font-medium text-muted-foreground pt-2.5 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              {COPY.TAX_NUMBER}
            </Label>
            <div className="sm:col-span-2">
              <Input
                id="tax_number"
                placeholder="123456789 RT0001"
                aria-label={COPY.TAX_NUMBER}
                disabled={isLoading}
                className="border-0 bg-muted/40 focus-visible:bg-white focus-visible:ring-1"
                {...register("tax_number")}
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Displayed on change order PDFs. Leave blank if not registered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Job Defaults ─── */}
      <section>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Job Defaults
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 ml-6">
            Pre-filled when creating new jobs. Override per job anytime.
          </p>
        </div>

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {/* Labour rate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-5 py-4 border-b border-dashed">
            <div className="pt-2.5">
              <Label htmlFor="labour_rate" className="text-sm font-medium text-muted-foreground">
                {COPY.DEFAULT_LABOUR_RATE}
              </Label>
            </div>
            <div className="sm:col-span-2">
              <div className="relative max-w-[200px]">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="labour_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8 border-0 bg-muted/40 focus-visible:bg-white focus-visible:ring-1"
                  aria-label={COPY.DEFAULT_LABOUR_RATE}
                  disabled={isLoading}
                  {...register("labour_rate", { valueAsNumber: true })}
                />
              </div>
              {errors.labour_rate && (
                <p className="text-xs text-destructive mt-1" role="alert">
                  {errors.labour_rate.message}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Hourly rate used to calculate labour costs on estimates.
              </p>
            </div>
          </div>

          {/* Overhead rate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-5 py-4">
            <div className="pt-2.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="overhead_rate" className="text-sm font-medium text-muted-foreground">
                  {COPY.DEFAULT_OVERHEAD}
                </Label>
                <span className="group relative">
                  <svg className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                  <span className="pointer-events-none absolute -top-2 left-1/2 z-50 -translate-x-1/2 -translate-y-full w-56 rounded-lg bg-foreground px-3 py-2 text-xs text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100" role="tooltip">
                    {COPY.OVERHEAD_TOOLTIP}
                  </span>
                </span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="relative max-w-[200px]">
                <Input
                  id="overhead_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="pr-8 border-0 bg-muted/40 focus-visible:bg-white focus-visible:ring-1"
                  aria-label={COPY.DEFAULT_OVERHEAD}
                  disabled={isLoading}
                  {...register("overhead_rate", { valueAsNumber: true })}
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </div>
              {errors.overhead_rate && (
                <p className="text-xs text-destructive mt-1" role="alert">
                  {errors.overhead_rate.message}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {COPY.OVERHEAD_TOOLTIP}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Save ─── */}
      <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {isDirty ? "You have unsaved changes." : "All changes saved."}
        </p>
        <Button
          type="submit"
          disabled={isLoading || !isDirty}
          size="sm"
          className="min-w-[120px]"
          aria-label={COPY.SAVE_SETTINGS}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            COPY.SAVE_SETTINGS
          )}
        </Button>
      </div>
    </form>
  );
}
