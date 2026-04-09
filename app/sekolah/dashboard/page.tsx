"use client"

import { useState, useEffect, memo, useRef, useCallback } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { useSekolahDataCache } from "@/lib/hooks/useSekolahDataCache"
import {
  Users,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Calendar,
  Bell,
  Clock,
  Truck,
  Heart,
  AlertTriangle,
  MapPin,
  RotateCw,
} from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

const SkeletonStatCard = () => (
  <div className="animate-pulse py-4">
    <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
    <div className="h-7 w-12 bg-gray-200 rounded mb-1" />
    <div className="h-3 w-24 bg-gray-100 rounded" />
  </div>
)

const SkeletonChartContainer = () => (
  <div className="border border-gray-100 rounded-xl p-6 animate-pulse">
    <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
    <div className="w-full h-56 bg-gray-100 rounded-lg" />
  </div>
)


// ✅ Utility function untuk parse tanggal dari berbagai format
const parseDate = (dateInput: any): Date | null => {
  if (!dateInput) return null

  try {
    // Jika sudah Date object
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput
    }

    // Jika string format ISO atau timestamp
    if (typeof dateInput === 'string') {
      // Handle ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}/)) {
        const parsed = new Date(dateInput)
        return isNaN(parsed.getTime()) ? null : parsed
      }

      // Handle timestamp string
      const numDate = Number(dateInput)
      if (!isNaN(numDate)) {
        const parsed = new Date(numDate)
        return isNaN(parsed.getTime()) ? null : parsed
      }
    }

    // Jika number (timestamp)
    if (typeof dateInput === 'number') {
      const parsed = new Date(dateInput)
      return isNaN(parsed.getTime()) ? null : parsed
    }

    return null
  } catch (err) {
    console.error('[parseDate] Error parsing date:', dateInput, err)
    return null
  }
}

const GiziDistributionChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={280}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={(entry) => `${entry.name}: ${entry.value}`}
        outerRadius={90}
        fill="#8884d8"
        dataKey="value"
      >
        <Cell fill="#10b981" />
        <Cell fill="#f59e0b" />
        <Cell fill="#ef4444" />
        <Cell fill="#8b5cf6" />
      </Pie>
      <Tooltip formatter={(value) => value} />
    </PieChart>
  </ResponsiveContainer>
))

GiziDistributionChart.displayName = "GiziDistributionChart"

