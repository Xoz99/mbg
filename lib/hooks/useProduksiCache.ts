'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useDapurContext } from '@/lib/context/DapurContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://demombgv1.xyz';
const CACHE_KEY = 'produksi_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

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

const memoryCache = new Map<string, CachedProduksiData>();

// 🔥 Export function to clear memory cache on logout
export const clearProduksiMemoryCache = () => {
  memoryCache.clear()
  console.log('[useProduksiCache] Memory cache cleared on logout')
}

async function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('authToken') || localStorage.getItem('mbg_token') || '';
}

async function apiCall<T>(endpoint: string, options: any = {}, timeoutMs: number = 10000): Promise<T> {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
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

function normalizeDateString(dateString: string | null | undefined): string | null {
  if (!dateString) return null;

  dateString = dateString.trim();

  if (dateString.includes('T')) {
    try {
      // Convert ISO string to Indonesia timezone (UTC+7)
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      // Adjust for Indonesia timezone (UTC+7)
      const utcDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
      const adjustedYear = utcDate.getFullYear();
      const adjustedMonth = String(utcDate.getMonth() + 1).padStart(2, '0');
      const adjustedDay = String(utcDate.getDate()).padStart(2, '0');

      const datePart = `${adjustedYear}-${adjustedMonth}-${adjustedDay}`;
      console.log(`[normalizeDateString] ISO date ${dateString} -> adjusted to UTC+7: ${datePart}`);
      return datePart;
    } catch (e) {
      console.warn(`[normalizeDateString] Failed to parse ISO date: ${dateString}`);
      return dateString.split('T')[0];
    }
  }

  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }

  console.warn(`[normalizeDateString] Unexpected format: ${dateString}`);
  return dateString;
}

interface UseProduksiCacheOptions {
  pollingInterval?: number;
  menuDataProvider?: () => Promise<any>; // 🔥 OPTIMIZATION: Accept menu data from parent instead of fetching
  dapurId?: string; // 🔥 OPTIMIZATION: Pass dapurId to separate cache per account
}

// 🔥 OPTIMIZATION: Simple request queue to limit concurrent API calls (max 3)
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = 3;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return;
    this.running++;
    const fn = this.queue.shift();
    if (fn) {
      await fn();
      this.running--;
      this.process();
    }
  }
}

const requestQueue = new RequestQueue();

