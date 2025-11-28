import { useCallback, useRef, useState, useEffect } from "react"
import { cacheEmitter } from "@/lib/utils/cacheEmitter"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demombgv1.xyz"
const CACHE_EMIT_KEY = "sekolah_unified_cache_update"
const CACHE_KEY_PREFIX = "sekolah_unified_cache" // Added _PREFIX to clarify it's a base key
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes (increased from 1 min for better performance + multi-account safety)

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

interface SekolahCachedData {
  siswaData: any[]
  kelasData: any[]
  absensiData: any[]
  absensiChartData: any[] // NEW: For dashboard attendance chart
  pengirimanData: any | null
  kalenderData: any[]
  kalenderReminder: any | null
  menuHariIni: any | null
  hash: string
  timestamp: number
}

interface SekolahData {
  siswaData: any[]
  kelasData: any[]
  absensiData: any[]
  absensiChartData: any[] // NEW: For dashboard attendance chart
  pengirimanData: any | null
  kalenderData: any[]
  kalenderReminder: any | null
  menuHariIni: any | null
}

// ✅ UNIFIED Global memory cache (single source of truth for all pages)
const globalMemoryCache = new Map<string, SekolahCachedData>()

const calculateIMT = (tinggiBadan: number, beratBadan: number) => {
  if (!tinggiBadan || !beratBadan || tinggiBadan === 0) return 0
  const tinggiMeter = tinggiBadan / 100
  return (beratBadan / (tinggiMeter * tinggiMeter)).toFixed(2)
}

