import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PlayerList } from '../components/PlayerList';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/Input';
import { useAppStore } from '../stores/appStore';
import type { Player } from '../types';

export function GameSetupPage() {
  const navigate = useNavigate();
  const {
    ruleSets,
    game,
    addPlayer,
    removePlayer,
    reorderPlayers,
    selectRuleSet,
    startGame,
  } = useAppStore();

  const [playerName, setPlayerName] = useState('');
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddPlayer = () => {
    const name = playerName.trim();
    if (!name) return;
    addPlayer(name);
    setPlayerName('');
  };

  const handleStart = () => {
    if (game.nextRoundPlayers.length < 2) {
      setError('Il faut au moins 2 joueurs pour commencer');
      return;
    }
    if (!game.selectedRuleSetId) {
      setError('Sélectionnez une liste de règles');
      return;
    }
    startGame();
    navigate('/game');
  };

  return (
    <AppShell title="Configuration" showBack backTo="/">
      <div className="flex flex-col gap-8 pb-28">
        <section>
          <h2 className="font-display text-lg mb-4">Joueurs</h2>
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
            onRemove={(p) => {
              if (game.nextRoundPlayers.length <= 2) {
                setError('Il faut au moins 2 joueurs');
                return;
              }
              setDeletePlayer(p);
            }}
          />
        </section>

        <section>
          <h2 className="font-display text-lg mb-4">Liste de règles</h2>
          {ruleSets.length === 0 ? (
            <p className="text-sm text-muted">
              Aucune liste disponible.{' '}
              <button
                type="button"
                onClick={() => navigate('/sets')}
                className="text-accent underline cursor-pointer"
              >
                Créer une liste
              </button>
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {ruleSets.map((set) => (
                <button
                  key={set.id}
                  type="button"
                  onClick={() => selectRuleSet(set.id)}
                  className={`shrink-0 w-44 p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                    game.selectedRuleSetId === set.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-surface-1 hover:bg-surface-2'
                  }`}
                >
                  <p className="font-medium truncate">{set.name}</p>
                  <p className="text-sm text-muted mt-1">
                    {set.rules.length} règles
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="mx-auto max-w-lg">
          <Button fullWidth onClick={handleStart}>
            Commencer la partie
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deletePlayer}
        title="Supprimer le joueur"
        message={`Retirer ${deletePlayer?.name} de la partie ?`}
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
