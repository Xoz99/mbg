import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const CACHE_KEY = "dapur_scan_cache"
const CACHE_EXPIRY = 30 * 1000 // 30 seconds
const CACHE_EMIT_KEY = "dapur_scan_cache_update"

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

export interface ScanData {
  scans: any[]
  stats: {
    totalScan: number
    success: number
    pending: number
  }
  hash: string
  timestamp: number
}

const globalMemoryCache = new Map<string, ScanData>()

export const useScanCache = (onCacheUpdate?: (data: ScanData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)

  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: ScanData) => {
      console.log("✅ [SCAN CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  const fetchScanData = useCallback(async () => {
    try {
      console.time("fetchScan")

      const res = await apiCall<any>("/api/scan?limit=100&page=1")
      const scans = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []

      const totalScan = scans.length
      const success = scans.filter((s: any) => s.status === "SUCCESS").length
      const pending = scans.filter((s: any) => s.status === "PENDING").length

      console.timeEnd("fetchScan")

      return {
        scans,
        stats: {
          totalScan,
          success,
          pending,
        },
      }
    } catch (err) {
      console.error("Error fetching scan data:", err)
      throw err
    }
  }, [])

  const loadData = useCallback(async () => {
    const cacheId = "dapur_scan"

    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      if (age < CACHE_EXPIRY) {
        console.log("✅ [SCAN CACHE] Using memory cache (fresh)")
        setLoading(false)
        return cached
      }
    }

    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as ScanData
          const age = Date.now() - parsed.timestamp

          if (age < CACHE_EXPIRY) {
            console.log("✅ [SCAN CACHE] Using localStorage cache (fresh)")
            globalMemoryCache.set(cacheId, parsed)
            setLoading(false)
            return parsed
          }
        } catch (e) {
          console.warn("[SCAN CACHE] Failed to parse localStorage cache")
        }
      }
    }

    return fetchAndUpdateCache(cacheId)
  }, [fetchScanData])

  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      if (fetchInProgress.current) return

      try {
        fetchInProgress.current = true
        setLoading(true)

        const scanData = await fetchScanData()

        const validData: ScanData = {
          scans: Array.isArray(scanData.scans) ? scanData.scans : [],
          stats: scanData.stats,
          hash: simpleHash(JSON.stringify(scanData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, validData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(validData))
        }

        console.log("✅ [SCAN CACHE] Data updated and cached")
        return validData
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data scan")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchScanData]
  )

  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
  }, [])

  const refreshData = useCallback(async () => {
    const cacheId = "dapur_scan"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache])

  const updateCache = useCallback(
    (newData: Partial<ScanData>, onSuccess?: (data: ScanData) => void) => {
      const cacheId = "dapur_scan"

      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          scans: [],
          stats: { totalScan: 0, success: 0, pending: 0 },
          hash: "",
          timestamp: Date.now(),
        }
      }

      const updatedData: ScanData = {
        scans: Array.isArray(newData.scans) ? newData.scans : cachedData.scans,
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
