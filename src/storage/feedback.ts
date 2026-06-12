import { translateFeedbackError } from '../lib/feedbackErrors';
import { getSupabase } from '../lib/supabase';

export type FeedbackKind = 'bug' | 'idea';

export interface SubmitFeedbackInput {
  kind: FeedbackKind;
  message: string;
  page?: string;
  sessionCode?: string;
  metadata?: Record<string, unknown>;
}

export async function submitFeedback(
  input: SubmitFeedbackInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.rpc('submit_feedback', {
      p_kind: input.kind,
      p_message: input.message,
      p_page: input.page ?? null,
      p_session_code: input.sessionCode ?? null,
      p_metadata: input.metadata ?? {},
    });

    if (error) {
      return { ok: false, error: translateFeedbackError(error.message) };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: translateFeedbackError(
        err instanceof Error ? err.message : 'Erreur inconnue',
      ),
    };
  }
}
