-- Designs, bookings (projects), milestones and chat, plus account deletion.
-- Run after 0001–0003 (Supabase dashboard → SQL Editor).
--
-- Bookings are request-based: no money moves through the app. The customer requests a vendor,
-- the vendor accepts or declines, the vendor marks each stage done and the customer confirms it.
-- Customers pay vendors directly. All state changes go through the functions below
-- (security definer, each checks who is calling); the tables themselves are read-only to users.

-- ---------- Saved designs (synced from the customer's phone) ----------
create table public.designs (
  id text primary key,
  customer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null default '',
  name_parts jsonb,
  choices jsonb not null,
  photo_path text,
  result_path text,
  result_mode text not null default 'ai' check (result_mode in ('ai', 'preview', 'illustration')),
  regenerations int not null default 0,
  premium boolean not null default false,
  estimate jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index designs_customer_idx on public.designs (customer_id, created_at desc);

alter table public.designs enable row level security;
create policy "designs: owner reads" on public.designs for select using (customer_id = (select auth.uid()));
create policy "designs: owner inserts" on public.designs for insert with check (customer_id = (select auth.uid()));
create policy "designs: owner updates" on public.designs for update using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));
create policy "designs: owner deletes" on public.designs for delete using (customer_id = (select auth.uid()));

-- ---------- Bookings ----------
create type public.project_status as enum ('requested', 'accepted', 'declined', 'completed', 'cancelled');
create type public.milestone_status as enum ('pending', 'submitted', 'approved');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  vendor_id uuid references public.vendor_profiles (user_id) on delete set null,
  design_id text references public.designs (id) on delete set null,
  -- Snapshot of the design at booking time, so the vendor sees exactly what was requested:
  -- { name, nameParts, choices, estimate, photo_path, result_path, result_mode }
  design jsonb not null,
  title text not null,
  price int not null check (price >= 0),
  days int not null check (days > 0),
  start_pref text not null default 'Flexible',
  note text not null default '' check (char_length(note) <= 1000),
  status public.project_status not null default 'requested',
  decline_reason text,
  -- Contact details the vendor needs (customers' profiles are otherwise private).
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_city text not null default '',
  vendor_name text not null default '',
  rating int check (rating between 1 and 5),
  review text check (char_length(review) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_customer_idx on public.projects (customer_id, created_at desc);
create index projects_vendor_idx on public.projects (vendor_id, created_at desc);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stage int not null check (stage between 0 and 2),
  pct numeric not null,
  amount int not null,
  status public.milestone_status not null default 'pending',
  submitted_at timestamptz,
  approved_at timestamptz,
  unique (project_id, stage)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  sender_id uuid default auth.uid() references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_project_idx on public.messages (project_id, created_at);

create function public.is_project_member(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects
    where id = pid and (customer_id = auth.uid() or vendor_id = auth.uid())
  );
$$;

alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.messages enable row level security;

create policy "projects: members or admin read" on public.projects for select
  using (customer_id = (select auth.uid()) or vendor_id = (select auth.uid()) or public.is_admin());
create policy "milestones: members or admin read" on public.milestones for select
  using (public.is_project_member(project_id) or public.is_admin());
create policy "messages: members read" on public.messages for select
  using (public.is_project_member(project_id));
create policy "messages: members send" on public.messages for insert
  with check (sender_id = (select auth.uid()) and public.is_project_member(project_id));

-- ---------- Booking actions ----------

-- Customer books an approved vendor for one of their saved designs. Returns the new project id.
create function public.request_booking(
  p_vendor uuid, p_design_id text, p_design jsonb, p_title text, p_price int, p_days int,
  p_start text, p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me public.profiles;
  v public.vendor_profiles;
  pid uuid;
  pcts numeric[] := array[0.3, 0.4, 0.3];
  amounts int[];
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null or me.status <> 'active' then raise exception 'not signed in'; end if;
  select * into v from public.vendor_profiles where user_id = p_vendor and status = 'approved';
  if v.user_id is null then raise exception 'vendor not available'; end if;
  if v.user_id = me.id then raise exception 'cannot book yourself'; end if;
  if p_price < 0 or p_days < 1 then raise exception 'invalid price or timeline'; end if;
  if p_design_id is not null and not exists (select 1 from public.designs where id = p_design_id and customer_id = me.id) then
    p_design_id := null; -- design not synced yet; the snapshot is still stored
  end if;

  insert into public.projects (customer_id, vendor_id, design_id, design, title, price, days, start_pref, note,
                               customer_name, customer_phone, customer_city, vendor_name)
  values (me.id, v.user_id, p_design_id, p_design, left(p_title, 120), p_price, p_days, left(coalesce(p_start, 'Flexible'), 40),
          left(coalesce(p_note, ''), 1000), me.full_name, me.phone, me.city, v.business_name)
  returning id into pid;

  -- Three stages; the last absorbs rounding so they add up to the price.
  amounts := array[round(p_price * 0.3 / 100) * 100, round(p_price * 0.4 / 100) * 100, 0];
  amounts[3] := p_price - amounts[1] - amounts[2];
  for i in 1..3 loop
    insert into public.milestones (project_id, stage, pct, amount) values (pid, i - 1, pcts[i], amounts[i]);
  end loop;
  return pid;
end;
$$;

-- Vendor accepts or declines a new request.
create function public.respond_booking(p_project uuid, p_accept boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.projects
     set status = case when p_accept then 'accepted'::public.project_status else 'declined'::public.project_status end,
         decline_reason = case when p_accept then null else left(p_reason, 500) end,
         updated_at = now()
   where id = p_project and vendor_id = auth.uid() and status = 'requested';
  if not found then raise exception 'booking not found or already answered'; end if;
end;
$$;

-- Customer cancels before work is finished.
create function public.cancel_booking(p_project uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.projects set status = 'cancelled', updated_at = now()
   where id = p_project and customer_id = auth.uid() and status in ('requested', 'accepted');
  if not found then raise exception 'booking cannot be cancelled'; end if;
end;
$$;

-- Vendor marks the next stage as done (earlier stages must be confirmed first).
create function public.submit_milestone(p_milestone uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.milestones;
begin
  select ms.* into m from public.milestones ms join public.projects p on p.id = ms.project_id
   where ms.id = p_milestone and p.vendor_id = auth.uid() and p.status = 'accepted' and ms.status = 'pending';
  if m.id is null then raise exception 'stage not available'; end if;
  if exists (select 1 from public.milestones where project_id = m.project_id and stage < m.stage and status <> 'approved') then
    raise exception 'finish the earlier stages first';
  end if;
  update public.milestones set status = 'submitted', submitted_at = now() where id = m.id;
  update public.projects set updated_at = now() where id = m.project_id;
end;
$$;

-- Customer confirms a stage the vendor marked done. The last confirmation completes the project.
create function public.approve_milestone(p_milestone uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.milestones;
begin
  select ms.* into m from public.milestones ms join public.projects p on p.id = ms.project_id
   where ms.id = p_milestone and p.customer_id = auth.uid() and p.status = 'accepted' and ms.status = 'submitted';
  if m.id is null then raise exception 'stage not ready to confirm'; end if;
  update public.milestones set status = 'approved', approved_at = now() where id = m.id;
  update public.projects
     set status = case when not exists (select 1 from public.milestones where project_id = m.project_id and status <> 'approved')
                       then 'completed'::public.project_status else status end,
         updated_at = now()
   where id = m.project_id;
end;
$$;

-- Customer rates a completed project (once).
create function public.rate_project(p_project uuid, p_rating int, p_review text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_rating not between 1 and 5 then raise exception 'rating must be 1–5'; end if;
  update public.projects set rating = p_rating, review = left(nullif(trim(p_review), ''), 1000), updated_at = now()
   where id = p_project and customer_id = auth.uid() and status = 'completed' and rating is null;
  if not found then raise exception 'project cannot be rated'; end if;
end;
$$;

-- Public ratings for the marketplace: averages and recent reviews (first name only).
create function public.vendor_stats()
returns table (vendor_id uuid, rating numeric, review_count int, jobs_completed int)
language sql
stable
security definer
set search_path = ''
as $$
  select vendor_id,
         round(avg(rating)::numeric, 1),
         count(rating)::int,
         count(*) filter (where status = 'completed')::int
    from public.projects
   where vendor_id is not null
   group by vendor_id;
$$;

create function public.vendor_reviews(p_vendor uuid)
returns table (rating int, review text, name text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select rating, coalesce(review, ''), split_part(customer_name, ' ', 1), updated_at
    from public.projects
   where vendor_id = p_vendor and rating is not null
   order by updated_at desc
   limit 20;
$$;

revoke all on function public.request_booking, public.respond_booking, public.cancel_booking, public.submit_milestone,
  public.approve_milestone, public.rate_project from public, anon;
grant execute on function public.request_booking, public.respond_booking, public.cancel_booking, public.submit_milestone,
  public.approve_milestone, public.rate_project to authenticated;
grant execute on function public.vendor_stats, public.vendor_reviews to anon, authenticated;

-- ---------- Design images ----------
-- Private bucket: files live under <customer id>/<design id>/. The customer can manage their own
-- files; a vendor can view the images of designs that were booked with them.
insert into storage.buckets (id, name, public) values ('designs', 'designs', false)
on conflict (id) do nothing;

create policy "designs bucket: owner or booked vendor reads" on storage.objects for select to authenticated
  using (
    bucket_id = 'designs' and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.projects p
        where p.vendor_id = (select auth.uid()) and name in (p.design ->> 'photo_path', p.design ->> 'result_path')
      )
    )
  );
create policy "designs bucket: owner uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'designs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "designs bucket: owner updates" on storage.objects for update to authenticated
  using (bucket_id = 'designs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "designs bucket: owner deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'designs' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- Account deletion (required by Google Play) ----------
-- Deletes the signed-in user. Profiles, designs and their bookings cascade; a vendor's bookings stay
-- with the customer (vendor_id becomes null). The app removes the user's stored files first.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account from public, anon;
grant execute on function public.delete_my_account to authenticated;

-- ---------- Live updates ----------
alter publication supabase_realtime add table public.projects, public.milestones, public.messages;
