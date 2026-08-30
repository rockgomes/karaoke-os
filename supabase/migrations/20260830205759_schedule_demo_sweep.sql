-- Nothing was deleting expired demo venues. They expired and then sat there.
--
-- In the database rather than a scheduled function on the host: this needs no
-- service key anywhere, has no network hop to fail, and keeps running if the
-- site is down or moves hosts. The thing being cleaned up and the thing doing
-- the cleaning are in the same place.
create extension if not exists pg_cron;

-- 04:05 UTC. Every demo venue is stamped to die at 04:00, so this runs five
-- minutes behind the whole night's worth at once rather than polling.
--
-- Named, so re-running this migration reschedules the one job instead of
-- stacking duplicates.
select cron.schedule(
  'sweep-demo-venues',
  '5 4 * * *',
  $$select public.sweep_demo_venues()$$
);
