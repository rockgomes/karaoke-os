-- Prerequisites for anonymous demo sign-in.

-- 1. Anonymous auth users have no email address.
alter table public.users alter column email drop not null;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- nullif, not new.email: an empty string is not a missing address as far
  -- as the unique index is concerned, so the second anonymous visitor would
  -- collide with the first.
  insert into public.users (id, email, display_name)
  values (new.id, nullif(new.email, ''), new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- 2. Supabase hands anonymous visitors the `authenticated` role, so a policy
--    that trusts that role trusts every passer-by once anonymous sign-in is
--    on. venues_insert had WITH CHECK (true).
create or replace function private.is_anonymous()
returns boolean
language sql
stable
set search_path to ''
as $function$
  -- A missing claim means a token issued before anonymous sign-in existed,
  -- which belongs to a real person. Default to "not anonymous" so that
  -- tightening this policy cannot lock real staff out of their own venue.
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$function$;

revoke all on function private.is_anonymous() from public;
grant execute on function private.is_anonymous() to anon, authenticated;

drop policy if exists venues_insert on public.venues;
create policy venues_insert on public.venues
  for insert to authenticated
  with check (not private.is_anonymous());

-- 3. What a demo venue is, and when it stops being one.
alter table public.venues
  add column if not exists is_demo boolean not null default false,
  add column if not exists expires_at timestamptz;

comment on column public.venues.is_demo is
  'A throwaway venue cloned so one visitor can try the backoffice.';
comment on column public.venues.expires_at is
  'When the sweep may delete this venue. Null means it is not on a clock.';

create index if not exists venues_demo_expiry
  on public.venues (expires_at) where is_demo;
