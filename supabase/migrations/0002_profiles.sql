-- Personalised profiles for every role + photo storage.
-- Run after 0001_accounts.sql (Supabase dashboard → SQL Editor).

-- ---------- Profile fields (all roles) ----------
alter table public.profiles
  add column avatar_url text,
  add column bio text not null default '',
  -- Customers
  add column area text not null default '',
  add column preferred_styles text[] not null default '{}',
  add column budget_range text check (budget_range in ('lt100k', '100k_300k', '300k_500k', 'gt500k')),
  -- Admins
  add column job_title text not null default '';

-- ---------- Vendor business profile ----------
alter table public.vendor_profiles
  add column logo_url text,
  add column cover_url text,
  add column service_areas text[] not null default '{}',
  add column working_hours text not null default '',
  add column whatsapp text not null default '',
  add column portfolio_urls text[] not null default '{}';

-- ---------- Photo storage ----------
-- Public buckets: anyone can view the images (they appear on public vendor profiles), but each
-- user can only add, replace or delete files inside a folder named after their own user id.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('vendor-media', 'vendor-media', true)
on conflict (id) do nothing;

create policy "media: public read"
  on storage.objects for select
  using (bucket_id in ('avatars', 'vendor-media'));

create policy "media: upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('avatars', 'vendor-media') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "media: update own files"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('avatars', 'vendor-media') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "media: delete own files"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('avatars', 'vendor-media') and (storage.foldername(name))[1] = (select auth.uid())::text);
