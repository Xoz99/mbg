// app/kementerian/laporan/page.tsx
'use client';
import { useState, useMemo } from 'react';
import MinistryLayout from '@/components/layout/MinistryLayout';
import {
  FileText, TrendingUp, TrendingDown, Users, Package,
  Calendar, Download, Filter, Search, Eye, ChefHat,
  School, Clock, AlertCircle, CheckCircle, PieChart as PieChartIcon
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const LaporanKonsumsiPage = () => {
  const [dateRange, setDateRange] = useState('week');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('meals');

  // Consumption stats
  const stats = useMemo(() => ({
    totalMeals: 2912450,
    totalMealsChange: 3.2,
    avgAttendance: 98.7,
    avgAttendanceChange: 1.5,
    totalWastage: 41542,
    totalWastageChange: -2.1,
    participationRate: 99.4,
    participationRateChange: 0.8
  }), []);

  // Daily consumption trend
  const dailyConsumption = useMemo(() => [
    { date: '01 Jan', meals: 478000, attendance: 98.5, wastage: 6700, target: 480000 },
    { date: '02 Jan', meals: 482000, attendance: 98.9, wastage: 6900, target: 480000 },
    { date: '03 Jan', meals: 475000, attendance: 97.8, wastage: 6400, target: 480000 },
    { date: '04 Jan', meals: 489000, attendance: 99.2, wastage: 7100, target: 480000 },
    { date: '05 Jan', meals: 481000, attendance: 98.6, wastage: 6800, target: 480000 },
    { date: '06 Jan', meals: 458000, attendance: 97.5, wastage: 6200, target: 460000 },
    { date: '07 Jan', meals: 449450, attendance: 97.2, wastage: 6350, target: 460000 }
  ], []);

  // Consumption by province
  const provinceConsumption = useMemo(() => [
    { province: 'Jawa Barat', meals: 1250000, students: 195000, participation: 99.5, wastage: 1.2 },
    { province: 'Jawa Tengah', meals: 890000, students: 142000, participation: 99.2, wastage: 1.4 },
    { province: 'Jawa Timur', meals: 420000, students: 68000, participation: 98.8, wastage: 1.8 },
    { province: 'Banten', meals: 352450, students: 56650, participation: 99.1, wastage: 1.5 }
  ], []);

  // Meal actions breakdown
  const mealActions = useMemo(() => [
    { name: 'Habis Dimakan', value: 2798450, percentage: 96.1, color: '#10b981' },
    { name: 'Dibawa Pulang', value: 72458, percentage: 2.5, color: '#3b82f6' },
    { name: 'Terbuang', value: 41542, percentage: 1.4, color: '#ef4444' }
  ], []);

  // Time-based consumption
  const timeConsumption = useMemo(() => [
    { time: '07:00-08:00', meals: 125000, percentage: 4.3 },
    { time: '08:00-09:00', meals: 890000, percentage: 30.6 },
    { time: '09:00-10:00', meals: 1450000, percentage: 49.8 },
    { time: '10:00-11:00', meals: 385000, percentage: 13.2 },
    { time: '11:00-12:00', meals: 62450, percentage: 2.1 }
  ], []);

  // Menu popularity
  const menuPopularity = useMemo(() => [
    { menu: 'Nasi + Ayam Goreng + Sayur', rating: 4.8, served: 520000, finished: 98.5 },
    { menu: 'Nasi + Ikan Goreng + Sayur', rating: 4.6, served: 480000, finished: 97.2 },
    { menu: 'Nasi + Telur Balado + Sayur', rating: 4.5, served: 445000, finished: 96.8 },
    { menu: 'Nasi + Tempe Goreng + Sayur', rating: 4.3, served: 425000, finished: 95.5 },
    { menu: 'Nasi + Rendang + Sayur', rating: 4.9, served: 380000, finished: 99.2 }
  ], []);

  // Attendance by grade
  const gradeAttendance = useMemo(() => [
    { grade: 'Kelas 1', students: 82000, present: 80850, percentage: 98.6 },
    { grade: 'Kelas 2', students: 81500, present: 80590, percentage: 98.9 },
    { grade: 'Kelas 3', students: 80200, present: 79318, percentage: 98.9 },
    { grade: 'Kelas 4', students: 79800, present: 78804, percentage: 98.8 },
    { grade: 'Kelas 5', students: 82500, present: 81113, percentage: 98.3 },
    { grade: 'Kelas 6', students: 81650, premium: 80428, percentage: 98.5 }
  ], []);

  // Nutrition radar
  const nutritionData = useMemo(() => [
    { subject: 'Protein', A: 95, B: 100, fullMark: 100 },
    { subject: 'Karbohidrat', A: 98, B: 100, fullMark: 100 },
    { subject: 'Sayur', A: 92, B: 100, fullMark: 100 },
    { subject: 'Buah', A: 88, B: 100, fullMark: 100 },
    { subject: 'Susu', A: 85, B: 100, fullMark: 100 }
  ], []);

  const provinces = useMemo(() => ['Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Banten'], []);

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
          change > 0 ? 'bg-green-100 text-green-700' : change < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <MinistryLayout currentPage="laporan">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Konsumsi Harian</h1>
            <p className="text-sm text-gray-600 mt-1">Analisis data konsumsi makanan dan partisipasi siswa</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] font-semibold text-sm">
              <Eye className="w-4 h-4" /> Lihat Detail
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-semibold text-sm">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="TOTAL MEALS"
            value={(stats.totalMeals / 1000000).toFixed(2) + 'M'}
            change={stats.totalMealsChange}
            icon={Package}
            color="bg-blue-600"
          />
          <StatCard
            title="AVG ATTENDANCE"
            value={stats.avgAttendance + '%'}
            change={stats.avgAttendanceChange}
            icon={Users}
            color="bg-green-600"
          />
          <StatCard
            title="TOTAL WASTAGE"
            value={(stats.totalWastage / 1000).toFixed(1) + 'K'}
            change={stats.totalWastageChange}
            icon={AlertCircle}
            color="bg-red-600"
          />
          <StatCard
            title="PARTICIPATION"
            value={stats.participationRate + '%'}
            change={stats.participationRateChange}
            icon={CheckCircle}
            color="bg-purple-600"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="quarter">Kuartal Ini</option>
                <option value="year">Tahun Ini</option>
              </select>
            </div>

            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              <option value="all">Semua Provinsi</option>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              <option value="meals">Meals Served</option>
              <option value="attendance">Attendance Rate</option>
              <option value="wastage">Wastage Rate</option>
              <option value="participation">Participation</option>
            </select>

            <button className="ml-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter Lanjutan
            </button>
          </div>
        </div>

        {/* Main Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Daily Trend */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Trend Konsumsi Harian</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyConsumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="target" fill="#e0e7ff" stroke="#6366f1" name="Target" />
                <Line type="monotone" dataKey="meals" stroke="#10b981" strokeWidth={3} name="Meals Served" />
                <Bar dataKey="wastage" fill="#ef4444" name="Wastage" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Meal Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status Makanan</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={mealActions}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mealActions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {mealActions.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{(item.value / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-500">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Province Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Konsumsi per Provinsi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceConsumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="province" stroke="#94a3b8" style={{ fontSize: '11px' }} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="meals" fill="#3b82f6" name="Total Meals" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Distribusi Waktu Konsumsi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeConsumption} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis type="category" dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="meals" fill="#10b981" name="Meals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Menu Popularity & Nutrition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Menu Popularity */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Popularitas Menu</h3>
            <div className="space-y-3">
              {menuPopularity.map((menu, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{menu.menu}</p>
                      <p className="text-xs text-gray-500 mt-1">{menu.served.toLocaleString()} porsi disajikan</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-bold text-sm">{menu.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${menu.finished}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-700">{menu.finished}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Radar */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pemenuhan Gizi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={nutritionData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" style={{ fontSize: '12px' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Actual" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Radar name="Target" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status Gizi</span>
                <span className="font-bold text-green-600">Baik Sekali</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Kepatuhan</span>
                <span className="font-bold text-gray-900">91.6%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Province Details Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Detail Konsumsi per Provinsi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Provinsi</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total Meals</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total Students</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Participation</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Wastage</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {provinceConsumption.map((prov, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{prov.province}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{prov.meals.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{prov.students.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {prov.participation}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${
                        prov.wastage < 1.5 ? 'text-green-700' : prov.wastage < 2 ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {prov.wastage}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749]">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MinistryLayout>
  );
};

export default LaporanKonsumsiPage;