'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const CACHE_KEY = 'dapur_data_cache';
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

interface DapurInfo {
  nama: string;
  alamat: string;
  kota: string;
  pic: string;
  picPhone: string;
  picEmail: string;
}

interface CachedDapurData {
  dapurInfo: DapurInfo;
  dapurId: string;
  timestamp: number;
}

// Memory cache untuk session
const memoryCache = new Map<string, CachedDapurData>();

export const useDapurData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dapurInfo, setDapurInfo] = useState<DapurInfo>({
    nama: '',
    alamat: '',
    kota: '',
    pic: '',
    picPhone: '',
    picEmail: '',
  });
  const [dapurId, setDapurId] = useState('');

  const hasInitialized = useRef(false);
  const fetchInProgress = useRef(false);

  // Extract kota dari alamat
  const extractKota = (alamat: string): string => {
    if (!alamat) return '';
    const parts = String(alamat).split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return '';
  };

  // Process dapur data dan return DapurInfo
  const processDapurData = (dapur: any): DapurInfo => {
    if (!dapur) {
      console.warn('[useDapurData] processDapurData: dapur is null/undefined');
      return dapurInfo;
    }

    const picData =
      dapur.picDapur && Array.isArray(dapur.picDapur) && dapur.picDapur.length > 0
        ? dapur.picDapur[0]
        : null;

    const alamat = String(dapur.alamat || '');
    const kota = extractKota(alamat) || 'Jakarta';

    const newInfo: DapurInfo = {
      nama: String(dapur.nama || 'Dapur MBG'),
      alamat: alamat,
      kota: kota,
      pic: picData ? String(picData.name || picData.namaLengkap || '-') : '-',
      picPhone: picData ? String(picData.phone || picData.noHp || '') : '',
      picEmail: picData ? String(picData.email || '') : '',
    };

    console.log('[useDapurData] processDapurData processed:', newInfo);
    return newInfo;
  };

  // Find dapur by PIC
  const findDapurByPIC = useCallback(async (picId: string, picName: string, token: string) => {
    try {
      console.log('[useDapurData] Mencari dapur untuk PIC ID:', picId);

      const response = await fetch(`${API_BASE_URL}/api/dapur?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[useDapurData] Dapur list response:', result);

      let dapurList = [];
      if (Array.isArray(result.data?.data)) {
        dapurList = result.data.data;
      } else if (Array.isArray(result.data)) {
        dapurList = result.data;
      } else if (Array.isArray(result)) {
        dapurList = result;
      }

      let foundDapur = null;

      for (const dapur of dapurList) {
        if (dapur.picDapur && Array.isArray(dapur.picDapur)) {
          const matchingPIC = dapur.picDapur.find((pic: any) => pic.id === picId || pic.name === picName);

          if (matchingPIC) {
            foundDapur = dapur;
            console.log('[useDapurData] Dapur ditemukan:', foundDapur);
            break;
          }
        }
      }

      if (foundDapur) {
        localStorage.setItem('userDapurId', foundDapur.id);
        const processedInfo = processDapurData(foundDapur);
        console.log('[useDapurData] findDapurByPIC result:', {
          dapurId: foundDapur.id,
          dapurInfo: processedInfo,
        });
        return { success: true, dapurId: foundDapur.id, dapurInfo: processedInfo };
      } else {
        console.warn('[useDapurData] Dapur tidak ditemukan untuk PIC ini');
        throw new Error('Dapur tidak ditemukan untuk PIC ini');
      }
    } catch (err) {
      console.error('[useDapurData] Error mencari dapur:', err);
      throw err;
    }
  }, []);

  // Fetch dapur detail
  const fetchDapurDetail = useCallback(async (dapurId: string, token: string) => {
    try {
      console.log('[useDapurData] Fetch detail dapur:', dapurId);

      const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[useDapurData] Dapur detail:', result);

      let dapur = result.data || result;

      if (dapur && typeof dapur === 'object' && !dapur.nama && dapur.data) {
        dapur = dapur.data;
      }

      const processedInfo = processDapurData(dapur);
      console.log('[useDapurData] fetchDapurDetail result:', {
        dapurId: dapurId,
        dapurInfo: processedInfo,
      });
      return { success: true, dapurId: dapurId, dapurInfo: processedInfo };
    } catch (err) {
      console.error('[useDapurData] Error fetch detail:', err);
      throw err;
    }
  }, []);

  // Load data dengan cache
  const loadDapurData = useCallback(
    async (dapurId: string, picId: string, picName: string, token: string) => {
      const cacheId = `${dapurId || picId}_${token.substring(0, 10)}`;
      console.log('[useDapurData] Loading data with cacheId:', cacheId);

      // 1. Check memory cache first
      if (memoryCache.has(cacheId)) {
        const cached = memoryCache.get(cacheId)!;
        const age = Date.now() - cached.timestamp;

        if (age < CACHE_EXPIRY) {
          console.log('✅ [useDapurData] Using memory cache (fresh)');
          const finalDapurId = cached.dapurId || localStorage.getItem('userDapurId') || dapurId;
          setDapurInfo(cached.dapurInfo);
          setDapurId(finalDapurId);
          setLoading(false);
          return cached.dapurInfo;
        }
      }

      // 2. Check localStorage
      if (typeof window !== 'undefined') {
        const localCached = localStorage.getItem(CACHE_KEY);
        if (localCached) {
          try {
            const parsed = JSON.parse(localCached) as CachedDapurData;
            const age = Date.now() - parsed.timestamp;

            console.log('[useDapurData] localStorage cache found:', {
              age: age + 'ms',
              dapurInfo: parsed.dapurInfo,
              dapurId: parsed.dapurId,
            });

            if (age < CACHE_EXPIRY) {
              console.log('✅ [useDapurData] Using localStorage cache (fresh)');
              memoryCache.set(cacheId, parsed);
              const finalDapurId = parsed.dapurId || localStorage.getItem('userDapurId') || dapurId;
              console.log('[useDapurData] Setting state from cache:', {
                dapurInfo: parsed.dapurInfo,
                dapurId: parsed.dapurId,
                finalDapurId: finalDapurId,
              });
              setDapurInfo(parsed.dapurInfo);
              setDapurId(finalDapurId);
              setLoading(false);
              return parsed.dapurInfo;
            } else if (age < CACHE_EXPIRY * 2) {
              // Stale cache, use it but refetch in background
              console.log('⚠️ [useDapurData] Using stale cache, refetching in background');
              const finalDapurId = parsed.dapurId || localStorage.getItem('userDapurId') || dapurId;
              setDapurInfo(parsed.dapurInfo);
              setDapurId(finalDapurId);
              setLoading(false);
              memoryCache.set(cacheId, parsed);
              // Background refetch
              fetchAndUpdateDapur(dapurId, picId, picName, token, cacheId);
              return parsed.dapurInfo;
            }
          } catch (e) {
            console.warn('[useDapurData] Failed to parse localStorage cache');
          }
        }
      }

      // 3. No cache, need to fetch
      console.log('📥 [useDapurData] No cache found, fetching from API');
      return fetchAndUpdateDapur(dapurId, picId, picName, token, cacheId);
    },
    []
  );

  // Fetch and update cache
  const fetchAndUpdateDapur = useCallback(
    async (dapurId: string, picId: string, picName: string, token: string, cacheId: string) => {
      if (fetchInProgress.current) {
        console.log('[useDapurData] Fetch already in progress, skipping');
        return null;
      }

      try {
        fetchInProgress.current = true;
        setLoading(true);
        setError(null);

        let result;
        if (dapurId) {
          result = await fetchDapurDetail(dapurId, token);
        } else if (picId) {
          result = await findDapurByPIC(picId, picName, token);
        } else {
          throw new Error('Dapur ID atau PIC ID diperlukan');
        }

        const cachedData: CachedDapurData = {
          dapurInfo: result.dapurInfo,
          dapurId: result.dapurId || dapurId,
          timestamp: Date.now(),
        };

        // Update memory cache
        memoryCache.set(cacheId, cachedData);

        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
          console.log('[useDapurData] Saved to localStorage:', {
            key: CACHE_KEY,
            dapurInfo: result.dapurInfo,
            dapurId: result.dapurId || dapurId,
          });
        }

        const finalDapurId = result.dapurId || dapurId;
        setDapurInfo(result.dapurInfo);
        setDapurId(finalDapurId);
        console.log('✅ [useDapurData] Data updated and cached:', {
          dapurInfo: result.dapurInfo,
          dapurId: finalDapurId,
        });
        return result.dapurInfo;
      } catch (err) {
        console.error('❌ [useDapurData] Error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Gagal memuat data dapur';
        setError(errorMsg);
        throw err;
      } finally {
        fetchInProgress.current = false;
        setLoading(false);
      }
    },
    [fetchDapurDetail, findDapurByPIC]
  );

  // Initialize hook dengan proper useEffect
  useEffect(() => {
    if (hasInitialized.current) return;
    if (typeof window === 'undefined') return;

    hasInitialized.current = true;

    const initializeDapurData = async () => {
      const userData = localStorage.getItem('mbg_user');
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');
      const storedDapurId = localStorage.getItem('userDapurId');

      if (!userData || !token) {
        console.log('[useDapurData] No user data or token found');
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(userData);
        const picId = user.id;
        const picName = user.name;

        console.log('[useDapurData] Initializing with:', {
          storedDapurId: storedDapurId || 'NOT FOUND',
          picId,
          picName,
        });

        // Load data
        const result = await loadDapurData(storedDapurId || '', picId, picName, token);
        console.log('[useDapurData] Initialize complete, result:', result);
      } catch (err) {
        console.error('[useDapurData] Error initializing:', err);
        setError('Gagal inisialisasi data dapur');
        setLoading(false);
      }
    };

    initializeDapurData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    console.log('✅ [useDapurData] Cache cleared');
  }, []);

  return {
    loading,
    error,
    dapurInfo,
    dapurId,
    clearCache,
  };
};
