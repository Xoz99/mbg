import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const CACHE_KEY = "dapur_bahan_cache"
const CACHE_EXPIRY = 1 * 60 * 1000 // 1 minute
const CACHE_EMIT_KEY = "dapur_bahan_cache_update"

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

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
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    return response.json()
  } catch (error) {
    throw error
  }
}

export interface BahanData {
  bahans: any[]
  stats: {
    totalBahan: number
    stokRendah: number
    habis: number
  }
  hash: string
  timestamp: number
}

const globalMemoryCache = new Map<string, BahanData>()

export const useBahanCache = (onCacheUpdate?: (data: BahanData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)

  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: BahanData) => {
      console.log("✅ [BAHAN CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  const fetchBahanData = useCallback(async () => {
    try {
      console.time("fetchBahan")

      const res = await apiCall<any>("/api/bahan?limit=100&page=1")
      const bahans = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []

      // Calculate stats
      const totalBahan = bahans.length
      const stokRendah = bahans.filter((b: any) => b.stok > 0 && b.stok <= 10).length
      const habis = bahans.filter((b: any) => b.stok <= 0).length

      console.timeEnd("fetchBahan")

      return {
        bahans,
        stats: {
          totalBahan,
          stokRendah,
          habis,
        },
      }
    } catch (err) {
      console.error("Error fetching bahan data:", err)
      throw err
    }
  }, [])

  const loadData = useCallback(async () => {
    const cacheId = "dapur_bahan"

    // 1. Check memory cache
    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      if (age < CACHE_EXPIRY) {
        console.log("✅ [BAHAN CACHE] Using memory cache (fresh)")
        setLoading(false)
        return cached
      }
    }

    // 2. Check localStorage
    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as BahanData
          const age = Date.now() - parsed.timestamp

          if (age < CACHE_EXPIRY) {
            console.log("✅ [BAHAN CACHE] Using localStorage cache (fresh)")
            globalMemoryCache.set(cacheId, parsed)
            setLoading(false)
            return parsed
          } else if (age < CACHE_EXPIRY * 2) {
            console.log("⚠️ [BAHAN CACHE] Using stale cache, refetching in background")
            setLoading(false)
            globalMemoryCache.set(cacheId, parsed)
            fetchAndUpdateCache(cacheId)
            return parsed
          }
        } catch (e) {
          console.warn("[BAHAN CACHE] Failed to parse localStorage cache")
        }
      }
    }

    return fetchAndUpdateCache(cacheId)
  }, [fetchBahanData])

  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      if (fetchInProgress.current) {
        console.log("[BAHAN] Fetch already in progress, skipping")
        return
      }

      try {
        fetchInProgress.current = true
        setLoading(true)

        const bahanData = await fetchBahanData()

        const validData: BahanData = {
          bahans: Array.isArray(bahanData.bahans) ? bahanData.bahans : [],
          stats: bahanData.stats,
          hash: simpleHash(JSON.stringify(bahanData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, validData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(validData))
        }

        console.log("✅ [BAHAN CACHE] Data updated and cached")
        return validData
      } catch (err) {
        console.error("❌ [BAHAN] Error:", err)
        setError(err instanceof Error ? err.message : "Gagal memuat data bahan")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchBahanData]
  )

  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
    console.log("✅ [BAHAN CACHE] Cleared")
  }, [])

  const refreshData = useCallback(async () => {
    const cacheId = "dapur_bahan"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache])

  const updateCache = useCallback(
    (newData: Partial<BahanData>, onSuccess?: (data: BahanData) => void) => {
      const cacheId = "dapur_bahan"

      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          bahans: [],
          stats: { totalBahan: 0, stokRendah: 0, habis: 0 },
          hash: "",
          timestamp: Date.now(),
        }
      }

      const updatedData: BahanData = {
        bahans: Array.isArray(newData.bahans) ? newData.bahans : cachedData.bahans,
        stats: newData.stats || cachedData.stats,
        hash: simpleHash(JSON.stringify(newData)),
        timestamp: Date.now(),
      }

      globalMemoryCache.set(cacheId, updatedData)

      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData))
      }

      console.log("✅ [BAHAN CACHE] Updated with optimistic data")

      const validUpdatedData: BahanData = {
        bahans: Array.isArray(updatedData.bahans) ? updatedData.bahans : [],
        stats: updatedData.stats,
        hash: updatedData.hash,
        timestamp: updatedData.timestamp,
      }
      cacheEmitter.emit(CACHE_EMIT_KEY, validUpdatedData)

      backgroundRefresh(cacheId, onSuccess)

      return updatedData
    },
    []
  )

  const backgroundRefresh = useCallback(
    async (cacheId: string, onSuccess?: (data: BahanData) => void) => {
      try {
        console.log("🔄 [BAHAN] Starting background refresh...")
        const freshData = await fetchBahanData()

        const cachedData: BahanData = {
          bahans: Array.isArray(freshData.bahans) ? freshData.bahans : [],
          stats: freshData.stats,
          hash: simpleHash(JSON.stringify(freshData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, cachedData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        console.log("✅ [BAHAN] Background refresh completed")

        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(cachedData)
          } catch (callbackErr) {
            console.error("⚠️ [BAHAN] Error in onSuccess callback:", callbackErr)
          }
        }

        return cachedData
      } catch (err) {
        console.error("⚠️ [BAHAN] Background refresh failed:", err)
      }
    },
    [fetchBahanData]
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
