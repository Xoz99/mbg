"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { apiCache, generateCacheKey } from "@/lib/utils/cache"
import DapurLayout from "@/components/layout/DapurLayout"
import { useMenuCache, type MenuData } from "@/lib/hooks/useMenuCache"
import { useMenuPlanningRealtime } from "@/lib/hooks/useMenuPlanningRealtime"
import { useSekolahSiswaCache } from "@/lib/hooks/useSekolahSiswaCache"
import {
  Calendar,
  ChefHat,
  Plus,
  X,
  AlertCircle,
  Trash2,
  Filter,
  AlertTriangle,
  Users,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

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
  targetTray: number
  jamSajikan: string
  karbohidrat: number
  isBooked?: boolean
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
  totalSiswa?: number
}

interface Kelas {
  id: string
  nama: string
  tingkat: number
  sekolahId: string
}

interface AlergiItem {
  nama: string
  jumlahSiswa: number
  uniqueSiswaAlergi?: number
  totalSiswaAlergi?: number
}

interface Holiday {
  tanggal?: string
  keterangan?: string
}

interface AbsensiPerKelas {
  id: string
  tanggal: string
  jumlahHadir: number
  kelasId?: string
  kelas?: { id: string; nama: string }
}

interface AbsensiAggregated {
  tanggal: string
  jumlahHadirTotal: number
  jumlahSiswaTotal: number
  breakdown: {
    [kelasId: string]: {
      kelasNama: string
      jumlahHadir: number
      jumlahSiswa: number
    }
  }
}

async function getAuthToken(): Promise<string> {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("authToken") || ""
}

// Helper function untuk normalize tanggal dari backend
// ✅ PERBAIKAN: Handle timezone conversion untuk UTC datetime
// Backend menyimpan dalam UTC, tapi kita perlu display dalam local timezone
function normalizeDateString(dateString: string | null | undefined): string | null {
  if (!dateString) return null

  dateString = dateString.trim()

  // Jika format ISO (YYYY-MM-DDTHH:MM:SS.000Z), convert ke local timezone
  if (dateString.includes('T')) {
    try {
      // Parse sebagai UTC
      const utcDate = new Date(dateString)
      // Buat date string dari UTC datetime yang di-adjust dengan local timezone
      // Jika UTC+7, maka tambah 7 jam ke UTC date untuk mendapatkan local date
      const localDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000)) // +7 jam untuk Indonesia
      const year = localDate.getUTCFullYear()
      const month = String(localDate.getUTCMonth() + 1).padStart(2, '0')
      const day = String(localDate.getUTCDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (e) {
      console.warn(`[normalizeDateString] Failed to parse ISO date: ${dateString}`)
      return dateString.split('T')[0]
    }
  }

  // Jika format YYYY-MM-DD, return sebagaimana adanya
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString
  }

  console.warn(`[normalizeDateString] Unexpected format: ${dateString}`)
  return dateString
}

// Helper function untuk format periode tanggal (e.g., "1 Jan - 7 Jan 2024")
function formatPeriode(tanggalMulai: string, tanggalSelesai: string): string {
  try {
    const start = new Date(tanggalMulai)
    const end = new Date(tanggalSelesai)

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const startFormatted = start.toLocaleDateString('id-ID', options)
    const endFormatted = end.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })

    return `${startFormatted} - ${endFormatted}`
  } catch (e) {
    return 'Periode tidak valid'
  }
}

// Helper function untuk check apakah week sudah completed (tanggalSelesai sudah terlewat)
function isWeekCompleted(tanggalSelesai: string): boolean {
  try {
    const endDate = new Date(tanggalSelesai)
    const today = new Date()
    // Set waktu ke midnight untuk perbandingan yang akurat
    today.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    return endDate < today
  } catch (e) {
    return false
  }
}

// Helper function untuk menentukan waktu makan berdasarkan jam
// Helper function untuk menentukan waktu makan berdasarkan jam
function getWaktuMakan(jamSajikanInput: any): string {
  const jamSajikan = typeof jamSajikanInput === 'string' ? jamSajikanInput : "";
  if (!jamSajikan || jamSajikan.trim() === "") return "Tidak ada jadwal"

  try {
    // Parse jam dari format HH:MM
    const timeParts = jamSajikan.split(':');
    if (timeParts.length < 1) return "Format tidak valid";

    const hours = parseInt(timeParts[0], 10);
    if (isNaN(hours)) return "Tidak valid"

    if (hours >= 5 && hours < 11) {
      return "Pagi"
    } else if (hours >= 11 && hours < 15) {
      return "Siang"
    } else if (hours >= 15 && hours < 19) {
      return "Sore"
    } else {
      return "Malam"
    }
  } catch (e) {
    console.error(`[DEBUG] Error parsing jamSajikan: ${jamSajikan}`, e);
    return "Tidak valid"
  }
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}, cacheKey?: string): Promise<T> {
  try {
    const key = cacheKey || generateCacheKey(endpoint)

    // Check cache first (only for GET requests)
    if (!options.method || options.method === "GET") {
      const cached = apiCache.get<T>(key)
      if (cached) return cached
    }

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

    const data = await response.json()

    // Cache GET requests for 10 minutes
    if (!options.method || options.method === "GET") {
      apiCache.set(key, data, 10 * 60 * 1000)
    }

    return data
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error)
    throw error
  }
}

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data
  // Handle nested data structure: data.data.data
  if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data
  // Handle data.data
  if (data?.data && Array.isArray(data.data)) return data.data
  if (typeof data === "object") {
    const arr = Object.values(data).find((v) => Array.isArray(v))
    if (arr) return arr as any[]
  }
  return []
}

