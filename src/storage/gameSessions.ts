import { initialGameState, normalizeGameState } from '../core/gameEngine';
import { getSupabase } from '../lib/supabase';
import type { GameState, Player, Rule, RuleSet } from '../types';
import type {
  LiveSessionCredentials,
  LiveSessionSnapshot,
  LiveSessionStatus,
} from '../types/liveSession';

interface GameSessionRow {
  id: string;
  code: string;
  status?: LiveSessionStatus;
  rule_set?: RuleSet;
  state?: GameState;
  last_drawn_rule?: Rule | null;
  last_drawn_by?: Player | null;
  host_seen_at?: string;
}

function parseJsonField<T>(value: T | string | undefined): T | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function mapRow(
  row: GameSessionRow,
  previous?: LiveSessionSnapshot | null,
): LiveSessionSnapshot {
  const ruleSet =
    parseJsonField<RuleSet>(row.rule_set) ?? previous?.ruleSet ?? {
      id: '',
      name: 'Partie',
      rules: [],
    };
  const state = normalizeGameState(
    parseJsonField<GameState>(row.state) ?? previous?.state ?? initialGameState,
  );

  return {
    id: row.id,
    code: row.code,
    status: row.status ?? previous?.status ?? 'active',
    ruleSet,
    state,
    lastDrawnRule:
      row.last_drawn_rule !== undefined
        ? row.last_drawn_rule === null
          ? null
          : (parseJsonField<Rule>(row.last_drawn_rule) ?? null)
        : (previous?.lastDrawnRule ?? null),
    lastDrawnBy:
      row.last_drawn_by !== undefined
        ? row.last_drawn_by === null
          ? null
          : (parseJsonField<Player>(row.last_drawn_by) ?? null)
        : (previous?.lastDrawnBy ?? null),
    hostSeenAt: row.host_seen_at ?? previous?.hostSeenAt ?? new Date().toISOString(),
  };
}

export async function createGameSession(
  ruleSet: RuleSet,
  state: GameState,
): Promise<LiveSessionCredentials> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('create_game_session', {
    p_rule_set: ruleSet,
    p_state: state,
  });

  if (error) throw error;

  const payload = data as {
    id: string;
    code: string;
    host_token: string;
  };

  return {
    id: payload.id,
    code: payload.code,
    hostToken: payload.host_token,
  };
}

export async function syncGameSession(
  credentials: LiveSessionCredentials,
  state: GameState,
  options?: {
    lastDrawnRule?: Rule | null;
    lastDrawnBy?: Player | null;
    clearLastDrawn?: boolean;
  },
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc('sync_game_session', {
    p_id: credentials.id,
    p_host_token: credentials.hostToken,
    p_state: state,
    p_last_drawn_rule: options?.lastDrawnRule ?? null,
    p_last_drawn_by: options?.lastDrawnBy ?? null,
    p_clear_last_drawn: options?.clearLastDrawn ?? false,
  });

  if (error) throw error;
}

export async function endGameSession(
  credentials: LiveSessionCredentials,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc('end_game_session', {
    p_id: credentials.id,
    p_host_token: credentials.hostToken,
  });

  if (error) throw error;
}

export async function fetchGameSessionByCode(
  code: string,
): Promise<LiveSessionSnapshot | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('game_sessions')
    .select(
      'id, code, status, rule_set, state, last_drawn_rule, last_drawn_by, host_seen_at',
    )
    .eq('code', code.trim().toUpperCase())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapRow(data as GameSessionRow);
}

export function subscribeGameSession(
  sessionId: string,
  onUpdate: (snapshot: LiveSessionSnapshot) => void,
  getPrevious?: () => LiveSessionSnapshot | null,
): () => void {
  const supabase = getSupabase();

  const channel = supabase
    .channel(`game_session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        onUpdate(
          mapRow(payload.new as GameSessionRow, getPrevious?.() ?? null),
        );
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
