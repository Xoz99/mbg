'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://demombgv1.xyz';
const CACHE_KEY = 'sekolah_data_cache';
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

interface SekolahInfo {
  nama: string;
  alamat: string;
  kota: string;
  pic: string;
  picPhone: string;
  picEmail: string;
  kode: string;
  latitude: number;
  longitude: number;
}

interface CachedSekolahData {
  sekolahInfo: SekolahInfo;
  sekolahId: string;
  timestamp: number;
}

// Memory cache untuk session
const memoryCache = new Map<string, CachedSekolahData>();

export const useSekolahData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sekolahInfo, setSekolahInfo] = useState<SekolahInfo>({
    nama: '',
    alamat: '',
    kota: '',
    pic: '',
    picPhone: '',
    picEmail: '',
    kode: '',
    latitude: 0,
    longitude: 0,
  });
  const [sekolahId, setSekolahId] = useState('');

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

  // Generate kode sekolah
  const generateKodeSekolah = (id: string): string => {
    if (!id) return 'SKL-000';
    const shortId = String(id).slice(-3).toUpperCase();
    return `SKL-${shortId}`;
  };

  // Process sekolah data dan return SekolahInfo
  const processSekolahData = (sekolah: any): SekolahInfo => {
    if (!sekolah) {
      console.warn('[useSekolahData] processSekolahData: sekolah is null/undefined');
      return sekolahInfo;
    }

    const picData =
      sekolah.picSekolah && Array.isArray(sekolah.picSekolah) && sekolah.picSekolah.length > 0
        ? sekolah.picSekolah[0]
        : null;

    const alamat = String(sekolah.alamat || '');
    const kota = extractKota(alamat) || 'Sekolah';

    const newInfo: SekolahInfo = {
      nama: String(sekolah.nama || 'Sekolah MBG'),
      alamat: alamat,
      kota: kota,
      pic: picData ? String(picData.name || picData.namaLengkap || '-') : '-',
      picPhone: picData ? String(picData.phone || picData.noHp || '') : '',
      picEmail: picData ? String(picData.email || '') : '',
      kode: generateKodeSekolah(String(sekolah.id || '')),
      latitude: Number(sekolah.latitude) || 0,
      longitude: Number(sekolah.longitude) || 0,
    };

    console.log('[useSekolahData] processSekolahData processed:', newInfo);
    return newInfo;
  };

  // Find sekolah by PIC
  const findSekolahByPIC = useCallback(async (picId: string, token: string) => {
    try {
      console.log('[useSekolahData] Mencari sekolah untuk PIC ID:', picId);

      const response = await fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[useSekolahData] Sekolah list response:', result);

      let sekolahList = [];
      if (Array.isArray(result.data?.data)) {
        sekolahList = result.data.data;
      } else if (Array.isArray(result.data)) {
        sekolahList = result.data;
      } else if (Array.isArray(result)) {
        sekolahList = result;
      }

      let foundSekolah = null;

      for (const sekolah of sekolahList) {
        if (sekolah.picSekolah && Array.isArray(sekolah.picSekolah)) {
          const matchingPIC = sekolah.picSekolah.find((pic: any) => pic.id === picId);

          if (matchingPIC) {
            foundSekolah = sekolah;
            console.log('[useSekolahData] Sekolah ditemukan:', foundSekolah);
            break;
          }
        }
      }

      if (foundSekolah) {
        localStorage.setItem('sekolahId', foundSekolah.id);
        const processedInfo = processSekolahData(foundSekolah);
        console.log('[useSekolahData] findSekolahByPIC result:', {
          sekolahId: foundSekolah.id,
          sekolahInfo: processedInfo,
        });
        return { success: true, sekolahId: foundSekolah.id, sekolahInfo: processedInfo };
      } else {
        console.warn('[useSekolahData] Sekolah tidak ditemukan untuk PIC ini');
        throw new Error('Sekolah tidak ditemukan untuk PIC ini');
      }
    } catch (err) {
      console.error('[useSekolahData] Error mencari sekolah:', err);
      throw err;
    }
  }, []);

  // Fetch sekolah detail
  const fetchSekolahDetail = useCallback(async (sekolahId: string, token: string) => {
    try {
      console.log('[useSekolahData] Fetch detail sekolah:', sekolahId);

      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[useSekolahData] Sekolah detail:', result);

      let sekolah = result.data || result;

      if (sekolah && typeof sekolah === 'object' && !sekolah.nama && sekolah.data) {
        sekolah = sekolah.data;
      }

      const processedInfo = processSekolahData(sekolah);
      console.log('[useSekolahData] fetchSekolahDetail result:', {
        sekolahId: sekolahId,
        sekolahInfo: processedInfo,
      });
      return { success: true, sekolahId: sekolahId, sekolahInfo: processedInfo };
    } catch (err) {
      console.error('[useSekolahData] Error fetch detail:', err);
      throw err;
    }
  }, []);

  // Load data dengan cache
  const loadSekolahData = useCallback(
    async (sekolahId: string, picId: string, token: string) => {
      const cacheId = `${sekolahId || picId}_${token.substring(0, 10)}`;
      console.log('[useSekolahData] Loading data with cacheId:', cacheId);

      // 1. Check memory cache first
      if (memoryCache.has(cacheId)) {
        const cached = memoryCache.get(cacheId)!;
        const age = Date.now() - cached.timestamp;

        if (age < CACHE_EXPIRY) {
          console.log('✅ [useSekolahData] Using memory cache (fresh)');
          const finalSekolahId = cached.sekolahId || localStorage.getItem('sekolahId') || sekolahId;
          setSekolahInfo(cached.sekolahInfo);
          setSekolahId(finalSekolahId);
          setLoading(false);
          return cached.sekolahInfo;
        }
      }

      // 2. Check localStorage
      if (typeof window !== 'undefined') {
        const localCached = localStorage.getItem(CACHE_KEY);
        if (localCached) {
          try {
            const parsed = JSON.parse(localCached) as CachedSekolahData;
            const age = Date.now() - parsed.timestamp;

            console.log('[useSekolahData] localStorage cache found:', {
              age: age + 'ms',
              sekolahInfo: parsed.sekolahInfo,
              sekolahId: parsed.sekolahId,
            });

            if (age < CACHE_EXPIRY) {
              console.log('✅ [useSekolahData] Using localStorage cache (fresh)');
              memoryCache.set(cacheId, parsed);
              // Safety check: jika cache tidak punya sekolahId, ambil dari localStorage
              const finalSekolahId = parsed.sekolahId || localStorage.getItem('sekolahId') || sekolahId;
              console.log('[useSekolahData] Setting state from cache:', {
                sekolahInfo: parsed.sekolahInfo,
                sekolahId: parsed.sekolahId,
                finalSekolahId: finalSekolahId,
              });
              setSekolahInfo(parsed.sekolahInfo);
              setSekolahId(finalSekolahId);
              setLoading(false);
              return parsed.sekolahInfo;
            } else if (age < CACHE_EXPIRY * 2) {
              // Stale cache, use it but refetch in background
              console.log('⚠️ [useSekolahData] Using stale cache, refetching in background');
              const finalSekolahId = parsed.sekolahId || localStorage.getItem('sekolahId') || sekolahId;
              setSekolahInfo(parsed.sekolahInfo);
              setSekolahId(finalSekolahId);
              setLoading(false);
              memoryCache.set(cacheId, parsed);
              // Background refetch
              fetchAndUpdateSekolah(sekolahId, picId, token, cacheId);
              return parsed.sekolahInfo;
            }
          } catch (e) {
            console.warn('[useSekolahData] Failed to parse localStorage cache');
          }
        }
      }

      // 3. No cache, need to fetch
      console.log('📥 [useSekolahData] No cache found, fetching from API');
      return fetchAndUpdateSekolah(sekolahId, picId, token, cacheId);
    },
    []
  );

  // Fetch and update cache
  const fetchAndUpdateSekolah = useCallback(
    async (sekolahId: string, picId: string, token: string, cacheId: string) => {
      if (fetchInProgress.current) {
        console.log('[useSekolahData] Fetch already in progress, skipping');
        return null;
      }

      try {
        fetchInProgress.current = true;
        setLoading(true);
        setError(null);

        let result;
        if (sekolahId) {
          result = await fetchSekolahDetail(sekolahId, token);
        } else if (picId) {
          result = await findSekolahByPIC(picId, token);
        } else {
          throw new Error('Sekolah ID atau PIC ID diperlukan');
        }

        const cachedData: CachedSekolahData = {
          sekolahInfo: result.sekolahInfo,
          sekolahId: result.sekolahId || sekolahId,
          timestamp: Date.now(),
        };

        // Update memory cache
        memoryCache.set(cacheId, cachedData);

        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
          console.log('[useSekolahData] Saved to localStorage:', {
            key: CACHE_KEY,
            sekolahInfo: result.sekolahInfo,
            sekolahId: result.sekolahId || sekolahId,
          });
        }

        const finalSekolahId = result.sekolahId || sekolahId;
        setSekolahInfo(result.sekolahInfo);
        setSekolahId(finalSekolahId);
        console.log('✅ [useSekolahData] Data updated and cached:', {
          sekolahInfo: result.sekolahInfo,
          sekolahId: finalSekolahId,
        });
        return result.sekolahInfo;
      } catch (err) {
        console.error('❌ [useSekolahData] Error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Gagal memuat data sekolah';
        setError(errorMsg);
        throw err;
      } finally {
        fetchInProgress.current = false;
        setLoading(false);
      }
    },
    [fetchSekolahDetail, findSekolahByPIC]
  );

  // Initialize hook dengan proper useEffect
  useEffect(() => {
    if (hasInitialized.current) return;
    if (typeof window === 'undefined') return;

    hasInitialized.current = true;

    const initializeSekolahData = async () => {
      const userData = localStorage.getItem('mbg_user');
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');
      const storedSekolahId = localStorage.getItem('sekolahId');

      if (!userData || !token) {
        console.log('[useSekolahData] No user data or token found');
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(userData);
        const picId = user.id;

        console.log('[useSekolahData] Initializing with:', {
          storedSekolahId: storedSekolahId || 'NOT FOUND',
          picId,
        });

        // Load data
        const result = await loadSekolahData(storedSekolahId || '', picId, token);
        console.log('[useSekolahData] Initialize complete, result:', result);
      } catch (err) {
        console.error('[useSekolahData] Error initializing:', err);
        setError('Gagal inisialisasi data sekolah');
        setLoading(false);
      }
    };

    initializeSekolahData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    console.log('✅ [useSekolahData] Cache cleared');
  }, []);

  return {
    loading,
    error,
    sekolahInfo,
    sekolahId,
    clearCache,
  };
};
