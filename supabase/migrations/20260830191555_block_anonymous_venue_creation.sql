-- Remove the venue the probe created.
delete from public.venues where slug = 'not-a-demo-probe';

-- create_venue is SECURITY DEFINER, so it never consulted venues_insert.
--
-- Tightening that policy against anonymous callers therefore did nothing
-- here, and a demo visitor could still mint permanent venues one REST call at
-- a time. A definer function carries its own front door, and this one had
-- none: it asked whether the caller was signed in, which an anonymous visitor
-- is.
create or replace function public.create_venue(venue_name text, venue_slug text)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  created public.venues;
begin
  if caller is null then
    raise exception 'must be signed in to create a venue' using errcode = '42501';
  end if;

  -- A demo visitor is signed in, and is still not a customer.
  if private.is_anonymous() then
    raise exception 'a demo visitor cannot create a venue' using errcode = '42501';
  end if;

  if coalesce(trim(venue_name), '') = '' then
    raise exception 'venue name is required' using errcode = '22023';
  end if;

  if venue_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'slug must be lowercase letters, numbers and single hyphens'
      using errcode = '22023';
  end if;

  -- Reserved, so nothing can be parked on the shape the demo hands out.
  if venue_slug like 'demo-%' then
    raise exception 'that name is reserved' using errcode = '22023';
  end if;

  insert into public.venues (name, slug)
  values (trim(venue_name), venue_slug)
  returning * into created;

  insert into public.memberships (user_id, venue_id, role)
  values (caller, created.id, 'owner');

  insert into public.libraries (venue_id, name, is_public)
  values (created.id, 'Main list', true);

  return created;
end;
$$;

revoke execute on function public.create_venue(text, text) from public, anon;
grant execute on function public.create_venue(text, text) to authenticated;

-- The same question, asked of the other definer function a demo visitor can
-- reach. set_venue_suspended already demands platform staff, and an anonymous
-- visitor is not, so it needs no change — checked, not assumed.
