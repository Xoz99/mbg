import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const CACHE_KEY = "dapur_distribusi_cache"
const CACHE_EXPIRY = 1 * 60 * 1000
const CACHE_EMIT_KEY = "dapur_distribusi_cache_update"

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
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

export interface DistribusiData {
  distribusions: any[]
  stats: {
    totalDistribusi: number
    selesai: number
    proses: number
  }
  hash: string
  timestamp: number
}

const globalMemoryCache = new Map<string, DistribusiData>()

export const useDistribusiCache = (onCacheUpdate?: (data: DistribusiData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)

  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: DistribusiData) => {
      console.log("✅ [DISTRIBUSI CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  const fetchDistribusiData = useCallback(async () => {
    try {
      console.time("fetchDistribusi")

      const res = await apiCall<any>("/api/distribusi?limit=100&page=1")
      const distribusions = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []

      const totalDistribusi = distribusions.length
      const selesai = distribusions.filter((d: any) => d.status === "SELESAI").length
      const proses = distribusions.filter((d: any) => d.status === "PROSES").length

      console.timeEnd("fetchDistribusi")

      return {
        distribusions,
        stats: {
          totalDistribusi,
          selesai,
          proses,
        },
      }
    } catch (err) {
      console.error("Error fetching distribusi data:", err)
      throw err
    }
  }, [])

  const loadData = useCallback(async () => {
    const cacheId = "dapur_distribusi"

    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      if (age < CACHE_EXPIRY) {
        console.log("✅ [DISTRIBUSI CACHE] Using memory cache (fresh)")
        setLoading(false)
        return cached
      }
    }

    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as DistribusiData
          const age = Date.now() - parsed.timestamp

          if (age < CACHE_EXPIRY) {
            console.log("✅ [DISTRIBUSI CACHE] Using localStorage cache (fresh)")
            globalMemoryCache.set(cacheId, parsed)
            setLoading(false)
            return parsed
          }
        } catch (e) {
          console.warn("[DISTRIBUSI CACHE] Failed to parse localStorage cache")
        }
      }
    }

    return fetchAndUpdateCache(cacheId)
  }, [fetchDistribusiData])

  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      if (fetchInProgress.current) return

      try {
        fetchInProgress.current = true
        setLoading(true)

        const distribusiData = await fetchDistribusiData()

        const validData: DistribusiData = {
          distribusions: Array.isArray(distribusiData.distribusions) ? distribusiData.distribusions : [],
          stats: distribusiData.stats,
          hash: simpleHash(JSON.stringify(distribusiData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, validData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(validData))
        }

        console.log("✅ [DISTRIBUSI CACHE] Data updated and cached")
        return validData
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data distribusi")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchDistribusiData]
  )

  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
  }, [])

  const refreshData = useCallback(async () => {
    const cacheId = "dapur_distribusi"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache])

  const updateCache = useCallback(
    (newData: Partial<DistribusiData>, onSuccess?: (data: DistribusiData) => void) => {
      const cacheId = "dapur_distribusi"

      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          distribusions: [],
          stats: { totalDistribusi: 0, selesai: 0, proses: 0 },
          hash: "",
          timestamp: Date.now(),
        }
      }

      const updatedData: DistribusiData = {
        distribusions: Array.isArray(newData.distribusions) ? newData.distribusions : cachedData.distribusions,
        stats: newData.stats || cachedData.stats,
        hash: simpleHash(JSON.stringify(newData)),
        timestamp: Date.now(),
      }

      globalMemoryCache.set(cacheId, updatedData)

      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData))
      }

      cacheEmitter.emit(CACHE_EMIT_KEY, updatedData)

      return updatedData
    },
    []
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
