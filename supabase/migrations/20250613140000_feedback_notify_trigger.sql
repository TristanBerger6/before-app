-- Déclenche un email via Edge Function notify-feedback à chaque INSERT feedback (pg_net).

create extension if not exists pg_net with schema extensions;

create schema if not exists private;

create table if not exists private.feedback_notify_config (
  id int primary key default 1 check (id = 1),
  function_url text not null,
  webhook_secret text not null,
  updated_at timestamptz not null default now()
);

revoke all on table private.feedback_notify_config from public, anon, authenticated;

-- Projet Before (ekkfergoxpqkqypfvyqz) — à mettre à jour si autre projet.
insert into private.feedback_notify_config (id, function_url, webhook_secret)
values (
  1,
  'https://ekkfergoxpqkqypfvyqz.supabase.co/functions/v1/notify-feedback',
  encode(extensions.gen_random_bytes(24), 'hex')
)
on conflict (id) do nothing;

create or replace function private.trigger_feedback_notify()
returns trigger
language plpgsql
security definer
set search_path = private, public, extensions
as $$
declare
  v_url text;
  v_secret text;
begin
  select function_url, webhook_secret
  into v_url, v_secret
  from private.feedback_notify_config
  where id = 1;

  if v_url is null or v_secret is null then
    return NEW;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'feedback',
      'record', jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'kind', NEW.kind,
        'message', NEW.message,
        'page', NEW.page,
        'session_code', NEW.session_code,
        'metadata', NEW.metadata,
        'created_at', NEW.created_at
      )
    )
  );

  return NEW;
end;
$$;

drop trigger if exists feedback_notify_after_insert on public.feedback;

create trigger feedback_notify_after_insert
  after insert on public.feedback
  for each row
  execute function private.trigger_feedback_notify();

-- Secret à copier dans les secrets Edge Function FEEDBACK_WEBHOOK_SECRET :
-- select webhook_secret from private.feedback_notify_config;
