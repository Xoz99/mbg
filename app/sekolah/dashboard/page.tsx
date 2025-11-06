"use client"

import { useState, useEffect, memo, useCallback, useRef } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
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
  UtensilsCrossed,
  Heart,
  AlertTriangle,
  BookOpen,
  Plus,
} from "lucide-react"
import {
  LineChart,
  Line,
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://demombgv1.xyz"

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

const AttendanceChart = memo(({ data }: { data: any[] }) => (
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
))

AttendanceChart.displayName = "AttendanceChart"

const ConsumptionChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={280}>
    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
      <defs>
        <linearGradient id="colorPorsi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#1B263A" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#1B263A" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="hari" stroke="#64748b" style={{ fontSize: "12px" }} />
      <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }} />
      <Line
        type="monotone"
        dataKey="porsi"
        stroke="#D0B064"
        strokeWidth={3}
        dot={{ fill: "#D0B064", r: 6, strokeWidth: 2, stroke: "#1B263A" }}
        activeDot={{ r: 8 }}
        isAnimationActive={true}
      />
    </LineChart>
  </ResponsiveContainer>
))

ConsumptionChart.displayName = "ConsumptionChart"

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
    </div>
  )
}

const DashboardSekolah = () => {
  const hasInitialized = useRef(false)
  const fetchInProgress = useRef(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
  const [siswaList, setSiswaList] = useState([])
  const [kelasList, setKelasList] = useState([])
  const [kalenderReminder, setKalenderReminder] = useState(null)
  const [kalenderList, setKalenderList] = useState([])
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
  const [konsumsiHarian, setKonsumsiHarian] = useState([
    { hari: "Senin", porsi: 0 },
    { hari: "Selasa", porsi: 0 },
    { hari: "Rabu", porsi: 0 },
    { hari: "Kamis", porsi: 0 },
    { hari: "Jumat", porsi: 0 },
  ])
  const [menuHariIni, setMenuHariIni] = useState<any>(null)

  // ✅ REFACTORED: Return data instead of setState
  const fetchSiswaDataReturn = useCallback(async (schoolId: string, token: string) => {
    try {
      console.time("fetchSiswa")
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/siswa?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) return { siswa: [], gizi: { normal: 0, kurang: 0, buruk: 0, obesitas: 0 } }
        throw new Error(`HTTP ${response.status}: Gagal fetch siswa`)
      }

      const data = await response.json()
      const siswaData = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : []

      const normalGizi = siswaData.filter((s: any) => s.statusGizi === "NORMAL").length || 0
      const giziKurang = siswaData.filter((s: any) => s.statusGizi === "GIZI_KURANG").length || 0
      const giziBuruk = siswaData.filter((s: any) => s.statusGizi === "GIZI_BURUK").length || 0
      const obesitas = siswaData.filter((s: any) => s.statusGizi === "OBESITAS").length || 0

      console.timeEnd("fetchSiswa")
      return {
        siswa: siswaData,
        gizi: { normal: normalGizi, kurang: giziKurang, buruk: giziBuruk, obesitas },
      }
    } catch (err) {
      console.error("Error fetching siswa:", err)
      return { siswa: [], gizi: { normal: 0, kurang: 0, buruk: 0, obesitas: 0 } }
    }
  }, [])

  // ✅ REFACTORED: Return data instead of setState
  const fetchKelasDataReturn = useCallback(async (schoolId: string, token: string) => {
    try {
      console.time("fetchKelas")
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/kelas?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) return []
        throw new Error(`HTTP ${response.status}: Gagal fetch kelas`)
      }

      const data = await response.json()
      let kelasData = []
      if (Array.isArray(data.data?.data)) {
        kelasData = data.data.data
      } else if (Array.isArray(data.data)) {
        kelasData = data.data
      } else if (Array.isArray(data)) {
        kelasData = data
      }

      let siswaArray: any[] = []
      try {
        const siswaRes = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/siswa?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (siswaRes.ok) {
          const siswaData = await siswaRes.json()
          siswaArray = Array.isArray(siswaData.data?.data)
            ? siswaData.data.data
            : Array.isArray(siswaData.data)
              ? siswaData.data
              : []
        }
      } catch (err) {
        console.error("Siswa fetch error:", err)
      }

      const siswaPerKelas: { [key: string]: { laki: number; perempuan: number; alergi: number } } = {}

      siswaArray.forEach((siswa: any) => {
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

      kelasData = kelasData.map((kelas: any) => ({
        ...kelas,
        totalSiswa:
          (siswaPerKelas[kelas.id]?.laki || 0) + (siswaPerKelas[kelas.id]?.perempuan || 0) || kelas.totalSiswa || 0,
        lakiLaki: siswaPerKelas[kelas.id]?.laki || kelas.lakiLaki || 0,
        perempuan: siswaPerKelas[kelas.id]?.perempuan || kelas.perempuan || 0,
        alergiCount: siswaPerKelas[kelas.id]?.alergi || kelas.alergiCount || 0,
      }))

      console.timeEnd("fetchKelas")
      return kelasData
    } catch (err) {
      console.error("Error fetching kelas:", err)
      return []
    }
  }, [])

  // ✅ REFACTORED: Return data instead of setState
  const fetchAbsensiDataReturn = useCallback(async (schoolId: string, token: string) => {
    try {
      console.time("fetchAbsensi")
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dayOfWeek = today.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

      const mondayDate = new Date(today)
      mondayDate.setDate(today.getDate() - daysToMonday)
      mondayDate.setHours(0, 0, 0, 0)

      const fridayDate = new Date(mondayDate)
      fridayDate.setDate(mondayDate.getDate() + 4)
      fridayDate.setHours(23, 59, 59, 999)

      const mondayString = mondayDate.toISOString().split("T")[0]
      const fridayString = fridayDate.toISOString().split("T")[0]
      const todayString = today.toISOString().split("T")[0]

      const kelasRes = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/kelas?page=1&limit=100`, { headers })

      if (!kelasRes.ok) {
        return {
          chart: [
            { hari: "Senin", hadir: 0, tidakHadir: 0 },
            { hari: "Selasa", hadir: 0, tidakHadir: 0 },
            { hari: "Rabu", hadir: 0, tidakHadir: 0 },
            { hari: "Kamis", hadir: 0, tidakHadir: 0 },
            { hari: "Jumat", hadir: 0, tidakHadir: 0 },
          ],
          hadirHariIni: 0,
        }
      }

      const kelasData = await kelasRes.json()
      const kelasList = Array.isArray(kelasData.data?.data)
        ? kelasData.data.data
        : Array.isArray(kelasData.data)
          ? kelasData.data
          : []

      const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
      const chartDataByDate: { [key: string]: { hari: string; hadir: number; tidakHadir: number } } = {}

      for (let i = 0; i < 5; i++) {
        const dateForDay = new Date(mondayDate)
        dateForDay.setDate(mondayDate.getDate() + i)
        const dateString = dateForDay.toISOString().split("T")[0]
        chartDataByDate[dateString] = {
          hari: daysOfWeek[i],
          hadir: 0,
          tidakHadir: 0,
        }
      }

      let totalHadirHariIni = 0

      // ✅ BATCH: Limit concurrent requests
      const batchSize = 3
      for (let i = 0; i < kelasList.length; i += batchSize) {
        const batch = kelasList.slice(i, i + batchSize)
        const absensiPromises = batch.map(async (kelas: any) => {
          try {
            const absenRes = await fetch(`${API_BASE_URL}/api/kelas/${kelas.id}/absensi`, { headers })

            if (!absenRes.ok) return 0

            const absenData = await absenRes.json()
            const absensiList = Array.isArray(absenData.data?.data)
              ? absenData.data.data
              : Array.isArray(absenData.data)
                ? absenData.data
                : []

            let hadirToday = 0

            for (const a of absensiList) {
              if (!a.tanggal) continue

              try {
                const eventDate = new Date(a.tanggal)
                eventDate.setHours(0, 0, 0, 0)
                const absenDateString = eventDate.toISOString().split("T")[0]

                if (absenDateString < mondayString || absenDateString > fridayString) continue

                if (chartDataByDate[absenDateString]) {
                  if (a.jumlahHadir !== undefined && a.jumlahHadir !== null) {
                    chartDataByDate[absenDateString].hadir += a.jumlahHadir
                  } else if (a.status === "hadir" || a.status === "Hadir" || a.status === "HADIR") {
                    chartDataByDate[absenDateString].hadir += 1
                  }

                  if (a.jumlahTidakHadir !== undefined && a.jumlahTidakHadir !== null) {
                    chartDataByDate[absenDateString].tidakHadir += a.jumlahTidakHadir
                  } else if (a.status === "tidak_hadir" || a.status === "Tidak Hadir" || a.status === "TIDAK_HADIR") {
                    chartDataByDate[absenDateString].tidakHadir += 1
                  }
                }

                if (absenDateString === todayString) {
                  if (a.jumlahHadir !== undefined && a.jumlahHadir !== null) {
                    hadirToday += a.jumlahHadir
                  } else if (a.status === "hadir" || a.status === "Hadir" || a.status === "HADIR") {
                    hadirToday += 1
                  }
                }
              } catch (e) {
                continue
              }
            }

            return hadirToday
          } catch (err) {
            return 0
          }
        })

        const hadirPerKelas = await Promise.all(absensiPromises)
        totalHadirHariIni += hadirPerKelas.reduce((sum, count) => sum + count, 0)
      }

      const chartData = Object.keys(chartDataByDate)
        .sort()
        .map((dateKey) => chartDataByDate[dateKey])

      console.timeEnd("fetchAbsensi")
      return { chart: chartData, hadirHariIni: totalHadirHariIni }
    } catch (err) {
      console.error("[ABSENSI] Error aggregating:", err)
      return {
        chart: [
          { hari: "Senin", hadir: 0, tidakHadir: 0 },
          { hari: "Selasa", hadir: 0, tidakHadir: 0 },
          { hari: "Rabu", hadir: 0, tidakHadir: 0 },
          { hari: "Kamis", hadir: 0, tidakHadir: 0 },
          { hari: "Jumat", hadir: 0, tidakHadir: 0 },
        ],
        hadirHariIni: 0,
      }
    }
  }, [])

  // ✅ REFACTORED: Return data instead of setState
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

  // ✅ REFACTORED: Return data instead of setState
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

  // ✅ REFACTORED: Return data instead of setState
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

  // ✅ MAIN EFFECT: Collect all data, then batch setState ONCE!
  useEffect(() => {
    if (hasInitialized.current) return
    if (typeof window === "undefined") return

    hasInitialized.current = true

    const token = localStorage.getItem("authToken")
    const schoolId = localStorage.getItem("sekolahId")

    if (!token || !schoolId) {
      setError("Token tidak ditemukan. Silakan login terlebih dahulu.")
      setLoading(false)
      return
    }

    const fetchAllData = async () => {
      if (fetchInProgress.current) return

      try {
        fetchInProgress.current = true
        console.log("🔄 [FETCH] Starting all data fetch...")
        console.time("Total Fetch Time")

        // ✅ COLLECT all data first (no setState yet!)
        const [siswaResult, kelasResult, absensiResult, pengirimanResult, kalenderResult, menuResult] =
          await Promise.all([
            fetchSiswaDataReturn(schoolId, token),
            fetchKelasDataReturn(schoolId, token),
            fetchAbsensiDataReturn(schoolId, token),
            fetchPengirimanDataReturn(schoolId, token),
            fetchKalenderAkademikReturn(token),
            fetchMenuHariIniReturn(token),
          ])

        // ✅ BATCH UPDATE: setState ONCE with all collected data!
        console.log("✅ [FETCH] All data collected, updating state...")

        // Update stats from siswa data
        const totalSiswa = siswaResult.siswa.length
        const rataGizi = totalSiswa > 0 ? Math.round((siswaResult.gizi.normal / totalSiswa) * 100) : 0

        setStats({
          totalSiswa,
          normalGizi: siswaResult.gizi.normal,
          giziKurang: siswaResult.gizi.kurang,
          stuntingRisiko: siswaResult.gizi.buruk,
          hadirHariIni: absensiResult.hadirHariIni,
          pengirimanSelesai: Math.floor(absensiResult.hadirHariIni * 0.8),
          totalPengiriman: 0,
          sudahMakan: absensiResult.hadirHariIni,
          totalKelas: kelasResult.length,
          rataGizi,
        })

        setSiswaList(siswaResult.siswa)
        setKelasList(kelasResult)
        setAbsensiChart(absensiResult.chart)
        setSiswaDiagram([
          { name: "Normal", value: siswaResult.gizi.normal },
          { name: "Kurang", value: siswaResult.gizi.kurang },
          { name: "Risiko Stunting", value: siswaResult.gizi.buruk },
          { name: "Berlebih", value: siswaResult.gizi.obesitas },
        ])

        if (pengirimanResult) {
          setKalenderReminder(pengirimanResult)
        }

        if (kalenderResult.reminder) {
          setKalenderReminder(kalenderResult.reminder)
        }
        setKalenderList(kalenderResult.list)

        if (menuResult) {
          setMenuHariIni(menuResult)
        }

        console.timeEnd("Total Fetch Time")
        console.log("✅ [FETCH] All state updated!")
      } catch (err) {
        console.error("❌ [FETCH] Error:", err)
        setError(err instanceof Error ? err.message : "Gagal memuat data")
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    }

    fetchAllData()
  }, [
    fetchSiswaDataReturn,
    fetchKelasDataReturn,
    fetchAbsensiDataReturn,
    fetchPengirimanDataReturn,
    fetchKalenderAkademikReturn,
    fetchMenuHariIniReturn,
  ])

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

  if (error && !localStorage.getItem("authToken")) {
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
      <div className="space-y-6 p-8 bg-gradient-to-br from-slate-50 to-white min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Dashboard PIC Sekolah</h1>
          <p className="text-slate-600 text-lg">Monitoring Distribusi Makanan Bergizi & Status Gizi Siswa</p>
        </div>

        {/* Menu Harian & Kalender Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Menu + Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Menu Harian Card */}
            {menuHariIni && (
              <div className="bg-gradient-to-r from-[#1B263A] to-[#243B55] rounded-2xl p-6 text-white shadow-lg h-fit">
                <div className="mb-8">
                  <p className="text-xs font-semibold opacity-90 tracking-widest uppercase">Menu Hari Ini</p>
                  <h2 className="text-4xl font-bold mb-2 mt-2">{menuHariIni.namaMenu || "-"}</h2>
                  <p className="text-sm opacity-90">{menuHariIni.menuPlanning?.sekolah?.nama || "Sekolah"}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="bg-[#1B263A] bg-opacity-90 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-sm opacity-90 mb-2">Kalori</p>
                    <p className="text-3xl font-bold">{menuHariIni.kalori || 0}</p>
                    <p className="text-xs opacity-75 mt-1">kcal</p>
                  </div>
                  <div className="bg-[#1B263A] bg-opacity-90 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-sm opacity-90 mb-2">Protein</p>
                    <p className="text-3xl font-bold">{menuHariIni.protein || 0}</p>
                    <p className="text-xs opacity-75 mt-1">g</p>
                  </div>
                </div>

                <div className="border-t border-white border-opacity-30 my-6"></div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm opacity-90 mb-2">Biaya per Tray</p>
                    <p className="text-2xl font-bold">Rp {menuHariIni.biayaPerTray?.toLocaleString("id-ID") || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90 mb-2">Waktu Masak</p>
                    <p className="text-2xl font-bold">
                      {menuHariIni.jamMulaiMasak} - {menuHariIni.jamSelesaiMasak}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STAT CARDS GRID */}
            <div className="grid grid-cols-2 gap-4">
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
              <StatCard
                title="Total Kelas"
                value={stats.totalKelas}
                subtitle="Kelas aktif"
                icon={BookOpen}
                color="bg-purple-500"
              />
              <StatCard
                title="Sudah Makan"
                value={stats.sudahMakan}
                subtitle="Siswa terlayani"
                icon={UtensilsCrossed}
                color="bg-cyan-500"
              />
            </div>
          </div>

          {/* Right Column - Kalender + List Acara */}
          <div className="space-y-6">
            {/* Kalender Reminder */}
            <KalenderReminder reminder={kalenderReminder} />

            {/* List Acara Kalender */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Daftar Acara</h3>
                <a
                  href="/sekolah/kalender-akademik"
                  className="text-sm text-slate-600 hover:text-orange-600 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </a>
              </div>

              {kalenderList.length > 0 ? (
                <div className="space-y-2">
                  {kalenderList.slice(0, 4).map((acara: any, idx: number) => {
                    const tanggalMulai = new Date(acara.tanggalMulai)
                    const tanggalFormat = tanggalMulai.toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                    })

                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all duration-200 group cursor-pointer"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className="flex items-center justify-center w-9 h-9 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate text-sm">{acara.deskripsi}</p>
                          <p className="text-xs text-slate-500 mt-1">{tanggalFormat}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                  <p className="text-sm text-slate-600 mb-3">Belum ada acara</p>
                  <a
                    href="/sekolah/kalender-akademik"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Buat Acara
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Absensi Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold text-slate-900 mb-6">📊 Absensi Minggu Ini</h3>
            <AttendanceChart data={absensiChart} />
          </div>

          {/* Distribusi Gizi Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold text-slate-900 mb-6">🍎 Distribusi Status Gizi</h3>
            <GiziDistributionChart data={siswaDiagram} />
          </div>
        </div>

        {/* Konsumsi Harian Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-bold text-slate-900 mb-6">🍽️ Konsumsi Harian</h3>
          <ConsumptionChart data={konsumsiHarian} />
        </div>

        {/* Kelas Table */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">📚 Data Kelas</h3>
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
                    <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Kelas</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Total Siswa</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Laki-laki</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Perempuan</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Alergi</th>
                  </tr>
                </thead>
                <tbody>
                  {kelasList.slice(0, 10).map((kelas: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-4 font-semibold text-slate-900">{kelas.nama}</td>
                      <td className="py-4 px-4 text-slate-700 font-medium">{kelas.totalSiswa || 0}</td>
                      <td className="py-4 px-4 text-slate-600">{kelas.lakiLaki || 0}</td>
                      <td className="py-4 px-4 text-slate-600">{kelas.perempuan || 0}</td>
                      <td className="py-4 px-4">
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