import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"
import { useDapurContext } from "@/lib/context/DapurContext"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const CACHE_EXPIRY = 10 * 60 * 1000 // 10 minutes - Longer cache to avoid unnecessary refetch when navigating back

// 🔥 Helper to generate cache key dengan dapur ID (jadi berbeda akun nggak share cache)
function getCacheKey(dapurId?: string): string {
  return dapurId ? `dapur_dashboard_cache_${dapurId}` : "dapur_dashboard_cache"
}

function getCacheEmitKey(dapurId?: string): string {
  return dapurId ? `dapur_dashboard_cache_update_${dapurId}` : "dapur_dashboard_cache_update"
}

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

// ✅ Get today's date as YYYY-MM-DD using local browser time
// This matches server time in Indonesia (UTC+7)
function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ✅ Normalize time field that might have UTC+7 offset
// Examples:
// - "01:09" might actually be "08:09" (offset by 7 hours)
// - "23:00" stays "23:00" (if no offset detected)
function normalizeTimeField(timeString: string): string {
  if (!timeString || typeof timeString !== 'string') return timeString

  // If not in HH:MM or HH:MM:SS format, return as-is
  if (!timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
    return timeString
  }

  // Parse the time
  const parts = timeString.split(':')
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  const seconds = parts[2] || '00'

  // Check if this looks like it has UTC+7 offset applied
  // If hours are 0-6, it's likely the backend subtracted 7 hours
  // Add 7 hours back to correct it
  if (hours >= 0 && hours <= 6) {
    hours = (hours + 7) % 24
  }

  // Reconstruct the time string
  const normalizedHours = String(hours).padStart(2, '0')
  return `${normalizedHours}:${minutes}:${seconds}`.slice(0, timeString.length)
}

