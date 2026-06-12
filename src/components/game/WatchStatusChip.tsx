import clsx from 'clsx';
import { Radio, WifiOff } from 'lucide-react';
import type { SpectatorConnectionStatus } from '../../types/liveSession';

interface WatchStatusChipProps {
  status: SpectatorConnectionStatus;
  code?: string;
}

export function WatchStatusChip({ status, code }: WatchStatusChipProps) {
  if (status === 'idle' || status === 'loading') return null;

  const config = (() => {
    if (status === 'ended') {
      return { label: 'Terminée', tone: 'muted' as const, Icon: Radio };
    }
    if (status === 'disconnected') {
      return { label: 'Hors ligne', tone: 'muted' as const, Icon: WifiOff };
    }
    return { label: code ?? 'Live', tone: 'live' as const, Icon: Radio };
  })();

  const { label, tone, Icon } = config;

  return (
    <div
      className={clsx(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        tone === 'live'
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-border bg-surface-2 text-muted',
      )}
    >
      {tone === 'live' && (
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
      )}
      <Icon size={12} className={tone === 'live' ? 'text-accent' : undefined} />
      <span className="max-w-[5rem] truncate tabular-nums">{label}</span>
    </div>
  );
}
