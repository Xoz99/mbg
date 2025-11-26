"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import DapurLayout from "@/components/layout/DapurLayout"
import { useDapurDashboardCache } from "@/lib/hooks/useDapurDashboardCache"
import { useProduksiCache } from "@/lib/hooks/useProduksiCache"
import { useDapurContext } from "@/lib/context/DapurContext"
import {
  CheckCircle,
  TrendingUp,
  CheckCircle2,
  ArrowUp,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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
  const [stats, setStats] = useState({
    targetHariIni: 0,
    totalSekolah: 0,
  })
  const [produksiMingguan, setProduksiMingguan] = useState<any[]>([])
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)

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
  const { batches } = useProduksiCache({ dapurId })

  // ✅ Get context loading state
  const { isLoading: contextLoading } = useDapurContext()

  // ✅ Update stats to match actual production batches
  useEffect(() => {
    if (batches && batches.length > 0) {
      const totalTarget = batches.reduce((acc, batch) => acc + (batch.expectedTrays || 0), 0)
      const totalSekolah = batches.length
      setStats({
        targetHariIni: totalTarget,
        totalSekolah: totalSekolah,
      })
      console.log(`[DashboardDapur] Updated stats from batches - Target: ${totalTarget}, Sekolah: ${totalSekolah}`)
    }
  }, [batches])

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
          ) : null}

            {/* Daftar Sekolah Section */}
            <div className="rounded-xl border border-[#D0B064]/40 bg-gradient-to-br from-[#1B263A]/5 to-[#D0B064]/5 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-[#D0B064]/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#D0B064]" />
                </div>
                <h4 className="font-bold text-[#1B263A]">
                  Daftar Sekolah ({Array.from(new Map(menuPlanningData.map(p => [p.sekolahId, p])).values()).length})
                </h4>
              </div>
              <div className="space-y-3">
                {Array.from(new Map(menuPlanningData.map(p => [p.sekolahId, p])).values()).map((planning) => (
                  <div
                    key={planning.sekolahId}
                    className="bg-white border border-[#D0B064]/30 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-[#D0B064] transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-[#1B263A] text-base">{planning.sekolahNama}</p>
                        <p className="text-sm text-[#1B263A]/70 mt-1">{planning.sekolahAlamat}</p>
                        {planning.picSekolah && (
                          <div className="mt-2 pt-2 border-t border-[#D0B064]/20">
                            <p className="text-sm text-[#1B263A]/60">
                              <span className="font-medium">PIC:</span> {planning.picSekolah.name || planning.picSekolah.namaLengkap || "—"}
                            </p>
                            {planning.picSekolah.phone && (
                              <p className="text-sm text-[#1B263A]/60">
                                <span className="font-medium">Telepon:</span> {planning.picSekolah.phone || planning.picSekolah.noHp || "—"}
                              </p>
                            )}
                            {planning.picSekolah.email && (
                              <p className="text-sm text-[#1B263A]/60">
                                <span className="font-medium">Email:</span> {planning.picSekolah.email || "—"}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Production Chart (Left) */}
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