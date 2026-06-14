export type RuleType = 'simple' | 'persistent' | 'special';

/** Portée d'une règle persistante active. */
export type PersistentScope = 'drawer' | 'everyone';

export type DurationType = 'turns' | 'unlimited';

export interface RandomDuration {
  min: number;
  max: number;
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  type: RuleType;
  duration?: number | RandomDuration;
  durationType?: DurationType;
  showRemainingTurns?: boolean;
  canBeRedrawn?: boolean;
  /** Nombre d'exemplaires dans le jeu (règles simples uniquement). */
  copies?: number;
  /** Règles persistantes : joueur qui a pioché ou tout le monde. */
  persistentScope?: PersistentScope;
  /** false = exclue du tirage (reste dans la liste). Défaut : active. */
  enabled?: boolean;
}

export interface RuleSet {
  id: string;
  name: string;
  rules: Rule[];
  exhaustiveSimpleRules?: boolean;
  /** Chance (0–5 %) qu'une pioche déclenche un événement spécial. */
  specialTriggerChance?: number;
  /** Chance (0–50 %) de piocher une règle persistante à chaque tirage. */
  persistentDrawChance?: number;
}

export interface Player {
  id: string;
  name: string;
}

export interface ActivePersistentRule {
  rule: Rule;
  /** null = règle globale (tout le monde). */
  playerId: string | null;
  /** Tours globaux restants ; null = illimitée. */
  remainingTours: number | null;
  /** false tant que le titulaire n'a pas passé une première fois après l'activation. */
  awaitingFirstPass: boolean;
}

export interface GameState {
  currentPlayers: Player[];
  nextRoundPlayers: Player[];
  currentPlayerIndex: number;
  selectedRuleSetId: string | null;
  activePersistentRules: ActivePersistentRule[];
  rulesToReactivateNextRound: Rule[];
  drawnSimpleRules: string[];
  totalTurns: number;
  isActive: boolean;
  /** Le joueur actif a déjà pioché ce tour (guidage Piocher / Suivant). */
  hasDrawnThisTurn: boolean;
}

export interface AppData {
  ruleSets: RuleSet[];
  game: GameState | null;
}
