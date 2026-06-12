import type { AuthError } from '@supabase/supabase-js';

const BY_CODE: Record<string, string> = {
  over_email_send_rate_limit:
    'Trop de demandes par email. Réessayez dans quelques minutes.',
  over_request_rate_limit:
    'Trop de tentatives. Patientez un moment avant de réessayer.',
  otp_cooldown:
    'Patientez quelques secondes avant de redemander un code.',
  email_address_invalid: 'Adresse email invalide.',
  email_address_not_authorized: 'Cette adresse email n’est pas autorisée.',
  signup_disabled: 'Les inscriptions sont désactivées.',
  user_not_found: 'Aucun compte trouvé avec cet email.',
  invalid_credentials: 'Identifiants invalides.',
  session_not_found: 'Session expirée. Reconnectez-vous.',
  bad_oauth_state: 'Connexion interrompue. Réessayez.',
  oauth_callback_error: 'Connexion Google impossible. Réessayez.',
  validation_failed: 'Informations invalides. Vérifiez vos données.',
  otp_expired:
    'Code incorrect ou expiré. Utilisez le dernier code reçu, ou demandez-en un nouveau.',
  otp_disabled: 'La connexion par code est désactivée.',
};

const BY_MESSAGE: Record<string, string> = {
  'email rate limit exceeded':
    'Trop de demandes par email. Réessayez dans quelques minutes.',
  'rate limit exceeded':
    'Trop de tentatives. Patientez un moment avant de réessayer.',
  'for security purposes, you can only request this after 4 seconds.':
    'Patientez quelques secondes avant de redemander un code.',
  'invalid login credentials': 'Identifiants invalides.',
  'email not confirmed': 'Confirmez votre email avant de vous connecter.',
  'user already registered': 'Un compte existe déjà avec cet email.',
  'oauth state parameter missing':
    'Connexion interrompue. Réessayez depuis la page de connexion.',
  'email link is invalid or has expired':
    'Le code a expiré ou est invalide. Demandez-en un nouveau.',
  'token has expired or is invalid':
    'Code incorrect ou expiré. Vérifiez le code ou demandez-en un nouveau.',
  'invalid otp': 'Code incorrect. Vérifiez et réessayez.',
  'invalid request': 'Requête invalide. Réessayez.',
  'signup is disabled': 'Les inscriptions sont désactivées.',
  'email address is invalid': 'Adresse email invalide.',
  'unable to validate email address: invalid format':
    'Adresse email invalide.',
};

function isLikelyFrench(message: string): boolean {
  return /[àâäéèêëïîôùûüç]/i.test(message);
}

export function translateAuthError(error: string | AuthError | Error): string {
  if (typeof error === 'string') {
    if (isLikelyFrench(error)) return error;
    const normalized = error.toLowerCase().trim();
    return BY_MESSAGE[normalized] ?? fallbackMessage(error);
  }

  const code = 'code' in error && error.code ? String(error.code) : null;
  if (code && BY_CODE[code]) return BY_CODE[code];

  const message = error.message;
  if (isLikelyFrench(message)) return message;

  const normalized = message.toLowerCase().trim();
  if (BY_MESSAGE[normalized]) return BY_MESSAGE[normalized];

  for (const [key, value] of Object.entries(BY_MESSAGE)) {
    if (normalized.includes(key)) return value;
  }

  const cooldownSeconds = normalized.match(/after (\d+) seconds?/);
  if (cooldownSeconds) {
    const seconds = cooldownSeconds[1];
    return `Patientez ${seconds} seconde${seconds === '1' ? '' : 's'} avant de redemander un code.`;
  }

  return fallbackMessage(message);
}

function fallbackMessage(original: string): string {
  if (!original.trim()) {
    return 'Une erreur est survenue lors de la connexion. Réessayez.';
  }
  return 'Une erreur est survenue lors de la connexion. Réessayez.';
}
