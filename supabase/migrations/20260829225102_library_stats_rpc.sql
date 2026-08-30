-- The four numbers on the venue admin screen, counted in one round trip.
--
-- "Added this week" uses the database clock rather than the web server's.
-- Reading the clock while rendering is impure, and the two machines need not
-- agree; one source of time avoids a count that changes on a re-render.
--
-- SECURITY INVOKER, so row level security still decides what is counted.
create or replace function public.library_stats(target_library uuid)
returns table (
  total bigint,
  incomplete bigint,
  added_this_week bigint,
  genres bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*),
    count(*) filter (
      where s.genre is null
         or s.duration is null
         or s.album is null
         or s.year is null
         or s.cover_url is null
    ),
    count(*) filter (where s.created_at >= now() - interval '7 days'),
    (
      select count(distinct btrim(g))
      from public.songs s2
      cross join lateral unnest(string_to_array(s2.genre, ',')) as g
      where s2.library_id = target_library
        and s2.genre is not null
        and btrim(g) <> ''
    )
  from public.songs s
  where s.library_id = target_library
$$;

-- Named explicitly: revoking PUBLIC does not remove Supabase's own grant to
-- anon, which ALTER DEFAULT PRIVILEGES adds to every new public function.
revoke execute on function public.library_stats(uuid) from public, anon;
grant execute on function public.library_stats(uuid) to authenticated;
