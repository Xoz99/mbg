import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://demombgv1.xyz"
const CACHE_KEY = "sekolah_dashboard_cache"
const CACHE_EXPIRY = 30 * 60 * 1000 // 30 minutes - hold cache longer, refresh in background
const STALE_CACHE_THRESHOLD = 5 * 60 * 1000 // 5 minutes - after this, refetch in background
const CACHE_EMIT_KEY = "sekolah_dashboard_cache_update"

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

interface CachedData {
  stats: any
  kelasList: any[]
  absensiChart: any[]
  siswaDiagram: any[]
  kalenderReminder: any
  menuHariIni: any
  hash: string
  timestamp: number
}

interface DashboardData {
  stats: any
  kelasList: any[]
  absensiChart: any[]
  siswaDiagram: any[]
  kalenderReminder: any
  menuHariIni: any
  hadirHariIni: number
}

// ✅ Global memory cache (persists during session)
const memoryCache = new Map<string, CachedData>()

export const useDashboardCache = (onCacheUpdate?: (data: CachedData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)
  const fetchInProgress = useRef(false)

  // ✅ Setup listener untuk cache updates dari component lain (dalam tab yang sama)
  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: CachedData) => {
      console.log("✅ [DASHBOARD CACHE] Received instant update!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  // ✅ Fetch siswa data
  const fetchSiswaDataReturn = useCallback(async (schoolId: string, token: string) => {
    try {
      console.time("fetchSiswa")
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/siswa?page=1&limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) return { siswa: [], gizi: { normal: 0, kurang: 0, buruk: 0, obesitas: 0 } }
        throw new Error(`HTTP ${response.status}: Gagal fetch siswa`)
      }

      const data = await response.json()
      const siswaData = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : []

      const normalGizi = siswaData.filter((s: any) => s.statusGizi === "NORMAL").length || 0
      const giziKurang = siswaData.filter((s: any) => s.statusGizi === "GIZI_KURANG").length || 0
      const giziBuruk = siswaData.filter((s: any) => s.statusGizi === "GIZI_BURUK").length || 0
      const obesitas = siswaData.filter((s: any) => s.statusGizi === "OBESITAS").length || 0

      console.timeEnd("fetchSiswa")
      return {
        siswa: siswaData,
        gizi: { normal: normalGizi, kurang: giziKurang, buruk: giziBuruk, obesitas },
      }
    } catch (err) {
      console.error("Error fetching siswa:", err)
      return { siswa: [], gizi: { normal: 0, kurang: 0, buruk: 0, obesitas: 0 } }
    }
  }, [])

  // ✅ Fetch kelas data
  const fetchKelasDataReturn = useCallback(async (schoolId: string, token: string, siswaArray: any[] = []) => {
    try {
      console.time("fetchKelas")
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/kelas?page=1&limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) return []
        throw new Error(`HTTP ${response.status}: Gagal fetch kelas`)
      }

      const data = await response.json()
      let kelasData = []
      if (Array.isArray(data.data?.data)) {
        kelasData = data.data.data
      } else if (Array.isArray(data.data)) {
        kelasData = data.data
      } else if (Array.isArray(data)) {
        kelasData = data
      }

      const siswaPerKelas: { [key: string]: { laki: number; perempuan: number; alergi: number } } = {}

      siswaArray.forEach((siswa: any) => {
        const kelasId = siswa.kelasId?.id || siswa.kelasId
        if (!siswaPerKelas[kelasId]) {
          siswaPerKelas[kelasId] = { laki: 0, perempuan: 0, alergi: 0 }
        }
        if (siswa.jenisKelamin === "LAKI_LAKI") {
          siswaPerKelas[kelasId].laki++
        } else {
          siswaPerKelas[kelasId].perempuan++
        }

        if (siswa.alergi) {
          if (Array.isArray(siswa.alergi) && siswa.alergi.length > 0) {
            siswaPerKelas[kelasId].alergi++
          } else if (typeof siswa.alergi === "string" && siswa.alergi.trim() !== "") {
            siswaPerKelas[kelasId].alergi++
          }
        }
      })

      kelasData = kelasData.map((kelas: any) => ({
        ...kelas,
        totalSiswa:
          (siswaPerKelas[kelas.id]?.laki || 0) + (siswaPerKelas[kelas.id]?.perempuan || 0) || kelas.totalSiswa || 0,
        lakiLaki: siswaPerKelas[kelas.id]?.laki || kelas.lakiLaki || 0,
        perempuan: siswaPerKelas[kelas.id]?.perempuan || kelas.perempuan || 0,
        alergiCount: siswaPerKelas[kelas.id]?.alergi || kelas.alergiCount || 0,
      }))

      console.timeEnd("fetchKelas")
      return kelasData
    } catch (err) {
      console.error("Error fetching kelas:", err)
      return []
    }
  }, [])

  // ✅ Fetch absensi data
  const fetchAbsensiDataReturn = useCallback(async (token: string, kelasArray: any[] = []) => {
    try {
      console.time("fetchAbsensi")
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dayOfWeek = today.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

      const mondayDate = new Date(today)
      mondayDate.setDate(today.getDate() - daysToMonday)
      mondayDate.setHours(0, 0, 0, 0)

      const fridayDate = new Date(mondayDate)
      fridayDate.setDate(mondayDate.getDate() + 4)
      fridayDate.setHours(23, 59, 59, 999)

      const mondayString = mondayDate.toISOString().split("T")[0]
      const fridayString = fridayDate.toISOString().split("T")[0]
      const todayString = today.toISOString().split("T")[0]

      if (!kelasArray || kelasArray.length === 0) {
        return {
          chart: [
            { hari: "Senin", hadir: 0, tidakHadir: 0 },
            { hari: "Selasa", hadir: 0, tidakHadir: 0 },
            { hari: "Rabu", hadir: 0, tidakHadir: 0 },
            { hari: "Kamis", hadir: 0, tidakHadir: 0 },
            { hari: "Jumat", hadir: 0, tidakHadir: 0 },
          ],
          hadirHariIni: 0,
        }
      }

      const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
      const chartDataByDate: { [key: string]: { hari: string; hadir: number; tidakHadir: number } } = {}

      for (let i = 0; i < 5; i++) {
        const dateForDay = new Date(mondayDate)
        dateForDay.setDate(mondayDate.getDate() + i)
        const dateString = dateForDay.toISOString().split("T")[0]
        chartDataByDate[dateString] = {
          hari: daysOfWeek[i],
          hadir: 0,
          tidakHadir: 0,
        }
      }

      let totalHadirHariIni = 0

      const batchSize = 3
      for (let i = 0; i < kelasArray.length; i += batchSize) {
        const batch = kelasArray.slice(i, i + batchSize)
        const absensiPromises = batch.map(async (kelas: any) => {
          try {
            const absenRes = await fetch(`${API_BASE_URL}/api/kelas/${kelas.id}/absensi`, { headers })

            if (!absenRes.ok) return 0

            const absenData = await absenRes.json()
            const absensiList = Array.isArray(absenData.data?.data)
              ? absenData.data.data
              : Array.isArray(absenData.data)
                ? absenData.data
                : []

            let hadirToday = 0

            for (const a of absensiList) {
              if (!a.tanggal) continue

              try {
                const eventDate = new Date(a.tanggal)
                eventDate.setHours(0, 0, 0, 0)
                const absenDateString = eventDate.toISOString().split("T")[0]

                if (absenDateString < mondayString || absenDateString > fridayString) continue

                if (chartDataByDate[absenDateString]) {
                  if (a.jumlahHadir !== undefined && a.jumlahHadir !== null) {
                    chartDataByDate[absenDateString].hadir += a.jumlahHadir
                  } else if (a.status === "hadir" || a.status === "Hadir" || a.status === "HADIR") {
                    chartDataByDate[absenDateString].hadir += 1
                  }

                  if (a.jumlahTidakHadir !== undefined && a.jumlahTidakHadir !== null) {
                    chartDataByDate[absenDateString].tidakHadir += a.jumlahTidakHadir
                  } else if (a.status === "tidak_hadir" || a.status === "Tidak Hadir" || a.status === "TIDAK_HADIR") {
                    chartDataByDate[absenDateString].tidakHadir += 1
                  }
                }

                if (absenDateString === todayString) {
                  if (a.jumlahHadir !== undefined && a.jumlahHadir !== null) {
                    hadirToday += a.jumlahHadir
                  } else if (a.status === "hadir" || a.status === "Hadir" || a.status === "HADIR") {
                    hadirToday += 1
                  }
                }
              } catch (e) {
                continue
              }
            }

            return hadirToday
          } catch (err) {
            return 0
          }
        })

        const hadirPerKelas = await Promise.all(absensiPromises)
        totalHadirHariIni += hadirPerKelas.reduce((sum, count) => sum + count, 0)
      }

      const chartData = Object.keys(chartDataByDate)
        .sort()
        .map((dateKey) => chartDataByDate[dateKey])

      console.timeEnd("fetchAbsensi")
      return { chart: chartData, hadirHariIni: totalHadirHariIni }
    } catch (err) {
      console.error("[ABSENSI] Error aggregating:", err)
      return {
        chart: [
          { hari: "Senin", hadir: 0, tidakHadir: 0 },
          { hari: "Selasa", hadir: 0, tidakHadir: 0 },
          { hari: "Rabu", hadir: 0, tidakHadir: 0 },
          { hari: "Kamis", hadir: 0, tidakHadir: 0 },
          { hari: "Jumat", hadir: 0, tidakHadir: 0 },
        ],
        hadirHariIni: 0,
      }
    }
  }, [])

  // ✅ Fetch pengiriman data
  const fetchPengirimanDataReturn = useCallback(async (schoolId: string, token: string) => {
    try {
      console.time("fetchPengiriman")
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/pengiriman`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) return null

      const data = await response.json()

      if (Array.isArray(data.data) && data.data.length > 0) {
        const latestPengiriman = data.data[0]
        console.timeEnd("fetchPengiriman")
        return {
          tanggalMulai: latestPengiriman.tanggal || latestPengiriman.createdAt,
          deskripsi: `Pengiriman ke ${latestPengiriman.namaSekolah || "Sekolah"}`,
          status: latestPengiriman.status,
        }
      }

      console.timeEnd("fetchPengiriman")
      return null
    } catch (err) {
      console.error("Error fetching pengiriman:", err)
      return null
    }
  }, [])

  // ✅ Fetch kalender akademik
  const fetchKalenderAkademikReturn = useCallback(async (token: string) => {
    try {
      console.time("fetchKalender")
      const response = await fetch(`${API_BASE_URL}/api/kalender-akademik`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) return { list: [], reminder: null }

      const data = await response.json()

      let kalenders = []
      if (data.data?.kalenders && Array.isArray(data.data.kalenders)) {
        kalenders = data.data.kalenders
      } else if (data.kalenders && Array.isArray(data.kalenders)) {
        kalenders = data.kalenders
      } else if (Array.isArray(data.data)) {
        kalenders = data.data
      } else if (Array.isArray(data)) {
        kalenders = data
      }

      const sortedKalenders = kalenders.sort((a: any, b: any) => {
        const dateA = new Date(a.tanggalMulai).getTime()
        const dateB = new Date(b.tanggalMulai).getTime()
        return dateA - dateB
      })

      let reminder = null
      if (sortedKalenders.length > 0) {
        const upcomingEvent =
          sortedKalenders.find((k: any) => {
            const eventDate = new Date(k.tanggalMulai)
            return eventDate >= new Date()
          }) || sortedKalenders[0]

        if (upcomingEvent) {
          reminder = {
            tanggalMulai: upcomingEvent.tanggalMulai,
            deskripsi: upcomingEvent.deskripsi || "Kegiatan akademik",
            status: "scheduled",
          }
        }
      }

      console.timeEnd("fetchKalender")
      return { list: sortedKalenders, reminder }
    } catch (err) {
      console.error("Error fetching kalender akademik:", err)
      return { list: [], reminder: null }
    }
  }, [])

  // ✅ Fetch menu harian
  const fetchMenuHariIniReturn = useCallback(async (token: string) => {
    try {
      console.time("fetchMenu")
      const response = await fetch(`${API_BASE_URL}/api/menu-harian/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.timeEnd("fetchMenu")
        return null
      }

      const data = await response.json()

      let menu = null

      if (data.data) {
        if (Array.isArray(data.data)) {
          menu = data.data[0]
        } else if (typeof data.data === "object") {
          menu = data.data
        }
      } else if (Array.isArray(data)) {
        menu = data[0]
      } else if (typeof data === "object" && data !== null) {
        menu = data
      }

      console.timeEnd("fetchMenu")
      return menu || null
    } catch (err) {
      console.error("Error fetching menu harian:", err)
      return null
    }
  }, [])

  // ✅ Main fetch function
  const fetchDashboardData = useCallback(
    async (schoolId: string, token: string): Promise<DashboardData> => {
      console.log("🔄 [FETCH] Starting all data fetch")
      console.time("Total Fetch Time")

      try {
        const siswaResult = await fetchSiswaDataReturn(schoolId, token)
        const kelasResult = await fetchKelasDataReturn(schoolId, token, siswaResult.siswa)
        const [absensiResult, pengirimanResult, kalenderResult, menuResult] = await Promise.all([
          fetchAbsensiDataReturn(token, kelasResult),
          fetchPengirimanDataReturn(schoolId, token),
          fetchKalenderAkademikReturn(token),
          fetchMenuHariIniReturn(token),
        ])

        const totalSiswa = siswaResult.siswa.length
        const rataGizi = totalSiswa > 0 ? Math.round((siswaResult.gizi.normal / totalSiswa) * 100) : 0

        const stats = {
          totalSiswa,
          normalGizi: siswaResult.gizi.normal,
          giziKurang: siswaResult.gizi.kurang,
          stuntingRisiko: siswaResult.gizi.buruk,
          hadirHariIni: absensiResult.hadirHariIni,
          pengirimanSelesai: Math.floor(absensiResult.hadirHariIni * 0.8),
          totalPengiriman: 0,
          sudahMakan: absensiResult.hadirHariIni,
          totalKelas: kelasResult.length,
          rataGizi,
        }

        const siswaDiagram = [
          { name: "Normal", value: siswaResult.gizi.normal },
          { name: "Kurang", value: siswaResult.gizi.kurang },
          { name: "Risiko Stunting", value: siswaResult.gizi.buruk },
          { name: "Berlebih", value: siswaResult.gizi.obesitas },
        ]

        const dashboardData: DashboardData = {
          stats,
          kelasList: kelasResult,
          absensiChart: absensiResult.chart,
          siswaDiagram,
          kalenderReminder: kalenderResult.reminder || pengirimanResult,
          menuHariIni: menuResult,
          hadirHariIni: absensiResult.hadirHariIni,
        }

        console.timeEnd("Total Fetch Time")
        return dashboardData
      } catch (err) {
        console.error("❌ [FETCH] Error:", err)
        throw err
      }
    },
    [fetchSiswaDataReturn, fetchKelasDataReturn, fetchAbsensiDataReturn, fetchPengirimanDataReturn, fetchKalenderAkademikReturn, fetchMenuHariIniReturn]
  )

  // ✅ Load data with cache priority
  const loadData = useCallback(
    async (schoolId: string, token: string) => {
      const cacheId = `${schoolId}_${token.substring(0, 10)}`

      // 1. Check memory cache first (fastest)
      if (memoryCache.has(cacheId)) {
        const cached = memoryCache.get(cacheId)!
        const age = Date.now() - cached.timestamp

        // If cache is still fresh, use it
        if (age < CACHE_EXPIRY) {
          console.log("✅ [CACHE] Using memory cache (fresh)")
          setLoading(false)
          return cached
        }
      }

      // 2. Check localStorage
      if (typeof window !== "undefined") {
        const localCached = localStorage.getItem(CACHE_KEY)
        if (localCached) {
          try {
            const parsed = JSON.parse(localCached) as CachedData
            const age = Date.now() - parsed.timestamp

            // Show localStorage cache immediately if not expired (30 minutes)
            if (age < CACHE_EXPIRY) {
              console.log("✅ [CACHE] Using localStorage cache (fresh)", `Age: ${Math.round(age / 1000)}s`)
              memoryCache.set(cacheId, parsed)
              setLoading(false)

              // If cache is getting old (5+ minutes), refetch in background
              if (age > STALE_CACHE_THRESHOLD) {
                console.log("🔄 [CACHE] Cache is 5+ minutes old, refreshing in background")
                fetchAndUpdateCache(schoolId, token, cacheId).catch(() => {
                  // Silently fail - user already has data
                })
              }

              return parsed
            }
          } catch (e) {
            console.warn("[CACHE] Failed to parse localStorage cache")
          }
        }
      }

      // 3. No cache, need to fetch
      console.log("📥 [CACHE] No cache found, fetching from API")
      return fetchAndUpdateCache(schoolId, token, cacheId)
    },
    []
  )

  // ✅ Fetch and update both memory and localStorage cache
  const fetchAndUpdateCache = useCallback(
    async (schoolId: string, token: string, cacheId: string) => {
      if (fetchInProgress.current) {
        console.log("[FETCH] Fetch already in progress, skipping")
        return
      }

      try {
        fetchInProgress.current = true
        setLoading(true)

        const data = await fetchDashboardData(schoolId, token)

        const newHash = simpleHash(JSON.stringify(data))
        const cachedData: CachedData = {
          ...data,
          hash: newHash,
          timestamp: Date.now(),
        }

        // Update memory cache
        memoryCache.set(cacheId, cachedData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        console.log("✅ [CACHE] Data updated and cached")

        // 📢 Emit instant update ke semua components yang subscribe
        cacheEmitter.emit(CACHE_EMIT_KEY, cachedData)

        return cachedData
      } catch (err) {
        console.error("❌ [FETCH] Error:", err)
        setError(err instanceof Error ? err.message : "Gagal memuat data")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchDashboardData]
  )

  // ✅ Clear cache
  const clearCache = useCallback(() => {
    memoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
    console.log("✅ [CACHE] Cleared")
  }, [])

  // ✅ Force refresh
  const refreshData = useCallback(
    async (schoolId: string, token: string) => {
      const cacheId = `${schoolId}_${token.substring(0, 10)}`
      clearCache()
      return fetchAndUpdateCache(schoolId, token, cacheId)
    },
    [clearCache, fetchAndUpdateCache]
  )

  return {
    loading,
    error,
    loadData,
    refreshData,
    clearCache,
  }
}
