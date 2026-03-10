import { useState, useMemo } from 'react';
import type { QueueEntry } from '@/types';
import { QueueStatus } from '@/types';

export type FilterTab = 'all' | 'waiting' | 'notified' | 'no-phone';

export function useQueueFilter(entries: QueueEntry[]) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Only show active entries (WAITING + NOTIFIED), sorted by position
  const activeEntries = useMemo(() =>
    entries
      .filter(e => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED)
      .sort((a, b) => a.position - b.position),
    [entries]
  );

  const filtered = useMemo(() => {
    let result = activeEntries;

    if (activeFilter === 'waiting')
      result = result.filter(e => e.status === QueueStatus.WAITING && !e.notifiedAt);
    if (activeFilter === 'notified')
      result = result.filter(e => !!e.notifiedAt);
    if (activeFilter === 'no-phone')
      result = result.filter(e => !e.patientPhone);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => (e.patientName || '').toLowerCase().includes(q));
    }

    return result;
  }, [activeEntries, activeFilter, searchQuery]);

  const counts = useMemo((): Record<FilterTab, number> => ({
    all:        activeEntries.length,
    waiting:    activeEntries.filter(e => e.status === QueueStatus.WAITING && !e.notifiedAt).length,
    notified:   activeEntries.filter(e => !!e.notifiedAt).length,
    'no-phone': activeEntries.filter(e => !e.patientPhone).length,
  }), [activeEntries]);

  return { filtered, counts, activeFilter, setActiveFilter, searchQuery, setSearchQuery };
}
