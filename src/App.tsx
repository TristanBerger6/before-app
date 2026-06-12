import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MigrateLocalListsDialog } from './components/MigrateLocalListsDialog';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AuthPage } from './pages/AuthPage';
import { GamePage } from './pages/GamePage';
import { GameSettingsPage } from './pages/GameSettingsPage';
import { GameSetupPage } from './pages/GameSetupPage';
import { HomePage } from './pages/HomePage';
import { RuleEditPage } from './pages/RuleEditPage';
import { RuleSetEditPage } from './pages/RuleSetEditPage';
import { RuleSetListPage } from './pages/RuleSetListPage';
import { useAppStore } from './stores/appStore';
import { useAuthStore } from './stores/authStore';

function HydrationGate({ children }: { children: ReactNode }) {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const hydrate = useAppStore((s) => s.hydrate);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const handleAuthChange = useAppStore((s) => s.handleAuthChange);

  useEffect(() => {
    void (async () => {
      await initializeAuth();
      await hydrate();
    })();
  }, [hydrate, initializeAuth]);

  useEffect(() => {
    if (!isAuthReady || !isHydrated) return;

    let prevUserId = useAuthStore.getState().user?.id ?? null;

    const unsub = useAuthStore.subscribe((state) => {
      const nextUserId = state.user?.id ?? null;
      if (nextUserId !== prevUserId) {
        prevUserId = nextUserId;
        void handleAuthChange(state.user);
      }
    });

    return unsub;
  }, [isAuthReady, isHydrated, handleAuthChange]);

  if (!isHydrated || !isAuthReady) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      {children}
      <MigrateLocalListsDialog />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <HydrationGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/sets" element={<RuleSetListPage />} />
          <Route path="/sets/:id" element={<RuleSetEditPage />} />
          <Route path="/sets/:setId/rules/:ruleId" element={<RuleEditPage />} />
          <Route path="/setup" element={<GameSetupPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/game/settings" element={<GameSettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HydrationGate>
    </BrowserRouter>
  );
}
