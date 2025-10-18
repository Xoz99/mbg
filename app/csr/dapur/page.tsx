// app/csr/dapur/page.tsx
'use client';
import { useState, useMemo } from 'react';
import CSRLayout from '@/components/layout/CSRLayout';
import {
  ChefHat, TrendingUp, Users, Package, AlertCircle,
  CheckCircle, Clock, DollarSign, Filter, Search
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CSRDapurDashboard = () => {
  const [selectedDapur, setSelectedDapur] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data Dapur yang di-support CSR
  const dapurList = useMemo(() => [
    {
      id: 'KTN-001',
      nama: 'Dapur Karawang Pusat',
      lokasi: 'Karawang',
      kapasitas: 6000,
      mealsTodayProduced: 5200,
      efficiency: 98.5,
      costPerMeal: 25000,
      budgetToday: 130000000,
      status: 'AKTIF',
      menuVariasi: 4,
      nutrisiCompliance: 96
    },
    {
      id: 'KTN-002',
      nama: 'Dapur Bekasi Timur',
      lokasi: 'Bekasi',
      kapasitas: 10000,
      mealsTodayProduced: 9500,
      efficiency: 97.2,
      costPerMeal: 24500,
      budgetToday: 232750000,
      status: 'AKTIF',
      menuVariasi: 4,
      nutrisiCompliance: 95
    },
    {
      id: 'KTN-003',
      nama: 'Dapur Depok',
      lokasi: 'Depok',
      kapasitas: 8500,
      mealsTodayProduced: 8200,
      efficiency: 96.5,
      costPerMeal: 25500,
      budgetToday: 209100000,
      status: 'AKTIF',
      menuVariasi: 3,
      nutrisiCompliance: 93
    },
    {
      id: 'KTN-004',
      nama: 'Dapur Bogor Selatan',
      lokasi: 'Bogor',
      kapasitas: 5000,
      mealsTodayProduced: 4800,
      efficiency: 95.8,
      costPerMeal: 26000,
      budgetToday: 124800000,
      status: 'AKTIF',
      menuVariasi: 3,
      nutrisiCompliance: 91
    }
  ], []);

  // Production trend
  const productionTrend = useMemo(() => [
    { hari: 'Senin', produced: 18500, target: 19000, waste: 420 },
    { hari: 'Selasa', produced: 19200, target: 19000, waste: 380 },
    { hari: 'Rabu', produced: 18800, target: 19000, waste: 410 },
    { hari: 'Kamis', produced: 19500, target: 19000, waste: 350 },
    { hari: 'Jumat', produced: 18900, target: 19000, waste: 390 },
    { hari: 'Sabtu', produced: 18100, target: 18000, waste: 320 },
    { hari: 'Minggu', produced: 18400, target: 18000, waste: 340 }
  ], []);

  // Cost per meal trend
  const costTrend = useMemo(() => [
    { bulan: 'Jan', costPerMeal: 24800 },
    { bulan: 'Feb', costPerMeal: 25000 },
    { bulan: 'Mar', costPerMeal: 25200 },
    { bulan: 'Apr', costPerMeal: 25100 },
    { bulan: 'Mei', costPerMeal: 25300 },
    { bulan: 'Jun', costPerMeal: 25500 },
    { bulan: 'Jul', costPerMeal: 25300 }
  ], []);

  const filteredDapur = useMemo(() => {
    let filtered = dapurList;
    if (selectedDapur !== 'all') {
      filtered = filtered.filter(d => d.id === selectedDapur);
    }
    if (searchQuery) {
      filtered = filtered.filter(d =>
        d.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.lokasi.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [dapurList, selectedDapur, searchQuery]);

  const stats = useMemo(() => ({
    totalDapur: dapurList.length,
    totalProduced: dapurList.reduce((sum, d) => sum + d.mealsTodayProduced, 0),
    avgEfficiency: (dapurList.reduce((sum, d) => sum + d.efficiency, 0) / dapurList.length).toFixed(1),
    avgCostPerMeal: (dapurList.reduce((sum, d) => sum + d.costPerMeal, 0) / dapurList.length).toFixed(0),
    avgNutriCompliance: (dapurList.reduce((sum, d) => sum + d.nutrisiCompliance, 0) / dapurList.length).toFixed(1)
  }), [dapurList]);

  const getStatusColor = (status: string) => {
    if (status === 'AKTIF') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'MAINTENANCE') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <CSRLayout currentPage="dapur">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Dapur</h2>
          <p className="text-gray-600">Monitor performa dapur yang mendukung program CSR Anda</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Dapur</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalDapur}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Meals Diproduksi Hari Ini</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalProduced.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Rata-rata Efisiensi</p>
            <p className="text-2xl font-bold text-green-600">{stats.avgEfficiency}%</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Cost per Meal</p>
            <p className="text-2xl font-bold text-orange-600">Rp {stats.avgCostPerMeal.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Nutrisi Compliance</p>
            <p className="text-2xl font-bold text-purple-600">{stats.avgNutriCompliance}%</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Production Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Trend Produksi (7 Hari)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={productionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hari" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="target" fill="#e0e7ff" stroke="#6366f1" name="Target" opacity={0.3} />
                <Line type="monotone" dataKey="produced" stroke="#10b981" strokeWidth={3} name="Diproduksi" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Trend Cost per Meal (7 Bulan)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={costTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bulan" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Line type="monotone" dataKey="costPerMeal" stroke="#f59e0b" strokeWidth={3} name="Cost" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari dapur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D0B064]"
              />
            </div>
            <select
              value={selectedDapur}
              onChange={(e) => setSelectedDapur(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              <option value="all">Semua Dapur</option>
              {dapurList.map(d => (
                <option key={d.id} value={d.id}>{d.nama}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dapur List */}
        <div className="space-y-4">
          {filteredDapur.map((dapur) => (
            <div key={dapur.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{dapur.nama}</h3>
                  <p className="text-sm text-gray-600 mt-1">{dapur.lokasi}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(dapur.status)}`}>
                  {dapur.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-gray-600">Kapasitas</p>
                  <p className="text-lg font-bold text-blue-700">{dapur.kapasitas.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-gray-600">Produksi Hari Ini</p>
                  <p className="text-lg font-bold text-green-700">{dapur.mealsTodayProduced.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-gray-600">Efisiensi</p>
                  <p className="text-lg font-bold text-purple-700">{dapur.efficiency}%</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-xs text-gray-600">Cost per Meal</p>
                  <p className="text-lg font-bold text-orange-700">Rp {(dapur.costPerMeal/1000).toFixed(0)}K</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                  <p className="text-xs text-gray-600">Menu Variasi</p>
                  <p className="text-lg font-bold text-pink-700">{dapur.menuVariasi} menu</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                  <p className="text-xs text-gray-600">Nutrisi Compliance</p>
                  <p className="text-lg font-bold text-indigo-700">{dapur.nutrisiCompliance}%</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  <strong>Budget Hari Ini:</strong> Rp {(dapur.budgetToday / 1000000).toFixed(0)}M
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CSRLayout>
  );
};

export default CSRDapurDashboard;