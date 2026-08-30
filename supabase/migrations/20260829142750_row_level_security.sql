-- Helper functions. SECURITY DEFINER so that a policy on memberships
-- can ask about memberships without recursing into its own policy.
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from public.users where id = auth.uid()), false);
$$;

create or replace function public.is_venue_member(v uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and venue_id = v
  );
$$;

create or replace function public.is_venue_owner(v uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and venue_id = v and role = 'owner'
  );
$$;

alter table public.venues      enable row level security;
alter table public.users       enable row level security;
alter table public.memberships enable row level security;
alter table public.libraries   enable row level security;
alter table public.songs       enable row level security;
alter table public.sessions    enable row level security;
alter table public.favorites   enable row level security;

-- venues: anyone may read (patrons arrive by slug). Owners write.
create policy venues_read   on public.venues for select using (true);
create policy venues_insert on public.venues for insert to authenticated with check (true);
create policy venues_update on public.venues for update
  using (public.is_venue_owner(id) or public.is_platform_admin());
create policy venues_delete on public.venues for delete
  using (public.is_venue_owner(id) or public.is_platform_admin());

-- users: your own row only.
create policy users_read   on public.users for select
  using (id = auth.uid() or public.is_platform_admin());
create policy users_update on public.users for update
  using (id = auth.uid()) with check (id = auth.uid());
-- Nobody may promote themselves to platform admin.
revoke update (is_platform_admin) on public.users from authenticated, anon;

-- memberships: your own, or every row for a venue you own.
create policy memberships_read on public.memberships for select
  using (user_id = auth.uid() or public.is_venue_owner(venue_id) or public.is_platform_admin());
create policy memberships_write on public.memberships for all
  using (public.is_venue_owner(venue_id) or public.is_platform_admin())
  with check (public.is_venue_owner(venue_id) or public.is_platform_admin());

-- libraries: public ones are readable by anyone. Members write. Owners delete.
create policy libraries_read on public.libraries for select
  using (is_public or public.is_venue_member(venue_id) or public.is_platform_admin());
create policy libraries_insert on public.libraries for insert
  with check (public.is_venue_member(venue_id) or public.is_platform_admin());
create policy libraries_update on public.libraries for update
  using (public.is_venue_member(venue_id) or public.is_platform_admin())
  with check (public.is_venue_member(venue_id) or public.is_platform_admin());
create policy libraries_delete on public.libraries for delete
  using (public.is_venue_owner(venue_id) or public.is_platform_admin());

-- songs: follow the library they sit in.
create policy songs_read on public.songs for select
  using (exists (
    select 1 from public.libraries l
    where l.id = songs.library_id
      and (l.is_public or public.is_venue_member(l.venue_id) or public.is_platform_admin())
  ));
create policy songs_write on public.songs for all
  using (exists (
    select 1 from public.libraries l
    where l.id = songs.library_id
      and (public.is_venue_member(l.venue_id) or public.is_platform_admin())
  ))
  with check (exists (
    select 1 from public.libraries l
    where l.id = songs.library_id
      and (public.is_venue_member(l.venue_id) or public.is_platform_admin())
  ));

-- sessions: anyone may see whether karaoke is on. Members write.
create policy sessions_read  on public.sessions for select using (true);
create policy sessions_write on public.sessions for all
  using (public.is_venue_member(venue_id) or public.is_platform_admin())
  with check (public.is_venue_member(venue_id) or public.is_platform_admin());

-- favorites: yours alone.
create policy favorites_all on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
