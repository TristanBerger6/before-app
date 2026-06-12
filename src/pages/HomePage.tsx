import { Cloud, Eye, Layers, LogOut, Play, Sparkles, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';

export function HomePage() {
  const navigate = useNavigate();
  const { game, resetGame } = useAppStore();
  const { user, signOut } = useAuthStore();
  const authEnabled = isSupabaseConfigured();

  const email = user?.email ?? user?.user_metadata?.full_name;

  return (
    <AppShell className="flex flex-col justify-center min-h-[85dvh] py-8">
      <div className="w-full flex flex-col items-center text-center animate-in">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30 glow-accent">
            <Sparkles size={28} className="text-accent" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-display text-5xl sm:text-6xl text-foreground tracking-tight">
              Before
            </h1>
            <p className="text-muted mt-3 text-base leading-relaxed max-w-sm mx-auto">
              Le jeu qu&apos;on lance avant de sortir, ou même après.
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-3">
          <Button
            fullWidth
            onClick={() => {
              resetGame();
              navigate('/setup');
            }}
          >
            <Play size={18} />
            Nouvelle partie
          </Button>
          {game.isActive && (
            <Button fullWidth variant="secondary" onClick={() => navigate('/game')}>
              Reprendre la partie
            </Button>
          )}
          <Button fullWidth variant="secondary" onClick={() => navigate('/sets')}>
            <Layers size={18} />
            Mes listes de règles
          </Button>
          {authEnabled && (
            <Button fullWidth variant="secondary" onClick={() => navigate('/watch')}>
              <Eye size={18} />
              Rejoindre la partie
            </Button>
          )}

          {authEnabled && (
            user ? (
              <div className="mt-2 pt-4 border-t border-border/80 flex flex-col gap-2">
                <p className="text-xs text-muted truncate px-1">
                  <Cloud size={12} className="inline mr-1 -mt-0.5" />
                  {email}
                </p>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => void signOut().then(() => navigate('/'))}
                >
                  <LogOut size={16} />
                  Se déconnecter
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                fullWidth
                onClick={() => navigate('/auth')}
                className="mt-2"
              >
                <User size={16} />
                Sauvegarder mes listes (connexion)
              </Button>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
