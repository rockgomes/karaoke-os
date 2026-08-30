-- Creating a venue and becoming its owner cannot be two client calls.
-- memberships_write requires is_venue_owner(venue_id), which is false for a
-- venue that has no owner yet, so the first membership could never be
-- inserted. This does both in one transaction instead.
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

  if coalesce(trim(venue_name), '') = '' then
    raise exception 'venue name is required' using errcode = '22023';
  end if;

  if venue_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'slug must be lowercase letters, numbers and single hyphens'
      using errcode = '22023';
  end if;

  insert into public.venues (name, slug)
  values (trim(venue_name), venue_slug)
  returning * into created;

  insert into public.memberships (user_id, venue_id, role)
  values (caller, created.id, 'owner');

  -- Every venue starts with somewhere to put songs.
  insert into public.libraries (venue_id, name, is_public)
  values (created.id, 'Main list', true);

  return created;
end;
$$;

revoke execute on function public.create_venue(text, text) from public;
grant execute on function public.create_venue(text, text) to authenticated;
