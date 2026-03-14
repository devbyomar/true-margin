-- ============================================================
-- TrueMargin — Initial Schema Migration
-- Creates all core tables for job costing & margin tracking
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. COMPANIES
-- ============================================================
create table companies (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  phone text,
  address text,
  province text,
  tax_number text,
  overhead_rate numeric(5,2) default 15,
  labour_rate numeric(8,2) default 85,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'trialing',
  plan text default 'starter'
);

-- ============================================================
-- 2. USERS
-- ============================================================
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  company_id uuid references companies(id) on delete cascade,
  full_name text,
  phone text,
  role text default 'owner',
  is_active boolean default true
);

-- ============================================================
-- 3. JOBS
-- ============================================================
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  company_id uuid references companies(id) on delete cascade,
  created_by uuid references users(id),
  name text not null,
  customer_name text,
  customer_address text,
  job_type text,
  status text default 'estimating',
  sms_code text unique,
  estimated_labour_hours numeric(8,2) default 0,
  estimated_labour_rate numeric(8,2),
  estimated_materials numeric(10,2) default 0,
  estimated_subcontractor numeric(10,2) default 0,
  estimated_overhead_rate numeric(5,2),
  estimated_cost numeric(10,2) generated always as (
    (estimated_labour_hours * coalesce(estimated_labour_rate, 85)) +
    estimated_materials +
    estimated_subcontractor
  ) stored,
  contract_value numeric(10,2) default 0,
  actual_cost numeric(10,2) default 0,
  notes text,
  closed_at timestamptz
);

-- ============================================================
-- 4. COST ENTRIES
-- ============================================================
create table cost_entries (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  job_id uuid references jobs(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  logged_by uuid references users(id),
  source text default 'manual',
  category text not null,
  description text,
  amount numeric(10,2) not null,
  receipt_url text,
  sms_raw text
);

-- ============================================================
-- 5. CHANGE ORDERS
-- ============================================================
create table change_orders (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  job_id uuid references jobs(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  created_by uuid references users(id),
  number int,
  title text not null,
  description text,
  amount numeric(10,2) not null,
  status text default 'pending',
  photo_url text,
  signature_url text,
  signed_at timestamptz,
  signed_by_name text
);

-- ============================================================
-- 6. SMS LOG
-- ============================================================
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

-- ============================================================
-- 7. INDEXES for performance
-- ============================================================
create index idx_users_company on users(company_id);
create index idx_users_phone on users(phone);
create index idx_jobs_company on jobs(company_id);
create index idx_jobs_status on jobs(company_id, status);
create index idx_jobs_sms_code on jobs(sms_code);
create index idx_cost_entries_job on cost_entries(job_id);
create index idx_cost_entries_company on cost_entries(company_id);
create index idx_change_orders_job on change_orders(job_id);
create index idx_sms_log_phone on sms_log(from_phone);
