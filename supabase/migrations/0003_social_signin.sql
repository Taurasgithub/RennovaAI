-- Google / Apple sign-in: new social accounts still go through the app's profile step.
-- Run after 0002_profiles.sql.
--
-- Before: the sign-up trigger copied the provider's name into profiles.full_name, so the app
-- treated Google users as "profile complete" and skipped choosing a city and phone.
-- Now: full_name stays empty until the user confirms it in the profile step (the app pre-fills it
-- from the provider), and the provider's photo becomes the starting profile photo.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    case when new.raw_user_meta_data ->> 'role' = 'vendor' then 'vendor'::public.user_role else 'customer'::public.user_role end,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;
