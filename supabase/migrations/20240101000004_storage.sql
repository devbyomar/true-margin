-- ============================================================
-- TrueMargin — Storage Buckets
-- Supabase Storage for receipts and change order photos
-- ============================================================

-- Create storage buckets
insert into storage.buckets (id, name, public)
values
  ('receipts', 'receipts', false),
  ('change-order-photos', 'change-order-photos', false),
  ('change-order-pdfs', 'change-order-pdfs', false),
  ('signatures', 'signatures', false);

-- ============================================================
-- Storage RLS Policies
-- ============================================================

-- Receipts: company members can upload and view
create policy "company members can upload receipts"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid() is not null
  );

create policy "company members can view receipts"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.uid() is not null
  );

-- Change order photos: company members can upload and view
create policy "company members can upload co photos"
  on storage.objects for insert
  with check (
    bucket_id = 'change-order-photos'
    and auth.uid() is not null
  );

create policy "company members can view co photos"
  on storage.objects for select
  using (
    bucket_id = 'change-order-photos'
    and auth.uid() is not null
  );

-- Change order PDFs: company members can upload; public can view (for customer approval)
create policy "company members can upload co pdfs"
  on storage.objects for insert
  with check (
    bucket_id = 'change-order-pdfs'
    and auth.uid() is not null
  );

create policy "anyone can view co pdfs"
  on storage.objects for select
  using (
    bucket_id = 'change-order-pdfs'
  );

-- Signatures: anyone can upload (customer signing) and view
create policy "anyone can upload signatures"
  on storage.objects for insert
  with check (
    bucket_id = 'signatures'
  );

create policy "anyone can view signatures"
  on storage.objects for select
  using (
    bucket_id = 'signatures'
  );
