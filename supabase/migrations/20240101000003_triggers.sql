-- ============================================================
-- TrueMargin — Database Triggers & Functions
-- ============================================================

-- ============================================================
-- 1. AUTO-UPDATE jobs.actual_cost from cost_entries
--    After INSERT/UPDATE/DELETE on cost_entries, recalculate
--    the sum of all cost entry amounts for the job.
-- ============================================================

create or replace function fn_update_job_actual_cost()
returns trigger as $$
declare
  target_job_id uuid;
begin
  -- Determine which job_id to update
  if TG_OP = 'DELETE' then
    target_job_id := OLD.job_id;
  else
    target_job_id := NEW.job_id;
  end if;

  -- Recalculate actual cost from all cost entries
  update jobs
  set actual_cost = coalesce(
    (select sum(amount) from cost_entries where job_id = target_job_id),
    0
  )
  where id = target_job_id;

  -- Also handle case where job_id changed on UPDATE
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


-- ============================================================
-- 2. AUTO-GENERATE unique sms_code on job creation
--    Format: JOB-XXXX (4 random uppercase alphanumeric)
-- ============================================================

create or replace function fn_generate_sms_code()
returns trigger as $$
declare
  new_code text;
  code_exists boolean;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No I,O,0,1 to avoid confusion
  i int;
begin
  -- Only generate if not already set
  if NEW.sms_code is not null then
    return NEW;
  end if;

  loop
    new_code := 'JOB-';
    for i in 1..4 loop
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;

    -- Check uniqueness
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


-- ============================================================
-- 3. AUTO-INCREMENT change_order.number per job
--    Each job's change orders are numbered CO-001, CO-002, etc.
-- ============================================================

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


-- ============================================================
-- 4. AUTO-UPDATE contract_value when change order approved
--    Add the change order amount to the job's contract_value
-- ============================================================

create or replace function fn_update_contract_on_co_approval()
returns trigger as $$
begin
  -- Only trigger when status changes to 'approved'
  if NEW.status = 'approved' and (OLD.status is null or OLD.status != 'approved') then
    update jobs
    set contract_value = contract_value + NEW.amount
    where id = NEW.job_id;
  end if;

  -- If status changes from 'approved' to something else, reverse it
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
