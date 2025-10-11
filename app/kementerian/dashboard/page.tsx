// app/kementerian/dashboard/page.tsx
'use client';
import { useState, useMemo } from 'react';
import MinistryLayout from '@/components/layout/MinistryLayout';
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

const DashboardKementerian = () => {
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [timeRange, setTimeRange] = useState('today');

  // National statistics
  const nationalStats = useMemo(() => ({
    totalKitchens: 34,
    activeKitchens: 32,
    totalSchools: 1247,
    activeSchools: 1238,
    totalStudents: 487650,
    studentsServedToday: 485230,
    totalMealsToday: 485230,
    totalMealsWeek: 2912450,
    totalDrivers: 256,
    activeDrivers: 248,
    totalStaff: 1834,
    avgWastage: 1.4,
    avgOnTimeDelivery: 96.8,
    totalBudget: 145000000000,
    budgetUsed: 89500000000,
    pendingApprovals: 15
  }), []);

  // Kitchen performance data
  const kitchenData = useMemo(() => [
    { id: 'KTN-001', name: 'Dapur Karawang', province: 'Jawa Barat', mealsToday: 5000, capacity: 6000, efficiency: 98.5, onTime: 97, wastage: 1.2, status: 'EXCELLENT' },
    { id: 'KTN-002', name: 'Dapur Bekasi', province: 'Jawa Barat', mealsToday: 8200, capacity: 10000, efficiency: 97.8, onTime: 96, wastage: 1.5, status: 'EXCELLENT' },
    { id: 'KTN-003', name: 'Dapur Bogor', province: 'Jawa Barat', mealsToday: 6500, capacity: 7000, efficiency: 96.2, onTime: 95, wastage: 1.8, status: 'GOOD' },
    { id: 'KTN-004', name: 'Dapur Depok', province: 'Jawa Barat', mealsToday: 7800, capacity: 8500, efficiency: 98.1, onTime: 98, wastage: 1.1, status: 'EXCELLENT' },
    { id: 'KTN-005', name: 'Dapur Tangerang', province: 'Banten', mealsToday: 9200, capacity: 10000, efficiency: 95.5, onTime: 94, wastage: 2.1, status: 'GOOD' },
    { id: 'KTN-006', name: 'Dapur Serang', province: 'Banten', mealsToday: 4500, capacity: 5000, efficiency: 92.8, onTime: 91, wastage: 2.8, status: 'NEEDS_ATTENTION' },
    { id: 'KTN-007', name: 'Dapur Bandung Utara', province: 'Jawa Barat', mealsToday: 10500, capacity: 12000, efficiency: 99.2, onTime: 99, wastage: 0.8, status: 'EXCELLENT' },
    { id: 'KTN-008', name: 'Dapur Cimahi', province: 'Jawa Barat', mealsToday: 5800, capacity: 6500, efficiency: 96.8, onTime: 96, wastage: 1.6, status: 'GOOD' }
  ], []);

  // Province aggregation
  const provinceData = useMemo(() => {
    const grouped: any = {};
    kitchenData.forEach(k => {
      if (!grouped[k.province]) {
        grouped[k.province] = {
          province: k.province,
          kitchens: 0,
          mealsToday: 0,
          avgEfficiency: 0,
          avgOnTime: 0
        };
      }
      grouped[k.province].kitchens++;
      grouped[k.province].mealsToday += k.mealsToday;
      grouped[k.province].avgEfficiency += k.efficiency;
      grouped[k.province].avgOnTime += k.onTime;
    });
    return Object.values(grouped).map((p: any) => ({
      ...p,
      avgEfficiency: (p.avgEfficiency / p.kitchens).toFixed(1),
      avgOnTime: (p.avgOnTime / p.kitchens).toFixed(1)
    }));
  }, [kitchenData]);

  // Trend data
  const weeklyTrend = useMemo(() => [
    { day: 'Sen', meals: 478000, target: 480000, wastage: 6700 },
    { day: 'Sel', meals: 482000, target: 480000, wastage: 6900 },
    { day: 'Rab', meals: 475000, target: 480000, wastage: 6400 },
    { day: 'Kam', meals: 489000, target: 480000, wastage: 7100 },
    { day: 'Jum', meals: 481000, target: 480000, wastage: 6800 },
    { day: 'Sab', meals: 458000, target: 460000, wastage: 6200 },
    { day: 'Min', meals: 459450, target: 460000, wastage: 6350 }
  ], []);

  // Budget allocation
  const budgetData = useMemo(() => [
    { category: 'Bahan Baku', allocated: 65, used: 62, color: '#3b82f6' },
    { category: 'SDM', allocated: 18, used: 17.5, color: '#10b981' },
    { category: 'Logistik', allocated: 12, used: 11.8, color: '#f59e0b' },
    { category: 'Operasional', allocated: 5, used: 4.9, color: '#8b5cf6' }
  ], []);

  // Delivery status today
  const deliveryStatus = useMemo(() => [
    { name: 'On Time', value: 965, color: '#10b981' },
    { name: 'Delay', value: 45, color: '#f59e0b' },
    { name: 'Pending', value: 28, color: '#6b7280' }
  ], []);

  const filteredKitchens = useMemo(() => {
    if (selectedProvince === 'all') return kitchenData;
    return kitchenData.filter(k => k.province === selectedProvince);
  }, [kitchenData, selectedProvince]);

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
    <MinistryLayout currentPage="dashboard">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Nasional</h2>
          <p className="text-gray-600">Monitoring real-time seluruh dapur dan sekolah di Indonesia</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="TOTAL DAPUR"
            value={nationalStats.activeKitchens}
            subtitle={`dari ${nationalStats.totalKitchens} dapur`}
            icon={ChefHat}
            color="bg-blue-600"
            trend={2.1}
          />
          <StatCard
            title="TOTAL SEKOLAH"
            value={nationalStats.activeSchools.toLocaleString()}
            subtitle={`${nationalStats.totalSchools.toLocaleString()} terdaftar`}
            icon={School}
            color="bg-green-600"
            trend={1.5}
          />
          <StatCard
            title="SISWA TERLAYANI"
            value={(nationalStats.studentsServedToday/1000).toFixed(0)+'K'}
            subtitle={`${((nationalStats.studentsServedToday/nationalStats.totalStudents)*100).toFixed(1)}% dari ${(nationalStats.totalStudents/1000).toFixed(0)}K`}
            icon={Users}
            color="bg-purple-600"
            trend={3.2}
          />
          <StatCard
            title="MEALS HARI INI"
            value={(nationalStats.totalMealsToday/1000).toFixed(0)+'K'}
            subtitle={`${(nationalStats.totalMealsWeek/1000000).toFixed(2)}M minggu ini`}
            icon={Package}
            color="bg-orange-600"
            trend={1.8}
          />
          <StatCard
            title="BUDGET USED"
            value={`${((nationalStats.budgetUsed/nationalStats.totalBudget)*100).toFixed(1)}%`}
            subtitle={`Rp ${(nationalStats.budgetUsed/1000000000).toFixed(1)}M dari ${(nationalStats.totalBudget/1000000000).toFixed(0)}M`}
            icon={DollarSign}
            color="bg-indigo-600"
          />
        </div>

        {/* Alerts & Pending */}
        {nationalStats.pendingApprovals > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-yellow-900">Perlu Perhatian</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Ada {nationalStats.pendingApprovals} approval menunggu review Anda (Menu, Budget, Staff)
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
                <h3 className="text-lg font-bold text-gray-900">Trend Meals Nasional</h3>
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
          {/* Province Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Performance by Province</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="province" stroke="#94a3b8" style={{ fontSize: '11px' }} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="mealsToday" fill="#3b82f6" name="Meals Today" />
              </BarChart>
            </ResponsiveContainer>
          </div>

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
                  {((nationalStats.budgetUsed/nationalStats.totalBudget)*100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Kitchens */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Performing Kitchens</h3>
              <p className="text-xs text-gray-500 mt-1">5 dapur dengan performa terbaik hari ini</p>
            </div>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Semua Provinsi</option>
              <option value="Jawa Barat">Jawa Barat</option>
              <option value="Banten">Banten</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {kitchenData
              .sort((a, b) => b.efficiency - a.efficiency)
              .slice(0, 5)
              .map((kitchen, idx) => (
                <div key={kitchen.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#D0B064] transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-[#D0B064] text-white rounded-full font-bold text-lg">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{kitchen.name}</p>
                      <p className="text-xs text-gray-500">{kitchen.province}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Efficiency</span>
                      <span className="font-bold text-green-700">{kitchen.efficiency}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">On-Time</span>
                      <span className="font-bold text-blue-700">{kitchen.onTime}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Meals Today</span>
                      <span className="font-bold text-gray-900">{kitchen.mealsToday.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all text-left">
            <MapPin className="w-8 h-8 mb-2" />
            <p className="font-bold">Peta Dapur</p>
            <p className="text-xs text-blue-100 mt-1">Lihat lokasi semua dapur</p>
          </button>
          <button className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all text-left">
            <School className="w-8 h-8 mb-2" />
            <p className="font-bold">Peta Sekolah</p>
            <p className="text-xs text-green-100 mt-1">Lihat lokasi semua sekolah</p>
          </button>
          <button className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all text-left">
            <Truck className="w-8 h-8 mb-2" />
            <p className="font-bold">Monitoring</p>
            <p className="text-xs text-orange-100 mt-1">Track pengiriman real-time</p>
          </button>
          <button className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all text-left">
            <FileText className="w-8 h-8 mb-2" />
            <p className="font-bold">Laporan</p>
            <p className="text-xs text-purple-100 mt-1">Lihat laporan lengkap</p>
          </button>
        </div>
      </div>
    </MinistryLayout>
  );
};

export default DashboardKementerian;