const AttendanceChart = memo(({ data }: { data: any[] }) => {
  useEffect(() => {
    console.log("[AttendanceChart] Received data:", data)
    console.log("[AttendanceChart] Data length:", data?.length)
    console.log("[AttendanceChart] Data structure sample:", data?.[0])
  }, [data])

  // Jika data kosong, tampilkan pesan
  if (!data || data.length === 0) {
    console.warn("[AttendanceChart] ⚠️ No data provided!")
    return (
      <div className="flex items-center justify-center h-56 rounded-lg border border-dashed border-gray-200">
        <p className="text-sm text-gray-400">Belum ada data absensi minggu ini</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="hari" stroke="#94a3b8" style={{ fontSize: "11px" }} />
        <YAxis stroke="#94a3b8" style={{ fontSize: "11px" }} />
        <Tooltip
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="hadir" fill="#1B263A" name="Hadir" radius={[4, 4, 0, 0]} />
        <Bar dataKey="tidakHadir" fill="#D0B064" name="Tidak Hadir" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
})

AttendanceChart.displayName = "AttendanceChart"

const StatCard = memo(({ title, value, subtitle, icon: Icon, color }: any) => (
  <div className="py-3">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${color === 'bg-red-500' ? 'text-red-500' : color === 'bg-[#D0B064]' ? 'text-[#D0B064]' : 'text-[#1B263A]'}`} />
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs text-gray-400">{subtitle}</p>
  </div>
))

const KalenderReminder = ({ reminder }: { reminder: any }) => {
  const [mounted, setMounted] = useState(false)
  const [formattedDate, setFormattedDate] = useState("")
  const [daysStatus, setDaysStatus] = useState<any>({
    daysUntil: 0,
    bgColor: "bg-white",
    borderColor: "border-slate-200",
    iconBg: "bg-emerald-500",
    statusBg: "bg-emerald-100 text-emerald-700",
    textColor: "text-slate-900",
    statusText: "Sedang Berlangsung",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || (!reminder?.tanggalMulai && !reminder?.tanggal)) return

    const today = new Date()
    const dateToUse = reminder?.tanggalMulai || reminder?.tanggal
    const eventDate = new Date(dateToUse)
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let bgColor = "bg-white"
    let borderColor = "border-slate-200"
    let iconBg = "bg-emerald-500"
    let statusBg = "bg-emerald-100 text-emerald-700"
    let textColor = "text-slate-900"
    let statusText = "Sedang Berlangsung"

    if (daysUntil > 0 && daysUntil <= 7) {
      iconBg = "bg-amber-500"
      statusBg = "bg-amber-100 text-amber-700"
      statusText = `${daysUntil} hari lagi`
    } else if (daysUntil > 7) {
      iconBg = "bg-blue-500"
      statusBg = "bg-blue-100 text-blue-700"
      statusText = `${Math.ceil(daysUntil / 7)} minggu lagi`
    } else if (daysUntil < 0) {
      bgColor = "from-slate-50 to-slate-100"
      borderColor = "border-slate-200"
      iconBg = "bg-slate-500"
      textColor = "text-slate-900"
      statusText = "Sudah Berlalu"
    }

    const dateToFormat = reminder?.tanggalMulai || reminder?.tanggal
    const formatted = new Date(dateToFormat).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    setFormattedDate(formatted)
    setDaysStatus({
      daysUntil,
      bgColor,
      borderColor,
      iconBg,
      textColor,
      statusText,
      statusBg,
    } as any)
  }, [reminder, mounted])

  const MiniCalendar = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

    return (
      <div className="mt-6 pt-6 border-t border-white border-opacity-20">
        <p className="text-sm font-bold mb-4 text-[#D0B064]">
          {monthNames[currentMonth]} {currentYear}
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-bold text-[#D0B064] opacity-80">
                {day}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`
                      text-center text-xs p-2 rounded-lg font-semibold transition-all
                      ${day ? "cursor-pointer hover:bg-[#D0B064] hover:bg-opacity-30" : ""}
                      ${day === today.getDate() && currentMonth === today.getMonth()
                        ? "bg-[#D0B064] text-[#1B263A] font-bold shadow-md"
                        : day
                          ? "bg-[#D0B064] bg-opacity-30 text-white"
                          : "transparent"
                      }
                    `}
                  >
                    {day}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!mounted || !reminder) {
    return (
      <div className={`rounded-2xl p-6 shadow-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-300`}>
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl flex-shrink-0 bg-slate-400">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-4 text-slate-700">Jadwal Pengiriman</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <p>📅 Tanggal: -</p>
              <p>⏱️ Status: Menunggu data</p>
              <p>📍 Lokasi: -</p>
            </div>
          </div>
        </div>
        <MiniCalendar />
      </div>
    )
  }

  return (
    <div
      className={`${daysStatus.bgColor} border ${daysStatus.borderColor} rounded-2xl p-6 md:p-8 shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-4 ${daysStatus.iconBg} rounded-2xl flex-shrink-0 shadow-lg shadow-slate-200`}>
          {daysStatus.daysUntil <= 7 && daysStatus.daysUntil > 0 ? (
            <Bell className="w-6 h-6 text-white" />
          ) : (
            <Calendar className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${daysStatus.statusBg} mb-3`}>
            {daysStatus.statusText}
          </div>
          <h3 className={`font-bold text-xl md:text-2xl ${daysStatus.textColor} mb-2 line-clamp-2`}>
            {reminder.deskripsi || reminder.namaSekolah || "Jadwal Pengiriman"}
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className={`${daysStatus.textColor}`}>{formattedDate}</span>
            </div>

            <div className={`font-bold text-lg ${daysStatus.textColor}`}>{daysStatus.statusText}</div>

            {reminder.status && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className={daysStatus.textColor}>Status: {reminder.status}</span>
              </div>
            )}

            {reminder.alamat && (
              <div className="flex items-start gap-2 pt-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                <span className="text-slate-600 line-clamp-2">{reminder.alamat}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <MiniCalendar />
      </div>

      {/* Upcoming Events Section */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-sm font-bold mb-4 text-slate-700">📌 Event Mendatang</p>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {reminder?.events && reminder.events.length > 0 ? (
            reminder.events
              .map((event: any) => {
                const parsedDate = parseDate(event.tanggal || event.tanggalMulai || event.date)
                return { event, parsedDate }
              })
              .filter((item: { event: any; parsedDate: Date | null }) => {
                // Filter hanya event yang tanggalnya >= hari ini
                if (!item.parsedDate) return false
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                // Buat copy date agar tidak mutasi aslinya saat pengecekan
                const checkDate = new Date(item.parsedDate)
                checkDate.setHours(0, 0, 0, 0)
                return checkDate >= today
              })
              .slice(0, 10)
              .map((item: { event: any; parsedDate: Date | null }, idx: number) => {
                const { event, parsedDate } = item
                const eventDisplayDate = parsedDate
                  ? parsedDate.toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric"
                  })
                  : "Tanggal tidak valid"

                return (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{event.nama || event.deskripsi || "Event"}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {eventDisplayDate}
                      </p>
                    </div>
                  </div>
                )
              })
          ) : (
            <p className="text-xs text-slate-500">Tidak ada event mendatang</p>
          )}
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <p className="text-sm font-bold mb-4 text-slate-700">📞 Info Kontak</p>
        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <span className="text-lg">📍</span>
            <span className="font-medium">Lokasi: {reminder?.alamat || "Tidak tersedia"}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <span className="text-lg">📋</span>
            <span className="font-medium">Status: {reminder?.status || "Aktif"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const DashboardSekolah = () => {
  const hasInitialized = useRef(false)

  // ✅ State untuk dashboard data
  const [stats, setStats] = useState({
    totalSiswa: 0,
    normalGizi: 0,
    giziKurang: 0,
    stuntingRisiko: 0,
    hadirHariIni: 0,
    pengirimanSelesai: 0,
    totalPengiriman: 0,
    sudahMakan: 0,
    totalKelas: 0,
    rataGizi: 0,
    statusPengiriman: "",
  })
  const [kelasList, setKelasList] = useState<any[]>([])
  const [kalenderReminder, setKalenderReminder] = useState<any>(null)
  const [siswaDiagram, setSiswaDiagram] = useState([
    { name: "Normal", value: 0 },
    { name: "Kurang", value: 0 },
    { name: "Risiko Stunting", value: 0 },
    { name: "Berlebih", value: 0 },
  ])
  const [absensiChart, setAbsensiChart] = useState([
    { hari: "Senin", hadir: 0, tidakHadir: 0 },
    { hari: "Selasa", hadir: 0, tidakHadir: 0 },
    { hari: "Rabu", hadir: 0, tidakHadir: 0 },
    { hari: "Kamis", hadir: 0, tidakHadir: 0 },
    { hari: "Jumat", hadir: 0, tidakHadir: 0 },
  ])
  const [menuHariIni, setMenuHariIni] = useState<any>(null)
  const [invitations, setInvitations] = useState<any[]>([])

  // ✅ Callback ketika unified cache ter-update dari page lain (instant sync!)
  const handleCacheUpdate = useCallback((cachedData: any) => {
    console.log("🔄 [DASHBOARD] Received cache update from unified cache - updating state instantly!")
    console.log("[DASHBOARD] Full cachedData:", cachedData)
    console.log("[DASHBOARD] absensiChartData:", cachedData?.absensiChartData)

    // Compute aggregates from unified cache data
    const siswaData = cachedData.siswaData || []
    const kelasData = cachedData.kelasData || []

    // Calculate gizi stats
    const totalSiswa = siswaData.length
    const normalGizi = siswaData.filter((s: any) => s.statusGizi === "NORMAL").length || 0
    const giziKurang = siswaData.filter((s: any) => s.statusGizi === "GIZI_KURANG").length || 0
    const giziBuruk = siswaData.filter((s: any) => s.statusGizi === "GIZI_BURUK").length || 0
    const obesitas = siswaData.filter((s: any) => s.statusGizi === "OBESITAS").length || 0
    const rataGizi = totalSiswa > 0 ? Math.round((normalGizi / totalSiswa) * 100) : 0

    // Compute attendance stats from actual class data
    const attendanceSum = kelasData.reduce((acc: number, k: any) => acc + (k.hadirHariIni || 0), 0)

    // ✅ FALLBACK 1: Use totalPickupToday if attendance module hasn't been used yet but students have taken food
    // ✅ FALLBACK 2: Use matching day from chart data if current school stats are lagging
    const todayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date().getDay()]
    const chartToday = cachedData.absensiChartData?.find((d: any) => d.hari === todayName)?.hadir || 0

    const hadirHariIni = Math.max(attendanceSum, cachedData.totalPickupToday || 0, chartToday)

    // Also compute already eaten count - currently same as hadir (since pickup = present)
    const sudahMakan = hadirHariIni

    const realPengiriman = cachedData.pengirimanData?.jumlahTray || 0
    const statusPengiriman = cachedData.pengirimanData?.status
    const pengirimanSelesai = statusPengiriman === 'TELAH_SAMPAI' ? realPengiriman : 0

    setStats({
      totalSiswa,
      normalGizi,
      giziKurang,
      stuntingRisiko: giziBuruk,
      hadirHariIni,
      pengirimanSelesai,
      totalPengiriman: realPengiriman,
      statusPengiriman,
      sudahMakan,
      totalKelas: kelasData.length,
      rataGizi,
    })

    setKelasList(kelasData)
    setKalenderReminder(cachedData.kalenderReminder || null)

    // Compute gizi diagram
    setSiswaDiagram([
      { name: "Normal", value: normalGizi },
      { name: "Kurang", value: giziKurang },
      { name: "Risiko Stunting", value: giziBuruk },
      { name: "Berlebih", value: obesitas },
    ])

    // ✅ Use attendance chart from absensi endpoint (fresh data from API)
    console.log("[DASHBOARD] Checking absensiChartData - is array?", Array.isArray(cachedData.absensiChartData))
    console.log("[DASHBOARD] absensiChartData length:", cachedData.absensiChartData?.length)

    if (Array.isArray(cachedData.absensiChartData) && cachedData.absensiChartData.length > 0) {
      console.log("[DASHBOARD] ✅ Using absensiChartData from cache - synchronizing with totalSiswa:", totalSiswa)

      // Force chart to sum up to totalSiswa
      const synchronizedChart = cachedData.absensiChartData.map((day: any, index: number) => {
        // Ambil hari ini (0=Minggu, 1=Senin... 4=Kamis, 5=Jumat)
        const now = new Date()
        const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000))
        let todayIdx = wibTime.getUTCDay()
        if (todayIdx === 0) todayIdx = 7 // Minggu jadi 7

        // Map index chart (0=Senin, 1=Selasa, 2=Rabu, 3=Kamis, 4=Jumat)
        const chartDayIdx = index + 1 // Senin = 1, Jumat = 5
        const isFuture = chartDayIdx > todayIdx

        return {
          ...day,
          // Jika masa depan, paksa 0. Jika hari ini atau masa lalu, paksa totalSiswa.
          hadir: isFuture ? 0 : (day.hadir || 0),
          tidakHadir: (totalSiswa > 0 && !isFuture)
            ? Math.max(0, totalSiswa - (day.hadir || 0))
            : 0
        }
      })

      setAbsensiChart(synchronizedChart)
    } else {
      console.log("[DASHBOARD] ⚠️ No absensiChartData, using fallback")
      // Fallback if no chart data
      setAbsensiChart([
        { hari: "Senin", hadir: 0, tidakHadir: 0 },
        { hari: "Selasa", hadir: 0, tidakHadir: 0 },
        { hari: "Rabu", hadir: 0, tidakHadir: 0 },
        { hari: "Kamis", hadir: 0, tidakHadir: 0 },
        { hari: "Jumat", hadir: 0, tidakHadir: 0 },
      ])
    }

    setMenuHariIni(cachedData.menuHariIni || null)
    setInvitations(cachedData.invitations || [])
    console.log("[DASHBOARD] ✅ State updated from cache. Invitations count:", (cachedData.invitations || []).length)
  }, [])

  const { loading, error, loadData, refreshData } = useSekolahDataCache(handleCacheUpdate)

  const [credentialsReady, setCredentialsReady] = useState(false)

  // ✅ EFFECT 1: Wait for sekolahId to be available
  useEffect(() => {
    if (typeof window === "undefined") return
    if (credentialsReady) return // Skip if already ready

    const token = localStorage.getItem("authToken")
    const schoolId = localStorage.getItem("sekolahId")

    console.log("[DASHBOARD] Check credentials - token:", token ? "EXISTS" : "MISSING", "schoolId:", schoolId ? "EXISTS" : "MISSING")

    if (!token) {
      console.error("[DASHBOARD] ❌ Token not found")
      return
    }

    if (schoolId) {
      // Both credentials are ready!
      console.log("[DASHBOARD] ✅ Both credentials ready, setting flag")
      setCredentialsReady(true)
      return
    }

    // sekolahId not ready, set up polling
    console.log("[DASHBOARD] sekolahId not ready, waiting for SekolahLayout...")
    const pollInterval = setInterval(() => {
      const newSchoolId = localStorage.getItem("sekolahId")
      if (newSchoolId) {
        console.log("[DASHBOARD] ✅ sekolahId detected:", newSchoolId)
        clearInterval(pollInterval)
        setCredentialsReady(true) // This will trigger EFFECT 2
      }
    }, 1000)

    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      console.error("[DASHBOARD] ❌ sekolahId timeout after 10s")
    }, 10000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [credentialsReady])

  // ✅ EFFECT 2: Fetch data when credentials are ready
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!credentialsReady) {
      console.log("[DASHBOARD EFFECT 2] Waiting for credentialsReady flag...")
      return
    }

    const token = localStorage.getItem("authToken")
    const schoolId = localStorage.getItem("sekolahId")

    // Double-check both are available
    if (!token || !schoolId) {
      console.error("[DASHBOARD EFFECT 2] ❌ Missing credentials even though flag is true!")
      return
    }

    if (hasInitialized.current) {
      console.log("[DASHBOARD EFFECT 2] Already initialized, skipping")
      return
    }

    const fetchAllData = async () => {
      try {
        hasInitialized.current = true
        const cachedData = await loadData(schoolId, token)

        if (cachedData) {
          // Use the callback to update state (it handles all the aggregations)
          handleCacheUpdate(cachedData)
          console.log("✅ [DASHBOARD] Data loaded successfully from unified cache")
        }
      } catch (err) {
        console.error("❌ [DASHBOARD] Error loading data:", err)
      }
    }

    fetchAllData()

    // ✅ Function to fetch and update reminder data
    const fetchReminderUpdate = async () => {
      try {
        console.log("[REMINDER POLLING] Fetching fresh reminder data from kalender akademik...")
        const reminderResponse = await fetch(`${API_BASE_URL}/api/kalender-akademik`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (reminderResponse.ok) {
          const kalenderData = await reminderResponse.json()

          // Parse kalender data (same logic as in useSekolahDataCache)
          let kalenders = []
          if (kalenderData.data?.kalenders && Array.isArray(kalenderData.data.kalenders)) {
            kalenders = kalenderData.data.kalenders
          } else if (kalenderData.kalenders && Array.isArray(kalenderData.kalenders)) {
            kalenders = kalenderData.kalenders
          } else if (Array.isArray(kalenderData.data)) {
            kalenders = kalenderData.data
          } else if (Array.isArray(kalenderData)) {
            kalenders = kalenderData
          }

          // Find upcoming event (same logic as in useSekolahDataCache)
          const sortedKalenders = kalenders.sort((a: any, b: any) => {
            const dateA = new Date(a.tanggalMulai).getTime()
            const dateB = new Date(b.tanggalMulai).getTime()
            return dateA - dateB
          })

          let updatedReminder = null
          if (sortedKalenders.length > 0) {
            const upcomingEvent =
              sortedKalenders.find((k: any) => {
                const eventDate = new Date(k.tanggalMulai)
                return eventDate >= new Date()
              }) || sortedKalenders[0]

            if (upcomingEvent) {
              updatedReminder = {
                tanggalMulai: upcomingEvent.tanggalMulai,
                deskripsi: upcomingEvent.deskripsi || "Kegiatan akademik",
                status: "scheduled",
                events: sortedKalenders.slice(0, 10), // Include upcoming events
              }
            }
          }

          if (updatedReminder) {
            setKalenderReminder(updatedReminder)
            console.log("[REMINDER POLLING] ✅ Reminder updated:", updatedReminder)
          } else {
            console.log("[REMINDER POLLING] ℹ️ No upcoming events found")
          }
        }
      } catch (err) {
        console.warn("[REMINDER POLLING] ⚠️ Failed to fetch reminder:", err)
      }
    }

    // ✅ Fetch reminder immediately first
    setTimeout(() => {
      fetchReminderUpdate()
    }, 500) // Small delay to ensure initial data is loaded

    // ✅ Setup polling for reminder data (reduced from 15s to 60s for better performance)
    const pollReminderData = setInterval(fetchReminderUpdate, 60 * 1000) // Poll every 60 seconds (was 15s)

    return () => {
      clearInterval(pollReminderData)
    }
  }, [credentialsReady, loadData, handleCacheUpdate]) // Re-run when credentialsReady changes

  const handleApproveInvitation = async (dapurId: string) => {
    const schoolId = localStorage.getItem("sekolahId")
    const token = localStorage.getItem("authToken")
    if (!schoolId || !token) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/approve-dapur/${dapurId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "APPROVED" }),
      })

      if (res.ok) {
        alert("Undangan disetujui!")
        // Update local state and cache
        const updatedInvitations = invitations.filter((inv: any) => inv.dapurId !== dapurId)
        setInvitations(updatedInvitations)
        // Force refresh all data to sync Sekolah-Dapur link and clear processed invitations from cache
        refreshData(schoolId, token)
      } else {
        const data = await res.json()
        alert("Gagal menyetujui: " + (data.message || "Error unknown"))
      }
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan")
    }
  }

  const handleRejectInvitation = async (dapurId: string) => {
    if (!window.confirm("Tolak undangan ini?")) return

    const schoolId = localStorage.getItem("sekolahId")
    const token = localStorage.getItem("authToken")
    if (!schoolId || !token) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/approve-dapur/${dapurId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "REJECTED" }),
      })

      if (res.ok) {
        alert("Undangan ditolak")
        const updatedInvitations = invitations.filter((inv: any) => inv.dapurId !== dapurId)
        setInvitations(updatedInvitations)
        // Force refresh all data to clear processed invitations from cache
        refreshData(schoolId, token)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <SekolahLayout currentPage="dashboard">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-72 bg-gray-100 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChartContainer />
            <SkeletonChartContainer />
          </div>
        </div>
      </SekolahLayout>
    )
  }

  if (error && typeof window !== "undefined" && !localStorage.getItem("authToken")) {
    return (
      <SekolahLayout currentPage="dashboard">
        <div className="flex items-center gap-3 p-4 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{error}</p>
            <p className="text-xs text-gray-500">Silakan login terlebih dahulu</p>
          </div>
        </div>
      </SekolahLayout>
    )
  }

  return (
    <SekolahLayout currentPage="dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Sekolah</h1>
            <p className="text-sm text-gray-500 mt-1">Monitoring distribusi makanan & status gizi siswa</p>
          </div>
          <button
            onClick={() => {
              const schoolId = localStorage.getItem("sekolahId")
              const token = localStorage.getItem("authToken")
              if (schoolId && token) refreshData(schoolId, token)
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Menu Harian - Clean card */}
        {menuHariIni && (
          <div className="border border-[#1B263A]/15 rounded-xl p-5 bg-white">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Menu Hari Ini</p>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{menuHariIni.namaMenu || "-"}</h2>
            <p className="text-sm text-gray-500 mb-4">{menuHariIni.menuPlanning?.sekolah?.nama || "Sekolah"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Kalori</p>
                <p className="text-lg font-bold text-gray-900">{menuHariIni.kalori || 0} <span className="text-xs font-normal text-gray-400">kcal</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Protein</p>
                <p className="text-lg font-bold text-gray-900">{menuHariIni.protein || 0} <span className="text-xs font-normal text-gray-400">g</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Biaya/Tray</p>
                <p className="text-sm font-bold text-gray-900">Rp {menuHariIni.biayaPerTray?.toLocaleString("id-ID") || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Waktu Masak</p>
                <p className="text-sm font-bold text-gray-900">{menuHariIni.jamMulaiMasak} - {menuHariIni.jamSelesaiMasak}</p>
              </div>
            </div>
          </div>
        )}

        {/* Undangan Masuk */}
        {invitations.length > 0 && (
          <div className="border border-[#D0B064]/30 rounded-xl p-5 bg-white">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D0B064]" />
              Undangan Kerjasama Dapur ({invitations.length})
            </h3>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv.dapurId} className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{inv.dapur?.nama || "Dapur MBG"}</p>
                    <p className="text-xs text-gray-500 truncate">{inv.dapur?.alamat || "Alamat tidak tersedia"}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRejectInvitation(inv.dapurId)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => handleApproveInvitation(inv.dapurId)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1B263A] text-white hover:bg-[#2A3749] transition-colors"
                    >
                      Setujui
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stat Cards - Clean grid with borders */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 border border-gray-100 rounded-xl p-5 bg-white">
          <StatCard title="Total Siswa" value={stats.totalSiswa} subtitle="Semua siswa aktif" icon={Users} color="bg-[#1B263A]" />
          <StatCard title="Gizi Normal" value={stats.normalGizi} subtitle="Status optimal" icon={Heart} color="bg-[#D0B064]" />
          <StatCard title="Hadir Hari Ini" value={stats.hadirHariIni} subtitle="Siswa hadir" icon={CheckCircle} color="bg-[#1B263A]" />
          <StatCard title="Gizi Kurang" value={stats.giziKurang} subtitle="Perlu intervensi" icon={AlertCircle} color="bg-[#D0B064]" />
          <StatCard title="Risiko Stunting" value={stats.stuntingRisiko} subtitle="Monitoring ketat" icon={AlertTriangle} color="bg-red-500" />
        </div>

        {/* Kalender + Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Kalender Reminder */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <KalenderReminder reminder={kalenderReminder} />
          </div>

          {/* Right: Charts */}
          <div className="lg:col-span-7 flex flex-col gap-6 h-full">
            <div className="border border-gray-100 rounded-xl p-5 bg-white flex flex-col flex-1">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Absensi Minggu Ini</h3>
              <div className="flex-1 min-h-[240px]">
                <AttendanceChart data={absensiChart} />
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl p-5 bg-white flex flex-col flex-1">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Distribusi Status Gizi</h3>
              <div className="flex-1 min-h-[240px]">
                <GiziDistributionChart data={siswaDiagram} />
              </div>
            </div>
          </div>
        </div>

        {/* Kelas Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Data Kelas</h3>
            <button className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors">
              Lihat Semua
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {kelasList.length > 0 ? (
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Siswa</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">L</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">P</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Alergi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kelasList.slice(0, 10).map((kelas: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">{kelas.nama}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 font-medium">{kelas.totalSiswa || 0}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{kelas.lakiLaki || 0}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{kelas.perempuan || 0}</td>
                      <td className="py-3 px-4">
                        {kelas.alergiCount > 0 ? (
                          <span className="text-xs font-semibold text-red-600">{kelas.alergiCount} siswa</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">Data kelas tidak tersedia</p>
            </div>
          )}
        </div>
      </div>
    </SekolahLayout>
  )
}

export default DashboardSekolah