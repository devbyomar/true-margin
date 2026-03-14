## 1. PROJECT IDENTITY

**Product name:** TrueMargin  
**Tagline:** Know your margin before the job ends.  
**What it is:** A focused SaaS tool for Canadian specialty trade contractors (HVAC, plumbing, electrical, roofing) to track real-time job profitability — from estimate to close.  
**What it is NOT:** A scheduling tool, a CRM, a dispatch tool, or a full accounting platform. Stay laser-focused on job costing and margin visibility. Resist feature creep in every decision.

**Primary user persona:**
- Name: Mike, 38, owner-operator of a 6-person HVAC company in Mississauga, ON
- Revenue: $1.8M/year
- Tech savvy: Uses QuickBooks and his iPhone. Nothing else.
- Core frustration: Completes 12 jobs/month and doesn't know which ones made money until his bookkeeper reconciles in 45 days.
- Willingness to pay: $149–$349 CAD/month if the product demonstrably saves him money.

---

## 2. TECH STACK (NON-NEGOTIABLE)

```
Frontend:     Next.js 14 (App Router)
Language:     TypeScript (strict mode, no `any`)
Styling:      Tailwind CSS v3
UI Components: shadcn/ui (install as needed per component)
Database:     Supabase (PostgreSQL + Row Level Security + Auth)
File Storage: Supabase Storage (change order photos)
SMS:          Twilio Programmable Messaging
PDF:          @react-pdf/renderer
Payments:     Stripe (subscriptions + billing portal)
Email:        Resend (transactional emails)
Deployment:   Vercel
State mgmt:   Zustand (client state) + React Query / SWR (server state)
Forms:        React Hook Form + Zod validation
Testing:      Vitest (unit) + Playwright (e2e, critical paths only)
```

**Do not** introduce any library not on this list without explicit instruction. Each addition must be justified.

---

## 3. FILE & FOLDER STRUCTURE

Generate this exact structure from the start. Do not deviate.

```
truemargin/
├── .github/
│   └── copilot-instructions.md        ← paste this file here too
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                 ← sidebar + topbar shell
│   │   ├── page.tsx                   ← /dashboard home (margin overview)
│   │   ├── jobs/
│   │   │   ├── page.tsx               ← job list
│   │   │   ├── new/page.tsx           ← create job + estimate builder
│   │   │   └── [id]/
│   │   │       ├── page.tsx           ← job detail + live margin
│   │   │       └── change-orders/
│   │   │           └── new/page.tsx   ← change order creator
│   │   ├── settings/
│   │   │   ├── page.tsx               ← company settings
│   │   │   ├── team/page.tsx          ← invite crew leads
│   │   │   └── billing/page.tsx       ← Stripe portal
│   │   └── reports/page.tsx           ← margin summary reports
│   ├── api/
│   │   ├── sms/webhook/route.ts       ← Twilio inbound SMS handler
│   │   ├── stripe/webhook/route.ts    ← Stripe webhook handler
│   │   ├── jobs/route.ts
│   │   ├── jobs/[id]/route.ts
│   │   ├── cost-entries/route.ts
│   │   └── change-orders/[id]/sign/route.ts
│   └── layout.tsx                     ← root layout
├── components/
│   ├── jobs/
│   │   ├── EstimateBuilder.tsx
│   │   ├── MarginGauge.tsx
│   │   ├── CostFeed.tsx
│   │   ├── ChangeOrderForm.tsx
│   │   └── JobCard.tsx
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── MarginSummaryCard.tsx
│   └── ui/                            ← shadcn auto-generated, do not edit
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  ← browser client
│   │   ├── server.ts                  ← server client
│   │   └── middleware.ts
│   ├── stripe.ts
│   ├── twilio.ts
│   ├── sms-parser.ts                  ← NLP cost parsing from SMS
│   ├── margin-calculator.ts           ← pure functions, fully tested
│   └── pdf-generator.tsx              ← change order PDF template
├── types/
│   └── index.ts                       ← all shared TypeScript types
├── hooks/
│   ├── useJob.ts
│   ├── useMargin.ts
│   └── useSubscription.ts
├── supabase/
│   ├── migrations/                    ← all SQL migrations
│   └── seed.sql
├── __tests__/
│   └── margin-calculator.test.ts
└── middleware.ts                       ← auth route protection
```

---

## 4. DATABASE SCHEMA

