# Karaoke OS — schema plan

Written 2026-08-28. Target: Next.js + Supabase Postgres.
Status: **built**. Supabase project `karaoke-os`, ref `tczjrhcnufvehcthsens`,
region eu-west-1. Applied 2026-08-29. Security advisors: 0 warnings.

## The three tiers

| Tier | Who | How they are stored |
|---|---|---|
| Platform | You | `users.is_platform_admin = true` |
| Venue | Bar owner, DJ | `users` + a `memberships` row |
| Patron | Person in the bar | No row at all, or a `users` row with no membership |

A patron needs no account to browse. If they want favourites, they sign up.
They become a normal user with zero memberships. Nothing else changes.

## Roles

Two roles. Add more only when a real venue asks.

| Role | Can do | Cannot do |
|---|---|---|
| `owner` | Everything for their own bar: billing, staff, songs, libraries, sessions | Touch another bar |
| `dj` | Open and close a session, add and edit songs | Billing, staff, delete a library, delete the venue |

Two kinds of people are **not** roles:

- **Platform admin** — you. Set by `users.is_platform_admin`, not by a
  membership. Sees every venue.
- **Patron** — has no membership row at all. That is what makes them a patron.

## Tables

```sql
-- A bar. This is the tenant.
create table venues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,   -- public URL: /v/blue-note
  created_at  timestamptz not null default now()
);

-- Every human who can log in: platform staff, venue staff, patrons.
create table users (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null unique,
  display_name      text,
  is_platform_admin boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Links a user to a venue, and says what they may do.
-- A patron has no row here.
create table memberships (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references users(id)  on delete cascade,
  venue_id  uuid not null references venues(id) on delete cascade,
  role      text not null check (role in ('owner','dj')),
  unique (user_id, venue_id)
);

-- A song collection. One venue can have several.
create table libraries (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references venues(id) on delete cascade,
  name       text not null,
  is_public  boolean not null default true,
  created_at timestamptz not null default now()
);

create table songs (
  id             uuid primary key default gen_random_uuid(),
  library_id     uuid not null references libraries(id) on delete cascade,
  title          text not null,
  artist         text not null,
  album          text,
  genre          text,
  duration       text,
  year           integer,
  language       text,            -- patron filter: songs I can sing
  difficulty     text check (difficulty in ('easy','medium','hard')),
  cover_url      text,
  musicbrainz_id text,
  created_at     timestamptz not null default now()
);

create index on songs (library_id);
create index on songs (artist, title);

-- Only for patrons who chose to sign up.
-- A favourite points at one venue's song row, not at a title.
-- Two bars can both stock "Wonderwall" as different karaoke versions,
-- so they are genuinely different songs.
create table favorites (
  user_id    uuid not null references users(id) on delete cascade,
  song_id    uuid not null references songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, song_id)
);
```

## Row level security, in plain words

- **songs, libraries** — anyone may read them when `libraries.is_public` is true.
  Only members of that venue may write.
- **memberships** — a user reads their own. A venue owner reads their venue's.
- **favorites** — only the owning user, read and write.
- **sessions** — anyone reads the open one by venue slug. Only venue members write.
- **venues** — anyone reads by slug. Only owners write.
- **Platform admin** bypasses all of the above.

The database enforces this. No screen or route can forget it.

## Sessions — one karaoke night

A session is one night of karaoke at one venue. It is the switch the DJ
flips when karaoke starts, and it owns that night's requests.

Not a boolean on `venues`. A session gives you history for free, and it is
what future request features hang off.

```sql
create table sessions (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references venues(id) on delete cascade,
  opened_at  timestamptz not null default now(),
  closed_at  timestamptz                      -- null = open now
);

-- Only one open session per venue at a time.
create unique index on sessions (venue_id) where closed_at is null;
```

Opening hours are not modelled. Karaoke nights get cancelled and run late,
so a schedule would be wrong often. The DJ opens and closes the session.
Add a schedule later if the manual step becomes a complaint.

## Doors left open, not built

Today a patron walks to the DJ and asks out loud. The app only has to help
them find the song. Nothing is submitted.

If that changes later, this table drops in with no change to anything above:

