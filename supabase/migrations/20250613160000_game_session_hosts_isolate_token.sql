-- Isole host_token hors de game_sessions (lecture publique + Realtime).

create table if not exists public.game_session_hosts (
  session_id uuid primary key references public.game_sessions (id) on delete cascade,
  host_token text not null
);

alter table public.game_session_hosts enable row level security;

-- Aucun accès direct client : seules les RPC security definer lisent cette table.
revoke all on public.game_session_hosts from anon, authenticated;

insert into public.game_session_hosts (session_id, host_token)
select id, host_token
from public.game_sessions
where host_token is not null
on conflict (session_id) do nothing;

create or replace function public.create_game_session(
  p_rule_set jsonb,
  p_state jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text;
  v_host_token text;
  v_id uuid;
  v_attempt int := 0;
begin
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      v_host_token := encode(extensions.gen_random_bytes(24), 'hex');
      insert into public.game_sessions (code, rule_set, state)
      values (v_code, p_rule_set, p_state)
      returning id into v_id;

      insert into public.game_session_hosts (session_id, host_token)
      values (v_id, v_host_token);

      return jsonb_build_object(
        'id', v_id,
        'code', v_code,
        'host_token', v_host_token
      );
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 12 then
        raise exception 'Could not generate session code';
      end if;
    end;
  end loop;
end;
$$;

create or replace function public.sync_game_session(
  p_id uuid,
  p_host_token text,
  p_state jsonb,
  p_last_drawn_rule jsonb default null,
  p_last_drawn_by jsonb default null,
  p_clear_last_drawn boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.game_sessions gs
  set
    state = p_state,
    last_drawn_rule = case
      when p_clear_last_drawn then null
      when p_last_drawn_rule is not null then p_last_drawn_rule
      else gs.last_drawn_rule
    end,
    last_drawn_by = case
      when p_clear_last_drawn then null
      when p_last_drawn_by is not null then p_last_drawn_by
      else gs.last_drawn_by
    end,
    host_seen_at = now(),
    status = 'active'
  from public.game_session_hosts h
  where gs.id = p_id
    and gs.id = h.session_id
    and h.host_token = p_host_token
    and gs.status in ('active', 'disconnected');

  if not found then
    raise exception 'Invalid session or host token';
  end if;
end;
$$;

create or replace function public.end_game_session(
  p_id uuid,
  p_host_token text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.game_sessions gs
  set status = 'ended', host_seen_at = now()
  from public.game_session_hosts h
  where gs.id = p_id
    and gs.id = h.session_id
    and h.host_token = p_host_token;

  if not found then
    raise exception 'Invalid session or host token';
  end if;
end;
$$;

grant execute on function public.create_game_session(jsonb, jsonb) to anon, authenticated;
grant execute on function public.sync_game_session(uuid, text, jsonb, jsonb, jsonb, boolean)
  to anon, authenticated;
grant execute on function public.end_game_session(uuid, text) to anon, authenticated;

-- Ancienne surcharge (référençait host_token sur game_sessions).
drop function if exists public.sync_game_session(uuid, text, jsonb, jsonb, boolean);

alter table public.game_sessions drop column if exists host_token;