Create these tables via Supabase migrations in `/supabase/migrations/`. Use `uuid_generate_v4()` for all IDs. Enable RLS on every table.

```sql
-- Companies (one per account/subscription)
create table companies (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  phone text,
  address text,
  province text,                        -- for HST/GST tax rate lookup
  tax_number text,                      -- HST/GST registration number
  overhead_rate numeric(5,2) default 15, -- % overhead applied to all jobs
  labour_rate numeric(8,2) default 85,   -- default $/hr for labour
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'trialing', -- trialing | active | past_due | canceled
  plan text default 'starter'           -- starter | growth | scale
);

-- Users (linked to Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  company_id uuid references companies(id) on delete cascade,
  full_name text,
  phone text,                           -- used for SMS logging
  role text default 'owner',            -- owner | pm | crew_lead
  is_active boolean default true
);

-- Jobs
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  company_id uuid references companies(id) on delete cascade,
  created_by uuid references users(id),
  name text not null,
  customer_name text,
  customer_address text,
  job_type text,                        -- hvac_install | hvac_service | plumbing | electrical | roofing | other
  status text default 'estimating',    -- estimating | active | on_hold | closed
  sms_code text unique,                -- short code for field SMS logging (e.g. JOB-4821)
  -- Estimate fields
  estimated_labour_hours numeric(8,2) default 0,
  estimated_labour_rate numeric(8,2),   -- overrides company default if set
  estimated_materials numeric(10,2) default 0,
  estimated_subcontractor numeric(10,2) default 0,
  estimated_overhead_rate numeric(5,2), -- overrides company default if set
  -- Computed (updated via trigger)
  estimated_cost numeric(10,2) generated always as (
    (estimated_labour_hours * coalesce(estimated_labour_rate, 85)) +
    estimated_materials +
    estimated_subcontractor
  ) stored,
  contract_value numeric(10,2) default 0, -- what customer is paying
  -- Actuals (summed from cost_entries)
  actual_cost numeric(10,2) default 0,    -- updated by trigger on cost_entries
  notes text,
  closed_at timestamptz
);

-- Cost Entries (every dollar spent on a job)
create table cost_entries (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  job_id uuid references jobs(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  logged_by uuid references users(id),
  source text default 'manual',         -- manual | sms | import
  category text not null,               -- labour | materials | subcontractor | equipment | other
  description text,
  amount numeric(10,2) not null,
  receipt_url text,                     -- Supabase Storage URL
  sms_raw text                          -- original SMS text if source=sms
);

-- Change Orders
create table change_orders (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  job_id uuid references jobs(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  created_by uuid references users(id),
  number int,                           -- auto-incremented per job
  title text not null,
  description text,
  amount numeric(10,2) not null,
  status text default 'pending',        -- pending | approved | rejected
  photo_url text,
  signature_url text,
  signed_at timestamptz,
  signed_by_name text
);

-- SMS Log (audit trail for all inbound texts)
create table sms_log (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  from_phone text not null,
  body text not null,
  company_id uuid references companies(id),
  job_id uuid references jobs(id),
  cost_entry_id uuid references cost_entries(id),
  parsed_successfully boolean default false,
  parse_error text
);
```

**RLS Policies (generate these for every table):**
```sql
-- Example pattern — replicate for all tables:
alter table jobs enable row level security;
create policy "company members can access their jobs"
  on jobs for all
  using (company_id = (select company_id from users where id = auth.uid()));
```

**Triggers needed:**
1. After INSERT/UPDATE/DELETE on `cost_entries` → recalculate and UPDATE `jobs.actual_cost`
2. Before INSERT on `jobs` → generate unique `sms_code` (format: `JOB-XXXX`, uppercase, 4 random alphanumeric)
3. Before INSERT on `change_orders` → auto-increment `number` per job

---

## 5. CORE BUSINESS LOGIC

### 5a. Margin Calculator (`/lib/margin-calculator.ts`)

This is the heart of the product. Write this as pure functions with zero side effects. Fully unit test in `__tests__/margin-calculator.test.ts`.

