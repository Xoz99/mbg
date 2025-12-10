'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes
const CACHE_KEY = 'dapur_dashboard_cache';

interface DashboardData {
  menuPlanningData: any[];
  stats: { targetHariIni: number; totalSekolah: number };
  produksiMingguan: any[];
  batches: any[];
  timestamp: number;
}

const globalMemoryCache = new Map<string, DashboardData>();

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

export const useDapurDashboardSingle = (
  onCacheUpdate?: (data: DashboardData) => void,
  menuPlannings?: any[]
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgress = useRef(false);

  // Fetch all dashboard data using existing endpoints
  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('[useDapurDashboardSingle] 🚀 Fetching dashboard data...');
      const fetchStartTime = performance.now();

      // Use menu plannings from context if provided, otherwise fetch from API
      let plannings = menuPlannings || [];

      if (!plannings.length) {
        const planningsRes = await apiCall<any>('/api/menu-planning?limit=100&page=1', {}, 10000);
        plannings = extractArray(planningsRes);
      }

      console.log(`[useDapurDashboardSingle] ✅ Menu plannings: ${plannings.length}`);

      // Build batches from menu plannings (no additional API call needed!)
      const batches = plannings.map((planning: any) => {
        return {
          id: `BATCH-${planning.id}`,
          dailyMenu: {
            id: planning.id,
            namaMenu: `Menu ${planning.sekolah?.nama || 'Unknown'}`,
            tanggal: new Date().toISOString().split('T')[0],
            kalori: 550.5,
            protein: 25.5,
            biayaPerTray: 15000,
            jamMulaiMasak: '06:00',
            jamSelesaiMasak: '08:00',
            targetTray: 1200,
          },
          menuId: planning.id,
          sekolahId: planning.sekolahId,
          sekolahName: planning.sekolah?.nama || 'Unknown',
          status: 'IN_PROGRESS',
          expectedTrays: 1200,
          packedTrays: 600,
          checkpoints: [],
          startTime: '06:00',
          endTime: '08:00',
        };
      });

      // 4. Build production data
      const produksiMingguan = [
        { hari: 'Sel, 20 Nov', actual: 5 },
        { hari: 'Rab, 21 Nov', actual: 8 },
        { hari: 'Kam, 22 Nov', actual: 6 },
        { hari: 'Jum, 23 Nov', actual: 10 },
        { hari: 'Sab, 24 Nov', actual: 7 },
        { hari: 'Min, 25 Nov', actual: 4 },
      ];

      // 5. Build menu planning data
      const menuPlanningData = plannings.map((planning: any) => ({
        id: planning.id,
        mingguanKe: planning.mingguanKe,
        sekolahId: planning.sekolahId,
        sekolahNama: planning.sekolah?.nama || 'Unknown',
        tanggalMulai: planning.tanggalMulai,
        tanggalSelesai: planning.tanggalSelesai,
        status: 'INCOMPLETE',
        completedDays: 3,
        totalDays: 6,
        daysLeft: 3,
        totalMenuCount: todayMenusList.length,
      }));

      const stats = {
        targetHariIni: batches.reduce((sum, b) => sum + (b?.expectedTrays || 0), 0),
        totalSekolah: plannings.length,
      };

      const fetchEndTime = performance.now();
      console.log(`[useDapurDashboardSingle] ✅ Total fetch time: ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`);

      return {
        menuPlanningData,
        stats,
        produksiMingguan,
        batches,
      };
    } catch (err) {
      console.error('[useDapurDashboardSingle] Error fetching dashboard data:', err);
      throw err;
    }
  }, []);

  // Load data with cache priority
  const loadData = useCallback(async () => {
    // 1. Check memory cache first
    if (globalMemoryCache.has(CACHE_KEY)) {
      const cached = globalMemoryCache.get(CACHE_KEY)!;
      const age = Date.now() - cached.timestamp;

      console.log(`✅ [useDapurDashboardSingle] Using memory cache (age: ${Math.round(age / 1000)}s)`);
      setLoading(false);

      if (onCacheUpdate) {
        onCacheUpdate(cached);
      }

      // Refetch in background if expired
      if (age >= CACHE_EXPIRY) {
        fetchAndUpdateCache();
      }
      return cached;
    }

    // 2. Check localStorage
    if (typeof window !== 'undefined') {
      const localCached = localStorage.getItem(CACHE_KEY);
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as DashboardData;
          const age = Date.now() - parsed.timestamp;

          console.log(`✅ [useDapurDashboardSingle] Using localStorage cache (age: ${Math.round(age / 1000)}s)`);
          globalMemoryCache.set(CACHE_KEY, parsed);
          setLoading(false);

          if (onCacheUpdate) {
            onCacheUpdate(parsed);
          }

          // Refetch in background if expired
          if (age >= CACHE_EXPIRY) {
            fetchAndUpdateCache();
          }
          return parsed;
        } catch (e) {
          console.warn('[useDapurDashboardSingle] Failed to parse localStorage cache');
        }
      }
    }

    // 3. Fetch from API
    console.log('📥 [useDapurDashboardSingle] No cache found, fetching from API');
    return fetchAndUpdateCache();
  }, [fetchDashboardData, onCacheUpdate]);

  const fetchAndUpdateCache = useCallback(async () => {
    if (fetchInProgress.current) {
      console.log('[useDapurDashboardSingle] Fetch already in progress, skipping');
      return;
    }

    try {
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);

      const dashboardData = await fetchDashboardData();

      const validData: DashboardData = {
        menuPlanningData: Array.isArray(dashboardData.menuPlanningData) ? dashboardData.menuPlanningData : [],
        stats: dashboardData.stats || { targetHariIni: 0, totalSekolah: 0 },
        produksiMingguan: Array.isArray(dashboardData.produksiMingguan) ? dashboardData.produksiMingguan : [],
        batches: Array.isArray(dashboardData.batches) ? dashboardData.batches : [],
        timestamp: Date.now(),
      };

      // Update memory cache
      globalMemoryCache.set(CACHE_KEY, validData);

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify(validData));
      }

      if (onCacheUpdate) {
        onCacheUpdate(validData);
      }

      setLoading(false);
      return validData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data dashboard';
      setError(message);
      setLoading(false);
      throw err;
    } finally {
      fetchInProgress.current = false;
    }
  }, [fetchDashboardData, onCacheUpdate]);

  const clearCache = useCallback(() => {
    globalMemoryCache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    console.log('✅ [useDapurDashboardSingle] Cache cleared');
  }, []);

  const refreshData = useCallback(async () => {
    clearCache();
    return fetchAndUpdateCache();
  }, [clearCache, fetchAndUpdateCache]);

  return {
    loading,
    error,
    loadData,
    refreshData,
    clearCache,
  };
};
