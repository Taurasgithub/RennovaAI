-- Security hardening from the November 2026 review. Run after 0004.

-- 1. Trigger helpers are not API endpoints: nobody should call them through /rest/v1/rpc.
--    (is_admin / is_project_member stay callable: row-level security policies run them as the caller.)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile() from public, anon, authenticated;
revoke execute on function public.protect_vendor_profile() from public, anon, authenticated;

-- 2. Photo buckets accept only images, with a size cap.
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
       file_size_limit = case id when 'avatars' then 5 * 1024 * 1024 else 10 * 1024 * 1024 end
 where id in ('avatars', 'vendor-media', 'designs');

-- 3. Public buckets serve files by URL without any policy; the old "public read" policy also let
--    anyone LIST every user's folder. Replace it with "owners can read their own files"
--    (needed for replacing a photo).
drop policy if exists "media: public read" on storage.objects;
create policy "media: owner reads own files" on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'vendor-media') and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 4. Bookings: the design snapshot's image paths must point into the customer's own folder.
--    Otherwise a crafted request could give the booked vendor access to someone else's private photo.
create or replace function public.request_booking(
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
  p_design := coalesce(p_design, '{}'::jsonb);
  if coalesce(p_design ->> 'photo_path', '') <> '' and not starts_with(p_design ->> 'photo_path', me.id::text || '/') then
    p_design := p_design - 'photo_path';
  end if;
  if coalesce(p_design ->> 'result_path', '') <> '' and not starts_with(p_design ->> 'result_path', me.id::text || '/') then
    p_design := p_design - 'result_path';
  end if;

  insert into public.projects (customer_id, vendor_id, design_id, design, title, price, days, start_pref, note,
                               customer_name, customer_phone, customer_city, vendor_name)
  values (me.id, v.user_id, p_design_id, p_design, left(p_title, 120), p_price, p_days, left(coalesce(p_start, 'Flexible'), 40),
          left(coalesce(p_note, ''), 1000), me.full_name, me.phone, me.city, v.business_name)
  returning id into pid;

  amounts := array[round(p_price * 0.3 / 100) * 100, round(p_price * 0.4 / 100) * 100, 0];
  amounts[3] := p_price - amounts[1] - amounts[2];
  for i in 1..3 loop
    insert into public.milestones (project_id, stage, pct, amount) values (pid, i - 1, pcts[i], amounts[i]);
  end loop;
  return pid;
end;
$$;
revoke all on function public.request_booking from public, anon;
grant execute on function public.request_booking to authenticated;

-- 5. No new messages on declined or cancelled bookings (the app already shows those chats read-only).
drop policy if exists "messages: members send" on public.messages;
create policy "messages: members send" on public.messages for insert
  with check (
    sender_id = (select auth.uid())
    and public.is_project_member(project_id)
    and exists (select 1 from public.projects p where p.id = project_id and p.status in ('requested', 'accepted', 'completed'))
  );
