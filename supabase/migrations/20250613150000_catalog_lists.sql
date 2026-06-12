-- Catalogue read-only de listes préconçues (lecture publique, écriture admin uniquement).

create table if not exists public.catalog_lists (
  id text primary key,
  name text not null,
  description text,
  payload jsonb not null,
  version int not null default 1 check (version >= 1),
  author_type text not null default 'official'
    check (author_type in ('official', 'community')),
  sort_order int not null default 0,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_lists_sort_idx
  on public.catalog_lists (sort_order asc, published_at desc);

alter table public.catalog_lists enable row level security;

create policy "catalog_lists_public_read"
  on public.catalog_lists for select
  using (true);

revoke insert, update, delete on public.catalog_lists from anon, authenticated;

grant select on public.catalog_lists to anon, authenticated;
