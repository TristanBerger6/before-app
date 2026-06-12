import type { RuleSet } from '../types';
import type { CatalogAuthorType, CatalogListEntry } from '../types/catalog';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

interface CatalogRow {
  id: string;
  name: string;
  description: string | null;
  payload: RuleSet;
  version: number;
  author_type: CatalogAuthorType;
  sort_order: number;
  published_at: string;
}

function mapRow(row: CatalogRow): CatalogListEntry {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    payload: row.payload,
    version: row.version,
    authorType: row.author_type,
    sortOrder: row.sort_order,
    publishedAt: row.published_at,
  };
}

export async function fetchCatalogLists(): Promise<CatalogListEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('catalog_lists')
    .select('id, name, description, payload, version, author_type, sort_order, published_at')
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as CatalogRow));
}

export async function fetchCatalogList(id: string): Promise<CatalogListEntry | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('catalog_lists')
    .select('id, name, description, payload, version, author_type, sort_order, published_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as CatalogRow);
}
