-- Distinct genres for one library, for the genre filter on the admin screen.
--
-- A song's genre column can hold several comma-joined labels ("Pop, Dance"),
-- so the values are split before they are counted. Doing this in the database
-- avoids shipping every song to the browser just to build a dropdown.
--
-- SECURITY INVOKER, so row level security still decides which songs are
-- visible: a person who cannot read the library gets no rows.
create or replace function public.library_genres(target_library uuid)
returns table (genre text, songs bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select btrim(g) as genre, count(*) as songs
  from public.songs s
  cross join lateral unnest(string_to_array(s.genre, ',')) as g
  where s.library_id = target_library
    and s.genre is not null
    and btrim(g) <> ''
  group by 1
  order by 2 desc, 1 asc
$$;

-- Supabase's ALTER DEFAULT PRIVILEGES grants EXECUTE to anon and authenticated
-- on every new public function, and revoking PUBLIC does not remove a grant
-- made to a named role. Both have to be named.
revoke execute on function public.library_genres(uuid) from public, anon;
grant execute on function public.library_genres(uuid) to authenticated;
