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

function SkeletonMenuCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm h-48 animate-pulse">
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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-32 animate-pulse">
      <div className="h-5 bg-blue-200 rounded w-32 mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-blue-200 rounded w-full"></div>
        <div className="h-3 bg-blue-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}

function SkeletonHolidayCard() {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 h-32 animate-pulse">
      <div className="h-5 bg-purple-200 rounded w-40 mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-purple-200 rounded w-full"></div>
        <div className="h-3 bg-purple-200 rounded w-4/5"></div>
      </div>
    </div>
  )
}

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
    if (!holidays || holidays.length === 0) return false
    
    return holidays.some((h: Holiday) => {
      try {
        if (!h.tanggal) return false
        
        // Parse tanggal dengan safe
        const date = new Date(h.tanggal)
        if (isNaN(date.getTime())) return false
        
        const holidayDate = date.toISOString().split('T')[0]
        return holidayDate === dateStr
      } catch (err) {
        console.warn("Error parsing holiday date:", h.tanggal, err)
        return false
      }
    })
  }

  const getHolidayInfo = (dateStr: string) => {
    if (!holidays || holidays.length === 0) return null
    
    return holidays.find((h: Holiday) => {
      try {
        if (!h.tanggal) return false
        
        // Parse tanggal dengan safe
        const date = new Date(h.tanggal)
        if (isNaN(date.getTime())) return false
        
        const holidayDate = date.toISOString().split('T')[0]
        return holidayDate === dateStr
      } catch (err) {
        console.warn("Error parsing holiday date:", h.tanggal, err)
        return false
      }
    })
  }

  const currentMonth = displayMonth
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days: (number | null)[] = []

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const monthYear = currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  // Navigation functions
  const goToPreviousMonth = () => {
    const prev = new Date(displayMonth)
    prev.setMonth(prev.getMonth() - 1)

    const minDateObj = new Date(minDate)
    
    // Compare year-month only
    const prevYearMonth = prev.getFullYear() * 12 + prev.getMonth()
    const minYearMonth = minDateObj.getFullYear() * 12 + minDateObj.getMonth()
    
    if (prevYearMonth >= minYearMonth) {
      setDisplayMonth(prev)
      console.log("setDisplayMonth to:", prev.toISOString())
    } else {
      console.log("Cannot go prev - outside range")
    }
  }

  const goToNextMonth = () => {
    const next = new Date(displayMonth)
    next.setMonth(next.getMonth() + 1)

    const maxDateObj = new Date(maxDate)
    
    // Compare year-month only
    const nextYearMonth = next.getFullYear() * 12 + next.getMonth()
    const maxYearMonth = maxDateObj.getFullYear() * 12 + maxDateObj.getMonth()
    
    if (nextYearMonth <= maxYearMonth) {
      setDisplayMonth(next)
      console.log("setDisplayMonth to:", next.toISOString())
    } else {
      console.log("Cannot go next - outside range")
    }
  }

  const canGoPrevious = () => {
    try {
      const prev = new Date(displayMonth)
      prev.setMonth(prev.getMonth() - 1)
      
      const minDateObj = new Date(minDate)
      
      // Compare year-month only
      const prevYearMonth = prev.getFullYear() * 12 + prev.getMonth()
      const minYearMonth = minDateObj.getFullYear() * 12 + minDateObj.getMonth()
      
      const canGo = prevYearMonth >= minYearMonth
      console.log("canGoPrevious:", { 
        prev: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`,
        min: `${minDateObj.getFullYear()}-${String(minDateObj.getMonth() + 1).padStart(2, '0')}`,
        prevYearMonth,
        minYearMonth,
        canGo 
      })
      return canGo
    } catch (e) {
      console.error("canGoPrevious error:", e)
      return false
    }
  }

  const canGoNext = () => {
    try {
      const next = new Date(displayMonth)
      next.setMonth(next.getMonth() + 1)
      
      const maxDateObj = new Date(maxDate)
      
      // Compare year-month only
      const nextYearMonth = next.getFullYear() * 12 + next.getMonth()
      const maxYearMonth = maxDateObj.getFullYear() * 12 + maxDateObj.getMonth()
      
      const canGo = nextYearMonth <= maxYearMonth
      console.log("canGoNext:", { 
        next: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`,
        max: `${maxDateObj.getFullYear()}-${String(maxDateObj.getMonth() + 1).padStart(2, '0')}`,
        nextYearMonth,
        maxYearMonth,
        canGo 
      })
      return canGo
    } catch (e) {
      console.error("canGoNext error:", e)
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
            <p className="font-bold text-blue-900">Untuk: {currentPlanning?.sekolah?.nama}</p>
            <p className="text-xs mt-2 text-blue-600">
              {currentPlanning && formatDateSafe(currentPlanning.tanggalMulai)} s/d {currentPlanning && formatDateSafe(currentPlanning.tanggalSelesai)}
            </p>
          </div>

          {alergiList.length > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg text-sm border border-amber-200">
              <p className="font-bold text-amber-900 mb-2">Alergi di Sekolah Ini:</p>
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
              {/* Navigation Controls - FIXED VERSION */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    console.log("Prev clicked, canGoPrevious:", canGoPrevious())
                    goToPreviousMonth()
                  }}
                  disabled={canGoPrevious() === false}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    canGoPrevious() !== false
                      ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  title="Bulan Sebelumnya"
                >
                  ← Prev
                </button>
                
                <p className="text-center font-bold text-gray-700 text-sm flex-1 px-4">
                  {monthYear}
                </p>
                
                <button
                  onClick={() => {
                    console.log("Next clicked, canGoNext:", canGoNext())
                    goToNextMonth()
                  }}
                  disabled={canGoNext() === false}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    canGoNext() !== false
                      ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  title="Bulan Berikutnya"
                >
                  Next →
                </button>
              </div>

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
                  const isBooked = menuHarianList.some((menu: MenuHarian) => {
                    // Normalisasi kedua tanggal untuk perbandingan yang akurat
                    const menuDate = menu.tanggal ? new Date(menu.tanggal).toISOString().split('T')[0] : null
                    return menuDate === dateStr
                  })

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => {
                        if (inRange && !holiday) {
                          setFormData({ ...formData, tanggal: dateStr })
                        }
                      }}
                      disabled={!inRange || holiday}
                      title={holiday ? `Libur: ${holidayInfo?.keterangan}` : isBooked ? "Menu sudah di-booking" : ""}
                      className={`aspect-square rounded-lg text-xs font-medium transition flex items-center justify-center relative ${
                        !inRange
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : holiday
                          ? "bg-red-100 text-red-700 cursor-not-allowed border border-red-300"
                          : isSelected
                          ? "bg-[#D0B064] text-white border-2 border-[#D0B064]"
                          : isBooked
                          ? "bg-green-100 text-green-700 border-2 border-green-400 cursor-pointer hover:bg-green-200"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      {day}
                      {isBooked && !isSelected && (
                        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      )}
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
                  <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
                  <span className="text-gray-600">Booked</span>
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

  // TAMBAH: State untuk calendar display
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date())

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
  }, [selectedSekolahId])

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
          console.log("=== END DEBUG ===")
          
          // Filter dan validate holidays
          const validatedHolidays = rawHolidays
            .filter((h: any) => {
              const dateField = h.tanggal || h.tanggalMulai || h.tanggalSelesai
              
              if (!dateField) {
                console.warn("Holiday without date field:", h)
                return false
              }
              
              const date = parseDate(dateField)
              if (!date) {
                console.warn(`Invalid date in holiday: ${dateField}`, h)
                return false
              }
              
              return true
            })
            .map((h: any) => {
              const dateField = h.tanggal || h.tanggalMulai || h.tanggalSelesai
              const descriptionField = h.keterangan || h.deskripsi || "Hari Libur"
              
              return {
                tanggal: dateField,
                keterangan: descriptionField,
              }
            })
          
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
      setFormData({
        mingguanKe: "1",
        tanggalMulai: "",
        tanggalSelesai: "",
        sekolahId: "",
      })
      // Reload data
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal membuat menu planning")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateMenuHarian = async () => {
    if (!menuFormData.tanggal || !menuFormData.namaMenu || !menuFormData.jamMulaiMasak || !menuFormData.jamSelesaiMasak) {
      alert("Isi semua field yang wajib")
      return
    }

    try {
      setIsSubmitting(true)
      await apiCall(`/api/menu-planning/${selectedPlanningId}/menu-harian`, {
        method: "POST",
        body: JSON.stringify({
          tanggal: menuFormData.tanggal,
          namaMenu: menuFormData.namaMenu,
          biayaPerTray: parseFloat(menuFormData.biayaPerTray) || 0,
          jamMulaiMasak: menuFormData.jamMulaiMasak,
          jamSelesaiMasak: menuFormData.jamSelesaiMasak,
          kalori: parseFloat(menuFormData.kalori) || 0,
          protein: parseFloat(menuFormData.protein) || 0,
          lemak: parseFloat(menuFormData.lemak) || 0,
          karbohidrat: parseFloat(menuFormData.karbohidrat) || 0,
        }),
      })
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
        lemak: "",
      })
      // Reload menu harian
      if (selectedPlanningId) {
        const res = await apiCall<any>(`/api/menu-planning/${selectedPlanningId}/menu-harian`)
        const menus = extractArray(res?.data || [])
        setMenuHarianList(menus)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan menu harian")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMenuHarian = async (menuId: string) => {
    if (!confirm("Apakah kamu yakin ingin menghapus menu ini?")) return

    try {
      await apiCall(`/api/menu-harian/${menuId}`, {
        method: "DELETE",
      })
      alert("Menu berhasil dihapus")
      setMenuHarianList(menuHarianList.filter(m => m.id !== menuId))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus menu")
    }
  }

  if (loading) {
    return (
      <DapurLayout currentPage="menu">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg p-6 h-48 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm h-32 animate-pulse">
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
          {loading ? (
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
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
              {sekolahList.map((s: Sekolah) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          )}
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
                        {holidays.map((h, i) => {
                          // Safety check untuk h.tanggal
                          if (!h.tanggal) {
                            console.warn("Holiday missing tanggal:", h)
                            return null
                          }
                          
                          return (
                            <div key={i} className="bg-white rounded p-2 text-sm">
                              <span className="font-medium text-purple-900">
                                {formatDateSafe(h.tanggal)}
                              </span>
                              <p className="text-xs text-purple-600 mt-1">
                                {h.keterangan || "Hari Libur"}
                              </p>
                            </div>
                          )
                        }).filter(Boolean)} {/* Filter out null entries */}
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

            <div className="flex flex-wrap gap-2">
              {loading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-white/20 rounded-lg w-32 animate-pulse"></div>
                  ))}
                </>
              ) : (
                filteredMenuPlannings.map((planning) => (
                  <button
                    key={planning.id}
                    onClick={() => {
                      setSelectedPlanningId(planning.id)
                      // Reset displayMonth ketika memilih planning baru
                      setDisplayMonth(new Date(planning.tanggalMulai))
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      planning.id === selectedPlanningId
                        ? "bg-[#D0B064] text-white shadow-lg"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    Minggu {planning.mingguanKe}
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedPlanningId && (
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#1B263A]">Menu Harian</h2>
              <button
                onClick={() => {
                  // Set displayMonth ke tanggal mulai planning
                  setDisplayMonth(new Date(currentPlanning?.tanggalMulai || new Date()))
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
                  setShowCreateMenuModal(true)
                }}
                className="px-6 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-medium transition"
              >
                Tambah Menu Harian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {menuHarianList.map((menu) => (
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
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

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
                      <span className="text-gray-600">Karbohidrat:</span>
                      <span className="font-semibold">{menu.karbohidrat}g</span>
                    </div>
                  </div>
                </div>
              ))}
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
      />
    </DapurLayout>
  )
}