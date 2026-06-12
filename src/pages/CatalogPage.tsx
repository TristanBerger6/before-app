import { Library, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchCatalogLists } from '../storage/catalogRuleLists';
import { useAppStore } from '../stores/appStore';
import type { CatalogListEntry } from '../types/catalog';

export function CatalogPage() {
  const addFromCatalog = useAppStore((s) => s.addFromCatalog);
  const [entries, setEntries] = useState<CatalogListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        setEntries(await fetchCatalogLists());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Impossible de charger le catalogue',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async (id: string) => {
    setAddingId(id);
    try {
      const added = await addFromCatalog(id);
      if (added) {
        showToast(`« ${added.name} » ajoutée à vos listes`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible d\'ajouter cette liste',
      );
    } finally {
      setAddingId(null);
    }
  };

  return (
    <AppShell title="Catalogue" showBack backTo="/sets">
      <div className="flex flex-col gap-4 pb-8">
        <p className="text-sm text-muted leading-relaxed">
          Listes préconçues par Before. Ajoutez-en une à vos listes pour la modifier
          et lancer une partie — votre copie reste indépendante du catalogue.
        </p>

        {!isSupabaseConfigured() && (
          <Card className="text-sm text-muted">
            Le catalogue nécessite une connexion à Supabase (non configuré sur cet
            environnement).
          </Card>
        )}

        {loading && (
          <p className="text-center text-muted py-12 text-sm">Chargement…</p>
        )}

        {error && (
          <Card className="text-sm text-danger border-danger/30 bg-danger/5">
            {error}
          </Card>
        )}

        {!loading && !error && entries.length === 0 && isSupabaseConfigured() && (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <Library size={28} className="text-muted" />
            <p className="text-muted text-sm">Aucune liste dans le catalogue pour l'instant.</p>
          </Card>
        )}

        {entries.map((entry) => (
          <Card key={entry.id} className="flex flex-col gap-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg">{entry.name}</h2>
                <span className="shrink-0 rounded-lg bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  {entry.authorType === 'official' ? 'Officiel' : 'Communauté'}
                </span>
              </div>
              {entry.description && (
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  {entry.description}
                </p>
              )}
              <p className="text-xs text-muted mt-2">
                {entry.payload.rules.length} règle
                {entry.payload.rules.length !== 1 ? 's' : ''} · v{entry.version}
              </p>
            </div>
            <Button
              fullWidth
              variant="secondary"
              disabled={addingId === entry.id}
              onClick={() => void handleAdd(entry.id)}
            >
              <Plus size={18} />
              {addingId === entry.id ? 'Ajout…' : 'Ajouter à mes listes'}
            </Button>
          </Card>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-surface-2 border border-border text-sm text-foreground shadow-lg z-50">
          {toast}
        </div>
      )}
    </AppShell>
  );
}
