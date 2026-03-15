import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractLineItemsFromImage, validateImageInput } from "@/lib/ocr-parser";

export const dynamic = "force-dynamic";

/**
 * POST /api/ocr/scan
 * Upload an invoice image and extract line items via OCR.
 * Body: { job_id: string, image_url: string } OR multipart form with file
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's company
  const { data: dbUser } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  let jobId: string;
  let imageUrl: string;
  let fileName: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    // Handle file upload
    const formData = await request.formData();
    jobId = (formData.get("job_id") as string) ?? "";
    const file = formData.get("file") as File | null;

    if (!file || !jobId) {
      return NextResponse.json(
        { error: "job_id and file are required" },
        { status: 400 }
      );
    }

    fileName = file.name;

    // Validate file type
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

    // Upload to Supabase storage
    const fileExt = file.name.split(".").pop() ?? "jpg";
    const filePath = `${dbUser.company_id}/${jobId}/${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("invoice-scans")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("invoice-scans").getPublicUrl(filePath);

    // For private buckets, we need a signed URL
    const { data: signedData } = await supabase.storage
      .from("invoice-scans")
      .createSignedUrl(filePath, 3600); // 1 hour

    imageUrl = signedData?.signedUrl ?? publicUrl;
  } else {
    // JSON body with image_url
    const body = (await request.json()) as {
      job_id?: string;
      image_url?: string;
    };
    jobId = body.job_id ?? "";
    imageUrl = body.image_url ?? "";

    if (!jobId || !imageUrl) {
      return NextResponse.json(
        { error: "job_id and image_url are required" },
        { status: 400 }
      );
    }

    if (!validateImageInput(imageUrl)) {
      return NextResponse.json(
        { error: "Invalid image URL or data URI" },
        { status: 400 }
      );
    }
  }

  // Verify job belongs to user's company
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("company_id", dbUser.company_id)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Create document scan record
  const { data: scan, error: scanError } = await supabase
    .from("document_scans")
    .insert({
      company_id: dbUser.company_id,
      job_id: jobId,
      uploaded_by: user.id,
      file_url: imageUrl,
      file_name: fileName,
      status: "processing",
    })
    .select("id")
    .single();

  if (scanError || !scan) {
    return NextResponse.json(
      { error: "Failed to create scan record" },
      { status: 500 }
    );
  }

  try {
    // Run OCR extraction
    const { lineItems, rawText } = await extractLineItemsFromImage(imageUrl);

    // Update scan record with results
    await supabase
      .from("document_scans")
      .update({
        status: lineItems.length > 0 ? "completed" : "failed",
        raw_ocr_text: rawText,
        extracted_line_items: lineItems,
        error_message: lineItems.length === 0 ? "No line items found" : null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", scan.id);

    return NextResponse.json({
      data: {
        scan_id: scan.id,
        status: lineItems.length > 0 ? "completed" : "failed",
        line_items: lineItems,
        raw_text: rawText,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "OCR processing failed";

    await supabase
      .from("document_scans")
      .update({
        status: "failed",
        error_message: message,
        processed_at: new Date().toISOString(),
      })
      .eq("id", scan.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
