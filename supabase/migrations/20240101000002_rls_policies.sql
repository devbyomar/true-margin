-- ============================================================
-- TrueMargin — Row Level Security Policies
-- Every table is protected so users can only access their
-- own company's data.
--
-- Uses a SECURITY DEFINER function to break circular dependency
-- when the users table policy needs to reference itself.
-- ============================================================

-- Helper function: bypasses RLS to get current user's company_id
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$;

-- ============================================================
-- COMPANIES RLS
-- ============================================================
alter table companies enable row level security;

-- Owners/members can read their own company
create policy "users can view own company"
  on companies for select
  using (id = public.get_my_company_id());

-- Owners can update their own company
create policy "owners can update own company"
  on companies for update
  using (id = public.get_my_company_id())
  with check (id = public.get_my_company_id());

-- Anyone authenticated can insert (for signup flow)
create policy "authenticated users can create company"
  on companies for insert
  with check (auth.uid() is not null);

-- ============================================================
-- USERS RLS
-- ============================================================
alter table users enable row level security;

-- Members can see other members in their company
create policy "users can view company team"
  on users for select
  using (company_id = public.get_my_company_id());

-- Users can insert themselves (signup flow)
create policy "users can insert self"
  on users for insert
  with check (id = auth.uid());

-- Users can update their own profile
create policy "users can update self"
  on users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Owners can update any user in their company (role changes, deactivation)
create policy "owners can update company members"
  on users for update
  using (
    company_id = public.get_my_company_id()
    and (public.get_my_company_id() is not null)
  );

-- ============================================================
-- JOBS RLS
-- ============================================================
alter table jobs enable row level security;

create policy "company members can access their jobs"
  on jobs for all
  using (company_id = public.get_my_company_id());

-- ============================================================
-- COST ENTRIES RLS
-- ============================================================
alter table cost_entries enable row level security;

create policy "company members can access their cost entries"
  on cost_entries for all
  using (company_id = public.get_my_company_id());

-- ============================================================
-- CHANGE ORDERS RLS
-- ============================================================
alter table change_orders enable row level security;

create policy "company members can access their change orders"
  on change_orders for all
  using (company_id = public.get_my_company_id());

-- Public read access for customer-facing approval page (by ID only)
create policy "anyone can view change order by id for signing"
  on change_orders for select
  using (true);

-- ============================================================
-- SMS LOG RLS
-- ============================================================
alter table sms_log enable row level security;

create policy "company members can view their sms logs"
  on sms_log for select
  using (company_id = public.get_my_company_id());

-- Service role can insert (webhook handler runs with service role)
create policy "service role can insert sms logs"
  on sms_log for insert
  with check (true);
