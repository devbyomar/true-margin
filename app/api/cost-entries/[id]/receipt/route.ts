import { NextResponse, type NextRequest } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BUCKET_NAME = "invoice-scans";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/cost-entries/[id]/receipt
 * Upload a receipt/document for a specific cost entry.
 * Body: multipart/form-data with "file" field.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createAuthClient();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "No company found" }, { status: 400 });
  }

  // Verify cost entry belongs to this company
  const { data: entry } = await supabase
    .from("cost_entries")
    .select("id, job_id")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (!entry) {
    return NextResponse.json(
      { error: "Cost entry not found" },
      { status: 404 }
    );
  }

  // Parse multipart form
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  // Validate type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPG, PNG, WebP, or PDF." },
      { status: 400 }
    );
  }

  // Validate size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Maximum 10MB." },
      { status: 400 }
    );
  }

  // Ensure bucket exists
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.id === BUCKET_NAME);
  if (!bucketExists) {
    await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: allowedTypes,
    });
  }

  // Upload to storage
  const fileExt = file.name.split(".").pop() ?? "jpg";
  const filePath = `${profile.company_id}/receipts/${entry.job_id}/${id}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: true, // overwrite if re-uploading
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Generate a signed URL (valid for 1 year — long-lived for receipts)
  const { data: signedData } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 60 * 60 * 24 * 365);

  const receiptUrl = signedData?.signedUrl ?? "";
  if (!receiptUrl) {
    return NextResponse.json(
      { error: "Failed to generate receipt URL" },
      { status: 500 }
    );
  }

  // Update the cost entry with the receipt URL
  const { error: updateError } = await supabase
    .from("cost_entries")
    .update({ receipt_url: receiptUrl })
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: { receipt_url: receiptUrl },
  });
}

/**
 * DELETE /api/cost-entries/[id]/receipt
 * Remove a receipt from a cost entry.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createAuthClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "No company found" }, { status: 400 });
  }

  const { error } = await supabase
    .from("cost_entries")
    .update({ receipt_url: null })
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
