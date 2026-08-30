-- A bar. This is the tenant.
create table public.venues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- Every human who can log in: platform staff, venue staff, patrons.
create table public.users (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null unique,
  display_name      text,
  is_platform_admin boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Links a user to a venue, and says what they may do.
-- A patron has no row here.
create table public.memberships (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users(id)  on delete cascade,
  venue_id  uuid not null references public.venues(id) on delete cascade,
  role      text not null check (role in ('owner','dj')),
  unique (user_id, venue_id)
);
create index on public.memberships (venue_id);

-- A song collection. One venue can have several.
create table public.libraries (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references public.venues(id) on delete cascade,
  name       text not null,
  is_public  boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.libraries (venue_id);

create table public.songs (
  id             uuid primary key default gen_random_uuid(),
  library_id     uuid not null references public.libraries(id) on delete cascade,
  title          text not null,
  artist         text not null,
  album          text,
  genre          text,
  duration       text,
  year           integer,
  language       text,
  difficulty     text check (difficulty in ('easy','medium','hard')),
  cover_url      text,
  musicbrainz_id text,
  created_at     timestamptz not null default now()
);
create index on public.songs (library_id);
create index on public.songs (artist, title);

-- One karaoke night at one venue.
create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references public.venues(id) on delete cascade,
  opened_at  timestamptz not null default now(),
  closed_at  timestamptz
);
-- Only one open session per venue at a time.
create unique index one_open_session_per_venue
  on public.sessions (venue_id) where closed_at is null;

-- Only for patrons who chose to sign up.
-- A favourite points at one venue's song row, not at a title.
create table public.favorites (
  user_id    uuid not null references public.users(id) on delete cascade,
  song_id    uuid not null references public.songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, song_id)
);

-- Mirror a new auth signup into public.users.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
