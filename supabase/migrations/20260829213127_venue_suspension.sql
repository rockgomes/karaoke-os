alter table public.venues add column if not exists suspended_at timestamptz;

-- A suspended venue disappears for guests. Its staff can still sign in and see
-- it, so that whatever caused the suspension can be sorted out.
drop policy if exists venues_read on public.venues;
create policy venues_read on public.venues for select
  using (
    suspended_at is null
    or private.is_venue_member(id)
    or private.is_platform_admin()
  );

drop policy if exists libraries_read on public.libraries;
create policy libraries_read on public.libraries for select
  using (
    private.is_venue_member(venue_id)
    or private.is_platform_admin()
    or (
      is_public
      and exists (
        select 1 from public.venues v
        where v.id = libraries.venue_id and v.suspended_at is null
      )
    )
  );

drop policy if exists sessions_read on public.sessions;
create policy sessions_read on public.sessions for select
  using (
    private.is_venue_member(venue_id)
    or private.is_platform_admin()
    or exists (
      select 1 from public.venues v
      where v.id = sessions.venue_id and v.suspended_at is null
    )
  );

-- songs_read already defers to libraries_read, so it needs no change.

-- An owner may rename their venue. An owner may not lift their own
-- suspension, so the column-level grant is the one that decides.
revoke update on public.venues from anon, authenticated;
grant update (name, slug) on public.venues to authenticated;

create or replace function public.set_venue_suspended(
  target_venue uuid,
  suspended boolean
)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.venues;
begin
  if not private.is_platform_admin() then
    raise exception 'only platform staff may suspend a venue' using errcode = '42501';
  end if;

  update public.venues
     set suspended_at = case when suspended then now() else null end
   where id = target_venue
  returning * into updated;

  if updated.id is null then
    raise exception 'no such venue' using errcode = 'P0002';
  end if;

  return updated;
end;
$$;

revoke execute on function public.set_venue_suspended(uuid, boolean) from public;
grant execute on function public.set_venue_suspended(uuid, boolean) to authenticated;
