-- Retours utilisateurs (bugs / idées), auth obligatoire, 1 envoi / minute.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('bug', 'idea')),
  message text not null,
  page text,
  session_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

-- Lecture / écriture uniquement via RPC (service) ou dashboard admin.

create or replace function public.submit_feedback(
  p_kind text,
  p_message text,
  p_page text default null,
  p_session_code text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_last timestamptz;
  v_trimmed text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_kind not in ('bug', 'idea') then
    raise exception 'INVALID_KIND';
  end if;

  v_trimmed := trim(p_message);
  if length(v_trimmed) < 10 then
    raise exception 'MESSAGE_TOO_SHORT';
  end if;

  if length(v_trimmed) > 2000 then
    raise exception 'MESSAGE_TOO_LONG';
  end if;

  select created_at into v_last
  from public.feedback
  where user_id = v_user_id
  order by created_at desc
  limit 1;

  if v_last is not null and v_last > now() - interval '1 minute' then
    raise exception 'RATE_LIMIT';
  end if;

  insert into public.feedback (user_id, kind, message, page, session_code, metadata)
  values (
    v_user_id,
    p_kind,
    v_trimmed,
    nullif(trim(p_page), ''),
    nullif(upper(trim(p_session_code)), ''),
    coalesce(p_metadata, '{}'::jsonb)
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.submit_feedback(text, text, text, text, jsonb)
  to authenticated;
