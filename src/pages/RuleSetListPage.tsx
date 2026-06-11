import { Download, Plus, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAppStore } from '../stores/appStore';

export function RuleSetListPage() {
  const navigate = useNavigate();
  const { ruleSets, deleteRuleSet, exportRuleSet, importRuleSet } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleImport = async (file: File) => {
    try {
      const imported = await importRuleSet(file);
      showToast(`« ${imported.name} » importé`);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Erreur lors de l\'import',
      );
    }
  };

  return (
    <AppShell
      title="Sets de règles"
      showBack
      backTo="/"
      headerRight={
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <Upload size={16} />
          Importer
        </button>
      }
    >
      <div className="flex flex-col gap-3 pb-24">
        {ruleSets.length === 0 ? (
          <p className="text-center text-muted py-12">
            Aucun set de règles. Créez-en un ou importez-en un pour commencer.
          </p>
        ) : (
          ruleSets.map((set) => (
            <Card key={set.id} className="flex flex-col gap-4">
              <div
                className="cursor-pointer"
                onClick={() => navigate(`/sets/${set.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/sets/${set.id}`)}
                role="button"
                tabIndex={0}
              >
                <h2 className="font-display text-lg">{set.name}</h2>
                <p className="text-sm text-muted mt-1">
                  {set.rules.length} règle{set.rules.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 py-2.5"
                  onClick={() => navigate(`/sets/${set.id}`)}
                >
                  Modifier
                </Button>
                <Button
                  variant="secondary"
                  className="px-4 py-2.5"
                  onClick={() => {
                    exportRuleSet(set.id);
                    showToast(`« ${set.name} » exporté`);
                  }}
                  aria-label="Exporter"
                >
                  <Download size={18} />
                </Button>
                <Button
                  variant="danger"
                  className="px-4 py-2.5"
                  onClick={() => setDeleteId(set.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImport(file);
          e.target.value = '';
        }}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="mx-auto max-w-lg">
          <Button fullWidth onClick={() => navigate('/sets/new')}>
            <Plus size={18} />
            Nouveau set
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer le set"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => {
          if (deleteId) void deleteRuleSet(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={!!importError}
        title="Import impossible"
        message={importError ?? ''}
        confirmLabel="OK"
        onConfirm={() => setImportError(null)}
        onCancel={() => setImportError(null)}
      />

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-surface-2 border border-border text-sm text-foreground shadow-lg">
          {toast}
        </div>
      )}
    </AppShell>
  );
}
