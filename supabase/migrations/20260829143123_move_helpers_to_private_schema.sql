-- PostgREST only exposes `public`. Helpers live in `private` so they are
-- unreachable as REST endpoints, while policies can still call them.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from public.users where id = auth.uid()), false);
$$;

create or replace function private.is_venue_member(v uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships where user_id = auth.uid() and venue_id = v);
$$;

create or replace function private.is_venue_owner(v uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships
                 where user_id = auth.uid() and venue_id = v and role = 'owner');
$$;

grant execute on function private.is_platform_admin()   to anon, authenticated;
grant execute on function private.is_venue_member(uuid) to anon, authenticated;
grant execute on function private.is_venue_owner(uuid)  to anon, authenticated;

-- The signup trigger fires as the table owner, so it needs no caller grant.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Repoint every policy at the private helpers.
drop policy venues_update      on public.venues;
drop policy venues_delete      on public.venues;
drop policy users_read         on public.users;
drop policy memberships_read   on public.memberships;
drop policy memberships_write  on public.memberships;
drop policy libraries_read     on public.libraries;
drop policy libraries_insert   on public.libraries;
drop policy libraries_update   on public.libraries;
drop policy libraries_delete   on public.libraries;
drop policy songs_read         on public.songs;
drop policy songs_write        on public.songs;
drop policy sessions_write     on public.sessions;

create policy venues_update on public.venues for update
  using (private.is_venue_owner(id) or private.is_platform_admin());
create policy venues_delete on public.venues for delete
  using (private.is_venue_owner(id) or private.is_platform_admin());

create policy users_read on public.users for select
  using (id = auth.uid() or private.is_platform_admin());

create policy memberships_read on public.memberships for select
  using (user_id = auth.uid() or private.is_venue_owner(venue_id) or private.is_platform_admin());
create policy memberships_write on public.memberships for all
  using (private.is_venue_owner(venue_id) or private.is_platform_admin())
  with check (private.is_venue_owner(venue_id) or private.is_platform_admin());

create policy libraries_read on public.libraries for select
  using (is_public or private.is_venue_member(venue_id) or private.is_platform_admin());
create policy libraries_insert on public.libraries for insert
  with check (private.is_venue_member(venue_id) or private.is_platform_admin());
create policy libraries_update on public.libraries for update
  using (private.is_venue_member(venue_id) or private.is_platform_admin())
  with check (private.is_venue_member(venue_id) or private.is_platform_admin());
create policy libraries_delete on public.libraries for delete
  using (private.is_venue_owner(venue_id) or private.is_platform_admin());

create policy songs_read on public.songs for select
  using (exists (select 1 from public.libraries l where l.id = songs.library_id
                 and (l.is_public or private.is_venue_member(l.venue_id) or private.is_platform_admin())));
create policy songs_write on public.songs for all
  using (exists (select 1 from public.libraries l where l.id = songs.library_id
                 and (private.is_venue_member(l.venue_id) or private.is_platform_admin())))
  with check (exists (select 1 from public.libraries l where l.id = songs.library_id
                 and (private.is_venue_member(l.venue_id) or private.is_platform_admin())));

create policy sessions_write on public.sessions for all
  using (private.is_venue_member(venue_id) or private.is_platform_admin())
  with check (private.is_venue_member(venue_id) or private.is_platform_admin());

-- The public copies are now unreferenced.
drop function public.is_platform_admin();
drop function public.is_venue_member(uuid);
drop function public.is_venue_owner(uuid);
drop function public.handle_new_user();
