-- Hands one anonymous visitor their own copy of the demo venue.
--
-- A clone rather than a share of one venue: an empty venue is a blank page,
-- so the visitor needs the songs, and a shared sandbox only stays presentable
-- until the first person renames a track to something rude.
--
-- SECURITY DEFINER because the visitor must not hold the rights this needs.
-- They cannot insert a venue (venues_insert refuses anonymous callers), and
-- they cannot insert the first membership either, because memberships_write
-- asks whether they already own the venue. One function does both, checks the
-- caller itself, and never lends those rights out.
create or replace function public.start_demo()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  existing text;
  template_venue uuid;
  lib record;
  made public.venues;
  made_library uuid;
  demo_slug text;
  live_demos integer;
  dies_at timestamptz;
begin
  if caller is null then
    raise exception 'must be signed in' using errcode = '42501';
  end if;

  -- Staff have their own venue. This is for passers-by, and letting a real
  -- account through would leave demo venues attached to real people.
  if not private.is_anonymous() then
    raise exception 'the demo is for visitors, not signed-in staff'
      using errcode = '42501';
  end if;

  -- One sandbox per visitor. A reload returns the same venue rather than
  -- cloning 55 songs again.
  select v.slug into existing
  from public.venues v
  join public.memberships m on m.venue_id = v.id
  where m.user_id = caller and v.is_demo
  limit 1;

  if existing is not null then
    return existing;
  end if;

  -- A ceiling, so one bad afternoon cannot fill the database.
  select count(*) into live_demos
  from public.venues
  where is_demo and expires_at > now();

  if live_demos >= 200 then
    raise exception 'the demo is busy just now, try again shortly'
      using errcode = '53400';
  end if;

  select v.id into template_venue
  from public.venues v
  where v.slug = 'the-anchor' and not v.is_demo;

  if template_venue is null then
    raise exception 'no demo template to copy' using errcode = 'P0002';
  end if;

  -- Tomorrow at 04:00, which is between four and twenty-eight hours away
  -- whenever this runs. Long enough to come back after lunch, short enough
  -- that "it will not survive the night" stays true.
  dies_at := date_trunc('day', now()) + interval '28 hours';

  demo_slug := 'demo-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

  insert into public.venues (name, slug, is_demo, expires_at)
  values ('The Anchor', demo_slug, true, dies_at)
  returning * into made;

  insert into public.memberships (user_id, venue_id, role)
  values (caller, made.id, 'owner');

  -- Copy every library rather than assuming there is one, so this keeps
  -- working if the template ever grows a second list.
  for lib in
    select id, name, is_public from public.libraries where venue_id = template_venue
  loop
    insert into public.libraries (venue_id, name, is_public)
    values (made.id, lib.name, lib.is_public)
    returning id into made_library;

    insert into public.songs (
      library_id, title, artist, album, genre, duration,
      year, language, difficulty, cover_url, musicbrainz_id
    )
    select
      made_library, s.title, s.artist, s.album, s.genre, s.duration,
      s.year, s.language, s.difficulty, s.cover_url, s.musicbrainz_id
    from public.songs s
    where s.library_id = lib.id;
  end loop;

  -- Karaoke is on, so the visitor sees the product mid-service rather than
  -- shut. It is also the one thing on the screen they can immediately undo.
  insert into public.sessions (venue_id) values (made.id);

  return demo_slug;
end;
$$;

revoke execute on function public.start_demo() from public, anon;
grant execute on function public.start_demo() to authenticated;

-- Deletes expired demo venues. Everything else follows by cascade.
--
-- Returns the count so whatever calls it can say what it did. PR 3 puts it on
-- a schedule; until then it is here so nothing accumulates unbounded.
create or replace function public.sweep_demo_venues()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  swept integer;
begin
  with gone as (
    delete from public.venues
    where is_demo and expires_at is not null and expires_at <= now()
    returning id
  )
  select count(*) into swept from gone;

  -- The anonymous accounts that owned them are now pointing at nothing.
  delete from auth.users au
  where au.is_anonymous
    and au.created_at < now() - interval '2 days'
    and not exists (
      select 1 from public.memberships m where m.user_id = au.id
    );

  return swept;
end;
$$;

revoke execute on function public.sweep_demo_venues() from public, anon, authenticated;

-- Demo venues are not customers, and must not show up as any.
create or replace function public.platform_venues()
returns table (
  id uuid,
  name text,
  slug text,
  created_at timestamptz,
  suspended_at timestamptz,
  owner_email text,
  staff_count bigint,
  song_count bigint,
  karaoke_open boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_platform_admin() then
    raise exception 'platform staff only' using errcode = '42501';
  end if;

  return query
    select
      v.id,
      v.name,
      v.slug,
      v.created_at,
      v.suspended_at,
      (
        select u.email
        from public.memberships m
        join public.users u on u.id = m.user_id
        where m.venue_id = v.id and m.role = 'owner'
        order by u.created_at
        limit 1
      ) as owner_email,
      (select count(*) from public.memberships m where m.venue_id = v.id) as staff_count,
      (
        select count(*)
        from public.songs s
        join public.libraries l on l.id = s.library_id
        where l.venue_id = v.id
      ) as song_count,
      exists (
        select 1 from public.sessions se
        where se.venue_id = v.id and se.closed_at is null
      ) as karaoke_open
    from public.venues v
    where not v.is_demo
    order by v.created_at desc;
end;
$$;

revoke execute on function public.platform_venues() from public, anon;
grant execute on function public.platform_venues() to authenticated;