export const useSekolahDataCache = (onCacheUpdate?: (data: SekolahCachedData) => void) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)
  const fetchInProgress = useRef(false)

  // ✅ Setup listener untuk cache updates dari component lain (dalam tab yang sama)
  useEffect(() => {
    const unsubscribe = cacheEmitter.subscribe(CACHE_EMIT_KEY, (data: SekolahCachedData) => {
      console.log("✅ [UNIFIED CACHE] Received instant update from other component!")
      if (onCacheUpdate) {
        onCacheUpdate(data)
      }
    })

    return () => unsubscribe()
  }, [onCacheUpdate])

  // ✅ Fetch siswa data dengan normalisasi
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

      if (!Array.isArray(siswaList)) {
        console.warn("[FETCH SISWA] Invalid response format, returning empty array")
        return []
      }

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

  // ✅ Fetch kelas data dengan student count
  const fetchKelasDataReturn = useCallback(async (schoolId: string, token: string, siswaList: any[]) => {
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

      if (!Array.isArray(kelasList)) {
        console.warn("[FETCH KELAS] Invalid response format, returning empty array")
        kelasList = []
      }

      if (!Array.isArray(siswaList)) {
        console.warn("[CALCULATE SISWA] siswaList is not an array, skipping calculation")
        return kelasList
      }

      // Calculate siswa per kelas
      const siswaPerKelas: { [key: string]: { laki: number; perempuan: number; alergi: number } } = {}

      siswaList.forEach((siswa: any) => {
        // Normalize kelasId to string for consistent matching
        const kelasId = String(siswa.kelasId?.id || siswa.kelasId || '')
        if (!kelasId) return // Skip if no kelasId

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

      console.log("[FETCH KELAS] siswaPerKelas map:", siswaPerKelas)

      // Update kelas dengan siswa count
      const finalKelasList = kelasList.map((kelas: any) => {
        // Normalize kelas.id to string for consistent matching
        const normalizedKelasId = String(kelas.id || '')
        const siswaCount = siswaPerKelas[normalizedKelasId]

        console.log(`[FETCH KELAS] Kelas ${kelas.nama} (ID: ${normalizedKelasId}) -> siswaCount:`, siswaCount)

        return {
          ...kelas,
          totalSiswa: (siswaCount?.laki || 0) + (siswaCount?.perempuan || 0) || kelas.totalSiswa || 0,
          lakiLaki: siswaCount?.laki || kelas.lakiLaki || 0,
          perempuan: siswaCount?.perempuan || kelas.perempuan || 0,
          alergiCount: siswaCount?.alergi || kelas.alergiCount || 0,
        }
      })

      console.timeEnd("fetchKelas")
      return finalKelasList
    } catch (err) {
      console.error("Error fetching kelas:", err)
      throw err
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

        const absensiPerKelas: { [key: string]: number } = {}

        const absensiPromises = kelasList.map(async (kelas: any) => {
          try {
            // ✅ Use /api/kelas/:kelasId/absensi to get today's attendance summary
            const absensiUrl = `${API_BASE_URL}/api/kelas/${kelas.id}/absensi`
            console.log(`[FETCH ABSENSI TODAY] Fetching from: ${absensiUrl}`)
            const absensiRes = await fetch(absensiUrl, { headers })

            if (absensiRes.ok) {
              const absensiData = await absensiRes.json()
              console.log(`[FETCH ABSENSI TODAY] Response for kelas ${kelas.id}:`, absensiData)

              // Parse response berdasarkan berbagai struktur API
              let hadirCount = 0

              // Cek jika response adalah array of absensi records
              if (Array.isArray(absensiData.data?.data)) {
                // Filter untuk hari ini (tanggal sesuai hari ini)
                const today = new Date().toISOString().split('T')[0]
                const todayRecords = absensiData.data.data.filter((record: any) => {
                  const recordDate = record.tanggal?.split('T')[0]
                  return recordDate === today
                })

                if (todayRecords.length > 0) {
                  // Ambil hadir dari record hari ini
                  hadirCount = todayRecords[0].jumlahHadir || 0
                }
              } else if (Array.isArray(absensiData.data)) {
                // Direct array of records
                const today = new Date().toISOString().split('T')[0]
                const todayRecord = absensiData.data.find((record: any) => {
                  const recordDate = record.tanggal?.split('T')[0]
                  return recordDate === today
                })
                hadirCount = todayRecord?.jumlahHadir || 0
              } else if (typeof absensiData.data === 'object' && absensiData.data?.jumlahHadir !== undefined) {
                // Single object response
                hadirCount = absensiData.data.jumlahHadir || 0
              } else if (absensiData.jumlahHadir !== undefined) {
                // Direct field
                hadirCount = absensiData.jumlahHadir || 0
              }

              absensiPerKelas[kelas.id] = hadirCount
              console.log(`[FETCH ABSENSI TODAY] Kelas ${kelas.id}: ${hadirCount} hadir hari ini`)

              return {
                kelasId: kelas.id,
                data: Array.isArray(absensiData.data) ? absensiData.data : [],
              }
            } else {
              console.warn(`[FETCH ABSENSI TODAY] No data for kelas ${kelas.id}, status: ${absensiRes.status}`)
            }
          } catch (err) {
            console.error(`[FETCH ABSENSI] Error for kelas ${kelas.id}:`, err)
          }
          return { kelasId: kelas.id, data: [] }
        })

        const absensiResults = await Promise.all(absensiPromises)
        const allAbsensi = absensiResults.flatMap((r) => r.data)

        console.timeEnd("fetchAbsensi")

        return { allAbsensi, absensiPerKelas }
      } catch (err) {
        console.error("[FETCH ABSENSI] Global error:", err)
        return { allAbsensi: [], absensiPerKelas: {} }
      }
    },
    []
  )

  // ✅ Fetch absensi history dari endpoint /api/sekolah/:sekolahId/abseni dan process untuk weekly chart
  const fetchAbsensiTotalPerWeek = useCallback(
    async (schoolId: string, token: string) => {
      try {
        console.time("fetchAbsensiWeek")
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }

        // Fetch absensi history dari endpoint /api/sekolah/:sekolahId/absensi
        const absensiUrl = `${API_BASE_URL}/api/sekolah/${schoolId}/absensi`
        console.log("[FETCH ABSENSI] URL:", absensiUrl)
        const absensiRes = await fetch(absensiUrl, { headers })

        if (!absensiRes.ok) {
          console.error(`[FETCH ABSENSI] Error: ${absensiRes.status}`)
          return [
            { hari: "Senin", hadir: 0, tidakHadir: 0 },
            { hari: "Selasa", hadir: 0, tidakHadir: 0 },
            { hari: "Rabu", hadir: 0, tidakHadir: 0 },
            { hari: "Kamis", hadir: 0, tidakHadir: 0 },
            { hari: "Jumat", hadir: 0, tidakHadir: 0 },
          ]
        }

        const absensiData = await absensiRes.json()

        console.log("[ABSENSI RAW RESPONSE]", absensiData)
        console.log("[ABSENSI RAW] absensiData.data:", absensiData.data)
        console.log("[ABSENSI RAW] absensiData.data.data:", absensiData.data?.data)

        // Parse absensi list dari berbagai struktur response
        let absensiList: any[] = []
        if (Array.isArray(absensiData.data?.data)) {
          console.log("[ABSENSI PARSE] Using absensiData.data.data")
          absensiList = absensiData.data.data
        } else if (Array.isArray(absensiData.data)) {
          console.log("[ABSENSI PARSE] Using absensiData.data")
          absensiList = absensiData.data
        } else if (Array.isArray(absensiData)) {
          console.log("[ABSENSI PARSE] Using absensiData directly")
          absensiList = absensiData
        } else {
          console.warn("[ABSENSI PARSE] Could not parse absensiList! Structure:", Object.keys(absensiData))
        }

        console.log(`[ABSENSI HISTORY] Loaded ${absensiList.length} records`, absensiList)

        // Calculate Monday to Friday of current week
        const today = new Date()
        const dayOfWeek = today.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

        const mondayDate = new Date(today)
        mondayDate.setDate(today.getDate() - daysToMonday)
        mondayDate.setHours(0, 0, 0, 0)

        const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
        const chartDataMap: {
          [key: string]: { hari: string; hadir: number; tidakHadir: number }
        } = {}

        // Initialize chart data for Monday-Friday
        for (let i = 0; i < 5; i++) {
          const dateForDay = new Date(mondayDate)
          dateForDay.setDate(mondayDate.getDate() + i)
          const dateString = dateForDay.toISOString().split("T")[0]

          chartDataMap[dateString] = {
            hari: daysOfWeek[i],
            hadir: 0,
            tidakHadir: 0,
          }
        }

        // Process absensi records to aggregate hadir/tidakHadir per hari
        let matchedRecords = 0
        let unmatchedRecords = 0

        absensiList.forEach((record: any, idx: number) => {
          let recordDate = ""
          let hadir = 0
          let tidakHadir = 0

          // Parse tanggal dari berbagai field names (convert UTC ke local date)
          let dateObj: Date | null = null
          if (record.tanggal) {
            dateObj = new Date(record.tanggal)
          } else if (record.date) {
            dateObj = new Date(record.date)
          } else if (record.createdAt) {
            dateObj = new Date(record.createdAt)
          }

          if (dateObj) {
            // Convert UTC to local date string (handle timezone offset)
            const year = dateObj.getUTCFullYear()
            const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
            const day = String(dateObj.getUTCDate()).padStart(2, "0")
            recordDate = `${year}-${month}-${day}`
          }

          // ✅ Parse hadir/tidakHadir dari struktur API baru
          // API returns: { jumlahHadir, jumlahSiswa }
          if (record.jumlahHadir !== undefined && record.jumlahSiswa !== undefined) {
            hadir = Number(record.jumlahHadir) || 0
            tidakHadir = Math.max(0, Number(record.jumlahSiswa) - hadir)
            console.log(
              `[RECORD ${idx}] tanggal: ${recordDate} | jumlahHadir: ${hadir} | jumlahSiswa: ${record.jumlahSiswa} | calculated tidakHadir: ${tidakHadir}`
            )
          }
          // Fallback untuk struktur lama: direct hadir/tidakHadir fields
          else if (record.hadir !== undefined || record.tidakHadir !== undefined) {
            hadir = Number(record.hadir) || 0
            tidakHadir = Number(record.tidakHadir) || 0
            console.log(
              `[RECORD ${idx} - OLD FORMAT] tanggal: ${recordDate} | hadir: ${hadir} | tidakHadir: ${tidakHadir}`
            )
          }
          // Fallback untuk boolean status field
          else if (record.status) {
            const status = String(record.status).toLowerCase()
            hadir = status === "hadir" || status === "present" ? 1 : 0
            tidakHadir = status === "tidak_hadir" || status === "absent" ? 1 : 0
            console.log(`[RECORD ${idx} - STATUS FIELD] tanggal: ${recordDate} | status: ${status} | hadir: ${hadir}`)
          }

          // Check if this record is within our week
          if (chartDataMap[recordDate] && (hadir > 0 || tidakHadir > 0)) {
            console.log(
              `[MATCHED] ${recordDate} matches week range - adding hadir: ${hadir}, tidakHadir: ${tidakHadir}`
            )
            chartDataMap[recordDate].hadir += hadir
            chartDataMap[recordDate].tidakHadir += tidakHadir
            matchedRecords++
          } else if (chartDataMap[recordDate]) {
            console.log(`[MATCHED BUT ZERO] ${recordDate} matches week but hadir=0 and tidakHadir=0`)
            unmatchedRecords++
          } else {
            console.log(
              `[NOT MATCHED] ${recordDate} is outside week range (week keys: ${Object.keys(chartDataMap).join(", ")})`
            )
            unmatchedRecords++
          }
        })

        console.log(
          `[ABSENSI STATS] Matched: ${matchedRecords}, Unmatched: ${unmatchedRecords}, Final chart:`,
          chartDataMap
        )

        // Convert map to array in correct order
        const chartData = Object.keys(chartDataMap)
          .sort()
          .map((dateKey) => chartDataMap[dateKey])

        console.log("[ABSENSI CHART] Generated chart:", chartData)
        console.timeEnd("fetchAbsensiWeek")

        return chartData
      } catch (err) {
        console.error("[FETCH ABSENSI WEEK] Error:", err)
        // Return default chart structure
        return [
          { hari: "Senin", hadir: 0, tidakHadir: 0 },
          { hari: "Selasa", hadir: 0, tidakHadir: 0 },
          { hari: "Rabu", hadir: 0, tidakHadir: 0 },
          { hari: "Kamis", hadir: 0, tidakHadir: 0 },
          { hari: "Jumat", hadir: 0, tidakHadir: 0 },
        ]
      }
    },
    []
  )

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

  // ✅ Main fetch function (full refresh from API)
  const fetchAllDataFull = useCallback(
    async (schoolId: string, token: string): Promise<SekolahData> => {
      console.log("🔄 [UNIFIED] Starting full data fetch for all modules")
      console.time("Total Unified Fetch Time")

      try {
        // 1. Fetch siswa terlebih dahulu
        console.log("[FETCH ALL] Step 1: Fetching siswa...")
        const siswaList = await fetchSiswaDataReturn(schoolId, token)
        console.log("[FETCH ALL] ✅ Siswa fetched:", siswaList.length)

        // 2. Fetch kelas dengan siswa count
        console.log("[FETCH ALL] Step 2: Fetching kelas...")
        const kelasList = await fetchKelasDataReturn(schoolId, token, siswaList)
        console.log("[FETCH ALL] ✅ Kelas fetched:", kelasList.length)

        // 3. Fetch absensi + absensi chart for dashboard
        console.log("[FETCH ALL] Step 3: Fetching absensi...")
        const { allAbsensi, absensiPerKelas } = await fetchAbsensiDataReturn(kelasList, token)
        console.log("[FETCH ALL] ✅ Absensi fetched:", allAbsensi.length, "absensiPerKelas:", absensiPerKelas)

        // ✅ Merge hadirHariIni into kelas data
        const kelasDataWithAbsensi = kelasList.map((kelas: any) => ({
          ...kelas,
          hadirHariIni: absensiPerKelas[kelas.id] || 0
        }))

        // 4. Fetch absensi per minggu untuk dashboard chart
        console.log("[FETCH ALL] Step 4: Fetching absensi chart per minggu...")
        const absensiChartData = await fetchAbsensiTotalPerWeek(schoolId, token)
        console.log("[FETCH ALL] ✅ Absensi chart generated:", absensiChartData)

        // 5. Fetch pengiriman, kalender, dan menu in parallel
        console.log("[FETCH ALL] Step 5: Fetching pengiriman, kalender, menu in parallel...")
        const [pengirimanResult, kalenderResult, menuResult] = await Promise.all([
          fetchPengirimanDataReturn(schoolId, token),
          fetchKalenderAkademikReturn(token),
          fetchMenuHariIniReturn(token),
        ])
        console.log("[FETCH ALL] ✅ All parallel fetches complete")

        const data: SekolahData = {
          siswaData: siswaList,
          kelasData: kelasDataWithAbsensi,
          absensiData: allAbsensi,
          absensiChartData,
          pengirimanData: pengirimanResult,
          kalenderData: kalenderResult.list,
          kalenderReminder: kalenderResult.reminder || pengirimanResult,
          menuHariIni: menuResult,
        }

        console.timeEnd("Total Unified Fetch Time")
        return data
      } catch (err) {
        console.error("❌ [UNIFIED] Error:", err)
        throw err
      }
    },
    [
      fetchSiswaDataReturn,
      fetchKelasDataReturn,
      fetchAbsensiDataReturn,
      fetchAbsensiTotalPerWeek,
      fetchPengirimanDataReturn,
      fetchKalenderAkademikReturn,
      fetchMenuHariIniReturn,
    ]
  )

  // ✅ Load data with cache priority - UNIFIED
  const loadData = useCallback(
    async (schoolId: string, token: string) => {
      const cacheId = `${schoolId}_${token.substring(0, 10)}`
      const localStorageCacheKey = `${CACHE_KEY_PREFIX}_${cacheId}` // ✅ FIX: Unique key per account

      // 1. Check memory cache first (fastest)
      if (globalMemoryCache.has(cacheId)) {
        const cached = globalMemoryCache.get(cacheId)!
        const age = Date.now() - cached.timestamp

        if (age < CACHE_EXPIRY) {
          console.log("✅ [UNIFIED CACHE] Using memory cache (fresh)", { age, expiry: CACHE_EXPIRY })
          setLoading(false)
          // ✅ Notify callback so component gets updated
          if (onCacheUpdate) {
            onCacheUpdate(cached)
          }
          return cached
        }
      }

      // 2. Check localStorage
      if (typeof window !== "undefined") {
        const localCached = localStorage.getItem(localStorageCacheKey)
        if (localCached) {
          try {
            const parsed = JSON.parse(localCached) as SekolahCachedData
            const age = Date.now() - parsed.timestamp

            if (age < CACHE_EXPIRY) {
              console.log("✅ [UNIFIED CACHE] Using localStorage cache (fresh)", { age, expiry: CACHE_EXPIRY })
              globalMemoryCache.set(cacheId, parsed)
              setLoading(false)
              // ✅ Notify callback
              if (onCacheUpdate) {
                onCacheUpdate(parsed)
              }
              return parsed
            } else if (age < CACHE_EXPIRY * 2) {
              console.log("⚠️ [UNIFIED CACHE] Using stale cache, refetching in background", { age, maxStale: CACHE_EXPIRY * 2 })
              setLoading(false)
              globalMemoryCache.set(cacheId, parsed)
              // ✅ Notify callback with stale data first
              if (onCacheUpdate) {
                onCacheUpdate(parsed)
              }
              // Then refresh in background
              fetchAndUpdateCache(schoolId, token, cacheId)
              return parsed
            }
          } catch (e) {
            console.warn("[UNIFIED CACHE] Failed to parse localStorage cache", e)
          }
        }
      }

      // 3. No cache, need to fetch
      console.log("📥 [UNIFIED CACHE] No cache found, fetching from API")
      return fetchAndUpdateCache(schoolId, token, cacheId)
    },
    [onCacheUpdate]
  )

  // ✅ Fetch and update both memory and localStorage cache
  const fetchAndUpdateCache = useCallback(
    async (schoolId: string, token: string, cacheId: string) => {
      if (fetchInProgress.current) {
        console.log("[UNIFIED] Fetch already in progress, skipping")
        return
      }

      try {
        fetchInProgress.current = true
        setLoading(true)

        const data = await fetchAllDataFull(schoolId, token)

        // Safety checks untuk ensure valid data structure
        const siswaData = Array.isArray(data.siswaData) ? data.siswaData : []
        const kelasData = Array.isArray(data.kelasData) ? data.kelasData : []
        const absensiData = Array.isArray(data.absensiData) ? data.absensiData : []
        const absensiChartData = Array.isArray(data.absensiChartData) ? data.absensiChartData : []
        const pengirimanData = data.pengirimanData || null
        const kalenderData = Array.isArray(data.kalenderData) ? data.kalenderData : []
        const kalenderReminder = data.kalenderReminder || null
        const menuHariIni = data.menuHariIni || null

        const newHash = simpleHash(
          JSON.stringify({
            siswaData,
            kelasData,
            absensiData,
            absensiChartData,
            pengirimanData,
            kalenderData,
            kalenderReminder,
            menuHariIni,
          })
        )
        const cachedData: SekolahCachedData = {
          siswaData,
          kelasData,
          absensiData,
          absensiChartData,
          pengirimanData,
          kalenderData,
          kalenderReminder,
          menuHariIni,
          hash: newHash,
          timestamp: Date.now(),
        }

        // Update UNIFIED memory cache
        globalMemoryCache.set(cacheId, cachedData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(`${CACHE_KEY_PREFIX}_${cacheId}`, JSON.stringify(cachedData))
        }

        console.log("✅ [UNIFIED CACHE] Data updated and cached - dashboard fields included!")

        // ✅ Notify callback immediately
        if (onCacheUpdate) {
          onCacheUpdate(cachedData)
        }

        // 📢 Emit instant update ke semua subscribers (siswa, kelas, presensi, absensi, dashboard!)
        cacheEmitter.emit(CACHE_EMIT_KEY, cachedData)

        return cachedData
      } catch (err) {
        console.error("❌ [UNIFIED] Error:", err)
        setError(err instanceof Error ? err.message : "Gagal memload data")
        throw err
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    },
    [fetchAllDataFull, onCacheUpdate]
  )

  // ✅ Clear cache
  const clearCache = useCallback(() => {
    globalMemoryCache.clear()
    if (typeof window !== "undefined") {
      // Clear all sekolah cache keys (for multi-account safety)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    }
    console.log("✅ [UNIFIED CACHE] Cleared")
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

  // ✅ Update cache dengan data baru (optimistic + background refresh)
  const updateCache = useCallback(
    (schoolId: string, token: string, newData: Partial<SekolahData>, onSuccess?: (data: SekolahCachedData) => void) => {
      const cacheId = `${schoolId}_${token.substring(0, 10)}`

      // Get existing cache
      let cachedData = globalMemoryCache.get(cacheId)
      if (!cachedData) {
        cachedData = {
          siswaData: [],
          kelasData: [],
          absensiData: [],
          absensiChartData: [],
          pengirimanData: null,
          kalenderData: [],
          kalenderReminder: null,
          menuHariIni: null,
          hash: "",
          timestamp: Date.now(),
        }
      }

      // Merge new data (optimistic)
      const updatedData: SekolahCachedData = {
        siswaData: newData.siswaData ?? cachedData.siswaData,
        kelasData: newData.kelasData ?? cachedData.kelasData,
        absensiData: newData.absensiData ?? cachedData.absensiData,
        absensiChartData: newData.absensiChartData ?? cachedData.absensiChartData,
        pengirimanData: newData.pengirimanData ?? cachedData.pengirimanData,
        kalenderData: newData.kalenderData ?? cachedData.kalenderData,
        kalenderReminder: newData.kalenderReminder ?? cachedData.kalenderReminder,
        menuHariIni: newData.menuHariIni ?? cachedData.menuHariIni,
        hash: simpleHash(
          JSON.stringify({
            siswaData: newData.siswaData ?? cachedData.siswaData,
            kelasData: newData.kelasData ?? cachedData.kelasData,
            absensiData: newData.absensiData ?? cachedData.absensiData,
            absensiChartData: newData.absensiChartData ?? cachedData.absensiChartData,
            pengirimanData: newData.pengirimanData ?? cachedData.pengirimanData,
            kalenderData: newData.kalenderData ?? cachedData.kalenderData,
            kalenderReminder: newData.kalenderReminder ?? cachedData.kalenderReminder,
            menuHariIni: newData.menuHariIni ?? cachedData.menuHariIni,
          })
        ),
        timestamp: Date.now(),
      }

      // Update UNIFIED memory cache immediately
      globalMemoryCache.set(cacheId, updatedData)

      // Update localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.setItem(`${CACHE_KEY_PREFIX}_${cacheId}`, JSON.stringify(updatedData))
      }

      console.log("✅ [UNIFIED CACHE] Updated with optimistic data - AUTO SYNC to all pages!")

      // 📢 Emit instant update ke semua components yang subscribe (instant in-tab sync!)
      // Ensure data valid sebelum emit
      const validUpdatedData: SekolahCachedData = {
        siswaData: Array.isArray(updatedData.siswaData) ? updatedData.siswaData : [],
        kelasData: Array.isArray(updatedData.kelasData) ? updatedData.kelasData : [],
        absensiData: Array.isArray(updatedData.absensiData) ? updatedData.absensiData : [],
        absensiChartData: Array.isArray(updatedData.absensiChartData) ? updatedData.absensiChartData : [],
        pengirimanData: updatedData.pengirimanData,
        kalenderData: Array.isArray(updatedData.kalenderData) ? updatedData.kalenderData : [],
        kalenderReminder: updatedData.kalenderReminder,
        menuHariIni: updatedData.menuHariIni,
        hash: updatedData.hash,
        timestamp: updatedData.timestamp,
      }
      cacheEmitter.emit(CACHE_EMIT_KEY, validUpdatedData)

      // 🔄 Background refresh: Fetch latest data dari API tanpa blocking UI
      backgroundRefresh(schoolId, token, cacheId, (freshData) => {
        // 📢 Emit fresh data juga
        if (freshData) {
          const validFreshData: SekolahCachedData = {
            siswaData: Array.isArray(freshData.siswaData) ? freshData.siswaData : [],
            kelasData: Array.isArray(freshData.kelasData) ? freshData.kelasData : [],
            absensiData: Array.isArray(freshData.absensiData) ? freshData.absensiData : [],
            absensiChartData: Array.isArray(freshData.absensiChartData) ? freshData.absensiChartData : [],
            pengirimanData: freshData.pengirimanData,
            kalenderData: Array.isArray(freshData.kalenderData) ? freshData.kalenderData : [],
            kalenderReminder: freshData.kalenderReminder,
            menuHariIni: freshData.menuHariIni,
            hash: freshData.hash,
            timestamp: freshData.timestamp,
          }
          cacheEmitter.emit(CACHE_EMIT_KEY, validFreshData)
        }
        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(freshData)
          } catch (err) {
            console.error("⚠️ [UNIFIED] Error in onSuccess callback:", err)
          }
        }
      })

      return updatedData
    },
    []
  )

  // ✅ Background refresh dengan callback
  const backgroundRefresh = useCallback(
    async (schoolId: string, token: string, cacheId: string, onSuccess?: (data: SekolahCachedData) => void) => {
      try {
        console.log("🔄 [UNIFIED] Starting background refresh...")
        const freshData = await fetchAllDataFull(schoolId, token)

        // Safety checks untuk ensure data structure valid
        const siswaData = Array.isArray(freshData.siswaData) ? freshData.siswaData : []
        const kelasData = Array.isArray(freshData.kelasData) ? freshData.kelasData : []
        const absensiData = Array.isArray(freshData.absensiData) ? freshData.absensiData : []
        const absensiChartData = Array.isArray(freshData.absensiChartData) ? freshData.absensiChartData : []
        const pengirimanData = freshData.pengirimanData || null
        const kalenderData = Array.isArray(freshData.kalenderData) ? freshData.kalenderData : []
        const kalenderReminder = freshData.kalenderReminder || null
        const menuHariIni = freshData.menuHariIni || null

        const newHash = simpleHash(
          JSON.stringify({
            siswaData,
            kelasData,
            absensiData,
            absensiChartData,
            pengirimanData,
            kalenderData,
            kalenderReminder,
            menuHariIni,
          })
        )
        const cachedData: SekolahCachedData = {
          siswaData,
          kelasData,
          absensiData,
          absensiChartData,
          pengirimanData,
          kalenderData,
          kalenderReminder,
          menuHariIni,
          hash: newHash,
          timestamp: Date.now(),
        }

        // Update UNIFIED memory cache
        globalMemoryCache.set(cacheId, cachedData)

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(`${CACHE_KEY_PREFIX}_${cacheId}`, JSON.stringify(cachedData))
        }

        console.log("✅ [UNIFIED] Background refresh completed successfully - all fields including attendance chart updated!")

        // Trigger callback untuk update component state dengan data fresh
        if (onSuccess && typeof onSuccess === "function") {
          try {
            onSuccess(cachedData)
          } catch (callbackErr) {
            console.error("⚠️ [UNIFIED] Error in onSuccess callback:", callbackErr)
          }
        }

        return cachedData
      } catch (err) {
        console.error("⚠️ [UNIFIED] Background refresh failed:", err)
        // Don't throw - let UI continue with optimistic data
      }
    },
    [fetchAllDataFull]
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