```sql
-- NOT BUILT. Sketch only.
create table requests (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references sessions(id) on delete cascade,
  song_id      uuid not null references songs(id) on delete cascade,
  patron_id    uuid references users(id) on delete set null,  -- null = anonymous
  patron_name  text,                                          -- for anonymous
  status       text not null default 'waiting',
  created_at   timestamptz not null default now()
);
```

Playback — the app actually playing the track — is out of scope. It needs
external karaoke hardware or software.

## What changes from the old schema

| Old | New | Why |
|---|---|---|
| `users -> libraries -> songs` | `venues -> libraries -> songs` | A venue is a real thing now |
| slug on `libraries` | slug on `venues` | One public URL per bar, not per list |
| no roles | `memberships.role` | Several staff per bar |
| no platform tier | `is_platform_admin` | You can manage venues |
| `WHERE user_id = ?` by hand | RLS in Postgres | A missed check leaks paying customers |

## Two traps hit while applying this

Both cost a wrong attempt. Do not repeat them.

**1. Revoking a column does nothing while a table grant stands.**
`revoke update (is_platform_admin) on users from authenticated` looked
correct and did nothing. A table-level `GRANT UPDATE` covers every column.
The fix is to drop the table grant, then grant back only the safe columns.

```sql
revoke update on public.users from anon, authenticated;
grant  update (email, display_name) on public.users to authenticated;
```

**2. RLS helper functions cannot simply be revoked.**
Postgres grants `EXECUTE` to `PUBLIC` on every new function, so revoking
`anon` and `authenticated` by name changes nothing. Revoking from `PUBLIC`
does work — and then every policy fails with
`permission denied for function is_venue_member`, because policies are
evaluated as the calling user.

The fix is a schema, not a grant. PostgREST only exposes `public`, so the
helpers live in `private` and keep their `EXECUTE` grant:

- `private.is_platform_admin()`
- `private.is_venue_member(uuid)`
- `private.is_venue_owner(uuid)`
- `private.handle_new_user()` — signup trigger

## Tests that were run against the live database

| Check | Result |
|---|---|
| Signup creates the `public.users` row | pass |
| DJ of Bar A sees Bar A private list plus Bar B public list | pass |
| Stranger with no login sees only public lists | pass |
| DJ of Bar A writes a song into Bar B | blocked |
| User promotes themselves to platform admin | blocked |
| User edits their own display name | allowed |

Fixtures were deleted afterwards. The database is empty.

Watch out when writing your own tests: `set_config('request.jwt.claims', ..., true)`
lasts for the whole transaction. Clear it before testing as `anon`, or the
anon check silently runs as the logged-in user and appears to leak.

## create_venue, and the chicken-and-egg it solves

A new venue has no owner, so `memberships_write` — which requires
`is_venue_owner(venue_id)` — refuses the very first membership. The venue
could be created and then never claimed.

`public.create_venue(venue_name, venue_slug)` does all three inserts in one
transaction as SECURITY DEFINER: the venue, an `owner` membership for the
caller, and a default "Main list" library. It validates the slug against the
same shape the client uses.

Granted to `authenticated` only, and revoked from `PUBLIC`.

## A React trap worth knowing

`useActionState` keeps the action it was first given. Swapping the function
on a mode change does nothing — the login form went on calling sign up after
the button had switched to "Sign in", and only the server log revealed it.

Carry the mode in the form as a hidden field and branch inside one action.

## The platform tier

`users.is_platform_admin` is not a role in `memberships`. It is a flag on the
person, and it is set in SQL only — there is no screen for it, deliberately:

```sql
update public.users set is_platform_admin = true where email = 'you@example.com';
```

`venues.suspended_at` hides a venue from guests. Its own staff keep seeing it,
so whatever caused the suspension can be sorted out.

Two functions serve this tier, both SECURITY DEFINER and both checking
`private.is_platform_admin()` before doing anything:

- `public.platform_venues()` — one row per venue with owner, staff count, song
  count and whether karaoke is running.
- `public.set_venue_suspended(target_venue, suspended)` — the only way to
  change `suspended_at`.

**Why a function and not a view.** A Supabase view runs as its owner, so it
would bypass row level security and hand every venue to every caller. A
function states the check in the open, once.

**Why an owner cannot lift their own suspension.** A table-level `UPDATE`
grant covers every column, so `venues_update` alone would have let an owner
clear the flag. `UPDATE` is revoked on the table and granted back only on
`name` and `slug` — the same trap as `users.is_platform_admin`, met twice.
