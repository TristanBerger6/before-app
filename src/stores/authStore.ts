import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { EMAIL_OTP_LENGTH } from '../lib/authConfig';
import { translateAuthError } from '../lib/authErrors';
import { getAuthRedirectUrl, getSupabase, isSupabaseConfigured } from '../lib/supabase';

function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

let verifyEmailOtpInFlight: Promise<{ ok: true } | { ok: false; error: string }> | null =
  null;

interface AuthStore {
  user: User | null;
  session: Session | null;
  isAuthReady: boolean;
  authError: string | null;

  initialize: () => Promise<void>;
  sendEmailOtp: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  verifyEmailOtp: (
    email: string,
    token: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signInWithGoogle: () => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isAuthReady: false,
  authError: null,

  async initialize() {
    if (!isSupabaseConfigured()) {
      set({ isAuthReady: true, user: null, session: null });
      return;
    }

    const supabase = getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    set({
      session,
      user: session?.user ?? null,
      isAuthReady: true,
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      });
    });
  },

  async sendEmailOtp(email) {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Supabase non configuré sur cet environnement.' };
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizeAuthEmail(email),
      });

      if (error) return { ok: false, error: translateAuthError(error) };
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: translateAuthError(
          err instanceof Error ? err : new Error('Connexion impossible'),
        ),
      };
    }
  },

  async verifyEmailOtp(email, token) {
    if (verifyEmailOtpInFlight) {
      return verifyEmailOtpInFlight;
    }

    verifyEmailOtpInFlight = (async () => {
      if (!isSupabaseConfigured()) {
        return { ok: false, error: 'Supabase non configuré sur cet environnement.' };
      }

      const normalizedEmail = normalizeAuthEmail(email);
      const trimmedToken = token.trim();
      if (!normalizedEmail) {
        return { ok: false, error: 'Entrez votre adresse email.' };
      }
      if (!new RegExp(`^\\d{${EMAIL_OTP_LENGTH}}$`).test(trimmedToken)) {
        return {
          ok: false,
          error: `Le code doit contenir ${EMAIL_OTP_LENGTH} chiffres.`,
        };
      }

      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: trimmedToken,
          type: 'email',
        });

        if (error) {
          return { ok: false as const, error: translateAuthError(error) };
        }

        set({
          user: data.user ?? null,
          session: data.session ?? null,
        });
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          error: translateAuthError(
            err instanceof Error ? err : new Error('Code invalide'),
          ),
        };
      }
    })();

    try {
      return await verifyEmailOtpInFlight;
    } finally {
      verifyEmailOtpInFlight = null;
    }
  },

  async signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Supabase non configuré sur cet environnement.' };
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) return { ok: false, error: translateAuthError(error) };
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: translateAuthError(
          err instanceof Error ? err : new Error('Connexion Google impossible'),
        ),
      };
    }
  },

  async signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  clearAuthError() {
    set({ authError: null });
  },
}));

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.user != null);
}
