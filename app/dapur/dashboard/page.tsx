"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import DapurLayout from "@/components/layout/DapurLayout"
import { useDapurDashboardCache } from "@/lib/hooks/useDapurDashboardCache"
import { useProduksiCache } from "@/lib/hooks/useProduksiCache"
import { useTraySummaryRealtime } from "@/lib/hooks/useTraySummaryRealtime"
import {
  CheckCircle,
  TrendingUp,
  CheckCircle2,
  ArrowUp,
  ChevronDown,
  Wifi,
} from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const REFRESH_INTERVAL = 120000 
const SkeletonLoader = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-1/3 animate-shimmer"></div>

    {/* Daftar Sekolah Skeleton */}
    <div className="rounded-xl border border-[#D0B064]/20 bg-white p-6 shadow-sm space-y-3">
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-1/4 animate-shimmer mb-4"></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2 p-4 border border-gray-100 rounded-lg">
          <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer w-2/3"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer w-full"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer w-3/4"></div>
        </div>
      ))}
    </div>

    {/* Production Chart & Target Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-1/3 animate-shimmer"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-4">
        <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-1/2 animate-shimmer"></div>
        <div className="h-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
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
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)
  const [expandedSekolahId, setExpandedSekolahId] = useState<string | null>(null)
  const [sekolahDetails, setSekolahDetails] = useState<{[key: string]: any}>({})
  const [loadingDetail, setLoadingDetail] = useState<{[key: string]: boolean}>({})
  const [selectedSekolahId, setSelectedSekolahId] = useState<string>("")
  const { traySummary, loading: loadingTraySummary, isConnected: wsConnected } = useTraySummaryRealtime(selectedSekolahId)

  // Fetch sekolah detail saat expand
  const fetchSekolahDetail = useCallback(async (sekolahId: string) => {
    if (sekolahDetails[sekolahId]) return // Jika sudah cached, skip

    setLoadingDetail(prev => ({ ...prev, [sekolahId]: true }))
    try {
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const sekolahData = data.data || data
        setSekolahDetails(prev => ({
          ...prev,
          [sekolahId]: sekolahData
        }))
      }
    } catch (err) {
      console.warn('[Dashboard] Gagal fetch sekolah detail:', err)
    } finally {
      setLoadingDetail(prev => ({ ...prev, [sekolahId]: false }))
    }
  }, [sekolahDetails])

  // ✅ Callback untuk update state ketika data di-fetch dari background
  const handleCacheUpdate = useCallback((data: any) => {
    setMenuPlanningData(data.menuPlanningData || [])
    setStats(data.stats || { targetHariIni: 0, totalSekolah: 0 })
  }, [])

  // ✅ Use custom hook untuk fetch menu planning data dan stats
  // Pass dapurId sehingga cache terpisah per akun/dapur
  const { loading: dashboardLoading, loadData, refreshData } = useDapurDashboardCache(handleCacheUpdate, dapurId)

  // ✅ Use produksi cache for menu hari ini times (correct time display)
  const { batches } = useProduksiCache({ dapurId })

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
          ) : (
            <>
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
                {Array.from(new Map(menuPlanningData.map(p => [p.sekolahId, p])).values()).map((planning) => {
                  const isExpanded = expandedSekolahId === planning.sekolahId
                  return (
                    <div
                      key={planning.sekolahId}
                      className="bg-white border border-[#D0B064]/30 rounded-lg shadow-sm hover:shadow-md hover:border-[#D0B064] transition-all cursor-pointer"
                      onClick={() => {
                        if (!isExpanded) {
                          fetchSekolahDetail(planning.sekolahId)
                        }
                        setExpandedSekolahId(isExpanded ? null : planning.sekolahId)
                      }}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-bold text-[#1B263A] text-base">{planning.sekolahNama}</p>
                            {!isExpanded && (
                              <p className="text-sm text-[#1B263A]/70 mt-1 line-clamp-1">{planning.sekolahAlamat}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <ChevronDown
                              className={`w-5 h-5 text-[#D0B064] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-[#D0B064]/20 space-y-3">
                            {/* Alamat */}
                            <div>
                              <p className="text-xs font-bold text-[#D0B064] uppercase">Alamat</p>
                              <p className="text-sm text-[#1B263A] mt-1">{planning.sekolahAlamat || sekolahDetails[planning.sekolahId]?.alamat || "—"}</p>
                            </div>

                            {/* PIC Info - Dari fetch detail atau planning data */}
                            {loadingDetail[planning.sekolahId] ? (
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 animate-pulse">
                                <p className="text-sm text-blue-600">Loading data PIC...</p>
                              </div>
                            ) : (
                              (() => {
                                // Try to get PIC from fetched detail first, then fallback to planning data
                                const detailData = sekolahDetails[planning.sekolahId]
                                const picList = detailData?.picSekolah || planning.picSekolah
                                const pic = picList?.[0] || picList

                                return pic ? (
                                  <div className="bg-[#D0B064]/10 rounded-lg p-3 border border-[#D0B064]/20">
                                    <p className="text-xs font-bold text-[#D0B064] uppercase mb-2">Person In Charge</p>
                                    <div className="space-y-1">
                                      <p className="text-sm text-[#1B263A]">
                                        <span className="font-medium">Nama:</span> {pic.name || pic.namaLengkap || "—"}
                                      </p>
                                      {(pic.phone || pic.noHp) && (
                                        <p className="text-sm text-[#1B263A]">
                                          <span className="font-medium">Telepon:</span> {pic.phone || pic.noHp || "—"}
                                        </p>
                                      )}
                                      {pic.email && (
                                        <p className="text-sm text-[#1B263A]">
                                          <span className="font-medium">Email:</span> {pic.email || "—"}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-gray-100 rounded-lg p-3">
                                    <p className="text-sm text-[#1B263A]/60">Data PIC tidak tersedia</p>
                                  </div>
                                )
                              })()
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Total Tray Siap Dikirim (Left) */}
              <div className="rounded-2xl border border-[#D0B064]/20 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-[#1B263A] text-lg">Total Tray Siap Dikirim</h4>
                    <p className="text-sm text-[#1B263A]/60 mt-1">Status pengiriman tray per sekolah</p>
                  </div>
                  <div className="p-3 bg-[#D0B064]/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[#D0B064]" />
                  </div>
                </div>

                {/* Dropdown Sekolah */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#1B263A]">Pilih Sekolah</label>
                    {selectedSekolahId && wsConnected && (
                      <div className="flex items-center gap-1">
                        <Wifi className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600">Realtime</span>
                      </div>
                    )}
                  </div>
                  <select
                    value={selectedSekolahId}
                    onChange={(e) => setSelectedSekolahId(e.target.value)}
                    className="w-full px-4 py-2 border border-[#D0B064]/30 rounded-lg bg-white text-[#1B263A] focus:outline-none focus:border-[#D0B064] focus:ring-2 focus:ring-[#D0B064]/20"
                  >
                    <option value="">-- Pilih Sekolah --</option>
                    {Array.from(new Map(menuPlanningData.map(p => [p.sekolahId, p])).values()).map((planning) => (
                      <option key={planning.sekolahId} value={planning.sekolahId}>
                        {planning.sekolahNama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tray Summary Content */}
                {loadingTraySummary && !traySummary ? (
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
                    <p className="text-sm text-blue-600">Loading data tray...</p>
                  </div>
                ) : selectedSekolahId && traySummary ? (
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-6 border border-green-200">
                    <p className="text-sm text-green-700 font-medium">Total Tray Siap Dikirim</p>
                    <p className="text-5xl font-black text-green-700 mt-4">
                      {traySummary?.totalTrayUnik !== undefined && traySummary?.totalTrayUnik !== null
                        ? traySummary.totalTrayUnik
                        : traySummary?.total !== undefined && traySummary?.total !== null
                        ? traySummary.total
                        : 0}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                    <p className="text-sm text-[#1B263A]/60">Pilih sekolah untuk melihat data tray</p>
                  </div>
                )}
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
          )}
        </>
      </div>
    </DapurLayout>
  )
}

export default DashboardDapur