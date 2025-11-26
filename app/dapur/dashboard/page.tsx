"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import DapurLayout from "@/components/layout/DapurLayout"
import { useDapurDashboardCache } from "@/lib/hooks/useDapurDashboardCache"
import { useProduksiCache } from "@/lib/hooks/useProduksiCache"
import { useDapurContext } from "@/lib/context/DapurContext"
import {
  ChefHat,
  CheckCircle,
  TrendingUp,
  Eye,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUp,
  Clock,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

const REFRESH_INTERVAL = 120000 // 🔥 OPTIMIZATION: Reduced from 5min (300s) to 2min (120s) for faster updates

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

const ProductionChart = ({ data }: { data: any[] }) => (
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
)



const DashboardDapur = () => {
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [dapurId, setDapurId] = useState<string>("")

  const [userInfo, setUserInfo] = useState({
    name: "Loading...",
    email: "",
    phone: "",
    dapurName: "Dapur MBG",
  })

  const [menuPlanningData, setMenuPlanningData] = useState<any[]>([])
  const [todayMenus, setTodayMenus] = useState<any[]>([])
  const [currentMenuIndex, setCurrentMenuIndex] = useState(0)
  const [stats, setStats] = useState({
    targetHariIni: 0,
    totalSekolah: 0,
  })
  const [produksiMingguan, setProduksiMingguan] = useState<any[]>([])
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ Callback untuk update state ketika data di-fetch dari background
  const handleCacheUpdate = useCallback((data: any) => {
    setMenuPlanningData(data.menuPlanningData || [])
    setStats(data.stats || { targetHariIni: 0, totalSekolah: 0 })
    setProduksiMingguan(data.produksiMingguan || [])
  }, [])

  // ✅ Use custom hook untuk fetch menu planning data dan stats
  // Pass dapurId sehingga cache terpisah per akun/dapur
  const { loading: dashboardLoading, loadData, refreshData } = useDapurDashboardCache(handleCacheUpdate, dapurId)

  // ✅ Use produksi cache for menu hari ini times (correct time display)
  const { batches, loading: produksiLoading } = useProduksiCache()

  // ✅ Get context loading state
  const { isLoading: contextLoading } = useDapurContext()

  // ✅ Extract all today's menus from batches for carousel
  useEffect(() => {
    if (batches && batches.length > 0) {
      const menus = batches
        .filter((b) => b.dailyMenu)
        .map((batch) => ({
          namaMenu: batch.dailyMenu.namaMenu || "Menu",
          sekolahNama: batch.sekolahName,
          kalori: batch.dailyMenu.kalori || 0,
          protein: batch.dailyMenu.protein || 0,
          biayaPerTray: batch.dailyMenu.biayaPerTray || 0,
          jamMulaiMasak: batch.startTime || "",
          jamSelesaiMasak: batch.endTime || "",
        }))

      setTodayMenus(menus)
      setCurrentMenuIndex(0)

      // ✅ Update stats to match actual production batches
      const totalTarget = batches.reduce((acc, batch) => acc + (batch.expectedTrays || 0), 0)
      const totalSekolah = batches.length
      setStats({
        targetHariIni: totalTarget,
        totalSekolah: totalSekolah,
      })
      console.log(`[DashboardDapur] Updated stats from batches - Target: ${totalTarget}, Sekolah: ${totalSekolah}`)
    } else {
      setTodayMenus([])
      setCurrentMenuIndex(0)
      // Keep existing stats if no batches
    }
  }, [batches])

  // 🔥 OPTIMIZATION: Setup auto-play carousel with better cleanup
  useEffect(() => {
    if (todayMenus.length <= 1) {
      // No need for carousel if 0 or 1 menu
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current)
        autoPlayIntervalRef.current = null
      }
      return
    }

    // Auto-play every 5 seconds
    autoPlayIntervalRef.current = setInterval(() => {
      setCurrentMenuIndex((prev) => (prev + 1) % todayMenus.length)
    }, 5000)

    return () => {
      // 🔥 Ensure proper cleanup to prevent memory leaks
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current)
        autoPlayIntervalRef.current = null
      }
    }
  }, [todayMenus.length])

  // Helper to get current menu
  const currentMenu = todayMenus.length > 0 ? todayMenus[currentMenuIndex] : null

  useEffect(() => {
    const userData = localStorage.getItem("mbg_user")
    const token = localStorage.getItem("mbg_token")
    const dapurIdFromStorage = localStorage.getItem("userDapurId")

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

      // 🔥 Set dapurId dari localStorage untuk cache key
      if (dapurIdFromStorage) {
        setDapurId(dapurIdFromStorage)
      }
    } catch (error) {
      router.push("/auth/login")
    }
  }, [router])

  // ✅ Load data menggunakan hook
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await loadData()
        if (data) {
          setMenuPlanningData(data.menuPlanningData || [])
          setStats(data.stats || { targetHariIni: 0, totalSekolah: 0 })
          setProduksiMingguan(data.produksiMingguan || [])
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err)
      }
    }

    loadDashboardData()
  }, [loadData])

  // ✅ Setup auto-refresh interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refreshData()
    }, REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [refreshData])

  // 🔥 OPTIMIZATION: Show dashboard as soon as dashboard data loads (don't wait for produksi)
  useEffect(() => {
    // Dashboard can render with just dashboard data, produksi batches will update carousel separately
    if (!dashboardLoading && menuPlanningData.length > 0) {
      setIsLoadingComplete(true)
    }
  }, [dashboardLoading, menuPlanningData])

  const menuPlanningStats = useMemo(() => {
    const total = menuPlanningData.length || 1
    const complete = menuPlanningData.filter((s) => s.status === "COMPLETE").length
    const incomplete = total - complete
    const critical = menuPlanningData.filter((s) => s.daysLeft >= 5).length
    return { total, complete, incomplete, critical, percentComplete: Math.round((complete / total) * 100) }
  }, [menuPlanningData])

  return (
    <DapurLayout currentPage="dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1B263A]">Dashboard Dapur</h1>
            <p className="text-sm text-[#1B263A]/60 mt-2">Selamat datang, {userInfo.dapurName}</p>
          </div>
        </div>

        <>
          {!isLoadingComplete ? (
            <SkeletonLoader />
          ) : menuPlanningStats.incomplete > 0 ? (
            <div className="rounded-xl border border-[#D0B064]/40 bg-gradient-to-br from-[#1B263A]/5 via-[#D0B064]/5 to-[#1B263A]/10 p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-[#D0B064]/20 rounded-lg flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#D0B064]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#1B263A] text-lg">
                    {menuPlanningStats.incomplete} Sekolah Belum Lengkap
                  </h3>
                  <p className="text-sm text-[#1B263A]/70 mt-1">
                    {menuPlanningStats.critical} sekolah kritis (5+ hari kosong)
                  </p>
                </div>
                <Link
                  href="/dapur/menu"
                  className="flex-shrink-0 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#D0B064]/90 transition-colors font-medium text-sm whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  Lengkapi Sekarang
                </Link>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#1B263A]">Progress Kelengkapan</span>
                  <span className="text-sm font-bold text-[#1B263A]">{menuPlanningStats.percentComplete}%</span>
                </div>
                <div className="w-full bg-[#D0B064]/20 rounded-full h-2.5">
                  <div
                    className="bg-[#D0B064] h-2.5 rounded-full transition-all"
                    style={{ width: `${menuPlanningStats.percentComplete}%` }}
                  />
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#D0B064]/20">
                      <th className="text-left py-3 px-4 text-[#1B263A] font-semibold">Sekolah</th>
                      <th className="text-center py-3 px-4 text-[#1B263A] font-semibold">Minggu</th>
                      <th className="text-center py-3 px-4 text-[#1B263A] font-semibold">Progress</th>
                      <th className="text-center py-3 px-4 text-[#1B263A] font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuPlanningData
                      .filter((s) => s.status === "INCOMPLETE")
                      .map((week) => (
                        <tr key={week.id} className="border-b border-[#D0B064]/10 hover:bg-[#D0B064]/5">
                          <td className="py-3 px-4">
                            <span className="font-medium text-[#1B263A]">{week.sekolahNama}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-[#1B263A]/70">W{week.mingguanKe}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-[#1B263A] font-semibold">
                              {week.completedDays}/{week.totalDays}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                week.daysLeft >= 5
                                  ? "bg-[#D0B064] text-[#1B263A]"
                                  : "bg-[#D0B064]/40 text-[#1B263A]"
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
          ) : null}

            {menuPlanningStats.complete > 0 && (
              <div className="rounded-xl border border-[#D0B064]/40 bg-gradient-to-br from-[#1B263A]/5 to-[#D0B064]/5 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-[#D0B064]/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-[#D0B064]" />
                  </div>
                  <h4 className="font-bold text-[#1B263A]">Menu Lengkap ({menuPlanningStats.complete})</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {menuPlanningData
                    .filter((s) => s.status === "COMPLETE")
                    .map((school) => (
                      <div
                        key={school.id}
                        className="bg-white border border-[#D0B064]/30 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-[#D0B064] transition-all"
                      >
                        <p className="text-sm font-semibold text-[#1B263A]">{school.sekolahNama}</p>
                        <p className="text-xs text-[#D0B064] mt-1 font-medium">✓ Week {school.mingguanKe}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Menu Carousel (Left) */}
              {currentMenu ? (
                <div className="rounded-2xl border border-[#D0B064]/50 bg-gradient-to-br from-[#1B263A] via-[#1B263A] to-[#2a3f52] p-6 text-white shadow-lg">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-[#D0B064]/20 rounded-lg backdrop-blur-sm">
                        <ChefHat className="w-6 h-6 text-[#D0B064]" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70 font-medium">Menu Hari Ini</p>
                        <p className="font-bold text-xl mt-1 text-[#D0B064]">{currentMenu.namaMenu}</p>
                        <p className="text-sm text-white/60">{currentMenu.sekolahNama}</p>
                      </div>
                    </div>
                    <Link
                      href="/dapur/menu"
                      className="p-2.5 bg-[#D0B064]/20 rounded-lg hover:bg-[#D0B064]/30 transition-colors backdrop-blur-sm flex-shrink-0"
                    >
                      <Eye className="w-5 h-5 text-[#D0B064]" />
                    </Link>
                  </div>

                  <div className="space-y-3 bg-[#D0B064]/10 rounded-xl p-4 backdrop-blur-sm border border-[#D0B064]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Kalori</span>
                      <span className="font-bold text-[#D0B064]">{currentMenu.kalori} kcal</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Protein</span>
                      <span className="font-bold text-[#D0B064]">{currentMenu.protein}g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Biaya/Unit</span>
                      <span className="font-bold text-[#D0B064]">Rp {currentMenu.biayaPerTray.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-[#D0B064]/20 pt-3 flex items-center justify-between">
                      <span className="text-sm text-white/70 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Waktu Masak
                      </span>
                      <span className="font-bold text-[#D0B064]">
                        {currentMenu.jamMulaiMasak} - {currentMenu.jamSelesaiMasak}
                      </span>
                    </div>
                  </div>

                  {/* Pagination Dots */}
                  {todayMenus.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      {todayMenus.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentMenuIndex(index)
                            // 🔥 Reset auto-play when user clicks - with proper cleanup
                            if (autoPlayIntervalRef.current) {
                              clearInterval(autoPlayIntervalRef.current)
                              autoPlayIntervalRef.current = null
                            }
                            autoPlayIntervalRef.current = setInterval(() => {
                              setCurrentMenuIndex((prev) => (prev + 1) % todayMenus.length)
                            }, 5000)
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentMenuIndex
                              ? "bg-[#D0B064] w-6"
                              : "bg-[#D0B064]/40 hover:bg-[#D0B064]/60"
                          }`}
                          aria-label={`Go to menu ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#D0B064]/20 bg-gradient-to-br from-[#1B263A]/5 to-[#D0B064]/5 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-3 bg-[#D0B064]/20 rounded-lg">
                        <ChefHat className="w-6 h-6 text-[#D0B064]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1B263A]/70">Menu Hari Ini</p>
                        <p className="font-bold text-lg text-[#1B263A] mt-1">Tidak Ada</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#1B263A]/70">Belum ada menu yang dijadwalkan untuk hari ini</p>
                  </div>
                  <Link
                    href="/dapur/menu"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#D0B064] text-[#1B263A] rounded-lg hover:bg-[#D0B064]/90 transition-colors font-medium text-sm w-fit mt-4 shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Buat Menu
                  </Link>
                </div>
              )}

              {/* Production Chart (Center) */}
              <div className="rounded-2xl border border-[#D0B064]/20 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-[#1B263A] text-lg">Produksi Mingguan</h4>
                    <p className="text-sm text-[#1B263A]/60 mt-1">Tren produksi 6 hari terakhir</p>
                  </div>
                  <div className="p-3 bg-[#D0B064]/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[#D0B064]" />
                  </div>
                </div>
                <ProductionChart data={produksiMingguan} />
              </div>

              {/* Target Hari Ini Card (Right) - MODERN VERSION */}
              <div className="rounded-2xl border border-[#D0B064]/40 bg-gradient-to-br from-[#1B263A]/5 via-white to-[#D0B064]/5 p-8 shadow-lg relative overflow-hidden">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#D0B064]/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#1B263A]/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-sm font-semibold text-[#1B263A] uppercase tracking-wide">Target Produksi</p>
                      <p className="text-[#1B263A]/60 text-xs mt-1">Hari Ini</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-[#D0B064] to-[#c49a4f] rounded-xl shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Main Number */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <p className="text-7xl font-black bg-gradient-to-r from-[#1B263A] to-[#D0B064] bg-clip-text text-transparent">
                        {stats.targetHariIni.toLocaleString()}
                      </p>
                      <p className="text-lg font-semibold text-[#1B263A]">Unit</p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-[#D0B064]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#1B263A]/70">Jumlah Sekolah</span>
                      <span className="font-bold text-[#1B263A] text-lg">{stats.totalSekolah}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#1B263A]/70">Per Sekolah</span>
                      <span className="font-bold text-[#1B263A] text-lg">
                        {stats.totalSekolah > 0 ? Math.round(stats.targetHariIni / stats.totalSekolah) : 0} unit
                      </span>
                    </div>
                  </div>

                  {/* Growth Indicator */}
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#D0B064]/20 to-[#D0B064]/10 rounded-xl px-3 py-2 w-fit border border-[#D0B064]/30">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-4 h-4 text-[#D0B064]" />
                      <span className="text-sm font-bold text-[#D0B064]">2.5%</span>
                    </div>
                    <span className="text-xs text-[#D0B064]/80">dari kemarin</span>
                  </div>
                </div>
              </div>
            </div>

        </>
      </div>
    </DapurLayout>
  )
}

export default DashboardDapur