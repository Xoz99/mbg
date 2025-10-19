// app/pemprov/laporan/page.tsx
'use client';
import { useState, useMemo } from 'react';
import PemprovLayout from '@/components/layout/PemprovLayout';
import {
  FileText, TrendingUp, TrendingDown, Users, Package,
  Calendar, Download, Filter, Search, Eye, ChefHat,
  School, Clock, AlertCircle, CheckCircle, Award
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Area
} from 'recharts';

const LaporanKonsumsiPemprov = () => {
  const [dateRange, setDateRange] = useState('week');
  const [selectedCity, setSelectedCity] = useState('all');

  const stats = useMemo(() => ({
    totalMeals: 456200,
    totalMealsChange: 2.8,
    avgAttendance: 98.9,
    avgAttendanceChange: 1.2,
    totalWastage: 6847,
    totalWastageChange: -1.5,
    participationRate: 99.2,
    participationRateChange: 0.6
  }), []);

  const dailyConsumption = useMemo(() => [
    { date: '01 Jan', meals: 64000, attendance: 98.5, wastage: 960, target: 65000 },
    { date: '02 Jan', meals: 65200, attendance: 98.9, wastage: 985, target: 65000 },
    { date: '03 Jan', meals: 63500, attendance: 97.8, wastage: 925, target: 65000 },
    { date: '04 Jan', meals: 66200, attendance: 99.2, wastage: 1000, target: 65000 },
    { date: '05 Jan', meals: 65100, attendance: 98.6, wastage: 960, target: 65000 },
    { date: '06 Jan', meals: 61500, attendance: 97.5, wastage: 920, target: 62000 },
    { date: '07 Jan', meals: 64700, attendance: 99.1, wastage: 957, target: 65000 }
  ], []);

  const cityConsumption = useMemo(() => [
    { city: 'Karawang', meals: 120000, students: 18500, participation: 99.4, wastage: 1.2 },
    { city: 'Bekasi', meals: 168000, students: 26000, participation: 99.3, wastage: 1.4 },
    { city: 'Bogor', meals: 98000, students: 15200, participation: 98.8, wastage: 1.8 },
    { city: 'Bandung', meals: 70200, students: 11000, participation: 99.1, wastage: 1.5 }
  ], []);

  const mealActions = useMemo(() => [
    { name: 'Habis Dimakan', value: 437500, percentage: 95.9, color: '#10b981' },
    { name: 'Dibawa Pulang', value: 11424, percentage: 2.5, color: '#3b82f6' },
    { name: 'Terbuang', value: 6847, percentage: 1.5, color: '#ef4444' }
  ], []);

  const timeConsumption = useMemo(() => [
    { time: '07:00-08:00', meals: 19200, percentage: 4.2 },
    { time: '08:00-09:00', meals: 142000, percentage: 31.1 },
    { time: '09:00-10:00', meals: 228000, percentage: 50.0 },
    { time: '10:00-11:00', meals: 58900, percentage: 12.9 },
    { time: '11:00-12:00', meals: 8100, percentage: 1.8 }
  ], []);

  const cityList = ['Karawang', 'Bekasi', 'Bogor', 'Bandung'];

  const filteredConsumption = useMemo(() => {
    if (selectedCity === 'all') return cityConsumption;
    return cityConsumption.filter(c => c.city === selectedCity);
  }, [selectedCity]);

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
    <PemprovLayout currentPage="laporan">
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
            value={(stats.totalMeals / 1000).toFixed(0) + 'K'}
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
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium">
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="quarter">Kuartal Ini</option>
                <option value="year">Tahun Ini</option>
              </select>
            </div>

            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium">
              <option value="all">Semua Kota</option>
              {cityList.map(c => <option key={c} value={c}>{c}</option>)}
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
          {/* City Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Konsumsi per Kota</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityConsumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="city" stroke="#94a3b8" style={{ fontSize: '11px' }} />
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

        {/* City Details Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Detail Konsumsi per Kota</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Kota</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total Meals</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total Siswa</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Participation</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Wastage</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cityConsumption.map((city, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{city.city}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{city.meals.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{city.students.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {city.participation}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${
                        city.wastage < 1.5 ? 'text-green-700' : city.wastage < 2 ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {city.wastage}%
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
    </PemprovLayout>
  );
};

export default LaporanKonsumsiPemprov;