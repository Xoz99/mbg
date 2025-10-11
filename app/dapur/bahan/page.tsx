// app/dapur/bahan/page.tsx
'use client';

import { useState, useMemo, memo } from 'react';
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
  Truck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

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

  // Inventory Items - Sesuai dengan ingredients di menu
  const inventoryItems = useMemo(() => [
    {
      id: 'INV-001',
      name: 'Beras',
      category: 'STAPLE', // STAPLE, PROTEIN, VEGETABLE, SEASONING, OTHERS
      unit: 'kg',
      currentStock: 2150,
      minStock: 500,
      maxStock: 3000,
      reorderPoint: 800,
      status: 'GOOD', // GOOD, LOW, CRITICAL, OVERSTOCK
      avgDailyUsage: 850,
      estimatedDaysLeft: 2.5,
      lastRestockDate: '2025-01-10',
      lastRestockQty: 1500,
      supplier: 'PT Beras Jaya',
      pricePerUnit: 12000,
      location: 'Gudang A - Rak 1',
      photoUrl: '/photos/beras.jpg',
      expiryDate: null,
      notes: 'Beras IR64 kualitas premium'
    },
    {
      id: 'INV-002',
      name: 'Daging Sapi',
      category: 'PROTEIN',
      unit: 'kg',
      currentStock: 45,
      minStock: 80,
      maxStock: 200,
      reorderPoint: 100,
      status: 'CRITICAL',
      avgDailyUsage: 120,
      estimatedDaysLeft: 0.4,
      lastRestockDate: '2025-01-12',
      lastRestockQty: 150,
      supplier: 'CV Sumber Protein',
      pricePerUnit: 135000,
      location: 'Cold Storage B',
      photoUrl: '/photos/daging.jpg',
      expiryDate: '2025-01-20',
      notes: 'Simpan di suhu -18°C. Bagian has dalam.'
    },
    {
      id: 'INV-003',
      name: 'Ayam',
      category: 'PROTEIN',
      unit: 'kg',
      currentStock: 280,
      minStock: 150,
      maxStock: 400,
      reorderPoint: 200,
      status: 'GOOD',
      avgDailyUsage: 180,
      estimatedDaysLeft: 1.6,
      lastRestockDate: '2025-01-11',
      lastRestockQty: 200,
      supplier: 'PT Unggas Segar',
      pricePerUnit: 38000,
      location: 'Cold Storage A',
      photoUrl: '/photos/ayam.jpg',
      expiryDate: '2025-01-18',
      notes: 'Ayam broiler fresh, simpan dingin'
    },
    {
      id: 'INV-004',
      name: 'Sayur Asem Mix',
      category: 'VEGETABLE',
      unit: 'kg',
      currentStock: 85,
      minStock: 100,
      maxStock: 300,
      reorderPoint: 150,
      status: 'LOW',
      avgDailyUsage: 200,
      estimatedDaysLeft: 0.4,
      lastRestockDate: '2025-01-13',
      lastRestockQty: 180,
      supplier: 'Pasar Induk Sayur',
      pricePerUnit: 8500,
      location: 'Gudang Dingin C',
      photoUrl: null,
      expiryDate: '2025-01-15',
      notes: 'Kacang panjang, labu siam, jagung. Harus segera digunakan.'
    },
    {
      id: 'INV-005',
      name: 'Minyak Goreng',
      category: 'OTHERS',
      unit: 'liter',
      currentStock: 145,
      minStock: 80,
      maxStock: 300,
      reorderPoint: 120,
      status: 'GOOD',
      avgDailyUsage: 50,
      estimatedDaysLeft: 2.9,
      lastRestockDate: '2025-01-09',
      lastRestockQty: 200,
      supplier: 'PT Minyak Sehat',
      pricePerUnit: 16000,
      location: 'Gudang A - Rak 3',
      photoUrl: null,
      expiryDate: '2025-06-30',
      notes: 'Minyak goreng kemasan jerigen 5L'
    },
    {
      id: 'INV-006',
      name: 'Bumbu Rendang',
      category: 'SEASONING',
      unit: 'kg',
      currentStock: 25,
      minStock: 20,
      maxStock: 80,
      reorderPoint: 30,
      status: 'GOOD',
      avgDailyUsage: 35,
      estimatedDaysLeft: 0.7,
      lastRestockDate: '2025-01-12',
      lastRestockQty: 40,
      supplier: 'CV Bumbu Nusantara',
      pricePerUnit: 45000,
      location: 'Gudang A - Rak 5',
      photoUrl: null,
      expiryDate: '2025-04-30',
      notes: 'Bumbu halus siap pakai'
    },
    {
      id: 'INV-007',
      name: 'Kerupuk',
      category: 'OTHERS',
      unit: 'kg',
      currentStock: 180,
      minStock: 50,
      maxStock: 250,
      reorderPoint: 80,
      status: 'GOOD',
      avgDailyUsage: 50,
      estimatedDaysLeft: 3.6,
      lastRestockDate: '2025-01-08',
      lastRestockQty: 150,
      supplier: 'UD Kerupuk Enak',
      pricePerUnit: 28000,
      location: 'Gudang A - Rak 4',
      photoUrl: null,
      expiryDate: '2025-05-30',
      notes: 'Mix kerupuk udang dan putih'
    },
    {
      id: 'INV-008',
      name: 'Kunyit',
      category: 'SEASONING',
      unit: 'kg',
      currentStock: 8,
      minStock: 10,
      maxStock: 30,
      reorderPoint: 15,
      status: 'CRITICAL',
      avgDailyUsage: 15,
      estimatedDaysLeft: 0.5,
      lastRestockDate: '2025-01-10',
      lastRestockQty: 20,
      supplier: 'Pasar Tradisional',
      pricePerUnit: 25000,
      location: 'Gudang A - Rak 5',
      photoUrl: null,
      expiryDate: '2025-01-25',
      notes: '⚠️ URGENT! Kunyit segar hampir habis, butuh restock segera!'
    },
    {
      id: 'INV-009',
      name: 'Pisang',
      category: 'OTHERS',
      unit: 'kg',
      currentStock: 320,
      minStock: 150,
      maxStock: 500,
      reorderPoint: 200,
      status: 'GOOD',
      avgDailyUsage: 150,
      estimatedDaysLeft: 2.1,
      lastRestockDate: '2025-01-13',
      lastRestockQty: 250,
      supplier: 'Pasar Buah Segar',
      pricePerUnit: 15000,
      location: 'Gudang Dingin D',
      photoUrl: null,
      expiryDate: '2025-01-17',
      notes: 'Mix pisang ambon dan kepok'
    },
    {
      id: 'INV-010',
      name: 'Jeruk',
      category: 'OTHERS',
      unit: 'kg',
      currentStock: 95,
      minStock: 100,
      maxStock: 300,
      reorderPoint: 150,
      status: 'LOW',
      avgDailyUsage: 200,
      estimatedDaysLeft: 0.5,
      lastRestockDate: '2025-01-13',
      lastRestockQty: 180,
      supplier: 'Pasar Buah Segar',
      pricePerUnit: 18000,
      location: 'Gudang Dingin D',
      photoUrl: null,
      expiryDate: '2025-01-20',
      notes: 'Jeruk manis untuk jus. Perlu restock besok.'
    }
  ], []);

  // Usage history for chart
  const usageHistory = useMemo(() => [
    { date: '08/01', in: 1500, out: 850 },
    { date: '09/01', in: 200, out: 900 },
    { date: '10/01', in: 1500, out: 850 },
    { date: '11/01', in: 200, out: 880 },
    { date: '12/01', in: 150, out: 820 },
    { date: '13/01', in: 430, out: 850 },
    { date: 'Today', in: 0, out: 420 }
  ], []);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = inventoryItems;

    if (filterStatus !== 'semua') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (filterCategory !== 'semua') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [inventoryItems, filterStatus, filterCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const critical = inventoryItems.filter(i => i.status === 'CRITICAL').length;
    const low = inventoryItems.filter(i => i.status === 'LOW').length;
    const good = inventoryItems.filter(i => i.status === 'GOOD').length;
    const totalValue = inventoryItems.reduce((acc, i) => acc + (i.currentStock * i.pricePerUnit), 0);
    const needRestock = inventoryItems.filter(i => i.currentStock <= i.reorderPoint).length;
    
    return { critical, low, good, totalValue, needRestock, totalItems: inventoryItems.length };
  }, [inventoryItems]);

  // Chart data for stock levels
  const chartData = useMemo(() => 
    inventoryItems.slice(0, 8).map(item => ({
      name: item.name,
      stock: item.currentStock,
      status: item.status
    }))
  , [inventoryItems]);

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
      OVERSTOCK: {
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: TrendingUp,
        text: 'Berlebih',
        dotColor: 'bg-blue-500'
      }
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

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );

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
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-sm">
              <Download className="w-5 h-5" />
              Export
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
              <p className="text-sm text-red-700 mb-2">
                {stats.critical} bahan dalam status kritis dan {stats.low} bahan stok rendah. Segera lakukan pemesanan!
              </p>
              <button className="text-sm font-semibold text-red-700 hover:text-red-800 underline">
                Lihat Bahan Kritis →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
        <StatCard 
          title="NILAI INVENTORI" 
          value={`Rp ${(stats.totalValue / 1000000).toFixed(1)}jt`}
          subtitle="total aset stok" 
          icon={TrendingUp} 
          color="bg-purple-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Stock Level Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Level Stok Bahan</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Aman</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-gray-600">Rendah</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600">Kritis</span>
              </div>
            </div>
          </div>
          <StockLevelChart data={chartData} />
        </div>

        {/* Usage History */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Riwayat Penggunaan (7 Hari)</h3>
          <UsageHistoryChart data={usageHistory} />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
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

          {/* Status Filter */}
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

          {/* Category Filter */}
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Est. Habis</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Lokasi</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const statusConfig = getStatusConfig(item.status);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.photoUrl ? (
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.supplier}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                        {getCategoryName(item.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.currentStock.toLocaleString()} {item.unit}</p>
                        <p className="text-xs text-gray-500">Min: {item.minStock} {item.unit}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                        <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                        {statusConfig.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.estimatedDaysLeft.toFixed(1)} hari</p>
                        <p className="text-xs text-gray-500">{item.avgDailyUsage} {item.unit}/hari</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs">{item.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="p-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.status === 'CRITICAL' || item.status === 'LOW' ? (
                          <button className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        ) : (
                          <button className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-sm font-bold bg-white/20 px-3 py-1 rounded-lg">{selectedItem.id}</span>
                  {(() => {
                    const statusConfig = getStatusConfig(selectedItem.status);
                    return (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/30">
                        <statusConfig.icon className="w-4 h-4" />
                        {statusConfig.text}
                      </span>
                    );
                  })()}
                </div>
                <h3 className="text-xl font-bold">{selectedItem.name}</h3>
                <p className="text-sm text-white/70 mt-1">{getCategoryName(selectedItem.category)}</p>
              </div>
              <button 
                onClick={() => setSelectedItem(null)} 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Alert jika kritis */}
              {(selectedItem.status === 'CRITICAL' || selectedItem.status === 'LOW') && (
                <div className={`${selectedItem.status === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-4`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 ${selectedItem.status === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600'} mt-0.5 animate-pulse`} />
                    <div>
                      <p className={`font-semibold ${selectedItem.status === 'CRITICAL' ? 'text-red-900' : 'text-yellow-900'}`}>
                        {selectedItem.status === 'CRITICAL' ? 'Stok Kritis!' : 'Stok Rendah!'}
                      </p>
                      <p className={`text-sm ${selectedItem.status === 'CRITICAL' ? 'text-red-700' : 'text-yellow-700'} mt-1`}>
                        Estimasi habis dalam {selectedItem.estimatedDaysLeft.toFixed(1)} hari. Segera lakukan pemesanan ulang!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <Package className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-xs text-blue-600 mb-1">Stok Saat Ini</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedItem.currentStock}</p>
                  <p className="text-xs text-blue-600 mt-1">{selectedItem.unit}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-xs text-green-600 mb-1">Stok Maksimal</p>
                  <p className="text-2xl font-bold text-green-900">{selectedItem.maxStock}</p>
                  <p className="text-xs text-green-600 mt-1">{selectedItem.unit}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <AlertCircle className="w-5 h-5 text-orange-600 mb-2" />
                  <p className="text-xs text-orange-600 mb-1">Reorder Point</p>
                  <p className="text-2xl font-bold text-orange-900">{selectedItem.reorderPoint}</p>
                  <p className="text-xs text-orange-600 mt-1">{selectedItem.unit}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <TrendingDown className="w-5 h-5 text-red-600 mb-2" />
                  <p className="text-xs text-red-600 mb-1">Stok Minimal</p>
                  <p className="text-2xl font-bold text-red-900">{selectedItem.minStock}</p>
                  <p className="text-xs text-red-600 mt-1">{selectedItem.unit}</p>
                </div>
              </div>

              {/* Usage & Cost Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Info Penggunaan</h4>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Rata-rata per Hari</p>
                      <p className="font-semibold text-gray-900">{selectedItem.avgDailyUsage} {selectedItem.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Estimasi Habis</p>
                      <p className="font-semibold text-gray-900">{selectedItem.estimatedDaysLeft.toFixed(1)} hari</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Info Biaya</h4>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-xs text-purple-600">Harga per {selectedItem.unit}</p>
                      <p className="font-bold text-purple-900">Rp {selectedItem.pricePerUnit.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <Package className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-xs text-purple-600">Nilai Total Stok</p>
                      <p className="font-bold text-purple-900">Rp {(selectedItem.currentStock * selectedItem.pricePerUnit).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restock Info */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  Info Restock Terakhir
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600">Tanggal</p>
                      <p className="font-semibold text-gray-900">{selectedItem.lastRestockDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600">Jumlah</p>
                      <p className="font-semibold text-gray-900">{selectedItem.lastRestockQty} {selectedItem.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600">Supplier</p>
                      <p className="font-semibold text-gray-900 text-sm">{selectedItem.supplier}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage & Expiry */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Lokasi Penyimpanan</p>
                      <p className="font-semibold text-gray-900">{selectedItem.location}</p>
                    </div>
                  </div>
                </div>
                {selectedItem.expiryDate && (
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-xs text-yellow-600">Tanggal Kadaluarsa</p>
                        <p className="font-semibold text-yellow-900">{selectedItem.expiryDate}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowHistoryModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#1B263A] text-white rounded-xl hover:bg-[#2A3749] transition-all font-bold shadow-md hover:shadow-lg"
                >
                  <History className="w-5 h-5" />
                  Lihat Riwayat
                </button>
                {(selectedItem.status === 'CRITICAL' || selectedItem.status === 'LOW') && (
                  <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold shadow-md hover:shadow-lg">
                    <ShoppingCart className="w-5 h-5" />
                    Pesan Ulang
                  </button>
                )}
                <button className="px-5 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all font-bold">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="px-5 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all font-bold">
                  <Plus className="w-5 h-5" />
                </button>
                <button className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold">
                  <Minus className="w-5 h-5" />
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