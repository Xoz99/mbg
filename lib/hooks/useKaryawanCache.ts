import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://demombgv1.xyz"
const CACHE_KEY = "dapur_karyawan_cache"
const CACHE_EXPIRY = 1 * 60 * 1000
const CACHE_EMIT_KEY = "dapur_karyawan_cache_update"

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

async function getDapurId() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("dapurId") || localStorage.getItem("mbg_dapur_id") || ""
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

export interface KaryawanData {
  karyawans: any[]
  stats: {
    totalKaryawan: number
    aktif: number
    nonaktif: number
  }
  hash: string
  timestamp: number
}

const globalMemoryCache = new Map<string, KaryawanData>()

export const useKaryawanCache = (onCacheUpdate?: (data: KaryawanData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)

  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: KaryawanData) => {
      console.log("✅ [KARYAWAN CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  const fetchKaryawanData = useCallback(async () => {
    try {
      console.time("fetchKaryawan")

      const dapurId = await getDapurId()
      if (!dapurId) throw new Error("Dapur ID not found")

      const res = await apiCall<any>(`/api/dapur/${dapurId}/karyawan?limit=100&page=1`)
      const karyawans = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []

      const totalKaryawan = karyawans.length
      const aktif = karyawans.filter((k: any) => k.status === "AKTIF").length
      const nonaktif = totalKaryawan - aktif

      console.timeEnd("fetchKaryawan")

      return {
        karyawans,
        stats: {
          totalKaryawan,
          aktif,
          nonaktif,
        },
      }
    } catch (err) {
      console.error("Error fetching karyawan data:", err)
      throw err
    }
  }, [])

  const loadData = useCallback(async () => {
    const cacheId = "dapur_karyawan"

    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      if (age < CACHE_EXPIRY) {
        console.log("✅ [KARYAWAN CACHE] Using memory cache (fresh)")
        setLoading(false)
        return cached
      }
    }

    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as KaryawanData
          const age = Date.now() - parsed.timestamp

          if (age < CACHE_EXPIRY) {
            console.log("✅ [KARYAWAN CACHE] Using localStorage cache (fresh)")
            globalMemoryCache.set(cacheId, parsed)
            setLoading(false)
            return parsed
          } else if (age < CACHE_EXPIRY * 2) {
            console.log("⚠️ [KARYAWAN CACHE] Using stale cache, refetching in background")
            setLoading(false)
            globalMemoryCache.set(cacheId, parsed)
            fetchAndUpdateCache(cacheId)
            return parsed
          }
        } catch (e) {
          console.warn("[KARYAWAN CACHE] Failed to parse localStorage cache")
        }
      }
    }

    return fetchAndUpdateCache(cacheId)
  }, [fetchKaryawanData])

  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      if (fetchInProgress.current) {
        console.log("[KARYAWAN] Fetch already in progress, skipping")
        return
      }

      try {
        fetchInProgress.current = true
        setLoading(true)

        const karyawanData = await fetchKaryawanData()

        const validData: KaryawanData = {
          karyawans: Array.isArray(karyawanData.karyawans) ? karyawanData.karyawans : [],
          stats: karyawanData.stats,
          hash: simpleHash(JSON.stringify(karyawanData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, validData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(validData))
        }

        console.log("✅ [KARYAWAN CACHE] Data updated and cached")
        return validData
      } catch (err) {
        console.error("❌ [KARYAWAN] Error:", err)
        setError(err instanceof Error ? err.message : "Gagal memuat data karyawan")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchKaryawanData]
  )

  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
    console.log("✅ [KARYAWAN CACHE] Cleared")
  }, [])

  const refreshData = useCallback(async () => {
    const cacheId = "dapur_karyawan"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache])

  const updateCache = useCallback(
    (newData: Partial<KaryawanData>, onSuccess?: (data: KaryawanData) => void) => {
      const cacheId = "dapur_karyawan"

      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          karyawans: [],
          stats: { totalKaryawan: 0, aktif: 0, nonaktif: 0 },
          hash: "",
          timestamp: Date.now(),
        }
      }

      const updatedData: KaryawanData = {
        karyawans: Array.isArray(newData.karyawans) ? newData.karyawans : cachedData.karyawans,
        stats: newData.stats || cachedData.stats,
        hash: simpleHash(JSON.stringify(newData)),
        timestamp: Date.now(),
      }

      globalMemoryCache.set(cacheId, updatedData)

      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData))
      }

      console.log("✅ [KARYAWAN CACHE] Updated with optimistic data")

      const validUpdatedData: KaryawanData = {
        karyawans: Array.isArray(updatedData.karyawans) ? updatedData.karyawans : [],
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
    async (cacheId: string, onSuccess?: (data: KaryawanData) => void) => {
      try {
        console.log("🔄 [KARYAWAN] Starting background refresh...")
        const freshData = await fetchKaryawanData()

        const cachedData: KaryawanData = {
          karyawans: Array.isArray(freshData.karyawans) ? freshData.karyawans : [],
          stats: freshData.stats,
          hash: simpleHash(JSON.stringify(freshData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, cachedData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        console.log("✅ [KARYAWAN] Background refresh completed")

        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(cachedData)
          } catch (callbackErr) {
            console.error("⚠️ [KARYAWAN] Error in onSuccess callback:", callbackErr)
          }
        }

        return cachedData
      } catch (err) {
        console.error("⚠️ [KARYAWAN] Background refresh failed:", err)
      }
    },
    [fetchKaryawanData]
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
