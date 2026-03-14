-- ============================================================
-- TrueMargin — Seed Data for Development
-- Creates a sample company with jobs, cost entries, and
-- change orders so the dashboard has data on first load.
--
-- NOTE: This seed assumes you have manually created a test
-- user in Supabase Auth with a known UUID. Replace the
-- placeholder UUID below with your test user's auth.uid().
--
-- Alternatively, run this after signing up via the app,
-- then update the user and company records here.
-- ============================================================

-- ============================================================
-- 1. SAMPLE COMPANY
-- ============================================================
insert into companies (id, name, phone, address, province, tax_number, overhead_rate, labour_rate, subscription_status, plan)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Northwind HVAC Ltd.',
  '+14165551234',
  '123 Industrial Pkwy, Mississauga, ON L5T 2R3',
  'ON',
  '123456789RT0001',
  15.00,
  85.00,
  'trialing',
  'starter'
);

-- ============================================================
-- 2. SAMPLE JOBS
-- ============================================================

-- Job 1: Active, on-track HVAC install
insert into jobs (id, company_id, name, customer_name, customer_address, job_type, status, sms_code,
  estimated_labour_hours, estimated_labour_rate, estimated_materials, estimated_subcontractor, estimated_overhead_rate,
  contract_value, actual_cost)
values (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'HVAC Retrofit — 45 King St W',
  'Patel Commercial Properties',
  '45 King St W, Toronto, ON M5H 1A1',
  'hvac_install',
  'active',
  'JOB-A1B2',
  120, 85.00, 8500.00, 3200.00, 15.00,
  28000.00,
  14500.00
);

-- Job 2: Active, at-risk plumbing job
insert into jobs (id, company_id, name, customer_name, customer_address, job_type, status, sms_code,
  estimated_labour_hours, estimated_labour_rate, estimated_materials, estimated_subcontractor, estimated_overhead_rate,
  contract_value, actual_cost)
values (
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Bathroom Rough-In — 12 Elm Ave',
  'Sarah Chen',
  '12 Elm Ave, Mississauga, ON L5B 3Y7',
  'plumbing',
  'active',
  'JOB-C3D4',
  40, 85.00, 2200.00, 0.00, 15.00,
  9500.00,
  6800.00
);

-- Job 3: Active, over-budget electrical
insert into jobs (id, company_id, name, customer_name, customer_address, job_type, status, sms_code,
  estimated_labour_hours, estimated_labour_rate, estimated_materials, estimated_subcontractor, estimated_overhead_rate,
  contract_value, actual_cost)
values (
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Panel Upgrade — 88 Queen St',
  'Marco DeLuca',
  '88 Queen St E, Brampton, ON L6V 1A8',
  'electrical',
  'active',
  'JOB-E5F6',
  24, 90.00, 3500.00, 1800.00, 15.00,
  12000.00,
  10800.00
);

-- Job 4: Estimating phase
insert into jobs (id, company_id, name, customer_name, customer_address, job_type, status, sms_code,
  estimated_labour_hours, estimated_labour_rate, estimated_materials, estimated_subcontractor, estimated_overhead_rate,
  contract_value, actual_cost)
values (
  'b0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'Rooftop Unit Replacement — 200 Front St',
  'GreenSpace Office Corp',
  '200 Front St W, Toronto, ON M5V 3K2',
  'hvac_install',
  'estimating',
  'JOB-G7H8',
  200, 85.00, 22000.00, 5000.00, 15.00,
  65000.00,
  0.00
);

-- Job 5: Closed job
insert into jobs (id, company_id, name, customer_name, customer_address, job_type, status, sms_code,
  estimated_labour_hours, estimated_labour_rate, estimated_materials, estimated_subcontractor, estimated_overhead_rate,
  contract_value, actual_cost, closed_at)
values (
  'b0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'Furnace Install — 99 Maple Dr',
  'James Wright',
  '99 Maple Dr, Oakville, ON L6H 4R2',
  'hvac_install',
  'closed',
  'JOB-J9K0',
  16, 85.00, 4200.00, 0.00, 15.00,
  8500.00,
  5900.00,
  '2024-02-15T18:00:00Z'
);

-- ============================================================
-- 3. SAMPLE COST ENTRIES (for Job 1 — HVAC Retrofit)
-- ============================================================

insert into cost_entries (id, job_id, company_id, source, category, description, amount) values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'manual', 'materials', 'Copper pipe and fittings — Wolseley', 3200.00),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'manual', 'materials', 'Ductwork — Sheet Metal Supply', 2100.00),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'sms', 'labour', '24 hours labour', 2040.00),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'sms', 'labour', '16 hours labour', 1360.00),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'manual', 'subcontractor', 'Electrical hookup — Voltz Electric', 2600.00),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'sms', 'materials', 'Thermostat and controls', 850.00),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'manual', 'equipment', 'Crane rental — half day', 1200.00),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'sms', 'materials', 'Refrigerant R-410A', 1150.00);

-- Cost entries for Job 2 — Bathroom Rough-In
insert into cost_entries (id, job_id, company_id, source, category, description, amount) values
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'manual', 'materials', 'PEX pipe and connectors', 1450.00),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'sms', 'labour', '32 hours labour', 2720.00),
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'sms', 'materials', 'Fixtures — vanity, toilet', 1830.00),
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'manual', 'other', 'Permit fee', 800.00);

-- Cost entries for Job 3 — Panel Upgrade (over budget)
insert into cost_entries (id, job_id, company_id, source, category, description, amount) values
  ('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'manual', 'materials', '200A panel + breakers', 2800.00),
  ('c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'sms', 'labour', '28 hours labour', 2520.00),
  ('c0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'manual', 'subcontractor', 'ESA inspection & certification', 1800.00),
  ('c0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'sms', 'materials', 'Wire and conduit — extra run needed', 2480.00),
  ('c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'manual', 'equipment', 'Generator rental during cutover', 1200.00);

-- Cost entries for Job 5 — Closed job
insert into cost_entries (id, job_id, company_id, source, category, description, amount) values
  ('c0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'manual', 'materials', 'Lennox furnace unit', 3200.00),
  ('c0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'sms', 'labour', '14 hours labour', 1190.00),
  ('c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'manual', 'materials', 'Vent pipe and fittings', 680.00),
  ('c0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'manual', 'other', 'Gas permit', 830.00);

-- ============================================================
-- 4. SAMPLE CHANGE ORDERS
-- ============================================================

-- Approved change order on Job 1
insert into change_orders (id, job_id, company_id, number, title, description, amount, status, signed_by_name, signed_at)
values (
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  1,
  'Additional return air duct',
  'Customer requested additional return air duct to second floor office. Includes duct fabrication, insulation, and 4hrs labour.',
  2200.00,
  'approved',
  'Raj Patel',
  '2024-01-20T14:30:00Z'
);

-- Pending change order on Job 1
insert into change_orders (id, job_id, company_id, number, title, description, amount, status)
values (
  'd0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  2,
  'Upgrade to variable speed blower',
  'Customer wants to upgrade from single-stage to variable speed blower motor for improved efficiency.',
  1800.00,
  'pending'
);

-- Approved change order on Job 3
insert into change_orders (id, job_id, company_id, number, title, description, amount, status, signed_by_name, signed_at)
values (
  'd0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  1,
  'Add subpanel in garage',
  'Customer requested a 60A subpanel in detached garage for EV charger and workshop.',
  3500.00,
  'approved',
  'Marco DeLuca',
  '2024-01-25T10:15:00Z'
);

