/** Teintes violettes pour différencier les joueurs. */
const PLAYER_COLORS = [
  '#a855f7',
  '#c084fc',
  '#8b5cf6',
  '#d946ef',
  '#818cf8',
  '#e879f9',
];

export function getPlayerAccentColor(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PLAYER_COLORS[Math.abs(hash) % PLAYER_COLORS.length];
}
