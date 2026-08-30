-- These helpers exist only to be called from inside RLS policies.
-- In the public schema they are also reachable as REST endpoints
-- (/rest/v1/rpc/is_venue_owner), which is not intended.
revoke execute on function public.is_platform_admin()        from anon, authenticated;
revoke execute on function public.is_venue_member(uuid)      from anon, authenticated;
revoke execute on function public.is_venue_owner(uuid)       from anon, authenticated;
revoke execute on function public.handle_new_user()          from anon, authenticated;
