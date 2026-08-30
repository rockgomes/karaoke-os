-- Supabase sets ALTER DEFAULT PRIVILEGES so every new function in public is
-- granted to anon and authenticated. Revoking PUBLIC does not touch that
-- explicit anon grant, so it has to be named.
--
-- None of these were exploitable: each checks the caller and raises for a
-- signed-out one. This stops a stranger reaching the body at all.
revoke execute on function public.create_venue(text, text) from anon;
revoke execute on function public.platform_venues() from anon;
revoke execute on function public.set_venue_suspended(uuid, boolean) from anon;
