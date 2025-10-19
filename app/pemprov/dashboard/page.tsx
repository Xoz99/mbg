// app/pemprov/dashboard/page.tsx
'use client';
import { useState, useMemo } from 'react';
import PemprovLayout from '@/components/layout/PemprovLayout';
import {
  Building2, School, ChefHat, Users, TrendingUp, MapPin,
  Package, Truck, AlertCircle, CheckCircle, BarChart3,
  Clock, Target, Award, Flame, DollarSign, FileText,
  Download, Eye, Plus, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Area
} from 'recharts';

const DashboardPemprov = () => {
  const [timeRange, setTimeRange] = useState('today');

  // Filter data berdasarkan province dari localStorage
  const [userProvince, setUserProvince] = useState('');

  useState(() => {
    if (typeof window !== 'undefined') {
      const province = localStorage.getItem('userProvince') || 'Jawa Barat';
      setUserProvince(province);
    }
  });

  const provincialStats = useMemo(() => ({
    totalKitchens: 8,
    activeKitchens: 7,
    totalSchools: 156,
    activeSchools: 152,
    totalStudents: 68500,
    studentsServedToday: 67840,
    totalMealsToday: 67840,
    totalMealsWeek: 407000,
    totalDrivers: 45,
    activeDrivers: 42,
    totalStaff: 280,
    avgWastage: 1.5,
    avgOnTimeDelivery: 96.2,
    totalBudget: 12500000000,
    budgetUsed: 7680000000,
    pendingApprovals: 5
  }), []);

  const kitchenData = useMemo(() => [
    { id: 'KTN-001', name: 'Dapur Karawang', mealsToday: 5000, capacity: 6000, efficiency: 98.5, onTime: 97, wastage: 1.2, status: 'EXCELLENT' },
    { id: 'KTN-002', name: 'Dapur Bekasi', mealsToday: 8200, capacity: 10000, efficiency: 97.8, onTime: 96, wastage: 1.5, status: 'EXCELLENT' },
    { id: 'KTN-003', name: 'Dapur Bogor', mealsToday: 6500, capacity: 7000, efficiency: 96.2, onTime: 95, wastage: 1.8, status: 'GOOD' },
    { id: 'KTN-004', name: 'Dapur Depok', mealsToday: 7800, capacity: 8500, efficiency: 98.1, onTime: 98, wastage: 1.1, status: 'EXCELLENT' },
    { id: 'KTN-005', name: 'Dapur Bandung Utara', mealsToday: 10500, capacity: 12000, efficiency: 99.2, onTime: 99, wastage: 0.8, status: 'EXCELLENT' },
  ], []);

  const weeklyTrend = useMemo(() => [
    { day: 'Sen', meals: 64000, target: 65000, wastage: 950 },
    { day: 'Sel', meals: 65200, target: 65000, wastage: 975 },
    { day: 'Rab', meals: 63500, target: 65000, wastage: 925 },
    { day: 'Kam', meals: 66200, target: 65000, wastage: 1000 },
    { day: 'Jum', meals: 65100, target: 65000, wastage: 960 },
    { day: 'Sab', meals: 61500, target: 62000, wastage: 920 },
    { day: 'Min', meals: 61340, target: 62000, wastage: 925 }
  ], []);

  const budgetData = useMemo(() => [
    { category: 'Bahan Baku', allocated: 65, used: 62, color: '#3b82f6' },
    { category: 'SDM', allocated: 18, used: 17.5, color: '#10b981' },
    { category: 'Logistik', allocated: 12, used: 11.8, color: '#f59e0b' },
    { category: 'Operasional', allocated: 5, used: 4.9, color: '#8b5cf6' }
  ], []);

  const deliveryStatus = useMemo(() => [
    { name: 'On Time', value: 158, color: '#10b981' },
    { name: 'Delay', value: 8, color: '#f59e0b' },
    { name: 'Pending', value: 2, color: '#6b7280' }
  ], []);

  const getStatusColor = (status: string) => {
    const colors: any = {
      EXCELLENT: 'bg-green-100 text-green-700 border-green-200',
      GOOD: 'bg-blue-100 text-blue-700 border-blue-200',
      NEEDS_ATTENTION: 'bg-orange-100 text-orange-700 border-orange-200',
      CRITICAL: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || colors.GOOD;
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, onClick }: any) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trend > 0 ? 'bg-green-100 text-green-700' : trend < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
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
    <PemprovLayout currentPage="dashboard">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Provinsi</h2>
          <p className="text-gray-600">Monitoring real-time program MBG di {userProvince}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="TOTAL DAPUR"
            value={provincialStats.activeKitchens}
            subtitle={`dari ${provincialStats.totalKitchens} dapur`}
            icon={ChefHat}
            color="bg-blue-600"
            trend={1.2}
          />
          <StatCard
            title="TOTAL SEKOLAH"
            value={provincialStats.activeSchools.toLocaleString()}
            subtitle={`${provincialStats.totalSchools.toLocaleString()} terdaftar`}
            icon={School}
            color="bg-green-600"
            trend={0.8}
          />
          <StatCard
            title="SISWA TERLAYANI"
            value={(provincialStats.studentsServedToday/1000).toFixed(0)+'K'}
            subtitle={`${((provincialStats.studentsServedToday/provincialStats.totalStudents)*100).toFixed(1)}% dari ${(provincialStats.totalStudents/1000).toFixed(0)}K`}
            icon={Users}
            color="bg-purple-600"
            trend={2.1}
          />
          <StatCard
            title="MEALS HARI INI"
            value={(provincialStats.totalMealsToday/1000).toFixed(0)+'K'}
            subtitle={`${(provincialStats.totalMealsWeek/1000).toFixed(0)}K minggu ini`}
            icon={Package}
            color="bg-orange-600"
            trend={1.5}
          />
          <StatCard
            title="BUDGET USED"
            value={`${((provincialStats.budgetUsed/provincialStats.totalBudget)*100).toFixed(1)}%`}
            subtitle={`Rp ${(provincialStats.budgetUsed/1000000000).toFixed(1)}M dari ${(provincialStats.totalBudget/1000000000).toFixed(0)}M`}
            icon={DollarSign}
            color="bg-indigo-600"
          />
        </div>

        {/* Alerts */}
        {provincialStats.pendingApprovals > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-yellow-900">Perlu Perhatian</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Ada {provincialStats.pendingApprovals} approval menunggu review Anda
                </p>
              </div>
              <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold text-sm">
                Review Sekarang
              </button>
            </div>
          </div>
        )}

        {/* Main Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Weekly Trend */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Trend Meals Provinsi</h3>
                <p className="text-xs text-gray-500 mt-1">7 hari terakhir</p>
              </div>
              <div className="flex gap-2">
                {['today', 'week', 'month'].map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      timeRange === range ? 'bg-[#D0B064] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {range === 'today' ? 'Hari Ini' : range === 'week' ? 'Minggu' : 'Bulan'}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="target" fill="#e0e7ff" stroke="#6366f1" name="Target" />
                <Line type="monotone" dataKey="meals" stroke="#10b981" strokeWidth={3} name="Actual Meals" />
                <Bar dataKey="wastage" fill="#ef4444" name="Wastage" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Delivery Status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status Pengiriman Hari Ini</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={deliveryStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deliveryStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {deliveryStatus.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Total Pengiriman</span>
                <span className="text-2xl font-bold text-gray-900">
                  {deliveryStatus.reduce((sum, item) => sum + item.value, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Budget Allocation */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Allocation</h3>
            <div className="space-y-4">
              {budgetData.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-900">{item.category}</span>
                    <span className="text-gray-600">{item.used}% / {item.allocated}%</span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{
                        width: `${(item.used / item.allocated) * 100}%`,
                        backgroundColor: item.color
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                      {item.used}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Total Used</span>
                <span className="text-2xl font-bold text-gray-900">
                  {((provincialStats.budgetUsed/provincialStats.totalBudget)*100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Top Kitchens */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Dapur - Performa Terbaik</h3>
            <div className="space-y-3">
              {kitchenData.slice(0, 3).map((kitchen, idx) => (
                <div key={kitchen.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#D0B064] transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#D0B064] text-white rounded-full font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{kitchen.name}</p>
                      <p className="text-xs text-gray-500">{kitchen.mealsToday.toLocaleString()} meals</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Efficiency: <strong className="text-green-700">{kitchen.efficiency}%</strong></span>
                    <span className="text-gray-600">On-Time: <strong className="text-blue-700">{kitchen.onTime}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all text-left">
            <MapPin className="w-8 h-8 mb-2" />
            <p className="font-bold">Peta Dapur</p>
            <p className="text-xs text-blue-100 mt-1">Lihat lokasi dapur</p>
          </button>
          <button className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all text-left">
            <School className="w-8 h-8 mb-2" />
            <p className="font-bold">Peta Sekolah</p>
            <p className="text-xs text-green-100 mt-1">Lihat lokasi sekolah</p>
          </button>
          <button className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all text-left">
            <Truck className="w-8 h-8 mb-2" />
            <p className="font-bold">Monitoring</p>
            <p className="text-xs text-orange-100 mt-1">Track pengiriman</p>
          </button>
          <button className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all text-left">
            <FileText className="w-8 h-8 mb-2" />
            <p className="font-bold">Laporan</p>
            <p className="text-xs text-purple-100 mt-1">Lihat laporan</p>
          </button>
        </div>
      </div>
    </PemprovLayout>
  );
};

export default DashboardPemprov;