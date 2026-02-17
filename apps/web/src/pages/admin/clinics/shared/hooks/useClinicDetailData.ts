import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ClinicDetail } from '@/types';
import type { WeeklyDay } from '../types';

// Mon-Sun order per spec
const ORDERED_DAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
const ORDERED_SHORTS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function transformWeeklyData(weeklyPatients: Array<{ date: string; count: number }>): WeeklyDay[] {
  // Build a map of day-of-week -> count from the raw data
  const dayMap = new Map<number, { count: number; date: string }>();
  for (const wp of weeklyPatients) {
    const d = new Date(wp.date);
    const dow = d.getDay(); // 0=Sun, 1=Mon, ...
    dayMap.set(dow, { count: wp.count, date: wp.date });
  }

  // Return Mon(1) through Sun(0) in order
  const orderedDow = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
  return orderedDow.map((dow, i) => ({
    day: ORDERED_DAYS[i],
    dayShort: ORDERED_SHORTS[i],
    count: dayMap.get(dow)?.count ?? 0,
    date: dayMap.get(dow)?.date ?? '',
  }));
}

export function useClinicDetailData(clinicId: string | undefined) {
  const [detail, setDetail] = useState<ClinicDetail | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const data = await api.getAdminClinicDetail(clinicId);
      setDetail(data);
      setWeeklyData(transformWeeklyData(data.weeklyPatients));
    } catch (err: any) {
      setError(err.message || 'Failed to load clinic details');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { detail, weeklyData, loading, error, refetch: fetchDetail };
}
