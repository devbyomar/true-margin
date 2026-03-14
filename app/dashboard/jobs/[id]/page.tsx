import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateMargin } from "@/lib/margin-calculator";
import { COPY, JOB_TYPE_OPTIONS } from "@/lib/copy";
import { MarginGauge } from "@/components/jobs/MarginGauge";
import { CostFeed } from "@/components/jobs/CostFeed";
import { JobDetailActions } from "@/components/jobs/JobDetailActions";
import { ChangeOrderList } from "@/components/jobs/ChangeOrderList";
import type { Job, CostCategory, ChangeOrderStatus } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  estimating: COPY.STATUS_ESTIMATING,
  active: COPY.STATUS_ACTIVE,
  on_hold: COPY.STATUS_ON_HOLD,
  closed: COPY.STATUS_CLOSED,
};

const STATUS_BADGE: Record<string, string> = {
  estimating: "bg-blue-50 text-blue-600 ring-blue-500/20",
  active: "bg-green-50 text-green-600 ring-green-500/20",
  on_hold: "bg-amber-50 text-amber-600 ring-amber-500/20",
  closed: "bg-gray-50 text-gray-600 ring-gray-500/20",
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

function getJobTypeLabel(type: string | null): string {
  if (!type) return "—";
  const found = JOB_TYPE_OPTIONS.find((o) => o.value === type);
  return found ? found.label : type;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch job
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (jobError || !job) notFound();

  const typedJob = job as Job;

  // Fetch company defaults for labour rate
  const { data: company } = await supabase
    .from("companies")
    .select("labour_rate, overhead_rate")
    .eq("id", typedJob.company_id)
    .single();

  const labourRate = typedJob.estimated_labour_rate ?? company?.labour_rate ?? 85;
  const overheadRate = typedJob.estimated_overhead_rate ?? company?.overhead_rate ?? 15;

  // Calculate margin
  const margin = calculateMargin({
    contractValue: typedJob.contract_value,
    estimatedLabourHours: typedJob.estimated_labour_hours,
    labourRate,
    estimatedMaterials: typedJob.estimated_materials,
    estimatedSubcontractor: typedJob.estimated_subcontractor,
    overheadRate,
    actualCost: typedJob.actual_cost,
  });

  // Fetch cost entries
  const { data: costEntries } = await supabase
    .from("cost_entries")
    .select("*, users:logged_by(full_name)")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const entries = (costEntries ?? []) as Array<{
    id: string;
    created_at: string;
    category: CostCategory;
    description: string | null;
    amount: number;
    source: string;
    receipt_url: string | null;
    users: { full_name: string | null } | null;
  }>;

  // Fetch change orders
  const { data: changeOrdersData } = await supabase
    .from("change_orders")
    .select("*, users:created_by(full_name)")
    .eq("job_id", id)
    .order("number", { ascending: true });

  const changeOrders = (changeOrdersData ?? []) as Array<{
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
  }>;

  const changeOrderCount = changeOrders.length;

  const statusLabel = STATUS_LABELS[typedJob.status] ?? typedJob.status;
  const statusBadge = STATUS_BADGE[typedJob.status] ?? STATUS_BADGE.estimating;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2">
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Back to jobs"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              {COPY.NAV_JOBS}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {typedJob.name}
            </h1>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadge}`}
            >
              {statusLabel}
            </span>
          </div>
          {typedJob.sms_code && (
            <p className="mt-1 text-sm text-muted-foreground font-mono">
              {typedJob.sms_code}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <JobDetailActions jobId={id} currentStatus={typedJob.status} />
          <Link
            href={`/dashboard/jobs/${id}/change-orders/new`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-emerald-500/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
            aria-label={COPY.NEW_CHANGE_ORDER}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {COPY.NEW_CHANGE_ORDER}
          </Link>
        </div>
      </div>

      {/* Main layout: two columns on desktop */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — margin + job info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Margin gauge */}
          <MarginGauge
            estimatedMarginPct={margin.estimatedMarginPct}
            actualMarginPct={margin.actualMarginPct}
            status={margin.status}
            contractValue={typedJob.contract_value}
            actualCost={margin.actualCost}
            estimatedCost={margin.estimatedCost}
          />

          {/* Job info card */}
          <div className="overflow-hidden rounded-xl border bg-white shadow-card">
            <div className="border-b px-5 py-3">
              <h3 className="text-sm font-semibold text-foreground">Job Details</h3>
            </div>
            <dl className="divide-y text-sm">
              <InfoRow label="Customer" value={typedJob.customer_name ?? "—"} />
              <InfoRow label="Address" value={typedJob.customer_address ?? "—"} />
              <InfoRow label="Type" value={getJobTypeLabel(typedJob.job_type)} />
              <InfoRow label="Created" value={formatDate(typedJob.created_at)} />
              {typedJob.closed_at && (
                <InfoRow label="Closed" value={formatDate(typedJob.closed_at)} />
              )}
            </dl>
          </div>

          {/* Estimate breakdown card */}
          <div className="overflow-hidden rounded-xl border bg-white shadow-card">
            <div className="border-b px-5 py-3">
              <h3 className="text-sm font-semibold text-foreground">Estimate Breakdown</h3>
            </div>
            <dl className="divide-y text-sm">
              <InfoRow
                label="Labour"
                value={`${typedJob.estimated_labour_hours}h × ${formatCAD(labourRate)}/hr`}
              />
              <InfoRow label="Materials" value={formatCAD(typedJob.estimated_materials)} />
              <InfoRow label="Subcontractor" value={formatCAD(typedJob.estimated_subcontractor)} />
              <InfoRow label="Overhead" value={`${overheadRate}%`} />
              <InfoRow
                label={COPY.ESTIMATED_COST}
                value={formatCAD(margin.estimatedCost)}
                bold
              />
              <InfoRow
                label="Contract"
                value={formatCAD(typedJob.contract_value)}
                bold
              />
              <InfoRow
                label={COPY.ESTIMATED_PROFIT}
                value={formatCAD(margin.estimatedGrossProfit)}
                bold
                highlight={margin.estimatedGrossProfit >= 0 ? "green" : "red"}
              />
            </dl>
          </div>

          {/* Change orders */}
          <ChangeOrderList changeOrders={changeOrders} jobId={id} />

          {/* Notes */}
          {typedJob.notes && (
            <div className="overflow-hidden rounded-xl border bg-white shadow-card">
              <div className="border-b px-5 py-3">
                <h3 className="text-sm font-semibold text-foreground">{COPY.NOTES}</h3>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {typedJob.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right column — cost feed */}
        <div className="lg:col-span-2">
          <CostFeed jobId={id} entries={entries} />
        </div>
      </div>
    </div>
  );
}

// ---- Helper component ----
function InfoRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: "green" | "red";
}) {
  const valueClass = [
    "text-right",
    bold ? "font-semibold" : "text-muted-foreground",
    highlight === "green" ? "text-green-600" : "",
    highlight === "red" ? "text-red-600" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-center justify-between px-5 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={valueClass}>{value}</dd>
    </div>
  );
}
