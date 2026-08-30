-- A real karaoke catalogue runs to thousands of songs, and the guest page
-- searches with "contains" rather than "starts with" (people remember a
-- fragment of a title, not its first word). Without a trigram index that is a
-- sequential scan on every keystroke.
create extension if not exists pg_trgm with schema extensions;

create index if not exists songs_title_trgm
  on public.songs using gin (title extensions.gin_trgm_ops);

create index if not exists songs_artist_trgm
  on public.songs using gin (artist extensions.gin_trgm_ops);

-- The genres offered to a guest, across every library of one venue that the
-- caller is allowed to read.
--
-- SECURITY INVOKER, so row level security decides what is counted: a private
-- library, or a suspended venue, contributes nothing. That is what makes it
-- safe to let a signed-out visitor call this at all.
create or replace function public.venue_genres(target_venue uuid)
returns table (genre text, songs bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select btrim(g) as genre, count(*) as songs
  from public.songs s
  join public.libraries l on l.id = s.library_id
  cross join lateral unnest(string_to_array(s.genre, ',')) as g
  where l.venue_id = target_venue
    and s.genre is not null
    and btrim(g) <> ''
  group by 1
  order by 2 desc, 1 asc
$$;

revoke execute on function public.venue_genres(uuid) from public;
grant execute on function public.venue_genres(uuid) to anon, authenticated;
