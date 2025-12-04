'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://demombgv1.xyz';
const CACHE_KEY_PREFIX = 'sekolah_siswa_cache_';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

interface SekolahSiswaCache {
  totalSiswa: number;
  timestamp: number;
}

// Memory cache untuk session
const memoryCache = new Map<string, SekolahSiswaCache>();

export const useSekolahSiswaCache = (sekolahId: string | null) => {
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  const getCacheKey = useCallback((id: string) => {
    return `${CACHE_KEY_PREFIX}${id}`;
  }, []);

  const fetchTotalSiswa = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check memory cache first
      const cacheKey = getCacheKey(id);
      const cached = memoryCache.get(cacheKey);

      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_EXPIRY) {
          console.log(`[useSekolahSiswaCache] Using memory cache for ${id} (age: ${Math.round(age / 1000)}s)`);
          setTotalSiswa(cached.totalSiswa);
          setLoading(false);
          return cached.totalSiswa;
        }
      }

      // Fetch from API
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('authToken') || localStorage.getItem('mbg_token')
        : null;

      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log(`[useSekolahSiswaCache] Fetching siswa count for sekolahId: ${id}`);

      const response = await fetch(
        `${API_BASE_URL}/api/sekolah/${id}/siswa?page=1&limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const siswaList = Array.isArray(data.data?.data)
        ? data.data.data
        : Array.isArray(data.data)
        ? data.data
        : [];

      const total = siswaList.length;

      // Update cache
      const cachedData: SekolahSiswaCache = {
        totalSiswa: total,
        timestamp: Date.now(),
      };

      memoryCache.set(cacheKey, cachedData);
      setTotalSiswa(total);

      return total;
    } catch (err) {
      console.error('[useSekolahSiswaCache] Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal fetch data siswa';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getCacheKey]);

  // Auto-fetch when sekolahId changes
  useEffect(() => {
    if (!sekolahId || hasInitialized.current) return;

    hasInitialized.current = true;
    fetchTotalSiswa(sekolahId);
  }, [sekolahId, fetchTotalSiswa]);

  const refresh = useCallback(async () => {
    if (!sekolahId) return;
    const cacheKey = getCacheKey(sekolahId);
    memoryCache.delete(cacheKey); // Clear cache
    return fetchTotalSiswa(sekolahId);
  }, [sekolahId, getCacheKey, fetchTotalSiswa]);

  const clearCache = useCallback(() => {
    memoryCache.clear();
    console.log('[useSekolahSiswaCache] Cache cleared');
  }, []);

  return {
    totalSiswa,
    loading,
    error,
    refresh,
    clearCache,
  };
};
