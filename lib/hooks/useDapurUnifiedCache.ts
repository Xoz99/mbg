import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demombgv1.xyz"
const CACHE_EMIT_KEY = "dapur_unified_cache_update"
const CACHE_KEY = "dapur_unified_cache"
const CACHE_EXPIRY = 2 * 60 * 1000 // 2 minutes

// ✅ Simple hash function untuk compare data changes
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

interface DapurCachedData {
  menuPlannings: any[]
  produksiBatches: any[]
  bahanData: any[]
  karyawanData: any[]
  distribusiData: any[]
  laporanData: any[]
  hash: string
  timestamp: number
}

interface DapurData {
  menuPlannings: any[]
  produksiBatches: any[]
  bahanData: any[]
  karyawanData: any[]
  distribusiData: any[]
  laporanData: any[]
}

// ✅ UNIFIED Global memory cache (single source of truth for all dapur pages)
const globalMemoryCache = new Map<string, DapurCachedData>()

async function getAuthToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("authToken") || localStorage.getItem("mbg_token") || ""
}

async function apiCall<T>(endpoint: string, options: any = {}): Promise<T> {
  try {
    const token = await getAuthToken()
    const url = `${API_BASE_URL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.json()
  } catch (error) {
    throw error
  }
}

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data?.data)) return data.data.data
  if (Array.isArray(data?.data)) return data.data
  return []
}

export const useDapurUnifiedCache = (onCacheUpdate?: (data: DapurCachedData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)

  // ✅ Setup listener untuk cache updates dari component lain (dalam tab yang sama)
  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: DapurCachedData) => {
      console.log("✅ [DAPUR UNIFIED CACHE] Received instant update from other component!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  // ✅ Fetch menu planning
  const fetchMenuPlanningsReturn = useCallback(async () => {
    try {
      console.time("fetchMenuPlannings")
      const res = await apiCall<any>("/api/menu-planning?limit=100&page=1")
      const plannings = extractArray(res.data || [])
      console.log("[UNIFIED] Menu plannings:", plannings.length)
      console.timeEnd("fetchMenuPlannings")
      return plannings
    } catch (err) {
      console.error("[UNIFIED] Error fetching menu plannings:", err)
      return []
    }
  }, [])

  // ✅ Fetch produksi batches untuk hari ini
  const fetchProduksiBatchesReturn = useCallback(async (plannings: any[]) => {
    try {
      console.time("fetchProduksiBatches")

      // Get today's date dalam local timezone (UTC+7)
      const now = new Date()
      const todayLocalDate = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      const today = `${todayLocalDate.getUTCFullYear()}-${String(todayLocalDate.getUTCMonth() + 1).padStart(2, "0")}-${String(todayLocalDate.getUTCDate()).padStart(2, "0")}`
      console.log(`[UNIFIED] Today's date (local): ${today}`)

      // Parallel fetch menu-harian untuk semua planning
      const menuPromises = plannings.map((planning) =>
        apiCall<any>(
          `/api/menu-planning/${planning.id}/menu-harian?limit=20&page=1&tanggal=${today}`
        )
          .then((menuRes) => {
            const menus = extractArray(menuRes?.data || [])
            return { planning, menus }
          })
          .catch(() => ({ planning, menus: [] }))
      )

      const menuResults = await Promise.all(menuPromises)

      // Parallel fetch checkpoints untuk semua menu hari ini
      const todayMenus: any[] = []
      menuResults.forEach(({ planning, menus }) => {
        menus.forEach((menu) => {
          const menuDate = menu.tanggal
          if (menuDate?.split("T")[0] === today || menuDate === today) {
            todayMenus.push({ planning, menu })
          }
        })
      })

      const batchPromises = todayMenus.map(({ planning, menu }) =>
        apiCall<any>(`/api/menu-harian/${menu.id}/checkpoint?limit=10`)
          .catch(() => ({ data: { data: [] } }))
          .then((checkpointRes) => {
            const checkpoints = extractArray(checkpointRes?.data || [])
            const sekolahName = planning.sekolah?.nama || "Unknown"
            const targetTrays = menu.targetTray || 1200

            return {
              id: `BATCH-${menu.id}`,
              dailyMenu: menu,
              menuId: menu.id,
              sekolahId: planning.sekolahId,
              sekolahName: sekolahName,
              status:
                checkpoints.length >= 4
                  ? "COMPLETED"
                  : checkpoints.length >= 2
                    ? "IN_PROGRESS"
                    : "PREPARING",
              expectedTrays: targetTrays,
              packedTrays:
                checkpoints.length >= 3
                  ? targetTrays
                  : checkpoints.length >= 2
                    ? Math.round(targetTrays / 2)
                    : 0,
              checkpoints: checkpoints,
              createdBy: "System",
              startTime: menu.jamMulaiMasak,
              endTime: menu.jamSelesaiMasak,
            }
          })
          .catch(() => null)
      )

      const batchesData = (await Promise.all(batchPromises)).filter((b) => b !== null)
      console.log("[UNIFIED] Produksi batches:", batchesData.length)
      console.timeEnd("fetchProduksiBatches")
      return batchesData
    } catch (err) {
      console.error("[UNIFIED] Error fetching produksi batches:", err)
      return []
    }
  }, [])

  // ✅ Fetch bahan (ingredients)
  const fetchBahanReturn = useCallback(async () => {
    try {
      console.time("fetchBahan")
      const res = await apiCall<any>("/api/bahan?limit=100&page=1")
      const bahan = extractArray(res.data || [])
      console.log("[UNIFIED] Bahan items:", bahan.length)
      console.timeEnd("fetchBahan")
      return bahan
    } catch (err) {
      console.error("[UNIFIED] Error fetching bahan:", err)
      return []
    }
  }, [])

  // ✅ Fetch karyawan (employees)
  const fetchKaryawanReturn = useCallback(async () => {
    try {
      console.time("fetchKaryawan")
      const res = await apiCall<any>("/api/karyawan?limit=100&page=1")
      const karyawan = extractArray(res.data || [])
      console.log("[UNIFIED] Karyawan items:", karyawan.length)
      console.timeEnd("fetchKaryawan")
      return karyawan
    } catch (err) {
      console.error("[UNIFIED] Error fetching karyawan:", err)
      return []
    }
  }, [])

  // ✅ Fetch distribusi
  const fetchDistribusiReturn = useCallback(async () => {
    try {
      console.time("fetchDistribusi")
      const res = await apiCall<any>("/api/distribusi?limit=100&page=1")
      const distribusi = extractArray(res.data || [])
      console.log("[UNIFIED] Distribusi items:", distribusi.length)
      console.timeEnd("fetchDistribusi")
      return distribusi
    } catch (err) {
      console.error("[UNIFIED] Error fetching distribusi:", err)
      return []
    }
  }, [])

  // ✅ Fetch laporan
  const fetchLaporanReturn = useCallback(async () => {
    try {
      console.time("fetchLaporan")
      const res = await apiCall<any>("/api/laporan?limit=100&page=1")
      const laporan = extractArray(res.data || [])
      console.log("[UNIFIED] Laporan items:", laporan.length)
      console.timeEnd("fetchLaporan")
      return laporan
    } catch (err) {
      console.error("[UNIFIED] Error fetching laporan:", err)
      return []
    }
  }, [])

  // ✅ Main fetch function (full refresh from API)
  const fetchAllDataFull = useCallback(
    async (): Promise<DapurData> => {
      console.log("🔄 [DAPUR UNIFIED] Starting full data fetch for all modules")
      console.time("Total Dapur Unified Fetch Time")

      try {
        // 1. Fetch menu plannings terlebih dahulu
        console.log("[DAPUR FETCH ALL] Step 1: Fetching menu plannings...")
        const menuPlannings = await fetchMenuPlanningsReturn()

        // 2. Fetch produksi batches (depends on menu plannings)
        console.log("[DAPUR FETCH ALL] Step 2: Fetching produksi batches...")
        const produksiBatches = await fetchProduksiBatchesReturn(menuPlannings)

        // 3. Fetch bahan, karyawan, distribusi, laporan in parallel
        console.log("[DAPUR FETCH ALL] Step 3: Fetching other data in parallel...")
        const [bahanData, karyawanData, distribusiData, laporanData] = await Promise.all([
          fetchBahanReturn(),
          fetchKaryawanReturn(),
          fetchDistribusiReturn(),
          fetchLaporanReturn(),
        ])

        const data: DapurData = {
          menuPlannings,
          produksiBatches,
          bahanData,
          karyawanData,
          distribusiData,
          laporanData,
        }

        console.timeEnd("Total Dapur Unified Fetch Time")
        return data
      } catch (err) {
        console.error("❌ [DAPUR UNIFIED] Error:", err)
        throw err
      }
    },
    [fetchMenuPlanningsReturn, fetchProduksiBatchesReturn, fetchBahanReturn, fetchKaryawanReturn, fetchDistribusiReturn, fetchLaporanReturn]
  )

  // ✅ Load data with cache priority - UNIFIED
  const loadData = useCallback(async () => {
    const cacheId = "dapur_unified"

    // 1. Check memory cache first (fastest)
    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      if (age < CACHE_EXPIRY) {
        console.log("✅ [DAPUR UNIFIED CACHE] Using memory cache (fresh)", { age, expiry: CACHE_EXPIRY })
        setLoading(false)
        // ✅ Notify callback so component gets updated
        if (onCacheUpdate) {
          onCacheUpdate(cached)
        }
        return cached
      }
    }

    // 2. Check localStorage
    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as DapurCachedData
          const age = Date.now() - parsed.timestamp

          if (age < CACHE_EXPIRY) {
            console.log("✅ [DAPUR UNIFIED CACHE] Using localStorage cache (fresh)", { age, expiry: CACHE_EXPIRY })
            globalMemoryCache.set(cacheId, parsed)
            setLoading(false)
            // ✅ Notify callback
            if (onCacheUpdate) {
              onCacheUpdate(parsed)
            }
            return parsed
          } else if (age < CACHE_EXPIRY * 2) {
            console.log("⚠️ [DAPUR UNIFIED CACHE] Using stale cache, refetching in background", { age, maxStale: CACHE_EXPIRY * 2 })
            setLoading(false)
            globalMemoryCache.set(cacheId, parsed)
            // ✅ Notify callback with stale data first
            if (onCacheUpdate) {
              onCacheUpdate(parsed)
            }
            // Then refresh in background
            fetchAndUpdateCache(cacheId)
            return parsed
          }
        } catch (e) {
          console.warn("[DAPUR UNIFIED CACHE] Failed to parse localStorage cache", e)
        }
      }
    }

    // 3. No cache, need to fetch
    console.log("📥 [DAPUR UNIFIED CACHE] No cache found, fetching from API")
    return fetchAndUpdateCache(cacheId)
  }, [onCacheUpdate])

  // ✅ Fetch and update both memory and localStorage cache
  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      if (fetchInProgress.current) {
        console.log("[DAPUR UNIFIED] Fetch already in progress, skipping")
        return
      }

      try {
        fetchInProgress.current = true
        setLoading(true)

        const data = await fetchAllDataFull()

        // Safety checks untuk ensure valid data structure
        const menuPlannings = Array.isArray(data.menuPlannings) ? data.menuPlannings : []
        const produksiBatches = Array.isArray(data.produksiBatches) ? data.produksiBatches : []
        const bahanData = Array.isArray(data.bahanData) ? data.bahanData : []
        const karyawanData = Array.isArray(data.karyawanData) ? data.karyawanData : []
        const distribusiData = Array.isArray(data.distribusiData) ? data.distribusiData : []
        const laporanData = Array.isArray(data.laporanData) ? data.laporanData : []

        const newHash = simpleHash(
          JSON.stringify({
            menuPlannings,
            produksiBatches,
            bahanData,
            karyawanData,
            distribusiData,
            laporanData,
          })
        )

        const cachedData: DapurCachedData = {
          menuPlannings,
          produksiBatches,
          bahanData,
          karyawanData,
          distribusiData,
          laporanData,
          hash: newHash,
          timestamp: Date.now(),
        }

        // Update UNIFIED memory cache
        globalMemoryCache.set(cacheId, cachedData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        console.log("✅ [DAPUR UNIFIED CACHE] Data updated and cached!")

        // ✅ Notify callback immediately
        if (onCacheUpdate) {
          onCacheUpdate(cachedData)
        }

        // 📢 Emit instant update ke semua subscribers
        cacheEmitter.emit(CACHE_EMIT_KEY, cachedData)

        return cachedData
      } catch (err) {
        console.error("❌ [DAPUR UNIFIED] Error:", err)
        setError(err instanceof Error ? err.message : "Gagal memload data")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchAllDataFull, onCacheUpdate]
  )

  // ✅ Clear cache
  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
    console.log("✅ [DAPUR UNIFIED CACHE] Cleared")
  }, [])

  // ✅ Force refresh
  const refreshData = useCallback(async () => {
    const cacheId = "dapur_unified"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache])

  // ✅ Update cache dengan data baru (optimistic + background refresh)
  const updateCache = useCallback(
    (newData: Partial<DapurCachedData>, onSuccess?: (data: DapurCachedData) => void) => {
      const cacheId = "dapur_unified"

      // Get existing cache
      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          menuPlannings: [],
          produksiBatches: [],
          bahanData: [],
          karyawanData: [],
          distribusiData: [],
          laporanData: [],
          hash: "",
          timestamp: Date.now(),
        }
      }

      // Merge new data (optimistic)
      const updatedData: DapurCachedData = {
        menuPlannings: Array.isArray(newData.menuPlannings) ? newData.menuPlannings : cachedData.menuPlannings,
        produksiBatches: Array.isArray(newData.produksiBatches) ? newData.produksiBatches : cachedData.produksiBatches,
        bahanData: Array.isArray(newData.bahanData) ? newData.bahanData : cachedData.bahanData,
        karyawanData: Array.isArray(newData.karyawanData) ? newData.karyawanData : cachedData.karyawanData,
        distribusiData: Array.isArray(newData.distribusiData) ? newData.distribusiData : cachedData.distribusiData,
        laporanData: Array.isArray(newData.laporanData) ? newData.laporanData : cachedData.laporanData,
        hash: simpleHash(JSON.stringify(newData)),
        timestamp: Date.now(),
      }

      // Update UNIFIED memory cache immediately
      globalMemoryCache.set(cacheId, updatedData)

      // Update localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData))
      }

      console.log("✅ [DAPUR UNIFIED CACHE] Updated with optimistic data - AUTO SYNC to all pages!")

      // 📢 Emit instant update ke semua subscribers
      cacheEmitter.emit(CACHE_EMIT_KEY, updatedData)

      // 🔄 Background refresh
      backgroundRefresh(cacheId, onSuccess)

      return updatedData
    },
    []
  )

  // ✅ Background refresh dengan callback
  const backgroundRefresh = useCallback(
    async (cacheId: string, onSuccess?: (data: DapurCachedData) => void) => {
      try {
        console.log("🔄 [DAPUR UNIFIED] Starting background refresh...")
        const freshData = await fetchAllDataFull()

        // Safety checks
        const cachedData: DapurCachedData = {
          menuPlannings: Array.isArray(freshData.menuPlannings) ? freshData.menuPlannings : [],
          produksiBatches: Array.isArray(freshData.produksiBatches) ? freshData.produksiBatches : [],
          bahanData: Array.isArray(freshData.bahanData) ? freshData.bahanData : [],
          karyawanData: Array.isArray(freshData.karyawanData) ? freshData.karyawanData : [],
          distribusiData: Array.isArray(freshData.distribusiData) ? freshData.distribusiData : [],
          laporanData: Array.isArray(freshData.laporanData) ? freshData.laporanData : [],
          hash: simpleHash(JSON.stringify(freshData)),
          timestamp: Date.now(),
        }

        // Update UNIFIED memory cache
        globalMemoryCache.set(cacheId, cachedData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        console.log("✅ [DAPUR UNIFIED] Background refresh completed successfully")

        // Trigger callback
        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(cachedData)
          } catch (callbackErr) {
            console.error("⚠️ [DAPUR UNIFIED] Error in onSuccess callback:", callbackErr)
          }
        }

        return cachedData
      } catch (err) {
        console.error("⚠️ [DAPUR UNIFIED] Background refresh failed:", err)
        // Don't throw - let UI continue with optimistic data
      }
    },
    [fetchAllDataFull]
  )

  return {
    loading,
    error,
    loadData,
    refreshData,
    clearCache,
    updateCache,
  }
}
