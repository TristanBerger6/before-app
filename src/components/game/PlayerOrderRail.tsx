import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getPlayerAccentColor } from '../../core/playerColor';
import type { GameState, Player } from '../../types';
import { Modal } from '../ui/Modal';

const PREVIEW_MAX = 5;

interface PlayerOrderRailProps {
  game: GameState;
}

function getPreviewWindow(
  total: number,
  currentIndex: number,
  maxVisible: number,
): { indices: number[]; hasBefore: boolean; hasAfter: boolean } {
  if (total <= maxVisible) {
    return {
      indices: Array.from({ length: total }, (_, i) => i),
      hasBefore: false,
      hasAfter: false,
    };
  }

  const half = Math.floor(maxVisible / 2);
  let start = currentIndex - half;
  let end = start + maxVisible - 1;

  if (start < 0) {
    start = 0;
    end = maxVisible - 1;
  }
  if (end >= total) {
    end = total - 1;
    start = end - maxVisible + 1;
  }

  return {
    indices: Array.from({ length: end - start + 1 }, (_, i) => start + i),
    hasBefore: start > 0,
    hasAfter: end < total - 1,
  };
}

function PlayerChip({
  player,
  index,
  isActive,
  size = 'md',
}: {
  player: Player;
  index: number;
  isActive: boolean;
  size?: 'sm' | 'md';
}) {
  const color = getPlayerAccentColor(player.id);

  return (
    <span
      className={clsx(
        'relative flex shrink-0 items-center justify-center rounded-full font-display font-semibold transition-transform',
        size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm',
        isActive && 'scale-110 ring-2 ring-accent ring-offset-2 ring-offset-background',
      )}
      style={{
        color,
        backgroundColor: `${color}22`,
        border: `1px solid ${color}${isActive ? '' : '55'}`,
      }}
      title={player.name}
    >
      {player.name.charAt(0)}
      <span
        className={clsx(
          'absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full font-bold tabular-nums',
          size === 'sm' ? 'h-4 w-4 text-[9px]' : 'h-4 w-4 text-[9px]',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'bg-surface-2 text-muted border border-border',
        )}
      >
        {index + 1}
      </span>
    </span>
  );
}

export function PlayerOrderRail({ game }: PlayerOrderRailProps) {
  const [open, setOpen] = useState(false);
  const players = game.currentPlayers;
  const currentIndex = game.currentPlayerIndex;

  const preview = useMemo(
    () => getPreviewWindow(players.length, currentIndex, PREVIEW_MAX),
    [players.length, currentIndex],
  );

  if (players.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sticky top-14 z-30 w-full border-b border-border/80 bg-background/90 backdrop-blur-md cursor-pointer hover:bg-surface-1/80 transition-colors"
        aria-label="Voir l'ordre de jeu complet"
      >
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-2.5">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Ordre
          </span>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
            {preview.hasBefore && (
              <span className="shrink-0 px-0.5 text-muted/60 text-sm tracking-widest">
                …
              </span>
            )}

            {preview.indices.map((index, i) => {
              const player = players[index];
              const isActive = index === currentIndex;

              return (
                <span key={player.id} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <ChevronRight
                      size={12}
                      className="shrink-0 text-border-strong"
                      aria-hidden
                    />
                  )}
                  <PlayerChip
                    player={player}
                    index={index}
                    isActive={isActive}
                    size="sm"
                  />
                </span>
              );
            })}

            {preview.hasAfter && (
              <span className="shrink-0 px-0.5 text-muted/60 text-sm tracking-widest">
                …
              </span>
            )}
          </div>

          <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />
        </div>
      </button>

      <Modal open={open} title="Ordre de jeu" onClose={() => setOpen(false)}>
        <p className="text-sm text-muted mb-4">
          {players.length} joueur{players.length > 1 ? 's' : ''} · sens horaire
        </p>
        <ol className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto -mx-1 px-1">
          {players.map((player, index) => {
            const isActive = index === currentIndex;

            return (
              <li key={player.id}>
                <div
                  className={clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5',
                    isActive ? 'bg-accent/10 border border-accent/25' : 'opacity-80',
                  )}
                >
                  <span
                    className={clsx(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-surface-2 text-muted border border-border',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold"
                    style={{
                      color: getPlayerAccentColor(player.id),
                      backgroundColor: `${getPlayerAccentColor(player.id)}22`,
                      border: `1px solid ${getPlayerAccentColor(player.id)}44`,
                    }}
                  >
                    {player.name.charAt(0)}
                  </span>
                  <span
                    className={clsx(
                      'flex-1 min-w-0 truncate text-sm',
                      isActive ? 'font-semibold text-foreground' : 'text-muted',
                    )}
                  >
                    {player.name}
                  </span>
                  {isActive && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-accent">
                      Son tour
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Modal>
    </>
  );
}
