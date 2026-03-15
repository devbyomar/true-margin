import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Service client — portal is public, no user session.
 */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/portal/[token]
 * Public endpoint — returns job progress for customer portal.
 * No authentication required — security via unguessable token.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const supabase = getServiceClient();

  if (!token || token.length < 20) {
    return NextResponse.json(
      { error: "Invalid portal link" },
      { status: 400 }
    );
  }

  // Find job by portal token
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      "id, name, customer_name, status, contract_value, actual_cost, created_at, closed_at, estimated_cost"
    )
    .eq("customer_portal_token", token)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Job not found or invalid link" },
      { status: 404 }
    );
  }

  // Fetch approved change orders
  const { data: changeOrders } = await supabase
    .from("change_orders")
    .select("number, title, amount, status, signed_at, signed_by_name")
    .eq("job_id", job.id)
    .in("status", ["approved", "pending"])
    .order("number", { ascending: true });

  // Calculate progress percentage (actual_cost / estimated_cost)
  const estimatedCost = job.estimated_cost ?? 1;
  const progressPct = Math.min(
    Math.round((job.actual_cost / Math.max(estimatedCost, 1)) * 100),
    100
  );

  // Build status map for display
  const statusMap: Record<string, string> = {
    estimating: "Planning",
    active: "In Progress",
    on_hold: "On Hold",
    closed: "Completed",
  };

  return NextResponse.json({
    data: {
      name: job.name,
      customer_name: job.customer_name,
      status: job.status,
      status_label: statusMap[job.status] ?? job.status,
      contract_value: job.contract_value,
      progress_pct: progressPct,
      created_at: job.created_at,
      closed_at: job.closed_at,
      change_orders: (changeOrders ?? []).map((co) => ({
        number: co.number,
        title: co.title,
        amount: co.amount,
        status: co.status,
        signed_at: co.signed_at,
        signed_by_name: co.signed_by_name,
      })),
      // Intentionally NOT exposing actual_cost or margins to customer
    },
  });
}
