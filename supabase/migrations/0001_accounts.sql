-- RennovaAI accounts: customer / vendor / admin roles, vendor applications, admin controls.
-- Run once in the Supabase dashboard → SQL Editor (or `supabase db push` with the CLI).
-- Security model:
--   * Everyone can read and edit only their own profile; they can switch between customer and vendor
--     but can never make themselves admin or change their own status.
--   * Vendors create and edit their own application; only admins can approve/reject it or move its
--     verification step. Approved vendors are publicly readable (for the marketplace).
--   * Admins (role = 'admin', status = 'active') can read and update every profile and application.

create type public.user_role as enum ('customer', 'vendor', 'admin');
create type public.account_status as enum ('active', 'suspended');
create type public.vendor_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  role public.user_role not null default 'customer',
  full_name text not null default '',
  phone text not null default '',
  city text not null default 'Sukkur',
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendor_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  business_name text not null,
  owner_name text not null,
  phone text not null,
  city text not null,
  services text[] not null default '{}',
  years_experience int,
  about text not null default '',
  status public.vendor_status not null default 'pending',
  verification_step int not null default 1 check (verification_step between 1 and 4),
  review_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

create index vendor_profiles_status_idx on public.vendor_profiles (status);
create index profiles_role_idx on public.profiles (role);

-- ---------- Helpers ----------

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

-- New sign-ups get a profile. The role comes from sign-up metadata but can only be customer or vendor.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    case when new.raw_user_meta_data ->> 'role' = 'vendor' then 'vendor'::public.user_role else 'customer'::public.user_role end,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Non-admins cannot grant themselves admin, leave admin, or change their own status.
-- (auth.uid() is null in the SQL editor / service role, so those edits are allowed — that is how
-- the first admin is created.)
create function public.protect_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role = 'admin' or old.role = 'admin' then
      new.role := old.role;
    end if;
    new.status := old.status;
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

-- Vendors cannot approve themselves: review fields are admin-only; a resubmitted application goes back to pending.
create function public.protect_vendor_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.verification_step := 1;
      new.review_note := null;
      new.reviewed_at := null;
      new.reviewed_by := null;
      new.submitted_at := now();
    else
      new.verification_step := old.verification_step;
      new.reviewed_at := old.reviewed_at;
      new.reviewed_by := old.reviewed_by;
      new.review_note := old.review_note;
      new.submitted_at := old.submitted_at;
      new.status := case when old.status = 'rejected' then 'pending'::public.vendor_status else old.status end;
    end if;
  end if;
  return new;
end;
$$;

create trigger vendor_profiles_protect
  before insert or update on public.vendor_profiles
  for each row execute function public.protect_vendor_profile();

-- ---------- Row-level security ----------

alter table public.profiles enable row level security;
alter table public.vendor_profiles enable row level security;

create policy "profiles: read own or admin"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own or admin"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "vendor_profiles: read own, approved, or admin"
  on public.vendor_profiles for select
  to anon, authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or (select public.is_admin()));

create policy "vendor_profiles: vendor creates own"
  on public.vendor_profiles for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "vendor_profiles: update own or admin"
  on public.vendor_profiles for update
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "vendor_profiles: admin deletes"
  on public.vendor_profiles for delete
  to authenticated
  using ((select public.is_admin()));
