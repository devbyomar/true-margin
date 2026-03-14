-- Allow anyone to read an invite by its token.
-- This is necessary so unauthenticated users landing on /invite/[token]
-- can see the invite details before signing up.

create policy "anyone can read invites by token"
  on invites for select
  using (true);
-- The API route filters by token so only specific invites are exposed.
-- We keep the company-scoped policy for the team management page (it's additive with OR).
