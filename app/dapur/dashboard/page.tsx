"use client"

import { useState, useEffect, useMemo, memo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import DapurLayout from "@/components/layout/DapurLayout"
import {
  ChefHat,
  Package,
  Truck,
  CheckCircle,
  TrendingUp,
  Eye,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  MapPin,
  QrCode,
  ArrowUp,
  ArrowDown,
  Clock,
  Users,
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://demombgv1.xyz"
const REFRESH_INTERVAL = 300000

async function getAuthToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("authToken") || ""
}

async function apiCall<T>(endpoint: string, options: any = {}): Promise<T> {
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

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-36"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-gray-200 rounded-lg h-80"></div>
      <div className="bg-gray-200 rounded-lg h-80"></div>
    </div>
  </div>
)

const ProductionChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={260}>
    <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
      <defs>
        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="hari" stroke="#6b7280" style={{ fontSize: "12px" }} />
      <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
      <Tooltip
        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}
      />
      <Line
        type="monotone"
        dataKey="actual"
        stroke="#0ea5e9"
        strokeWidth={2}
        dot={{ fill: "#0ea5e9", r: 4 }}
        activeDot={{ r: 6 }}
      />
    </LineChart>
  </ResponsiveContainer>
))
ProductionChart.displayName = "ProductionChart"

const DeliveryChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="school" stroke="#6b7280" style={{ fontSize: "11px" }} />
      <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
      <Tooltip
        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}
      />
      <Bar dataKey="trays" fill="#06b6d4" radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
))
DeliveryChart.displayName = "DeliveryChart"

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color }: any) => (
  <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-500">{subtitle}</p>
      {trend !== undefined && (
        <div
          className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? "text-green-600" : "text-red-600"}`}
        >
          {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
)

const DashboardDapur = () => {
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [userInfo, setUserInfo] = useState({
    name: "Loading...",
    email: "",
    phone: "",
    dapurName: "Dapur MBG",
  })

  const [menuPlanningData, setMenuPlanningData] = useState<any[]>([])
  const [loadingMenuPlanning, setLoadingMenuPlanning] = useState(true)
  const [errorMenuPlanning, setErrorMenuPlanning] = useState<string | null>(null)
  const [todayMenu, setTodayMenu] = useState<any>(null)

  const [stats, setStats] = useState({
    targetHariIni: 0,
    sudahPacking: 0,
    totalTrays: 0,
    traysAvailable: 0,
    totalBaskets: 0,
    basketsAvailable: 0,
    totalSekolah: 0,
    sudahDikirim: 0,
    totalBatch: 0,
    batchInProgress: 0,
  })

  const [produksiMingguan, setProduksiMingguan] = useState<any[]>([])
  const [deliveryTrips, setDeliveryTrips] = useState<any[]>([])
  const [recentCheckpoints, setRecentCheckpoints] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem("mbg_user")
    const token = localStorage.getItem("mbg_token")

    if (!userData || !token) {
      router.push("/auth/login")
      return
    }

    try {
      const user = JSON.parse(userData)
      setUserInfo({
        name: user.name || "PIC Dapur",
        email: user.email || "",
        phone: user.phone || "",
        dapurName: user.name || "Dapur MBG",
      })
    } catch (error) {
      router.push("/auth/login")
    }
  }, [router])

  const loadData = useCallback(async () => {
    try {
      setLoadingMenuPlanning(true)
      setErrorMenuPlanning(null)

      const planningRes = await apiCall<any>("/api/menu-planning")
      const plannings = extractArray(planningRes?.data || [])

      const today = new Date()
      const todayString = today.toISOString().split("T")[0]

      let foundTodayMenu: any = null
      let allMenus: any[] = []
      let allDelivery: any[] = []

      const weeklyStats = await Promise.all(
        plannings.map(async (planning: any) => {
          try {
            const menuRes = await apiCall<any>(`/api/menu-planning/${planning.id}/menu-harian`)
            const menus = extractArray(menuRes?.data || [])
            allMenus = [...allMenus, ...menus]

            const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
            const daysStatus = dayNames.map((day, idx) => {
              const dayOfWeek = idx + 1
              const hasMenu = menus.some((m: any) => {
                const menuDate = new Date(m.tanggal)
                const dateDay = menuDate.getDay()
                const adjustedDay = dateDay === 0 ? 7 : dateDay
                return adjustedDay === dayOfWeek
              })

              return {
                day,
                completed: hasMenu,
                menuCount: menus.filter((m: any) => {
                  const menuDate = new Date(m.tanggal)
                  const dateDay = menuDate.getDay()
                  const adjustedDay = dateDay === 0 ? 7 : dateDay
                  return adjustedDay === dayOfWeek
                }).length,
              }
            })

            if (!foundTodayMenu) {
              const todayMenus = menus.filter((m: any) => {
                const menuDate = new Date(m.tanggal).toISOString().split("T")[0]
                return menuDate === todayString
              })
              if (todayMenus.length > 0) {
                foundTodayMenu = {
                  ...todayMenus[0],
                  sekolahNama: planning.sekolah?.nama || "Unknown",
                }
              }
            }

            const completedDays = daysStatus.filter((d) => d.completed).length
            const totalDays = 6

            return {
              id: planning.id,
              mingguanKe: planning.mingguanKe,
              sekolahId: planning.sekolahId,
              sekolahNama: planning.sekolah?.nama || "Unknown",
              tanggalMulai: planning.tanggalMulai,
              tanggalSelesai: planning.tanggalSelesai,
              daysStatus,
              completedDays,
              totalDays,
              status: completedDays === totalDays ? "COMPLETE" : "INCOMPLETE",
              daysLeft: totalDays - completedDays,
              totalMenuCount: menus.length,
            }
          } catch (err) {
            return null
          }
        }),
      )

      const validStats = weeklyStats
        .filter((s) => s !== null)
        .sort((a, b) => {
          if (a.status === b.status) return 0
          return a.status === "COMPLETE" ? -1 : 1
        })

      setMenuPlanningData(validStats)
      setTodayMenu(foundTodayMenu)

      try {
        const deliveryRes = await apiCall<any>("/api/sekolah/1/pengiriman").catch(() => null)
        if (deliveryRes?.data) {
          allDelivery = Array.isArray(deliveryRes.data) ? deliveryRes.data : []
        }
      } catch (err) {
        // Silent error handling
      }

      const dateMap: { [key: string]: number } = {}
      const schoolMap: { [key: string]: number } = {}

      allMenus.forEach((menu) => {
        if (menu.tanggal) {
          const date = new Date(menu.tanggal).toLocaleDateString("id-ID", {
            weekday: "short",
            month: "short",
            day: "2-digit",
          })
          dateMap[date] = (dateMap[date] || 0) + 1
        }
      })

      allDelivery.forEach((delivery) => {
        const school = delivery.sekolah?.nama || delivery.school || "Unknown"
        schoolMap[school] = (schoolMap[school] || 0) + (delivery.jumlahTray || 1)
      })

      const onTime = allDelivery.filter((d) => d.status === "DELIVERED" || d.scanSekolahTime).length
      const late = allDelivery.length - onTime

      setStats({
        targetHariIni:
          allMenus.filter((m) => {
            const menuDate = new Date(m.tanggal).toISOString().split("T")[0]
            return menuDate === todayString
          }).length * 50 || 5000,
        sudahPacking: allMenus.length,
        totalTrays: allDelivery.reduce((sum, d) => sum + (d.jumlahTray || 100), 0) || 5500,
        traysAvailable: Math.max(
          0,
          (allDelivery.reduce((sum, d) => sum + (d.jumlahTray || 100), 0) || 5500) - allMenus.length,
        ),
        totalBaskets: 120,
        basketsAvailable: 85,
        totalSekolah: plannings.length,
        sudahDikirim: onTime,
        totalBatch: Math.ceil(allMenus.length / 500),
        batchInProgress: Math.ceil(allMenus.length / 500) - onTime,
      })

      const produksiData = Object.entries(dateMap)
        .map(([date, count]) => ({ hari: date, actual: count }))
        .slice(-6)
      setProduksiMingguan(produksiData)

      const deliveryData = Object.entries(schoolMap)
        .map(([school, trays]) => ({ school, trays }))
        .slice(0, 5)
      setDeliveryTrips(deliveryData)

      const checkpoints = allDelivery
        .filter((d) => d.scanSekolahTime || d.status === "DELIVERED")
        .map((d, idx) => ({
          type: d.status === "DELIVERED" ? "SCHOOL_RECEIVED" : "DRIVER_TO_SCHOOL",
          school: d.sekolah?.nama || d.school || "Unknown School",
          driver: d.driver?.nama || "Driver",
          time: d.scanSekolahTime
            ? new Date(d.scanSekolahTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
            : "00:00",
        }))
        .slice(-3)
      setRecentCheckpoints(checkpoints)
    } catch (err) {
      setErrorMenuPlanning(err instanceof Error ? err.message : "Gagal memuat data")
      setMenuPlanningData([])
    } finally {
      setLoadingMenuPlanning(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadData()
    }, REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [loadData])

  const menuPlanningStats = useMemo(() => {
    const total = menuPlanningData.length || 1
    const complete = menuPlanningData.filter((s) => s.status === "COMPLETE").length
    const incomplete = total - complete
    const critical = menuPlanningData.filter((s) => s.daysLeft >= 5).length
    return { total, complete, incomplete, critical, percentComplete: Math.round((complete / total) * 100) }
  }, [menuPlanningData])

  const progressPercentage = Math.round((stats.sudahPacking / stats.targetHariIni) * 100)

  return (
    <DapurLayout currentPage="dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Dapur</h1>
            <p className="text-sm text-gray-500 mt-2">Selamat datang, {userInfo.dapurName}</p>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </div>

        {loadingMenuPlanning ? (
          <SkeletonLoader />
        ) : (
          <>
            {errorMenuPlanning && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900">Error Memuat Data</p>
                    <p className="text-sm text-red-700 mt-1">{errorMenuPlanning}</p>
                  </div>
                </div>
              </div>
            )}

            {menuPlanningStats.incomplete > 0 && (
              <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-amber-200 rounded-lg flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 text-lg">
                      {menuPlanningStats.incomplete} Sekolah Belum Lengkap
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                      {menuPlanningStats.critical} sekolah kritis (5+ hari kosong)
                    </p>
                  </div>
                  <Link
                    href="/dapur/menu"
                    className="flex-shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm whitespace-nowrap shadow-md hover:shadow-lg"
                  >
                    Lengkapi Sekarang
                  </Link>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-900">Progress Kelengkapan</span>
                    <span className="text-sm font-bold text-amber-900">{menuPlanningStats.percentComplete}%</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-2.5">
                    <div
                      className="bg-amber-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${menuPlanningStats.percentComplete}%` }}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-amber-200">
                        <th className="text-left py-3 px-4 text-amber-900 font-semibold">Sekolah</th>
                        <th className="text-center py-3 px-4 text-amber-900 font-semibold">Minggu</th>
                        <th className="text-center py-3 px-4 text-amber-900 font-semibold">Progress</th>
                        <th className="text-center py-3 px-4 text-amber-900 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuPlanningData
                        .filter((s) => s.status === "INCOMPLETE")
                        .map((week) => (
                          <tr key={week.id} className="border-b border-amber-100 hover:bg-amber-50">
                            <td className="py-3 px-4">
                              <span className="font-medium text-gray-900">{week.sekolahNama}</span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="text-gray-600">W{week.mingguanKe}</span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="text-gray-900 font-semibold">
                                {week.completedDays}/{week.totalDays}
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                  week.daysLeft >= 5 ? "bg-red-200 text-red-700" : "bg-yellow-200 text-yellow-700"
                                }`}
                              >
                                {week.daysLeft >= 5 ? "URGENT" : "PENDING"}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {menuPlanningStats.complete > 0 && (
              <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-700" />
                  </div>
                  <h4 className="font-bold text-gray-900">Menu Lengkap ({menuPlanningStats.complete})</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {menuPlanningData
                    .filter((s) => s.status === "COMPLETE")
                    .map((school) => (
                      <div
                        key={school.id}
                        className="bg-white border border-green-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm font-semibold text-gray-900">{school.sekolahNama}</p>
                        <p className="text-xs text-green-600 mt-1 font-medium">✓ Week {school.mingguanKe}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Target Hari Ini"
                value={stats.targetHariIni.toLocaleString()}
                subtitle="Unit"
                icon={CheckCircle}
                color="bg-blue-500"
                trend={2.5}
              />
              <StatCard
                title="Sudah Dikemas"
                value={stats.sudahPacking.toLocaleString()}
                subtitle={`${progressPercentage}% Target`}
                icon={Package}
                color="bg-cyan-500"
                trend={5.2}
              />
              <StatCard
                title="Sedang Dikirim"
                value={`${stats.batchInProgress}/${stats.totalBatch}`}
                subtitle="Batch"
                icon={Truck}
                color="bg-amber-500"
              />
              <StatCard
                title="Equipment Siap"
                value={stats.traysAvailable.toLocaleString()}
                subtitle="Tersedia"
                icon={Users}
                color="bg-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Production Chart */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Produksi Mingguan</h4>
                    <p className="text-sm text-gray-500 mt-1">Tren produksi 6 hari terakhir</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <ProductionChart data={produksiMingguan} />
              </div>

              {/* Today's Menu */}
              {todayMenu ? (
                <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 p-6 text-white shadow-lg">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <ChefHat className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-white/80 font-medium">Menu Hari Ini</p>
                        <p className="font-bold text-xl mt-1">{todayMenu.namaMenu}</p>
                        <p className="text-sm text-white/70">{todayMenu.sekolahNama}</p>
                      </div>
                    </div>
                    <Link
                      href="/dapur/menu"
                      className="p-2.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm flex-shrink-0"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </div>

                  <div className="space-y-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80">Kalori</span>
                      <span className="font-bold">{todayMenu.kalori} kcal</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80">Protein</span>
                      <span className="font-bold">{todayMenu.protein}g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80">Biaya/Unit</span>
                      <span className="font-bold">Rp {todayMenu.biayaPerTray.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/20 pt-3 flex items-center justify-between">
                      <span className="text-sm text-white/80 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Waktu Masak
                      </span>
                      <span className="font-bold">
                        {todayMenu.jamMulaiMasak} - {todayMenu.jamSelesaiMasak}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-3 bg-gray-200 rounded-lg">
                        <ChefHat className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Menu Hari Ini</p>
                        <p className="font-bold text-lg text-gray-900 mt-1">Tidak Ada</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Belum ada menu yang dijadwalkan untuk hari ini</p>
                  </div>
                  <Link
                    href="/dapur/menu"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm w-fit mt-4 shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Buat Menu
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Delivery Chart */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Distribusi Hari Ini</h3>
                    <p className="text-sm text-gray-500 mt-1">Jumlah unit per sekolah</p>
                  </div>
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <Truck className="w-5 h-5 text-cyan-600" />
                  </div>
                </div>
                <DeliveryChart data={deliveryTrips} />

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Progress Pengiriman</span>
                    <span className="font-bold text-gray-900">
                      {stats.sudahDikirim}/{stats.totalSekolah} sekolah
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-cyan-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${(stats.sudahDikirim / stats.totalSekolah) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Tracking */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Tracking Terbaru</h3>
                    <p className="text-sm text-gray-500 mt-1">Update pengiriman terakhir</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <QrCode className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentCheckpoints.length > 0 ? (
                    recentCheckpoints.map((checkpoint, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="p-2.5 bg-green-100 rounded-lg flex-shrink-0">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{checkpoint.school}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {checkpoint.type.replace(/_/g, " ")} • {checkpoint.driver}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-gray-600 flex-shrink-0">{checkpoint.time}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Belum ada tracking</p>
                    </div>
                  )}
                </div>

                <button className="w-full mt-4 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold border border-blue-200">
                  Lihat Semua Tracking
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DapurLayout>
  )
}

export default DashboardDapur
