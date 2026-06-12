/** Chemins internes autorisés après connexion (évite open redirect). */
export function sanitizeAuthNext(path: string | null | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/';
  if (path.startsWith('/auth')) return '/';
  return path;
}

export function buildAuthPath(next: string, openFeedback = false): string {
  const params = new URLSearchParams();
  params.set('next', sanitizeAuthNext(next));
  if (openFeedback) params.set('feedback', '1');
  return `/auth?${params.toString()}`;
}

export function buildAuthCallbackUrl(next: string, openFeedback = false): string {
  const params = new URLSearchParams();
  params.set('next', sanitizeAuthNext(next));
  if (openFeedback) params.set('feedback', '1');
  return `${window.location.origin}/auth/callback?${params.toString()}`;
}

export function resolvePostAuthPath(
  next: string | null,
  openFeedback: boolean,
): string {
  const safe =
    next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/auth')
      ? next
      : '/';

  if (!openFeedback) return safe;

  const qIndex = safe.indexOf('?');
  const path = qIndex >= 0 ? safe.slice(0, qIndex) : safe;
  const params = new URLSearchParams(qIndex >= 0 ? safe.slice(qIndex + 1) : '');
  params.set('feedback', '1');
  return `${path}?${params.toString()}`;
}
