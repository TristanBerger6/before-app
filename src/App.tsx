import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { GameSettingsPage } from './pages/GameSettingsPage';
import { GameSetupPage } from './pages/GameSetupPage';
import { HomePage } from './pages/HomePage';
import { RuleEditPage } from './pages/RuleEditPage';
import { RuleSetEditPage } from './pages/RuleSetEditPage';
import { RuleSetListPage } from './pages/RuleSetListPage';
import { useAppStore } from './stores/appStore';

function HydrationGate({ children }: { children: ReactNode }) {
  const { isHydrated, hydrate } = useAppStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted text-sm">Chargement...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <HydrationGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
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
