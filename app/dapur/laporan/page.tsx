// app/dapur/laporan/page.tsx
'use client';

import { useState, useMemo } from 'react';
import DapurLayout from '@/components/layout/DapurLayout';
import { 
  BarChart3, TrendingUp, Download, Calendar, FileText,
  ChefHat, Package, Truck, CheckCircle, AlertCircle,
  Users, Clock, Boxes, Target, Award, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const LaporanProduksi = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('minggu-ini');
  const [selectedReport, setSelectedReport] = useState('overview');

  // Production data for charts
  const productionData = useMemo(() => [
    { date: '06 Jan', target: 5000, actual: 4950, delivered: 4900 },
    { date: '07 Jan', target: 5000, actual: 5100, delivered: 5050 },
    { date: '08 Jan', target: 5000, actual: 4800, delivered: 4750 },
    { date: '09 Jan', target: 5000, actual: 5200, delivered: 5150 },
    { date: '10 Jan', target: 5000, actual: 4900, delivered: 4850 },
    { date: '11 Jan', target: 4500, actual: 4400, delivered: 4350 },
    { date: '12 Jan', target: 4500, actual: 4600, delivered: 4550 }
  ], []);

  const menuDistribution = useMemo(() => [
    { name: 'Nasi Putih', value: 8500, color: '#3b82f6' },
    { name: 'Nasi Goreng', value: 6200, color: '#f59e0b' },
    { name: 'Nasi Kuning', value: 5300, color: '#10b981' },
    { name: 'Nasi Uduk', value: 4800, color: '#8b5cf6' },
    { name: 'Lainnya', value: 3200, color: '#6b7280' }
  ], []);

  const deliveryPerformance = useMemo(() => [
    { school: 'SMAN 5', onTime: 95, late: 5 },
    { school: 'SMAN 2', onTime: 98, late: 2 },
    { school: 'SMP 1', onTime: 92, late: 8 },
    { school: 'SMK 1', onTime: 97, late: 3 },
    { school: 'SMA 3', onTime: 94, late: 6 }
  ], []);

  const wastageData = useMemo(() => [
    { date: '06 Jan', finished: 4500, takenHome: 300, wasted: 100 },
    { date: '07 Jan', finished: 4700, takenHome: 280, wasted: 70 },
    { date: '08 Jan', finished: 4400, takenHome: 290, wasted: 60 },
    { date: '09 Jan', finished: 4800, takenHome: 270, wasted: 80 },
    { date: '10 Jan', finished: 4500, takenHome: 300, wasted: 50 },
    { date: '11 Jan', finished: 4000, takenHome: 320, wasted: 30 },
    { date: '12 Jan', finished: 4200, takenHome: 310, wasted: 40 }
  ], []);

  const stats = useMemo(() => ({
    totalProduced: 33950,
    totalDelivered: 33600,
    avgEfficiency: 98.5,
    totalBatches: 42,
    completedBatches: 40,
    totalTrips: 126,
    completedTrips: 124,
    onTimePercentage: 96.8,
    totalWastage: 430,
    wastagePercentage: 1.3,
    avgProductionTime: 145, // minutes
    avgDeliveryTime: 35 // minutes
  }), []);

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
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
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
    <DapurLayout currentPage="laporan">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Laporan Produksi</h1>
            <p className="text-gray-600">Analytics dan reporting produksi & delivery</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-sm">
              <FileText className="w-5 h-5" />
              Generate PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold shadow-sm">
              <Download className="w-5 h-5" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Period & Report Type Selection */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          {/* Period Filter */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Periode:</span>
            <div className="flex gap-2">
              {[
                { id: 'hari-ini', label: 'Hari Ini' },
                { id: 'minggu-ini', label: 'Minggu Ini' },
                { id: 'bulan-ini', label: 'Bulan Ini' },
                { id: 'custom', label: 'Custom' }
              ].map((period) => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === period.id
                      ? 'bg-[#D0B064] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report Type */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Jenis Laporan:</span>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            >
              <option value="overview">Overview</option>
              <option value="production">Produksi Detail</option>
              <option value="delivery">Delivery Performance</option>
              <option value="wastage">Wastage Analysis</option>
              <option value="staff">Staff Performance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="TOTAL DIPRODUKSI" 
          value={stats.totalProduced.toLocaleString()} 
          subtitle="trays minggu ini" 
          icon={ChefHat} 
          color="bg-blue-600"
          trend={5.2}
        />
        <StatCard 
          title="TOTAL DIKIRIM" 
          value={stats.totalDelivered.toLocaleString()} 
          subtitle={`${((stats.totalDelivered/stats.totalProduced)*100).toFixed(1)}% delivered`}
          icon={Truck} 
          color="bg-green-600"
          trend={3.8}
        />
        <StatCard 
          title="EFISIENSI" 
          value={`${stats.avgEfficiency}%`}
          subtitle="rata-rata" 
          icon={Target} 
          color="bg-purple-600"
          trend={2.1}
        />
        <StatCard 
          title="WASTAGE" 
          value={`${stats.wastagePercentage}%`}
          subtitle={`${stats.totalWastage} trays terbuang`}
          icon={AlertCircle} 
          color="bg-orange-600"
          trend={-0.5}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Production Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Trend Produksi & Delivery</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Target</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-600">Delivered</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Line type="monotone" dataKey="target" stroke="#3b82f6" strokeWidth={2} name="Target" />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} name="Actual" />
              <Line type="monotone" dataKey="delivered" stroke="#8b5cf6" strokeWidth={2} name="Delivered" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Menu Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Distribusi Menu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={menuDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {menuDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Delivery Performance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Performance by School</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deliveryPerformance} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis dataKey="school" type="category" stroke="#94a3b8" style={{ fontSize: '11px' }} width={80} />
              <Tooltip />
              <Legend />
              <Bar dataKey="onTime" stackId="a" fill="#10b981" name="On Time %" radius={[0, 4, 4, 0]} />
              <Bar dataKey="late" stackId="a" fill="#ef4444" name="Late %" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Wastage Analysis */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Meal Action Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={wastageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="finished" stackId="a" fill="#10b981" name="Habis" />
              <Bar dataKey="takenHome" stackId="a" fill="#f59e0b" name="Dibawa Pulang" />
              <Bar dataKey="wasted" stackId="a" fill="#ef4444" name="Terbuang" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Boxes className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-blue-900">Total Batches</p>
          </div>
          <p className="text-3xl font-bold text-blue-900 mb-1">{stats.totalBatches}</p>
          <p className="text-xs text-blue-600">{stats.completedBatches} completed ({((stats.completedBatches/stats.totalBatches)*100).toFixed(0)}%)</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-green-900">Total Trips</p>
          </div>
          <p className="text-3xl font-bold text-green-900 mb-1">{stats.totalTrips}</p>
          <p className="text-xs text-green-600">{stats.completedTrips} completed ({((stats.completedTrips/stats.totalTrips)*100).toFixed(0)}%)</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-purple-900">Avg Production Time</p>
          </div>
          <p className="text-3xl font-bold text-purple-900 mb-1">{stats.avgProductionTime}</p>
          <p className="text-xs text-purple-600">minutes per batch</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-5 border border-orange-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm font-semibold text-orange-900">On-Time Delivery</p>
          </div>
          <p className="text-3xl font-bold text-orange-900 mb-1">{stats.onTimePercentage}%</p>
          <p className="text-xs text-orange-600">average across all schools</p>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Summary Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Metric</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Target</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Achievement</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Production Volume</td>
                <td className="px-6 py-4 text-sm text-gray-700">{stats.totalProduced.toLocaleString()} trays</td>
                <td className="px-6 py-4 text-sm text-gray-700">35,000 trays</td>
                <td className="px-6 py-4 text-sm font-bold text-green-700">{((stats.totalProduced/35000)*100).toFixed(1)}%</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ On Track</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Delivery Success Rate</td>
                <td className="px-6 py-4 text-sm text-gray-700">{((stats.totalDelivered/stats.totalProduced)*100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-sm text-gray-700">98%</td>
                <td className="px-6 py-4 text-sm font-bold text-green-700">{(((stats.totalDelivered/stats.totalProduced)*100)/98*100).toFixed(1)}%</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ Excellent</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Wastage Rate</td>
                <td className="px-6 py-4 text-sm text-gray-700">{stats.wastagePercentage}%</td>
                <td className="px-6 py-4 text-sm text-gray-700">&lt;2%</td>
                <td className="px-6 py-4 text-sm font-bold text-green-700">Excellent</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ Target Met</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">On-Time Delivery</td>
                <td className="px-6 py-4 text-sm text-gray-700">{stats.onTimePercentage}%</td>
                <td className="px-6 py-4 text-sm text-gray-700">95%</td>
                <td className="px-6 py-4 text-sm font-bold text-green-700">{(stats.onTimePercentage/95*100).toFixed(1)}%</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ Above Target</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Batch Completion</td>
                <td className="px-6 py-4 text-sm text-gray-700">{stats.completedBatches}/{stats.totalBatches}</td>
                <td className="px-6 py-4 text-sm text-gray-700">95%</td>
                <td className="px-6 py-4 text-sm font-bold text-green-700">{((stats.completedBatches/stats.totalBatches)*100).toFixed(1)}%</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ Excellent</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DapurLayout>
  );
};

export default LaporanProduksi;