// ✅ Extract date string from menu.tanggal using local time
// Handles both YYYY-MM-DD and ISO datetime formats correctly
// Note: If API returns ISO with T17:00:00, that's UTC+7 offset, extract date before T
function extractMenuDateString(tanggalField: string): string | null {
  if (!tanggalField) return null

  // If it's ISO datetime format (has T), take only the date part
  if (tanggalField.includes("T")) {
    // Check if this is the UTC+7 offset pattern (T17:00:00)
    if (tanggalField.includes("T17:00:00")) {
      // This date part IS correct - API encodes local date with UTC+7 offset
      // "2025-11-19T17:00:00.000Z" means local date 2025-11-19
      return tanggalField.split("T")[0]
    } else {
      // Parse as UTC and extract - will give us local date in UTC+7 context
      const date = new Date(tanggalField)
      if (isNaN(date.getTime())) {
        return tanggalField.split("T")[0]
      }
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  // If it's already YYYY-MM-DD format, return as-is
  if (tanggalField.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return tanggalField
  }

  // Fallback: try to parse as regular date and extract using local time
  const date = new Date(tanggalField)
  if (isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

// 🔥 Export function to clear memory cache on logout
export const clearDapurDashboardMemoryCache = () => {
  globalMemoryCache.clear()
  console.log('[useDapurDashboardCache] Memory cache cleared on logout')
}

export const useDapurDashboardCache = (onCacheUpdate?: (data: DapurDashboardData) => void, dapurId?: string) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)
  const lastDapurIdRef = useRef<string>("")
  const CACHE_KEY = getCacheKey(dapurId)
  const CACHE_EMIT_KEY = getCacheEmitKey(dapurId)

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
  }, [onCacheUpdate, CACHE_EMIT_KEY])

  // 🔥 Force fetch ketika dapurId berubah (login akun baru)
  // Skip cache dan langsung fetch from API untuk akun baru
  useEffect(() => {
    if (!dapurId) return

    // Jika dapurId berubah (login akun baru), force fresh fetch
    if (lastDapurIdRef.current && lastDapurIdRef.current !== dapurId) {
      console.log("[DAPUR DASHBOARD CACHE] 🔄 DapurId changed - forcing fresh fetch:", dapurId)
      // Force clear memory cache untuk dapur ID ini
      globalMemoryCache.delete("dapur_dashboard")
      setLoading(true)
    }

    lastDapurIdRef.current = dapurId
  }, [dapurId])


  // ✅ Fetch dapur dashboard data
  const fetchDapurDashboardData = useCallback(async (contextMenuPlannings: any[]) => {
    try {
      // Use menu plannings from context (global cache)
      const plannings = contextMenuPlannings

      // ✅ FIXED: Use local time date format for "today"
      const todayString = getTodayDateString()

      // ✅ FIXED: Don't hardcode week range - use each planning's own date range!
      let foundTodayMenu: any = null
      let allMenus: any[] = []

      // 🔥 OPTIMIZATION: Batch API calls with queue to limit concurrent requests (max 3)
      class RequestQueue {
        private queue: Array<() => Promise<any>> = [];
        private running = 0;
        private maxConcurrent = 3;

        async add<T>(fn: () => Promise<T>): Promise<T> {
          return new Promise((resolve, reject) => {
            this.queue.push(async () => {
              try {
                const result = await fn();
                resolve(result);
              } catch (error) {
                reject(error);
              }
            });
            this.process();
          });
        }

        private async process() {
          if (this.running >= this.maxConcurrent || this.queue.length === 0) return;
          this.running++;
          const fn = this.queue.shift();
          if (fn) {
            await fn();
            this.running--;
            this.process();
          }
        }
      }

      const requestQueue = new RequestQueue();

      const weeklyStats = await Promise.allSettled(
        plannings.map(async (planning: any) => {
          try {
            // ✅ Use planning's date range, not current week!
            const planningStart = planning.tanggalMulai
            const planningEnd = planning.tanggalSelesai

            // 🔥 OPTIMIZATION: Queue menu fetch to limit concurrent requests
            const menuRes = await requestQueue.add(() =>
              apiCall<any>(
                `/api/menu-planning/${planning.id}/menu-harian?limit=20&page=1&startDate=${planningStart}&endDate=${planningEnd}`
              )
            );
            let menus = extractArray(menuRes?.data || [])

            // Skip kalender akademik - holidays not needed for basic calculation
            let holidays: string[] = []
            allMenus = [...allMenus, ...menus]

            // Parse planning dates using local time
            // Extract date part only (handle ISO datetime format)
            const planningStartStr = planningStart.includes('T') ? planningStart.split('T')[0] : planningStart
            const planningEndStr = planningEnd.includes('T') ? planningEnd.split('T')[0] : planningEnd

            const planningStartDate = new Date(planningStartStr + "T00:00:00")
            const planningEndDate = new Date(planningEndStr + "T23:59:59")

            if (isNaN(planningStartDate.getTime()) || isNaN(planningEndDate.getTime())) {
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
              // Use local time to format date
              const year = currentDate.getFullYear()
              const month = String(currentDate.getMonth() + 1).padStart(2, '0')
              const day = String(currentDate.getDate()).padStart(2, '0')
              const dateString = `${year}-${month}-${day}`

              const isHoliday = holidayDateStrings.has(dateString)
              const dayOfWeek = currentDate.getDay()
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

              currentDate.setDate(currentDate.getDate() + 1)
            }

            // Extract today's menu from this planning
            let planningTodayMenu: any = null
            const todayMenus = menus.filter((m: any) => {
              const menuDateString = extractMenuDateString(m.tanggal)
              return menuDateString === todayString
            })
            if (todayMenus.length > 0) {
              planningTodayMenu = {
                ...todayMenus[0],
                sekolahNama: planning.sekolah?.nama || "Unknown",
              }
            }

            const completedDays = daysStatus.filter((d) => d.completed).length
            const totalDays = daysStatus.length // ✅ Dynamic - excludes holidays!


            return {
              id: planning.id,
              mingguanKe: planning.mingguanKe,
              sekolahId: planning.sekolahId,
              sekolahNama: planning.sekolah?.nama || "Unknown",
              sekolahAlamat: planning.sekolah?.alamat || "",
              picSekolah: planning.sekolah?.picSekolah?.[0] || null,
              tanggalMulai: planning.tanggalMulai,
              tanggalSelesai: planning.tanggalSelesai,
              todayMenu: planningTodayMenu,
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

      // 🔥 Handle Promise.allSettled results
      const validStats = weeklyStats
        .filter((result: any) => result.status === 'fulfilled' && result.value !== null)
        .map((result: any) => result.value)
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

      // Count unique schools (sekolah yang sama di multiple weeks hanya dihitung 1x)
      const uniqueSekolahIds = new Set(plannings.map(p => p.sekolahId))
      const newStats = {
        targetHariIni: totalTargetHariIni || 0,
        totalSekolah: uniqueSekolahIds.size,
      }

      const produksiData = Object.entries(dateMap)
        .map(([date, count]) => ({ hari: date, actual: count }))
        .slice(-6)

      // Extract todayMenu dari hasil planning pertama yang punya menu hari ini
      foundTodayMenu = validStats.find((s: any) => s.todayMenu)?.todayMenu || null

      // Normalize times to match produksi page
      if (foundTodayMenu && foundTodayMenu.jamMulaiMasak) {
        foundTodayMenu.jamMulaiMasak = normalizeTimeField(foundTodayMenu.jamMulaiMasak)
      }
      if (foundTodayMenu && foundTodayMenu.jamSelesaiMasak) {
        foundTodayMenu.jamSelesaiMasak = normalizeTimeField(foundTodayMenu.jamSelesaiMasak)
      }

      const data = {
        menuPlanningData: validStats,
        todayMenu: foundTodayMenu,
        stats: newStats,
        produksiMingguan: produksiData,
      }

      return data
    } catch (err) {
      console.error("Error fetching dapur dashboard data:", err)
      throw err
    }
  }, [contextPlannings])

  // ✅ Load data with cache priority - show cache immediately, fetch background
  const loadData = useCallback(async () => {
    const cacheId = dapurId ? `dapur_dashboard_${dapurId}` : "dapur_dashboard"

    // 1. Check memory cache first (fastest)
    if (globalMemoryCache.has(cacheId)) {
      const cached = globalMemoryCache.get(cacheId)!
      const age = Date.now() - cached.timestamp

      setLoading(false)

      // Refetch in background if expired AND context is loaded
      if (age >= CACHE_EXPIRY && !contextLoading) {
        fetchAndUpdateCache(cacheId)
      }
      return cached
    }

    // 2. Check localStorage
    if (typeof window !== "undefined") {
      const localCached = localStorage.getItem(CACHE_KEY)
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached) as DapurDashboardData
          const age = Date.now() - parsed.timestamp

          // Show cache immediately (even if stale)
          globalMemoryCache.set(cacheId, parsed)
          setLoading(false)

          // Refetch in background if expired AND context is loaded
          if (age >= CACHE_EXPIRY && !contextLoading) {
            fetchAndUpdateCache(cacheId)
          }
          return parsed
        } catch (e) {
          // Failed to parse cache
        }
      }
    }

    // 3. If context is loaded, fetch from API. Otherwise just set loading to false
    if (!contextLoading) {
      return fetchAndUpdateCache(cacheId)
    } else {
      // Context still loading - just mark loading as false to show cached data
      setLoading(false)
      return
    }
  }, [fetchDapurDashboardData, contextLoading])

  // ✅ Fetch and update both memory and localStorage cache
  const fetchAndUpdateCache = useCallback(
    async (cacheId: string) => {
      // Wait for context to load
      if (contextLoading) {
        return
      }

      if (fetchInProgress.current) {
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

        return validData
      } catch (err) {
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
  }, [])

  // ✅ Force refresh
  const refreshData = useCallback(async () => {
    const cacheId = dapurId ? `dapur_dashboard_${dapurId}` : "dapur_dashboard"
    clearCache()
    return fetchAndUpdateCache(cacheId)
  }, [clearCache, fetchAndUpdateCache, dapurId])

  // ✅ Background refresh dengan callback (declare before updateCache)
  const backgroundRefresh = useCallback(
    async (cacheId: string, onSuccess?: (data: DapurDashboardData) => void) => {
      try {
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

        // Trigger callback
        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(cachedData)
          } catch (callbackErr) {
            // Error in callback
          }
        }

        return cachedData
      } catch (err) {
        // Background refresh failed - don't throw
      }
    },
    [fetchDapurDashboardData, contextPlannings]
  )

  // ✅ Update cache dengan data baru (optimistic + background refresh)
  const updateCache = useCallback(
    (newData: Partial<DapurDashboardData>, onSuccess?: (data: DapurDashboardData) => void) => {
      const cacheId = dapurId ? `dapur_dashboard_${dapurId}` : "dapur_dashboard"

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

      // Emit instant update ke semua components yang subscribe
      const validUpdatedData: DapurDashboardData = {
        menuPlanningData: Array.isArray(updatedData.menuPlanningData) ? updatedData.menuPlanningData : [],
        todayMenu: updatedData.todayMenu || null,
        stats: updatedData.stats,
        produksiMingguan: Array.isArray(updatedData.produksiMingguan) ? updatedData.produksiMingguan : [],
        hash: updatedData.hash,
        timestamp: updatedData.timestamp,
      }
      cacheEmitter.emit(CACHE_EMIT_KEY, validUpdatedData)

      // Background refresh: Fetch latest data dari API tanpa blocking UI
      backgroundRefresh("dapur_dashboard", (freshData) => {
        // Only update if data actually changed (compare hash)
        if (freshData && freshData.hash !== updatedData.hash) {
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
            // Error in callback
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
