-- Qui a pioché la dernière règle (snapshot joueur jsonb).

alter table public.game_sessions
  add column if not exists last_drawn_by jsonb;

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
  update public.game_sessions
  set
    state = p_state,
    last_drawn_rule = case
      when p_clear_last_drawn then null
      when p_last_drawn_rule is not null then p_last_drawn_rule
      else last_drawn_rule
    end,
    last_drawn_by = case
      when p_clear_last_drawn then null
      when p_last_drawn_by is not null then p_last_drawn_by
      else last_drawn_by
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

grant execute on function public.sync_game_session(uuid, text, jsonb, jsonb, jsonb, boolean)
  to anon, authenticated;
