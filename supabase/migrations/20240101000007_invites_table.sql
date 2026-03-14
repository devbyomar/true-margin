-- Team Invites table
-- Stores pending invitations for team members

create table if not exists invites (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  company_id uuid references companies(id) on delete cascade not null,
  invited_by uuid references users(id) not null,
  email text not null,
  role text not null default 'crew_lead',   -- pm | crew_lead
  token text unique not null,               -- random invite token
  status text default 'pending',            -- pending | accepted | expired
  accepted_at timestamptz,
  accepted_by uuid references users(id),
  expires_at timestamptz default (now() + interval '7 days')
);

-- RLS
alter table invites enable row level security;

create policy "company members can view their invites"
  on invites for select
  using (company_id = public.get_my_company_id());

create policy "owners and pms can insert invites"
  on invites for insert
  with check (company_id = public.get_my_company_id());

create policy "owners and pms can update invites"
  on invites for update
  using (company_id = public.get_my_company_id());

-- Index for fast token lookups
create index if not exists idx_invites_token on invites(token);
create index if not exists idx_invites_email on invites(email);
