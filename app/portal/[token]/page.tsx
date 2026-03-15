import { notFound } from "next/navigation";
import { COPY } from "@/lib/copy";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ token: string }>;
}

interface PortalData {
  name: string;
  customer_name: string | null;
  status: string;
  status_label: string;
  contract_value: number;
  progress_pct: number;
  created_at: string;
  closed_at: string | null;
  change_orders: Array<{
    number: number | null;
    title: string;
    amount: number;
    status: string;
    signed_at: string | null;
    signed_by_name: string | null;
  }>;
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
    month: "long",
    year: "numeric",
  });
}

const STATUS_COLORS: Record<string, string> = {
  estimating: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-amber-100 text-amber-700",
  closed: "bg-gray-100 text-gray-700",
};

export default async function CustomerPortalPage({ params }: RouteParams) {
  const { token } = await params;

  // Fetch portal data from our API
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${appUrl}/api/portal/${token}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    notFound();
  }

  const result = (await res.json()) as { data: PortalData };
  const data = result.data;

  const approvedCOs = data.change_orders.filter((co) => co.status === "approved");
  const totalCOAmount = approvedCOs.reduce((sum, co) => sum + co.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 tracking-wider uppercase">
                {COPY.PORTAL_TITLE}
              </p>
              <h1 className="text-lg font-bold text-slate-900 mt-0.5">
                {data.name}
              </h1>
              {data.customer_name && (
                <p className="text-sm text-slate-500">{data.customer_name}</p>
              )}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[data.status] ?? STATUS_COLORS.estimating}`}
            >
              {data.status_label}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-6">
        {/* Progress */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            {COPY.PORTAL_PROGRESS}
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Completion</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {data.progress_pct}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${data.progress_pct}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-500">Started</span>
            <span className="text-slate-700">{formatDate(data.created_at)}</span>
          </div>
          {data.closed_at && (
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-slate-500">Completed</span>
              <span className="text-slate-700">{formatDate(data.closed_at)}</span>
            </div>
          )}
        </div>

        {/* Contract */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Contract Summary
          </h2>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-slate-500">Original Contract</dt>
              <dd className="text-sm font-semibold text-slate-900 tabular-nums">
                {formatCAD(data.contract_value - totalCOAmount)}
              </dd>
            </div>
            {totalCOAmount !== 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-500">Change Orders</dt>
                <dd className="text-sm font-semibold text-slate-900 tabular-nums">
                  {totalCOAmount >= 0 ? "+" : ""}
                  {formatCAD(totalCOAmount)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-3">
              <dt className="text-sm font-semibold text-slate-700">
                Total Contract
              </dt>
              <dd className="text-base font-bold text-slate-900 tabular-nums">
                {formatCAD(data.contract_value)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Change Orders */}
        {data.change_orders.length > 0 && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              {COPY.PORTAL_CHANGE_ORDERS}
            </h2>
            <div className="space-y-3">
              {data.change_orders.map((co, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {co.number ? `CO-${String(co.number).padStart(3, "0")}` : ""}{" "}
                      {co.title}
                    </p>
                    {co.signed_at && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Approved{co.signed_by_name ? ` by ${co.signed_by_name}` : ""} ·{" "}
                        {formatDate(co.signed_at)}
                      </p>
                    )}
                    {co.status === "pending" && (
                      <p className="text-xs text-amber-600 font-medium mt-0.5">
                        Pending approval
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">
                    {co.amount >= 0 ? "+" : ""}
                    {formatCAD(co.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 py-6 text-center">
        <p className="text-xs text-slate-400">
          {COPY.PORTAL_POWERED_BY}
        </p>
      </footer>
    </div>
  );
}
