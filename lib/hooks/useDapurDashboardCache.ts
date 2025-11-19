import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"
import { useDapurContext } from "@/lib/context/DapurContext"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://demombgv1.xyz"
const CACHE_KEY = "dapur_dashboard_cache"
const CACHE_EXPIRY = 1 * 60 * 1000 // 1 minute
const CACHE_EMIT_KEY = "dapur_dashboard_cache_update"

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

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data?.data && Array.isArray(data.data)) return data.data
  if (typeof data === "object") {
    const arr = Object.values(data).find((v) => Array.isArray(v))
    if (arr) return arr as any[]
  }
  return []
}

// ✅ Parse date string in UTC to avoid timezone issues
// Date strings like "2024-11-18" should be parsed as UTC date, not local
function parseDateAsUTC(dateString: string): Date | null {
  if (!dateString) return null

  // If date-only format (YYYY-MM-DD), parse as UTC midnight
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day))
  }

  // Otherwise use standard Date parsing (works with ISO format)
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

// ✅ Get day of week (1-7) where 1=Monday, 7=Sunday in UTC
function getDayOfWeekUTC(dateString: string): number {
  const date = parseDateAsUTC(dateString)
  if (!date) return 0

  // getUTCDay() returns 0-6 where 0=Sunday, 1=Monday, etc
  const utcDay = date.getUTCDay()
  // Convert to 1-7 where 1=Monday, 7=Sunday
  return utcDay === 0 ? 7 : utcDay
}

