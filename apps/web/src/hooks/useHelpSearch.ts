import { useState, useEffect, useRef } from 'react';

export interface FaqItem {
  icon: string;
  q: string;
  a: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[«»''"""]/g, '');
}

export function useHelpSearch(faqs: FaqItem[], debounceMs = 110) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FaqItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const q = query.trim();
      if (!q) {
        setResults([]);
        return;
      }
      const norm = normalize(q);
      setResults(
        faqs.filter(
          (f) => normalize(f.q).includes(norm) || normalize(f.a).includes(norm),
        ),
      );
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [query, faqs, debounceMs]);

  return { query, setQuery, results, isSearching: query.trim().length > 0 };
}
