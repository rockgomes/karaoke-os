-- Postgres grants EXECUTE to PUBLIC on every new function. Revoking from
-- anon and authenticated by name does nothing while that PUBLIC grant stands.
revoke execute on function public.is_platform_admin()   from public;
revoke execute on function public.is_venue_member(uuid) from public;
revoke execute on function public.is_venue_owner(uuid)  from public;
revoke execute on function public.handle_new_user()     from public;
