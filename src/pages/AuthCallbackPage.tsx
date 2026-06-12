import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resolvePostAuthPath } from '../lib/authRedirect';
import { translateAuthError } from '../lib/authErrors';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError('Supabase non configuré');
      return;
    }

    const supabase = getSupabase();

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(translateAuthError(exchangeError));
          return;
        }
      } else {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError(translateAuthError(sessionError));
          return;
        }
      }

      const user = useAuthStore.getState().user;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        useAuthStore.setState({ user: session.user, session });
        await useAppStore.getState().handleAuthChange(session.user);
      } else if (user) {
        await useAppStore.getState().handleAuthChange(user);
      }

      navigate(
        resolvePostAuthPath(
          searchParams.get('next'),
          searchParams.get('feedback') === '1',
        ),
        { replace: true },
      );
    })();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-dvh bg-app flex items-center justify-center px-4">
      {error ? (
        <p className="text-danger text-sm text-center">{error}</p>
      ) : (
        <p className="text-muted text-sm">Connexion en cours...</p>
      )}
    </div>
  );
}
