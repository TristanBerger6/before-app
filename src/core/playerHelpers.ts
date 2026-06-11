/** Première lettre en majuscule, reste inchangé. */
export function formatPlayerName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLocaleUpperCase('fr-FR') + trimmed.slice(1);
}
