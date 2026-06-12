import { Bug, Lightbulb, LogIn, Send } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildAuthPath } from '../../lib/authRedirect';
import { isSupabaseConfigured } from '../../lib/supabase';
import { submitFeedback, type FeedbackKind } from '../../storage/feedback';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import clsx from 'clsx';

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  sessionCode?: string | null;
}

export function FeedbackDialog({
  open,
  onClose,
  sessionCode,
}: FeedbackDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const [kind, setKind] = useState<FeedbackKind>('idea');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const configured = isSupabaseConfigured();
  const returnPath = `${location.pathname}${location.search}`;

  const handleClose = () => {
    onClose();
    setError(null);
    setSent(false);
    setMessage('');
    setKind('idea');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const result = await submitFeedback({
      kind,
      message,
      page: location.pathname,
      sessionCode: sessionCode ?? undefined,
      metadata: {
        userAgent: navigator.userAgent,
        href: window.location.href,
      },
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSent(true);
  };

  if (!open) return null;

  if (!configured) {
    return (
      <Modal open title="Retour" onClose={handleClose}>
        <p className="text-sm text-muted leading-relaxed">
          Le feedback nécessite une connexion Supabase configurée.
        </p>
      </Modal>
    );
  }

  if (!user) {
    return (
      <Modal
        open
        title="Retour"
        onClose={handleClose}
        footer={
          <Button
            fullWidth
            onClick={() => {
              handleClose();
              navigate(buildAuthPath(returnPath, true));
            }}
          >
            <LogIn size={18} />
            Se connecter
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-4 py-1 text-center">
          <div className="rounded-full bg-accent/15 border border-accent/30 p-4">
            <LogIn size={28} className="text-accent" />
          </div>
          <div>
            <p className="font-display text-lg text-foreground">
              Connecte-toi pour nous écrire
            </p>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              Bug ou idée : un compte est nécessaire pour envoyer un message.
              Tu pourras reprendre la partie ou le mode spectateur ensuite.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  if (sent) {
    return (
      <Modal open title="Merci !" onClose={handleClose}>
        <p className="text-sm text-muted leading-relaxed text-center py-2">
          Votre message a bien été enregistré. On le lit avec attention.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      title="Bug ou idée"
      onClose={handleClose}
      footer={
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={() => void handleSubmit()} disabled={loading}>
            <Send size={18} />
            {loading ? 'Envoi…' : 'Envoyer'}
          </Button>
          <Button variant="ghost" fullWidth onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted leading-relaxed">
          Décrivez un bug ou proposez une amélioration. Un message par minute maximum.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'idea' as const, label: 'Idée', icon: Lightbulb },
              { id: 'bug' as const, label: 'Bug', icon: Bug },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={clsx(
                'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                kind === id
                  ? 'border-accent/50 bg-accent/10 text-foreground'
                  : 'border-border bg-surface-2 text-muted hover:bg-surface-3',
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <Textarea
          label="Message"
          dismissKeyboardOnEnter={false}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Décrivez ce qui s'est passé ou ce que vous aimeriez voir…"
          rows={5}
          maxLength={2000}
          disabled={loading}
        />

        <p className="text-xs text-muted">
          Envoyé en tant que {user.email ?? 'utilisateur connecté'}
        </p>

        {error && <p className="text-sm text-danger text-center">{error}</p>}
      </div>
    </Modal>
  );
}
