-- Sessions de partie live (hôte = source de vérité, lecteurs en lecture seule via code).

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_token text not null,
  status text not null default 'active'
    check (status in ('active', 'ended', 'disconnected')),
  rule_set jsonb not null,
  state jsonb not null,
  last_drawn_rule jsonb,
  host_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists game_sessions_code_idx on public.game_sessions (code);
create index if not exists game_sessions_expires_at_idx on public.game_sessions (expires_at);

alter table public.game_sessions replica identity full;

alter table public.game_sessions enable row level security;

-- Lecture publique : le code fait office de secret (décision produit).
create policy "game_sessions_select_public"
  on public.game_sessions for select
  using (true);

-- Écriture uniquement via RPC (host_token).

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
      insert into public.game_sessions (code, host_token, rule_set, state)
      values (v_code, v_host_token, p_rule_set, p_state)
      returning id into v_id;

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
  p_clear_last_drawn boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.game_sessions
  set
    state = p_state,
    last_drawn_rule = case
      when p_clear_last_drawn then null
      when p_last_drawn_rule is not null then p_last_drawn_rule
      else last_drawn_rule
    end,
    host_seen_at = now(),
    status = 'active'
  where id = p_id
    and host_token = p_host_token
    and status in ('active', 'disconnected');

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
  update public.game_sessions
  set status = 'ended', host_seen_at = now()
  where id = p_id and host_token = p_host_token;

  if not found then
    raise exception 'Invalid session or host token';
  end if;
end;
$$;

grant execute on function public.create_game_session(jsonb, jsonb) to anon, authenticated;
grant execute on function public.sync_game_session(uuid, text, jsonb, jsonb, boolean) to anon, authenticated;
grant execute on function public.end_game_session(uuid, text) to anon, authenticated;

-- Realtime (ignoré si déjà ajouté)
do $$
begin
  alter publication supabase_realtime add table public.game_sessions;
exception
  when duplicate_object then null;
end;
$$;