```typescript
export interface JobMarginInput {
  contractValue: number;
  estimatedLabourHours: number;
  labourRate: number;
  estimatedMaterials: number;
  estimatedSubcontractor: number;
  overheadRate: number;        // percentage, e.g. 15 for 15%
  actualCost: number;          // sum of cost_entries.amount
}

export interface MarginResult {
  estimatedCost: number;
  estimatedGrossProfit: number;
  estimatedMarginPct: number;
  actualCost: number;
  actualGrossProfit: number;
  actualMarginPct: number;
  varianceDollar: number;      // actual vs estimated (negative = over budget)
  variancePct: number;
  status: 'on_track' | 'at_risk' | 'over_budget';
  // on_track:   actual margin within 5% of estimated
  // at_risk:    actual margin 5-15% below estimated
  // over_budget: actual margin >15% below estimated
}

export function calculateMargin(input: JobMarginInput): MarginResult { ... }

// Tax helpers (Canadian)
export function getProvincialTaxRate(province: string): number { ... }
// Returns combined HST/GST+PST rate for given province code
// AB: 5%, BC: 12%, ON: 13%, QC: 14.975%, SK: 11%, MB: 12%, NS: 15%, NB: 15%, NL: 15%, PEI: 15%

export function applyTax(amount: number, province: string): { subtotal: number; tax: number; total: number } { ... }
```

### 5b. SMS Parser (`/lib/sms-parser.ts`)

Parses free-text SMS messages from field crew into structured cost entries. Must be deterministic and handle messy real-world input.

```typescript
export interface ParsedCostEntry {
  category: 'labour' | 'materials' | 'subcontractor' | 'equipment' | 'other';
  amount: number;
  description: string;
  confidence: 'high' | 'low';  // low = flag for manual review
}

// Input examples the parser MUST handle:
// "materials 340 copper pipe fittings"           → materials, $340, "copper pipe fittings"
// "mat $127.50 drywall"                          → materials, $127.50, "drywall"
// "labour 4hrs"                                  → labour, (4 * job.labourRate), "4 hours labour"
// "labor 3.5 hours"                              → labour, (3.5 * job.labourRate), "3.5 hours labour"
// "sub 850 electrical rough in"                  → subcontractor, $850, "electrical rough in"
// "equip 200 equipment rental"                   → equipment, $200, "equipment rental"
// "245 misc supplies"                            → other, $245, "misc supplies" (confidence: low)
// "done" or "complete"                           → special command, not a cost entry

export function parseSmsEntry(text: string, jobLabourRate: number): ParsedCostEntry | null { ... }
// Returns null if message is not parseable as a cost entry (e.g. "done", "on my way")
```

### 5c. SMS Webhook (`/app/api/sms/webhook/route.ts`)

```
Flow:
1. Receive POST from Twilio with From (phone), Body (text)
2. Validate Twilio signature (X-Twilio-Signature header)
3. Find user by phone number in users table
4. Extract job code from message (e.g. "JOB-4821 materials 340 copper pipe")
   OR use the user's most recently active job if no code present
5. Parse cost entry using sms-parser
6. Insert into cost_entries (source: 'sms')
7. job.actual_cost auto-updates via trigger
8. Reply via Twilio TwiML:
   - Success: "✓ $340 materials logged on JOB-4821. Job margin: 34% (on track)"
   - Unknown user: "TrueMargin: Your number isn't linked to an account. Ask your PM to add you."
   - Parse error: "Couldn't read that. Try: 'JOB-4821 materials 340 copper pipe'. Reply HELP for examples."
```

---

## 6. KEY UI COMPONENTS

### 6a. MarginGauge (`/components/jobs/MarginGauge.tsx`)

A single-number visual component showing current job margin status. This is the most important UI element in the product — it must be immediately readable.

```
Props:
  estimatedMarginPct: number
  actualMarginPct: number
  status: 'on_track' | 'at_risk' | 'over_budget'

Visual spec:
  - Large percentage number center screen (e.g. "34%")
  - Subtitle: "current margin" 
  - Color: green (#16a34a) for on_track, amber (#d97706) for at_risk, red (#dc2626) for over_budget
  - Small comparison line below: "Estimated: 38% · Variance: -4%"
  - Animate number change with a smooth 600ms count-up transition
  - No pie charts. No bar charts. Just the number + color + variance.
```

### 6b. EstimateBuilder (`/components/jobs/EstimateBuilder.tsx`)

A form that builds the job estimate. Real-time margin preview updates as user types.

