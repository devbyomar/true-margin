<div align="center">

# TrueMargin

**Know your margin before the job ends.**

A real-time job costing and margin tracking SaaS platform built for Canadian specialty trade contractors — HVAC, plumbing, electrical, and roofing.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#license)

</div>

---

## The Problem

A typical 6-person HVAC company in Ontario completes ~12 jobs per month. The owner doesn't know which jobs made money until the bookkeeper reconciles — often 30-45 days later. By then, money-losing patterns have repeated and margin leaks are invisible.

**TrueMargin fixes this.** Contractors see their real margin on every job, in real time, as costs come in from the field — via manual entry, SMS from crew, or OCR invoice scanning.

---

## Features

### 📊 Real-Time Margin Tracking
- Live margin gauge on every job — colour-coded green / amber / red
- Estimated vs. actual cost comparison with variance tracking
- Status classification: **On Track** · **At Risk** · **Over Budget**

### 🧮 Estimate Builder
- Build job estimates with labour hours, materials, subcontractor costs, and overhead
- Live margin preview updates as you type
- Company-wide default rates (labour $/hr, overhead %) pre-filled

### 📱 SMS Cost Logging
- Field crew text costs to a Twilio number: `JOB-4821 materials 340 copper pipe`
- Natural language parser handles messy input (abbreviations, typos, varied formats)
- Instant confirmation reply with updated job margin

### 📸 OCR Invoice Scanning
- Upload invoice photos or PDFs — GPT-4o Vision extracts line items automatically
- Parsed costs flagged for review before applying to jobs
- Supports JPG, PNG, WebP, and PDF (via OpenAI Files API)

### 📋 Change Orders
- Create, track, and get customer approval on change orders
- Auto-generated PDF with company letterhead, tax breakdown, and signature line
- Customer-facing approval portal (no login required)

### ✅ Cost Validation Workflow
- All scanned/SMS entries land as "pending" for PM review
- Approve or reject individually, or batch-approve all
- Full audit trail with source tracking (Manual · SMS · Import)

### ⏱️ Crew Time Tracking
- Manual time entry per job, per crew member
- SMS-based clock in/out: `JOB-4821 clock in` / `clock out`

### 🧾 Receipt & Document Uploads
- Attach receipts (JPG, PNG, WebP, PDF) to any cost entry as proof of payment
- Inline editing of cost entries — category, description, amount

### 📈 Reporting & Benchmarking
- Margin summary by month and by job type
- Job performance benchmarks (average margin by trade)
- Dashboard with active jobs, at-risk count, and monthly average margin

### 🏢 Multi-Tenancy & Teams
- Company-scoped data with Supabase Row Level Security
- Invite crew leads and PMs via email
- Role-based access: Owner · PM · Crew Lead

### 💳 Subscription Billing
- Three plans: **Starter** ($149/mo) · **Growth** ($349/mo) · **Scale** ($699/mo)
- 14-day free trial, no credit card required
- Stripe-powered billing portal for self-service plan management

