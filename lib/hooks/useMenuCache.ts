import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"
import { useDapurContext } from "@/lib/context/DapurContext"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const CACHE_KEY = "dapur_menu_cache"
const CACHE_EXPIRY = 10 * 60 * 1000 // 10 minutes - Longer cache to avoid unnecessary refetch when navigating back
const CACHE_EMIT_KEY = "dapur_menu_cache_update"

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

export interface MenuData {
  menuPlannings: any[]
  sekolahList: any[]
  stats: {
    totalMenuPlanning: number
    completeWeeks: number
    incompleteWeeks: number
  }
  hash: string
  timestamp: number
}

const globalMemoryCache = new Map<string, MenuData>()

export const useMenuCache = (onCacheUpdate?: (data: MenuData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)
  const { menuPlannings: contextMenuPlannings, isLoading: contextLoading } = useDapurContext()

  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: MenuData) => {
      console.log("✅ [MENU CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  const fetchMenuData = useCallback(async () => {
    try {
      console.log("[MENU CACHE] Starting fetch...")
      console.time("fetchMenu")

      // Get menu plannings from context (already loaded globally)
      const menuPlannings = contextMenuPlannings
      console.log("[MENU CACHE] Got menuPlannings from context:", menuPlannings.length)

      // Fetch sekolah list
      const sekolahRes = await apiCall<any>("/api/sekolah?limit=100&page=1")
      console.log("[MENU CACHE] Sekolah response:", sekolahRes)
      // Handle nested data structure: response.data.data
      const sekolahList = Array.isArray(sekolahRes?.data?.data)
        ? sekolahRes.data.data
        : Array.isArray(sekolahRes?.data)
          ? sekolahRes.data
          : Array.isArray(sekolahRes)
            ? sekolahRes
            : []
      console.log("[MENU CACHE] Extracted sekolahList:", sekolahList)

      // Calculate stats
      const totalMenuPlanning = menuPlannings.length
      const completeWeeks = menuPlannings.filter((m: any) => m.status === "COMPLETE").length
      const incompleteWeeks = totalMenuPlanning - completeWeeks

      console.timeEnd("fetchMenu")
      console.log("[MENU CACHE] Final data:", { menuPlannings, sekolahList })

      return {
        menuPlannings,
        sekolahList,
        stats: {
          totalMenuPlanning,
          completeWeeks,
          incompleteWeeks,
        },
      }
    } catch (err) {
      console.error("[MENU CACHE] ❌ Error fetching menu data:", err)
      throw err
    }
  }, [contextMenuPlannings])

  const loadData = useCallback(async () => {
    const cacheId = "dapur_menu"

    // Wait for context to finish loading
    if (contextLoading) {
      console.log("[MENU CACHE] Waiting for context to load...")
      return
    }

    console.log("[MENU CACHE] loadData called, checking memory cache...")
    console.log("[MENU CACHE] globalMemoryCache has key?", globalMemoryCache.has(cacheId))
    console.log("[MENU CACHE] Memory cache content:", globalMemoryCache.get(cacheId))

    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      console.log("[MENU CACHE] Memory cache age:", age, "ms, expiry:", CACHE_EXPIRY, "ms")

      if (age < CACHE_EXPIRY) {
        console.log("✅ [MENU CACHE] Using memory cache (fresh)")
        console.log("✅ [MENU CACHE] Calling onCacheUpdate with:", cached)
        setLoading(false)
        // ✅ Emit callback saat cache hit
        if (onCacheUpdate) {
          console.log("[MENU CACHE] onCacheUpdate exists, calling it...")
          onCacheUpdate(cached)
        } else {
          console.log("[MENU CACHE] WARNING: onCacheUpdate is not defined!")
        }
        return cached
      }
    }

    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as MenuData
          const age = Date.now() - parsed.timestamp

          if (age < CACHE_EXPIRY) {
            console.log("✅ [MENU CACHE] Using localStorage cache (fresh)")
            globalMemoryCache.set(cacheId, parsed)
            setLoading(false)
            // ✅ Emit callback saat cache hit
            if (onCacheUpdate) {
              onCacheUpdate(parsed)
            }
            return parsed
          } else if (age < CACHE_EXPIRY * 2) {
            console.log("⚠️ [MENU CACHE] Using stale cache, refetching in background")
            setLoading(false)
            globalMemoryCache.set(cacheId, parsed)
            // ✅ Emit callback dengan stale data
            if (onCacheUpdate) {
              onCacheUpdate(parsed)
            }
            fetchAndUpdateCache(cacheId)
            return parsed
          }
        } catch (e) {
          console.warn("[MENU CACHE] Failed to parse localStorage cache")
        }
      }
    }

    return fetchAndUpdateCache(cacheId)
  }, [fetchMenuData, onCacheUpdate, contextLoading])

  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      if (fetchInProgress.current) {
        console.log("[MENU] Fetch already in progress, skipping")
        return
      }

      try {
        fetchInProgress.current = true
        setLoading(true)

        const menuData = await fetchMenuData()

        const validData: MenuData = {
          menuPlannings: Array.isArray(menuData.menuPlannings) ? menuData.menuPlannings : [],
          sekolahList: Array.isArray(menuData.sekolahList) ? menuData.sekolahList : [],
          stats: menuData.stats,
          hash: simpleHash(JSON.stringify(menuData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, validData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(validData))
        }

        console.log("✅ [MENU CACHE] Data updated and cached")

        // ✅ Emit callback untuk update UI
        if (onCacheUpdate) {
          console.log("[MENU CACHE] Emitting callback with data:", validData)
          onCacheUpdate(validData)
        }

        return validData
      } catch (err) {
        console.error("❌ [MENU] Error:", err)
        setError(err instanceof Error ? err.message : "Gagal memuat data menu")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchMenuData]
  )

  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
    console.log("✅ [MENU CACHE] Cleared")
  }, [])

  const refreshData = useCallback(async () => {
    const cacheId = "dapur_menu"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache])

  const updateCache = useCallback(
    (newData: Partial<MenuData>, onSuccess?: (data: MenuData) => void) => {
      const cacheId = "dapur_menu"

      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          menuPlannings: [],
          sekolahList: [],
          stats: { totalMenuPlanning: 0, completeWeeks: 0, incompleteWeeks: 0 },
          hash: "",
          timestamp: Date.now(),
        }
      }

      const updatedData: MenuData = {
        menuPlannings: Array.isArray(newData.menuPlannings) ? newData.menuPlannings : cachedData.menuPlannings,
        sekolahList: Array.isArray(newData.sekolahList) ? newData.sekolahList : cachedData.sekolahList,
        stats: newData.stats || cachedData.stats,
        hash: simpleHash(JSON.stringify(newData)),
        timestamp: Date.now(),
      }

      globalMemoryCache.set(cacheId, updatedData)

      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData))
      }

      console.log("✅ [MENU CACHE] Updated with optimistic data")

      const validUpdatedData: MenuData = {
        menuPlannings: Array.isArray(updatedData.menuPlannings) ? updatedData.menuPlannings : [],
        sekolahList: Array.isArray(updatedData.sekolahList) ? updatedData.sekolahList : [],
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
    async (cacheId: string, onSuccess?: (data: MenuData) => void) => {
      try {
        console.log("🔄 [MENU] Starting background refresh...")
        const freshData = await fetchMenuData()

        const cachedData: MenuData = {
          menuPlannings: Array.isArray(freshData.menuPlannings) ? freshData.menuPlannings : [],
          sekolahList: Array.isArray(freshData.sekolahList) ? freshData.sekolahList : [],
          stats: freshData.stats,
          hash: simpleHash(JSON.stringify(freshData)),
          timestamp: Date.now(),
        }

        globalMemoryCache.set(cacheId, cachedData)

        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        console.log("✅ [MENU] Background refresh completed")

        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(cachedData)
          } catch (callbackErr) {
            console.error("⚠️ [MENU] Error in onSuccess callback:", callbackErr)
          }
        }

        return cachedData
      } catch (err) {
        console.error("⚠️ [MENU] Background refresh failed:", err)
      }
    },
    [fetchMenuData]
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
