import clsx from 'clsx';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backTo?: string;
  headerRight?: ReactNode;
  className?: string;
}

export function AppShell({
  children,
  title,
  showBack,
  backTo,
  headerRight,
  className,
}: AppShellProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <div className="min-h-dvh bg-app bg-noise text-foreground flex flex-col">
      {(title || showBack || headerRight) && (
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
            <div className="flex items-center gap-2 min-w-0">
              {showBack && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-2 -ml-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
                  aria-label="Retour"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              {title && (
                <h1 className="font-display text-lg truncate text-foreground">
                  {title}
                </h1>
              )}
            </div>
            {headerRight && <div className="shrink-0">{headerRight}</div>}
          </div>
        </header>
      )}
      <main className={clsx('flex-1 mx-auto w-full max-w-lg px-4 py-6', className)}>
        {children}
      </main>
    </div>
  );
}
