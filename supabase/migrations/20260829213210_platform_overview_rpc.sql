-- One row per venue, with the counts the platform screen needs.
--
-- A function rather than a view: a Supabase view runs as its owner and would
-- quietly bypass row level security, so every caller would see every venue.
-- This checks the caller instead, once, in the open.
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
    order by v.created_at desc;
end;
$$;

revoke execute on function public.platform_venues() from public;
grant execute on function public.platform_venues() to authenticated;
