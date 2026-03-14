// ============================================================
// TrueMargin — UI Copy Constants
// All user-facing strings live here for easy updates.
// ============================================================

export const COPY = {
  // Brand
  APP_NAME: "TrueMargin",
  TAGLINE: "Know your margin before the job ends.",

  // Auth
  LOGIN_TITLE: "Sign in to TrueMargin",
  LOGIN_SUBTITLE: "Track your job margins in real time.",
  SIGNUP_TITLE: "Create your TrueMargin account",
  SIGNUP_SUBTITLE: "Start your 14-day free trial — no credit card required.",
  EMAIL_LABEL: "Email address",
  PASSWORD_LABEL: "Password",
  FULL_NAME_LABEL: "Full name",
  LOGIN_BUTTON: "Sign in",
  SIGNUP_BUTTON: "Create account",
  FORGOT_PASSWORD: "Forgot your password?",
  NO_ACCOUNT: "Don't have an account?",
  HAS_ACCOUNT: "Already have an account?",

  // Navigation
  NAV_DASHBOARD: "Dashboard",
  NAV_JOBS: "Jobs",
  NAV_REPORTS: "Reports",
  NAV_SETTINGS: "Settings",
  NAV_TEAM: "Team",
  NAV_BILLING: "Billing",
  NAV_LOGOUT: "Sign out",

  // Dashboard
  DASHBOARD_TITLE: "Dashboard",
  ACTIVE_JOBS: "Active Jobs",
  AT_RISK_JOBS: "At-Risk Jobs",
  AVG_MARGIN: "Avg. Margin This Month",
  NEW_JOB: "New Job",

  // Jobs
  JOBS_TITLE: "Jobs",
  JOB_NAME: "Job name",
  CUSTOMER_NAME: "Customer name",
  CUSTOMER_ADDRESS: "Customer address",
  JOB_TYPE: "Job type",
  CONTRACT_VALUE: "Contract value (CAD)",
  LABOUR_HOURS: "Labour hours",
  LABOUR_RATE: "Labour rate (CAD/hr)",
  MATERIALS_ESTIMATE: "Materials estimate (CAD)",
  SUBCONTRACTOR_ESTIMATE: "Subcontractor estimate (CAD)",
  OVERHEAD_RATE: "Overhead rate (%)",
  NOTES: "Notes",
  CREATE_JOB: "Create Job",
  ESTIMATED_COST: "Estimated Cost",
  ESTIMATED_PROFIT: "Estimated Gross Profit",
  ESTIMATED_MARGIN: "Estimated Margin",
  CURRENT_MARGIN: "current margin",
  ACTUAL_COST: "Actual Cost",
  VARIANCE: "Variance",

  // Status
  STATUS_ON_TRACK: "On Track",
  STATUS_AT_RISK: "At Risk",
  STATUS_OVER_BUDGET: "Over Budget",
  STATUS_ESTIMATING: "Estimating",
  STATUS_ACTIVE: "Active",
  STATUS_ON_HOLD: "On Hold",
  STATUS_CLOSED: "Closed",

  // Job Types
  JOB_TYPE_HVAC_INSTALL: "HVAC Install",
  JOB_TYPE_HVAC_SERVICE: "HVAC Service",
  JOB_TYPE_PLUMBING: "Plumbing",
  JOB_TYPE_ELECTRICAL: "Electrical",
  JOB_TYPE_ROOFING: "Roofing",
  JOB_TYPE_OTHER: "Other",

  // Cost Feed
  COST_FEED_TITLE: "Cost Entries",
  ADD_COST_ENTRY: "Add Entry",
  COST_CATEGORY: "Category",
  COST_DESCRIPTION: "Description",
  COST_AMOUNT: "Amount (CAD)",
  SOURCE_SMS: "SMS",
  SOURCE_MANUAL: "Manual",
  SOURCE_IMPORT: "Import",

  // Change Orders
  CHANGE_ORDER_TITLE: "Change Order",
  NEW_CHANGE_ORDER: "New Change Order",
  CO_TITLE: "Title",
  CO_DESCRIPTION: "Description",
  CO_AMOUNT: "Amount (CAD)",
  CO_PHOTO: "Photo (optional)",
  CO_APPROVE: "I approve this change order",
  CO_SIGNED_BY: "Approved by",

  // Settings
  SETTINGS_TITLE: "Company Settings",
  COMPANY_NAME: "Company name",
  COMPANY_PHONE: "Company phone",
  COMPANY_ADDRESS: "Company address",
  PROVINCE: "Province",
  TAX_NUMBER: "HST/GST registration number",
  DEFAULT_LABOUR_RATE: "Default labour rate (CAD/hr)",
  DEFAULT_OVERHEAD: "Default overhead rate (%)",
  SAVE_SETTINGS: "Save Changes",

  // Team
  TEAM_TITLE: "Team Members",
  TEAM_SUBTITLE: "Manage your team and invite new members.",
  INVITE_MEMBER: "Invite Team Member",
  INVITE_SEND: "Send Invite",
  INVITE_SENDING: "Sending...",
  INVITE_SUCCESS: "Invite sent successfully!",
  INVITE_PENDING: "Pending Invites",
  INVITE_NO_PENDING: "No pending invites.",
  INVITE_SENT_TO: "Invite sent to",
  INVITE_EXPIRES: "Expires",
  INVITE_RESEND: "Resend",
  INVITE_REVOKE: "Revoke",
  INVITE_ACCEPT_TITLE: "You've been invited to join",
  INVITE_ACCEPT_SUBTITLE: "Create an account or sign in to accept this invite.",
  INVITE_ACCEPT_BUTTON: "Accept Invite",
  INVITE_ACCEPTING: "Accepting...",
  INVITE_ACCEPTED: "You're in! Redirecting to dashboard...",
  INVITE_EXPIRED: "This invite has expired.",
  INVITE_INVALID: "This invite is invalid or has been revoked.",
  INVITE_EMAIL_MISMATCH: "Please sign in with the email this invite was sent to.",
  ROLE_OWNER: "Owner",
  ROLE_PM: "Project Manager",
  ROLE_CREW_LEAD: "Crew Lead",
  MEMBER_ACTIVE: "Active",
  MEMBER_INACTIVE: "Inactive",
  MEMBER_DEACTIVATE: "Deactivate",
  MEMBER_REACTIVATE: "Reactivate",
  MEMBER_CHANGE_ROLE: "Change Role",
  MEMBER_NO_MEMBERS: "No team members yet. Send an invite to get started.",
  MEMBER_ONLY_OWNER: "Only the account owner can manage team members.",

  // Billing
  BILLING_TITLE: "Billing & Subscription",
  MANAGE_SUBSCRIPTION: "Manage Subscription",
  CURRENT_PLAN: "Current Plan",
  PLAN_STARTER: "Starter",
  PLAN_GROWTH: "Growth",
  PLAN_SCALE: "Scale",
  BILLING_SUBTITLE: "Manage your TrueMargin subscription and billing details.",
  PLAN_MONTHLY: "/month CAD",
  PLAN_TRIAL_BADGE: "14-day free trial",
  PLAN_CURRENT_BADGE: "Current plan",
  PLAN_POPULAR_BADGE: "Most popular",
  PLAN_SELECT: "Get started",
  PLAN_UPGRADE: "Upgrade",
  PLAN_DOWNGRADE: "Downgrade",
  PLAN_MANAGE: "Manage Billing",
  SUBSCRIPTION_ACTIVE: "Active",
  SUBSCRIPTION_TRIALING: "Trial",
  SUBSCRIPTION_PAST_DUE: "Past Due",
  SUBSCRIPTION_CANCELED: "Canceled",
  BILLING_PORTAL_DESC: "Update your payment method, download invoices, or cancel your subscription.",
  BILLING_NO_SUBSCRIPTION: "You don't have an active subscription. Choose a plan below to get started.",
  BILLING_PAST_DUE_WARNING: "Your payment is past due. Please update your payment method to avoid service interruption.",
  BILLING_CANCELED_WARNING: "Your subscription has been canceled. Choose a plan below to resubscribe.",

  // Reports
  REPORTS_TITLE: "Reports",
  REPORTS_SUBTITLE: "Margin performance across your jobs.",
  REPORTS_MARGIN_BY_MONTH: "Margin by Month",
  REPORTS_MARGIN_BY_TYPE: "Margin by Job Type",
  REPORTS_JOB_SUMMARY: "Job Summary",
  REPORTS_TOTAL_REVENUE: "Total Revenue",
  REPORTS_TOTAL_COST: "Total Cost",
  REPORTS_TOTAL_PROFIT: "Total Profit",
  REPORTS_AVG_MARGIN: "Avg. Margin",
  REPORTS_NO_DATA: "No completed jobs to report on yet. Close a job to see margin data here.",
  REPORTS_PERIOD_THIS_MONTH: "This Month",
  REPORTS_PERIOD_LAST_3: "Last 3 Months",
  REPORTS_PERIOD_LAST_6: "Last 6 Months",
  REPORTS_PERIOD_THIS_YEAR: "This Year",
  REPORTS_PERIOD_ALL_TIME: "All Time",

  // SMS
  SMS_SUCCESS: "✓ ${amount} ${category} logged on ${jobCode}. Job margin: ${margin}% (${status})",
  SMS_UNKNOWN_USER:
    "TrueMargin: Your number isn't linked to an account. Ask your PM to add you.",
  SMS_PARSE_ERROR:
    "Couldn't read that. Try: 'JOB-4821 materials 340 copper pipe'. Reply HELP for examples.",

  // Misc
  LOADING: "Loading...",
  NO_DATA: "No data yet.",
  ERROR_GENERIC: "Something went wrong. Please try again.",
  CURRENCY: "CAD",
  SAVE: "Save",
  CANCEL: "Cancel",
  DELETE: "Delete",
  EDIT: "Edit",
  BACK: "Back",
} as const;

// Province options for select dropdown
export const PROVINCE_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
] as const;

// Job type options for select dropdown
export const JOB_TYPE_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "hvac_install", label: COPY.JOB_TYPE_HVAC_INSTALL },
  { value: "hvac_service", label: COPY.JOB_TYPE_HVAC_SERVICE },
  { value: "plumbing", label: COPY.JOB_TYPE_PLUMBING },
  { value: "electrical", label: COPY.JOB_TYPE_ELECTRICAL },
  { value: "roofing", label: COPY.JOB_TYPE_ROOFING },
  { value: "other", label: COPY.JOB_TYPE_OTHER },
] as const;

// Cost category options for select dropdown
export const COST_CATEGORY_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "labour", label: "Labour" },
  { value: "materials", label: "Materials" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
] as const;
