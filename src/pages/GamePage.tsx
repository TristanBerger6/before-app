import { hasPendingPlayerChanges } from '../core/gameEngine';
import clsx from 'clsx';
import { LogOut, RotateCcw, Settings, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeedbackButton } from '../components/feedback/FeedbackButton';
import { LastDrawnRuleCard } from '../components/game/LastDrawnRuleCard';
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
    nextPlayer,
    resetGame,
    resetRound,
  } = useAppStore();

  const [drawnRule, setDrawnRule] = useState<Rule | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmResetRound, setConfirmResetRound] = useState(false);
  const [cycleResetVisible, setCycleResetVisible] = useState(false);
  const lastDrawnRule = useLiveSessionStore((s) => s.lastDrawnRule);
  const lastDrawnBy = useLiveSessionStore((s) => s.lastDrawnBy);
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

  const suggestDraw = !game.hasDrawnThisTurn;
  const suggestNext = game.hasDrawnThisTurn;
  const flowHighlight =
    'border-accent/60 bg-accent/15 text-foreground shadow-[0_0_16px_rgba(168,85,247,0.35)]';
  const flowMuted = 'opacity-45 hover:opacity-70';

  const currentPlayer = game.currentPlayers[game.currentPlayerIndex];
  const pendingChanges = hasPendingPlayerChanges(game);

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
    setCycleResetVisible(false);
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

  const isSpecialDraw = drawnRule?.type === 'special';

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

        {lastDrawnRule ? (
          <LastDrawnRuleCard
            rule={lastDrawnRule}
            drawnBy={lastDrawnBy}
            currentPlayer={currentPlayer}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface-1/50 px-4 py-8 text-center">
            <p className="text-sm text-muted">Aucune règle piochée pour l’instant.</p>
          </div>
        )}

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
        open={!!drawnRule}
        title={drawnRule?.title ?? ''}
        variant={isSpecialDraw ? 'special' : 'default'}
        onClose={() => setDrawnRule(null)}
      >
        {drawnRule && (
          <div className="flex flex-col gap-3">
            {isSpecialDraw && (
              <div className="flex justify-center pb-1">
                <div className="rounded-full bg-accent/20 border border-accent/40 p-3 glow-accent animate-pulse">
                  <Sparkles size={28} className="text-accent" />
                </div>
              </div>
            )}
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
