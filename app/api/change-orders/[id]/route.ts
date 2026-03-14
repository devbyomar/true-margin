import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Disable caching — change orders can be signed at any time
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/change-orders/[id] — get a single change order (public for signing page)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Use service role client since this is accessed from the public approval page
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op
        },
      },
    }
  );

  const { data: changeOrder, error } = await supabase
    .from("change_orders")
    .select(`
      *,
      jobs:job_id(name, customer_name, customer_address, sms_code),
      companies:company_id(name, address, phone, province, tax_number)
    `)
    .eq("id", id)
    .single();

  if (error || !changeOrder) {
    return NextResponse.json(
      { error: "Change order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: changeOrder });
}
