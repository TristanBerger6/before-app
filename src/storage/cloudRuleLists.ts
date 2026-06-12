import { getSupabase } from '../lib/supabase';
import type { RuleSet } from '../types';

interface RuleListRow {
  id: string;
  user_id: string;
  payload: RuleSet;
  updated_at: string;
}

export async function fetchCloudRuleLists(userId: string): Promise<RuleSet[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('rule_lists')
    .select('payload')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => row.payload as RuleSet);
}

export async function upsertCloudRuleList(
  userId: string,
  ruleSet: RuleSet,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('rule_lists').upsert(
    {
      id: ruleSet.id,
      user_id: userId,
      payload: ruleSet,
      updated_at: new Date().toISOString(),
    } satisfies RuleListRow,
    { onConflict: 'id' },
  );

  if (error) throw error;
}

export async function deleteCloudRuleList(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('rule_lists').delete().eq('id', id);
  if (error) throw error;
}

export async function replaceCloudRuleLists(
  userId: string,
  ruleSets: RuleSet[],
): Promise<void> {
  const supabase = getSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from('rule_lists')
    .select('id')
    .eq('user_id', userId);

  if (fetchError) throw fetchError;

  const nextIds = new Set(ruleSets.map((rs) => rs.id));
  const toDelete = (existing ?? [])
    .map((row) => row.id as string)
    .filter((id) => !nextIds.has(id));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('rule_lists')
      .delete()
      .in('id', toDelete);
    if (deleteError) throw deleteError;
  }

  if (ruleSets.length === 0) return;

  const { error: upsertError } = await supabase.from('rule_lists').upsert(
    ruleSets.map((ruleSet) => ({
      id: ruleSet.id,
      user_id: userId,
      payload: ruleSet,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'id' },
  );

  if (upsertError) throw upsertError;
}
