-- ============================================================
-- TrueMargin — COMBINED MIGRATION (paste into Supabase SQL Editor)
-- Run this ONCE to set up the entire database schema
-- ============================================================

-- ============================================================
-- PART 1: CREATE TABLES
-- ============================================================

create extension if not exists "uuid-ossp";

-- 1. COMPANIES
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

-- 2. USERS
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  company_id uuid references companies(id) on delete cascade,
  full_name text,
  phone text,
  role text default 'owner',
  is_active boolean default true
);

-- 3. JOBS
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

-- 4. COST ENTRIES
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

-- 5. CHANGE ORDERS
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

-- 6. SMS LOG
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

-- 7. INDEXES
create index idx_users_company on users(company_id);
create index idx_users_phone on users(phone);
create index idx_jobs_company on jobs(company_id);
create index idx_jobs_status on jobs(company_id, status);
create index idx_jobs_sms_code on jobs(sms_code);
create index idx_cost_entries_job on cost_entries(job_id);
create index idx_cost_entries_company on cost_entries(company_id);
create index idx_change_orders_job on change_orders(job_id);
create index idx_sms_log_phone on sms_log(from_phone);


-- ============================================================
-- PART 2: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- COMPANIES RLS
alter table companies enable row level security;

create policy "users can view own company"
  on companies for select
  using (id = (select company_id from users where id = auth.uid()));

create policy "owners can update own company"
  on companies for update
  using (id = (select company_id from users where id = auth.uid()))
  with check (id = (select company_id from users where id = auth.uid()));

create policy "authenticated users can create company"
  on companies for insert
  with check (auth.uid() is not null);

-- USERS RLS
alter table users enable row level security;

create policy "company members can view team"
  on users for select
  using (company_id = (select company_id from users where id = auth.uid()));

create policy "users can insert self"
  on users for insert
  with check (id = auth.uid());

create policy "users can update self"
  on users for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "owners can update company members"
  on users for update
  using (
    company_id = (select company_id from users where id = auth.uid())
    and (select role from users where id = auth.uid()) = 'owner'
  );

-- JOBS RLS
alter table jobs enable row level security;

create policy "company members can access their jobs"
  on jobs for all
  using (company_id = (select company_id from users where id = auth.uid()));

-- COST ENTRIES RLS
alter table cost_entries enable row level security;

create policy "company members can access their cost entries"
  on cost_entries for all
  using (company_id = (select company_id from users where id = auth.uid()));

-- CHANGE ORDERS RLS
alter table change_orders enable row level security;

create policy "company members can access their change orders"
  on change_orders for all
  using (company_id = (select company_id from users where id = auth.uid()));

create policy "anyone can view change order by id for signing"
  on change_orders for select
  using (true);

-- SMS LOG RLS
alter table sms_log enable row level security;

create policy "company members can view their sms logs"
  on sms_log for select
  using (company_id = (select company_id from users where id = auth.uid()));

create policy "service role can insert sms logs"
  on sms_log for insert
  with check (true);


-- ============================================================
-- PART 3: TRIGGERS & FUNCTIONS
-- ============================================================

-- 1. Auto-update jobs.actual_cost from cost_entries
create or replace function fn_update_job_actual_cost()
returns trigger as $$
declare
  target_job_id uuid;
begin
  if TG_OP = 'DELETE' then
    target_job_id := OLD.job_id;
  else
    target_job_id := NEW.job_id;
  end if;

  update jobs
  set actual_cost = coalesce(
    (select sum(amount) from cost_entries where job_id = target_job_id),
    0
  )
  where id = target_job_id;

  if TG_OP = 'UPDATE' and OLD.job_id != NEW.job_id then
    update jobs
    set actual_cost = coalesce(
      (select sum(amount) from cost_entries where job_id = OLD.job_id),
      0
    )
    where id = OLD.job_id;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_update_job_actual_cost
  after insert or update or delete on cost_entries
  for each row
  execute function fn_update_job_actual_cost();

-- 2. Auto-generate unique sms_code on job creation
create or replace function fn_generate_sms_code()
returns trigger as $$
declare
  new_code text;
  code_exists boolean;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if NEW.sms_code is not null then
    return NEW;
  end if;

  loop
    new_code := 'JOB-';
    for i in 1..4 loop
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;

    select exists(select 1 from jobs where sms_code = new_code) into code_exists;
    exit when not code_exists;
  end loop;

  NEW.sms_code := new_code;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_generate_sms_code
  before insert on jobs
  for each row
  execute function fn_generate_sms_code();

-- 3. Auto-increment change_order.number per job
create or replace function fn_auto_increment_change_order_number()
returns trigger as $$
begin
  if NEW.number is null then
    select coalesce(max(number), 0) + 1
    into NEW.number
    from change_orders
    where job_id = NEW.job_id;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_auto_increment_co_number
  before insert on change_orders
  for each row
  execute function fn_auto_increment_change_order_number();

-- 4. Auto-update contract_value when change order approved
create or replace function fn_update_contract_on_co_approval()
returns trigger as $$
begin
  if NEW.status = 'approved' and (OLD.status is null or OLD.status != 'approved') then
    update jobs
    set contract_value = contract_value + NEW.amount
    where id = NEW.job_id;
  end if;

  if OLD.status = 'approved' and NEW.status != 'approved' then
    update jobs
    set contract_value = contract_value - OLD.amount
    where id = OLD.job_id;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_update_contract_on_co_approval
  after update on change_orders
  for each row
  execute function fn_update_contract_on_co_approval();


-- ============================================================
-- PART 4: STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('receipts', 'receipts', false),
  ('change-order-photos', 'change-order-photos', false),
  ('change-order-pdfs', 'change-order-pdfs', false),
  ('signatures', 'signatures', false);

-- Storage policies
create policy "company members can upload receipts"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.uid() is not null);

create policy "company members can view receipts"
  on storage.objects for select
  using (bucket_id = 'receipts' and auth.uid() is not null);

create policy "company members can upload co photos"
  on storage.objects for insert
  with check (bucket_id = 'change-order-photos' and auth.uid() is not null);

create policy "company members can view co photos"
  on storage.objects for select
  using (bucket_id = 'change-order-photos' and auth.uid() is not null);

create policy "company members can upload co pdfs"
  on storage.objects for insert
  with check (bucket_id = 'change-order-pdfs' and auth.uid() is not null);

create policy "anyone can view co pdfs"
  on storage.objects for select
  using (bucket_id = 'change-order-pdfs');

create policy "anyone can upload signatures"
  on storage.objects for insert
  with check (bucket_id = 'signatures');

create policy "anyone can view signatures"
  on storage.objects for select
  using (bucket_id = 'signatures');


-- ============================================================
-- PART 5: ENABLE REALTIME
-- ============================================================

alter publication supabase_realtime add table cost_entries;
alter publication supabase_realtime add table change_orders;
alter publication supabase_realtime add table jobs;
