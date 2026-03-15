// ============================================================
// TrueMargin — Shared TypeScript Types
// ============================================================

// ---- Database Row Types ----

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
export type Plan = "starter" | "growth" | "scale";
export type UserRole = "owner" | "pm" | "crew_lead";
export type JobStatus = "estimating" | "active" | "on_hold" | "closed";
export type JobType =
  | "hvac_install"
  | "hvac_service"
  | "plumbing"
  | "electrical"
  | "roofing"
  | "other";
export type CostCategory =
  | "labour"
  | "materials"
  | "subcontractor"
  | "equipment"
  | "other";
export type CostSource = "manual" | "sms" | "import";
export type CostValidationStatus = "pending" | "validated" | "rejected";
export type ChangeOrderStatus = "pending" | "approved" | "rejected";
export type MarginStatus = "on_track" | "at_risk" | "over_budget";
export type DocumentScanStatus = "processing" | "completed" | "failed";
export type TimeEntrySource = "manual" | "sms";

export type Province =
  | "AB"
  | "BC"
  | "MB"
  | "NB"
  | "NL"
  | "NS"
  | "NT"
  | "NU"
  | "ON"
  | "PE"
  | "QC"
  | "SK"
  | "YT";

// ---- Company ----

export interface Company {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  address: string | null;
  province: Province | null;
  tax_number: string | null;
  overhead_rate: number;
  labour_rate: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  plan: Plan;
}

// ---- User ----

export interface User {
  id: string;
  created_at: string;
  company_id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
}

// ---- Job ----

export interface Job {
  id: string;
  created_at: string;
  company_id: string;
  created_by: string | null;
  name: string;
  customer_name: string | null;
  customer_address: string | null;
  job_type: JobType | null;
  status: JobStatus;
  sms_code: string | null;
  estimated_labour_hours: number;
  estimated_labour_rate: number | null;
  estimated_materials: number;
  estimated_subcontractor: number;
  estimated_overhead_rate: number | null;
  estimated_cost: number;
  contract_value: number;
  actual_cost: number;
  notes: string | null;
  closed_at: string | null;
  customer_portal_token: string | null;
}

// ---- Cost Entry ----

export interface CostEntry {
  id: string;
  created_at: string;
  job_id: string;
  company_id: string;
  logged_by: string | null;
  source: CostSource;
  category: CostCategory;
  description: string | null;
  amount: number;
  receipt_url: string | null;
  sms_raw: string | null;
  validation_status: CostValidationStatus;
}

// ---- Change Order ----

export interface ChangeOrder {
  id: string;
  created_at: string;
  job_id: string;
  company_id: string;
  created_by: string | null;
  number: number | null;
  title: string;
  description: string | null;
  amount: number;
  status: ChangeOrderStatus;
  photo_url: string | null;
  signature_url: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
}

// ---- SMS Log ----

export interface SmsLog {
  id: string;
  created_at: string;
  from_phone: string;
  body: string;
  company_id: string | null;
  job_id: string | null;
  cost_entry_id: string | null;
  parsed_successfully: boolean;
  parse_error: string | null;
}

// ---- Invite ----

export type InviteStatus = "pending" | "accepted" | "expired";

export interface Invite {
  id: string;
  created_at: string;
  company_id: string;
  invited_by: string;
  email: string;
  role: UserRole;
  token: string;
  status: InviteStatus;
  accepted_at: string | null;
  accepted_by: string | null;
  expires_at: string;
}

// ---- Margin Calculator ----

export interface JobMarginInput {
  contractValue: number;
  estimatedLabourHours: number;
  labourRate: number;
  estimatedMaterials: number;
  estimatedSubcontractor: number;
  overheadRate: number;
  actualCost: number;
}

export interface MarginResult {
  estimatedCost: number;
  estimatedGrossProfit: number;
  estimatedMarginPct: number;
  actualCost: number;
  actualGrossProfit: number;
  actualMarginPct: number;
  varianceDollar: number;
  variancePct: number;
  status: MarginStatus;
}

// ---- SMS Parser ----

export interface ParsedCostEntry {
  category: CostCategory;
  amount: number;
  description: string;
  confidence: "high" | "low";
}

// ---- Tax ----

export interface TaxBreakdown {
  subtotal: number;
  tax: number;
  total: number;
}

// ---- API Responses ----

export interface ApiErrorResponse {
  error: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

// ---- Document Scan (OCR) ----

export interface DocumentScanLineItem {
  category: CostCategory;
  description: string;
  amount: number;
  confidence: "high" | "low";
}

export interface DocumentScan {
  id: string;
  created_at: string;
  company_id: string;
  job_id: string;
  uploaded_by: string | null;
  file_url: string;
  file_name: string | null;
  status: DocumentScanStatus;
  raw_ocr_text: string | null;
  extracted_line_items: DocumentScanLineItem[];
  error_message: string | null;
  processed_at: string | null;
}

// ---- Time Entry (Crew Time Tracking) ----

export interface TimeEntry {
  id: string;
  created_at: string;
  job_id: string;
  company_id: string;
  user_id: string;
  started_at: string;
  stopped_at: string | null;
  hours: number | null;
  labour_rate: number | null;
  amount: number | null;
  cost_entry_id: string | null;
  source: TimeEntrySource;
  notes: string | null;
}

// ---- Benchmark Data ----

export interface BenchmarkData {
  id: string;
  updated_at: string;
  job_type: string;
  province: string | null;
  sample_size: number;
  avg_margin_pct: number;
  p25_margin_pct: number;
  median_margin_pct: number;
  p75_margin_pct: number;
  avg_contract_value: number;
}

// ---- SMS Time Tracking Commands ----

export interface ParsedTimeCommand {
  command: "start" | "stop";
  jobCode: string | null;
  notes: string | null;
}

// ---- Customer Portal ----

export interface PortalJobView {
  name: string;
  customer_name: string | null;
  status: JobStatus;
  contract_value: number;
  actual_cost: number;
  change_orders: Array<{
    number: number | null;
    title: string;
    amount: number;
    status: ChangeOrderStatus;
    signed_at: string | null;
  }>;
  progress_pct: number;
}
