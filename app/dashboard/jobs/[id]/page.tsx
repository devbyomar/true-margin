import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateMargin } from "@/lib/margin-calculator";
import { COPY, JOB_TYPE_OPTIONS } from "@/lib/copy";
import { MarginGauge } from "@/components/jobs/MarginGauge";
import { CostFeed } from "@/components/jobs/CostFeed";
import { JobDetailActions } from "@/components/jobs/JobDetailActions";
import { ChangeOrderList } from "@/components/jobs/ChangeOrderList";
import { InvoiceScanner } from "@/components/jobs/InvoiceScanner";
import { TimeTracker } from "@/components/jobs/TimeTracker";
import { PortalShareButton } from "@/components/jobs/PortalShareButton";
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
    validation_status: string;
    users: { full_name: string | null } | null;
  }>;

  // Fetch estimate line items
  const { data: lineItemsData } = await supabase
    .from("estimate_line_items")
    .select("*")
    .eq("job_id", id)
    .order("sort_order", { ascending: true });

  const lineItems = (lineItemsData ?? []) as Array<{
    id: string;
    category: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    sort_order: number;
  }>;

  // Fetch job phases
  const { data: phasesData } = await supabase
    .from("job_phases")
    .select("*")
    .eq("job_id", id)
    .order("sort_order", { ascending: true });

  const phases = (phasesData ?? []) as Array<{
    id: string;
    name: string;
    status: string;
    estimated_cost: number;
    actual_cost: number;
    sort_order: number;
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

  // Fetch time entries
  const { data: timeEntriesData } = await supabase
    .from("time_entries")
    .select("*, users:user_id(full_name)")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const timeEntries = (timeEntriesData ?? []) as Array<{
    id: string;
    started_at: string;
    stopped_at: string | null;
    hours: number | null;
    amount: number | null;
    notes: string | null;
    source: string;
    users: { full_name: string | null } | null;
  }>;

  const statusLabel = STATUS_LABELS[typedJob.status] ?? typedJob.status;
  const statusBadge = STATUS_BADGE[typedJob.status] ?? STATUS_BADGE.estimating;

  // Compute cost breakdown by category
  const categoryTotals: Record<string, number> = {};
  for (const e of entries) {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
  }
  const labourEstimate = typedJob.estimated_labour_hours * labourRate;
  const estimateByCategory: Record<string, number> = {
    labour: labourEstimate,
    materials: typedJob.estimated_materials,
    subcontractor: typedJob.estimated_subcontractor,
  };

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

        <div className="flex shrink-0 gap-2 flex-wrap">
          <PortalShareButton portalToken={typedJob.customer_portal_token} />
          <Link
            href={`/dashboard/jobs/${id}/edit`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border bg-white px-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted/50 active:scale-[0.98] sm:px-3"
            aria-label={COPY.EDIT_JOB}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <span className="hidden sm:inline">{COPY.EDIT_JOB}</span>
          </Link>
          <JobDetailActions jobId={id} currentStatus={typedJob.status} />
          <Link
            href={`/dashboard/jobs/${id}/change-orders/new`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-emerald-500/20 transition-all hover:bg-primary/90 active:scale-[0.98] sm:px-3"
            aria-label={COPY.NEW_CHANGE_ORDER}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">{COPY.NEW_CHANGE_ORDER}</span>
          </Link>
        </div>
      </div>

      {/* Main layout: two columns on desktop */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — margin + job info (shows first on mobile) */}
        <div className="space-y-6 lg:col-span-1 order-first">
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
            {lineItems.length > 0 ? (
              <div className="divide-y text-sm">
                {lineItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.category} · {item.quantity} {item.unit} × {formatCAD(item.unit_price)}
                      </p>
                    </div>
                    <span className="shrink-0 ml-3 font-medium tabular-nums text-foreground">
                      {formatCAD(item.quantity * item.unit_price)}
                    </span>
                  </div>
                ))}
                <InfoRow
                  label={COPY.ESTIMATED_COST}
                  value={formatCAD(margin.estimatedCost)}
                  bold
                />
                <InfoRow label="Overhead" value={`${overheadRate}%`} />
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
              </div>
            ) : (
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
            )}
          </div>

          {/* Job phases */}
          {phases.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-white shadow-card">
              <div className="border-b px-5 py-3">
                <h3 className="text-sm font-semibold text-foreground">Phases</h3>
              </div>
              <div className="divide-y text-sm">
                {phases.map((phase) => {
                  const statusColor =
                    phase.status === "completed"
                      ? "bg-green-50 text-green-600"
                      : phase.status === "in_progress"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-50 text-gray-500";
                  return (
                    <div
                      key={phase.id}
                      className="flex items-center justify-between px-5 py-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-foreground truncate">{phase.name}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor}`}
                        >
                          {phase.status.replace("_", " ")}
                        </span>
                      </div>
                      {phase.actual_cost > 0 && (
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {formatCAD(phase.actual_cost)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Change orders */}
          <ChangeOrderList changeOrders={changeOrders} jobId={id} />

          {/* Cost breakdown by category */}
          {entries.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-white shadow-card">
              <div className="border-b px-5 py-3">
                <h3 className="text-sm font-semibold text-foreground">{COPY.COST_BREAKDOWN_TITLE}</h3>
              </div>
              <div className="space-y-3 px-5 py-4">
                {(["labour", "materials", "subcontractor", "equipment", "other"] as const).map((cat) => {
                  const actual = categoryTotals[cat] ?? 0;
                  if (actual === 0) return null;
                  const est = estimateByCategory[cat] ?? 0;
                  const maxVal = Math.max(actual, est, 1);
                  const barPct = Math.min((actual / maxVal) * 100, 100);
                  const isOver = est > 0 && actual > est;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium capitalize text-foreground">{cat}</span>
                        <span className={`tabular-nums font-semibold ${isOver ? "text-red-600" : "text-foreground"}`}>{formatCAD(actual)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                        <div
                          className={`h-full rounded-full transition-all ${isOver ? "bg-red-400" : "bg-emerald-400"}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      {est > 0 && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70 tabular-nums">
                          Est. {formatCAD(est)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estimated vs Actual summary */}
          {entries.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-white shadow-card">
              <div className="border-b px-5 py-3">
                <h3 className="text-sm font-semibold text-foreground">{COPY.ESTIMATED_VS_ACTUAL}</h3>
              </div>
              <dl className="divide-y text-sm">
                <div className="flex items-center justify-between px-5 py-2.5">
                  <dt className="text-muted-foreground">Labour</dt>
                  <dd className="flex gap-2 tabular-nums text-right text-xs sm:text-sm sm:gap-3">
                    <span className="text-muted-foreground">{formatCAD(labourEstimate)}</span>
                    <span className="font-medium hidden sm:inline">→</span>
                    <span className={`font-semibold ${(categoryTotals["labour"] ?? 0) > labourEstimate ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCAD(categoryTotals["labour"] ?? 0)}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <dt className="text-muted-foreground">Materials</dt>
                  <dd className="flex gap-2 tabular-nums text-right text-xs sm:text-sm sm:gap-3">
                    <span className="text-muted-foreground">{formatCAD(typedJob.estimated_materials)}</span>
                    <span className="font-medium hidden sm:inline">→</span>
                    <span className={`font-semibold ${(categoryTotals["materials"] ?? 0) > typedJob.estimated_materials ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCAD(categoryTotals["materials"] ?? 0)}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <dt className="text-muted-foreground">Subcontractor</dt>
                  <dd className="flex gap-2 tabular-nums text-right text-xs sm:text-sm sm:gap-3">
                    <span className="text-muted-foreground">{formatCAD(typedJob.estimated_subcontractor)}</span>
                    <span className="font-medium hidden sm:inline">→</span>
                    <span className={`font-semibold ${(categoryTotals["subcontractor"] ?? 0) > typedJob.estimated_subcontractor ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCAD(categoryTotals["subcontractor"] ?? 0)}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5 bg-muted/20">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="flex gap-2 tabular-nums text-right text-xs sm:text-sm sm:gap-3">
                    <span className="font-semibold text-muted-foreground">{formatCAD(margin.estimatedCost)}</span>
                    <span className="font-medium hidden sm:inline">→</span>
                    <span className={`font-bold ${margin.actualCost > margin.estimatedCost ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCAD(margin.actualCost)}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

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

        {/* Right column — cost feed + invoice scanner + time tracker */}
        <div className="lg:col-span-2 space-y-6">
          <InvoiceScanner jobId={id} />
          <CostFeed jobId={id} entries={entries} jobType={typedJob.job_type} />
          <TimeTracker jobId={id} timeEntries={timeEntries} />
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
