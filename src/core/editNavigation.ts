/** État router pour chaîner les retours (partie → liste → règle). */
export type EditNavState = {
  /** Destination immédiate du bouton retour / après enregistrement. */
  returnTo?: string;
  /** Retour ultime de la page liste (ex. /game pendant une partie). */
  listReturnTo?: string;
};

export function readEditNavState(
  state: unknown,
  fallbackReturnTo: string,
): { returnTo: string; listReturnTo?: string } {
  const nav = state as EditNavState | null;
  return {
    returnTo: nav?.returnTo ?? fallbackReturnTo,
    listReturnTo: nav?.listReturnTo,
  };
}

/** État à passer en revenant sur l'éditeur de liste depuis une règle. */
export function listEditNavState(listReturnTo?: string): EditNavState | undefined {
  if (!listReturnTo) return undefined;
  return { returnTo: listReturnTo };
}
