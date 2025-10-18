'use client';

import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import DapurLayout from '@/components/layout/DapurLayout';
import { 
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  BarChart3,
  History,
  Minus,
  RefreshCw,
  Image as ImageIcon,
  MapPin,
  Truck,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

const API_BASE_URL = "http://72.60.79.126:3000"

// Skeleton Components
const SkeletonStatCard = () => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3"></div>
    <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
    <div className="h-7 w-16 bg-gray-300 rounded mb-2"></div>
    <div className="h-3 w-20 bg-gray-200 rounded"></div>
  </div>
);

const SkeletonChartContainer = ({ title, height = "h-80" }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
    <div className={`w-full ${height} bg-gray-100 rounded-lg`}></div>
  </div>
);

const SkeletonTableRow = () => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </td>
  </tr>
);

const SkeletonLoading = () => (
  <DapurLayout currentPage="bahan">
    {/* Header Skeleton */}
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <div className="lg:col-span-3">
        <SkeletonChartContainer title="Level Stok Bahan" height="h-80" />
      </div>
      <div className="lg:col-span-2">
        <SkeletonChartContainer title="Riwayat Penggunaan (7 Hari)" height="h-64" />
      </div>
    </div>

    {/* Search & Filter Skeleton */}
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6 animate-pulse">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    {/* Table Skeleton */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bahan</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Stok</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[...Array(8)].map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </DapurLayout>
);

// Stock Level Chart
const StockLevelChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
      <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <Tooltip />
      <Bar dataKey="stock" radius={[8, 8, 0, 0]}>
        {data.map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={entry.status === 'CRITICAL' ? '#ef4444' : entry.status === 'LOW' ? '#f59e0b' : '#22c55e'} 
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
));

StockLevelChart.displayName = 'StockLevelChart';

// Usage History Chart
const UsageHistoryChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="in" stroke="#22c55e" strokeWidth={2} name="Masuk" />
      <Line type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2} name="Keluar" />
    </LineChart>
  </ResponsiveContainer>
));

UsageHistoryChart.displayName = 'UsageHistoryChart';

