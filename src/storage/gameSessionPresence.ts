import { createId } from '../core/ids';
import { getSupabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function gameSessionPresenceChannelName(sessionId: string): string {
  return `presence:game_session:${sessionId}`;
}

export function countSpectatorPresence(channel: RealtimeChannel): number {
  return Object.keys(channel.presenceState()).length;
}

/** Déclare la présence d'un spectateur sur le canal de la session. */
export function trackSpectatorPresence(sessionId: string): () => void {
  const supabase = getSupabase();
  const channel = supabase.channel(gameSessionPresenceChannelName(sessionId), {
    config: {
      presence: {
        key: createId(),
      },
    },
  });

  void channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ role: 'spectator' });
    }
  });

  return () => {
    void channel.untrack();
    void supabase.removeChannel(channel);
  };
}

/** Compte les spectateurs connectés (l'hôte n'annonce pas sa présence). */
export function watchSpectatorPresence(
  sessionId: string,
  onCount: (count: number) => void,
): () => void {
  const supabase = getSupabase();
  const channel = supabase.channel(gameSessionPresenceChannelName(sessionId));

  const refresh = () => {
    onCount(countSpectatorPresence(channel));
  };

  channel
    .on('presence', { event: 'sync' }, refresh)
    .on('presence', { event: 'join' }, refresh)
    .on('presence', { event: 'leave' }, refresh)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        refresh();
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
