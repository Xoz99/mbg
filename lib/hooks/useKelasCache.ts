import { useCallback, useRef, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const CACHE_KEY = "sekolah_kelas_cache"
const CACHE_EXPIRY = 1 * 60 * 1000 // 1 minute (more aggressive refresh)
const INVALIDATION_EVENT = "sekolah_data_invalidated" // Broadcast event untuk cache invalidation

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
  kelasData: any[]
  siswaData: any[]
  absensiData: any[]
  hash: string
  timestamp: number
}

interface KelasData {
  kelasData: any[]
  siswaData: any[]
  absensiData: any[]
}

// ✅ Global memory cache (persists during session)
const memoryCache = new Map<string, CachedData>()

export const useKelasCache = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)
  const fetchInProgress = useRef(false)

  // ✅ Fetch kelas data
  const fetchKelasDataReturn = useCallback(async (schoolId: string, token: string) => {
    try {
      console.time("fetchKelas")
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/kelas?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error(`API Error: ${response.status}`)

      const data = await response.json()
      let kelasList = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : data

      console.log("[FETCH KELAS] Total kelas:", kelasList.length)
      console.timeEnd("fetchKelas")
      return kelasList
    } catch (err) {
      console.error("Error fetching kelas:", err)
      throw err
    }
  }, [])

  // ✅ Fetch siswa data
  const fetchSiswaDataReturn = useCallback(async (schoolId: string, token: string) => {
    try {
      console.time("fetchSiswa")
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/siswa?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) return []

      const data = await response.json()
      const siswaList = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : []

      console.timeEnd("fetchSiswa")
      return siswaList
    } catch (err) {
      console.error("Error fetching siswa:", err)
      return []
    }
  }, [])

  // ✅ Fetch absensi data untuk semua kelas
  const fetchAbsensiDataReturn = useCallback(
    async (kelasList: any[], token: string) => {
      try {
        console.time("fetchAbsensi")
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }

        const today = new Date().toISOString().split("T")[0]
        const absensiPerKelas: { [key: string]: number } = {}

        const absensiPromises = kelasList.map(async (kelas: any) => {
          try {
            const absensiUrl = `${API_BASE_URL}/api/kelas/${kelas.id}/absensi?tanggal=${today}`
            const absensiRes = await fetch(absensiUrl, { headers })

            if (absensiRes.ok) {
              const absensiData = await absensiRes.json()

              let absensiList = []
              if (Array.isArray(absensiData.data?.data)) {
                absensiList = absensiData.data.data
              } else if (Array.isArray(absensiData.data)) {
                absensiList = absensiData.data
              } else if (Array.isArray(absensiData)) {
                absensiList = absensiData
              } else if (absensiData.data && typeof absensiData.data === "object") {
                absensiList = [absensiData.data]
              }

              if (absensiList.length > 0) {
                const todayAbsensi = absensiList.find((a: any) => {
                  const absensiDate = new Date(a.tanggal).toISOString().split("T")[0]
                  return absensiDate === today
                })

                if (todayAbsensi && todayAbsensi.jumlahHadir !== undefined) {
                  absensiPerKelas[kelas.id] = todayAbsensi.jumlahHadir
                }
              }

              return {
                kelasId: kelas.id,
                data: absensiList,
              }
            }
          } catch (err) {
            console.error(`[FETCH ABSENSI] Error for kelas ${kelas.id}:`, err)
          }
          return { kelasId: kelas.id, data: [] }
        })

        const absensiResults = await Promise.all(absensiPromises)
        const allAbsensi = absensiResults.flatMap((r) => r.data)

        console.log("[FETCH ABSENSI] Kehadiran per kelas:", absensiPerKelas)
        console.timeEnd("fetchAbsensi")

        return { allAbsensi, absensiPerKelas }
      } catch (err) {
        console.error("[FETCH ABSENSI] Global error:", err)
        return { allAbsensi: [], absensiPerKelas: {} }
      }
    },
    []
  )

  // ✅ Main fetch function (full refresh from API)
  const fetchKelasDataFullFromAPI = useCallback(
    async (schoolId: string, token: string): Promise<KelasData> => {
      console.log("🔄 [FETCH KELAS] Starting all data fetch")
      console.time("Total Fetch Time")

      try {
        const [kelasList, siswaList] = await Promise.all([
          fetchKelasDataReturn(schoolId, token),
          fetchSiswaDataReturn(schoolId, token),
        ])

        // Calculate siswa per kelas dan alergi
        const siswaPerKelas: { [key: string]: { laki: number; perempuan: number; alergi: number } } = {}

        siswaList.forEach((siswa: any) => {
          const kelasId = siswa.kelasId?.id || siswa.kelasId
          if (!siswaPerKelas[kelasId]) {
            siswaPerKelas[kelasId] = { laki: 0, perempuan: 0, alergi: 0 }
          }
          if (siswa.jenisKelamin === "LAKI_LAKI") {
            siswaPerKelas[kelasId].laki++
          } else {
            siswaPerKelas[kelasId].perempuan++
          }

          // Count alergi
          if (siswa.alergi) {
            if (Array.isArray(siswa.alergi) && siswa.alergi.length > 0) {
              siswaPerKelas[kelasId].alergi++
            } else if (typeof siswa.alergi === "string" && siswa.alergi.trim() !== "") {
              siswaPerKelas[kelasId].alergi++
            }
          }
        })

        // Fetch absensi
        const { allAbsensi, absensiPerKelas } = await fetchAbsensiDataReturn(kelasList, token)

        // Update kelas dengan siswa count dan kehadiran
        const finalKelasList = kelasList.map((kelas: any) => ({
          ...kelas,
          totalSiswa: (siswaPerKelas[kelas.id]?.laki || 0) + (siswaPerKelas[kelas.id]?.perempuan || 0) || kelas.totalSiswa || 0,
          lakiLaki: siswaPerKelas[kelas.id]?.laki || kelas.lakiLaki || 0,
          perempuan: siswaPerKelas[kelas.id]?.perempuan || kelas.perempuan || 0,
          alergiCount: siswaPerKelas[kelas.id]?.alergi || kelas.alergiCount || 0,
          hadirHariIni: absensiPerKelas[kelas.id] || 0,
        }))

        const kelasData: KelasData = {
          kelasData: finalKelasList,
          siswaData: siswaList,
          absensiData: allAbsensi,
        }

        console.timeEnd("Total Fetch Time")
        return kelasData
      } catch (err) {
        console.error("❌ [FETCH KELAS] Error:", err)
        throw err
      }
    },
    [fetchKelasDataReturn, fetchSiswaDataReturn, fetchAbsensiDataReturn]
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

            // Show localStorage cache immediately if not expired
            if (age < CACHE_EXPIRY) {
              console.log("✅ [CACHE] Using localStorage cache (fresh)")
              memoryCache.set(cacheId, parsed)
              setLoading(false)
              return parsed
            } else if (age < CACHE_EXPIRY * 2) {
              // If cache is stale but not too old, show it but refetch in background
              console.log("⚠️ [CACHE] Using stale cache, refetching in background")
              setLoading(false)
              memoryCache.set(cacheId, parsed)
              // Background refetch will update the data
              fetchAndUpdateCache(schoolId, token, cacheId)
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

        const data = await fetchKelasDataFullFromAPI(schoolId, token)

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
        return cachedData
      } catch (err) {
        console.error("❌ [FETCH] Error:", err)
        setError(err instanceof Error ? err.message : "Gagal memuat data kelas")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchKelasDataFullFromAPI]
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

  // ✅ Lightweight fetch untuk background refresh (skip absensi)
  const fetchKelasDataLightweight = useCallback(
    async (schoolId: string, token: string, existingData: KelasData): Promise<KelasData> => {
      try {
        console.log("⚡ [BACKGROUND] Starting lightweight refresh (skip absensi)")
        console.time("Lightweight Fetch Time")

        // Hanya fetch kelas dan siswa, skip absensi (faster!)
        const [kelasList, siswaList] = await Promise.all([
          fetchKelasDataReturn(schoolId, token),
          fetchSiswaDataReturn(schoolId, token),
        ])

        // Calculate siswa per kelas
        const siswaPerKelas: { [key: string]: { laki: number; perempuan: number; alergi: number } } = {}

        siswaList.forEach((siswa: any) => {
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

        // Update kelas dengan siswa count, KEEP hadirHariIni dari cache lama
        const finalKelasList = kelasList.map((kelas: any) => ({
          ...kelas,
          totalSiswa: (siswaPerKelas[kelas.id]?.laki || 0) + (siswaPerKelas[kelas.id]?.perempuan || 0) || kelas.totalSiswa || 0,
          lakiLaki: siswaPerKelas[kelas.id]?.laki || kelas.lakiLaki || 0,
          perempuan: siswaPerKelas[kelas.id]?.perempuan || kelas.perempuan || 0,
          alergiCount: siswaPerKelas[kelas.id]?.alergi || kelas.alergiCount || 0,
          hadirHariIni: existingData.kelasData?.find((k: any) => k.id === kelas.id)?.hadirHariIni || 0, // Keep existing
        }))

        console.timeEnd("Lightweight Fetch Time")
        return {
          kelasData: finalKelasList,
          siswaData: siswaList,
          absensiData: existingData.absensiData, // Keep existing absensi data
        }
      } catch (err) {
        console.error("⚠️ [LIGHTWEIGHT] Error:", err)
        throw err
      }
    },
    [fetchKelasDataReturn, fetchSiswaDataReturn]
  )

  // ✅ Background refresh dengan callback
  const backgroundRefresh = useCallback(
    async (schoolId: string, token: string, cacheId: string, existingData: KelasData, onSuccess?: (data: CachedData) => void) => {
      try {
        console.log("🔄 [BACKGROUND] Starting background refresh...")
        const freshData = await fetchKelasDataLightweight(schoolId, token, existingData)

        const newHash = simpleHash(
          JSON.stringify({
            kelasData: freshData.kelasData,
            siswaData: freshData.siswaData,
            absensiData: freshData.absensiData,
          })
        )
        const cachedData: CachedData = {
          ...freshData,
          hash: newHash,
          timestamp: Date.now(),
        }

        // Update memory cache
        memoryCache.set(cacheId, cachedData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        console.log("✅ [BACKGROUND] Background refresh completed successfully")

        // Trigger callback untuk update component state dengan data fresh
        if (onSuccess) {
          onSuccess(cachedData)
        }

        return cachedData
      } catch (err) {
        console.error("⚠️ [BACKGROUND] Background refresh failed:", err)
        // Don't throw - let UI continue with optimistic data
      }
    },
    [fetchKelasDataLightweight]
  )

  // ✅ Broadcast cache invalidation ke semua tabs/windows
  const broadcastInvalidation = useCallback((schoolId: string) => {
    if (typeof window !== "undefined") {
      console.log("📢 [BROADCAST] Invalidating siswa cache (kelas changed)")
      localStorage.setItem(
        INVALIDATION_EVENT,
        JSON.stringify({ schoolId, timestamp: Date.now(), source: "kelas" })
      )
    }
  }, [])

  // ✅ Update cache dengan data baru (optimistic update)
  const updateCache = useCallback(
    (schoolId: string, token: string, newData: Partial<KelasData>, onSuccess?: (data: CachedData) => void) => {
      const cacheId = `${schoolId}_${token.substring(0, 10)}`

      // Get existing cache
      let cachedData = memoryCache.get(cacheId)
      if (!cachedData) {
        // If no cache, create new one
        cachedData = {
          kelasData: [],
          siswaData: [],
          absensiData: [],
          hash: "",
          timestamp: Date.now(),
        }
      }

      // Merge new data
      const updatedData: CachedData = {
        kelasData: newData.kelasData ?? cachedData.kelasData,
        siswaData: newData.siswaData ?? cachedData.siswaData,
        absensiData: newData.absensiData ?? cachedData.absensiData,
        hash: simpleHash(
          JSON.stringify({
            kelasData: newData.kelasData ?? cachedData.kelasData,
            siswaData: newData.siswaData ?? cachedData.siswaData,
            absensiData: newData.absensiData ?? cachedData.absensiData,
          })
        ),
        timestamp: Date.now(),
      }

      // Update memory cache
      memoryCache.set(cacheId, updatedData)

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData))
      }

      console.log("✅ [CACHE] Updated with optimistic data")

      // 📢 Broadcast cache invalidation ke sekolah/siswa page
      broadcastInvalidation(schoolId)

      // 🔄 Background refresh: Fetch latest data dari API tanpa blocking UI
      // Gunakan callback untuk update component state dengan data fresh dari API
      backgroundRefresh(schoolId, token, cacheId, updatedData, (freshData) => {
        if (onSuccess) {
          onSuccess(freshData)
        }
      })

      return updatedData
    },
    [backgroundRefresh, broadcastInvalidation]
  )

  // ✅ Setup listener untuk cache invalidation dari page lain
  const setupInvalidationListener = useCallback((schoolId: string, token: string) => {
    if (typeof window === "undefined") return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === INVALIDATION_EVENT && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          // Jika invalidation dari sekolah/siswa, trigger refresh
          if (data.schoolId === schoolId && data.source === "siswa") {
            console.log("🔔 [INVALIDATION] Detected siswa changes, refreshing kelas data...")
            const cacheId = `${schoolId}_${token.substring(0, 10)}`
            backgroundRefresh(schoolId, token, cacheId, {
              kelasData: [],
              siswaData: [],
              absensiData: [],
            })
          }
        } catch (err) {
          console.error("Error parsing invalidation event:", err)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [backgroundRefresh])

  return {
    loading,
    error,
    loadData,
    refreshData,
    clearCache,
    updateCache,
    setupInvalidationListener,
  }
}
