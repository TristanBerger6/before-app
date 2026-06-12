import { Check, ChevronRight, Copy, Loader2, Radio, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { buildWatchUrl } from '../../lib/liveSessionConfig';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';
import { useLiveSessionStore } from '../../stores/liveSessionStore';
import { Modal } from '../ui/Modal';

export function LiveSessionBanner() {
  const credentials = useLiveSessionStore((s) => s.credentials);
  const isSyncing = useLiveSessionStore((s) => s.isSyncing);
  const sessionError = useLiveSessionStore((s) => s.sessionError);
  const ensureSession = useLiveSessionStore((s) => s.ensureSession);
  const game = useAppStore((s) => s.game);
  const ruleSets = useAppStore((s) => s.ruleSets);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  if (!isSupabaseConfigured()) return null;

  const ruleSet = ruleSets.find((rs) => rs.id === game.selectedRuleSetId);

  const retry = () => {
    if (ruleSet) void ensureSession(ruleSet, game);
  };

  const close = () => {
    setOpen(false);
    setCopied(null);
  };

  const copy = async (value: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard indisponible
    }
  };

  if (!credentials) {
    return (
      <>
        <button
          type="button"
          onClick={() => sessionError && setOpen(true)}
          disabled={isSyncing && !sessionError}
          className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface-1 px-3 py-2 text-left transition-colors hover:bg-surface-2 disabled:opacity-80 cursor-pointer disabled:cursor-default"
        >
          {isSyncing ? (
            <Loader2 size={14} className="text-muted shrink-0 animate-spin" />
          ) : (
            <Radio size={14} className="text-muted shrink-0" />
          )}
          <span className="flex-1 min-w-0 text-sm text-muted truncate">
            {isSyncing ? 'Préparation de la diffusion…' : 'Diffusion indisponible'}
          </span>
          {sessionError && (
            <ChevronRight size={16} className="text-muted shrink-0" />
          )}
        </button>

        <Modal open={open} title="Diffuser la partie" onClose={close}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted leading-relaxed">{sessionError}</p>
            {ruleSet && (
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-accent hover:underline cursor-pointer"
              >
                <RefreshCw size={14} />
                Réessayer
              </button>
            )}
          </div>
        </Modal>
      </>
    );
  }

  const watchUrl = buildWatchUrl(credentials.code);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-left transition-colors hover:bg-accent/15 cursor-pointer"
      >
        <Radio size={14} className="text-accent shrink-0" />
        <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
          Diffuser la partie
        </span>
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent animate-pulse"
          aria-hidden
        />
        <ChevronRight size={16} className="text-muted shrink-0" />
      </button>

      <Modal open={open} title="Diffuser la partie" onClose={close}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted leading-relaxed">
            Partagez le code ou le lien pour qu’un autre appareil suive la partie
            en temps réel — sans compte.
          </p>

          <div className="rounded-xl border border-border bg-surface-2 p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">
              Code de la partie
            </p>
            <button
              type="button"
              onClick={() => void copy(credentials.code, 'code')}
              className="inline-flex items-center gap-2 font-mono text-2xl font-bold tracking-[0.2em] text-foreground hover:text-accent transition-colors cursor-pointer"
            >
              {credentials.code}
              {copied === 'code' ? (
                <Check size={18} className="text-accent" />
              ) : (
                <Copy size={18} className="text-muted" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => void copy(watchUrl, 'link')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
          >
            {copied === 'link' ? (
              <>
                <Check size={16} className="text-accent" />
                Lien copié
              </>
            ) : (
              <>
                <Copy size={16} className="text-muted" />
                Copier le lien spectateur
              </>
            )}
          </button>

          <p className="text-xs text-muted text-center break-all">{watchUrl}</p>
        </div>
      </Modal>
    </>
  );
}
