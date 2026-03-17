-- ============================================================
-- TrueMargin — Deep Data Model Migration
-- Adds: estimate_line_items, job_phases, vendors, materials_catalog
-- Alters: cost_entries (vendor, qty, unit_price, unit, phase)
-- Expands: job types for all trades
-- ============================================================

-- ============================================================
-- 1. VENDORS (supplier/vendor tracking per company)
-- ============================================================
create table if not exists vendors (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  category text, -- supplier | subcontractor | equipment_rental | other
  notes text,
  is_active boolean default true,
  constraint vendors_unique_name_per_company unique (company_id, name)
);

create index idx_vendors_company on vendors(company_id);
create index idx_vendors_category on vendors(company_id, category);

-- ============================================================
-- 2. JOB PHASES (work breakdown structure per job)
-- ============================================================
create table if not exists job_phases (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  job_id uuid references jobs(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  sort_order int default 0,
  status text default 'pending', -- pending | in_progress | completed
  estimated_cost numeric(10,2) default 0,
  actual_cost numeric(10,2) default 0, -- updated via trigger
  notes text
);

create index idx_job_phases_job on job_phases(job_id);
create index idx_job_phases_company on job_phases(company_id);

-- ============================================================
-- 3. ESTIMATE LINE ITEMS (granular estimates per job)
-- ============================================================
create table if not exists estimate_line_items (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  job_id uuid references jobs(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  phase_id uuid references job_phases(id) on delete set null,
  category text not null, -- labour | materials | subcontractor | equipment | other
  description text not null,
  quantity numeric(10,3) default 1,
  unit text default 'each', -- each | hours | sqft | lnft | m2 | m | sheets | rolls | bags | boxes | tonnes | loads | days
  unit_price numeric(10,2) default 0,
  total numeric(10,2) generated always as (quantity * unit_price) stored,
  vendor_id uuid references vendors(id) on delete set null,
  sort_order int default 0,
  notes text
);

create index idx_estimate_line_items_job on estimate_line_items(job_id);
create index idx_estimate_line_items_phase on estimate_line_items(phase_id);
create index idx_estimate_line_items_category on estimate_line_items(job_id, category);

-- ============================================================
-- 4. MATERIALS CATALOG (reusable materials library per company)
-- ============================================================
create table if not exists materials_catalog (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  category text not null, -- materials | equipment | subcontractor | labour | other
  default_unit text default 'each',
  default_unit_price numeric(10,2),
  vendor_id uuid references vendors(id) on delete set null,
  trade_type text, -- which trade this material is commonly used for
  is_active boolean default true,
  constraint materials_catalog_unique_per_company unique (company_id, name)
);

create index idx_materials_catalog_company on materials_catalog(company_id);
create index idx_materials_catalog_trade on materials_catalog(company_id, trade_type);

-- ============================================================
-- 5. ALTER COST ENTRIES — add structured fields
-- ============================================================
alter table cost_entries
  add column if not exists vendor_id uuid references vendors(id) on delete set null,
  add column if not exists vendor_name text,
  add column if not exists quantity numeric(10,3),
  add column if not exists unit text,
  add column if not exists unit_price numeric(10,2),
  add column if not exists phase_id uuid references job_phases(id) on delete set null;

create index if not exists idx_cost_entries_vendor on cost_entries(vendor_id);
create index if not exists idx_cost_entries_phase on cost_entries(phase_id);

-- ============================================================
-- 6. RLS POLICIES for new tables
-- ============================================================

-- Vendors
alter table vendors enable row level security;

create policy "company members can view their vendors"
  on vendors for select
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can insert vendors"
  on vendors for insert
  with check (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can update their vendors"
  on vendors for update
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can delete their vendors"
  on vendors for delete
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

-- Job Phases
alter table job_phases enable row level security;

create policy "company members can view their job phases"
  on job_phases for select
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can insert job phases"
  on job_phases for insert
  with check (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can update their job phases"
  on job_phases for update
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can delete their job phases"
  on job_phases for delete
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

-- Estimate Line Items
alter table estimate_line_items enable row level security;

create policy "company members can view their estimate line items"
  on estimate_line_items for select
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can insert estimate line items"
  on estimate_line_items for insert
  with check (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can update their estimate line items"
  on estimate_line_items for update
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can delete their estimate line items"
  on estimate_line_items for delete
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

-- Materials Catalog
alter table materials_catalog enable row level security;

create policy "company members can view their materials catalog"
  on materials_catalog for select
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can insert materials catalog items"
  on materials_catalog for insert
  with check (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can update their materials catalog"
  on materials_catalog for update
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

create policy "company members can delete their materials catalog"
  on materials_catalog for delete
  using (company_id in (
    select company_id from users where id = auth.uid()
  ));

-- ============================================================
-- 7. TRIGGER: update job_phases.actual_cost from cost_entries
-- ============================================================
create or replace function update_phase_actual_cost()
returns trigger as $$
begin
  -- Update the old phase (if changing phase or deleting)
  if (TG_OP = 'DELETE' or TG_OP = 'UPDATE') then
    if OLD.phase_id is not null then
      update job_phases
      set actual_cost = coalesce((
        select sum(amount)
        from cost_entries
        where phase_id = OLD.phase_id
          and validation_status != 'rejected'
      ), 0)
      where id = OLD.phase_id;
    end if;
  end if;

  -- Update the new phase (if inserting or changing phase)
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') then
    if NEW.phase_id is not null then
      update job_phases
      set actual_cost = coalesce((
        select sum(amount)
        from cost_entries
        where phase_id = NEW.phase_id
          and validation_status != 'rejected'
      ), 0)
      where id = NEW.phase_id;
    end if;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Drop old trigger if it exists, then create
drop trigger if exists trg_update_phase_actual_cost on cost_entries;
create trigger trg_update_phase_actual_cost
  after insert or update or delete on cost_entries
  for each row
  execute function update_phase_actual_cost();

-- ============================================================
-- 8. ENABLE REALTIME for new tables
-- ============================================================
alter publication supabase_realtime add table estimate_line_items;
alter publication supabase_realtime add table job_phases;
alter publication supabase_realtime add table vendors;
alter publication supabase_realtime add table materials_catalog;
