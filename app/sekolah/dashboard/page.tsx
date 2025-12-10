"use client"

import { useState, useEffect, memo, useRef } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { useSekolahDataCache } from "@/lib/hooks/useSekolahDataCache"
import {
  Users,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Calendar,
  Bell,
  Clock,
  Truck,
  Heart,
  AlertTriangle,
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
  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse">
    <div className="h-10 w-10 bg-slate-300 rounded-xl mb-3"></div>
    <div className="h-3 w-24 bg-slate-300 rounded mb-2"></div>
    <div className="h-8 w-16 bg-slate-400 rounded mb-2"></div>
    <div className="h-3 w-20 bg-slate-300 rounded"></div>
  </div>
)

const SkeletonChartContainer = () => (
  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 animate-pulse">
    <div className="h-7 w-32 bg-slate-300 rounded-lg mb-4"></div>
    <div className="w-full h-64 bg-slate-200 rounded-xl"></div>
  </div>
)

const SkeletonTableRow = () => (
  <tr className="border-b border-slate-200">
    <td className="py-4 px-4">
      <div className="h-4 w-20 bg-slate-300 rounded animate-pulse"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 w-24 bg-slate-300 rounded animate-pulse"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 w-16 bg-slate-300 rounded animate-pulse"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 w-12 bg-slate-300 rounded animate-pulse"></div>
    </td>
  </tr>
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
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
        <p className="text-slate-600">Belum ada data absensi minggu ini</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <defs>
          <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="colorTidak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="hari" stroke="#64748b" style={{ fontSize: "12px" }} />
        <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }}
          cursor={{ fill: "rgba(15, 23, 42, 0.05)" }}
        />
        <Legend />
        <Bar dataKey="hadir" fill="url(#colorHadir)" name="Hadir" radius={[8, 8, 0, 0]} />
        <Bar dataKey="tidakHadir" fill="url(#colorTidak)" name="Tidak Hadir" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
})

AttendanceChart.displayName = "AttendanceChart"

const StatCard = memo(({ title, value, subtitle, icon: Icon, color, trend }: any) => (
  <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
    <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
    <p className="text-xs text-slate-500">{subtitle}</p>
  </div>
))

