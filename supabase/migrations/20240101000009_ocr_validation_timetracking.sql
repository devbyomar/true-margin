-- ============================================================
-- TrueMargin — OCR, Validation, Time Tracking, Benchmarking,
--              Customer Portal
-- ============================================================

-- ============================================================
-- 1. Add validation_status to cost_entries
--    'validated' for manual, 'pending' for sms/import
-- ============================================================
alter table cost_entries
  add column if not exists validation_status text default 'validated';

-- Set existing SMS entries to 'pending' so they show up for review
-- (Only if they haven't been manually reviewed already)
-- For fresh installs this is a no-op.
update cost_entries
  set validation_status = 'pending'
  where source = 'sms' and validation_status = 'validated';

-- ============================================================
-- 2. Document Scans (OCR invoice uploads)
-- ============================================================
create table if not exists document_scans (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  company_id uuid references companies(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  uploaded_by uuid references users(id),
  file_url text not null,
  file_name text,
  status text default 'processing',      -- processing | completed | failed
  raw_ocr_text text,
  extracted_line_items jsonb default '[]'::jsonb,
  error_message text,
  processed_at timestamptz
);

create index idx_document_scans_job on document_scans(job_id);
create index idx_document_scans_company on document_scans(company_id);

-- ============================================================
-- 3. Time Entries (crew clock-in/clock-out)
-- ============================================================
create table if not exists time_entries (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  job_id uuid references jobs(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  user_id uuid references users(id) not null,
  started_at timestamptz not null,
  stopped_at timestamptz,
  hours numeric(8,2),                     -- computed on stop
  labour_rate numeric(8,2),               -- rate used for cost calculation
  amount numeric(10,2),                   -- hours * labour_rate, set on stop
  cost_entry_id uuid references cost_entries(id), -- linked cost entry created on stop
  source text default 'manual',           -- manual | sms
  notes text
);

create index idx_time_entries_job on time_entries(job_id);
create index idx_time_entries_user on time_entries(user_id);
create index idx_time_entries_active on time_entries(user_id) where stopped_at is null;

-- ============================================================
-- 4. Customer Portal Token on Jobs
-- ============================================================
alter table jobs
  add column if not exists customer_portal_token text unique;

-- Generate a token for existing jobs that don't have one
-- (new jobs will get one via trigger)

-- ============================================================
-- 5. Benchmarks Cache (anonymized aggregate stats)
-- ============================================================
create table if not exists benchmarks_cache (
  id uuid primary key default uuid_generate_v4(),
  updated_at timestamptz default now(),
  job_type text not null,
  province text,
  sample_size int default 0,
  avg_margin_pct numeric(5,2) default 0,
  p25_margin_pct numeric(5,2) default 0,  -- 25th percentile
  median_margin_pct numeric(5,2) default 0,
  p75_margin_pct numeric(5,2) default 0,  -- 75th percentile
  avg_contract_value numeric(10,2) default 0,
  unique (job_type, province)
);

-- ============================================================
-- 6. Storage bucket for invoice scans
-- ============================================================
insert into storage.buckets (id, name, public)
values ('invoice-scans', 'invoice-scans', false)
on conflict (id) do nothing;

-- Storage policies for invoice scans
create policy "users can upload invoice scans"
  on storage.objects for insert
  with check (
    bucket_id = 'invoice-scans'
    and auth.uid() is not null
  );

create policy "users can view invoice scans"
  on storage.objects for select
  using (
    bucket_id = 'invoice-scans'
    and auth.uid() is not null
  );

-- ============================================================
-- 7. RLS Policies for new tables
-- ============================================================

-- Document scans
alter table document_scans enable row level security;
create policy "company members can access their scans"
  on document_scans for all
  using (company_id = public.get_my_company_id());

-- Time entries
alter table time_entries enable row level security;
create policy "company members can access their time entries"
  on time_entries for all
  using (company_id = public.get_my_company_id());

-- Benchmarks cache (read-only for everyone, updated by system)
alter table benchmarks_cache enable row level security;
create policy "anyone can read benchmarks"
  on benchmarks_cache for select
  using (true);

-- ============================================================
-- 8. Trigger: Generate customer portal token on job creation
-- ============================================================
create or replace function fn_generate_portal_token()
returns trigger as $$
declare
  chars text := 'abcdefghjkmnpqrstuvwxyz23456789';
  new_token text;
  token_exists boolean;
  i int;
begin
  if NEW.customer_portal_token is not null then
    return NEW;
  end if;

  loop
    new_token := '';
    for i in 1..24 loop
      new_token := new_token || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;

    select exists(select 1 from jobs where customer_portal_token = new_token) into token_exists;
    exit when not token_exists;
  end loop;

  NEW.customer_portal_token := new_token;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_generate_portal_token
  before insert on jobs
  for each row
  execute function fn_generate_portal_token();

-- Generate tokens for existing jobs
update jobs
  set customer_portal_token = (
    select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789',
      floor(random() * 29 + 1)::int, 1), '')
    from generate_series(1, 24)
  )
  where customer_portal_token is null;

-- ============================================================
-- 9. Update actual_cost trigger to only count validated entries
-- ============================================================
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
    (select sum(amount) from cost_entries
     where job_id = target_job_id
       and validation_status = 'validated'),
    0
  )
  where id = target_job_id;

  if TG_OP = 'UPDATE' and OLD.job_id != NEW.job_id then
    update jobs
    set actual_cost = coalesce(
      (select sum(amount) from cost_entries
       where job_id = OLD.job_id
         and validation_status = 'validated'),
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

-- Enable realtime on new tables
alter publication supabase_realtime add table document_scans;
alter publication supabase_realtime add table time_entries;
