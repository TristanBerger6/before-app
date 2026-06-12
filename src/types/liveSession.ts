import type { GameState, Player, Rule, RuleSet } from './index';

export type LiveSessionStatus = 'active' | 'ended' | 'disconnected';

export interface LiveSessionCredentials {
  id: string;
  code: string;
  hostToken: string;
}

export interface LiveSessionSnapshot {
  id: string;
  code: string;
  status: LiveSessionStatus;
  ruleSet: RuleSet;
  state: GameState;
  lastDrawnRule: Rule | null;
  lastDrawnBy: Player | null;
  hostSeenAt: string;
}

export type SpectatorConnectionStatus =
  | 'idle'
  | 'loading'
  | 'live'
  | 'disconnected'
  | 'ended';
