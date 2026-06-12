import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  listEditNavState,
  readEditNavState,
} from '../core/editNavigation';
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
  const location = useLocation();
  const navigate = useNavigate();
  const { getRuleSet, saveRuleSet, game } = useAppStore();
  const { returnTo, listReturnTo } = readEditNavState(
    location.state,
    `/sets/${setId}`,
  );

  const goBack = () => {
    navigate(returnTo, { state: listEditNavState(listReturnTo) });
  };

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
  const isUnlimited = rule.durationType === 'unlimited';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [setId, ruleId]);

  useEffect(() => {
    if (!isNew && setId && ruleId) {
      const set = getRuleSet(setId);
      const existing = set?.rules.find((r) => r.id === ruleId);
      if (existing) {
        setRule({ ...existing });
        setUseRandomDuration(
          existing.durationType !== 'unlimited' &&
            typeof existing.duration === 'object',
        );
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
    if (rule.type === 'persistent' && rule.durationType !== 'unlimited') {
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

    const editingDuringGame =
      !isNew &&
      game.isActive &&
      game.selectedRuleSetId === setId;

    let rules: typeof set.rules;
    if (isNew) {
      rules = [...set.rules, rule];
    } else if (editingDuringGame) {
      const newRule = { ...rule, id: createId() };
      rules = set.rules.map((r) => (r.id === ruleId ? newRule : r));
    } else {
      rules = set.rules.map((r) => (r.id === rule.id ? rule : r));
    }

    await saveRuleSet({ ...set, rules });
    goBack();
  };

  const editingDuringGame =
    !isNew &&
    game.isActive &&
    game.selectedRuleSetId === setId;

  return (
    <AppShell
      title={isNew ? 'Nouvelle règle' : 'Modifier la règle'}
      showBack
      onBack={goBack}
    >
      <div className="flex flex-col gap-5 pb-28">
        {editingDuringGame && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted leading-relaxed">
            Partie en cours : enregistrer remplace cette règle par une nouvelle
            version. L&apos;ancienne sera retirée de la partie (y compris si
            elle était active).
          </div>
        )}
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
              tirée 3 fois avant remélange (si chaque règle simple ne sort qu'une fois).
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

            <div>
              <p className="text-sm text-muted mb-3">Durée</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUseRandomDuration(false);
                    setRule((p) => ({
                      ...p,
                      durationType: 'turns',
                      duration: typeof p.duration === 'number' ? p.duration : 2,
                    }));
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    !isUnlimited
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-surface-2 text-muted hover:text-foreground'
                  }`}
                >
                  Tours complets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseRandomDuration(false);
                    setRule((p) => ({
                      ...p,
                      durationType: 'unlimited',
                    }));
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isUnlimited
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-surface-2 text-muted hover:text-foreground'
                  }`}
                  aria-label="Durée illimitée"
                >
                  ∞
                </button>
              </div>
            </div>

            {!isUnlimited && (
              <>
                <Switch
                  label="Durée aléatoire"
                  description="Tirer une durée entre min et max (en tours complets)"
                  checked={useRandomDuration}
                  onChange={(v) => {
                    setUseRandomDuration(v);
                    setRule((p) => ({
                      ...p,
                      durationType: 'turns',
                      duration: v ? { min: 1, max: 3 } : 2,
                    }));
                  }}
                />

                {useRandomDuration ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Min (tours complets)"
                      type="number"
                      min={1}
                      value={(rule.duration as { min: number })?.min ?? 1}
                      onChange={(e) =>
                        setRule((p) => ({
                          ...p,
                          durationType: 'turns',
                          duration: {
                            min: Number(e.target.value),
                            max: (p.duration as { max: number })?.max ?? 3,
                          },
                        }))
                      }
                    />
                    <Input
                      label="Max (tours complets)"
                      type="number"
                      min={1}
                      value={(rule.duration as { max: number })?.max ?? 3}
                      onChange={(e) =>
                        setRule((p) => ({
                          ...p,
                          durationType: 'turns',
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
                    label="Durée (tours complets)"
                    type="number"
                    min={1}
                    value={typeof rule.duration === 'number' ? rule.duration : 2}
                    onChange={(e) =>
                      setRule((p) => ({
                        ...p,
                        durationType: 'turns',
                        duration: Number(e.target.value),
                      }))
                    }
                  />
                )}
              </>
            )}

            {isUnlimited && (
              <p className="text-xs text-muted leading-relaxed">
                La règle reste active jusqu&apos;à la fin de la partie ou jusqu&apos;à
                ce qu&apos;une autre règle du même type la remplace.
              </p>
            )}

            <Switch
              label={
                isUnlimited
                  ? 'Afficher ∞ pendant la partie'
                  : 'Afficher les tours complets restants'
              }
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
