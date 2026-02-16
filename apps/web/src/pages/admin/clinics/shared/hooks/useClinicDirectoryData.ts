import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import type { ClinicHealth } from '@/types';
import type { DirectoryFilters, DirectorySort } from '../types';

export function useClinicDirectoryData() {
  const [clinics, setClinics] = useState<ClinicHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DirectoryFilters>({
    activity: 'all',
    plan: 'all',
    payment: 'all',
  });
  const [sort, setSort] = useState<DirectorySort>({
    field: 'name',
    direction: 'asc',
  });

  const fetchClinics = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getAdminClinics();
      setClinics(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[ClinicsDirectory] Failed to fetch clinics:', err);
      setError(err.message || 'Failed to load clinics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinics();
    const interval = setInterval(fetchClinics, 60000);
    return () => clearInterval(interval);
  }, [fetchClinics]);

  const toggleSort = useCallback((field: DirectorySort['field']) => {
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    );
  }, []);

  const filteredClinics = useMemo(() => {
    let result = clinics;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.doctorName?.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    // Activity filter
    if (filters.activity !== 'all') {
      const now = Date.now();
      result = result.filter((c) => {
        if (filters.activity === 'never') return !c.lastLoginAt;
        if (!c.lastLoginAt) return false;
        const diff = now - new Date(c.lastLoginAt).getTime();
        const dayMs = 86400000;
        if (filters.activity === 'today') return diff < dayMs;
        if (filters.activity === 'week') return diff < 7 * dayMs;
        if (filters.activity === 'month') return diff < 30 * dayMs;
        return true;
      });
    }

    // Plan filter
    if (filters.plan !== 'all') {
      result = result.filter((c) => c.subscriptionStatus === filters.plan);
    }

    // Payment filter
    if (filters.payment !== 'all') {
      result = result.filter((c) => c.paymentStatus === filters.payment);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'lastActive':
          cmp =
            (a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0) -
            (b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0);
          break;
        case 'patients':
          cmp = a.patientsToday - b.patientsToday;
          break;
        case 'joined':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [clinics, searchQuery, filters, sort]);

  return {
    clinics: filteredClinics,
    totalCount: clinics.length,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sort,
    toggleSort,
    refetch: fetchClinics,
  };
}
