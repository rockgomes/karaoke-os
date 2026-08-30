-- venues_read let anyone read every venue that was not suspended, so a
-- stranger with no account could list every customer's name and slug in one
-- REST call. It was written that way because a guest arrives by slug and has
-- to be able to look their bar up.
--
-- Those are different needs. "Show me the venue called the-anchor" does not
-- require "show me every venue", and this separates them: the lookup becomes
-- a function that answers about one slug, and the table itself stops
-- answering to strangers at all.

-- Asked from inside a policy, so it must not go through venues_read itself.
-- SECURITY DEFINER for that reason and no other: it exposes one boolean about
-- a venue whose id the caller already has.
create or replace function private.venue_is_live(v uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.venues where id = v and suspended_at is null
  );
$$;

revoke execute on function private.venue_is_live(uuid) from public;
grant execute on function private.venue_is_live(uuid) to anon, authenticated;

-- Both of these previously sub-queried public.venues directly, which meant
-- they inherited whatever venues_read allowed. Tightening venues_read without
-- changing them would have silently emptied the guest song list.
drop policy if exists libraries_read on public.libraries;
create policy libraries_read on public.libraries for select
  using (
    private.is_venue_member(venue_id)
    or private.is_platform_admin()
    or (is_public and private.venue_is_live(venue_id))
  );

drop policy if exists sessions_read on public.sessions;
create policy sessions_read on public.sessions for select
  using (
    private.is_venue_member(venue_id)
    or private.is_platform_admin()
    or private.venue_is_live(venue_id)
  );

-- songs_read defers to libraries_read, so it needs no change.

-- The table now answers only to people who work at the venue.
drop policy if exists venues_read on public.venues;
create policy venues_read on public.venues for select
  using (private.is_venue_member(id) or private.is_platform_admin());

-- One venue, by the slug the guest already has off the table in front of
-- them. Readable by slug, not listable: a stranger can still confirm a slug
-- they have been given, which is the whole point of a QR code, and can no
-- longer ask what other slugs exist.
--
-- Staff and platform still see their own venue here even when suspended, so
-- that "What guests see" keeps working while they sort out whatever caused it.
create or replace function public.guest_venue(venue_slug text)
returns table (id uuid, name text, slug text)
language sql
stable
security definer
set search_path = public
as $$
  select v.id, v.name, v.slug
  from public.venues v
  where v.slug = venue_slug
    and (
      v.suspended_at is null
      or private.is_venue_member(v.id)
      or private.is_platform_admin()
    );
$$;

revoke execute on function public.guest_venue(text) from public;
grant execute on function public.guest_venue(text) to anon, authenticated;
