import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const CACHE_KEY = "dapur_monitoring_driver_cache"
const CACHE_EXPIRY = 30 * 1000 // 30 seconds for real-time
const CACHE_EMIT_KEY = "dapur_monitoring_driver_cache_update"

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

export interface MonitoringDriverData {
  drivers: any[]
  stats: {
    totalDriver: number
    onRoute: number
    arrived: number
  }
  hash: string
  timestamp: number
}

const globalMemoryCache = new Map<string, MonitoringDriverData>()

export const useMonitoringDriverCache = (onCacheUpdate?: (data: MonitoringDriverData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)

  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: MonitoringDriverData) => {
      console.log("✅ [MONITORING DRIVER CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  const fetchMonitoringData = useCallback(async () => {
    try {
      console.time("fetchMonitoringDriver")

      const res = await apiCall<any>("/api/driver-tracking?limit=100&page=1")
      const drivers = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []

      const totalDriver = drivers.length
      const onRoute = drivers.filter((d: any) => d.status === "IN_ROUTE").length
      const arrived = drivers.filter((d: any) => d.status === "ARRIVED").length

      console.timeEnd("fetchMonitoringDriver")

      return {
        drivers,
        stats: {
          totalDriver,
          onRoute,
          arrived,
        },
      }
    } catch (err) {
      console.error("Error fetching monitoring driver data:", err)
      throw err
    }
  }, [])

  const loadData = useCallback(async () => {
    const cacheId = "dapur_monitoring_driver"

    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      if (age < CACHE_EXPIRY) {
        console.log("✅ [MONITORING DRIVER CACHE] Using memory cache (fresh)")
        setLoading(false)
        return cached
      }
    }

    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as MonitoringDriverData
          const age = Date.now() - parsed.timestamp

          if (age < CACHE_EXPIRY) {
            console.log("✅ [MONITORING DRIVER CACHE] Using localStorage cache (fresh)")
            globalMemoryCache.set(cacheId, parsed)
            setLoading(false)
            return parsed
          }
        } catch (e) {
          console.warn("[MONITORING DRIVER CACHE] Failed to parse localStorage cache")
        }
      }
    }

    return fetchAndUpdateCache(cacheId)
  }, [fetchMonitoringData])

  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      if (fetchInProgress.current) return

      try {
        fetchInProgress.current = true
        setLoading(true)

        const monitoringData = await fetchMonitoringData()

        const validData: MonitoringDriverData = {
          drivers: Array.isArray(monitoringData.drivers) ? monitoringData.drivers : [],
          stats: monitoringData.stats,
          hash: simpleHash(JSON.stringify(monitoringData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, validData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(validData))
        }

        console.log("✅ [MONITORING DRIVER CACHE] Data updated and cached")
        return validData
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data monitoring driver")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchMonitoringData]
  )

  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
  }, [])

  const refreshData = useCallback(async () => {
    const cacheId = "dapur_monitoring_driver"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache])

  const updateCache = useCallback(
    (newData: Partial<MonitoringDriverData>, onSuccess?: (data: MonitoringDriverData) => void) => {
      const cacheId = "dapur_monitoring_driver"

      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          drivers: [],
          stats: { totalDriver: 0, onRoute: 0, arrived: 0 },
          hash: "",
          timestamp: Date.now(),
        }
      }

      const updatedData: MonitoringDriverData = {
        drivers: Array.isArray(newData.drivers) ? newData.drivers : cachedData.drivers,
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
