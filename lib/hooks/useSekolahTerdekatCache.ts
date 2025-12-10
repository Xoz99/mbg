import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const CACHE_KEY = "dapur_sekolah_terdekat_cache"
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes
const CACHE_EMIT_KEY = "dapur_sekolah_terdekat_cache_update"

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

export interface SekolahTerdekatData {
  sekolah: any[]
  stats: {
    totalSekolah: number
  }
  hash: string
  timestamp: number
}

const globalMemoryCache = new Map<string, SekolahTerdekatData>()

export const useSekolahTerdekatCache = (onCacheUpdate?: (data: SekolahTerdekatData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)

  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: SekolahTerdekatData) => {
      console.log("✅ [SEKOLAH TERDEKAT CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  const fetchSekolahTerdekatData = useCallback(async () => {
    try {
      console.time("fetchSekolahTerdekat")

      const res = await apiCall<any>("/api/sekolah?limit=100&page=1&sort=jarak")
      const sekolah = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []

      console.timeEnd("fetchSekolahTerdekat")

      return {
        sekolah,
        stats: {
          totalSekolah: sekolah.length,
        },
      }
    } catch (err) {
      console.error("Error fetching sekolah terdekat data:", err)
      throw err
    }
  }, [])

  const loadData = useCallback(async () => {
    const cacheId = "dapur_sekolah_terdekat"

    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      if (age < CACHE_EXPIRY) {
        console.log("✅ [SEKOLAH TERDEKAT CACHE] Using memory cache (fresh)")
        setLoading(false)
        return cached
      }
    }

    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as SekolahTerdekatData
          const age = Date.now() - parsed.timestamp

          if (age < CACHE_EXPIRY) {
            console.log("✅ [SEKOLAH TERDEKAT CACHE] Using localStorage cache (fresh)")
            globalMemoryCache.set(cacheId, parsed)
            setLoading(false)
            return parsed
          }
        } catch (e) {
          console.warn("[SEKOLAH TERDEKAT CACHE] Failed to parse localStorage cache")
        }
      }
    }

    return fetchAndUpdateCache(cacheId)
  }, [fetchSekolahTerdekatData])

  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      if (fetchInProgress.current) return

      try {
        fetchInProgress.current = true
        setLoading(true)

        const sekolahData = await fetchSekolahTerdekatData()

        const validData: SekolahTerdekatData = {
          sekolah: Array.isArray(sekolahData.sekolah) ? sekolahData.sekolah : [],
          stats: sekolahData.stats,
          hash: simpleHash(JSON.stringify(sekolahData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, validData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(validData))
        }

        console.log("✅ [SEKOLAH TERDEKAT CACHE] Data updated and cached")
        return validData
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data sekolah")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchSekolahTerdekatData]
  )

  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
  }, [])

  const refreshData = useCallback(async () => {
    const cacheId = "dapur_sekolah_terdekat"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache])

  const updateCache = useCallback(
    (newData: Partial<SekolahTerdekatData>, onSuccess?: (data: SekolahTerdekatData) => void) => {
      const cacheId = "dapur_sekolah_terdekat"

      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          sekolah: [],
          stats: { totalSekolah: 0 },
          hash: "",
          timestamp: Date.now(),
        }
      }

      const updatedData: SekolahTerdekatData = {
        sekolah: Array.isArray(newData.sekolah) ? newData.sekolah : cachedData.sekolah,
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
