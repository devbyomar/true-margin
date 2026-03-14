-- ============================================================
-- TrueMargin — Enable Realtime
-- Enable Supabase Realtime for tables that need live updates
-- ============================================================

-- Enable realtime for cost entries (CostFeed live updates)
alter publication supabase_realtime add table cost_entries;

-- Enable realtime for change orders (status updates)
alter publication supabase_realtime add table change_orders;

-- Enable realtime for jobs (actual_cost updates from trigger)
alter publication supabase_realtime add table jobs;
