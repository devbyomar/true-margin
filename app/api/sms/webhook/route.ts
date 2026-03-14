import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateRequest } from "twilio";
import { parseSmsEntry, extractJobCode } from "@/lib/sms-parser";
import { calculateMargin } from "@/lib/margin-calculator";
import { normalizePhoneE164 } from "@/lib/twilio";
import { COPY } from "@/lib/copy";
import type { MarginStatus } from "@/types";

// Use service role client — webhook has no user session
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const STATUS_LABELS: Record<MarginStatus, string> = {
  on_track: "on track",
  at_risk: "at risk",
  over_budget: "over budget",
};

/**
 * Generate TwiML response for Twilio to send an SMS reply.
 */
function twimlResponse(message: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Validate Twilio webhook signature.
 * Returns true if valid or if running in dev mode without Twilio credentials.
 */
function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Skip validation in dev if no auth token configured
  if (!authToken) {
    if (process.env.NODE_ENV === "development") return true;
    return false;
  }

  if (!signature) return false;

  return validateRequest(authToken, signature, url, params);
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient();

  // Parse form-encoded body from Twilio
  const formData = await request.formData();
  const fromPhone = (formData.get("From") as string) ?? "";
  const body = (formData.get("Body") as string) ?? "";

  // Build params object for signature validation
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });

  // Validate Twilio signature
  const twilioSignature = request.headers.get("X-Twilio-Signature");
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/webhook`;

  if (!validateTwilioSignature(twilioSignature, webhookUrl, params)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const normalizedPhone = normalizePhoneE164(fromPhone);

  // 1. Find user by phone number
  const { data: user } = await supabase
    .from("users")
    .select("id, company_id, role")
    .eq("phone", normalizedPhone)
    .eq("is_active", true)
    .single();

  if (!user) {
    // Log the unknown SMS
    await supabase.from("sms_log").insert({
      from_phone: normalizedPhone,
      body,
      parsed_successfully: false,
      parse_error: "Unknown phone number",
    });

    return twimlResponse(COPY.SMS_UNKNOWN_USER);
  }

  // 2. Extract job code from message, or find most recent active job
  const jobCode = extractJobCode(body);
  let jobId: string | null = null;
  let jobData: {
    id: string;
    sms_code: string | null;
    company_id: string;
    contract_value: number;
    estimated_labour_hours: number;
    estimated_labour_rate: number | null;
    estimated_materials: number;
    estimated_subcontractor: number;
    estimated_overhead_rate: number | null;
    actual_cost: number;
  } | null = null;

  if (jobCode) {
    // Find job by SMS code
    const { data: job } = await supabase
      .from("jobs")
      .select("id, sms_code, company_id, contract_value, estimated_labour_hours, estimated_labour_rate, estimated_materials, estimated_subcontractor, estimated_overhead_rate, actual_cost")
      .eq("sms_code", jobCode)
      .eq("company_id", user.company_id)
      .single();

    if (job) {
      jobData = job;
      jobId = job.id;
    }
  }

  // Fallback: find user's most recently active job
  if (!jobId) {
    // Check how many active jobs the company has
    const { data: activeJobs } = await supabase
      .from("jobs")
      .select("id, sms_code, name")
      .eq("company_id", user.company_id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (activeJobs && activeJobs.length === 1 && activeJobs[0]) {
      // Only one active job — safe to auto-assign
      const onlyJob = activeJobs[0];
      const { data: fullJob } = await supabase
        .from("jobs")
        .select("id, sms_code, company_id, contract_value, estimated_labour_hours, estimated_labour_rate, estimated_materials, estimated_subcontractor, estimated_overhead_rate, actual_cost")
        .eq("id", onlyJob.id)
        .single();

      if (fullJob) {
        jobData = fullJob;
        jobId = fullJob.id;
      }
    } else if (activeJobs && activeJobs.length > 1) {
      // Multiple active jobs — ask crew to specify
      const jobList = activeJobs
        .slice(0, 5)
        .map((j) => `${j.sms_code ?? "?"}: ${j.name}`)
        .join("\n");

      await supabase.from("sms_log").insert({
        from_phone: normalizedPhone,
        body,
        company_id: user.company_id,
        parsed_successfully: false,
        parse_error: "Multiple active jobs, no code specified",
      });

      return twimlResponse(
        `You have ${activeJobs.length} active jobs. Include a job code:\n${jobList}\n\nExample: ${activeJobs[0]?.sms_code ?? "JOB-XXXX"} materials 340 copper pipe`
      );
    }
  }

  if (!jobId || !jobData) {
    await supabase.from("sms_log").insert({
      from_phone: normalizedPhone,
      body,
      company_id: user.company_id,
      parsed_successfully: false,
      parse_error: "No active job found",
    });

    return twimlResponse(
      "No active job found. Include a job code like: JOB-A1B2 materials 340 copper pipe"
    );
  }

  // 3. Get company labour rate for fallback
  const { data: company } = await supabase
    .from("companies")
    .select("labour_rate, overhead_rate")
    .eq("id", user.company_id)
    .single();

  const labourRate = jobData.estimated_labour_rate ?? company?.labour_rate ?? 85;
  const overheadRate = jobData.estimated_overhead_rate ?? company?.overhead_rate ?? 15;

  // 4. Parse the SMS text
  const parsed = parseSmsEntry(body, labourRate);

  if (!parsed) {
    await supabase.from("sms_log").insert({
      from_phone: normalizedPhone,
      body,
      company_id: user.company_id,
      job_id: jobId,
      parsed_successfully: false,
      parse_error: "Could not parse cost entry",
    });

    return twimlResponse(COPY.SMS_PARSE_ERROR);
  }

  // 5. Insert cost entry
  const { data: costEntry, error: insertError } = await supabase
    .from("cost_entries")
    .insert({
      job_id: jobId,
      company_id: user.company_id,
      logged_by: user.id,
      source: "sms",
      category: parsed.category,
      description: parsed.description,
      amount: parsed.amount,
      sms_raw: body,
    })
    .select("id")
    .single();

  if (insertError || !costEntry) {
    await supabase.from("sms_log").insert({
      from_phone: normalizedPhone,
      body,
      company_id: user.company_id,
      job_id: jobId,
      parsed_successfully: false,
      parse_error: `DB insert failed: ${insertError?.message ?? "unknown"}`,
    });

    return twimlResponse(COPY.ERROR_GENERIC);
  }

  // 6. Recalculate margin for reply
  // Fetch updated actual_cost (trigger should have updated it)
  const { data: updatedJob } = await supabase
    .from("jobs")
    .select("actual_cost")
    .eq("id", jobId)
    .single();

  const currentActualCost = updatedJob?.actual_cost ?? (jobData.actual_cost + parsed.amount);

  const margin = calculateMargin({
    contractValue: jobData.contract_value,
    estimatedLabourHours: jobData.estimated_labour_hours,
    labourRate,
    estimatedMaterials: jobData.estimated_materials,
    estimatedSubcontractor: jobData.estimated_subcontractor,
    overheadRate,
    actualCost: currentActualCost,
  });

  // 7. Log successful SMS
  await supabase.from("sms_log").insert({
    from_phone: normalizedPhone,
    body,
    company_id: user.company_id,
    job_id: jobId,
    cost_entry_id: costEntry.id,
    parsed_successfully: true,
  });

  // 8. Build reply
  const statusLabel = STATUS_LABELS[margin.status] ?? margin.status;
  const smsCode = jobData.sms_code ?? `JOB-${jobId.slice(0, 4).toUpperCase()}`;
  const amountFormatted = `$${parsed.amount.toFixed(2)}`;

  const reply = `✓ ${amountFormatted} ${parsed.category} logged on ${smsCode}. Job margin: ${Math.round(margin.actualMarginPct)}% (${statusLabel})`;

  return twimlResponse(reply);
}
