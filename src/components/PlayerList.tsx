import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import type { Player } from '../types';

interface PlayerListProps {
  players: Player[];
  onReorder: (players: Player[]) => void;
  onRemove: (player: Player) => void;
}

function SortablePlayer({
  player,
  onRemove,
}: {
  player: Player;
  onRemove: (player: Player) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3 ${
        isDragging ? 'opacity-70 shadow-lg' : ''
      }`}
    >
      <button
        type="button"
        className="text-muted hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        aria-label={`Réorganiser ${player.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <span className="flex-1 font-medium truncate">{player.name}</span>
      <button
        type="button"
        onClick={() => onRemove(player)}
        className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
        aria-label={`Supprimer ${player.name}`}
      >
        <X size={18} />
      </button>
    </div>
  );
}

export function PlayerList({ players, onReorder, onRemove }: PlayerListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = players.findIndex((p) => p.id === active.id);
    const newIndex = players.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = [...players];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onReorder(next);
  };

  if (players.length === 0) {
    return (
      <p className="text-center text-muted text-sm py-8">
        Aucun joueur ajouté
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <SortablePlayer key={player.id} player={player} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
