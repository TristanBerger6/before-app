-- Purge automatique des sessions expirées (pg_cron, toutes les heures).

create extension if not exists pg_cron with schema extensions;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'purge-expired-game-sessions';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end;
$$;

select cron.schedule(
  'purge-expired-game-sessions',
  '0 * * * *',
  $$delete from public.game_sessions where expires_at < now()$$
);