### 🇨🇦 Canadian-First
- All prices in CAD with explicit currency labels
- Provincial tax handling (HST/GST/PST by province)
- HST/GST registration number on all generated PDFs
- DD/MM/YYYY date format · (XXX) XXX-XXXX phone format

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (strict mode, no `any`) |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security + Auth) |
| **File Storage** | Supabase Storage (invoices, receipts, change order photos) |
| **SMS** | [Twilio](https://www.twilio.com/) Programmable Messaging |
| **PDF Generation** | [@react-pdf/renderer](https://react-pdf.org/) |
| **Payments** | [Stripe](https://stripe.com/) (subscriptions + billing portal) |
| **Email** | [Resend](https://resend.com/) (transactional emails) |
| **OCR** | [OpenAI](https://openai.com/) GPT-4o Vision + Files API |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) (client) + [React Query](https://tanstack.com/query) (server) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation |
| **Testing** | [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (e2e) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## Project Structure

```
truemargin/
├── app/
│   ├── (auth)/                  # Login & signup pages
│   ├── api/                     # API route handlers
│   │   ├── benchmarks/          #   Industry benchmark data
│   │   ├── change-orders/       #   Change order CRUD + approval
│   │   ├── cost-entries/        #   Cost entry CRUD + validation + receipts
│   │   ├── jobs/                #   Job CRUD
│   │   ├── ocr/                 #   Invoice OCR scanning
│   │   ├── portal/              #   Customer portal API
│   │   ├── reports/             #   Margin reports
│   │   ├── sms/                 #   Twilio SMS webhook
│   │   ├── stripe/              #   Stripe webhook handler
│   │   ├── team/                #   Team invite management
│   │   └── time-entries/        #   Crew time tracking
│   ├── approve/                 # Change order approval (public)
│   ├── dashboard/               # Main app — jobs, reports, settings
│   ├── invite/                  # Team invite acceptance
│   └── portal/                  # Customer-facing job portal
├── components/
│   ├── auth/                    # Auth forms
│   ├── billing/                 # Subscription & billing UI
│   ├── dashboard/               # Sidebar, TopBar, stat cards
│   ├── jobs/                    # EstimateBuilder, MarginGauge, CostFeed, etc.
│   ├── reports/                 # Margin report charts & tables
│   ├── settings/                # Company settings forms
│   ├── skeletons/               # Loading skeleton components
│   ├── team/                    # Team management UI
│   └── ui/                      # shadcn/ui components (auto-generated)
├── hooks/                       # Custom React hooks
├── lib/
│   ├── copy.ts                  # All user-facing strings (no hardcoded copy)
│   ├── margin-calculator.ts     # Pure margin calculation functions
│   ├── ocr-parser.ts            # GPT-4o Vision invoice parsing
│   ├── pdf-generator.tsx        # Change order PDF template
│   ├── sms-parser.ts            # Natural language SMS cost parser
│   ├── stripe.ts                # Stripe client config
│   ├── supabase/                # Supabase client (browser + server)
│   └── twilio.ts                # Twilio client config
├── supabase/
│   ├── migrations/              # All SQL migrations (9 migration files)
│   └── seed.sql                 # Sample seed data
├── types/                       # Shared TypeScript types
├── __tests__/                   # Unit tests (Vitest)
└── middleware.ts                 # Auth route protection
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- A [Supabase](https://supabase.com/) project
- A [Stripe](https://stripe.com/) account (test mode)
- A [Twilio](https://www.twilio.com/) account with a phone number
- An [OpenAI](https://openai.com/) API key (for OCR features)
- A [Resend](https://resend.com/) API key (for email features)

### 1. Clone & Install

```bash
git clone https://github.com/devbyomar/true-margin.git
cd true-margin
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local` — see `.env.example` for descriptions and format hints for each variable.

### 3. Set Up Database

Run the SQL migrations in order against your Supabase project (via the SQL Editor in the Supabase Dashboard):

```
supabase/migrations/20240101000001_create_tables.sql
supabase/migrations/20240101000002_rls_policies.sql
supabase/migrations/20240101000003_triggers.sql
supabase/migrations/20240101000004_storage.sql
supabase/migrations/20240101000005_enable_realtime.sql
supabase/migrations/20240101000006_fix_rls_recursion.sql
supabase/migrations/20240101000007_invites_table.sql
supabase/migrations/20240101000008_invites_public_read.sql
supabase/migrations/20240101000009_ocr_validation_timetracking.sql
```

Or run the combined file: `supabase/migrations/_combined_all.sql`

### 4. Set Up Stripe

1. Create three products in Stripe (Starter, Growth, Scale) with monthly CAD pricing
2. Copy the `price_*` IDs into your `.env.local`
3. Set up a webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook`

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up to create your first company.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |

---

## Database Schema

The application uses 8 core tables with Row Level Security enabled on all:

| Table | Purpose |
|---|---|
| `companies` | Company accounts — settings, billing, defaults |
| `users` | Team members (linked to Supabase Auth) |
| `jobs` | Job records with estimates and actuals |
| `cost_entries` | Every dollar spent on a job |
| `change_orders` | Scope changes with customer approval flow |
| `sms_log` | Audit trail for all inbound SMS |
| `invites` | Pending team invitations |
| `document_scans` | OCR invoice scan records |
| `time_entries` | Crew time tracking records |
| `benchmarks_cache` | Industry benchmark data cache |

---

## SMS Format

Field crew can text costs to the Twilio number in natural language:

```
JOB-4821 materials 340 copper pipe fittings
JOB-4821 labour 4hrs
JOB-4821 sub 850 electrical rough in
JOB-4821 equip 200 equipment rental
JOB-4821 clock in
JOB-4821 clock out
HELP
```

The system replies with confirmation and the updated job margin.

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions. Summary:

| Variable | Service | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | ✅ |
| `TWILIO_ACCOUNT_SID` | Twilio | For SMS |
| `TWILIO_AUTH_TOKEN` | Twilio | For SMS |
| `TWILIO_PHONE_NUMBER` | Twilio | For SMS |
| `STRIPE_SECRET_KEY` | Stripe | For billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe | For billing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | For billing |
| `STRIPE_STARTER_PRICE_ID` | Stripe | For billing |
| `STRIPE_GROWTH_PRICE_ID` | Stripe | For billing |
| `STRIPE_SCALE_PRICE_ID` | Stripe | For billing |
| `RESEND_API_KEY` | Resend | For email |
| `RESEND_FROM_EMAIL` | Resend | For email |
| `OPENAI_API_KEY` | OpenAI | For OCR |
| `NEXT_PUBLIC_APP_URL` | App | ✅ |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import into [Vercel](https://vercel.com/new)
3. Add all environment variables from `.env.local`
4. Deploy

The app is optimized for Vercel's Edge Network with Next.js App Router.

### Webhook URLs (Production)

After deploying, update your webhook endpoints:

- **Stripe:** `https://your-domain.com/api/stripe/webhook`
- **Twilio:** `https://your-domain.com/api/sms/webhook`

---

## License

Proprietary software. All rights reserved. © 2026 TrueMargin.
