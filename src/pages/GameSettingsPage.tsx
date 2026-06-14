import { Layers } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PlayerList } from '../components/PlayerList';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/Input';
import { useAppStore } from '../stores/appStore';
import type { Player } from '../types';

export function GameSettingsPage() {
  const navigate = useNavigate();
  const { game, ruleSets, addPlayer, removePlayer, reorderPlayers } = useAppStore();
  const activeRuleSet = ruleSets.find((rs) => rs.id === game.selectedRuleSetId);

  const [playerName, setPlayerName] = useState('');
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!game.isActive) {
    return (
      <AppShell title="Paramètres" showBack backTo="/">
        <p className="text-muted text-center py-12">Aucune partie en cours.</p>
        <Button fullWidth onClick={() => navigate('/setup')}>
          Configurer une partie
        </Button>
      </AppShell>
    );
  }

  const handleAddPlayer = () => {
    const name = playerName.trim();
    if (!name) return;
    addPlayer(name);
    setPlayerName('');
  };

  const handleRemove = (player: Player) => {
    if (game.nextRoundPlayers.length <= 2) {
      setError('Il faut au moins 2 joueurs pour le prochain tour');
      return;
    }
    setDeletePlayer(player);
  };

  return (
    <AppShell title="Paramètres" showBack backTo="/game">
      <div className="flex flex-col gap-6 pb-8">
        <section>
          <h2 className="font-display text-lg mb-2">Joueurs</h2>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Les modifications s&apos;appliquent au{' '}
            <span className="text-foreground font-medium">prochain tour</span>{' '}
            (quand tous les joueurs auront rejoué une fois).
          </p>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nom du joueur"
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
              />
            </div>
            <Button onClick={handleAddPlayer} className="px-5">
              +
            </Button>
          </div>
          <PlayerList
            players={game.nextRoundPlayers}
            onReorder={reorderPlayers}
            onRemove={handleRemove}
          />
        </section>

        {game.selectedRuleSetId && activeRuleSet && (
          <section>
            <h2 className="font-display text-lg mb-3">Liste de règles</h2>
            <p className="text-sm text-muted leading-relaxed mb-3">
              Activez, désactivez, ajoutez ou modifiez des règles pendant la
              partie. Les changements s&apos;appliquent au tirage après
              enregistrement.
            </p>
            <Button
              variant="secondary"
              fullWidth
              onClick={() =>
                navigate(`/sets/${game.selectedRuleSetId}`, {
                  state: { returnTo: '/game' },
                })
              }
            >
              <Layers size={18} />
              Modifier « {activeRuleSet.name} »
            </Button>
          </section>
        )}

        <section>
          <h2 className="font-display text-lg mb-3">Tour actuel</h2>
          <ul className="flex flex-col gap-2">
            {game.currentPlayers.map((player, index) => (
              <li
                key={player.id}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  index === game.currentPlayerIndex
                    ? 'border-accent/50 bg-accent/10 text-foreground font-medium'
                    : 'border-border bg-surface-1 text-muted'
                }`}
              >
                {player.name}
                {index === game.currentPlayerIndex && (
                  <span className="ml-2 text-accent text-xs">· en cours</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <ConfirmDialog
        open={!!deletePlayer}
        title="Supprimer le joueur"
        message={`Retirer ${deletePlayer?.name} à partir du prochain tour ? Ses règles actives seront annulées.`}
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => {
          if (deletePlayer) removePlayer(deletePlayer.id);
          setDeletePlayer(null);
        }}
        onCancel={() => setDeletePlayer(null)}
      />

      <ConfirmDialog
        open={!!error}
        title="Erreur"
        message={error ?? ''}
        confirmLabel="OK"
        onConfirm={() => setError(null)}
        onCancel={() => setError(null)}
      />
    </AppShell>
  );
}
