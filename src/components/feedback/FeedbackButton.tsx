import { PenLine } from 'lucide-react';
import { useState } from 'react';
import { useFeedbackAutoOpen } from '../../hooks/useFeedbackAutoOpen';
import { isSupabaseConfigured } from '../../lib/supabase';
import { FeedbackDialog } from './FeedbackDialog';

interface FeedbackButtonProps {
  sessionCode?: string | null;
}

export function FeedbackButton({ sessionCode }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  useFeedbackAutoOpen(setOpen);

  if (!isSupabaseConfigured()) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
        aria-label="Signaler un bug ou proposer une idée"
      >
        <PenLine size={20} />
      </button>

      <FeedbackDialog
        open={open}
        onClose={() => setOpen(false)}
        sessionCode={sessionCode}
      />
    </>
  );
}
