import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateChangeOrderPdf } from "@/lib/pdf-generator";
import type { ChangeOrderPdfData } from "@/lib/pdf-generator";

// Disable caching — PDF should always reflect latest signature status
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/change-orders/[id]/pdf — download change order as PDF (public)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Use service role since this may be accessed without auth (customer viewing)
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

  const { data: co, error } = await supabase
    .from("change_orders")
    .select(`
      *,
      jobs:job_id(name, customer_name, customer_address),
      companies:company_id(name, address, phone, province, tax_number)
    `)
    .eq("id", id)
    .single();

  if (error || !co) {
    return NextResponse.json(
      { error: "Change order not found" },
      { status: 404 }
    );
  }

  const jobs = co.jobs as { name: string; customer_name: string | null; customer_address: string | null } | null;
  const companies = co.companies as { name: string; address: string | null; phone: string | null; province: string | null; tax_number: string | null } | null;

  const pdfData: ChangeOrderPdfData = {
    companyName: companies?.name ?? "Company",
    companyAddress: companies?.address ?? null,
    companyPhone: companies?.phone ?? null,
    taxNumber: companies?.tax_number ?? null,
    province: companies?.province ?? null,
    jobName: jobs?.name ?? "Job",
    customerName: jobs?.customer_name ?? null,
    customerAddress: jobs?.customer_address ?? null,
    changeOrderNumber: co.number ?? 1,
    title: co.title,
    description: co.description,
    amount: co.amount,
    createdAt: co.created_at,
    status: co.status,
    signedByName: co.signed_by_name,
    signedAt: co.signed_at,
  };

  try {
    const pdfBuffer = await generateChangeOrderPdf(pdfData);
    const uint8 = new Uint8Array(pdfBuffer);

    const filename = `CO-${String(pdfData.changeOrderNumber).padStart(3, "0")}-${pdfData.jobName.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
