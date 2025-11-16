import { useCallback, useRef, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demombgv1.xyz"
const CACHE_KEY = "sekolah_layout_cache"
const CACHE_EXPIRY = 10 * 60 * 1000 // 10 minutes

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

interface SekolahInfo {
  nama: string
  alamat: string
  kota: string
  pic: string
  picPhone: string
  picEmail: string
  kode: string
  latitude: number
  longitude: number
}

interface CachedSekolahData {
  sekolahInfo: SekolahInfo
  hash: string
  timestamp: number
}

// Global memory cache
const memoryCache = new Map<string, CachedSekolahData>()

export const useSekolahLayout = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sekolahInfo, setSekolahInfo] = useState<SekolahInfo>({
    nama: "",
    alamat: "",
    kota: "",
    pic: "",
    picPhone: "",
    picEmail: "",
    kode: "",
    latitude: 0,
    longitude: 0,
  })

  const fetchInProgress = useRef(false)

  // Utility functions
  const extractKota = (alamat: string): string => {
    if (!alamat) return ""
    const parts = String(alamat).split(",")
    if (parts.length > 1) {
      return parts[parts.length - 1].trim()
    }
    return ""
  }

  const generateKodeSekolah = (id: string): string => {
    if (!id) return "SKL-000"
    const shortId = String(id).slice(-3).toUpperCase()
    return `SKL-${shortId}`
  }

  const updateSekolahInfo = (sekolah: any): SekolahInfo => {
    if (!sekolah) {
      return sekolahInfo
    }

    const picData =
      sekolah.picSekolah && Array.isArray(sekolah.picSekolah) && sekolah.picSekolah.length > 0
        ? sekolah.picSekolah[0]
        : null

    const alamat = String(sekolah.alamat || "")
    const kota = extractKota(alamat) || "Sekolah"

    const newInfo: SekolahInfo = {
      nama: String(sekolah.nama || "Sekolah MBG"),
      alamat: alamat,
      kota: kota,
      pic: picData ? String(picData.name || picData.namaLengkap || "-") : "-",
      picPhone: picData ? String(picData.phone || picData.noHp || "") : "",
      picEmail: picData ? String(picData.email || "") : "",
      kode: generateKodeSekolah(String(sekolah.id || "")),
      latitude: Number(sekolah.latitude) || 0,
      longitude: Number(sekolah.longitude) || 0,
    }

    return newInfo
  }

  // Fetch sekolah by PIC
  const findSekolahByPIC = useCallback(async (picId: string, token: string) => {
    try {
      console.log("[SEKOLAH LAYOUT HOOK] Mencari sekolah untuk PIC ID:", picId)

      const response = await fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      let sekolahList = []
      if (Array.isArray(result.data?.data)) {
        sekolahList = result.data.data
      } else if (Array.isArray(result.data)) {
        sekolahList = result.data
      } else if (Array.isArray(result)) {
        sekolahList = result
      }

      let foundSekolah = null

      for (const sekolah of sekolahList) {
        if (sekolah.picSekolah && Array.isArray(sekolah.picSekolah)) {
          const matchingPIC = sekolah.picSekolah.find((pic: any) => pic.id === picId)

          if (matchingPIC) {
            foundSekolah = sekolah
            console.log("[SEKOLAH LAYOUT HOOK] Sekolah ditemukan:", foundSekolah)
            break
          }
        }
      }

      if (foundSekolah) {
        localStorage.setItem("sekolahId", foundSekolah.id)
        const updatedInfo = updateSekolahInfo(foundSekolah)
        return { success: true, sekolahId: foundSekolah.id, sekolahInfo: updatedInfo }
      } else {
        console.warn("[SEKOLAH LAYOUT HOOK] Sekolah tidak ditemukan untuk PIC ini")
        throw new Error("Sekolah tidak ditemukan untuk PIC ini")
      }
    } catch (err) {
      console.error("[SEKOLAH LAYOUT HOOK] Error mencari sekolah:", err)
      throw err
    }
  }, [])

  // Fetch sekolah detail
  const fetchSekolahDetail = useCallback(async (sekolahId: string, token: string) => {
    try {
      console.log("[SEKOLAH LAYOUT HOOK] Fetch detail sekolah:", sekolahId)

      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      let sekolah = result.data || result

      if (sekolah && typeof sekolah === "object" && !sekolah.nama && sekolah.data) {
        sekolah = sekolah.data
      }

      const updatedInfo = updateSekolahInfo(sekolah)
      return { success: true, sekolahInfo: updatedInfo }
    } catch (err) {
      console.error("[SEKOLAH LAYOUT HOOK] Error fetch detail:", err)
      throw err
    }
  }, [])

  // Load data with cache priority
  const loadSekolahData = useCallback(
    async (sekolahId: string, picId: string, token: string) => {
      const cacheId = `${sekolahId || picId}_${token.substring(0, 10)}`

      // 1. Check memory cache first
      if (memoryCache.has(cacheId)) {
        const cached = memoryCache.get(cacheId)!
        const age = Date.now() - cached.timestamp

        if (age < CACHE_EXPIRY) {
          console.log("✅ [SEKOLAH] Using memory cache (fresh)")
          setSekolahInfo(cached.sekolahInfo)
          setLoading(false)
          return cached.sekolahInfo
        }
      }

      // 2. Check localStorage
      if (typeof window !== "undefined") {
        const localCached = localStorage.getItem(CACHE_KEY)
        if (localCached) {
          try {
            const parsed = JSON.parse(localCached) as CachedSekolahData
            const age = Date.now() - parsed.timestamp

            if (age < CACHE_EXPIRY) {
              console.log("✅ [SEKOLAH] Using localStorage cache (fresh)")
              memoryCache.set(cacheId, parsed)
              setSekolahInfo(parsed.sekolahInfo)
              setLoading(false)
              return parsed.sekolahInfo
            } else if (age < CACHE_EXPIRY * 2) {
              // Stale cache, use it but refetch in background
              console.log("⚠️ [SEKOLAH] Using stale cache, refetching in background")
              setSekolahInfo(parsed.sekolahInfo)
              setLoading(false)
              memoryCache.set(cacheId, parsed)
              // Background refetch
              fetchAndUpdateSekolah(sekolahId, picId, token, cacheId)
              return parsed.sekolahInfo
            }
          } catch (e) {
            console.warn("[SEKOLAH] Failed to parse localStorage cache")
          }
        }
      }

      // 3. No cache, need to fetch
      console.log("📥 [SEKOLAH] No cache found, fetching from API")
      return fetchAndUpdateSekolah(sekolahId, picId, token, cacheId)
    },
    []
  )

  // Fetch and update cache
  const fetchAndUpdateSekolah = useCallback(
    async (sekolahId: string, picId: string, token: string, cacheId: string) => {
      if (fetchInProgress.current) {
        console.log("[SEKOLAH] Fetch already in progress, skipping")
        return null
      }

      try {
        fetchInProgress.current = true
        setLoading(true)
        setError(null)

        let result
        if (sekolahId) {
          result = await fetchSekolahDetail(sekolahId, token)
        } else if (picId) {
          result = await findSekolahByPIC(picId, token)
        } else {
          throw new Error("Sekolah ID atau PIC ID diperlukan")
        }

        const newHash = simpleHash(JSON.stringify(result.sekolahInfo))
        const cachedData: CachedSekolahData = {
          sekolahInfo: result.sekolahInfo,
          hash: newHash,
          timestamp: Date.now(),
        }

        // Update memory cache
        memoryCache.set(cacheId, cachedData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
        }

        setSekolahInfo(result.sekolahInfo)
        console.log("✅ [SEKOLAH] Data updated and cached")
        return result.sekolahInfo
      } catch (err) {
        console.error("❌ [SEKOLAH] Error:", err)
        const errorMsg = err instanceof Error ? err.message : "Gagal memuat data sekolah"
        setError(errorMsg)
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchSekolahDetail, findSekolahByPIC]
  )

  // Clear cache
  const clearCache = useCallback(() => {
    memoryCache.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
    console.log("✅ [SEKOLAH] Cache cleared")
  }, [])

  return {
    loading,
    error,
    sekolahInfo,
    loadSekolahData,
    clearCache,
  }
}
