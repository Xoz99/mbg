'use client'

import { useState, useEffect } from 'react'
import DapurLayout from '@/components/layout/DapurLayout'
import { Download, Calendar, Loader2, AlertCircle, ChefHat, Truck, CheckCircle, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL||'https://demombgv1.xyz';

const LaporanProduksi = () => {
  const [period, setPeriod] = useState('minggu-ini')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState({
    totalMenu: 0,
    totalDelivery: 0,
    onTimeDelivery: 0,
    lateDelivery: 0,
    chartData: [] as any[],
    topMenus: [] as any[],
  })

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('authToken') || localStorage.getItem('mbg_token')
      if (!token) throw new Error('Token tidak ditemukan')

      const planningRes = await fetch(`${API_BASE_URL}/api/menu-planning`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!planningRes.ok) throw new Error('Gagal fetch menu planning')

      const planningJson = await planningRes.json()
      const planningList = planningJson.data?.data || []

      let allMenus: any[] = []
      for (const planning of planningList) {
        const harianRes = await fetch(
          `${API_BASE_URL}/api/menu-planning/${planning.id}/menu-harian`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (harianRes.ok) {
          const harianJson = await harianRes.json()
          const harianList = harianJson.data?.data || []
          allMenus = [...allMenus, ...harianList]
        }
      }

      let allDelivery: any[] = []
      const deliveryRes = await fetch(`${API_BASE_URL}/api/sekolah/1/pengiriman`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null)

      if (deliveryRes?.ok) {
        const deliveryJson = await deliveryRes.json()
        allDelivery = deliveryJson.data || []
      }

      const processed = processData(allMenus, allDelivery)
      setData(processed)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const processData = (menus: any[], deliveries: any[]) => {
    const deliveryArray = Array.isArray(deliveries) ? deliveries : []

    const dateMap: { [key: string]: number } = {}
    const menuMap: { [key: string]: number } = {}

    menus.forEach((menu) => {
      const name = menu.namaMenu || 'Unknown'
      menuMap[name] = (menuMap[name] || 0) + 1

      if (menu.tanggal) {
        const date = new Date(menu.tanggal).toLocaleDateString('id-ID', {
          weekday: 'short',
          month: 'short',
          day: '2-digit',
        })
        dateMap[date] = (dateMap[date] || 0) + 1
      }
    })

    const chartData = Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .slice(-7)

    const topMenus = Object.entries(menuMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const onTime = deliveryArray.filter((d) => d.status === 'DELIVERED' || d.scanSekolahTime).length
    const late = deliveryArray.length - onTime

    return {
      totalMenu: menus.length,
      totalDelivery: deliveryArray.length,
      onTimeDelivery: onTime,
      lateDelivery: late,
      chartData,
      topMenus,
    }
  }

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      let yPos = margin

      // Title
      doc.setFontSize(18)
      doc.setFont(undefined, 'bold')
      doc.text('Laporan Produksi & Pengiriman', margin, yPos)
      yPos += 10

      // Date
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, margin, yPos)
      yPos += 10

      // Stats Section
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('Ringkasan Statistik', margin, yPos)
      yPos += 8

      const onTimePercent = data.totalDelivery > 0 ? Math.round((data.onTimeDelivery / data.totalDelivery) * 100) : 0

      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`Total Diproduksi: ${data.totalMenu} menu`, margin, yPos)
      yPos += 6
      doc.text(`Total Dikirim: ${data.totalDelivery} pengiriman`, margin, yPos)
      yPos += 6
      doc.text(`Tepat Waktu: ${onTimePercent}%`, margin, yPos)
      yPos += 6
      doc.text(`Terlambat: ${data.lateDelivery} pengiriman`, margin, yPos)
      yPos += 15

      // Top Menus Section
      if (data.topMenus.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage()
          yPos = margin
        }

        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        doc.text('Top 10 Menu', margin, yPos)
        yPos += 8

        doc.setFontSize(9)
        doc.setFont(undefined, 'normal')
        data.topMenus.forEach((menu, idx) => {
          if (yPos > pageHeight - 20) {
            doc.addPage()
            yPos = margin
          }
          doc.text(`${idx + 1}. ${menu.name}: ${menu.count}x`, margin, yPos)
          yPos += 6
        })
        yPos += 10
      }

      // Trend Data Section
      if (data.chartData.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage()
          yPos = margin
        }

        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        doc.text('Trend Produksi Harian', margin, yPos)
        yPos += 8

        doc.setFontSize(9)
        doc.setFont(undefined, 'normal')
        data.chartData.forEach((item) => {
          if (yPos > pageHeight - 20) {
            doc.addPage()
            yPos = margin
          }
          doc.text(`${item.date}: ${item.count} menu`, margin, yPos)
          yPos += 6
        })
      }

      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(9)
        doc.setFont(undefined, 'normal')
        doc.text(
          `Halaman ${i} dari ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }

      doc.save(`Laporan-Produksi-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('Error:', err)
      alert('Gagal generate PDF')
    }
  }

  if (loading) {
    return (
      <DapurLayout currentPage="laporan">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Period Filter Skeleton */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse"></div>
                </div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="bg-gray-100 rounded h-80 animate-pulse"></div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 border-b border-gray-200 flex gap-4">
                  <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DapurLayout>
    )
  }

  if (error) {
    return (
      <DapurLayout currentPage="laporan">
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355]"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </DapurLayout>
    )
  }

  const onTimePercent = data.totalDelivery > 0 ? Math.round((data.onTimeDelivery / data.totalDelivery) * 100) : 0

  return (
    <DapurLayout currentPage="laporan">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Produksi & Pengiriman</h1>
          <p className="text-gray-600 text-sm mt-1">Analytics real-time produksi dan delivery</p>
        </div>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
        >
          <Download className="w-5 h-5" />
          Export PDF
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Periode:</span>
          {['hari-ini', 'minggu-ini', 'bulan-ini'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-[#D0B064] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'hari-ini' ? 'Hari Ini' : p === 'minggu-ini' ? 'Minggu Ini' : 'Bulan Ini'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-blue-600">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-600">TOTAL DIPRODUKSI</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalMenu}</p>
          <p className="text-xs text-gray-500">menu</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-green-600">
              <Truck className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-600">TOTAL DIKIRIM</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalDelivery}</p>
          <p className="text-xs text-gray-500">pengiriman</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-purple-600">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-600">TEPAT WAKTU</p>
          <p className="text-2xl font-bold text-gray-900">{onTimePercent}%</p>
          <p className="text-xs text-gray-500">{data.onTimeDelivery} dari {data.totalDelivery}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-orange-600">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-600">TERLAMBAT</p>
          <p className="text-2xl font-bold text-gray-900">{data.lateDelivery}</p>
          <p className="text-xs text-gray-500">pengiriman terlambat</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {data.chartData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Trend Produksi Harian</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.topMenus.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Menu</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.topMenus.map((menu, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs font-bold text-gray-400 w-6">{idx + 1}</span>
                    <div className="w-3 h-3 rounded-full bg-[#D0B064]"></div>
                    <span className="text-sm font-medium text-gray-700">{menu.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                    {menu.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Ringkasan Laporan</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Metrik</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Nilai</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">Total Produksi</td>
              <td className="px-6 py-4 text-sm text-gray-700">{data.totalMenu} menu</td>
              <td className="px-6 py-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  Aktif
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">On-Time Delivery</td>
              <td className="px-6 py-4 text-sm text-gray-700">{onTimePercent}%</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  onTimePercent >= 90 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {onTimePercent >= 90 ? 'Excellent' : 'Good'}
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">Late Delivery</td>
              <td className="px-6 py-4 text-sm text-gray-700">{data.lateDelivery} pengiriman</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  data.lateDelivery === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {data.lateDelivery === 0 ? 'No Delays' : 'Has Delays'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DapurLayout>
  )
}

export default LaporanProduksi