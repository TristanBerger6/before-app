import { ConfirmDialog } from './ui/ConfirmDialog';
import { useAppStore } from '../stores/appStore';

export function MigrateLocalListsDialog() {
  const pendingLocalMerge = useAppStore((s) => s.pendingLocalMerge);
  const confirmLocalMerge = useAppStore((s) => s.confirmLocalMerge);
  const dismissLocalMerge = useAppStore((s) => s.dismissLocalMerge);

  const count = pendingLocalMerge?.length ?? 0;
  if (count === 0) return null;

  return (
    <ConfirmDialog
      open
      title="Listes sur cet appareil"
      message={`Vous avez ${count} liste${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''} localement. Les ajouter à votre compte ?`}
      confirmLabel="Ajouter à mon compte"
      cancelLabel="Ignorer"
      onConfirm={() => void confirmLocalMerge(true)}
      onCancel={() => dismissLocalMerge()}
    />
  );
}
