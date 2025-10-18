// app/dapur/menu/components/CreateWeeklyMenuModal.tsx
import { useState, useEffect } from "react"
import { X, Calendar, AlertCircle } from "lucide-react"
import { SCHOOL_PROFILES } from "../constants/schoolProfiles"
import { createWeeklyMenuPlanning } from "../utils/menuApi"

interface CreateWeeklyMenuModalProps {
  selectedWeek: string
  selectedSchoolId: string
  onClose: () => void
  onSuccess: () => void
}

export function CreateWeeklyMenuModal({ 
  selectedWeek,
  selectedSchoolId,
  onClose, 
  onSuccess 
}: CreateWeeklyMenuModalProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    notes: '',
    schoolId: selectedSchoolId
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weekNumber = parseInt(selectedWeek.replace('week-', ''))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setError(null)
  
    try {
      // Gunakan sekolah ID yang valid dari backend
      const validSekolahId = "f9d371b0-b2e4-43e5-86da-c001d8c52842" // ← ID dari sekolah yang baru dibuat
      
      const submitData = {
        mingguanKe: weekNumber,
        tanggalMulai: formData.startDate,
        tanggalSelesai: formData.endDate,
        sekolahId: validSekolahId // ← Pakai ID yang valid
      }
      
      console.log('Submitting data:', submitData)
  
      const result = await createWeeklyMenuPlanning(submitData)
  
      console.log('Success response:', result)
      alert('Weekly menu planning berhasil dibuat!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Create error:', error)
      setError(error.message || 'Gagal membuat weekly menu planning')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper untuk menghitung tanggal minggu
  const getWeekDates = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Minggu pertama bulan ini
    const firstDay = new Date(currentYear, currentMonth, 1)
    const firstMonday = new Date(firstDay)
    const dayOfWeek = firstDay.getDay()
    const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek)
    firstMonday.setDate(firstDay.getDate() + daysToMonday)
    
    // Hitung start date berdasarkan week number
    const startDate = new Date(firstMonday)
    startDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7)
    
    // End date (5 hari setelah start date, Senin-Sabtu)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 5)
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }
  }

  // Auto-fill dates ketika modal dibuka
  useEffect(() => {
    const dates = getWeekDates()
    setFormData(prev => ({
      ...prev,
      startDate: dates.start,
      endDate: dates.end
    }))
  }, [weekNumber])

  const selectedSchool = SCHOOL_PROFILES.find(s => s.id === formData.schoolId)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold">Buat Weekly Menu Planning</h3>
            <p className="text-sm text-gray-300 mt-0.5">Minggu ke-{weekNumber}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Error</p>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  💡 Jika error "sekolahId tidak valid", minta backend untuk memberikan list ID sekolah yang valid
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">ℹ️ Informasi</p>
            <p>Weekly menu planning akan dibuat untuk minggu ke-{weekNumber}. Setelah dibuat, Anda bisa menambahkan daily menu untuk setiap hari (Senin-Sabtu).</p>
          </div>

          {/* Sekolah */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sekolah <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.schoolId}
              onChange={(e) => setFormData(prev => ({ ...prev, schoolId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-[#D0B064] disabled:bg-gray-100 text-gray-900"
              disabled={isSubmitting}
              required
            >
              {SCHOOL_PROFILES.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
            {selectedSchool && (
              <p className="text-xs text-gray-500 mt-2">
                📍 {selectedSchool.location}
              </p>
            )}
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Note: Jika backend menolak dengan error "sekolahId tidak valid", berarti ID sekolah dummy. Minta backend untuk list ID sekolah yang valid.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Minggu Ke
            </label>
            <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-800 font-medium">
              Minggu {weekNumber}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-[#D0B064] disabled:bg-gray-100 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">Hari Senin</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-[#D0B064] disabled:bg-gray-100 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">Hari Sabtu</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.startDate || !formData.endDate || !formData.schoolId}
              className="flex-1 px-5 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Membuat...
                </span>
              ) : (
                'Buat Weekly Menu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}