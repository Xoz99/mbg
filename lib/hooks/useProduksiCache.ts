'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useDapurContext } from '@/lib/context/DapurContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://demombgv1.xyz';
const CACHE_KEY = 'produksi_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface ProduksiBatch {
  id: string;
  dailyMenu: any;
  menuId: string;
  sekolahId: string;
  sekolahName: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PREPARING' | 'CANCELLED';
  expectedTrays: number;
  packedTrays: number;
  checkpoints: any[];
  createdBy: string;
  startTime: string;
  endTime: string;
}

interface CachedProduksiData {
  batches: ProduksiBatch[];
  timestamp: number;
}

// Memory cache untuk session
const memoryCache = new Map<string, CachedProduksiData>();

// Helper functions
async function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('authToken') || localStorage.getItem('mbg_token') || '';
}

async function apiCall<T>(endpoint: string, options: any = {}): Promise<T> {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (typeof data === 'object') {
    const arr = Object.values(data).find((v) => Array.isArray(v));
    if (arr) return arr as any[];
  }
  return [];
}

// Normalize date string untuk handle timezone conversion
function normalizeDateString(dateString: string | null | undefined): string | null {
  if (!dateString) return null;

  dateString = dateString.trim();

  // Jika format ISO (YYYY-MM-DDTHH:MM:SS.000Z), convert ke local timezone
  if (dateString.includes('T')) {
    try {
      const utcDate = new Date(dateString);
      const localDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000); // +7 jam untuk Indonesia
      const year = localDate.getUTCFullYear();
      const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(localDate.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.warn(`[normalizeDateString] Failed to parse ISO date: ${dateString}`);
      return dateString.split('T')[0];
    }
  }

  // Jika format YYYY-MM-DD, return sebagaimana adanya
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }

  console.warn(`[normalizeDateString] Unexpected format: ${dateString}`);
  return dateString;
}

interface UseProduksiCacheOptions {
  pollingInterval?: number; // milliseconds, default 30000 (30s), 0 to disable
}

