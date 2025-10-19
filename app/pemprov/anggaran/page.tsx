// app/pemprov/anggaran/page.tsx
'use client';
import { useState, useMemo } from 'react';
import PemprovLayout from '@/components/layout/PemprovLayout';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Calendar, Download, Filter, Eye
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area
} from 'recharts';

const AnggaranPemprov = () => {
  const [period, setPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const budgetStats = useMemo(() => ({
    totalBudget: 12500000000,
    budgetUsed: 7680000000,
    budgetRemaining: 4820000000,
    percentageUsed: 61.4,
    projectedSpend: 12100000000,
    savingsProjected: 400000000
  }), []);

  const monthlyBudget = useMemo(() => [
    { month: 'Jan', allocated: 1041, actual: 960, projected: 1010 },
    { month: 'Feb', allocated: 1041, actual: 985, projected: 1015 },
    { month: 'Mar', allocated: 1041, actual: 960, projected: 1005 },
    { month: 'Apr', allocated: 1041, actual: 0, projected: 1041 },
    { month: 'Mei', allocated: 1041, actual: 0, projected: 1041 },
    { month: 'Jun', allocated: 1041, actual: 0, projected: 1008 }
  ], []);

  const budgetCategories = useMemo(() => [
    { 
      category: 'Bahan Baku', 
      allocated: 8125000000, 
      used: 5000000000, 
      percentage: 65,
      remaining: 3125000000,
      color: '#3b82f6' 
    },
    { 
      category: 'SDM & Gaji', 
      allocated: 2250000000, 
      used: 1350000000, 
      percentage: 18,
      remaining: 900000000,
      color: '#10b981' 
    },
    { 
      category: 'Logistik & Distribusi', 
      allocated: 1500000000, 
      used: 900000000, 
      percentage: 12,
      remaining: 600000000,
      color: '#f59e0b' 
    },
    { 
      category: 'Operasional', 
      allocated: 625000000, 
      used: 430000000, 
      percentage: 5,
      remaining: 195000000,
      color: '#8b5cf6' 
    }
  ], []);

  const cityBudget = useMemo(() => [
    { 
      city: 'Karawang', 
      allocated: 3100000000, 
      used: 1900000000, 
      percentage: 61.3,
      perStudent: 102700,
      efficiency: 98.5 
    },
    { 
      city: 'Bekasi', 
      allocated: 4200000000, 
      used: 2600000000, 
      percentage: 61.9,
      perStudent: 100000,
      efficiency: 97.8 
    },
    { 
      city: 'Bogor', 
      allocated: 2750000000, 
      used: 1700000000, 
      percentage: 61.8,
      perStudent: 111842,
      efficiency: 96.2 
    },
    { 
      city: 'Bandung', 
      allocated: 2450000000, 
      used: 1480000000, 
      percentage: 60.4,
      perStudent: 134545,
      efficiency: 95.5 
    }
  ], []);

  const expenseBreakdown = useMemo(() => [
    { item: 'Beras & Karbohidrat', amount: 2400000000, percentage: 31.2, trend: 2.1 },
    { item: 'Protein (Ayam, Ikan, Telur)', amount: 1620000000, percentage: 21.1, trend: 1.5 },
    { item: 'Sayuran & Buah', amount: 945000000, percentage: 12.3, trend: 3.2 },
    { item: 'Gaji Staff & Driver', amount: 1350000000, percentage: 17.6, trend: 0 },
    { item: 'BBM & Transport', amount: 720000000, percentage: 9.4, trend: -1.2 },
    { item: 'Peralatan & Maintenance', amount: 360000000, percentage: 4.7, trend: 0.5 },
    { item: 'Utilitas (Listrik, Air)', amount: 285000000, percentage: 3.7, trend: -0.8 }
  ], []);

  const budgetAlerts = useMemo(() => [
    { 
      type: 'warning', 
      category: 'Bahan Baku - Protein', 
      message: 'Penggunaan melebihi proyeksi 5%',
      amount: 81000000,
      date: '2025-01-10'
    },
    { 
      type: 'info', 
      category: 'Logistik', 
      message: 'Efisiensi BBM meningkat 12%',
      amount: -72000000,
      date: '2025-01-09'
    },
    { 
      type: 'success', 
      category: 'Operasional', 
      message: 'Penghematan utilitas tercapai',
      amount: -38000000,
      date: '2025-01-08'
    }
  ], []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1)}M`;
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(0)}Jt`;
    return `Rp ${value.toLocaleString()}`;
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trend > 0 ? 'bg-green-100 text-green-700' : trend < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );

  return (
    <PemprovLayout currentPage="anggaran">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengelolaan Anggaran</h1>
            <p className="text-sm text-gray-600 mt-1">Monitoring dan analisis penggunaan anggaran program MBG provinsi Anda</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] font-semibold text-sm">
              <Eye className="w-4 h-4" /> Detail Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-semibold text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="TOTAL ANGGARAN"
            value={formatCurrency(budgetStats.totalBudget)}
            subtitle="Alokasi tahun 2025"
            icon={DollarSign}
            color="bg-blue-600"
          />
          <StatCard
            title="ANGGARAN TERPAKAI"
            value={formatCurrency(budgetStats.budgetUsed)}
            subtitle={`${budgetStats.percentageUsed}% dari total`}
            icon={TrendingUp}
            color="bg-green-600"
            trend={2.1}
          />
          <StatCard
            title="SISA ANGGARAN"
            value={formatCurrency(budgetStats.budgetRemaining)}
            subtitle={`${(100 - budgetStats.percentageUsed).toFixed(1)}% tersisa`}
            icon={DollarSign}
            color="bg-purple-600"
          />
          <StatCard
            title="PROYEKSI HEMAT"
            value={formatCurrency(budgetStats.savingsProjected)}
            subtitle="Estimasi akhir tahun"
            icon={TrendingDown}
            color="bg-orange-600"
            trend={-2.1}
          />
        </div>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {budgetAlerts.map((alert, idx) => (
              <div 
                key={idx}
                className={`rounded-xl p-4 border-l-4 ${
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  alert.type === 'info' ? 'bg-blue-50 border-blue-500' :
                  'bg-green-50 border-green-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${
                    alert.type === 'warning' ? 'text-yellow-600' :
                    alert.type === 'info' ? 'text-blue-600' :
                    'text-green-600'
                  }`} />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">{alert.category}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-sm font-bold ${alert.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {alert.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(alert.amount))}
                      </span>
                      <span className="text-xs text-gray-500">{alert.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium">
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="quarter">Kuartal Ini</option>
                <option value="year">Tahun Ini</option>
              </select>
            </div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium">
              <option value="all">Semua Kategori</option>
              <option value="bahan">Bahan Baku</option>
              <option value="sdm">SDM & Gaji</option>
              <option value="logistik">Logistik</option>
              <option value="operasional">Operasional</option>
            </select>
            <button className="ml-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter Lanjutan
            </button>
          </div>
        </div>

        {/* Budget Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Trend Penggunaan Anggaran (dalam Miliar)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyBudget}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="allocated" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Alokasi" />
                <Area type="monotone" dataKey="actual" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Actual" />
                <Line type="monotone" dataKey="projected" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Proyeksi" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Alokasi Anggaran</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={budgetCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="percentage"
                >
                  {budgetCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {budgetCategories.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-sm text-gray-700">{cat.category}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Categories Detail */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Detail Anggaran per Kategori</h3>
          <div className="space-y-4">
            {budgetCategories.map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{cat.category}</p>
                    <p className="text-xs text-gray-500">Alokasi: {formatCurrency(cat.allocated)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(cat.used)}</p>
                    <p className="text-xs text-gray-500">Sisa: {formatCurrency(cat.remaining)}</p>
                  </div>
                </div>
                <div className="relative h-10 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{
                      width: `${(cat.used / cat.allocated) * 100}%`,
                      backgroundColor: cat.color
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
                    {((cat.used / cat.allocated) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown & City Budget */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rincian Pengeluaran</h3>
            <div className="space-y-3">
              {expenseBreakdown.map((exp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{exp.item}</p>
                    <p className="text-xs text-gray-500 mt-1">{exp.percentage}% dari total</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(exp.amount)}</p>
                    <div className={`flex items-center gap-1 justify-end mt-1 ${exp.trend > 0 ? 'text-red-600' : exp.trend < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {exp.trend > 0 ? <TrendingUp className="w-3 h-3" /> : exp.trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      <span className="text-xs font-semibold">{exp.trend > 0 ? '+' : ''}{exp.trend}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Anggaran per Kota</h3>
            <div className="space-y-3">
              {cityBudget.map((city, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-sm text-gray-900">{city.city}</p>
                    <span className="text-xs font-semibold text-green-600">{city.efficiency}% efisiensi</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${city.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{formatCurrency(city.used)} / {formatCurrency(city.allocated)}</span>
                    <span>{formatCurrency(city.perStudent)}/siswa</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PemprovLayout>
  );
};

export default AnggaranPemprov;