function parseDate(dateString: string): Date | null {
  if (!dateString) return null
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date format: ${dateString}`)
    return null
  }
  return date
}

function formatDateSafe(dateString: string): string {
  const date = parseDate(dateString)
  if (!date) return "Tanggal tidak valid"
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateShort(dateString: string): string {
  const date = parseDate(dateString)
  if (!date) return "Tanggal tidak valid"
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

// Helper function to parse date string consistently in UTC
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

// ✅ OPTIMIZED: Parallel loading + streaming data
async function aggregateAbsensiForSekolah(sekolahId: string): Promise<AbsensiAggregated[]> {
  try {
    console.log(`🔄 Aggregating absensi untuk sekolah: ${sekolahId}`)

    // Get kelas list
    const kelasRes = await apiCall<any>(`/api/sekolah/${sekolahId}/kelas`)
    const kelasList = extractArray(kelasRes?.data || [])
    console.log(`📚 Found ${kelasList.length} kelas`)

    if (kelasList.length === 0) return []

    // ✅ PARALLEL: Load semua data kelas sekaligus (tidak sequential)
    const absensiPromises = kelasList.map((kelas) =>
      Promise.all([
        apiCall<any>(`/api/kelas/${kelas.id}/absensi`),
        apiCall<any>(`/api/kelas/${kelas.id}/siswa`),
      ]).then(([absensiRes, siswaRes]) => {
        const absensiList = extractArray(absensiRes?.data || [])
        const siswaList = extractArray(siswaRes?.data || [])
        const totalSiswaKelas = siswaList.length || absensiList.length || 0
        return { kelas, absensiList, totalSiswaKelas }
      })
        .catch((err) => {
          console.warn(`⚠️ Gagal load absensi untuk kelas ${kelas.nama}:`, err)
          return null
        })
    )

    const allKelasData = await Promise.all(absensiPromises)
    const validData = allKelasData.filter((d) => d !== null)

    // Aggregate ke map
    const allAbsensiByDate: { [dateKey: string]: AbsensiAggregated } = {}

    for (const { kelas, absensiList, totalSiswaKelas } of validData) {
      for (const absensi of absensiList) {
        const dateKey = normalizeDateString(absensi.tanggal)
        if (!dateKey) continue

        if (!allAbsensiByDate[dateKey]) {
          allAbsensiByDate[dateKey] = {
            tanggal: absensi.tanggal,
            jumlahHadirTotal: 0,
            jumlahSiswaTotal: 0,
            breakdown: {},
          }
        }

        allAbsensiByDate[dateKey].jumlahHadirTotal += absensi.jumlahHadir
        allAbsensiByDate[dateKey].jumlahSiswaTotal += totalSiswaKelas
        allAbsensiByDate[dateKey].breakdown[kelas.id] = {
          kelasNama: kelas.nama,
          jumlahHadir: absensi.jumlahHadir,
          jumlahSiswa: totalSiswaKelas,
        }
      }
    }

    const aggregated = Object.values(allAbsensiByDate)
    return aggregated
  } catch (error) {
    console.error("❌ Error aggregating absensi:", error)
    return []
  }
}

function SkeletonMenuCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm h-48 animate-pulse-fast">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-full mt-6"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}

function SkeletonAlergiCard() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-32 animate-pulse-fast">
      <div className="h-5 bg-blue-200 rounded w-32 mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-blue-200 rounded w-full"></div>
        <div className="h-3 bg-blue-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}

// Modal components remain the same (not shown for brevity)
function ModalCreatePlanning({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  sekolahList,
}: any) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
        <div className="bg-[#1B263A] text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">Buat Menu Planning</h3>
          <button onClick={onClose} className="hover:opacity-80 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Minggu Ke *</label>
            <input
              type="number"
              min="1"
              value={formData.mingguanKe}
              onChange={(e) => setFormData({ ...formData, mingguanKe: e.target.value })}
              placeholder="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Sekolah *</label>
            <select
              value={formData.sekolahId}
              onChange={(e) => setFormData({ ...formData, sekolahId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            >
              <option value="">-- Pilih Sekolah --</option>
              {sekolahList.map((s: Sekolah) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Tanggal Mulai *</label>
              <input
                type="date"
                value={formData.tanggalMulai}
                onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Tanggal Selesai *</label>
              <input
                type="date"
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
              />
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
              {isSubmitting ? "Memproses..." : "Buat"}
            </button>
          </div>
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
  displayMonth,
  setDisplayMonth,
  menuHarianList,
  absensiAggregatedMap,
}: any) {
  if (!isOpen) return null

  // Use hook untuk cache data siswa
  const { totalSiswa, loading: loadingTotalSiswa } = useSekolahSiswaCache(
    currentPlanning?.sekolahId || null
  )

  const minDate = normalizeDateString(currentPlanning?.tanggalMulai) || ""
  const maxDate = normalizeDateString(currentPlanning?.tanggalSelesai) || ""

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isDateInRange = (dateStr: string) => {
    if (!minDate || !maxDate) return false
    const date = parseDateAsUTC(dateStr)
    const min = parseDateAsUTC(minDate)
    const max = parseDateAsUTC(maxDate)
    if (!date || !min || !max) return false
    return date >= min && date <= max
  }

  const isHoliday = (dateStr: string) => {
    if (!holidays || holidays.length === 0) return false
    return holidays.some((h: Holiday) => {
      const holidayDate = normalizeDateString(h.tanggal)
      return holidayDate === dateStr
    })
  }

  const getHolidayInfo = (dateStr: string) => {
    if (!holidays || holidays.length === 0) return null
    return holidays.find((h: Holiday) => {
      const holidayDate = normalizeDateString(h.tanggal)
      return holidayDate === dateStr
    })
  }

  const getAbsensiForDate = (dateStr: string) => {
    return absensiAggregatedMap[dateStr]
  }

  const currentMonth = displayMonth
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days: (number | null)[] = []

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const monthYear = currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  const goToPreviousMonth = () => {
    const prev = new Date(displayMonth)
    prev.setMonth(prev.getMonth() - 1)
    const minDateObj = parseDateAsUTC(minDate)
    if (!minDateObj) return
    const prevYearMonth = prev.getFullYear() * 12 + prev.getMonth()
    const minYearMonth = minDateObj.getUTCFullYear() * 12 + minDateObj.getUTCMonth()
    if (prevYearMonth >= minYearMonth) {
      setDisplayMonth(prev)
    }
  }

  const goToNextMonth = () => {
    const next = new Date(displayMonth)
    next.setMonth(next.getMonth() + 1)
    const maxDateObj = parseDateAsUTC(maxDate)
    if (!maxDateObj) return
    const nextYearMonth = next.getFullYear() * 12 + next.getMonth()
    const maxYearMonth = maxDateObj.getUTCFullYear() * 12 + maxDateObj.getUTCMonth()
    if (nextYearMonth <= maxYearMonth) {
      setDisplayMonth(next)
    }
  }

  const canGoPrevious = () => {
    try {
      const prev = new Date(displayMonth)
      prev.setMonth(prev.getMonth() - 1)
      const minDateObj = parseDateAsUTC(minDate)
      if (!minDateObj) return false
      const prevYearMonth = prev.getFullYear() * 12 + prev.getMonth()
      const minYearMonth = minDateObj.getUTCFullYear() * 12 + minDateObj.getUTCMonth()
      return prevYearMonth >= minYearMonth
    } catch (e) {
      return false
    }
  }

  const canGoNext = () => {
    try {
      const next = new Date(displayMonth)
      next.setMonth(next.getMonth() + 1)
      const maxDateObj = parseDateAsUTC(maxDate)
      if (!maxDateObj) return false
      const nextYearMonth = next.getFullYear() * 12 + next.getMonth()
      const maxYearMonth = maxDateObj.getUTCFullYear() * 12 + maxDateObj.getUTCMonth()
      return nextYearMonth <= maxYearMonth
    } catch (e) {
      return false
    }
  }

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
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-bold text-blue-900">Untuk: {currentPlanning?.sekolah?.nama}</p>
                <p className="text-xs mt-2 text-blue-600">
                  {currentPlanning && formatDateSafe(currentPlanning.tanggalMulai)} s/d {currentPlanning && formatDateSafe(currentPlanning.tanggalSelesai)}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-200">
                <Users className="w-4 h-4 text-blue-600" />
                <div className="text-center">
                  <p className="text-xs text-gray-600">Total Siswa</p>
                  <p className="font-bold text-lg text-blue-900">
                    {loadingTotalSiswa ? "..." : totalSiswa}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {alergiList.length > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg text-sm border border-amber-200">
              <p className="font-bold text-amber-900 mb-2">
                Alergi di Sekolah Ini:
                {alergiList[0]?.totalSiswaAlergi !== undefined && (
                  <span className="ml-2 text-amber-700">({alergiList[0].totalSiswaAlergi} siswa alergi)</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {alergiList.map((a: AlergiItem, i: number) => (
                  <span key={i} className="bg-white px-2 py-1 rounded text-xs text-amber-800 border border-amber-300">
                    {a.nama} • {a.jumlahSiswa} siswa
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700">Pilih Tanggal *</label>

            <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPreviousMonth}
                  disabled={!canGoPrevious()}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${canGoPrevious()
                    ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                >
                  ← Prev
                </button>

                <p className="text-center font-bold text-gray-700 text-sm flex-1 px-4">
                  {monthYear}
                </p>

                <button
                  onClick={goToNextMonth}
                  disabled={!canGoNext()}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${canGoNext()
                    ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                >
                  Next →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="aspect-square"></div>
                  }

                  // Format tanggal dengan UTC consistent - JANGAN pakai local timezone
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  const inRange = isDateInRange(dateStr)
                  const holiday = isHoliday(dateStr)
                  const isSelected = formData.tanggal === dateStr
                  const holidayInfo = getHolidayInfo(dateStr)
                  // Compare dengan format ISO yang dipakai backend
                  // dateStr format: YYYY-MM-DD (dari kalender)
                  // Backend return: YYYY-MM-DDTHH:MM:SS.000Z
                  // Match: ambil bagian YYYY-MM-DD dari backend data
                  const isBooked = menuHarianList.some((menu: MenuHarian) => {
                    if (!menu.tanggal) return false
                    // ✅ PERBAIKAN: Gunakan normalizeDateString untuk handle timezone conversion
                    // Contoh: Backend return "2025-11-13T17:00:00.000Z" (UTC)
                    // Tapi itu adalah "2025-11-14" local time (UTC+7)
                    // normalizeDateString akan convert dengan benar
                    const normalizedBackendDate = normalizeDateString(menu.tanggal)
                    const isMatch = normalizedBackendDate === dateStr

                    if (isMatch) {
                      console.log(`[DEBUG MATCH] dateStr: ${dateStr}, normalizedBackendDate: ${normalizedBackendDate}, menu.tanggal raw: ${menu.tanggal}`)
                    }
                    return isMatch
                  })
                  const absensiForDate = getAbsensiForDate(dateStr)

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => {
                        if (inRange && !holiday) {
                          console.log("[DEBUG CLICK] Tanggal diklik:", dateStr)
                          console.log("[DEBUG CLICK] inRange:", inRange, "holiday:", holiday)
                          setFormData({ ...formData, tanggal: dateStr })
                        }
                      }}
                      disabled={!inRange || holiday}
                      title={holiday ? `Libur: ${holidayInfo?.keterangan}` : isBooked ? "Menu sudah di-booking" : absensiForDate ? `Hadir: ${absensiForDate.jumlahHadirTotal}/${absensiForDate.jumlahSiswaTotal}` : ""}
                      className={`aspect-square rounded-lg text-xs font-medium transition flex items-center justify-center relative ${!inRange
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : holiday
                          ? "bg-red-100 text-red-700 cursor-not-allowed border border-red-300"
                          : isSelected
                            ? "bg-[#D0B064] text-white border-2 border-[#D0B064]"
                            : isBooked
                              ? "bg-green-100 text-green-700 border-2 border-green-400 cursor-pointer hover:bg-green-200"
                              : absensiForDate
                                ? "bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 cursor-pointer"
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 cursor-pointer"
                        }`}
                    >
                      {day}
                      {absensiForDate && !isSelected && (
                        <span className="absolute bottom-0.5 right-0.5 text-xs bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                          {absensiForDate.jumlahHadirTotal}
                        </span>
                      )}
                      {isBooked && !isSelected && (
                        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#D0B064] rounded"></div>
                  <span className="text-gray-600">Dipilih</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-gray-600">Absensi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
                  <span className="text-gray-600">Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-gray-600">Hari Libur</span>
                </div>
              </div>
            </div>

            {formData.tanggal && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                <p className="font-semibold">✓ Tanggal dipilih: {formatDateSafe(formData.tanggal)}</p>
                {getAbsensiForDate(formData.tanggal) && (
                  <div className="mt-2 space-y-1">
                    <p className="text-green-600 font-semibold">
                      👥 Total hadir: {getAbsensiForDate(formData.tanggal).jumlahHadirTotal}/{getAbsensiForDate(formData.tanggal).jumlahSiswaTotal}
                    </p>
                    {Object.entries(getAbsensiForDate(formData.tanggal).breakdown).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <p className="font-semibold text-xs mb-1">Breakdown per kelas:</p>
                        {Object.entries(getAbsensiForDate(formData.tanggal).breakdown).map(([kelasId, data]: [string, any]) => (
                          <p key={kelasId} className="text-xs text-green-600">
                            • {data.kelasNama}: {data.jumlahHadir}/{data.jumlahSiswa}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ✅ AUTO-SET TARGET TRAY FROM ABSENSI */}
            {formData.tanggal && getAbsensiForDate(formData.tanggal) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                <p className="text-blue-700 font-semibold mb-2">Absensi Hari Ini:</p>
                <p className="text-blue-600">{getAbsensiForDate(formData.tanggal).jumlahHadirTotal} siswa hadir</p>
                <button
                  type="button"
                  onClick={() => {
                    const absensi = getAbsensiForDate(formData.tanggal)
                    if (absensi) {
                      setFormData({
                        ...formData,
                        targetTray: absensi.jumlahHadirTotal.toString()
                      })
                    }
                  }}
                  className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                >
                  Set ke {getAbsensiForDate(formData.tanggal).jumlahHadirTotal} porsi
                </button>
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
            <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Informasi Gizi</p>

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
                <label className="block text-xs font-semibold mb-2 text-gray-600">Target Tray (biji) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.targetTray}
                  onChange={(e) => setFormData({ ...formData, targetTray: e.target.value })}
                  placeholder="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Baik di sajikan Jam *</label>
                <input
                  type="time"
                  value={formData.jamSajikan}
                  onChange={(e) => setFormData({ ...formData, jamSajikan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
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

export default function MenuPlanningPage() {
  // ✅ Use custom hook untuk load menuPlannings dan sekolahList
  const [sekolahList, setSekolahList] = useState<Sekolah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleCacheUpdate = useCallback((data: MenuData) => {
    console.log("[MENU PAGE] handleCacheUpdate called with:", data)
    console.log("[MENU PAGE] sekolahList:", data.sekolahList.length, "items")
    setSekolahList(data.sekolahList)
  }, [])

  const { loading: cacheLoading, error: cacheError, loadData: loadMenuData, refreshData: refreshMenuCache, updateCache } = useMenuCache(handleCacheUpdate)

  // 🔥 REALTIME HOOK - untuk add/delete dengan instant update + cache sync
  // menuPlannings dari hook ini langsung sync dengan context saat add/delete
  const { menuPlannings, addMenuPlanning, deleteMenuPlanning } = useMenuPlanningRealtime()

  // Local states
  const [menuHarianList, setMenuHarianList] = useState<MenuHarian[]>([])
  const [alergiList, setAlergiList] = useState<AlergiItem[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [absensiAggregated, setAbsensiAggregated] = useState<AbsensiAggregated[]>([])
  const [loadingMenuHarian, setLoadingMenuHarian] = useState(false)
  const [loadingAbersensiAndOthers, setLoadingAbersensiAndOthers] = useState(false)

  const [selectedPlanningId, setSelectedPlanningId] = useState<string>("")
  const [selectedSekolahId, setSelectedSekolahId] = useState<string>("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateMenuModal, setShowCreateMenuModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null) // 🔥 Track which planning is being deleted
  const [isDeletingMenu, setIsDeletingMenu] = useState<string | null>(null) // 🔥 Track which menu harian is being deleted

  const [displayMonth, setDisplayMonth] = useState<Date>(new Date())
  const [showCompletedWeeks, setShowCompletedWeeks] = useState(false)

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
    targetTray: "",
    jamSajikan: "",
    lemak: "",
  })

  const [ingredientWarnings, setIngredientWarnings] = useState<{
    hasWarning: boolean
    conflicts: string[]
    message: string
  }>({ hasWarning: false, conflicts: [], message: "" })

  // Pagination for alergi dan hari libur
  const [alergiPage, setAlergiPage] = useState(1)
  const [holidayPage, setHolidayPage] = useState(1)
  const ITEMS_PER_PAGE = 3

  // Map aggregated absensi data by date
  const absensiAggregatedMap: { [key: string]: AbsensiAggregated } = {}
  absensiAggregated.forEach(a => {
    const dateKey = normalizeDateString(a.tanggal)
    if (dateKey) {
      absensiAggregatedMap[dateKey] = a
    }
  })

  // ✅ Calculate paginated alergi
  const paginatedAlergi = useMemo(() => {
    const start = (alergiPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return alergiList.slice(start, end)
  }, [alergiList, alergiPage])

  const totalAlergiPages = Math.ceil(alergiList.length / ITEMS_PER_PAGE)

  // ✅ Calculate paginated hari libur
  const paginatedHolidays = useMemo(() => {
    const start = (holidayPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return holidays.slice(start, end)
  }, [holidays, holidayPage])

  const totalHolidayPages = Math.ceil(holidays.length / ITEMS_PER_PAGE)

  // ✅ INITIAL LOAD: Use custom hook untuk load menuPlannings dan sekolahList
  useEffect(() => {
    loadMenuData()
  }, [loadMenuData])

  // ✅ Sync loading dan error state dari both hooks
  useEffect(() => {
    // Show loading hanya jika cache masih loading (realtime hook loading itu normal)
    setLoading(cacheLoading)
    if (cacheError) setError(cacheError)
  }, [cacheLoading, cacheError])

  // ✅ Set default sekolah ketika sekolahList loaded
  useEffect(() => {
    if (sekolahList.length > 0 && !selectedSekolahId) {
      setSelectedSekolahId(sekolahList[0].id)
    }
  }, [sekolahList, selectedSekolahId])

  const filteredMenuPlannings = selectedSekolahId
    ? menuPlannings
      .filter((p) => p.sekolahId === selectedSekolahId)
      .sort((a, b) => a.mingguanKe - b.mingguanKe)
    : menuPlannings.sort((a, b) => a.mingguanKe - b.mingguanKe)

  // ✅ Auto-select first planning when sekolah changes and planning not selected
  useEffect(() => {
    console.log("[DEBUG] Planning Selection Effect - selectedSekolahId:", selectedSekolahId, "menuPlannings.length:", menuPlannings.length, "selectedPlanningId:", selectedPlanningId, "cacheLoading:", cacheLoading)

    // Don't clear state while cache is still loading
    if (cacheLoading) {
      console.log("[DEBUG] Cache still loading, skipping planning selection")
      return
    }

    // If sekolah list is empty after loading, clear selections
    if (sekolahList.length === 0) {
      console.log("[DEBUG] No sekolah in list after loading, clearing planning")
      setSelectedPlanningId("")
      setMenuHarianList([])
      setAlergiList([])
      return
    }

    // If no sekolah is selected but we have sekolah list, don't clear - let effect below handle it
    if (!selectedSekolahId) {
      console.log("[DEBUG] No sekolah selected yet, waiting for sekolah selection")
      return
    }

    // Filter plannings for selected sekolah
    const filtered = menuPlannings.filter((p) => p.sekolahId === selectedSekolahId)

    if (filtered.length === 0) {
      console.log("[DEBUG] No filtered plannings for sekolah:", selectedSekolahId)
      setSelectedPlanningId("")
      setMenuHarianList([])
      setAlergiList([])
    } else if (!selectedPlanningId) {
      // Auto-select first planning when sekolah is selected but no planning is selected
      console.log("[DEBUG] Auto-selecting first planning:", filtered[0].id)
      setSelectedPlanningId(filtered[0].id)
    }
  }, [selectedSekolahId, menuPlannings, selectedPlanningId, cacheLoading, sekolahList.length])

  // ✅ OPTIMIZED: Parallel load alergi, holidays, absensi
  useEffect(() => {
    if (!selectedSekolahId) {
      setAlergiList([])
      setHolidays([])
      setAbsensiAggregated([])
      return
    }

    const loadAbersensiAndOthers = async () => {
      try {
        setLoadingAbersensiAndOthers(true)

        // ✅ Run all 3 requests in parallel
        const [alergiResult, holidayResult, absensiResult] = await Promise.allSettled([
          (async () => {
            const siswaRes = await apiCall<any>(`/api/sekolah/${selectedSekolahId}/siswa`)
            const siswas = extractArray(siswaRes?.data || [])
            const alergiMap = new Map<string, { count: number; siswas: string[] }>()

            // Optimization: Try to get alergi from siswa directly, fallback to individual requests batched
            let alergiResults: { siswa: any; alergi: any[] }[] = []

            // First check if alergi data is already in siswa response
            const siswaWithAlergiData = siswas.filter((s: any) => s.alergi)
            if (siswaWithAlergiData.length > 0) {
              // Use alergi data from siswa response directly
              alergiResults = siswas.map((siswa: any) => ({
                siswa,
                alergi: Array.isArray(siswa.alergi) ? siswa.alergi : (siswa.alergi ? [siswa.alergi] : []),
              }))
            } else {
              // Fallback: batch alergi requests per 10 siswa instead of N requests
              const BATCH_SIZE = 10
              const batches: Promise<{ siswa: any; alergi: any[] }[]>[] = []

              for (let i = 0; i < siswas.length; i += BATCH_SIZE) {
                const batch = siswas.slice(i, i + BATCH_SIZE)
                const batchPromise = Promise.all(
                  batch.map((siswa) =>
                    apiCall<any>(`/api/siswa/${siswa.id}/alergi`)
                      .then((alergiRes) => {
                        const alergi = extractArray(alergiRes?.data || [])
                        return { siswa, alergi }
                      })
                      .catch(() => ({ siswa, alergi: [] }))
                  )
                )
                batches.push(batchPromise)
              }

              const batchResults = await Promise.all(batches)
              alergiResults = batchResults.flat()
            }

            for (const { siswa, alergi } of alergiResults) {
              for (const a of alergi) {
                const namaAlergi = a.namaAlergi || a.nama || a
                if (!alergiMap.has(namaAlergi)) {
                  alergiMap.set(namaAlergi, { count: 0, siswas: [] })
                }
                alergiMap.get(namaAlergi)!.count++
                alergiMap.get(namaAlergi)!.siswas.push(siswa.id)
              }
            }

            // Hitung total siswa yang alergi (unique)
            const allAlergiSiswaSet = new Set<string>()
            for (const data of alergiMap.values()) {
              data.siswas.forEach(id => allAlergiSiswaSet.add(id))
            }
            const totalSiswaAlergi = allAlergiSiswaSet.size

            return Array.from(alergiMap.entries()).map(([nama, data]) => ({
              nama,
              jumlahSiswa: data.count,
              uniqueSiswaAlergi: new Set(data.siswas).size,
              totalSiswaAlergi,
            }))
          })(),
          (async () => {
            console.log("[DEBUG HOLIDAYS] Fetching holidays for sekolahId:", selectedSekolahId)
            const holidayRes = await apiCall<any>(`/api/kalender-akademik?sekolahId=${selectedSekolahId}`)
            console.log("[DEBUG HOLIDAYS] Raw response:", holidayRes)
            const rawHolidays = extractArray(holidayRes?.data || [])
            console.log("[DEBUG HOLIDAYS] Raw holidays array:", rawHolidays)

            const processed = rawHolidays
              .filter((h: any) => {
                const dateField = h.tanggal || h.tanggalMulai || h.tanggalSelesai
                if (!dateField) return false
                const date = parseDate(dateField)
                return date !== null
              })
              .map((h: any) => {
                const dateField = h.tanggal || h.tanggalMulai || h.tanggalSelesai
                const descriptionField = h.keterangan || h.deskripsi || "Hari Libur"
                return { tanggal: dateField, keterangan: descriptionField }
              })
            console.log("[DEBUG HOLIDAYS] Processed holidays:", processed)
            return processed
          })(),
          aggregateAbsensiForSekolah(selectedSekolahId),
        ])

        // Handle results
        if (alergiResult.status === 'fulfilled') {
          setAlergiList(alergiResult.value || [])
        }

        if (holidayResult.status === 'fulfilled') {
          console.log("[DEBUG HOLIDAYS] Holidays fetched:", holidayResult.value)
          setHolidays(holidayResult.value || [])
        } else {
          console.error("[DEBUG HOLIDAYS] Failed to fetch holidays:", holidayResult.reason)
          setHolidays([])
        }

        if (absensiResult.status === 'fulfilled') {
          setAbsensiAggregated(absensiResult.value || [])
        }
      } finally {
        setLoadingAbersensiAndOthers(false)
      }
    }

    loadAbersensiAndOthers()
  }, [selectedSekolahId])

  // ✅ OPTIMIZED: Remove 500ms delay
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
        // ✅ Clear cache saat load menu harian untuk planning yang berbeda
        const cacheKeyMenuHarian = generateCacheKey(`/api/menu-planning/${selectedPlanningId}/menu-harian`)
        apiCache.remove(cacheKeyMenuHarian)
        console.log("[DEBUG] Cleared menu-harian cache for planning:", selectedPlanningId)

        const res = await apiCall<any>(`/api/menu-planning/${selectedPlanningId}/menu-harian`)
        const menus = extractArray(res?.data || [])
        console.log("[DEBUG] Menu Harian dari API:", menus)
        menus.forEach((menu: any) => {
          // 🔥 DEBUG: Log full menu object to inspect property names
          console.log(`[DEBUG] FULL MENU OBJECT for ${menu.namaMenu}:`, JSON.stringify(menu, null, 2))
          const m = menu as any;
          console.log(`[DEBUG] Menu: ${m.namaMenu}, jamSajikan: ${m.jamSajikan}, jam_sajikan: ${m.jam_sajikan}, jamSajian: ${m.jamSajian}`)
        })
        setMenuHarianList(menus)  // ✅ No delay!
      } catch (err) {
        console.error("Gagal load menu harian:", err)
        setMenuHarianList([])
      } finally {
        setLoadingMenuHarian(false)
      }
    }

    loadMenuHarian()
  }, [selectedPlanningId])

  const validateIngredient = useCallback(async (namaMenu: string) => {
    if (!selectedSekolahId || alergiList.length === 0) {
      setIngredientWarnings({ hasWarning: false, conflicts: [], message: "" })
      return
    }

    const menuLower = namaMenu.toLowerCase()
    const conflicts = alergiList
      .filter(a => menuLower.includes(a.nama.toLowerCase()))
      .map(a => a.nama)

    if (conflicts.length > 0) {
      setIngredientWarnings({
        hasWarning: true,
        conflicts,
        message: `Peringatan: Menu ini mengandung alergen (${conflicts.join(", ")}) yang dikonsumsi oleh siswa di sekolah ini`,
      })
    } else {
      setIngredientWarnings({ hasWarning: false, conflicts: [], message: "" })
    }
  }, [selectedSekolahId, alergiList])

  const currentPlanning = menuPlannings.find((p) => p.id === selectedPlanningId)
  const currentSekolah = sekolahList.find((s) => s.id === selectedSekolahId)

  const handleCreatePlanning = async () => {
    if (!formData.tanggalMulai || !formData.tanggalSelesai || !formData.sekolahId) {
      alert("Isi semua field")
      return
    }

    try {
      setIsSubmitting(true)

      // Validasi tanggal mulai <= tanggal selesai
      const startDate = parseDateAsUTC(formData.tanggalMulai)
      const endDate = parseDateAsUTC(formData.tanggalSelesai)

      console.log("[DEBUG CREATE PLANNING] ========== SUBMIT PLANNING ==========")
      console.log("[DEBUG CREATE PLANNING] tanggalMulai:", formData.tanggalMulai)
      console.log("[DEBUG CREATE PLANNING] tanggalSelesai:", formData.tanggalSelesai)
      console.log("[DEBUG CREATE PLANNING] sekolahId:", formData.sekolahId)
      console.log("[DEBUG CREATE PLANNING] mingguanKe:", formData.mingguanKe)
      console.log("[DEBUG CREATE PLANNING] startDate (UTC):", startDate)
      console.log("[DEBUG CREATE PLANNING] endDate (UTC):", endDate)

      if (!startDate || !endDate) {
        alert("Format tanggal tidak valid")
        setIsSubmitting(false)
        return
      }

      if (startDate > endDate) {
        alert("Tanggal mulai harus lebih kecil atau sama dengan tanggal selesai")
        setIsSubmitting(false)
        return
      }

      const requestBody = {
        mingguanKe: parseInt(formData.mingguanKe),
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: formData.tanggalSelesai,
        sekolahId: formData.sekolahId,
      }

      console.log("[DEBUG CREATE PLANNING] REQUEST BODY:", JSON.stringify(requestBody, null, 2))

      // 🔥 USE REALTIME HOOK - Automatic optimistic add + temp ID handling!
      const newPlanning = await addMenuPlanning(requestBody)
      console.log("[CREATE PLANNING] ✅ Added planning:", newPlanning.id)

      alert("✅ Menu planning berhasil dibuat")
      setShowCreateModal(false)
      setFormData({
        mingguanKe: "1",
        tanggalMulai: "",
        tanggalSelesai: "",
        sekolahId: "",
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal membuat menu planning")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateMenuHarian = async () => {
    if (!menuFormData.tanggal || !menuFormData.namaMenu || !menuFormData.jamMulaiMasak || !menuFormData.jamSelesaiMasak || !menuFormData.jamSajikan) {
      alert("Isi semua field yang wajib")
      return
    }

    try {
      setIsSubmitting(true)

      console.log("[DEBUG] ========== SUBMIT MENU HARIAN ==========")
      console.log("[DEBUG] menuFormData.tanggal INPUT:", menuFormData.tanggal)
      console.log("[DEBUG] currentPlanning:", currentPlanning)
      console.log("[DEBUG] currentPlanning.tanggalMulai:", currentPlanning?.tanggalMulai)
      console.log("[DEBUG] currentPlanning.tanggalSelesai:", currentPlanning?.tanggalSelesai)

      // Cek range validation di frontend - NORMALIZE semua tanggal ke format YYYY-MM-DD terlebih dahulu
      const selectedDate = parseDateAsUTC(menuFormData.tanggal)
      const minDateNormalized = normalizeDateString(currentPlanning?.tanggalMulai) || ""
      const maxDateNormalized = normalizeDateString(currentPlanning?.tanggalSelesai) || ""
      const minDate = parseDateAsUTC(minDateNormalized)
      const maxDate = parseDateAsUTC(maxDateNormalized)

      console.log("[DEBUG] selectedDate (UTC):", selectedDate)
      console.log("[DEBUG] minDate (UTC):", minDate)
      console.log("[DEBUG] maxDate (UTC):", maxDate)

      if (!selectedDate || !minDate || !maxDate) {
        console.error("[DEBUG] INVALID DATES - cannot parse")
        alert("Format tanggal tidak valid")
        setIsSubmitting(false)
        return
      }

      console.log("[DEBUG] selectedDate >= minDate?", selectedDate >= minDate)
      console.log("[DEBUG] selectedDate <= maxDate?", selectedDate <= maxDate)

      if (selectedDate < minDate || selectedDate > maxDate) {
        console.error("[DEBUG] RANGE ERROR - tanggal di luar range!")
        console.error(`[DEBUG] Range: ${minDate.toISOString()} to ${maxDate.toISOString()}, Selected: ${selectedDate.toISOString()}`)
        alert("Tanggal harus berada dalam range menu planning!")
        setIsSubmitting(false)
        return
      }

      console.log("[DEBUG] RANGE OK - lanjut submit")
      console.log("[DEBUG] menuFormData.tanggal DIKIRIM:", menuFormData.tanggal)

      const requestBody = {
        tanggal: menuFormData.tanggal,  // ✅ Kirim sebagai date-only format: 2025-11-14 (sesuai dengan backend)
        namaMenu: menuFormData.namaMenu,
        biayaPerTray: parseFloat(menuFormData.biayaPerTray) || 0,
        jamMulaiMasak: menuFormData.jamMulaiMasak,
        jamSelesaiMasak: menuFormData.jamSelesaiMasak,
        kalori: parseFloat(menuFormData.kalori) || 0,
        protein: parseFloat(menuFormData.protein) || 0,
        lemak: parseFloat(menuFormData.lemak) || 0,
        targetTray: parseFloat(menuFormData.targetTray) || 0,
        jamSajikan: menuFormData.jamSajikan,
        karbohidrat: parseFloat(menuFormData.karbohidrat) || 0,
      }
      console.log("[DEBUG] REQUEST BODY:", JSON.stringify(requestBody, null, 2))

      const createRes = await apiCall<any>(`/api/menu-planning/${selectedPlanningId}/menu-harian`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      })
      console.log("[DEBUG] API RESPONSE: SUCCESS")

      // Optimistic update - add new menu to list immediately without refetch
      const newMenu = createRes?.data || {
        id: `temp-${Date.now()}`,
        ...requestBody,
        planningId: selectedPlanningId,
      }

      setMenuHarianList(prev => [...prev, newMenu])

      // ✅ Clear cache untuk menu-harian endpoint agar fetch dari API fresh
      const cacheKeyMenuHarian = generateCacheKey(`/api/menu-planning/${selectedPlanningId}/menu-harian`)
      apiCache.remove(cacheKeyMenuHarian)
      console.log("[DEBUG] Cleared cache for menu-harian endpoint:", cacheKeyMenuHarian)

      // ✅ Force reload menu harian data dari API (bypass cache)
      const reloadRes = await apiCall<any>(`/api/menu-planning/${selectedPlanningId}/menu-harian`)
      const reloadMenus = extractArray(reloadRes?.data || [])
      console.log("[DEBUG] Force reload menu harian after create:", reloadMenus.length, "items")
      setMenuHarianList(reloadMenus)

      // ✅ Invalidate cache agar data fresh di navigate ulang
      await refreshMenuCache()

      alert("Menu harian berhasil ditambahkan")
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
        targetTray: "",
        jamSajikan: "",
        lemak: "",
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan menu harian")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMenuHarian = async (menuId: string) => {
    if (!confirm("Apakah kamu yakin ingin menghapus menu ini?")) return

    setIsDeletingMenu(menuId) // 🔥 Set loading state

    try {
      await apiCall(`/api/menu-harian/${menuId}`, {
        method: "DELETE",
      })

      // ✅ Clear cache untuk menu-harian endpoint agar fetch dari API fresh
      const cacheKeyMenuHarian = generateCacheKey(`/api/menu-planning/${selectedPlanningId}/menu-harian`)
      apiCache.remove(cacheKeyMenuHarian)
      console.log("[DEBUG] Cleared cache for menu-harian endpoint after delete:", cacheKeyMenuHarian)

      // 🔥 Show success with animation
      setMenuHarianList(menuHarianList.filter(m => m.id !== menuId))

      // ✅ Refresh menu cache agar konsisten
      await refreshMenuCache()

      alert("✅ Menu berhasil dihapus")
    } catch (err) {
      alert("❌ " + (err instanceof Error ? err.message : "Gagal menghapus menu"))
    } finally {
      setIsDeletingMenu(null) // 🔥 Clear loading state
    }
  }

  // 🎯 ✅ DELETE MENU PLANNING - REALTIME dengan rollback otomatis
  const handleDeleteMenuPlanning = async (planningId: string) => {
    // 🔥 PREVENT DOUBLE-CLICK
    if (isDeleting) {
      console.log("[DELETE] Sedang menghapus planning lain, tunggu sebentar...")
      return
    }

    if (!confirm("Apakah kamu yakin ingin menghapus menu planning ini? Data menu harian akan ikut terhapus.")) return

    setIsDeleting(planningId)

    try {
      console.log(`[DELETE] Menghapus planning: ${planningId}`)

      // 🔥 USE REALTIME HOOK - Automatic optimistic remove + rollback on error!
      await deleteMenuPlanning(planningId)

      // Jika planning ini yang currently selected, clear selection
      if (selectedPlanningId === planningId) {
        setSelectedPlanningId("")
        setMenuHarianList([])
      }

      alert("✅ Menu planning berhasil dihapus")

    } catch (err) {
      console.error(`[DELETE] ❌ Error: ${err}`)
      alert("❌ " + (err instanceof Error ? err.message : "Gagal menghapus menu planning"))
    } finally {
      setIsDeleting(null)
    }
  }

  if (loading) {
    return (
      <DapurLayout currentPage="menu">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg p-6 h-48 animate-pulse-fast"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm h-32 animate-pulse-fast">
                <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
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
            <p className="text-gray-600 mt-1">Kelola menu mingguan dengan aggregasi absensi dari semua kelas</p>
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
          {cacheLoading ? (
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse-fast"></div>
          ) : (
            <select
              value={selectedSekolahId}
              onChange={(e) => {
                setSelectedSekolahId(e.target.value)
                setSelectedPlanningId("")
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent font-medium"
            >
              <option value="">Semua Sekolah</option>
              {sekolahList && sekolahList.length > 0 ? (
                sekolahList.map((s: Sekolah) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))
              ) : (
                <option disabled>Tidak ada sekolah</option>
              )}
            </select>
          )}
        </div>
      </div>

      {selectedSekolahId && (alergiList.length > 0 || holidays.length > 0 || loadingAbersensiAndOthers) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {loadingAbersensiAndOthers ? (
            <>
              <SkeletonAlergiCard />
              <SkeletonAlergiCard />
            </>
          ) : (
            <>
              {alergiList.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-blue-900">Alergi Siswa di Sekolah Ini</h3>
                        <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded">{alergiPage}/{totalAlergiPages}</span>
                      </div>
                      <div className="space-y-2">
                        {paginatedAlergi.map((a, i) => (
                          <div key={i} className="bg-gray-50 rounded p-2 text-sm">
                            <span className="font-medium text-blue-900">{a.nama}</span>
                            <span className="text-blue-600 ml-2">({a.jumlahSiswa} siswa)</span>
                          </div>
                        ))}
                      </div>
                      {totalAlergiPages > 1 && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200">
                          <button
                            onClick={() => setAlergiPage(Math.max(1, alergiPage - 1))}
                            disabled={alergiPage === 1}
                            className="px-3 py-1 text-xs bg-blue-200 text-blue-900 rounded hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Sebelumnya
                          </button>
                          <button
                            onClick={() => setAlergiPage(Math.min(totalAlergiPages, alergiPage + 1))}
                            disabled={alergiPage === totalAlergiPages}
                            className="px-3 py-1 text-xs bg-blue-200 text-blue-900 rounded hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Selanjutnya →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {holidays.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-purple-900">Hari Libur Sekolah</h3>
                        <span className="text-xs bg-purple-200 text-purple-900 px-2 py-1 rounded">{holidayPage}/{totalHolidayPages}</span>
                      </div>
                      <div className="space-y-2">
                        {paginatedHolidays.map((h, i) => {
                          if (!h.tanggal) return null

                          return (
                            <div key={i} className="text-gray-50 rounded p-2 text-sm">
                              <span className="font-medium text-purple-900">
                                {formatDateSafe(h.tanggal)}
                              </span>
                              <p className="text-xs text-purple-600 mt-1">
                                {h.keterangan || "Hari Libur"}
                              </p>
                            </div>
                          )
                        }).filter(Boolean)}
                      </div>
                      {totalHolidayPages > 1 && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-purple-200">
                          <button
                            onClick={() => setHolidayPage(Math.max(1, holidayPage - 1))}
                            disabled={holidayPage === 1}
                            className="px-3 py-1 text-xs bg-purple-200 text-purple-900 rounded hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Sebelumnya
                          </button>
                          <button
                            onClick={() => setHolidayPage(Math.min(totalHolidayPages, holidayPage + 1))}
                            disabled={holidayPage === totalHolidayPages}
                            className="px-3 py-1 text-xs bg-purple-200 text-purple-900 rounded hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Selanjutnya →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {filteredMenuPlannings.length === 0 ? (
        loading ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg p-6 h-48 animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonMenuCard key={i} />
              ))}
            </div>
          </div>
        ) : (
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
        )
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

            <div className="space-y-4">
              {/* ONGOING WEEKS */}
              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3">Minggu Berlangsung</h3>
                <div className="flex flex-wrap gap-2">
                  {loading ? (
                    <>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 bg-white/20 rounded-lg w-32 animate-pulse"></div>
                      ))}
                    </>
                  ) : (
                    filteredMenuPlannings
                      .filter((p) => !isWeekCompleted(p.tanggalSelesai))
                      .map((planning) => (
                        <div key={planning.id} className="group relative">
                          <button
                            onClick={() => {
                              setSelectedPlanningId(planning.id)
                              setDisplayMonth(new Date(planning.tanggalMulai))
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition flex flex-col items-start gap-1 ${planning.id === selectedPlanningId
                              ? "bg-[#D0B064] text-white shadow-lg"
                              : "bg-white/20 text-white hover:bg-white/30"
                              }`}
                          >
                            <span className="text-sm font-semibold">Minggu {planning.mingguanKe}</span>
                            <span className="text-xs opacity-90">{formatPeriode(planning.tanggalMulai, planning.tanggalSelesai)}</span>
                          </button>
                          {/* 🗑️ DELETE BUTTON WITH LOADING ANIMATION */}
                          <button
                            onClick={() => handleDeleteMenuPlanning(planning.id)}
                            disabled={isDeleting === planning.id}
                            className={`absolute -top-2 -right-2 transition rounded-full p-1 shadow-lg flex items-center justify-center ${isDeleting === planning.id
                              ? "opacity-100 bg-orange-500 cursor-wait"
                              : "opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600"
                              }`}
                            title={isDeleting === planning.id ? "Menghapus..." : "Hapus menu planning"}
                          >
                            {isDeleting === planning.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* COMPLETED WEEKS - COLLAPSIBLE */}
              {filteredMenuPlannings.some((p) => isWeekCompleted(p.tanggalSelesai)) && (
                <div>
                  <button
                    onClick={() => setShowCompletedWeeks(!showCompletedWeeks)}
                    className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition mb-3"
                  >
                    <span>{showCompletedWeeks ? "▼" : "▶"}</span>
                    <span>Minggu Selesai ({filteredMenuPlannings.filter((p) => isWeekCompleted(p.tanggalSelesai)).length})</span>
                  </button>

                  {showCompletedWeeks && (
                    <div className="flex flex-wrap gap-2">
                      {filteredMenuPlannings
                        .filter((p) => isWeekCompleted(p.tanggalSelesai))
                        .map((planning) => (
                          <div key={planning.id} className="group relative">
                            <button
                              onClick={() => {
                                setSelectedPlanningId(planning.id)
                                setDisplayMonth(new Date(planning.tanggalMulai))
                              }}
                              className={`px-4 py-2 rounded-lg font-medium transition flex flex-col items-start gap-1 opacity-60 ${planning.id === selectedPlanningId
                                ? "bg-[#D0B064] text-white shadow-lg"
                                : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                              title="Week selesai (untuk referensi/bukti)"
                            >
                              <span className="text-sm font-semibold">Minggu {planning.mingguanKe}</span>
                              <span className="text-xs opacity-90">{formatPeriode(planning.tanggalMulai, planning.tanggalSelesai)}</span>
                            </button>
                            {/* ⚠️ INFO ICON - tidak bisa dihapus karena bukti */}
                            <div
                              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition bg-blue-500 text-white rounded-full p-1 shadow-lg"
                              title="Week selesai - tetap disimpan sebagai arsip/bukti"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedPlanningId && (
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#1B263A]">Menu Harian</h2>
              <button
                onClick={() => {
                  setDisplayMonth(new Date(currentPlanning?.tanggalMulai || new Date()))
                  // ✅ Reset form saat membuka modal
                  setMenuFormData({
                    tanggal: "",
                    namaMenu: "",
                    biayaPerTray: "",
                    jamMulaiMasak: "",
                    jamSelesaiMasak: "",
                    kalori: "",
                    protein: "",
                    karbohidrat: "",
                    targetTray: "",
                    jamSajikan: "",
                    lemak: "",
                  })
                  setShowCreateMenuModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-medium transition"
              >
                <Plus className="w-4 h-4" />
                Tambah Menu
              </button>
            </div>
          )}

          {selectedPlanningId && loadingMenuHarian ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonMenuCard key={i} />
              ))}
            </div>
          ) : selectedPlanningId && menuHarianList.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Menu Harian</h3>
              <p className="text-gray-600 mb-6">Tambahkan menu harian untuk minggu ini</p>
              <button
                onClick={() => {
                  setDisplayMonth(new Date(currentPlanning?.tanggalMulai || new Date()))
                  // ✅ Reset form saat membuka modal
                  setMenuFormData({
                    tanggal: "",
                    namaMenu: "",
                    biayaPerTray: "",
                    jamMulaiMasak: "",
                    jamSelesaiMasak: "",
                    kalori: "",
                    protein: "",
                    karbohidrat: "",
                    targetTray: "",
                    jamSajikan: "",
                    lemak: "",
                  })
                  setShowCreateMenuModal(true)
                }}
                className="px-6 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-medium transition"
              >
                Tambah Menu Harian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {menuHarianList.map((menu) => {
                const dateKey = normalizeDateString(menu.tanggal) || ""
                const absensiForDate = absensiAggregatedMap[dateKey]

                return (
                  <div key={menu.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-[#1B263A]">{menu.namaMenu}</h3>
                          {menu.isBooked && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-md">
                              BOOKED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{formatDateSafe(menu.tanggal)}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMenuHarian(menu.id)}
                        disabled={isDeletingMenu === menu.id}
                        className={`p-2 rounded-lg transition flex items-center justify-center ${isDeletingMenu === menu.id
                          ? "bg-orange-100 text-orange-600 cursor-wait"
                          : "text-red-600 hover:bg-red-50"
                          }`}
                        title={isDeletingMenu === menu.id ? "Menghapus..." : "Hapus menu"}
                      >
                        {isDeletingMenu === menu.id ? (
                          <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {absensiForDate && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-900">
                              {absensiForDate.jumlahHadirTotal} siswa hadir
                            </span>
                          </div>
                          {absensiForDate.jumlahSiswaTotal && absensiForDate.jumlahSiswaTotal > 0 && (
                            <span className="text-xs text-indigo-600">
                              dari {absensiForDate.jumlahSiswaTotal} siswa
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Jam Masak</p>
                        <p className="font-semibold text-blue-900">
                          {menu.jamMulaiMasak} - {menu.jamSelesaiMasak}
                        </p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Biaya/Tray</p>
                        <p className="font-semibold text-green-900">
                          Rp {menu.biayaPerTray.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kalori:</span>
                        <span className="font-semibold">{menu.kalori} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protein:</span>
                        <span className="font-semibold">{menu.protein}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lemak:</span>
                        <span className="font-semibold">{menu.lemak}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target Tray:</span>
                        <span className="font-semibold">{menu.targetTray}biji</span>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Baik di sajikan Jam:</p>
                        <p className="font-semibold text-blue-900">
                          {(() => {
                            // 🔥 DEFENSIVE: check multiple potential property names from API
                            const m = menu as any;
                            const displayTime = m.jamSajikan || m.jam_sajikan || m.jamSajian;

                            if (displayTime) {
                              return (
                                <>
                                  {displayTime}
                                  <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                                    {getWaktuMakan(displayTime)}
                                  </span>
                                </>
                              );
                            }
                            return <span className="text-gray-400">Belum ditentukan</span>;
                          })()}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Karbohidrat:</span>
                        <span className="font-semibold">{menu.karbohidrat}g</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <ModalCreatePlanning
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreatePlanning}
        isSubmitting={isSubmitting}
        sekolahList={sekolahList}
      />

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
        displayMonth={displayMonth}
        setDisplayMonth={setDisplayMonth}
        menuHarianList={menuHarianList}
        absensiAggregatedMap={absensiAggregatedMap}
      />
    </DapurLayout>
  )
}
