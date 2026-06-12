import { hasPendingPlayerChanges } from '../core/gameEngine';
import clsx from 'clsx';
import { LogOut, RotateCcw, Settings, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeedbackButton } from '../components/feedback/FeedbackButton';
import { LiveSessionBanner } from '../components/game/LiveSessionBanner';
import { TurnPlayerCard } from '../components/game/TurnPlayerCard';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { RuleListItem } from '../components/RuleListItem';
import { AppShell } from '../components/layout/AppShell';
import { RuleTypeBadge } from '../components/RuleTypeBadge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { formatActivePersistentMeta } from '../core/ruleHelpers';
import { useAppStore } from '../stores/appStore';
import { useLiveSessionStore } from '../stores/liveSessionStore';
import type { Rule } from '../types';

export function GamePage() {
  const navigate = useNavigate();
  const {
    game,
    ruleSets,
    drawRule,
    drawSpecialRule,
    nextPlayer,
    resetGame,
    resetRound,
  } = useAppStore();

  const [drawnRule, setDrawnRule] = useState<Rule | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmResetRound, setConfirmResetRound] = useState(false);
  const [cycleResetVisible, setCycleResetVisible] = useState(false);
  const [specialEventOpen, setSpecialEventOpen] = useState(false);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const lastTurnKeyRef = useRef('');
  const startHeartbeat = useLiveSessionStore((s) => s.startHeartbeat);
  const stopHeartbeat = useLiveSessionStore((s) => s.stopHeartbeat);
  const ensureSession = useLiveSessionStore((s) => s.ensureSession);

  const ruleSet = ruleSets.find((rs) => rs.id === game.selectedRuleSetId);

  useEffect(() => {
    if (game.isActive && ruleSet) {
      void ensureSession(ruleSet, game);
    }
    startHeartbeat(() => useAppStore.getState().game);
    return () => stopHeartbeat();
  }, [game.isActive, ruleSet, ensureSession, startHeartbeat, stopHeartbeat]);

  const turnKey = `${game.totalTurns}:${game.currentPlayerIndex}`;

  useEffect(() => {
    if (lastTurnKeyRef.current !== turnKey) {
      lastTurnKeyRef.current = turnKey;
      setHasDrawnThisTurn(false);
    }
  }, [turnKey]);

  const suggestDraw = !hasDrawnThisTurn;
  const suggestNext = hasDrawnThisTurn;
  const flowHighlight =
    'border-accent/60 bg-accent/15 text-foreground shadow-[0_0_16px_rgba(168,85,247,0.35)]';
  const flowMuted = 'opacity-45 hover:opacity-70';

  const currentPlayer = game.currentPlayers[game.currentPlayerIndex];
  const pendingChanges = hasPendingPlayerChanges(game);
  const specialHighlighted =
    game.specialHighlightPlayerId === currentPlayer?.id;

  if (!game.isActive || !currentPlayer || !ruleSet) {
    return (
      <AppShell title="Partie" showBack backTo="/">
        <p className="text-muted text-center py-12">Aucune partie en cours.</p>
        <Button fullWidth onClick={() => navigate('/setup')}>
          Configurer une partie
        </Button>
      </AppShell>
    );
  }

  const handleDraw = () => {
    const result = drawRule();
    if (!result.ok) {
      if (result.reason === 'cycle_reset') {
        setCycleResetVisible(true);
      } else {
        setInfo('Aucune règle disponible');
      }
      return;
    }
    if ('kind' in result) {
      setCycleResetVisible(false);
      setSpecialEventOpen(true);
      return;
    }
    setCycleResetVisible(false);
    setHasDrawnThisTurn(true);
    setDrawnRule(result.rule);
  };

  const handleSpecial = () => {
    const result = drawSpecialRule();
    if (!result.ok) {
      setInfo('Aucune règle spéciale disponible');
      return;
    }
    setHasDrawnThisTurn(true);
    setDrawnRule(result.rule);
  };

  const handleEnd = () => {
    resetGame();
    setConfirmEnd(false);
    navigate('/');
  };

  const handleResetRound = () => {
    resetRound();
    setConfirmResetRound(false);
    setCycleResetVisible(false);
  };

  return (
    <AppShell
      title="Partie en cours"
      headerRight={
        <div className="flex items-center gap-1">
          <FeedbackButton />
          <button
            type="button"
            onClick={() => setConfirmResetRound(true)}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Recommencer le tour"
          >
            <RotateCcw size={20} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/game/settings')}
            className="relative p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Paramètres joueurs"
          >
            <Settings size={20} />
            {pendingChanges && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setConfirmEnd(true)}
            className="p-2 rounded-xl text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            aria-label="Terminer la partie"
          >
            <LogOut size={20} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-36">
        <LiveSessionBanner />

        {cycleResetVisible && (
          <div className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3">
            <Sparkles size={18} className="text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-accent">
                Toutes les règles simples ont été tirées, on remélange !
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCycleResetVisible(false)}
              className="p-1 rounded-lg text-muted hover:text-foreground cursor-pointer"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {game.rulesToReactivateNextRound.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface-1 px-4 py-3">
            <p className="text-sm font-medium text-foreground mb-1">
              Indisponibles jusqu'au prochain tour
            </p>
            <p className="text-xs text-muted mb-2">
              Un joueur a quitté la partie — ces règles redeviendront disponibles au prochain tour.
            </p>
            <ul className="flex flex-wrap gap-2">
              {game.rulesToReactivateNextRound.map((rule) => (
                <li
                  key={rule.id}
                  className="text-xs text-muted bg-surface-2 rounded-lg px-2.5 py-1"
                >
                  {rule.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <TurnPlayerCard game={game} showTurnDots />

        {game.activePersistentRules.length > 0 && (
          <CollapsibleSection
            title="Règles persistantes actives"
            count={game.activePersistentRules.length}
            defaultOpen={game.activePersistentRules.length <= 3}
            maxHeight={game.activePersistentRules.length > 5 ? '10rem' : '14rem'}
          >
            {game.activePersistentRules.map((ar) => {
              const player =
                ar.playerId != null
                  ? game.currentPlayers.find((p) => p.id === ar.playerId)
                  : null;
              return (
                <RuleListItem
                  key={`${ar.rule.id}-${ar.playerId ?? 'all'}`}
                  title={ar.rule.title}
                  subtitle={ar.playerId === null ? 'Tout le monde' : player?.name}
                  meta={formatActivePersistentMeta(ar.rule, ar.remainingTours)}
                  onClick={() => setDrawnRule(ar.rule)}
                />
              );
            })}
          </CollapsibleSection>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-lg flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={handleSpecial}
              className={clsx(
                specialHighlighted &&
                  'border-accent/60 bg-accent/15 text-accent-foreground shadow-[0_0_16px_rgba(168,85,247,0.4)] animate-pulse',
              )}
            >
              <Sparkles size={18} />
              Spéciale
            </Button>
            <Button
              variant="secondary"
              onClick={() => nextPlayer()}
              className={clsx(
                suggestNext && flowHighlight,
                suggestDraw && flowMuted,
              )}
            >
              Suivant
            </Button>
          </div>
          <Button
            fullWidth
            onClick={handleDraw}
            className={clsx(
              suggestDraw &&
                'shadow-[0_0_20px_rgba(168,85,247,0.4)] ring-2 ring-accent/35',
              suggestNext && 'opacity-45 hover:opacity-65',
            )}
          >
            Piocher une règle
          </Button>
        </div>
      </div>

      <Modal
        open={specialEventOpen}
        title="Événement spécial !"
        onClose={() => setSpecialEventOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-accent/15 border border-accent/30 p-4 glow-accent">
              <Sparkles size={32} className="text-accent" />
            </div>
          </div>
          <p className="text-muted leading-relaxed text-center">
            <span className="font-semibold text-foreground">{currentPlayer.name}</span>
            , appuyez sur le bouton{' '}
            <span className="font-semibold text-accent">Spéciale</span> pour piocher
            une carte spéciale.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!drawnRule}
        title={drawnRule?.title ?? ''}
        onClose={() => setDrawnRule(null)}
      >
        {drawnRule && (
          <div className="flex flex-col gap-3">
            <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
              <RuleTypeBadge
                type={drawnRule.type}
                iconOnly
                className="inline-flex align-middle mr-2 -mt-0.5"
              />
              {drawnRule.description}
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!info}
        title="Information"
        message={info ?? ''}
        confirmLabel="OK"
        onConfirm={() => setInfo(null)}
        onCancel={() => setInfo(null)}
      />

      <ConfirmDialog
        open={confirmResetRound}
        title="Recommencer"
        message="Recommencer à zéro avec les mêmes joueurs et la même liste ? Les règles actives et le tour en cours seront réinitialisés."
        confirmLabel="Recommencer"
        onConfirm={handleResetRound}
        onCancel={() => setConfirmResetRound(false)}
      />

      <ConfirmDialog
        open={confirmEnd}
        title="Fin de partie"
        message="Êtes-vous sûr de vouloir terminer la partie ?"
        confirmLabel="Terminer"
        destructive
        onConfirm={handleEnd}
        onCancel={() => setConfirmEnd(false)}
      />
    </AppShell>
  );
}
