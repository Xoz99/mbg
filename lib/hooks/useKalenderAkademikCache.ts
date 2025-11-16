import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demombgv1.xyz"
const CACHE_KEY = "sekolah_kalender_akademik_cache"
const CACHE_EXPIRY = 1 * 60 * 1000 // 1 minute
const CACHE_EMIT_KEY = "sekolah_kalender_akademik_cache_update"

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

interface CachedData {
  kalenderList: any[]
  hash: string
  timestamp: number
}

// ✅ Global memory cache (persists during session)
const globalMemoryCache = new Map<string, CachedData>()

export const useKalenderAkademikCache = (onCacheUpdate?: (data: CachedData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)
  const fetchInProgress = useRef(false)

  // ✅ Setup listener untuk cache updates dari component lain (dalam tab yang sama)
  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: CachedData) => {
      console.log("✅ [KALENDER AKADEMIK CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  // ✅ Fetch kalender akademik data
  const fetchKalenderData = useCallback(async (schoolId: string, token: string) => {
    try {
      console.time("fetchKalender")
      const response = await fetch(`${API_BASE_URL}/api/kalender-akademik?sekolahId=${schoolId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error(`API Error: ${response.status}`)

      const data = await response.json()

      const kalenderList = Array.isArray(data.data?.kalenders)
        ? data.data.kalenders
        : Array.isArray(data.data?.data)
          ? data.data.data
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : []

      if (!Array.isArray(kalenderList)) {
        console.warn("⚠️ [FETCH KALENDER] Invalid response format, returning empty array")
        return []
      }

      console.timeEnd("fetchKalender")
      return kalenderList
    } catch (err) {
      console.error("Error fetching kalender akademik:", err)
      throw err
    }
  }, [])

  // ✅ Main fetch function (full refresh from API)
  const fetchAllDataFull = useCallback(
    async (schoolId: string, token: string) => {
      console.log("🔄 [KALENDER] Starting data fetch")
      console.time("Total Fetch Time")

      try {
        const kalenderList = await fetchKalenderData(schoolId, token)

        console.timeEnd("Total Fetch Time")
        return kalenderList
      } catch (err) {
        console.error("❌ [KALENDER] Error:", err)
        throw err
      }
    },
    [fetchKalenderData]
  )

  // ✅ Load data with cache priority
  const loadData = useCallback(
    async (schoolId: string, token: string) => {
      const cacheId = `${schoolId}_${token.substring(0, 10)}`

      // 1. Check memory cache first (fastest)
      if (globalMemoryCache.has(cacheId)) {
        const cached = globalMemoryCache.get(cacheId)!
        const age = Date.now() - cached.timestamp

        if (age < CACHE_EXPIRY) {
          console.log("✅ [KALENDER CACHE] Using memory cache (fresh)")
          setLoading(false)
          return cached
        }
      }

      // 2. Check localStorage
      if (typeof window !== "undefined") {
        const localCached = localStorage.getItem(CACHE_KEY)
        if (localCached) {
          try {
            const parsed = JSON.parse(localCached) as CachedData
            const age = Date.now() - parsed.timestamp

            if (age < CACHE_EXPIRY) {
              console.log("✅ [KALENDER CACHE] Using localStorage cache (fresh)")
              globalMemoryCache.set(cacheId, parsed)
              setLoading(false)
              return parsed
            } else if (age < CACHE_EXPIRY * 2) {
              console.log("⚠️ [KALENDER CACHE] Using stale cache, refetching in background")
              setLoading(false)
              globalMemoryCache.set(cacheId, parsed)
              fetchAndUpdateCache(schoolId, token, cacheId)
              return parsed
            }
          } catch (e) {
            console.warn("[KALENDER CACHE] Failed to parse localStorage cache")
          }
        }
      }

      // 3. No cache, need to fetch
      console.log("📥 [KALENDER CACHE] No cache found, fetching from API")
      return fetchAndUpdateCache(schoolId, token, cacheId)
    },
    []
  )

  // ✅ Fetch and update both memory and localStorage cache
  const fetchAndUpdateCache = useCallback(
    async (schoolId: string, token: string, cacheId: string) => {
      if (fetchInProgress.current) {
        console.log("[KALENDER] Fetch already in progress, skipping")
        return
      }

      try {
        fetchInProgress.current = true
        setLoading(true)

        const kalenderList = await fetchAllDataFull(schoolId, token)

        // Safety checks untuk ensure valid data structure
        const validKalenderList = Array.isArray(kalenderList) ? kalenderList : []

        const newHash = simpleHash(JSON.stringify(validKalenderList))
        const cachedData: CachedData = {
          kalenderList: validKalenderList,
          hash: newHash,
          timestamp: Date.now(),
        }

        // Update UNIFIED memory cache
        globalMemoryCache.set(cacheId, cachedData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        console.log("✅ [KALENDER CACHE] Data updated and cached")
        return cachedData
      } catch (err) {
        console.error("❌ [KALENDER] Error:", err)
        setError(err instanceof Error ? err.message : "Gagal memuat data")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchAllDataFull]
  )

  // ✅ Clear cache
  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
    console.log("✅ [KALENDER CACHE] Cleared")
  }, [])

  // ✅ Force refresh
  const refreshData = useCallback(
    async (schoolId: string, token: string) => {
      const cacheId = `${schoolId}_${token.substring(0, 10)}`
      clearCache()
      return fetchAndUpdateCache(schoolId, token, cacheId)
    },
    [clearCache, fetchAndUpdateCache]
  )

  // ✅ Update cache dengan data baru (optimistic + background refresh)
  const updateCache = useCallback(
    (schoolId: string, token: string, newData: Partial<CachedData>, onSuccess?: (data: CachedData) => void) => {
      const cacheId = `${schoolId}_${token.substring(0, 10)}`

      // Get existing cache
      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          kalenderList: [],
          hash: "",
          timestamp: Date.now(),
        }
      }

      // Merge new data (optimistic)
      const validKalenderList = Array.isArray(newData.kalenderList) ? newData.kalenderList : cachedData.kalenderList
      const updatedData: CachedData = {
        kalenderList: validKalenderList,
        hash: simpleHash(JSON.stringify(validKalenderList)),
        timestamp: Date.now(),
      }

      // Update UNIFIED memory cache immediately
      globalMemoryCache.set(cacheId, updatedData)

      // Update localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData))
      }

      console.log("✅ [KALENDER CACHE] Updated with optimistic data - AUTO SYNC to all pages!")

      // 📢 Emit instant update ke semua components yang subscribe (instant in-tab sync!)
      // Ensure data valid sebelum emit
      const validUpdatedData: CachedData = {
        kalenderList: Array.isArray(updatedData.kalenderList) ? updatedData.kalenderList : [],
        hash: updatedData.hash,
        timestamp: updatedData.timestamp,
      }
      cacheEmitter.emit(CACHE_EMIT_KEY, validUpdatedData)

      // 🔄 Background refresh: Fetch latest data dari API tanpa blocking UI
      backgroundRefresh(schoolId, token, cacheId, (freshData) => {
        // 📢 Emit fresh data juga
        if (freshData) {
          const validFreshData: CachedData = {
            kalenderList: Array.isArray(freshData.kalenderList) ? freshData.kalenderList : [],
            hash: freshData.hash,
            timestamp: freshData.timestamp,
          }
          cacheEmitter.emit(CACHE_EMIT_KEY, validFreshData)
        }
        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(freshData)
          } catch (err) {
            console.error("⚠️ [KALENDER] Error in onSuccess callback:", err)
          }
        }
      })

      return updatedData
    },
    []
  )

  // ✅ Background refresh dengan callback
  const backgroundRefresh = useCallback(
    async (schoolId: string, token: string, cacheId: string, onSuccess?: (data: CachedData) => void) => {
      try {
        console.log("🔄 [KALENDER] Starting background refresh...")
        const freshData = await fetchAllDataFull(schoolId, token)

        // Safety checks untuk ensure valid data structure
        const kalenderList = Array.isArray(freshData) ? freshData : []

        const newHash = simpleHash(JSON.stringify(kalenderList))
        const cachedData: CachedData = {
          kalenderList,
          hash: newHash,
          timestamp: Date.now(),
        }

        // Update UNIFIED memory cache
        globalMemoryCache.set(cacheId, cachedData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        console.log("✅ [KALENDER] Background refresh completed successfully")

        // Trigger callback untuk update component state dengan data fresh
        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(cachedData)
          } catch (callbackErr) {
            console.error("⚠️ [KALENDER] Error in onSuccess callback:", callbackErr)
          }
        }

        return cachedData
      } catch (err) {
        console.error("⚠️ [KALENDER] Background refresh failed:", err)
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
