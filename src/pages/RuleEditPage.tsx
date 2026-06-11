import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createId } from '../core/ids';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Textarea } from '../components/ui/Textarea';
import { useAppStore } from '../stores/appStore';
import type { PersistentScope, Rule, RuleType } from '../types';

const typeLabels: Record<RuleType, string> = {
  simple: 'Simple',
  persistent: 'Persistante',
  special: 'Spéciale',
};

export function RuleEditPage() {
  const { setId, ruleId } = useParams<{ setId: string; ruleId: string }>();
  const [searchParams] = useSearchParams();
  const isNew = ruleId === 'new';
  const navigate = useNavigate();
  const { getRuleSet, saveRuleSet } = useAppStore();

  const defaultType = (searchParams.get('type') as RuleType) || 'simple';

  const [rule, setRule] = useState<Rule>({
    id: isNew ? createId() : (ruleId ?? createId()),
    title: '',
    description: '',
    type: defaultType,
    durationType: 'turns',
    showRemainingTurns: true,
    canBeRedrawn: false,
    duration: 2,
    copies: 1,
    persistentScope: 'drawer',
  });
  const [useRandomDuration, setUseRandomDuration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && setId && ruleId) {
      const set = getRuleSet(setId);
      const existing = set?.rules.find((r) => r.id === ruleId);
      if (existing) {
        setRule({ ...existing });
        setUseRandomDuration(typeof existing.duration === 'object');
      }
    }
  }, [setId, ruleId, isNew, getRuleSet]);

  const validate = (): string | null => {
    if (!rule.title.trim() || !rule.description.trim()) {
      return 'Le titre et la description sont requis';
    }
    if (rule.type === 'simple') {
      const copies = rule.copies ?? 1;
      if (!Number.isInteger(copies) || copies < 1 || copies > 99) {
        return 'Le nombre d\'exemplaires doit être entre 1 et 99';
      }
    }
    if (rule.type === 'persistent') {
      if (useRandomDuration) {
        const d = rule.duration as { min: number; max: number };
        if (!d?.min || !d?.max) return 'Durées min et max requises';
        if (d.min >= d.max) return 'La durée min doit être inférieure à la max';
      } else if (typeof rule.duration !== 'number' || rule.duration < 1) {
        return 'La durée en tours est requise';
      }
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    if (!setId) return;

    const set = getRuleSet(setId);
    if (!set) return;

    const rules = isNew
      ? [...set.rules, rule]
      : set.rules.map((r) => (r.id === rule.id ? rule : r));

    await saveRuleSet({ ...set, rules });
    navigate(`/sets/${setId}`);
  };

  return (
    <AppShell
      title={isNew ? 'Nouvelle règle' : 'Modifier la règle'}
      showBack
      backTo={`/sets/${setId}`}
    >
      <div className="flex flex-col gap-5 pb-28">
        <Card>
          <p className="text-sm text-muted mb-3">Type de règle</p>
          <div className="flex flex-wrap gap-2">
            {(['simple', 'persistent', 'special'] as RuleType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRule((p) => ({ ...p, type: t }))}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  rule.type === t
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-surface-2 text-muted hover:text-foreground'
                }`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>
        </Card>

        <Input
          label="Titre"
          value={rule.title}
          onChange={(e) => setRule((p) => ({ ...p, title: e.target.value }))}
          placeholder="Ex : La main verte"
        />

        <Textarea
          label="Description"
          value={rule.description}
          onChange={(e) => setRule((p) => ({ ...p, description: e.target.value }))}
          placeholder="Ce qui se passe quand la règle est tirée..."
        />

        {rule.type === 'simple' && (
          <Card className="flex flex-col gap-3">
            <Input
              label="Exemplaires dans le jeu"
              type="number"
              min={1}
              max={99}
              value={rule.copies ?? 1}
              onChange={(e) =>
                setRule((p) => ({
                  ...p,
                  copies: Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                }))
              }
            />
            <p className="text-xs text-muted">
              Comme dans un jeu de cartes : 3 exemplaires = cette règle peut être
              tirée 3 fois par cycle (si le set est en mode exhaustif).
            </p>
          </Card>
        )}

        {rule.type === 'persistent' && (
          <Card className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted mb-3">S'applique à</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: 'drawer', label: 'Celui qui pioche' },
                    { value: 'everyone', label: 'Tout le monde' },
                  ] as { value: PersistentScope; label: string }[]
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRule((p) => ({ ...p, persistentScope: value }))
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      (rule.persistentScope ?? 'drawer') === value
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-surface-2 text-muted hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Switch
              label="Durée aléatoire"
              description="Tirer une durée entre min et max (en tours globaux)"
              checked={useRandomDuration}
              onChange={(v) => {
                setUseRandomDuration(v);
                setRule((p) => ({
                  ...p,
                  duration: v ? { min: 1, max: 3 } : 2,
                }));
              }}
            />

            {useRandomDuration ? (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Min (tours globaux)"
                  type="number"
                  min={1}
                  value={(rule.duration as { min: number })?.min ?? 1}
                  onChange={(e) =>
                    setRule((p) => ({
                      ...p,
                      duration: {
                        min: Number(e.target.value),
                        max: (p.duration as { max: number })?.max ?? 3,
                      },
                    }))
                  }
                />
                <Input
                  label="Max (tours globaux)"
                  type="number"
                  min={1}
                  value={(rule.duration as { max: number })?.max ?? 3}
                  onChange={(e) =>
                    setRule((p) => ({
                      ...p,
                      duration: {
                        min: (p.duration as { min: number })?.min ?? 1,
                        max: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            ) : (
              <Input
                label="Durée (tours globaux)"
                type="number"
                min={1}
                value={typeof rule.duration === 'number' ? rule.duration : 2}
                onChange={(e) =>
                  setRule((p) => ({ ...p, duration: Number(e.target.value) }))
                }
              />
            )}

            <Switch
              label="Afficher les tours globaux restants"
              checked={rule.showRemainingTurns !== false}
              onChange={(v) => setRule((p) => ({ ...p, showRemainingTurns: v }))}
            />

            <Switch
              label="Peut être retirée si déjà active"
              checked={!!rule.canBeRedrawn}
              onChange={(v) => setRule((p) => ({ ...p, canBeRedrawn: v }))}
            />
          </Card>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="mx-auto max-w-lg">
          <Button fullWidth onClick={() => void handleSave()}>
            Enregistrer
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!error}
        title="Erreur"
        message={error ?? ''}
        confirmLabel="OK"
        onConfirm={() => setError(null)}
        onCancel={() => setError(null)}
      />
    </AppShell>
  );
}
