import { Layers, Play, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../stores/appStore';

export function HomePage() {
  const navigate = useNavigate();
  const { game, resetGame } = useAppStore();

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
            <p className="text-muted mt-3 text-base leading-relaxed max-w-xs mx-auto">
              Le jeu qu&apos;on lance avant de sortir. Créez vos règles, passez le
              tel, et c&apos;est parti.
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
            Mes sets de règles
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
