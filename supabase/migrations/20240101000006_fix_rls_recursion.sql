-- ============================================================
-- Fix RLS infinite recursion on users table
-- 
-- Problem: The users SELECT policy referenced users table itself:
--   using (company_id = (select company_id from users where id = auth.uid()))
-- This causes "infinite recursion detected in policy for relation users"
--
-- Solution: Create a SECURITY DEFINER function that bypasses RLS
-- to look up the current user's company_id.
-- ============================================================

-- Step 1: Create a security definer function to safely get company_id
-- SECURITY DEFINER runs as the function owner (postgres), bypassing RLS
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$;

-- Step 2: Fix USERS policies
DROP POLICY IF EXISTS "company members can view team" ON users;
DROP POLICY IF EXISTS "owners can update company members" ON users;

-- Users can see teammates via the security definer function
CREATE POLICY "users can view company team"
  ON users FOR SELECT
  USING (company_id = public.get_my_company_id());

-- Owners can update company members
CREATE POLICY "owners can update company members"
  ON users FOR UPDATE
  USING (
    company_id = public.get_my_company_id()
    AND (public.get_my_company_id() IS NOT NULL)
  );

-- Step 3: Fix COMPANIES policies (also referenced users table)
DROP POLICY IF EXISTS "users can view own company" ON companies;
DROP POLICY IF EXISTS "owners can update own company" ON companies;

CREATE POLICY "users can view own company"
  ON companies FOR SELECT
  USING (id = public.get_my_company_id());

CREATE POLICY "owners can update own company"
  ON companies FOR UPDATE
  USING (id = public.get_my_company_id())
  WITH CHECK (id = public.get_my_company_id());

-- Step 4: Fix JOBS policy
DROP POLICY IF EXISTS "company members can access their jobs" ON jobs;
CREATE POLICY "company members can access their jobs"
  ON jobs FOR ALL
  USING (company_id = public.get_my_company_id());

-- Step 5: Fix COST ENTRIES policy
DROP POLICY IF EXISTS "company members can access their cost entries" ON cost_entries;
CREATE POLICY "company members can access their cost entries"
  ON cost_entries FOR ALL
  USING (company_id = public.get_my_company_id());

-- Step 6: Fix CHANGE ORDERS policy
DROP POLICY IF EXISTS "company members can access their change orders" ON change_orders;
CREATE POLICY "company members can access their change orders"
  ON change_orders FOR ALL
  USING (company_id = public.get_my_company_id());

-- Step 7: Fix SMS LOG policy
DROP POLICY IF EXISTS "company members can view their sms logs" ON sms_log;
CREATE POLICY "company members can view their sms logs"
  ON sms_log FOR SELECT
  USING (company_id = public.get_my_company_id());
