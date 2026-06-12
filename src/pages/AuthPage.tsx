import { KeyRound, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resolvePostAuthPath } from '../lib/authRedirect';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { OtpInput } from '../components/ui/OtpInput';
import { EMAIL_OTP_LENGTH } from '../lib/authConfig';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const OTP_COOLDOWN_MS = 60_000;

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sendEmailOtp, verifyEmailOtp, signInWithGoogle } = useAuthStore();
  const authNext = searchParams.get('next');
  const openFeedback = searchParams.get('feedback') === '1';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownSecs, setCooldownSecs] = useState(0);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      setCooldownSecs(0);
      return;
    }
    const tick = () => {
      const left = Math.ceil((cooldownUntil - Date.now()) / 1000);
      setCooldownSecs(Math.max(0, left));
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const startCooldown = () => setCooldownUntil(Date.now() + OTP_COOLDOWN_MS);

  const handleSendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Entrez votre adresse email');
      return;
    }
    if (cooldownSecs > 0) {
      setError(
        `Patientez ${cooldownSecs} seconde${cooldownSecs > 1 ? 's' : ''} avant de redemander un code.`,
      );
      return;
    }
    setLoading(true);
    setError(null);
    const result = await sendEmailOtp(trimmed);
    setLoading(false);
    startCooldown();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCodeSent(true);
    setCode('');
  };

  const handleVerify = async (codeOverride?: string) => {
    const trimmed = email.trim();
    const token = (codeOverride ?? code).trim();
    if (!trimmed) {
      setError('Entrez votre adresse email');
      return;
    }
    if (token.length !== EMAIL_OTP_LENGTH) {
      setError(`Entrez le code à ${EMAIL_OTP_LENGTH} chiffres reçu par email`);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await verifyEmailOtp(trimmed, token);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(resolvePostAuthPath(authNext, openFeedback), { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const result = await signInWithGoogle({
      next: authNext ?? '/',
      openFeedback,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    }
  };

  return (
    <AppShell title="Connexion" showBack backTo="/">
      <div className="flex flex-col gap-6 max-w-sm mx-auto animate-in">
        <div>
          <h2 className="font-display text-2xl text-foreground mb-2">
            Sauvegarder vos listes
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Connectez-vous pour retrouver vos listes de règles sur tous vos appareils.
            La partie fonctionne sans compte.
          </p>
        </div>

        {!configured && (
          <div className="rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm text-muted">
            Supabase n&apos;est pas configuré. Ajoutez{' '}
            <code className="text-foreground">.env.local</code> avec vos clés projet.
          </div>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !codeSent) void handleSendCode();
          }}
        />

        {codeSent ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
              <p className="text-muted leading-relaxed">
                Un code a été envoyé à{' '}
                <span className="text-foreground font-medium">{email}</span>.
                Saisissez le code du dernier email reçu, puis cliquez sur Se connecter.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-muted text-center">
                Code à {EMAIL_OTP_LENGTH} chiffres
              </p>
              <OtpInput
                value={code}
                onChange={setCode}
                disabled={loading}
              />
            </div>

            <Button fullWidth onClick={() => void handleVerify()} disabled={loading || !configured}>
              <KeyRound size={18} />
              Se connecter
            </Button>

            <button
              type="button"
              onClick={() => void handleSendCode()}
              disabled={loading || !configured || cooldownSecs > 0}
              className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer text-center disabled:opacity-50"
            >
              {cooldownSecs > 0
                ? `Renvoyer le code (${cooldownSecs} s)`
                : 'Renvoyer le code'}
            </button>
          </div>
        ) : (
          <Button
            fullWidth
            onClick={() => void handleSendCode()}
            disabled={loading || !configured || cooldownSecs > 0}
          >
            <Mail size={18} />
            {cooldownSecs > 0
              ? `Patientez ${cooldownSecs} s…`
              : 'Recevoir un code par email'}
          </Button>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Button
          variant="secondary"
          fullWidth
          onClick={() => void handleGoogle()}
          disabled={loading || !configured}
        >
          Continuer avec Google
        </Button>

        {error && (
          <p className="text-sm text-danger text-center">{error}</p>
        )}

        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer text-center"
        >
          Continuer sans compte
        </button>
      </div>
    </AppShell>
  );
}
