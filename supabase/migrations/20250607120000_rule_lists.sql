-- Listes de règles synchronisées par utilisateur (auth Supabase).
create table if not exists public.rule_lists (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists rule_lists_user_id_idx on public.rule_lists (user_id);

alter table public.rule_lists enable row level security;

create policy "rule_lists_select_own"
  on public.rule_lists for select
  using (auth.uid() = user_id);

create policy "rule_lists_insert_own"
  on public.rule_lists for insert
  with check (auth.uid() = user_id);

create policy "rule_lists_update_own"
  on public.rule_lists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "rule_lists_delete_own"
  on public.rule_lists for delete
  using (auth.uid() = user_id);
