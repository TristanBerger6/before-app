import { Plus, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { readEditNavState } from '../core/editNavigation';
import { createId } from '../core/ids';
import {
  DEFAULT_EXHAUSTIVE_SIMPLE_RULES,
  DEFAULT_PERSISTENT_DRAW_CHANCE,
  DEFAULT_SPECIAL_TRIGGER_CHANCE,
  formatPersistentDurationBadge,
  getRuleCopies,
  getSimpleDeckSize,
  hasPersistentRules,
  hasSpecialRules,
} from '../core/ruleHelpers';
import {
  readRuleSetSectionState,
  writeRuleSetSectionState,
  type RuleSetSectionKey,
} from '../core/ruleSetEditUi';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { RuleListItem } from '../components/RuleListItem';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/Input';
import { Slider } from '../components/ui/Slider';
import { Switch } from '../components/ui/Switch';
import { useAppStore } from '../stores/appStore';
import type { Rule, RuleSet, RuleType } from '../types';

const typeLabels: Record<RuleType, string> = {
  simple: 'Simple',
  persistent: 'Persistante',
  special: 'Spéciale',
};

function getTypeHelp(type: RuleType, ruleSet: RuleSet): string {
  switch (type) {
    case 'simple':
      return 'Tirée avec « Piocher une règle ». Effet immédiat, sans durée. Vous pouvez mettre plusieurs exemplaires d\'une même règle.';
    case 'persistent': {
      const chance = ruleSet.persistentDrawChance ?? DEFAULT_PERSISTENT_DRAW_CHANCE;
      return `${chance} % de chance d'être piochée à chaque tirage. Durée en tours ou illimitée (∞), pour celui qui pioche ou pour tout le monde.`;
    }
    case 'special': {
      const chance = ruleSet.specialTriggerChance ?? 0;
      return `${chance} % de chance de tirer un événement spécial en piochant une règle.`;
    }
  }
}

function loadRuleSetFromStore(
  isNew: boolean,
  id: string | undefined,
  getRuleSet: (id: string) => RuleSet | undefined,
): RuleSet {
  if (!isNew && id) {
    const existing = getRuleSet(id);
    if (existing) {
      return {
        ...existing,
        rules: existing.rules.map((r) => ({ ...r })),
      };
    }
  }
  return {
    id: isNew ? createId() : (id ?? createId()),
    name: '',
    rules: [],
    exhaustiveSimpleRules: DEFAULT_EXHAUSTIVE_SIMPLE_RULES,
    specialTriggerChance: DEFAULT_SPECIAL_TRIGGER_CHANCE,
    persistentDrawChance: DEFAULT_PERSISTENT_DRAW_CHANCE,
  };
}

export function RuleSetEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const location = useLocation();
  const navigate = useNavigate();
  const { getRuleSet, saveRuleSet, game } = useAppStore();
  const { returnTo } = readEditNavState(location.state, '/sets');

  const [ruleSet, setRuleSet] = useState<RuleSet>(() =>
    loadRuleSetFromStore(isNew, id, getRuleSet),
  );
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectionOpen, setSectionOpen] = useState<
    Partial<Record<RuleSetSectionKey, boolean>>
  >(() => readRuleSetSectionState(ruleSet.id));

  const isSectionOpen = (key: RuleSetSectionKey, fallback: boolean) =>
    sectionOpen[key] ?? fallback;

  const handleSectionOpenChange = (key: RuleSetSectionKey, open: boolean) => {
    setSectionOpen((prev) => {
      const next = { ...prev, [key]: open };
      writeRuleSetSectionState(ruleSet.id, next);
      return next;
    });
  };

  // Recharge au retour depuis l'édition d'une règle (sans flash du toggle)
  useEffect(() => {
    if (!isNew && id) {
      setRuleSet(loadRuleSetFromStore(false, id, getRuleSet));
      setSectionOpen(readRuleSetSectionState(id));
    }
  }, [location.key, id, isNew, getRuleSet]);

  const handleSave = async () => {
    if (!ruleSet.name.trim()) {
      setError('Le nom de la liste est requis');
      return;
    }
    await saveRuleSet(ruleSet);
    navigate(returnTo);
  };

  const removeRule = (ruleId: string) => {
    setRuleSet((prev) => ({
      ...prev,
      rules: prev.rules.filter((r) => r.id !== ruleId),
    }));
    setDeleteRuleId(null);
  };

  const grouped = (type: RuleType) => ruleSet.rules.filter((r) => r.type === type);
  const specialRulesAvailable = hasSpecialRules(ruleSet);
  const storedSpecialChance = ruleSet.specialTriggerChance ?? 0;
  const storedPersistentChance =
    ruleSet.persistentDrawChance ?? DEFAULT_PERSISTENT_DRAW_CHANCE;
  const persistentRulesAvailable = hasPersistentRules(ruleSet);
  const editingDuringGame =
    !isNew && game.isActive && game.selectedRuleSetId === ruleSet.id;

  return (
    <AppShell
      title={isNew ? 'Nouvelle liste' : 'Modifier la liste'}
      showBack
      backTo={returnTo}
    >
      <div className="flex flex-col gap-6 pb-28">
        {editingDuringGame && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted leading-relaxed">
            Partie en cours : les règles supprimées ou modifiées quittent la
            partie. Changer l&apos;option «&nbsp;chaque règle simple ne sort
            qu&apos;une fois&nbsp;» remélange le deck simple.
          </div>
        )}
        <Input
          label="Nom de la liste"
          value={ruleSet.name}
          onChange={(e) => setRuleSet((p) => ({ ...p, name: e.target.value }))}
          placeholder="Ex : Soirée classique"
        />

        <CollapsibleSection
          title="Paramètres"
          icon={<Settings size={18} />}
          open={isSectionOpen('settings', false)}
          onOpenChange={(open) => handleSectionOpenChange('settings', open)}
          scrollable={false}
        >
          <Switch
            label="Chaque règle simple ne sort qu'une fois"
            description="Quand toutes les règles simples ont été piochées, on remélange."
            checked={!!ruleSet.exhaustiveSimpleRules}
            onChange={(v) => setRuleSet((p) => ({ ...p, exhaustiveSimpleRules: v }))}
          />
          <Slider
            label="Chance d'événement spécial"
            description={
              specialRulesAvailable
                ? 'À chaque pioche, probabilité d\'un événement invitant le joueur à utiliser le bouton Spéciale.'
                : storedSpecialChance > 0
                  ? `Réglé à ${storedSpecialChance} % — inactif tant qu'il n'y a pas de règle spéciale.`
                  : 'Ajoutez une règle spéciale pour que ce taux s\'applique en partie.'
            }
            value={storedSpecialChance}
            min={0}
            max={5}
            step={1}
            unit="%"
            onChange={(v) => setRuleSet((p) => ({ ...p, specialTriggerChance: v }))}
          />
          <Slider
            label="Chance de règle persistante"
            description={
              persistentRulesAvailable
                ? 'À chaque pioche, probabilité de tirer une règle persistante plutôt qu\'une simple.'
                : storedPersistentChance > 0
                  ? `Réglé à ${storedPersistentChance} % — inactif tant qu'il n'y a pas de règle persistante.`
                  : 'Ajoutez une règle persistante pour que ce taux s\'applique en partie.'
            }
            value={storedPersistentChance}
            min={0}
            max={50}
            step={1}
            unit="%"
            onChange={(v) => setRuleSet((p) => ({ ...p, persistentDrawChance: v }))}
          />
        </CollapsibleSection>

        {(['simple', 'persistent', 'special'] as RuleType[]).map((type) => {
          const rules = grouped(type);
          const defaultOpen = rules.length <= 4;

          return (
            <div key={type} className="flex flex-col gap-3">
              {rules.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surface-1 px-4 py-3">
                  <p className="font-display text-base text-foreground mb-1">
                    {typeLabels[type]}
                  </p>
                  <p className="text-xs text-muted leading-relaxed mb-2">
                    {getTypeHelp(type, ruleSet)}
                  </p>
                  <p className="text-sm text-muted">Aucune règle</p>
                </div>
              ) : (
                <CollapsibleSection
                  title={typeLabels[type]}
                  description={getTypeHelp(type, ruleSet)}
                  count={
                    type === 'simple'
                      ? getSimpleDeckSize(rules)
                      : rules.length
                  }
                  open={isSectionOpen(type, defaultOpen)}
                  onOpenChange={(open) => handleSectionOpenChange(type, open)}
                  maxHeight={rules.length > 8 ? '12rem' : '16rem'}
                >
                  {rules.map((rule: Rule) => (
                    <RuleListItem
                      key={rule.id}
                      title={rule.title}
                      copies={type === 'simple' ? getRuleCopies(rule) : undefined}
                      durationBadge={
                        type === 'persistent'
                          ? formatPersistentDurationBadge(rule)
                          : undefined
                      }
                      persistentScope={
                        type === 'persistent'
                          ? (rule.persistentScope ?? 'drawer')
                          : undefined
                      }
                      onClick={() =>
                        navigate(`/sets/${ruleSet.id}/rules/${rule.id}`, {
                          state: {
                            returnTo: `/sets/${ruleSet.id}`,
                            listReturnTo: returnTo,
                          },
                        })
                      }
                      onDelete={() => setDeleteRuleId(rule.id)}
                      deleteLabel={`Supprimer ${rule.title}`}
                    />
                  ))}
                </CollapsibleSection>
              )}
              <button
                type="button"
                onClick={async () => {
                  if (!ruleSet.name.trim()) {
                    setError('Donnez un nom à la liste avant d\'ajouter des règles');
                    return;
                  }
                  await saveRuleSet(ruleSet);
                  navigate(`/sets/${ruleSet.id}/rules/new?type=${type}`, {
                    state: {
                      returnTo: `/sets/${ruleSet.id}`,
                      listReturnTo: returnTo,
                    },
                  });
                }}
                className="inline-flex items-center gap-1.5 self-start px-2 py-1.5 text-sm font-medium text-muted hover:text-accent transition-colors duration-200 cursor-pointer"
              >
                <Plus size={15} />
                Ajouter
              </button>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="mx-auto max-w-lg">
          <Button fullWidth onClick={() => void handleSave()}>
            Enregistrer
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteRuleId}
        title="Supprimer la règle"
        message="Cette règle sera retirée de la liste."
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => deleteRuleId && removeRule(deleteRuleId)}
        onCancel={() => setDeleteRuleId(null)}
      />

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
