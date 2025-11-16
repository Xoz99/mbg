import { useCallback, useRef, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demombgv1.xyz"
const CACHE_KEY = "sekolah_siswa_cache"
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
  siswaData: any[]
  kelasData: any[]
  hash: string
  timestamp: number
}

interface SiswaData {
  siswaData: any[]
  kelasData: any[]
}

// ✅ Global memory cache (persists during session)
const memoryCache = new Map<string, CachedData>()

const calculateIMT = (tinggiBadan: number, beratBadan: number) => {
  if (!tinggiBadan || !beratBadan || tinggiBadan === 0) return 0
  const tinggiMeter = tinggiBadan / 100
  return (beratBadan / (tinggiMeter * tinggiMeter)).toFixed(2)
}

export const useSiswaCache = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)
  const fetchInProgress = useRef(false)

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

      if (!response.ok) throw new Error(`API Error: ${response.status}`)

      const data = await response.json()
      const siswaList = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : data

      const normalizedList = siswaList.map((siswa: any) => {
        let kelasNama = ""
        if (typeof siswa.kelas === "string") {
          kelasNama = siswa.kelas
        } else if (siswa.kelas?.nama) {
          kelasNama = String(siswa.kelas.nama)
        } else if (siswa.kelasId?.nama) {
          kelasNama = String(siswa.kelasId.nama)
        }

        let alergiArray: string[] = []
        if (siswa.alergi) {
          if (Array.isArray(siswa.alergi)) {
            alergiArray = siswa.alergi
              .map((a: any) => String(a.namaAlergi || a.nama || a))
              .filter((a: string) => a.trim())
          } else if (typeof siswa.alergi === "string") {
            alergiArray = siswa.alergi
              .split(",")
              .map((a: string) => a.trim())
              .filter((a: string) => a)
          }
        }

        const imt = calculateIMT(siswa.tinggiBadan || 0, siswa.beratBadan || 0)

        return {
          ...siswa,
          id: String(siswa.id || siswa._id || ""),
          nama: String(siswa.nama || ""),
          nis: String(siswa.nis || ""),
          kelas: kelasNama,
          kelasId: String(siswa.kelasId?.id || siswa.kelas?.id || ""),
          jenisKelamin: String(siswa.jenisKelamin || "LAKI_LAKI"),
          umur: Number(siswa.umur || 0),
          tinggiBadan: Number(siswa.tinggiBadan || 0),
          beratBadan: Number(siswa.beratBadan || 0),
          imt: Number(imt) || 0,
          statusGizi: String(siswa.statusGizi || "NORMAL"),
          statusStunting: String(siswa.statusStunting || "NORMAL"),
          alergi: alergiArray,
          fotoUrl: siswa.fotoUrl || "",
          riwayatPengukuran: Array.isArray(siswa.riwayatPengukuran) ? siswa.riwayatPengukuran : [],
        }
      })

      console.timeEnd("fetchSiswa")
      return normalizedList
    } catch (err) {
      console.error("Error fetching siswa:", err)
      throw err
    }
  }, [])

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

      console.timeEnd("fetchKelas")
      return kelasList
    } catch (err) {
      console.error("Error fetching kelas:", err)
      throw err
    }
  }, [])

  // ✅ Main fetch function (full refresh from API)
  const fetchSiswaDataFull = useCallback(
    async (schoolId: string, token: string): Promise<SiswaData> => {
      console.log("🔄 [FETCH SISWA] Starting data fetch")
      console.time("Total Fetch Time")

      try {
        const [siswaResult, kelasResult] = await Promise.all([
          fetchSiswaDataReturn(schoolId, token),
          fetchKelasDataReturn(schoolId, token),
        ])

        const siswaData: SiswaData = {
          siswaData: siswaResult,
          kelasData: kelasResult,
        }

        console.timeEnd("Total Fetch Time")
        return siswaData
      } catch (err) {
        console.error("❌ [FETCH SISWA] Error:", err)
        throw err
      }
    },
    [fetchSiswaDataReturn, fetchKelasDataReturn]
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

        const data = await fetchSiswaDataFull(schoolId, token)

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
        setError(err instanceof Error ? err.message : "Gagal memuat data siswa")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchSiswaDataFull]
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

  // ✅ Lightweight fetch untuk background refresh
  const fetchSiswaDataLightweight = useCallback(
    async (schoolId: string, token: string): Promise<SiswaData> => {
      try {
        console.log("⚡ [BACKGROUND] Starting lightweight refresh")
        console.time("Lightweight Fetch Time")

        // Parallel fetch siswa dan kelas
        const [siswaResult, kelasResult] = await Promise.all([
          fetchSiswaDataReturn(schoolId, token),
          fetchKelasDataReturn(schoolId, token),
        ])

        console.timeEnd("Lightweight Fetch Time")
        return {
          siswaData: siswaResult,
          kelasData: kelasResult,
        }
      } catch (err) {
        console.error("⚠️ [LIGHTWEIGHT] Error:", err)
        throw err
      }
    },
    [fetchSiswaDataReturn, fetchKelasDataReturn]
  )

  // ✅ Background refresh dengan callback
  const backgroundRefresh = useCallback(
    async (schoolId: string, token: string, cacheId: string, onSuccess?: (data: CachedData) => void) => {
      try {
        console.log("🔄 [BACKGROUND] Starting background refresh...")
        const freshData = await fetchSiswaDataLightweight(schoolId, token)

        const newHash = simpleHash(JSON.stringify(freshData))
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
    [fetchSiswaDataLightweight]
  )

  // ✅ Broadcast cache invalidation ke semua tabs/windows
  const broadcastInvalidation = useCallback((schoolId: string) => {
    if (typeof window !== "undefined") {
      console.log("📢 [BROADCAST] Invalidating kelas cache (siswa changed)")
      localStorage.setItem(
        INVALIDATION_EVENT,
        JSON.stringify({ schoolId, timestamp: Date.now(), source: "siswa" })
      )
    }
  }, [])

  // ✅ Update cache dengan data baru (optimistic update + background refresh)
  const updateCache = useCallback(
    (schoolId: string, token: string, newData: Partial<SiswaData>, onSuccess?: (data: CachedData) => void) => {
      const cacheId = `${schoolId}_${token.substring(0, 10)}`

      // Get existing cache
      let cachedData = memoryCache.get(cacheId)
      if (!cachedData) {
        // If no cache, create new one
        cachedData = {
          siswaData: [],
          kelasData: [],
          hash: "",
          timestamp: Date.now(),
        }
      }

      // Merge new data (optimistic)
      const updatedData: CachedData = {
        siswaData: newData.siswaData ?? cachedData.siswaData,
        kelasData: newData.kelasData ?? cachedData.kelasData,
        hash: simpleHash(JSON.stringify({ siswaData: newData.siswaData ?? cachedData.siswaData, kelasData: newData.kelasData ?? cachedData.kelasData })),
        timestamp: Date.now(),
      }

      // Update memory cache immediately
      memoryCache.set(cacheId, updatedData)

      // Update localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData))
      }

      console.log("✅ [CACHE] Updated with optimistic data")

      // 📢 Broadcast cache invalidation ke sekolah/kelas page
      broadcastInvalidation(schoolId)

      // 🔄 Background refresh: Fetch latest data dari API tanpa blocking UI
      // Gunakan callback untuk update component state dengan data fresh dari API
      backgroundRefresh(schoolId, token, cacheId, (freshData) => {
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
          // Jika invalidation dari sekolah/kelas, trigger refresh
          if (data.schoolId === schoolId && data.source === "kelas") {
            console.log("🔔 [INVALIDATION] Detected kelas changes, refreshing siswa data...")
            const cacheId = `${schoolId}_${token.substring(0, 10)}`
            backgroundRefresh(schoolId, token, cacheId)
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
