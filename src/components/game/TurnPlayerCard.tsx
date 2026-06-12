import clsx from 'clsx';
import { getCurrentTour } from '../../core/gameEngine';
import { getPlayerAccentColor } from '../../core/playerColor';
import type { GameState } from '../../types';

interface TurnPlayerCardProps {
  game: GameState;
  /** Points de progression à droite (écran hôte). */
  showTurnDots?: boolean;
  /** Mise en avant (écran spectateur). */
  prominent?: boolean;
}

export function TurnPlayerCard({
  game,
  showTurnDots = false,
  prominent = false,
}: TurnPlayerCardProps) {
  const currentPlayer = game.currentPlayers[game.currentPlayerIndex];
  if (!currentPlayer) return null;

  const tour = getCurrentTour(game);
  const playerColor = getPlayerAccentColor(currentPlayer.id);

  return (
    <div
      className={clsx(
        'rounded-2xl border bg-surface-1/90 backdrop-blur-sm',
        prominent
          ? 'border-accent/35 bg-accent/5 px-5 py-5'
          : 'border-border/80 px-4 py-3',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'flex shrink-0 items-center justify-center rounded-full font-display font-semibold',
            prominent ? 'h-14 w-14 text-2xl' : 'h-10 w-10 text-lg',
          )}
          style={{
            color: playerColor,
            backgroundColor: `${playerColor}22`,
            border: `1px solid ${playerColor}44`,
          }}
          aria-hidden
        >
          {currentPlayer.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent/80 mb-0.5">
            C&apos;est son tour
          </p>
          <p
            className={clsx(
              'font-display leading-tight text-foreground truncate',
              prominent ? 'text-2xl sm:text-3xl' : 'text-xl',
            )}
          >
            {currentPlayer.name}
          </p>
          <p className="text-xs text-muted mt-1 tabular-nums">
            Tour {tour} · {game.currentPlayerIndex + 1}/
            {game.currentPlayers.length}
          </p>
        </div>
        {showTurnDots && (
          <div
            className="flex items-center gap-1 shrink-0"
            aria-label={`Joueur ${game.currentPlayerIndex + 1} sur ${game.currentPlayers.length}`}
          >
            {game.currentPlayers.map((player, index) => {
              const color = getPlayerAccentColor(player.id);
              const active = index === game.currentPlayerIndex;
              return (
                <span
                  key={player.id}
                  className={clsx(
                    'h-1.5 rounded-full transition-all duration-200',
                    active ? 'w-3.5' : 'w-1.5 bg-surface-3',
                  )}
                  style={active ? { backgroundColor: color } : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
