import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Ouvre la modale feedback après retour de /auth (?feedback=1). */
export function useFeedbackAutoOpen(setOpen: (open: boolean) => void): void {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('feedback') !== '1') return;

    setOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('feedback');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, setOpen]);
}