// ✅ Get today's date as YYYY-MM-DD in UTC-consistent format
// This ensures consistent date comparison across all timezone contexts
function getTodayDateString(): string {
  const now = new Date()
  // Get UTC time components
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ✅ Extract date string from menu.tanggal in UTC-consistent format
// Handles both YYYY-MM-DD and ISO datetime formats correctly
function extractMenuDateString(tanggalField: string): string | null {
  if (!tanggalField) return null

  // If it's ISO datetime format (has T), take only the date part
  if (tanggalField.includes("T")) {
    // Parse as UTC to ensure consistent date extraction
    const dateUTC = parseDateAsUTC(tanggalField)
    if (!dateUTC) return null
    return dateUTC.toISOString().split("T")[0]
  }

  // If it's already YYYY-MM-DD format, return as-is
  if (tanggalField.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return tanggalField
  }

  // Fallback: try to parse as regular date and extract
  const date = new Date(tanggalField)
  if (isNaN(date.getTime())) return null
  return date.toISOString().split("T")[0]
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

interface DapurDashboardData {
  menuPlanningData: any[]
  todayMenu: any | null
  stats: { targetHariIni: number; totalSekolah: number }
  produksiMingguan: any[]
  hash: string
  timestamp: number
}

// ✅ Global memory cache (persists during session)
const globalMemoryCache = new Map<string, DapurDashboardData>()

export const useDapurDashboardCache = (onCacheUpdate?: (data: DapurDashboardData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)

  // Get menu plannings from global context
  const { menuPlannings: contextPlannings, isLoading: contextLoading } = useDapurContext()

  // ✅ Setup listener untuk cache updates dari component lain (dalam tab yang sama)
  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: DapurDashboardData) => {
      console.log("✅ [DAPUR DASHBOARD CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  // ✅ Fetch dapur dashboard data
  const fetchDapurDashboardData = useCallback(async (contextMenuPlannings: any[]) => {
    try {
      console.time("fetchDapurDashboard")

      // Use menu plannings from context (global cache)
      const plannings = contextMenuPlannings
      console.log(`[DAPUR DASHBOARD CACHE] Using ${plannings.length} plannings from context`)

      // ✅ FIXED: Use UTC-consistent date format for "today"
      const todayString = getTodayDateString()

      // ✅ FIXED: Don't hardcode week range - use each planning's own date range!
      let foundTodayMenu: any = null
      let allMenus: any[] = []

      const weeklyStats = await Promise.all(
        plannings.map(async (planning: any) => {
          try {
            // ✅ Use planning's date range, not current week!
            const planningStart = planning.tanggalMulai
            const planningEnd = planning.tanggalSelesai

            const menuRes = await apiCall<any>(
              `/api/menu-planning/${planning.id}/menu-harian?limit=20&page=1&startDate=${planningStart}&endDate=${planningEnd}`
            )
            const menus = extractArray(menuRes?.data || [])

            // ✅ FIXED: Fetch calendar akademik per sekolah (sekolahId required!)
            let holidays: string[] = []
            try {
              const calendarRes = await apiCall<any>(`/api/kalender-akademik?sekolahId=${planning.sekolahId}&limit=100`)
              // API returns: { data: { kalenders: [...], pagination: {...} } }
              const calendarList = calendarRes?.data?.kalenders || []
              holidays = calendarList
                .map((c: any) => c.tanggalMulai || c.tanggal || c.date)
                .filter((d: string) => d) // Filter out empty dates
            } catch (err) {
              // Continue without holidays if fetch fails
            }
            allMenus = [...allMenus, ...menus]

            // Parse planning dates
            const planningStartDate = parseDateAsUTC(planningStart)
            const planningEndDate = parseDateAsUTC(planningEnd)

            if (!planningStartDate || !planningEndDate) {
              return null
            }

            // Normalize all menu dates to YYYY-MM-DD strings ONCE
            const menuDateStrings = new Set(
              menus.map((m: any) => {
                // Extract just the date part (YYYY-MM-DD) - NO timezone conversion!
                const dateStr = m.tanggal
                if (!dateStr) return null
                // If it's ISO format (has T), just take the date part
                if (dateStr.includes("T")) {
                  return dateStr.split("T")[0]
                }
                // Otherwise assume it's already YYYY-MM-DD
                return dateStr
              }).filter(Boolean)
            )


            // Normalize holidays to YYYY-MM-DD strings
            const holidayDateStrings = new Set(
              holidays.map((h: string) => {
                if (!h) return null
                if (h.includes("T")) {
                  return h.split("T")[0]
                }
                return h
              }).filter(Boolean)
            )


            const daysStatus: Array<{day: string; completed: boolean; menuCount: number}> = []
            const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

            // ✅ FIXED: Count ALL workdays (Senin-Sabtu) within planning range
            // NOT just first 6 days!
            const currentDate = new Date(planningStartDate)

            while (currentDate <= planningEndDate) {
              const dateString = currentDate.toISOString().split("T")[0]
              const isHoliday = holidayDateStrings.has(dateString)
              const dayOfWeek = currentDate.getUTCDay()
              const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek // 1=Monday, 7=Sunday

              // Count all weekdays (Senin-Sabtu = 1-6) AND NOT holidays
              if (adjustedDay >= 1 && adjustedDay <= 6 && !isHoliday) {
                const dayName = dayNames[adjustedDay - 1]
                const hasMenu = menuDateStrings.has(dateString)
                const menuCount = menus.filter((m: any) => {
                  const mDateStr = m.tanggal?.includes("T") ? m.tanggal.split("T")[0] : m.tanggal
                  return mDateStr === dateString
                }).length

                daysStatus.push({
                  day: dayName,
                  completed: hasMenu,
                  menuCount,
                })
              }

              currentDate.setUTCDate(currentDate.getUTCDate() + 1)
            }

            if (!foundTodayMenu) {
              // ✅ FIXED: Use consistent UTC-based date extraction
              const todayMenus = menus.filter((m: any) => {
                const menuDateString = extractMenuDateString(m.tanggal)
                return menuDateString === todayString
              })
              if (todayMenus.length > 0) {
                foundTodayMenu = {
                  ...todayMenus[0],
                  sekolahNama: planning.sekolah?.nama || "Unknown",
                }
              }
            }

            const completedDays = daysStatus.filter((d) => d.completed).length
            const totalDays = daysStatus.length // ✅ Dynamic - excludes holidays!


            return {
              id: planning.id,
              mingguanKe: planning.mingguanKe,
              sekolahId: planning.sekolahId,
              sekolahNama: planning.sekolah?.nama || "Unknown",
              tanggalMulai: planning.tanggalMulai,
              tanggalSelesai: planning.tanggalSelesai,
              daysStatus,
              completedDays,
              totalDays,
              status: completedDays === totalDays ? "COMPLETE" : "INCOMPLETE",
              daysLeft: totalDays - completedDays,
              totalMenuCount: menus.length,
            }
          } catch (err) {
            return null
          }
        }),
      )

      const validStats = weeklyStats
        .filter((s) => s !== null)
        .sort((a, b) => {
          if (a.status === b.status) return 0
          return a.status === "COMPLETE" ? -1 : 1
        })

      const dateMap: { [key: string]: number } = {}

      allMenus.forEach((menu) => {
        if (menu.tanggal) {
          const date = new Date(menu.tanggal).toLocaleDateString("id-ID", {
            weekday: "short",
            month: "short",
            day: "2-digit",
          })
          dateMap[date] = (dateMap[date] || 0) + 1
        }
      })

      // Calculate target for today
      const todayMenus = allMenus.filter((m) => {
        if (!m.tanggal) return false
        const menuDateString = extractMenuDateString(m.tanggal)
        return menuDateString === todayString
      })
      const totalTargetHariIni = todayMenus.reduce((sum, m) => sum + (m.targetTray || 0), 0)

      const newStats = {
        targetHariIni: totalTargetHariIni || 0,
        totalSekolah: plannings.length,
      }

      const produksiData = Object.entries(dateMap)
        .map(([date, count]) => ({ hari: date, actual: count }))
        .slice(-6)

      console.timeEnd("fetchDapurDashboard")

      return {
        menuPlanningData: validStats,
        todayMenu: foundTodayMenu,
        stats: newStats,
        produksiMingguan: produksiData,
      }
    } catch (err) {
      console.error("Error fetching dapur dashboard data:", err)
      throw err
    }
  }, [contextPlannings])

  // ✅ Load data with cache priority
  const loadData = useCallback(async () => {
    const cacheId = "dapur_dashboard"

    // Wait for context to finish loading
    if (contextLoading) {
      console.log("[DAPUR DASHBOARD CACHE] Waiting for context to load...")
      return
    }

    // 1. Check memory cache first (fastest)
    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      if (age < CACHE_EXPIRY) {
        console.log("✅ [DAPUR DASHBOARD CACHE] Using memory cache (fresh)")
        setLoading(false)
        return cached
      }
    }

    // 2. Check localStorage
    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as DapurDashboardData
          const age = Date.now() - parsed.timestamp

          if (age < CACHE_EXPIRY) {
            console.log("✅ [DAPUR DASHBOARD CACHE] Using localStorage cache (fresh)")
            globalMemoryCache.set(cacheId, parsed)
            setLoading(false)
            return parsed
          } else if (age < CACHE_EXPIRY * 2) {
            console.log("⚠️ [DAPUR DASHBOARD CACHE] Using stale cache, refetching in background")
            setLoading(false)
            globalMemoryCache.set(cacheId, parsed)
            fetchAndUpdateCache(cacheId)
            return parsed
          }
        } catch (e) {
          console.warn("[DAPUR DASHBOARD CACHE] Failed to parse localStorage cache")
        }
      }
    }

    // 3. No cache, need to fetch
    console.log("📥 [DAPUR DASHBOARD CACHE] No cache found, fetching from API")
    return fetchAndUpdateCache(cacheId)
  }, [fetchDapurDashboardData, contextLoading])

  // ✅ Fetch and update both memory and localStorage cache
  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      // Wait for context to load
      if (contextLoading) {
        console.log("[DAPUR DASHBOARD CACHE] Waiting for context to load...")
        return
      }

      if (fetchInProgress.current) {
        console.log("[DAPUR DASHBOARD] Fetch already in progress, skipping")
        return
      }

      try {
        fetchInProgress.current = true
        setLoading(true)

        const dashboardData = await fetchDapurDashboardData(contextPlannings)

        // Safety checks
        const validData: DapurDashboardData = {
          menuPlanningData: Array.isArray(dashboardData.menuPlanningData) ? dashboardData.menuPlanningData : [],
          todayMenu: dashboardData.todayMenu || null,
          stats: dashboardData.stats || { targetHariIni: 0, totalSekolah: 0 },
          produksiMingguan: Array.isArray(dashboardData.produksiMingguan) ? dashboardData.produksiMingguan : [],
          hash: simpleHash(JSON.stringify(dashboardData)),
          timestamp: Date.now(),
        }

        // Update UNIFIED memory cache
        globalMemoryCache.set(cacheId, validData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(validData))
        }

        console.log("✅ [DAPUR DASHBOARD CACHE] Data updated and cached")
        return validData
      } catch (err) {
        console.error("❌ [DAPUR DASHBOARD] Error:", err)
        setError(err instanceof Error ? err.message : "Gagal memuat data")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchDapurDashboardData, contextLoading, contextPlannings]
  )

  // ✅ Clear cache
  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
    console.log("✅ [DAPUR DASHBOARD CACHE] Cleared")
  }, [])

  // ✅ Force refresh
  const refreshData = useCallback(async () => {
    const cacheId = "dapur_dashboard"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache])

  // ✅ Background refresh dengan callback (declare before updateCache)
  const backgroundRefresh = useCallback(
    async (cacheId: string, onSuccess?: (data: DapurDashboardData) => void) => {
      try {
        console.log("🔄 [DAPUR DASHBOARD] Starting background refresh...")
        const freshData = await fetchDapurDashboardData(contextPlannings)

        // Safety checks
        const cachedData: DapurDashboardData = {
          menuPlanningData: Array.isArray(freshData.menuPlanningData) ? freshData.menuPlanningData : [],
          todayMenu: freshData.todayMenu || null,
          stats: freshData.stats || { targetHariIni: 0, totalSekolah: 0 },
          produksiMingguan: Array.isArray(freshData.produksiMingguan) ? freshData.produksiMingguan : [],
          hash: simpleHash(JSON.stringify(freshData)),
          timestamp: Date.now(),
        }

        // Update UNIFIED memory cache
        globalMemoryCache.set(cacheId, cachedData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        console.log("✅ [DAPUR DASHBOARD] Background refresh completed successfully")

        // Trigger callback
        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(cachedData)
          } catch (callbackErr) {
            console.error("⚠️ [DAPUR DASHBOARD] Error in onSuccess callback:", callbackErr)
          }
        }

        return cachedData
      } catch (err) {
        console.error("⚠️ [DAPUR DASHBOARD] Background refresh failed:", err)
        // Don't throw - let UI continue with optimistic data
      }
    },
    [fetchDapurDashboardData, contextPlannings]
  )

  // ✅ Update cache dengan data baru (optimistic + background refresh)
  const updateCache = useCallback(
    (newData: Partial<DapurDashboardData>, onSuccess?: (data: DapurDashboardData) => void) => {
      const cacheId = "dapur_dashboard"

      // Get existing cache
      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          menuPlanningData: [],
          todayMenu: null,
          stats: { targetHariIni: 0, totalSekolah: 0 },
          produksiMingguan: [],
          hash: "",
          timestamp: Date.now(),
        }
      }

      // Merge new data (optimistic)
      const updatedData: DapurDashboardData = {
        menuPlanningData: Array.isArray(newData.menuPlanningData) ? newData.menuPlanningData : cachedData.menuPlanningData,
        todayMenu: newData.todayMenu !== undefined ? newData.todayMenu : cachedData.todayMenu,
        stats: newData.stats || cachedData.stats,
        produksiMingguan: Array.isArray(newData.produksiMingguan) ? newData.produksiMingguan : cachedData.produksiMingguan,
        hash: simpleHash(JSON.stringify(newData)),
        timestamp: Date.now(),
      }

      // Update UNIFIED memory cache immediately
      globalMemoryCache.set(cacheId, updatedData)

      // Update localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData))
      }

      console.log("✅ [DAPUR DASHBOARD CACHE] Updated with optimistic data - AUTO SYNC to all pages!")

      // 📢 Emit instant update ke semua components yang subscribe
      const validUpdatedData: DapurDashboardData = {
        menuPlanningData: Array.isArray(updatedData.menuPlanningData) ? updatedData.menuPlanningData : [],
        todayMenu: updatedData.todayMenu || null,
        stats: updatedData.stats,
        produksiMingguan: Array.isArray(updatedData.produksiMingguan) ? updatedData.produksiMingguan : [],
        hash: updatedData.hash,
        timestamp: updatedData.timestamp,
      }
      cacheEmitter.emit(CACHE_EMIT_KEY, validUpdatedData)

      // 🔄 Background refresh: Fetch latest data dari API tanpa blocking UI
      backgroundRefresh("dapur_dashboard", (freshData) => {
        // 📢 Emit fresh data juga
        if (freshData) {
          const validFreshData: DapurDashboardData = {
            menuPlanningData: Array.isArray(freshData.menuPlanningData) ? freshData.menuPlanningData : [],
            todayMenu: freshData.todayMenu || null,
            stats: freshData.stats,
            produksiMingguan: Array.isArray(freshData.produksiMingguan) ? freshData.produksiMingguan : [],
            hash: freshData.hash,
            timestamp: freshData.timestamp,
          }
          cacheEmitter.emit(CACHE_EMIT_KEY, validFreshData)
        }
        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(freshData)
          } catch (err) {
            console.error("⚠️ [DAPUR DASHBOARD] Error in onSuccess callback:", err)
          }
        }
      })

      return updatedData
    },
    [backgroundRefresh]
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