const StokBahanBaku = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterCategory, setFilterCategory] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState(0);

  // API State
  const [stokItems, setStokItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dapurId, setDapurId] = useState("");
  const [authToken, setAuthToken] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    nama: "",
    kategori: "STAPLE",
    stokKg: 0,
  });

  const isFetchingRef = useRef(false);

  // Fetch stok data from API
  const fetchStok = useCallback(async () => {
    if (!dapurId || !authToken || isFetchingRef.current) {
      if (!dapurId || !authToken) {
        setError("Dapur ID atau Token tidak tersedia");
      }
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}/api/dapur/${dapurId}/stok?page=1&limit=100${
        filterCategory !== "semua" ? `&kategori=${filterCategory}` : ""
      }`;

      console.log("[FETCH STOK] URL:", url);
      console.log("[FETCH STOK] DapurId:", dapurId);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[FETCH STOK] Response status:", response.status);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("[FETCH STOK] Response data:", data);

      // Extract stok list dengan berbagai kemungkinan struktur
      let stokList = [];
      if (Array.isArray(data.data?.data)) {
        stokList = data.data.data;
      } else if (Array.isArray(data.data)) {
        stokList = data.data;
      } else if (Array.isArray(data)) {
        stokList = data;
      }

      console.log("[FETCH STOK] Total items:", stokList.length);
      setStokItems(stokList);
    } catch (err: any) {
      setError(err.message || "Gagal mengambil data stok");
      console.error("[FETCH STOK] Error:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [dapurId, authToken, filterCategory]);

  // Create stok
  const handleCreateStok = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const payload = {
        dapurId: dapurId,  // Tambah dapurId
        nama: formData.nama,
        kategori: formData.kategori,
        stokKg: parseFloat(formData.stokKg.toString()),
      };

      console.log("[CREATE STOK] Payload:", payload);

      const url = `${API_BASE_URL}/api/stok`;
      console.log("[CREATE STOK] URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("[CREATE STOK] Response status:", response.status);
      const responseText = await response.text();
      console.log("[CREATE STOK] Response:", responseText);

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log("[CREATE STOK] Success:", data);

      setFormData({ nama: "", kategori: "STAPLE", stokKg: 0 });
      setShowAddModal(false);
      await fetchStok();
      alert("Stok berhasil ditambahkan!");
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
      console.error("[CREATE STOK] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Adjust stok
  const handleAdjustStok = async () => {
    try {
      if (!adjustItem || adjustAmount === 0) {
        alert("Masukkan jumlah adjustment yang valid");
        return;
      }

      // Validasi: jangan sampe stok jadi negatif
      const newStock = adjustItem.stokKg + adjustAmount;
      if (newStock < 0) {
        alert(`Stok tidak cukup! Stok saat ini: ${adjustItem.stokKg} kg`);
        return;
      }

      setLoading(true);
      const payload = { adjustment: adjustAmount };

      const url = `${API_BASE_URL}/api/stok/${adjustItem.id || adjustItem._id}/adjust`;
      console.log("[ADJUST STOK] URL:", url);
      console.log("[ADJUST STOK] Current stock:", adjustItem.stokKg);
      console.log("[ADJUST STOK] Adjustment:", adjustAmount);
      console.log("[ADJUST STOK] New stock will be:", newStock);

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("[ADJUST STOK] Response status:", response.status);
      const responseText = await response.text();
      console.log("[ADJUST STOK] Response:", responseText);

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log("[ADJUST STOK] Success:", data);

      setShowAdjustModal(false);
      setAdjustItem(null);
      setAdjustAmount(0);
      await fetchStok();
      alert("Stok berhasil diperbarui!");
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
      console.error("[ADJUST STOK] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete stok
  const handleDeleteStok = async (stokId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus stok ini?")) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/stok/${stokId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus stok");
      }

      await fetchStok();
      setSelectedItem(null);
      alert("Stok berhasil dihapus!");
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan");
      console.error("[DELETE STOK] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize dari localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
    const storedDapurId = localStorage.getItem("dapurId") || localStorage.getItem("userDapurId");

    if (storedToken && storedToken !== authToken) setAuthToken(storedToken);
    if (storedDapurId && storedDapurId !== dapurId) setDapurId(storedDapurId);

    if (!storedToken || !storedDapurId) {
      setLoading(false);
      setError("Token atau Dapur ID tidak ditemukan. Silakan login.");
    }
  }, [authToken, dapurId]);

  // Fetch stok ketika dapurId atau authToken berubah
  useEffect(() => {
    if (dapurId && authToken) {
      fetchStok();
    }
  }, [dapurId, authToken, filterCategory, fetchStok]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = stokItems;

    if (filterStatus !== 'semua') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (filterCategory !== 'semua') {
      filtered = filtered.filter(item => item.kategori === filterCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [stokItems, filterStatus, filterCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const critical = stokItems.filter(i => i.status === 'CRITICAL').length;
    const low = stokItems.filter(i => i.status === 'LOW').length;
    const good = stokItems.filter(i => i.status === 'GOOD').length;
    
    return { 
      critical, 
      low, 
      good, 
      totalItems: stokItems.length,
      needRestock: critical + low
    };
  }, [stokItems]);

  // Chart data
  const chartData = useMemo(() => 
    stokItems.slice(0, 8).map(item => ({
      name: item.nama,
      stock: item.stokKg || 0,
      status: item.status || 'GOOD'
    }))
  , [stokItems]);

  const usageHistory = useMemo(() => [
    { date: '08/01', in: 100, out: 50 },
    { date: '09/01', in: 120, out: 60 },
    { date: '10/01', in: 150, out: 80 },
    { date: '11/01', in: 100, out: 90 },
    { date: '12/01', in: 110, out: 85 },
    { date: '13/01', in: 140, out: 95 },
    { date: 'Today', in: 0, out: 70 }
  ], []);

  const getStatusConfig = (status: string) => {
    const configs = {
      GOOD: {
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle,
        text: 'Aman',
        dotColor: 'bg-green-500'
      },
      LOW: {
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: AlertCircle,
        text: 'Rendah',
        dotColor: 'bg-yellow-500 animate-pulse'
      },
      CRITICAL: {
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertCircle,
        text: 'Kritis',
        dotColor: 'bg-red-500 animate-pulse'
      },
    };
    return configs[status as keyof typeof configs] || configs.GOOD;
  };

  const getCategoryName = (category: string) => {
    const names = {
      STAPLE: 'Bahan Pokok',
      PROTEIN: 'Protein',
      VEGETABLE: 'Sayuran',
      SEASONING: 'Bumbu',
      OTHERS: 'Lainnya'
    };
    return names[category as keyof typeof names] || category;
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className={`p-2.5 rounded-lg ${color} mb-3 w-fit`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );

  if (loading && stokItems.length === 0) {
    return <SkeletonLoading />;
  }

  if (error && stokItems.length === 0) {
    return (
      <DapurLayout currentPage="bahan">
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                if (dapurId && authToken) fetchStok();
              }}
              className="px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </DapurLayout>
    );
  }

  return (
    <DapurLayout currentPage="bahan">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Stok Bahan Baku</h1>
            <p className="text-gray-600">Kelola inventory dan monitoring stok ingredients</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchStok}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              Refresh
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Tambah Stok
            </button>
          </div>
        </div>
      </div>

      {/* Alert untuk stok kritis */}
      {stats.critical > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-bold text-red-900 text-lg mb-1">Perhatian - Stok Kritis!</p>
              <p className="text-sm text-red-700">
                {stats.critical} bahan dalam status kritis dan {stats.low} bahan stok rendah. Segera lakukan pemesanan!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="TOTAL ITEM" 
          value={stats.totalItems} 
          subtitle="jenis bahan" 
          icon={Package} 
          color="bg-blue-600"
        />
        <StatCard 
          title="STOK KRITIS" 
          value={stats.critical} 
          subtitle="perlu action segera"
          icon={AlertCircle} 
          color="bg-red-600"
        />
        <StatCard 
          title="STOK RENDAH" 
          value={stats.low} 
          subtitle="mendekati habis" 
          icon={AlertCircle} 
          color="bg-yellow-600"
        />
        <StatCard 
          title="PERLU RESTOCK" 
          value={stats.needRestock} 
          subtitle="di bawah reorder point" 
          icon={ShoppingCart} 
          color="bg-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Level Stok Bahan</h3>
          <StockLevelChart data={chartData} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Riwayat Penggunaan (7 Hari)</h3>
          <UsageHistoryChart data={usageHistory} />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari bahan atau supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Status:</span>
            {['semua', 'CRITICAL', 'LOW', 'GOOD'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-[#D0B064] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'semua' ? 'Semua' : status === 'CRITICAL' ? 'Kritis' : status === 'LOW' ? 'Rendah' : 'Aman'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Kategori:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            >
              <option value="semua">Semua</option>
              <option value="STAPLE">Bahan Pokok</option>
              <option value="PROTEIN">Protein</option>
              <option value="VEGETABLE">Sayuran</option>
              <option value="SEASONING">Bumbu</option>
              <option value="OTHERS">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bahan</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Stok</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Tidak ada data stok</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const statusConfig = getStatusConfig(item.status || 'GOOD');
                  
                  return (
                    <tr key={item.id || item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.nama}</p>
                            <p className="text-xs text-gray-500">{item.supplier || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                          {getCategoryName(item.kategori)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{item.stokKg} kg</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                          {statusConfig.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustItem(item);
                              setAdjustAmount(0);
                              setShowAdjustModal(true);
                            }}
                            className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Adjust stok"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stok Modal */}
      {showAdjustModal && adjustItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold">Sesuaikan Stok</h3>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustItem(null);
                  setAdjustAmount(0);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold mb-1">Item</p>
                <p className="text-lg font-bold text-blue-900">{adjustItem.nama}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold mb-1">Stok Saat Ini</p>
                <p className="text-2xl font-bold text-gray-900">{adjustItem.stokKg} kg</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Perubahan (kg)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                    placeholder="Contoh: 5 (tambah) atau -3 (kurang)"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  • Angka positif = tambah stok (contoh: 5)
                  <br />
                  • Angka negatif = kurangi stok (contoh: -3)
                </p>
              </div>

              {adjustAmount !== 0 && (
                <div className={`rounded-xl p-4 ${adjustAmount > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-xs font-semibold mb-1 ${adjustAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Stok Baru
                  </p>
                  <p className={`text-2xl font-bold ${adjustAmount > 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {adjustItem.stokKg + adjustAmount} kg
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustModal(false);
                    setAdjustItem(null);
                    setAdjustAmount(0);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleAdjustStok}
                  disabled={loading || adjustAmount === 0}
                  className="flex-1 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  Perbarui
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold">Tambah Stok</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateStok} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Bahan</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                  placeholder="Contoh: Beras"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                >
                  <option value="STAPLE">Bahan Pokok</option>
                  <option value="PROTEIN">Protein</option>
                  <option value="VEGETABLE">Sayuran</option>
                  <option value="SEASONING">Bumbu</option>
                  <option value="OTHERS">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah (kg)</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  value={formData.stokKg}
                  onChange={(e) => setFormData({ ...formData, stokKg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                  placeholder="Contoh: 50.5"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold">{selectedItem.nama}</h3>
                <p className="text-sm text-white/70 mt-1">{getCategoryName(selectedItem.kategori)}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {(selectedItem.status === 'CRITICAL' || selectedItem.status === 'LOW') && (
                <div className={`${selectedItem.status === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-4`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 ${selectedItem.status === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600'} mt-0.5 animate-pulse`} />
                    <div>
                      <p className={`font-semibold ${selectedItem.status === 'CRITICAL' ? 'text-red-900' : 'text-yellow-900'}`}>
                        {selectedItem.status === 'CRITICAL' ? 'Stok Kritis!' : 'Stok Rendah!'}
                      </p>
                      <p className={`text-sm ${selectedItem.status === 'CRITICAL' ? 'text-red-700' : 'text-yellow-700'} mt-1`}>
                        Segera lakukan pemesanan ulang!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <Package className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-xs text-blue-600 mb-1">Stok Saat Ini</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedItem.stokKg}</p>
                  <p className="text-xs text-blue-600 mt-1">kg</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <BarChart3 className="w-5 h-5 text-purple-600 mb-2" />
                  <p className="text-xs text-purple-600 mb-1">Kategori</p>
                  <p className="font-semibold text-purple-900 text-sm">{getCategoryName(selectedItem.kategori)}</p>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <Calendar className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-xs text-green-600 mb-1">Dibuat</p>
                  <p className="font-semibold text-green-900 text-sm">
                    {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString('id-ID') : '-'}
                  </p>
                </div>
              </div>

              {selectedItem.supplier && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Supplier</p>
                      <p className="font-semibold text-gray-900">{selectedItem.supplier}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-yellow-700 font-semibold mb-1 uppercase tracking-wide">Catatan</p>
                      <p className="text-sm text-yellow-900">{selectedItem.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setAdjustItem(selectedItem);
                    setAdjustAmount(0);
                    setShowAdjustModal(true);
                    setSelectedItem(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all font-bold"
                >
                  <RefreshCw className="w-5 h-5" />
                  Sesuaikan Stok
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    handleDeleteStok(selectedItem.id || selectedItem._id);
                  }}
                  className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DapurLayout>
  );
};

export default StokBahanBaku;