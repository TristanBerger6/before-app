export function translateFeedbackError(message: string): string {
  const code = message.toUpperCase();

  if (code.includes('AUTH_REQUIRED') || code.includes('JWT')) {
    return 'Connectez-vous pour envoyer un message.';
  }
  if (code.includes('RATE_LIMIT')) {
    return 'Vous pouvez envoyer un message par minute. Réessayez dans un instant.';
  }
  if (code.includes('MESSAGE_TOO_SHORT')) {
    return 'Le message doit contenir au moins 10 caractères.';
  }
  if (code.includes('MESSAGE_TOO_LONG')) {
    return 'Le message ne peut pas dépasser 2000 caractères.';
  }
  if (code.includes('INVALID_KIND')) {
    return 'Type de retour invalide.';
  }

  return 'Impossible d\'envoyer le message. Réessayez plus tard.';
}