const KalenderReminder = ({ reminder }: { reminder: any }) => {
  const [mounted, setMounted] = useState(false)
  const [formattedDate, setFormattedDate] = useState("")
  const [daysStatus, setDaysStatus] = useState({
    daysUntil: 0,
    bgColor: "from-green-50 to-green-100",
    borderColor: "border-green-200",
    iconBg: "bg-green-500",
    textColor: "text-green-900",
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

    let bgColor = "from-green-50 to-green-100"
    let borderColor = "border-green-200"
    let iconBg = "bg-green-500"
    let textColor = "text-green-900"
    let statusText = "Sedang Berlangsung"

    if (daysUntil > 0 && daysUntil <= 7) {
      bgColor = "from-yellow-50 to-yellow-100"
      borderColor = "border-yellow-200"
      iconBg = "bg-yellow-500"
      textColor = "text-yellow-900"
      statusText = `${daysUntil} hari lagi`
    } else if (daysUntil > 7) {
      bgColor = "from-blue-50 to-blue-100"
      borderColor = "border-blue-200"
      iconBg = "bg-blue-500"
      textColor = "text-blue-900"
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
    })
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
                      ${
                        day === today.getDate() && currentMonth === today.getMonth()
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
      className={`bg-gradient-to-r ${daysStatus.bgColor} border ${daysStatus.borderColor} rounded-2xl p-6 shadow-lg`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 ${daysStatus.iconBg} rounded-xl flex-shrink-0`}>
          {daysStatus.daysUntil <= 7 && daysStatus.daysUntil > 0 ? (
            <Bell className="w-6 h-6 text-white" />
          ) : (
            <Calendar className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-2xl ${daysStatus.textColor} mb-4`}>
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
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className={daysStatus.textColor}>{reminder.alamat}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <MiniCalendar />

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
              .filter(({ parsedDate }) => {
                // Filter hanya event yang tanggalnya >= hari ini
                if (!parsedDate) return false
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                parsedDate.setHours(0, 0, 0, 0)
                return parsedDate >= today
              })
              .slice(0, 10)
              .map(({ event, parsedDate }, idx: number) => {
                const formattedDate = parsedDate
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
                        {formattedDate}
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

  // ✅ Callback ketika unified cache ter-update dari page lain (instant sync!)
  const handleCacheUpdate = (cachedData: any) => {
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

    // Compute attendance stats (simplified - using cached reminder)
    const hadirHariIni = Math.ceil(totalSiswa * 0.75) // Estimate based on total siswa

    setStats({
      totalSiswa,
      normalGizi,
      giziKurang,
      stuntingRisiko: giziBuruk,
      hadirHariIni,
      pengirimanSelesai: Math.floor(hadirHariIni * 0.8),
      totalPengiriman: 0,
      sudahMakan: hadirHariIni,
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
      console.log("[DASHBOARD] ✅ Using absensiChartData from cache:", cachedData.absensiChartData)
      setAbsensiChart(cachedData.absensiChartData)
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
  }

  const { loading, error, loadData } = useSekolahDataCache(handleCacheUpdate)

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

  if (loading) {
    return (
      <SekolahLayout currentPage="dashboard">
        <div className="space-y-6 p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
          <div>
            <div className="h-8 w-64 bg-slate-300 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-slate-300 rounded-lg animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChartContainer />
            <SkeletonChartContainer />
          </div>

          <SkeletonChartContainer />

          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
            <div className="h-6 w-32 bg-slate-300 rounded-lg mb-4 animate-pulse"></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <SkeletonTableRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SekolahLayout>
    )
  }

  if (error && typeof window !== "undefined" && !localStorage.getItem("authToken")) {
    return (
      <SekolahLayout currentPage="dashboard">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 m-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">{error}</p>
            <p className="text-sm text-red-700">Silakan login terlebih dahulu</p>
          </div>
        </div>
      </SekolahLayout>
    )
  }

  return (
    <SekolahLayout currentPage="dashboard">
      <div className="space-y-8 p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">Dashboard PIC Sekolah</h1>
          <p className="text-slate-600 text-base md:text-lg">Monitoring Distribusi Makanan Bergizi & Status Gizi Siswa</p>
        </div>

        {/* Menu Harian Card */}
        {menuHariIni && (
          <div className="bg-gradient-to-r from-[#1B263A] to-[#243B55] rounded-2xl p-6 md:p-8 text-white shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Menu Info */}
              <div className="md:col-span-2">
                <p className="text-xs md:text-sm font-semibold opacity-90 tracking-widest uppercase">Menu Hari Ini</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-2 mt-3">{menuHariIni.namaMenu || "-"}</h2>
                <p className="text-sm md:text-base opacity-90">{menuHariIni.menuPlanning?.sekolah?.nama || "Sekolah"}</p>
              </div>

              {/* Menu Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1B263A] bg-opacity-90 rounded-lg p-4">
                  <p className="text-xs opacity-90 mb-2">Kalori</p>
                  <p className="text-2xl md:text-3xl font-bold">{menuHariIni.kalori || 0}</p>
                  <p className="text-xs opacity-75">kcal</p>
                </div>
                <div className="bg-[#1B263A] bg-opacity-90 rounded-lg p-4">
                  <p className="text-xs opacity-90 mb-2">Protein</p>
                  <p className="text-2xl md:text-3xl font-bold">{menuHariIni.protein || 0}</p>
                  <p className="text-xs opacity-75">g</p>
                </div>
                <div className="bg-[#1B263A] bg-opacity-90 rounded-lg p-4">
                  <p className="text-xs opacity-90 mb-2">Biaya/Tray</p>
                  <p className="text-sm md:text-base font-bold">Rp {menuHariIni.biayaPerTray?.toLocaleString("id-ID") || 0}</p>
                </div>
                <div className="bg-[#1B263A] bg-opacity-90 rounded-lg p-4">
                  <p className="text-xs opacity-90 mb-2">Waktu</p>
                  <p className="text-xs md:text-sm font-bold">{menuHariIni.jamMulaiMasak} - {menuHariIni.jamSelesaiMasak}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAT CARDS GRID - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            title="Total Siswa"
            value={stats.totalSiswa}
            subtitle="Semua siswa aktif"
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Gizi Normal"
            value={stats.normalGizi}
            subtitle="Status optimal"
            icon={Heart}
            color="bg-green-500"
          />
          <StatCard
            title="Hadir Hari Ini"
            value={stats.hadirHariIni}
            subtitle="Siswa hadir"
            icon={CheckCircle}
            color="bg-emerald-500"
          />
          <StatCard
            title="Pengiriman Selesai"
            value={stats.pengirimanSelesai}
            subtitle="Porsi dikirim"
            icon={Truck}
            color="bg-orange-500"
          />
          <StatCard
            title="Gizi Kurang"
            value={stats.giziKurang}
            subtitle="Perlu intervensi"
            icon={AlertCircle}
            color="bg-yellow-500"
          />
          <StatCard
            title="Risiko Stunting"
            value={stats.stuntingRisiko}
            subtitle="Monitoring ketat"
            icon={AlertTriangle}
            color="bg-red-500"
          />
        </div>

        {/* Kalender + Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Kalender Reminder - Full Height */}
          <div className="flex flex-col">
            <KalenderReminder reminder={kalenderReminder} />
          </div>

          {/* Right: Charts */}
          <div className="space-y-8">
            {/* Absensi Chart */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
              <h3 className="text-base md:text-lg font-bold text-slate-900 mb-6">📊 Absensi Minggu Ini</h3>
              <AttendanceChart data={absensiChart} />
            </div>

            {/* Distribusi Gizi Chart */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
              <h3 className="text-base md:text-lg font-bold text-slate-900 mb-6">🍎 Distribusi Status Gizi</h3>
              <GiziDistributionChart data={siswaDiagram} />
            </div>
          </div>
        </div>

        {/* Kelas Table */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base md:text-lg font-bold text-slate-900">📚 Data Kelas</h3>
            <button className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors">
              Lihat Semua
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {kelasList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-5 px-5 text-xs md:text-sm font-bold text-slate-700">Kelas</th>
                    <th className="text-left py-5 px-5 text-xs md:text-sm font-bold text-slate-700">Total Siswa</th>
                    <th className="text-left py-5 px-5 text-xs md:text-sm font-bold text-slate-700">Laki-laki</th>
                    <th className="text-left py-5 px-5 text-xs md:text-sm font-bold text-slate-700">Perempuan</th>
                    <th className="text-left py-5 px-5 text-xs md:text-sm font-bold text-slate-700">Alergi</th>
                  </tr>
                </thead>
                <tbody>
                  {kelasList.slice(0, 10).map((kelas: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="py-5 px-5 text-sm font-semibold text-slate-900">{kelas.nama}</td>
                      <td className="py-5 px-5 text-sm text-slate-700 font-medium">{kelas.totalSiswa || 0}</td>
                      <td className="py-5 px-5 text-sm text-slate-600">{kelas.lakiLaki || 0}</td>
                      <td className="py-5 px-5 text-sm text-slate-600">{kelas.perempuan || 0}</td>
                      <td className="py-5 px-5">
                        {kelas.alergiCount > 0 ? (
                          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 inline-block">
                            {kelas.alergiCount} siswa
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                    
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
              <p className="text-yellow-800 font-medium">Data kelas tidak tersedia</p>
            </div>
          )}
        </div>
      </div>
    </SekolahLayout>
  )
}

export default DashboardSekolah