```
Fields:
  - Job name (text)
  - Customer name (text)
  - Customer address (text)
  - Job type (select: HVAC Install | HVAC Service | Plumbing | Electrical | Roofing | Other)
  - Contract value (CAD currency input)
  - Labour hours (number) + Labour rate (CAD, pre-filled from company default)
  - Materials estimate (CAD)
  - Subcontractor estimate (CAD)
  - Overhead rate (%, pre-filled from company default)
  - Notes (textarea)

Live preview panel (right side on desktop, below on mobile):
  - Estimated cost breakdown (labour / materials / sub / overhead)
  - Estimated gross profit
  - Estimated margin % (large, colored by threshold)
  - "This margin is [above/below] average for [job type] jobs" — placeholder for future benchmarking
```

### 6c. CostFeed (`/components/jobs/CostFeed.tsx`)

A real-time feed of all cost entries on a job, ordered by most recent first.

```
Each entry shows:
  - Category icon (wrench for labour, box for materials, person for sub, etc.)
  - Description
  - Amount (CAD)
  - Logged by (user name) + timestamp
  - Source badge (SMS | Manual) 
  - Receipt thumbnail if photo attached

Real-time updates via Supabase Realtime (subscribe to cost_entries where job_id = X)

Add manual entry button → inline form (no modal):
  Category | Description | Amount | Upload receipt photo
```

### 6d. Dashboard Home (`/app/(dashboard)/page.tsx`)

```
Layout:
  Row 1 — three stat cards:
    - Active jobs (count)
    - At-risk or over-budget jobs (count, red if > 0)
    - Avg margin this month (%)

  Row 2 — Job list table (active jobs only):
    Columns: Job name | Customer | Status | Estimated margin | Actual margin | Variance | Progress bar
    Rows are color-coded by status (green/amber/red left border)
    Click row → goes to job detail

  No charts on the dashboard. Just numbers and the job table.
  Add "New Job" button top right, always visible.
```

---

## 7. AUTHENTICATION & MULTI-TENANCY

- Use Supabase Auth (email + password to start; Google OAuth as stretch goal)
- On first sign-up: create `companies` row → create `users` row with role='owner'
- Middleware (`/middleware.ts`): protect all `/dashboard/*` routes; redirect to `/login` if no session
- All database queries MUST filter by `company_id` — RLS is the safety net but application code must also be correct
- Invited team members: owner sends invite via email (Resend), recipient clicks link, creates account, gets linked to same `companies` row with role='crew_lead'

---

## 8. SUBSCRIPTION & BILLING

**Plans (CAD pricing):**
```
Starter: $149/mo  → 1-5 users, up to 30 jobs/month
Growth:  $349/mo  → up to 15 users, unlimited jobs, priority support
Scale:   $699/mo  → unlimited users, multi-location (future), API access
```

**Implementation:**
- Create products/prices in Stripe dashboard first; store price IDs in `.env`
- `POST /api/stripe/webhook` handles: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` → update `companies.subscription_status` and `companies.plan`
- Billing portal page → redirect to Stripe Customer Portal (no custom billing UI needed)
- Plan enforcement: middleware checks `companies.plan` and `companies.subscription_status` before allowing access to gated features
- 14-day free trial on signup (set in Stripe, no credit card required)

---

## 9. CHANGE ORDER FLOW

```
1. PM opens job → clicks "New Change Order"
2. Fills: Title, Description, Amount (CAD), optional photo upload
3. System generates PDF (react-pdf) with:
   - Company letterhead (name, logo if set, address, tax number)
   - Job name + customer name
   - Change order number (CO-001, CO-002...)
   - Description + amount + tax breakdown (using province tax rate)
   - Signature line
   - "Approved by:" field
4. System sends customer a link via... (v1: PM copies link manually; v2: email via Resend)
5. Customer opens link → sees PDF preview + "I approve this change order" button + name field
6. On approval: captures name + timestamp + IP → stores as signed_at, signed_by_name
7. PDF regenerated with signature info → stored in Supabase Storage
8. PM notified (in-app toast + optional SMS)
9. Change order amount added to job contract_value automatically
```

---

## 10. CANADIAN-SPECIFIC REQUIREMENTS

These are non-negotiable for the Canadian market. Do not skip.

1. **All prices displayed in CAD** with explicit "CAD" label (not just $)
2. **Tax handling**: every invoice and change order calculates and displays GST/HST/PST separately based on `companies.province`
3. **Date format**: DD/MM/YYYY throughout the UI (not MM/DD/YYYY)
4. **Phone format**: accept and display in (XXX) XXX-XXXX format; normalize to E.164 for Twilio (+1XXXXXXXXXX)
5. **Province field**: use standard 2-letter codes (ON, BC, AB, QC, etc.) — provide a select, not free text
6. **HST number on PDFs**: display `HST/GST Reg. No.` on all change order PDFs if `companies.tax_number` is set

---

## 11. ENVIRONMENT VARIABLES

Generate a `.env.example` with all of these:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=          # the SMS number contractors text

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_STARTER_PRICE_ID=
STRIPE_GROWTH_PRICE_ID=
STRIPE_SCALE_PRICE_ID=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=             # e.g. noreply@truemargin.ca

# App
NEXT_PUBLIC_APP_URL=           # e.g. https://app.truemargin.ca
```

