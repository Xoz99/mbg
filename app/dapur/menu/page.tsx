"use client"

import { useState, useEffect } from "react"
import DapurLayout from "@/components/layout/DapurLayout"
import {
  Calendar,
  ChefHat,
  Plus,
  X,
  Flame,
  Apple,
  Drumstick,
  Wheat,
  AlertCircle,
  Loader,
  Trash2,
  Filter,
  AlertTriangle,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://72.60.79.126:3000"

interface MenuHarian {
  id: string
  tanggal: string
  namaMenu: string
  biayaPerTray: number
  jamMulaiMasak: string
  jamSelesaiMasak: string
  kalori: number
  protein: number
  lemak: number
  karbohidrat: number
}

interface MenuPlanning {
  id: string
  mingguanKe: number
  tanggalMulai: string
  tanggalSelesai: string
  sekolahId: string
  sekolah?: { id: string; nama: string }
  _count?: { menuHarian: number }
}

interface Sekolah {
  id: string
  nama: string
}

interface AlergiItem {
  nama: string
  jumlahSiswa: number
  siswaMulaiDari?: string[]
}

interface Holiday {
  tanggal?: string
  tanggalMulai?: string
  tanggalSelesai?: string
  keterangan?: string
  deskripsi?: string
}

async function getAuthToken(): Promise<string> {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("authToken") || ""
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    console.error(`[API Error] ${endpoint}:`, error)
    throw error
  }
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

// Utility function untuk parse tanggal dengan berbagai format
function parseDate(dateString: string): Date | null {
  if (!dateString) return null
  
  const date = new Date(dateString)
  
  // Cek apakah tanggal valid
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date format: ${dateString}`)
    return null
  }
  
  return date
}

// Format tanggal ke format Indonesia dengan fallback
function formatDateSafe(dateString: string): string {
  const date = parseDate(dateString)
  if (!date) {
    return "Tanggal tidak valid"
  }
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function MenuPlanningPage() {
  const [menuPlannings, setMenuPlannings] = useState<MenuPlanning[]>([])
  const [menuHarianList, setMenuHarianList] = useState<MenuHarian[]>([])
  const [sekolahList, setSekolahList] = useState<Sekolah[]>([])
  const [alergiList, setAlergiList] = useState<AlergiItem[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMenuHarian, setLoadingMenuHarian] = useState(false)
  const [loadingAlergiAndHolidays, setLoadingAlergiAndHolidays] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedPlanningId, setSelectedPlanningId] = useState<string>("")
  const [selectedSekolahId, setSelectedSekolahId] = useState<string>("")
  const [selectedMenu, setSelectedMenu] = useState<MenuHarian | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateMenuModal, setShowCreateMenuModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    mingguanKe: "1",
    tanggalMulai: "",
    tanggalSelesai: "",
    sekolahId: "",
  })

  const [menuFormData, setMenuFormData] = useState({
    tanggal: "",
    namaMenu: "",
    biayaPerTray: "",
    jamMulaiMasak: "",
    jamSelesaiMasak: "",
    kalori: "",
    protein: "",
    karbohidrat: "",
    lemak: "",
  })

  const [ingredientWarnings, setIngredientWarnings] = useState<{
    hasWarning: boolean
    conflicts: string[]
    message: string
  }>({ hasWarning: false, conflicts: [], message: "" })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const planningRes = await apiCall<any>("/api/menu-planning")
        const plannings = extractArray(planningRes?.data || [])
        setMenuPlannings(plannings)

        const sekolahRes = await apiCall<any>("/api/sekolah")
        const sekolah = extractArray(sekolahRes?.data || [])
        setSekolahList(sekolah)

        if (sekolah.length > 0) {
          setSelectedSekolahId(sekolah[0].id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredMenuPlannings = selectedSekolahId
    ? menuPlannings
        .filter((p) => p.sekolahId === selectedSekolahId)
        .sort((a, b) => a.mingguanKe - b.mingguanKe)
    : menuPlannings.sort((a, b) => a.mingguanKe - b.mingguanKe)

  useEffect(() => {
    if (filteredMenuPlannings.length === 0) {
      setSelectedPlanningId("")
      setMenuHarianList([])
      setAlergiList([])
    }
  }, [filteredMenuPlannings])

  useEffect(() => {
    if (!selectedSekolahId) {
      setAlergiList([])
      setHolidays([])
      return
    }

    const loadAlergiAndHolidays = async () => {
      try {
        setLoadingAlergiAndHolidays(true)
        
        // Load alergi
        try {
          const siswaRes = await apiCall<any>(`/api/sekolah/${selectedSekolahId}/siswa`)
          const siswas = extractArray(siswaRes?.data || [])

          const alergiMap = new Map<string, { count: number; siswas: string[] }>()

          for (const siswa of siswas) {
            try {
              const alergiRes = await apiCall<any>(`/api/siswa/${siswa.id}/alergi`)
              const alergi = extractArray(alergiRes?.data || [])

              for (const a of alergi) {
                if (!alergiMap.has(a.namaAlergi)) {
                  alergiMap.set(a.namaAlergi, { count: 0, siswas: [] })
                }
                alergiMap.get(a.namaAlergi)!.count++
                alergiMap.get(a.namaAlergi)!.siswas.push(siswa.id)
              }
            } catch (err) {
              console.warn(`Gagal load alergi siswa ${siswa.id}:`, err)
            }
          }

          const alergiArray = Array.from(alergiMap.entries()).map(([nama, data]) => ({
            nama,
            jumlahSiswa: data.count,
            siswaMulaiDari: data.siswas,
          }))

          setAlergiList(alergiArray)
        } catch (err) {
          console.error("Gagal load alergi:", err)
          setAlergiList([])
        }

        // Load kalender akademik sekolah
        try {
          const holidayRes = await apiCall<any>(`/api/kalender-akademik?sekolahId=${selectedSekolahId}`)
          const rawHolidays = extractArray(holidayRes?.data || [])
          
          // DEBUG: Log raw data
          console.log("=== DEBUG HOLIDAYS ===")
          console.log("Raw API response:", holidayRes)
          console.log("Extracted array:", rawHolidays)
          console.log("First item:", rawHolidays[0])
          
          // Filter dan validate holidays
          const validatedHolidays = rawHolidays
            .filter((h: any) => {
              // Cek apakah ada field tanggal (bisa tanggal, tanggalMulai, atau tanggalSelesai)
              const dateField = h.tanggal || h.tanggalMulai || h.tanggalSelesai
              
              if (!dateField) {
                console.warn("Holiday without date field:", h)
                return false
              }
              
              // Cek apakah tanggal bisa di-parse
              const date = parseDate(dateField)
              if (!date) {
                console.warn(`Invalid date in holiday: ${dateField}`, h)
                return false
              }
              
              return true
            })
            .map((h: any) => {
              // Map ke format yang konsisten
              const dateField = h.tanggal || h.tanggalMulai || h.tanggalSelesai
              const descriptionField = h.keterangan || h.deskripsi || "Hari Libur"
              
              return {
                tanggal: dateField,
                keterangan: descriptionField,
              }
            })
          
          console.log("Validated holidays:", validatedHolidays)
          console.log("=== END DEBUG ===")
          
          setHolidays(validatedHolidays)
        } catch (err) {
          console.warn("Gagal load kalender akademik:", err)
          setHolidays([])
        }
      } finally {
        setLoadingAlergiAndHolidays(false)
      }
    }

    loadAlergiAndHolidays()
  }, [selectedSekolahId])

  useEffect(() => {
    if (!selectedPlanningId) {
      setMenuHarianList([])
      setLoadingMenuHarian(false)
      return
    }

    const loadMenuHarian = async () => {
      setLoadingMenuHarian(true)
      setMenuHarianList([])

      try {
        const res = await apiCall<any>(`/api/menu-planning/${selectedPlanningId}/menu-harian`)
        const menus = extractArray(res?.data || [])

        await new Promise(resolve => setTimeout(resolve, 500))

        setMenuHarianList(menus)
      } catch (err) {
        console.error("Gagal load menu harian:", err)
        setMenuHarianList([])
      } finally {
        setLoadingMenuHarian(false)
      }
    }

    loadMenuHarian()
  }, [selectedPlanningId])

  const validateIngredient = async (namaMenu: string) => {
    if (!selectedSekolahId || alergiList.length === 0) {
      setIngredientWarnings({ hasWarning: false, conflicts: [], message: "" })
      return
    }

    try {
      const menuLower = namaMenu.toLowerCase()
      const conflicts = alergiList
        .filter(a => menuLower.includes(a.nama.toLowerCase()))
        .map(a => a.nama)

      if (conflicts.length > 0) {
        setIngredientWarnings({
          hasWarning: true,
          conflicts,
          message: `Peringatan: Menu ini mengandung alergen (${conflicts.join(", ")}) yang dikonsumsi ${conflicts.map(c => alergiList.find(a => a.nama === c)?.jumlahSiswa).join(", ")} siswa`,
        })
      } else {
        setIngredientWarnings({ hasWarning: false, conflicts: [], message: "" })
      }
    } catch (err) {
      console.error("Gagal validasi ingredient:", err)
      setIngredientWarnings({ hasWarning: false, conflicts: [], message: "" })
    }
  }

  const currentPlanning = menuPlannings.find((p) => p.id === selectedPlanningId)
  const currentSekolah = sekolahList.find((s) => s.id === selectedSekolahId)

  const handleCreatePlanning = async () => {
    if (!formData.tanggalMulai || !formData.tanggalSelesai || !formData.sekolahId) {
      alert("Isi semua field")
      return
    }

    try {
      setIsSubmitting(true)
      await apiCall("/api/menu-planning", {
        method: "POST",
        body: JSON.stringify({
          mingguanKe: parseInt(formData.mingguanKe),
          tanggalMulai: formData.tanggalMulai,
          tanggalSelesai: formData.tanggalSelesai,
          sekolahId: formData.sekolahId,
        }),
      })
      alert("Menu planning berhasil dibuat")
      setShowCreateModal(false)
      setFormData({ mingguanKe: "1", tanggalMulai: "", tanggalSelesai: "", sekolahId: "" })
      window.location.reload()
    } catch (err) {
      alert("Gagal membuat menu planning")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePlanning = async (planningId: string) => {
    if (!confirm("Yakin ingin menghapus menu planning ini?")) {
      return
    }

    try {
      setIsSubmitting(true)
      await apiCall(`/api/menu-planning/${planningId}`, {
        method: "DELETE",
      })
      alert("Menu planning berhasil dihapus")
      window.location.reload()
    } catch (err) {
      alert("Gagal menghapus: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateMenuHarian = async () => {
    if (
      !menuFormData.tanggal ||
      !menuFormData.namaMenu ||
      !menuFormData.biayaPerTray ||
      !menuFormData.jamMulaiMasak ||
      !menuFormData.jamSelesaiMasak ||
      !menuFormData.kalori ||
      !menuFormData.protein ||
      !menuFormData.karbohidrat ||
      !menuFormData.lemak
    ) {
      alert("Isi semua field")
      return
    }

    if (ingredientWarnings.hasWarning) {
      const confirmed = confirm(
        `Peringatan: Menu ini mengandung alergen yang dihindari ${ingredientWarnings.conflicts.join(", ")}. Lanjutkan?`
      )
      if (!confirmed) return
    }

    try {
      setIsSubmitting(true)
      await apiCall(`/api/menu-planning/${selectedPlanningId}/menu-harian`, {
        method: "POST",
        body: JSON.stringify({
          tanggal: menuFormData.tanggal,
          namaMenu: menuFormData.namaMenu,
          biayaPerTray: parseFloat(menuFormData.biayaPerTray),
          jamMulaiMasak: menuFormData.jamMulaiMasak,
          jamSelesaiMasak: menuFormData.jamSelesaiMasak,
          kalori: parseFloat(menuFormData.kalori),
          protein: parseFloat(menuFormData.protein),
          karbohidrat: parseFloat(menuFormData.karbohidrat),
          lemak: parseFloat(menuFormData.lemak),
        }),
      })
      alert("Menu harian berhasil dibuat")
      setShowCreateMenuModal(false)
      setMenuFormData({
        tanggal: "",
        namaMenu: "",
        biayaPerTray: "",
        jamMulaiMasak: "",
        jamSelesaiMasak: "",
        kalori: "",
        protein: "",
        karbohidrat: "",
        lemak: "",
      })
      setIngredientWarnings({ hasWarning: false, conflicts: [], message: "" })
      const res = await apiCall<any>(`/api/menu-planning/${selectedPlanningId}/menu-harian`)
      const menus = extractArray(res?.data || [])
      setMenuHarianList(menus)
    } catch (err) {
      alert("Gagal membuat menu harian: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDayName = (date: string) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    const parsedDate = parseDate(date)
    return parsedDate ? days[parsedDate.getDay()] : "Hari?"
  }

  const avgKalori =
    menuHarianList.length > 0
      ? Math.round(menuHarianList.reduce((sum, m) => sum + m.kalori, 0) / menuHarianList.length)
      : 0

  const totalBiaya = menuHarianList.reduce((sum, m) => sum + m.biayaPerTray, 0)
  const avgProtein =
    menuHarianList.length > 0
      ? Math.round(menuHarianList.reduce((sum, m) => sum + m.protein, 0) / menuHarianList.length)
      : 0

  if (loading) {
    return (
      <DapurLayout currentPage="menu">
        <div className="flex items-center justify-center h-96">
          <Loader className="w-12 h-12 animate-spin text-[#D0B064]" />
        </div>
      </DapurLayout>
    )
  }

  if (error) {
    return (
      <DapurLayout currentPage="menu">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <AlertCircle className="w-6 h-6 text-red-600 inline mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </DapurLayout>
    )
  }

  return (
    <DapurLayout currentPage="menu">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1B263A]">Menu Planning</h1>
            <p className="text-gray-600 mt-1">Kelola menu mingguan dan daily menu</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-medium transition shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Menu Planning Baru
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <label className="text-sm font-semibold text-gray-700">Filter per Sekolah:</label>
          </div>
          <select
            value={selectedSekolahId}
            onChange={(e) => {
              setSelectedSekolahId(e.target.value)
              setSelectedPlanningId("")
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent font-medium"
          >
            <option value="">Semua Sekolah</option>
            {sekolahList.map((s: Sekolah) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSekolahId && (alergiList.length > 0 || holidays.length > 0 || loadingAlergiAndHolidays) && (
        <div className="space-y-4 mb-6">
          {loadingAlergiAndHolidays ? (
            <>
              <SkeletonAlergiCard />
              <SkeletonHolidayCard />
            </>
          ) : (
            <>
              {alergiList.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-blue-900 mb-2">Alergi Siswa di Sekolah Ini</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {alergiList.map((a, i) => (
                          <div key={i} className="bg-white rounded p-2 text-sm">
                            <span className="font-medium text-blue-900">{a.nama}</span>
                            <span className="text-blue-600 ml-2">({a.jumlahSiswa} siswa)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {holidays.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-purple-900 mb-2">Hari Libur Sekolah</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {holidays.map((h, i) => (
                          <div key={i} className="bg-white rounded p-2 text-sm">
                            <span className="font-medium text-purple-900">
                              {formatDateSafe(h.tanggal)}
                            </span>
                            <p className="text-xs text-purple-600 mt-1">{h.keterangan}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {filteredMenuPlannings.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-yellow-900 mb-2">Belum Ada Menu Planning</h3>
          <p className="text-yellow-700 mb-6">
            {selectedSekolahId ? "Sekolah ini belum memiliki menu planning" : "Buat menu planning baru untuk memulai"}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-medium transition"
          >
            Buat Menu Planning
          </button>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] rounded-lg p-6 text-white mb-6 shadow-lg">
            <div className="mb-6">
              <p className="text-white/70 text-sm mb-1 font-medium">Sekolah</p>
              <h2 className="text-2xl font-bold">{currentSekolah?.nama || "Pilih Sekolah"}</h2>
            </div>

            {currentPlanning && (
              <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-white/20">
                <div>
                  <p className="text-white/70 text-xs font-medium">Minggu Ke</p>
                  <p className="text-3xl font-bold mt-1">W{currentPlanning.mingguanKe}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium">Periode</p>
                  <p className="text-sm font-semibold mt-1">
                    {formatDateSafe(currentPlanning.tanggalMulai)} - {formatDateSafe(currentPlanning.tanggalSelesai)}
                  </p>
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium">Total Menu</p>
                  <p className="text-3xl font-bold mt-1">{menuHarianList.length}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {filteredMenuPlannings.map((planning) => (
                <div key={planning.id} className="relative group">
                  <button
                    onClick={() => setSelectedPlanningId(planning.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      planning.id === selectedPlanningId
                        ? "bg-[#D0B064] text-white shadow-lg"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    Minggu {planning.mingguanKe}
                  </button>
                  {planning.id === selectedPlanningId && (
                    <button
                      onClick={() => handleDeletePlanning(planning.id)}
                      disabled={isSubmitting}
                      title="Hapus menu planning"
                      className="absolute -top-10 right-0 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap shadow-lg transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {loadingMenuHarian ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Hari</p>
                  <p className="text-3xl font-bold text-[#1B263A] mt-2">{menuHarianList.length}</p>
                  <p className="text-xs text-gray-500 mt-1">hari</p>
                </div>
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Rata-rata Kalori</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{avgKalori}</p>
                  <p className="text-xs text-gray-500 mt-1">kcal/hari</p>
                </div>
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Biaya</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">Rp {(totalBiaya / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-gray-500 mt-1">per tray</p>
                </div>
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Rata-rata Protein</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{avgProtein}</p>
                  <p className="text-xs text-gray-500 mt-1">g/hari</p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1B263A]">Menu Harian</h3>
              <button
                onClick={() => setShowCreateMenuModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-medium transition shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Tambah Menu
              </button>
            </div>

            {loadingMenuHarian ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SkeletonMenuCard />
                <SkeletonMenuCard />
                <SkeletonMenuCard />
                <SkeletonMenuCard />
              </div>
            ) : menuHarianList.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium text-lg">Belum ada menu harian</p>
                <p className="text-gray-500 text-sm mt-1">Tambahkan menu untuk minggu ini</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {menuHarianList.map((menu) => (
                  <div key={menu.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {getDayName(menu.tanggal)} • {formatDateSafe(menu.tanggal)}
                        </p>
                        <h3 className="text-lg font-bold text-[#1B263A] mt-1">{menu.namaMenu}</h3>
                      </div>
                      <button
                        onClick={() => setSelectedMenu(menu)}
                        className="px-3 py-1 text-xs bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition font-medium whitespace-nowrap ml-2"
                      >
                        Detail
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4 pb-4 border-b border-gray-100">
                      <div className="bg-orange-50 rounded-lg p-3 text-center hover:bg-orange-100 transition">
                        <Flame className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-xs font-bold text-orange-600">{Math.round(menu.kalori)}</p>
                        <p className="text-xs text-orange-600 font-medium">kcal</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center hover:bg-blue-100 transition">
                        <Drumstick className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs font-bold text-blue-600">{menu.protein}g</p>
                        <p className="text-xs text-blue-600 font-medium">Protein</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 text-center hover:bg-yellow-100 transition">
                        <Apple className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                        <p className="text-xs font-bold text-yellow-600">{menu.lemak}g</p>
                        <p className="text-xs text-yellow-600 font-medium">Lemak</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center hover:bg-green-100 transition">
                        <Wheat className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xs font-bold text-green-600">{menu.karbohidrat}g</p>
                        <p className="text-xs text-green-600 font-medium">Karbo</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-green-600">Rp {menu.biayaPerTray.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {menu.jamMulaiMasak} - {menu.jamSelesaiMasak}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showCreateModal && (
        <ModalCreatePlanning
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          formData={formData}
          setFormData={setFormData}
          sekolahList={sekolahList}
          onSubmit={handleCreatePlanning}
          isSubmitting={isSubmitting}
        />
      )}

      {showCreateMenuModal && (
        <ModalCreateMenuHarian
          isOpen={showCreateMenuModal}
          onClose={() => setShowCreateMenuModal(false)}
          formData={menuFormData}
          setFormData={setMenuFormData}
          onSubmit={handleCreateMenuHarian}
          isSubmitting={isSubmitting}
          currentPlanning={currentPlanning}
          alergiList={alergiList}
          holidays={holidays}
          ingredientWarnings={ingredientWarnings}
          validateIngredient={validateIngredient}
        />
      )}

      {selectedMenu && (
        <ModalMenuDetail menu={selectedMenu} onClose={() => setSelectedMenu(null)} />
      )}
    </DapurLayout>
  )
}

function ModalCreatePlanning({
  isOpen,
  onClose,
  formData,
  setFormData,
  sekolahList,
  onSubmit,
  isSubmitting,
}: any) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
        <div className="bg-[#1B263A] text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h3 className="font-bold text-lg">Buat Menu Planning Baru</h3>
          <button onClick={onClose} className="hover:opacity-80 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Minggu Ke</label>
            <input
              type="number"
              min="1"
              value={formData.mingguanKe}
              onChange={(e) => setFormData({ ...formData, mingguanKe: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Tanggal Mulai</label>
            <input
              type="date"
              value={formData.tanggalMulai}
              onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Tanggal Selesai</label>
            <input
              type="date"
              value={formData.tanggalSelesai}
              onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Sekolah</label>
            <select
              value={formData.sekolahId}
              onChange={(e) => setFormData({ ...formData, sekolahId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            >
              <option value="">Pilih Sekolah</option>
              {sekolahList.map((s: Sekolah) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
            >
              Batal
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] disabled:opacity-50 font-medium transition"
            >
              {isSubmitting ? "Memproses..." : "Buat"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-12"></div>
    </div>
  )
}

function SkeletonMenuCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16 ml-2"></div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-100 rounded-lg p-3 h-16"></div>
        <div className="bg-gray-100 rounded-lg p-3 h-16"></div>
        <div className="bg-gray-100 rounded-lg p-3 h-16"></div>
        <div className="bg-gray-100 rounded-lg p-3 h-16"></div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-full"></div>
    </div>
  )
}

function SkeletonAlergiCard() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-300 rounded-full mt-1 flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-blue-200 rounded w-40 mb-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded p-2 h-8"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonHolidayCard() {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-purple-300 rounded-full mt-1 flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-purple-200 rounded w-40 mb-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded p-3 h-12"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalMenuDetail({ menu, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
        <div className="bg-[#1B263A] text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h3 className="font-bold text-lg">{menu.namaMenu}</h3>
          <button onClick={onClose} className="hover:opacity-80 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-100">
              <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="font-bold text-orange-600 text-lg">{Math.round(menu.kalori)}</p>
              <p className="text-xs text-orange-600 font-medium mt-1">Kalori</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
              <Drumstick className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-bold text-blue-600 text-lg">{menu.protein}g</p>
              <p className="text-xs text-blue-600 font-medium mt-1">Protein</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-100">
              <Apple className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="font-bold text-yellow-600 text-lg">{menu.lemak}g</p>
              <p className="text-xs text-yellow-600 font-medium mt-1">Lemak</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
              <Wheat className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="font-bold text-green-600 text-lg">{menu.karbohidrat}g</p>
              <p className="text-xs text-green-600 font-medium mt-1">Karbohidrat</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Biaya per Tray:</span>
              <span className="font-bold text-[#D0B064]">Rp {menu.biayaPerTray.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Waktu Masak:</span>
              <span className="font-semibold text-gray-700">{menu.jamMulaiMasak} - {menu.jamSelesaiMasak}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Total Waktu:</span>
              <span className="font-semibold text-gray-700">
                {(() => {
                  const start = menu.jamMulaiMasak.split(":")
                  const end = menu.jamSelesaiMasak.split(":")
                  const duration = (parseInt(end[0]) - parseInt(start[0])) * 60 + (parseInt(end[1]) - parseInt(start[1]))
                  return `${Math.floor(duration / 60)}h ${duration % 60}m`
                })()}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalCreateMenuHarian({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  currentPlanning,
  alergiList,
  holidays,
  ingredientWarnings,
  validateIngredient,
}: any) {
  if (!isOpen) return null

  const minDate = currentPlanning?.tanggalMulai || ""
  const maxDate = currentPlanning?.tanggalSelesai || ""

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isDateInRange = (dateStr: string) => {
    if (!minDate || !maxDate) return false
    const date = new Date(dateStr)
    const min = new Date(minDate)
    const max = new Date(maxDate)
    return date >= min && date <= max
  }

  const isHoliday = (dateStr: string) => {
    return holidays && holidays.some((h: Holiday) => {
      const holidayDate = new Date(h.tanggal).toISOString().split('T')[0]
      return holidayDate === dateStr
    })
  }

  const getHolidayInfo = (dateStr: string) => {
    return holidays && holidays.find((h: Holiday) => {
      const holidayDate = new Date(h.tanggal).toISOString().split('T')[0]
      return holidayDate === dateStr
    })
  }

  const currentMonth = formData.tanggal ? new Date(formData.tanggal) : new Date(minDate)
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = []

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const monthYear = currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#1B263A] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-lg">Tambah Menu Harian</h3>
          <button onClick={onClose} className="hover:opacity-80 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 border border-blue-200">
            <p className="font-bold text-blue-900">📍 Untuk: {currentPlanning?.sekolah?.nama}</p>
            <p className="text-xs mt-2 text-blue-600">
              {currentPlanning && formatDateSafe(currentPlanning.tanggalMulai)} s/d {currentPlanning && formatDateSafe(currentPlanning.tanggalSelesai)}
            </p>
          </div>

          {alergiList.length > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg text-sm border border-amber-200">
              <p className="font-bold text-amber-900 mb-2">⚠️ Alergi di Sekolah Ini:</p>
              <div className="flex flex-wrap gap-2">
                {alergiList.map((a: AlergiItem, i: number) => (
                  <span key={i} className="bg-white px-2 py-1 rounded text-xs text-amber-800 border border-amber-300">
                    {a.nama}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700">Pilih Tanggal *</label>
            
            {/* Mini Calendar */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
              <p className="text-center font-bold text-gray-700 mb-4 text-sm">{monthYear}</p>
              
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="aspect-square"></div>
                  }

                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  const inRange = isDateInRange(dateStr)
                  const holiday = isHoliday(dateStr)
                  const isSelected = formData.tanggal === dateStr
                  const holidayInfo = getHolidayInfo(dateStr)

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => {
                        if (inRange && !holiday) {
                          setFormData({ ...formData, tanggal: dateStr })
                        }
                      }}
                      disabled={!inRange || holiday}
                      title={holiday ? `Libur: ${holidayInfo?.keterangan}` : ""}
                      className={`aspect-square rounded-lg text-xs font-medium transition flex items-center justify-center ${
                        !inRange
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : holiday
                          ? "bg-red-100 text-red-700 cursor-not-allowed border border-red-300"
                          : isSelected
                          ? "bg-[#D0B064] text-white border-2 border-[#D0B064]"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#D0B064] rounded"></div>
                  <span className="text-gray-600">Dipilih</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-gray-600">Hari Libur</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span className="text-gray-600">Di luar range</span>
                </div>
              </div>
            </div>

            {formData.tanggal && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                <p className="font-semibold">✓ Tanggal dipilih: {formatDateSafe(formData.tanggal)}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Nama Menu *</label>
            <input
              type="text"
              value={formData.namaMenu}
              onChange={(e) => {
                setFormData({ ...formData, namaMenu: e.target.value })
                validateIngredient(e.target.value)
              }}
              onBlur={() => validateIngredient(formData.namaMenu)}
              placeholder="Contoh: Nasi Goreng Ikan"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            />
            {ingredientWarnings.hasWarning && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{ingredientWarnings.message}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Jam Mulai *</label>
              <input
                type="time"
                value={formData.jamMulaiMasak}
                onChange={(e) => setFormData({ ...formData, jamMulaiMasak: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Jam Selesai *</label>
              <input
                type="time"
                value={formData.jamSelesaiMasak}
                onChange={(e) => setFormData({ ...formData, jamSelesaiMasak: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Biaya per Tray (Rp) *</label>
            <input
              type="number"
              value={formData.biayaPerTray}
              onChange={(e) => setFormData({ ...formData, biayaPerTray: e.target.value })}
              placeholder="50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">📊 Informasi Gizi</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-600">Kalori (kcal) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.kalori}
                  onChange={(e) => setFormData({ ...formData, kalori: e.target.value })}
                  placeholder="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-600">Protein (g) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  placeholder="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-600">Lemak (g) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.lemak}
                  onChange={(e) => setFormData({ ...formData, lemak: e.target.value })}
                  placeholder="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-600">Karbohidrat (g) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.karbohidrat}
                  onChange={(e) => setFormData({ ...formData, karbohidrat: e.target.value })}
                  placeholder="45"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium transition"
            >
              Batal
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] disabled:opacity-50 font-medium transition"
            >
              {isSubmitting ? "Memproses..." : "Tambah"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}