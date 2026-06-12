import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { FeedbackButton } from '../components/feedback/FeedbackButton';
import { LastDrawnRuleCard } from '../components/game/LastDrawnRuleCard';
import { PlayerOrderRail } from '../components/game/PlayerOrderRail';
import { TurnPlayerCard } from '../components/game/TurnPlayerCard';
import { WatchStatusChip } from '../components/game/WatchStatusChip';
import { RuleListItem } from '../components/RuleListItem';
import { RuleTypeBadge } from '../components/RuleTypeBadge';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatActivePersistentMeta } from '../core/ruleHelpers';
import { useSpectatorStore } from '../stores/spectatorStore';
import type { Rule } from '../types';

export function WatchPage() {
  const { code: routeCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const snapshot = useSpectatorStore((s) => s.snapshot);
  const connectionStatus = useSpectatorStore((s) => s.connectionStatus);
  const error = useSpectatorStore((s) => s.error);
  const [codeInput, setCodeInput] = useState(routeCode ?? '');
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  useEffect(() => {
    if (!routeCode) return;

    const normalized = routeCode.trim().toUpperCase();
    setCodeInput(normalized);
    void useSpectatorStore.getState().join(normalized);

    return () => {
      useSpectatorStore.getState().leave();
    };
  }, [routeCode]);

  const handleJoin = async () => {
    const normalized = codeInput.trim().toUpperCase();
    const ok = await useSpectatorStore.getState().join(normalized);
    if (ok) {
      navigate(`/watch/${normalized}`, { replace: true });
    }
  };

  if (!snapshot) {
    return (
      <AppShell title="Spectateur" showBack backTo="/">
        <div className="flex flex-col gap-6 py-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-accent/15 border border-accent/30 p-4">
              <Eye size={32} className="text-accent" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="font-display text-xl text-foreground">
              Suivre une partie
            </h2>
            <p className="text-sm text-muted mt-2">
              Entrez le code affiché sur l’appareil de l’hôte.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Code à 6 caractères"
              maxLength={6}
              className="font-mono text-center text-lg tracking-[0.2em] uppercase"
              autoComplete="off"
              autoCapitalize="characters"
            />
            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}
            <Button
              fullWidth
              onClick={() => void handleJoin()}
              disabled={connectionStatus === 'loading'}
            >
              {connectionStatus === 'loading' ? 'Connexion…' : 'Rejoindre'}
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const { state: game, ruleSet, lastDrawnRule, lastDrawnBy } = snapshot;
  const currentPlayer = game.currentPlayers[game.currentPlayerIndex];

  const statusMessage =
    connectionStatus === 'ended'
      ? 'L’hôte a mis fin à la partie.'
      : connectionStatus === 'disconnected'
        ? 'L’hôte ne répond plus. La partie peut reprendre s’il revient.'
        : null;

  return (
    <AppShell
      title="Spectateur"
      showBack
      backTo="/watch"
      headerRight={
        <div className="flex items-center gap-1">
          <FeedbackButton sessionCode={snapshot.code} />
          <WatchStatusChip status={connectionStatus} code={snapshot.code} />
        </div>
      }
      className="!py-0 !px-0 max-w-none"
    >
      <PlayerOrderRail game={game} />

      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-lg flex-col">
        <div className="flex flex-1 flex-col gap-4 px-4 py-4">
          <TurnPlayerCard game={game} prominent />

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

          <div className="flex-1 min-h-4" />

          {statusMessage && (
            <p className="text-xs text-center text-muted px-2">{statusMessage}</p>
          )}

          {game.rulesToReactivateNextRound.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface-1 px-4 py-3">
              <p className="text-sm font-medium text-foreground mb-1">
                Indisponibles jusqu'au prochain tour
              </p>
              <ul className="flex flex-wrap gap-2 mt-2">
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

          {game.activePersistentRules.length > 0 ? (
            <CollapsibleSection
              title="Règles persistantes actives"
              count={game.activePersistentRules.length}
              defaultOpen
              maxHeight={game.activePersistentRules.length > 5 ? '12rem' : '16rem'}
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
                    onClick={() => setSelectedRule(ar.rule)}
                  />
                );
              })}
            </CollapsibleSection>
          ) : (
            <p className="text-xs text-center text-muted pb-2">
              Aucune règle persistante active.
            </p>
          )}

          <p className="text-[10px] text-center text-muted/80 pb-2">
            {ruleSet?.name ?? 'Partie'} · lecture seule
          </p>
        </div>
      </div>

      <Modal
        open={!!selectedRule}
        title={selectedRule?.title ?? ''}
        onClose={() => setSelectedRule(null)}
      >
        {selectedRule && (
          <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
            <RuleTypeBadge
              type={selectedRule.type}
              iconOnly
              className="inline-flex align-middle mr-2 -mt-0.5"
            />
            {selectedRule.description}
          </p>
        )}
      </Modal>
    </AppShell>
  );
}