export const useProduksiCache = (options?: UseProduksiCacheOptions) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<ProduksiBatch[]>([]);

  const hasInitialized = useRef(false);
  const fetchInProgress = useRef(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalMs = options?.pollingInterval ?? 30000; // Default 30 detik

  // Get menu plannings from global context
  const { menuPlannings: contextPlannings, isLoading: contextLoading } = useDapurContext();

  // Fetch production data
  const fetchProduksiData = useCallback(async (contextPlannings: any[]): Promise<ProduksiBatch[]> => {
    try {
      console.time('fetchProduksiData');

      // Get today's date dalam local timezone (UTC+7)
      const now = new Date();
      const todayLocalDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const today = `${todayLocalDate.getUTCFullYear()}-${String(todayLocalDate.getUTCMonth() + 1).padStart(2, '0')}-${String(todayLocalDate.getUTCDate()).padStart(2, '0')}`;
      console.log(`[useProduksiCache] Today's date (local): ${today}`);

      // Use menu-planning from context (global cache)
      const plannings = contextPlannings;
      console.log(`[useProduksiCache] Using ${plannings.length} plannings from context`);

      // Parallel fetch menu-harian untuk semua planning
      const menuPromises = plannings.map((planning) =>
        apiCall<any>(
          `/api/menu-planning/${planning.id}/menu-harian?limit=20&page=1&tanggal=${today}`
        )
          .then((menuRes) => {
            const menus = extractArray(menuRes?.data || []);
            return { planning, menus };
          })
          .catch((err) => {
            console.warn(
              `[useProduksiCache] Gagal fetch menu untuk planning ${planning.id}:`,
              err
            );
            return { planning, menus: [] };
          })
      );

      const menuResults = await Promise.all(menuPromises);

      // Filter menus untuk hari ini
      const todayMenus: any[] = [];
      menuResults.forEach(({ planning, menus }) => {
        menus.forEach((menu) => {
          const menuDate = normalizeDateString(menu.tanggal);
          console.log(
            `[useProduksiCache] Menu date: ${menuDate}, Today: ${today}, Match: ${menuDate === today}`
          );
          if (menuDate === today) {
            todayMenus.push({ planning, menu });
          }
        });
      });

      // Parallel fetch checkpoint untuk semua menu hari ini
      const batchPromises = todayMenus.map(({ planning, menu }) =>
        apiCall<any>(`/api/menu-harian/${menu.id}/checkpoint?limit=10`)
          .catch(() => ({ data: { data: [] } }))
          .then((checkpointRes) => {
            const checkpoints = extractArray(checkpointRes?.data || []);
            const sekolahName = planning.sekolah?.nama || 'Unknown';
            const targetTrays = menu.targetTray || 1200;

            return {
              id: `BATCH-${menu.id}`,
              dailyMenu: menu,
              menuId: menu.id,
              sekolahId: planning.sekolahId,
              sekolahName: sekolahName,
              status:
                checkpoints.length >= 4
                  ? 'COMPLETED'
                  : checkpoints.length >= 2
                    ? 'IN_PROGRESS'
                    : 'PREPARING',
              expectedTrays: targetTrays,
              packedTrays:
                checkpoints.length >= 3
                  ? targetTrays
                  : checkpoints.length >= 2
                    ? Math.round(targetTrays / 2)
                    : 0,
              checkpoints: checkpoints,
              createdBy: 'System',
              startTime: menu.jamMulaiMasak,
              endTime: menu.jamSelesaiMasak,
            } as ProduksiBatch;
          })
          .catch((err) => {
            console.warn(
              `[useProduksiCache] Gagal fetch batch data untuk menu ${menu.id}:`,
              err
            );
            return null;
          })
      );

      const batchesData = (await Promise.all(batchPromises)).filter(
        (b) => b !== null
      );

      console.timeEnd('fetchProduksiData');
      return batchesData;
    } catch (err) {
      console.error('[useProduksiCache] Error fetching production data:', err);
      throw err;
    }
  }, [contextPlannings]);

  // Load data dengan cache
  const loadData = useCallback(async () => {
    const cacheId = 'produksi_cache';

    // 1. Check memory cache first
    if (memoryCache.has(cacheId)) {
      const cached = memoryCache.get(cacheId)!;
      const age = Date.now() - cached.timestamp;

      if (age < CACHE_EXPIRY) {
        console.log('✅ [useProduksiCache] Using memory cache (fresh)');
        setBatches(cached.batches);
        setLoading(false);
        return cached.batches;
      }
    }

    // 2. Check localStorage
    if (typeof window !== 'undefined') {
      const localCached = localStorage.getItem(CACHE_KEY);
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as CachedProduksiData;
          const age = Date.now() - parsed.timestamp;

          if (age < CACHE_EXPIRY) {
            console.log('✅ [useProduksiCache] Using localStorage cache (fresh)');
            memoryCache.set(cacheId, parsed);
            setBatches(parsed.batches);
            setLoading(false);
            return parsed.batches;
          } else if (age < CACHE_EXPIRY * 2) {
            console.log('⚠️ [useProduksiCache] Using stale cache, refetching in background');
            setBatches(parsed.batches);
            setLoading(false);
            memoryCache.set(cacheId, parsed);
            // Background refetch
            fetchAndUpdateCache(cacheId);
            return parsed.batches;
          }
        } catch (e) {
          console.warn('[useProduksiCache] Failed to parse localStorage cache');
        }
      }
    }

    // 3. No cache, need to fetch
    console.log('📥 [useProduksiCache] No cache found, fetching from API');
    return fetchAndUpdateCache(cacheId);
  }, [fetchProduksiData, contextLoading]);

  // Fetch and update cache
  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      // Wait for context to load
      if (contextLoading) {
        console.log('[useProduksiCache] Waiting for context to load...');
        return batches;
      }

      if (fetchInProgress.current) {
        console.log('[useProduksiCache] Fetch already in progress, skipping');
        return batches;
      }

      try {
        fetchInProgress.current = true;
        setLoading(true);
        setError(null);

        const batchesData = await fetchProduksiData(contextPlannings);

        const cachedData: CachedProduksiData = {
          batches: batchesData,
          timestamp: Date.now(),
        };

        // Update memory cache
        memoryCache.set(cacheId, cachedData);

        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
          console.log('[useProduksiCache] Saved to localStorage');
        }

        setBatches(batchesData);
        console.log('✅ [useProduksiCache] Data updated and cached');
        return batchesData;
      } catch (err) {
        console.error('❌ [useProduksiCache] Error:', err);
        const errorMsg =
          err instanceof Error ? err.message : 'Gagal memuat data produksi';
        setError(errorMsg);
        throw err;
      } finally {
        fetchInProgress.current = false;
        setLoading(false);
      }
    },
    [fetchProduksiData, batches, contextLoading, contextPlannings]
  );

  // ✅ Setup polling untuk auto-refresh data
  const setupPolling = useCallback(async (cacheId: string) => {
    // Skip jika polling disabled
    if (pollingIntervalMs <= 0) {
      console.log('[useProduksiCache] Polling disabled');
      return;
    }

    // Clear existing polling jika ada
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    console.log(`[useProduksiCache] Starting polling every ${pollingIntervalMs}ms`);

    // Fetch data immediately on first poll
    try {
      const freshData = await fetchProduksiData(contextPlannings);
      const cachedData: CachedProduksiData = {
        batches: freshData,
        timestamp: Date.now(),
      };
      memoryCache.set(cacheId, cachedData);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
      }
      setBatches(freshData);
    } catch (err) {
      console.warn('[useProduksiCache] Initial poll failed:', err);
    }

    // Setup interval for periodic refresh
    pollingInterval.current = setInterval(async () => {
      try {
        console.log('[useProduksiCache] Polling refresh...');
        const freshData = await fetchProduksiData(contextPlannings);
        const cachedData: CachedProduksiData = {
          batches: freshData,
          timestamp: Date.now(),
        };
        memoryCache.set(cacheId, cachedData);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
        }
        setBatches(freshData);
        console.log('✅ [useProduksiCache] Polling refresh complete');
      } catch (err) {
        console.error('[useProduksiCache] Polling refresh failed:', err);
      }
    }, pollingIntervalMs);
  }, [pollingIntervalMs, fetchProduksiData, contextPlannings]);

  // Initialize hook dengan proper useEffect
  useEffect(() => {
    if (hasInitialized.current) return;
    if (typeof window === 'undefined') return;

    hasInitialized.current = true;

    const initializeProduksiData = async () => {
      const userData = localStorage.getItem('mbg_user');
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

      if (!userData || !token) {
        console.log('[useProduksiCache] No user data or token found');
        setLoading(false);
        return;
      }

      try {
        console.log('[useProduksiCache] Initializing...');
        const result = await loadData();
        console.log('[useProduksiCache] Initialize complete');

        // ✅ Start polling after initial load
        const cacheId = 'produksi_cache';
        if (pollingIntervalMs > 0) {
          setupPolling(cacheId);
        }
      } catch (err) {
        console.error('[useProduksiCache] Error initializing:', err);
        setError('Gagal inisialisasi data produksi');
        setLoading(false);
      }
    };

    initializeProduksiData();

    // ✅ Cleanup polling on unmount
    return () => {
      if (pollingInterval.current) {
        console.log('[useProduksiCache] Clearing polling interval');
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    console.log('✅ [useProduksiCache] Cache cleared');
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    const cacheId = 'produksi_cache';
    clearCache();
    return fetchAndUpdateCache(cacheId);
  }, [clearCache, fetchAndUpdateCache]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      console.log('[useProduksiCache] Stopping polling');
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // Start polling with optional new interval
  const startPolling = useCallback(async (intervalMs?: number) => {
    const cacheId = 'produksi_cache';
    const interval = intervalMs ?? pollingIntervalMs;

    if (interval <= 0) {
      console.log('[useProduksiCache] Cannot start polling with interval <= 0');
      return;
    }

    await setupPolling(cacheId);
  }, [pollingIntervalMs, setupPolling]);

  return {
    loading,
    error,
    batches,
    clearCache,
    refreshData,
    startPolling,
    stopPolling,
  };
};