export const useProduksiCache = (options?: UseProduksiCacheOptions) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<ProduksiBatch[]>([]);

  const hasInitialized = useRef(false);
  const fetchInProgress = useRef(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalMs = options?.pollingInterval ?? 30000;
  const dapurId = options?.dapurId;

  // Get menu plannings dari context
  const { menuPlannings, isLoading: contextLoading } = useDapurContext();

  // Fetch production data
  const fetchProduksiData = useCallback(async (plannings: any[]): Promise<ProduksiBatch[]> => {
    try {
      const fetchStartTime = performance.now();

      // Get today's date in local browser time (Indonesia UTC+7)
      // This matches the date that users see on their calendar
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      console.log(`[useProduksiCache] 🔍 Today's date (browser local): ${today}, current time: ${now.toLocaleString('id-ID')}`);

      console.log(`[useProduksiCache] Using ${plannings.length} plannings from context`);

      // 🔥 OPTIMIZATION: Fetch menus per planning via request queue (max 3 concurrent)
      let menuResults: any[] = [];

      try {
        console.log(`[useProduksiCache] 📦 Fetching menus per planning...`);

        // Fallback: fetch menus per planning via request queue (max 3 concurrent)
        const menuStartTime = performance.now();

        const menuResults_temp: any = await Promise.allSettled(
          plannings.map((planning) =>
            requestQueue.add(() =>
              apiCall<any>(
                `/api/menu-planning/${planning.id}/menu-harian?limit=30&page=1`,
                {},
                20000
              )
                .then((menuRes) => {
                  const menus = extractArray(menuRes?.data || []);
                  return { planning, menus };
                })
            )
          )
        );

        menuResults = menuResults_temp
          .filter((result: any) => result.status === 'fulfilled')
          .map((result: any) => result.value)
          .filter((item: any) => item);

        const menuEndTime = performance.now();
        console.log(`[useProduksiCache] 📦 Fetch menus took ${(menuEndTime - menuStartTime).toFixed(2)}ms (with request queue, max 3 concurrent)`);
      } catch (err) {
        console.error('[useProduksiCache] Error fetching menu data:', err);
        throw err;
      }

      // Filter menus - hanya ambil yang tanggalnya sama dengan TODAY
      let todayMenusList: any[] = [];
      console.log(`[useProduksiCache] 📋 Starting to filter menus from ${menuResults.length} planning results...`);

      menuResults.forEach(({ planning, menus }: any) => {
        if (!planning) {
          console.warn(`[useProduksiCache] ⚠️ Planning is null for some menu results`);
          return;
        }
        console.log(`[useProduksiCache] 📚 Planning "${planning.sekolah?.nama || planning.id}" returned ${menus?.length || 0} menus`);

        if (!menus || menus.length === 0) {
          console.log(`[useProduksiCache] ℹ️ No menus returned for this planning`);
          return;
        }

        menus.forEach((menu: any) => {
          const menuDate = normalizeDateString(menu.tanggal);
          const isMatch = menuDate === today;

          if (!isMatch) {
            console.log(`[useProduksiCache] ❌ Menu "${menu.namaMenu || menu.id}": tanggal=${menu.tanggal}, normalized=${menuDate}, expected=${today}`);
          } else {
            console.log(`[useProduksiCache] ✅ MATCH! Menu "${menu.namaMenu}": ${menuDate}`);
            todayMenusList.push({ planning, menu });
          }
        });
      });

      console.log(`[useProduksiCache] ✨ Summary: Found ${todayMenusList.length} menus for today (target: ${today})`);

      // Skip checkpoint fetch for faster initial load - use default status
      const batchPromises = todayMenusList.map(({ planning, menu }) => {
        const sekolahName = planning.sekolah?.nama || 'Unknown';
        const targetTrays = menu.targetTray || 1200;

        return {
          id: `BATCH-${menu.id}`,
          dailyMenu: menu,
          menuId: menu.id,
          sekolahId: planning.sekolahId,
          sekolahName: sekolahName,
          status: 'PREPARING' as const,
          expectedTrays: targetTrays,
          packedTrays: 0,
          checkpoints: [],
          createdBy: 'System',
          startTime: menu.jamMulaiMasak,
          endTime: menu.jamSelesaiMasak,
        } as ProduksiBatch;
      });

      const batchesData = batchPromises.filter((b: any) => b !== null);

      console.log(`[useProduksiCache] Created ${batchesData.length} batches`);
      const fetchEndTime = performance.now();
      console.log(`[useProduksiCache] Total fetch time: ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`);
      return batchesData;
    } catch (err) {
      console.error('[useProduksiCache] Error fetching production data:', err);
      throw err;
    }
  }, []);

  // Load data dengan cache
  const loadData = useCallback(async (plannings: any[]) => {
    const cacheId = dapurId ? `produksi_cache_${dapurId}` : 'produksi_cache';

    // Check memory cache first
    if (memoryCache.has(cacheId)) {
      const cached = memoryCache.get(cacheId)!;
      const age = Date.now() - cached.timestamp;

      console.log(`✅ [useProduksiCache] Using memory cache (age: ${Math.round(age / 1000)}s)`);
      setBatches(cached.batches);
      setLoading(false);

      // Refetch in background if expired
      if (age >= CACHE_EXPIRY && plannings && plannings.length > 0) {
        fetchAndUpdateCache(cacheId, plannings);
      }
      return cached.batches;
    }

    // Check localStorage
    if (typeof window !== 'undefined') {
      const localCached = localStorage.getItem(CACHE_KEY);
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as CachedProduksiData;
          const age = Date.now() - parsed.timestamp;

          console.log(`✅ [useProduksiCache] Using localStorage cache (age: ${Math.round(age / 1000)}s)`);
          memoryCache.set(cacheId, parsed);
          setBatches(parsed.batches);
          setLoading(false);

          // Refetch in background if expired
          if (age >= CACHE_EXPIRY && plannings && plannings.length > 0) {
            fetchAndUpdateCache(cacheId, plannings);
          }
          return parsed.batches;
        } catch (e) {
          console.warn('[useProduksiCache] Failed to parse localStorage cache');
        }
      }
    }

    // If we have plannings, fetch from API
    if (plannings && plannings.length > 0) {
      console.log('📥 [useProduksiCache] No cache found, fetching from API');
      return fetchAndUpdateCache(cacheId, plannings);
    } else {
      console.log('[useProduksiCache] No plannings available, skipping load');
      setLoading(false);
      return [];
    }
  }, [fetchProduksiData]);

  const fetchAndUpdateCache = useCallback(
    async (cacheId: string, plannings: any[]) => {
      if (!plannings || plannings.length === 0) {
        console.log('[useProduksiCache] No plannings, skipping fetch');
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

        const batchesData = await fetchProduksiData(plannings);

        const cachedData: CachedProduksiData = {
          batches: batchesData,
          timestamp: Date.now(),
        };

        memoryCache.set(cacheId, cachedData);

        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
        }

        setBatches(batchesData);
        console.log('✅ [useProduksiCache] Data updated and cached');
        return batchesData;
      } catch (err) {
        console.error('❌ [useProduksiCache] Error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Gagal memuat data produksi';
        setError(errorMsg);
        throw err;
      } finally {
        fetchInProgress.current = false;
        setLoading(false);
      }
    },
    [fetchProduksiData, batches]
  );

  const setupPolling = useCallback(
    async (plannings: any[]) => {
      const cacheId = dapurId ? `produksi_cache_${dapurId}` : 'produksi_cache';
      if (pollingIntervalMs <= 0) {
        console.log('[useProduksiCache] Polling disabled');
        return;
      }

      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }

      console.log(`[useProduksiCache] Starting polling every ${pollingIntervalMs}ms`);

      try {
        const freshData = await fetchProduksiData(plannings);
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

      pollingInterval.current = setInterval(async () => {
        try {
          console.log('[useProduksiCache] Polling refresh...');
          const freshData = await fetchProduksiData(plannings);
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
    },
    [pollingIntervalMs, fetchProduksiData]
  );

  // ✅ FIXED: Initialize when context plannings are ready
  useEffect(() => {
    if (hasInitialized.current) {
      console.log('[useProduksiCache] ℹ️ Already initialized, skipping');
      return;
    }
    if (typeof window === 'undefined') {
      console.log('[useProduksiCache] ℹ️ Server-side rendering, skipping');
      return;
    }

    if (contextLoading) {
      console.log('[useProduksiCache] ⏳ Context still loading, waiting...');
      return; // ✅ Wait for context loading to finish
    }

    if (!menuPlannings || menuPlannings.length === 0) {
      console.log('[useProduksiCache] ⚠️ No menu plannings from context (yet)');
      setLoading(false);
      return;
    }

    console.log(`[useProduksiCache] 🚀 Starting initialization with ${menuPlannings.length} plannings from context`);
    hasInitialized.current = true;

    const initializeProduksiData = async () => {
      const userData = localStorage.getItem('mbg_user');
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

      if (!userData || !token) {
        console.log('[useProduksiCache] ❌ No user data or token found');
        setLoading(false);
        return;
      }

      try {
        console.log('[useProduksiCache] 🔄 Fetching produksi data...');
        await loadData(menuPlannings);
        console.log('[useProduksiCache] ✅ Initialize complete');

        if (pollingIntervalMs > 0) {
          setupPolling(menuPlannings);
        }
      } catch (err) {
        console.error('[useProduksiCache] Error initializing:', err);
        setError('Gagal inisialisasi data produksi');
        setLoading(false);
      }
    };

    initializeProduksiData();

    return () => {
      if (pollingInterval.current) {
        console.log('[useProduksiCache] Clearing polling interval');
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [menuPlannings, contextLoading, loadData, setupPolling, pollingIntervalMs]);

  const clearCache = useCallback(() => {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    console.log('✅ [useProduksiCache] Cache cleared');
  }, []);

  const refreshData = useCallback(async () => {
    const cacheId = dapurId ? `produksi_cache_${dapurId}` : 'produksi_cache';
    clearCache();
    return fetchAndUpdateCache(cacheId, menuPlannings);
  }, [clearCache, fetchAndUpdateCache, menuPlannings, dapurId]);

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      console.log('[useProduksiCache] Stopping polling');
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  const startPolling = useCallback(
    async (intervalMs?: number) => {
      const interval = intervalMs ?? pollingIntervalMs;

      if (interval <= 0) {
        console.log('[useProduksiCache] Cannot start polling with interval <= 0');
        return;
      }

      await setupPolling(menuPlannings);
    },
    [pollingIntervalMs, setupPolling, menuPlannings]
  );

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