---

## 12. CODE QUALITY RULES

Copilot must follow these rules in every file generated:

1. **TypeScript strict mode.** No `any`. No `@ts-ignore`. If a type is unknown, model it properly.
2. **Zod for all external input.** Every API route validates its request body with a Zod schema before touching the database.
3. **Error boundaries.** Every page component is wrapped in an error boundary. API routes return typed error responses `{ error: string }` with appropriate HTTP status codes.
4. **No client-side database calls.** All Supabase queries happen in Server Components, Route Handlers, or Server Actions. Never import the Supabase server client in a client component.
5. **Loading states everywhere.** Every async operation has a loading skeleton or spinner. Use `shadcn/ui Skeleton` component.
6. **Mobile first.** Every component must work on a 375px screen. Field crew will use this on iPhones in the field.
7. **Accessible.** All interactive elements have `aria-label`. Color is never the only indicator of status (always pair with an icon or text label).
8. **No hardcoded strings for UI copy.** Keep all user-facing strings in a `/lib/copy.ts` constants file so they can be updated easily.

---

## 13. BUILD SEQUENCE

Execute in this exact order. Do not jump ahead.

```
Step 1:  Scaffold Next.js project with TypeScript, Tailwind, shadcn/ui
Step 2:  Configure Supabase project + generate all migrations + seed data
Step 3:  Implement auth (login, signup, middleware, session handling)
Step 4:  Build company onboarding flow (name, province, labour rate, overhead)
Step 5:  Build EstimateBuilder component + job creation flow
Step 6:  Implement margin-calculator.ts with full unit tests
Step 7:  Build job detail page with MarginGauge + CostFeed (manual entry only)
Step 8:  Implement SMS webhook + sms-parser (Twilio integration)
Step 9:  Build change order creator + PDF generator
Step 10: Build customer-facing change order approval page (no auth required)
Step 11: Implement Stripe subscriptions + billing portal
Step 12: Build team invite flow (email + role assignment)
Step 13: Build dashboard home with stat cards + job table
Step 14: Build reports page (margin by month, margin by job type)
Step 15: Polish: loading states, error states, empty states, mobile QA
```

---

## 14. FIRST PROMPT TO RUN

After pasting this document, use this exact prompt to start:

> "You are building TrueMargin, a Canadian SaaS product for trade contractor job costing, fully described in the attached specification. Begin with Step 1: scaffold a new Next.js 14 project with TypeScript strict mode, Tailwind CSS v3, and shadcn/ui. Initialize the project, install all dependencies from the tech stack, and generate the full folder structure defined in Section 3. After scaffolding, show me the complete `package.json` and confirm the folder structure matches exactly. Do not proceed to Step 2 until I confirm."

---

## 15. DEBUGGING GUIDE (for common issues Copilot may encounter)

| Issue | Fix |
|---|---|
| Supabase RLS blocking queries | Ensure `company_id` filter matches auth.uid() → company_id chain. Check RLS policies match. |
| Twilio signature validation failing | Validate against the full URL including protocol. Use `twilio.validateRequest()`. |
| react-pdf fonts not loading | Use `Font.register()` before document render. Use Google Fonts CDN URLs. |
| Stripe webhook 400 errors | Use `stripe.webhooks.constructEvent()` with raw body (not parsed JSON). Add `export const config = { api: { bodyParser: false } }` |
| Next.js App Router cookie issues | Use `createServerClient` from `@supabase/ssr`, not the legacy `@supabase/auth-helpers-nextjs`. |
| Supabase Realtime not updating | Ensure `REALTIME_POSTGRES_CHANGES` is enabled on the table in Supabase dashboard. |

---