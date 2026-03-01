import { useState, useEffect, useCallback } from 'react';
// Note: body scroll lock intentionally omitted — the drawer lives inside
// .bs-dashboard which has overflow:hidden; locking body causes a scrollbar-
// width layout shift that visually jerks the centered dashboard.

export function useDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const open   = useCallback(() => setIsOpen(true),  []);
  const close  = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  return { isOpen, open, close, toggle };
}
