import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const CACHE_KEY = "dapur_assign_driver_cache"
const CACHE_EXPIRY = 1 * 60 * 1000
const CACHE_EMIT_KEY = "dapur_assign_driver_cache_update"

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

export interface AssignDriverData {
  drivers: any[]
  routes: any[]
  stats: {
    totalDriver: number
    available: number
    busy: number
  }
  hash: string
  timestamp: number
}

const globalMemoryCache = new Map<string, AssignDriverData>()

export const useAssignDriverCache = (onCacheUpdate?: (data: AssignDriverData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)

  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: AssignDriverData) => {
      console.log("✅ [ASSIGN DRIVER CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  const fetchAssignDriverData = useCallback(async () => {
    try {
      console.time("fetchAssignDriver")

      const driversRes = await apiCall<any>("/api/driver?limit=100&page=1")
      const drivers = Array.isArray(driversRes?.data) ? driversRes.data : Array.isArray(driversRes) ? driversRes : []

      const routesRes = await apiCall<any>("/api/routes?limit=100&page=1")
      const routes = Array.isArray(routesRes?.data) ? routesRes.data : Array.isArray(routesRes) ? routesRes : []

      const totalDriver = drivers.length
      const available = drivers.filter((d: any) => d.status === "TERSEDIA").length
      const busy = drivers.filter((d: any) => d.status === "SIBUK").length

      console.timeEnd("fetchAssignDriver")

      return {
        drivers,
        routes,
        stats: {
          totalDriver,
          available,
          busy,
        },
      }
    } catch (err) {
      console.error("Error fetching assign driver data:", err)
      throw err
    }
  }, [])

  const loadData = useCallback(async () => {
    const cacheId = "dapur_assign_driver"

    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      if (age < CACHE_EXPIRY) {
        console.log("✅ [ASSIGN DRIVER CACHE] Using memory cache (fresh)")
        setLoading(false)
        return cached
      }
    }

    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as AssignDriverData
          const age = Date.now() - parsed.timestamp

          if (age < CACHE_EXPIRY) {
            console.log("✅ [ASSIGN DRIVER CACHE] Using localStorage cache (fresh)")
            globalMemoryCache.set(cacheId, parsed)
            setLoading(false)
            return parsed
          }
        } catch (e) {
          console.warn("[ASSIGN DRIVER CACHE] Failed to parse localStorage cache")
        }
      }
    }

    return fetchAndUpdateCache(cacheId)
  }, [fetchAssignDriverData])

  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      if (fetchInProgress.current) return

      try {
        fetchInProgress.current = true
        setLoading(true)

        const assignDriverData = await fetchAssignDriverData()

        const validData: AssignDriverData = {
          drivers: Array.isArray(assignDriverData.drivers) ? assignDriverData.drivers : [],
          routes: Array.isArray(assignDriverData.routes) ? assignDriverData.routes : [],
          stats: assignDriverData.stats,
          hash: simpleHash(JSON.stringify(assignDriverData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, validData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(validData))
        }

        console.log("✅ [ASSIGN DRIVER CACHE] Data updated and cached")
        return validData
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data driver")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchAssignDriverData]
  )

  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
  }, [])

  const refreshData = useCallback(async () => {
    const cacheId = "dapur_assign_driver"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache])

  const updateCache = useCallback(
    (newData: Partial<AssignDriverData>, onSuccess?: (data: AssignDriverData) => void) => {
      const cacheId = "dapur_assign_driver"

      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          drivers: [],
          routes: [],
          stats: { totalDriver: 0, available: 0, busy: 0 },
          hash: "",
          timestamp: Date.now(),
        }
      }

      const updatedData: AssignDriverData = {
        drivers: Array.isArray(newData.drivers) ? newData.drivers : cachedData.drivers,
        routes: Array.isArray(newData.routes) ? newData.routes : cachedData.routes,
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
