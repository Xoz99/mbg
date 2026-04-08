"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import DapurLayout from "@/components/layout/DapurLayout"
import { useDapurDashboardCache } from "@/lib/hooks/useDapurDashboardCache"
import { useProduksiCache } from "@/lib/hooks/useProduksiCache"
import { useTraySummaryRealtime } from "@/lib/hooks/useTraySummaryRealtime"
import { useDapurContext } from "@/lib/context/DapurContext"
import Skeleton from "@/components/ui/Skeleton"
import {
  CheckCircle,
  TrendingUp,
  CheckCircle2,
  ArrowUp,
  ChevronDown,
  Wifi,
  Edit2,
  Save,
  X,
} from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
const REFRESH_INTERVAL = 120000
const SkeletonLoader = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-3 w-64 bg-gray-100 rounded" />
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-10 w-full bg-gray-100 rounded-lg" />
        <div className="h-20 w-full bg-gray-50 rounded-lg" />
      </div>
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-16 w-24 bg-gray-100 rounded" />
        <div className="h-4 w-48 bg-gray-50 rounded" />
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
  const [sekolahDetails, setSekolahDetails] = useState<{ [key: string]: any }>({})
  const [loadingDetail, setLoadingDetail] = useState<{ [key: string]: boolean }>({})
  const [selectedSekolahId, setSelectedSekolahId] = useState<string>("")
  const { traySummary, loading: loadingTraySummary, isConnected: wsConnected, updateManualCount } = useTraySummaryRealtime(selectedSekolahId)
  
  // ✅ State for Manual Tray Input
  const [isEditingTray, setIsEditingTray] = useState(false)
  const [manualTrayInputValue, setManualTrayInputValue] = useState<string>("")
  const [isSavingManualTray, setIsSavingManualTray] = useState(false)

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
        console.log("🔄 [DashboardDapur] Calling loadData()...");
        const data = await loadData()
        if (data) {
          console.log(`✅ [DashboardDapur] Received data: ${data.menuPlanningData?.length} plannings`);
          setMenuPlanningData(data.menuPlanningData || [])
          setStats(data.stats || { targetHariIni: 0, totalSekolah: 0 })
        } else {
          console.warn("⚠️ [DashboardDapur] loadData() returned no data");
        }
      } catch (err) {
        console.error("❌ [DashboardDapur] Failed to load dashboard data:", err)
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

  // ✅ Combined loading state
  const { isLoading: contextLoading } = useDapurContext()
  const isActuallyLoading = dashboardLoading || contextLoading || !isLoadingComplete

  // 🔥 OPTIMIZATION: Show dashboard as soon as dashboard data loads
  useEffect(() => {
    if (!dashboardLoading && !contextLoading) {
      // Delay setting complete a tiny bit to avoid flickering if data is very fast
      const timer = setTimeout(() => setIsLoadingComplete(true), 100)
      return () => clearTimeout(timer)
    }
  }, [dashboardLoading, contextLoading])

  return (
    <DapurLayout currentPage="dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Dapur</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang, {userInfo.dapurName}</p>
        </div>

        <>
          {isActuallyLoading ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* Daftar Sekolah */}
              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Daftar Sekolah ({Array.from(new Map(menuPlanningData.map(p => [p.sekolahId, p])).values()).length})
                </h2>
                <div className="space-y-2">
                  {Array.from(new Map(menuPlanningData.map(p => [p.sekolahId, p])).values()).map((planning) => {
                    const isExpanded = expandedSekolahId === planning.sekolahId
                    return (
                      <div
                        key={planning.sekolahId}
                        className={`border rounded-xl transition-all cursor-pointer ${
                          isExpanded ? 'border-[#D0B064] bg-[#D0B064]/5' : 'border-[#D0B064]/30 hover:border-[#D0B064]/60'
                        }`}
                        onClick={() => {
                          if (!isExpanded) {
                            fetchSekolahDetail(planning.sekolahId)
                          }
                          setExpandedSekolahId(isExpanded ? null : planning.sekolahId)
                        }}
                      >
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 text-sm">{planning.sekolahNama}</p>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 border border-black rounded ${planning.linkStatus === 'APPROVED' ? 'bg-green-400 text-black' : 'bg-yellow-300 text-black'}`}>
                                  {planning.linkStatus || 'PENDING'}
                                </span>
                              </div>
                              {!isExpanded && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{planning.sekolahAlamat}</p>
                              )}
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Alamat</p>
                                <p className="text-sm text-gray-900 mt-0.5">{planning.sekolahAlamat || sekolahDetails[planning.sekolahId]?.alamat || "—"}</p>
                              </div>

                              {loadingDetail[planning.sekolahId] ? (
                                <p className="text-xs text-gray-400 animate-pulse">Memuat data PIC...</p>
                              ) : (
                                (() => {
                                  const detailData = sekolahDetails[planning.sekolahId]
                                  const picList = detailData?.picSekolah || planning.picSekolah
                                  const pic = picList?.[0] || picList

                                  return pic ? (
                                    <div className="bg-white border border-gray-100 rounded-lg p-3">
                                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Person In Charge</p>
                                      <div className="space-y-1 text-sm">
                                        <p className="text-gray-900">
                                          <span className="text-gray-500">Nama:</span> {pic.name || pic.namaLengkap || "—"}
                                        </p>
                                        {(pic.phone || pic.noHp) && (
                                          <p className="text-gray-900">
                                            <span className="text-gray-500">Telepon:</span> {pic.phone || pic.noHp}
                                          </p>
                                        )}
                                        {pic.email && (
                                          <p className="text-gray-900">
                                            <span className="text-gray-500">Email:</span> {pic.email}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400">Data PIC tidak tersedia</p>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Total Tray Siap Dikirim */}
                <div className="border border-[#D0B064]/30 rounded-xl p-6 bg-white flex flex-col">
                  <h2 className="text-sm font-bold text-[#1B263A] uppercase tracking-wider mb-1">Total Tray Siap Dikirim</h2>
                  <p className="text-xs text-gray-500 mb-4">Status pengiriman tray per sekolah</p>

                  {/* Dropdown Sekolah */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Pilih Sekolah</label>
                      {selectedSekolahId && wsConnected && (
                        <div className="flex items-center gap-1">
                          <Wifi className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-xs text-green-600 font-medium">Live</span>
                        </div>
                      )}
                    </div>
                    <select
                      value={selectedSekolahId}
                      onChange={(e) => setSelectedSekolahId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      <option value="">-- Pilih Sekolah --</option>
                      {Array.from(new Map(menuPlanningData.map(p => [p.sekolahId, p])).values()).map((planning) => (
                        <option key={planning.sekolahId} value={planning.sekolahId}>
                          {planning.sekolahNama}
                        </option>
                      ))}
                    </select>
                  </div>

                  {loadingTraySummary && !traySummary ? (
                    <p className="text-sm text-[#D0B064] py-6 text-center animate-pulse">Memuat data tray...</p>
                  ) : selectedSekolahId && traySummary ? (
                    <div className="bg-white border border-[#D0B064]/20 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">Total Tray Siap Dikirim</p>
                        {!isEditingTray && (
                          <button 
                            onClick={() => {
                              setIsEditingTray(true)
                              setManualTrayInputValue(String(traySummary?.manualTrayCount ?? traySummary?.totalTrayUnik ?? 0))
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Input Manual"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {isEditingTray ? (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            value={manualTrayInputValue}
                            onChange={(e) => setManualTrayInputValue(e.target.value)}
                            className="w-20 px-3 py-2 text-xl font-bold text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                            autoFocus
                          />
                          <button
                            onClick={async () => {
                              let harianId = traySummary?.menuHarianId
                              if (!harianId && selectedSekolahId) {
                                const planning = menuPlanningData.find(p => p.sekolahId === selectedSekolahId)
                                if (planning?.todayMenu?.id) {
                                  harianId = planning.todayMenu.id
                                }
                              }
                              if (!harianId) {
                                alert("Gagal menyimpan: ID Menu Harian tidak ditemukan.")
                                return
                              }
                              setIsSavingManualTray(true)
                              try {
                                const success = await updateManualCount(harianId, parseInt(manualTrayInputValue))
                                if (success) setIsEditingTray(false)
                              } catch (err) {
                                console.error("Error saving manual count:", err)
                              } finally {
                                setIsSavingManualTray(false)
                              }
                            }}
                            disabled={isSavingManualTray}
                            className="p-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] disabled:opacity-50 transition-colors"
                          >
                            {isSavingManualTray ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setIsEditingTray(false)}
                            className="p-2 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-4xl font-bold text-[#1B263A] mt-2">
                          {traySummary?.manualTrayCount !== null && traySummary?.manualTrayCount !== undefined
                            ? traySummary.manualTrayCount 
                            : (traySummary?.totalTrayUnik !== undefined && traySummary?.totalTrayUnik !== null
                                ? traySummary.totalTrayUnik
                                : traySummary?.total !== undefined && traySummary?.total !== null
                                  ? traySummary.total
                                  : 0)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-400">Pilih sekolah untuk melihat data tray</p>
                    </div>
                  )}
                </div>

                {/* Target Hari Ini */}
                <div className="border border-[#1B263A]/15 rounded-xl p-6 bg-white flex flex-col">
                  <h2 className="text-sm font-bold text-[#1B263A] uppercase tracking-wider mb-1">Target Produksi</h2>
                  <p className="text-xs text-gray-500 mb-5">Hari ini</p>

                  <p className="text-5xl font-bold text-[#1B263A] mb-6">
                    {stats.targetHariIni.toLocaleString()}
                    <span className="text-base font-medium text-gray-500 ml-2">unit</span>
                  </p>

                  <div className="space-y-3 pt-4 border-t border-[#1B263A]/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#1B263A]/60">Jumlah Sekolah</span>
                      <span className="font-bold text-[#1B263A]">{stats.totalSekolah}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#1B263A]/60">Per Sekolah</span>
                      <span className="font-bold text-[#1B263A]">
                        {stats.totalSekolah > 0 ? Math.round(stats.targetHariIni / stats.totalSekolah) : 0} unit
                      </span>
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