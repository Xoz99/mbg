// app/csr/dashboard/page.tsx
'use client';
import { useState, useMemo } from 'react';
import CSRLayout from '@/components/layout/CSRLayout';
import {
  Building2, School, Users, TrendingUp, Package,
  DollarSign, Heart, Award, Download, Upload, FileText,
  ArrowUpRight, ArrowDownRight, Calendar, CheckCircle,
  AlertCircle, Zap, Target, TrendingDown, BarChart3, Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from 'recharts';

const CSRDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState('12');
  const [activeTab, setActiveTab] = useState('overview');

  // CSR Program Data
  const csrStats = useMemo(() => ({
    programName: 'Program Beasiswa Makan Sehat',
    totalSchoolsSupported: 5,
    totalStudentsImpact: 3980,
    totalMealsThisMonth: 125680,
    totalMealsYTD: 1250000,
    avgSatisfaction: 94.0,
    impactScore: 94.5,
    budgetAllocated: 450000000,
    budgetUsed: 387500000,
    budgetPercentage: 86.1,
    programDuration: '18 bulan',
    startDate: 'Juni 2023',
    endDate: 'Desember 2024'
  }), []);

  // Monthly trend data
  const monthlyTrend = useMemo(() => [
    { month: 'Juni', meals: 95000, budget: 30000000, satisfaction: 85 },
    { month: 'Juli', meals: 105000, budget: 32000000, satisfaction: 87 },
    { month: 'Agustus', meals: 110000, budget: 32500000, satisfaction: 89 },
    { month: 'September', meals: 115000, budget: 33000000, satisfaction: 90 },
    { month: 'Oktober', meals: 120000, budget: 33500000, satisfaction: 92 },
    { month: 'November', meals: 122000, budget: 34000000, satisfaction: 93 },
    { month: 'Desember', meals: 125680, budget: 35000000, satisfaction: 94 }
  ], []);

  // School distribution
  const schoolDistribution = useMemo(() => [
    { name: 'SD Karawang 1', value: 850, color: '#10b981' },
    { name: 'SD Karawang 2', value: 720, color: '#3b82f6' },
    { name: 'SMP Bekasi', value: 1200, color: '#8b5cf6' },
    { name: 'SD Depok 1', value: 650, color: '#f59e0b' },
    { name: 'SD Bogor', value: 580, color: '#ec4899' }
  ], []);

  // Recent reports
  const recentReports = useMemo(() => [
    {
      id: 1,
      title: 'Laporan Bulanan Desember 2024',
      type: 'Monthly Report',
      date: '2024-12-31',
      status: 'Completed',
      size: '2.4 MB'
    },
    {
      id: 2,
      title: 'Laporan Kuartal IV 2024',
      type: 'Quarterly Report',
      date: '2024-12-20',
      status: 'Completed',
      size: '5.8 MB'
    },
    {
      id: 3,
      title: 'Dokumentasi Foto Program Oktober',
      type: 'Photo Documentation',
      date: '2024-10-31',
      status: 'Completed',
      size: '15.2 MB'
    },
    {
      id: 4,
      title: 'Laporan Evaluasi Impact Semester 1',
      type: 'Impact Report',
      date: '2024-06-30',
      status: 'Completed',
      size: '3.1 MB'
    }
  ], []);

  // 1. SCHOOL PERFORMANCE COMPARISON
  const schoolPerformance = useMemo(() => [
    {
      school: 'SD Karawang 1',
      students: 850,
      satisfaction: 96,
      performance: 4.8,
      attendance: 12.5,
      academic: 18.3,
      meals: 25500,
      status: 'Excellent'
    },
    {
      school: 'SMP Bekasi',
      students: 1200,
      satisfaction: 95,
      performance: 4.7,
      attendance: 14.2,
      academic: 16.8,
      meals: 38000,
      status: 'Excellent'
    },
    {
      school: 'SD Karawang 2',
      students: 720,
      satisfaction: 92,
      performance: 4.5,
      attendance: 10.1,
      academic: 14.5,
      meals: 21600,
      status: 'Very Good'
    },
    {
      school: 'SD Depok 1',
      students: 650,
      satisfaction: 88,
      performance: 4.2,
      attendance: 8.3,
      academic: 11.2,
      meals: 19500,
      status: 'Good'
    },
    {
      school: 'SD Bogor',
      students: 580,
      satisfaction: 85,
      performance: 3.9,
      attendance: 6.5,
      academic: 9.8,
      meals: 17400,
      status: 'Good'
    }
  ], []);

  // 2. STUDENT HEALTH METRICS
  const healthMetrics = useMemo(() => [
    { month: 'Juni', attendance: 82, academicScore: 68, healthStatus: 75, nutritionImprovement: 60 },
    { month: 'Juli', attendance: 84, academicScore: 71, healthStatus: 78, nutritionImprovement: 65 },
    { month: 'Agustus', attendance: 86, academicScore: 74, healthStatus: 81, nutritionImprovement: 70 },
    { month: 'September', attendance: 88, academicScore: 77, healthStatus: 84, nutritionImprovement: 75 },
    { month: 'Oktober', attendance: 90, academicScore: 80, healthStatus: 87, nutritionImprovement: 80 },
    { month: 'November', attendance: 92, academicScore: 83, healthStatus: 89, nutritionImprovement: 85 },
    { month: 'Desember', attendance: 94, academicScore: 85, healthStatus: 91, nutritionImprovement: 88 }
  ], []);

  // 3. COST ANALYSIS
  const costAnalysis = useMemo(() => [
    { school: 'SD Karawang 1', students: 850, costPerStudent: 45000, totalCost: 38250000, efficiency: 94, forecast: 42300000 },
    { school: 'SMP Bekasi', students: 1200, costPerStudent: 48000, totalCost: 57600000, efficiency: 91, forecast: 63500000 },
    { school: 'SD Karawang 2', students: 720, costPerStudent: 46500, totalCost: 33480000, efficiency: 88, forecast: 37200000 },
    { school: 'SD Depok 1', students: 650, costPerStudent: 47800, totalCost: 31070000, efficiency: 85, forecast: 34500000 },
    { school: 'SD Bogor', students: 580, costPerStudent: 49000, totalCost: 28420000, efficiency: 82, forecast: 31800000 }
  ], []);

  // 4. SCHOOL SATISFACTION DETAILS
  const satisfactionDetails = useMemo(() => [
    {
      school: 'SD Karawang 1',
      score: 96,
      foodQuality: 95,
      nutrition: 97,
      service: 96,
      communication: 96,
      complaints: 1,
      lastComplaint: 'Menu variation (resolved)'
    },
    {
      school: 'SMP Bekasi',
      score: 95,
      foodQuality: 94,
      nutrition: 96,
      service: 95,
      communication: 95,
      complaints: 2,
      lastComplaint: 'Portion size feedback'
    },
    {
      school: 'SD Karawang 2',
      score: 92,
      foodQuality: 91,
      nutrition: 93,
      service: 92,
      communication: 92,
      complaints: 3,
      lastComplaint: 'Delivery timing issue'
    },
    {
      school: 'SD Depok 1',
      score: 88,
      foodQuality: 87,
      nutrition: 89,
      service: 88,
      communication: 88,
      complaints: 5,
      lastComplaint: 'Staff turnover concerns'
    },
    {
      school: 'SD Bogor',
      score: 85,
      foodQuality: 84,
      nutrition: 86,
      service: 85,
      communication: 85,
      complaints: 7,
      lastComplaint: 'Infrastructure maintenance'
    }
  ], []);

  // 5. DAPUR (KITCHEN) PERFORMANCE
  const kitchenPerformance = useMemo(() => [
    { school: 'SD Karawang 1', mealsProduced: 25500, mealsTarget: 26000, efficiency: 98.1, waste: 2.1, foodCost: 35000, quality: 96, status: 'Excellent' },
    { school: 'SMP Bekasi', mealsProduced: 38000, mealsTarget: 38500, efficiency: 98.7, waste: 1.8, foodCost: 42000, quality: 95, status: 'Excellent' },
    { school: 'SD Karawang 2', mealsProduced: 21600, mealsTarget: 22000, efficiency: 98.2, waste: 2.3, foodCost: 38500, quality: 92, status: 'Excellent' },
    { school: 'SD Depok 1', mealsProduced: 19500, mealsTarget: 20000, efficiency: 97.5, waste: 3.1, foodCost: 40000, quality: 88, status: 'Good' },
    { school: 'SD Bogor', mealsProduced: 17400, mealsTarget: 18500, efficiency: 94.1, waste: 4.2, foodCost: 41500, quality: 85, status: 'Good' }
  ], []);

  // 6. PROGRAM TIMELINE & MILESTONES
  const programMilestones = useMemo(() => [
    { month: 'Juni 2023', milestone: 'Program Launch', status: 'Completed', progress: 100, targets: 'Initial setup & training' },
    { month: 'Agustus 2023', milestone: 'Q1 Evaluation', status: 'Completed', progress: 100, targets: 'First batch of results' },
    { month: 'November 2023', milestone: 'Expansion Phase', status: 'Completed', progress: 100, targets: 'Added 2 new schools' },
    { month: 'Februari 2024', milestone: 'Mid-Year Review', status: 'Completed', progress: 100, targets: 'Performance analysis' },
    { month: 'Mei 2024', milestone: 'Health Impact Study', status: 'Completed', progress: 100, targets: 'Student health tracking' },
    { month: 'Agustus 2024', milestone: 'Q3 Assessment', status: 'Completed', progress: 100, targets: 'Impact measurement' },
    { month: 'November 2024', milestone: 'Final Evaluation', status: 'In Progress', progress: 85, targets: 'Comprehensive analysis' },
    { month: 'Desember 2024', milestone: 'Program Conclusion', status: 'Planned', progress: 0, targets: 'Final reports & recommendations' }
  ], []);

  // Budget Forecast
  const budgetForecast = useMemo(() => [
    { month: 'Jun', actual: 30, forecast: 30 },
    { month: 'Jul', actual: 32, forecast: 32 },
    { month: 'Aug', actual: 32.5, forecast: 32 },
    { month: 'Sep', actual: 33, forecast: 33 },
    { month: 'Oct', actual: 33.5, forecast: 34 },
    { month: 'Nov', actual: 34, forecast: 34 },
    { month: 'Des', actual: 35, forecast: 35 },
    { month: 'Jan', actual: null, forecast: 36 },
    { month: 'Feb', actual: null, forecast: 36 }
  ], []);

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
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
    <CSRLayout currentPage="dashboard">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{csrStats.programName}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {csrStats.startDate} - {csrStats.endDate}
            </span>
            <span className="text-gray-400">•</span>
            <span>{csrStats.programDuration}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          {['overview', 'performance', 'health', 'cost', 'satisfaction', 'kitchen', 'timeline'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-[#D0B064] text-[#D0B064]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard title="SISWA TERBANTU" value={(csrStats.totalStudentsImpact/1000).toFixed(1)+'K'} subtitle={`${csrStats.totalStudentsImpact.toLocaleString()} siswa`} icon={Users} color="bg-green-600" trend={3.2} />
              <StatCard title="SEKOLAH BINAAN" value={csrStats.totalSchoolsSupported} subtitle="Total sekolah" icon={School} color="bg-blue-600" />
              <StatCard title="MEALS YTD" value={(csrStats.totalMealsYTD/1000000).toFixed(2)+'M'} subtitle={`${csrStats.totalMealsYTD.toLocaleString()} meals`} icon={Package} color="bg-orange-600" trend={8.5} />
              <StatCard title="BUDGET USED" value={`${csrStats.budgetPercentage}%`} subtitle={`Rp ${(csrStats.budgetUsed/1000000000).toFixed(1)}M dari ${(csrStats.budgetAllocated/1000000000).toFixed(0)}M`} icon={DollarSign} color="bg-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Trend Meals & Budget per Bulan</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="meals" fill="#e0e7ff" stroke="#6366f1" name="Meals" opacity={0.3} />
                    <Line yAxisId="left" type="monotone" dataKey="satisfaction" stroke="#10b981" strokeWidth={3} name="Satisfaction %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Siswa per Sekolah</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={schoolDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {schoolDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4 text-xs">
                  {schoolDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-700 truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Laporan & Dokumentasi</h3>
                  <p className="text-xs text-gray-500 mt-1">Akses laporan program dan dokumentasi</p>
                </div>
                <button className="px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-semibold text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Laporan
                </button>
              </div>

              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2.5 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm">{report.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{report.type}</span>
                          <span>•</span>
                          <span>{new Date(report.date).toLocaleDateString('id-ID')}</span>
                          <span>•</span>
                          <span>{report.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        {report.status}
                      </span>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Impact Score</h4>
                    <p className="text-sm text-gray-600">Skor dampak program</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-600">{csrStats.impactScore}</span>
                  <span className="text-lg text-gray-600">/ 100</span>
                </div>
                <p className="text-sm text-gray-600 mt-4">Program Anda telah memberikan dampak positif yang signifikan terhadap pendidikan dan kesehatan siswa di 5 sekolah binaan.</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Heart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Kepuasan</h4>
                    <p className="text-sm text-gray-600">Rata-rata kepuasan sekolah</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-600">{csrStats.avgSatisfaction}</span>
                  <span className="text-lg text-gray-600">%</span>
                </div>
                <p className="text-sm text-gray-600 mt-4">Kepuasan tinggi dari kepala sekolah dan guru menunjukkan efektivitas program dalam mendukung pendidikan berkualitas.</p>
              </div>
            </div>
          </>
        )}

        {/* PERFORMANCE COMPARISON TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Rating per Sekolah</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={schoolPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="school" angle={-45} textAnchor="end" height={80} style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Bar dataKey="performance" fill="#8b5cf6" name="Rating" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Satisfaction vs Attendance Improvement</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={schoolPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="school" angle={-45} textAnchor="end" height={80} style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="satisfaction" stroke="#10b981" strokeWidth={2} name="Satisfaction %" />
                    <Line yAxisId="right" type="monotone" dataKey="attendance" stroke="#f59e0b" strokeWidth={2} name="Attendance ↑ %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Perbandingan Performa Sekolah</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Sekolah</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Siswa</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Satisfaksi</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Rating</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Attendance ↑</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Akademik ↑</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolPerformance.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{row.school}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{row.students.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right"><span className="flex items-center justify-end gap-1 text-green-600 font-semibold"><ArrowUpRight className="w-3 h-3" />{row.attendance}%</span></td>
                        <td className="py-3 px-4 text-right"><span className="flex items-center justify-end gap-1 text-blue-600 font-semibold"><ArrowUpRight className="w-3 h-3" />{row.academic}%</span></td>
                        <td className="py-3 px-4 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.status === 'Excellent' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* HEALTH METRICS TAB */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Kesehatan Siswa - Trend 7 Bulan</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={healthMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} name="Attendance" />
                    <Line type="monotone" dataKey="healthStatus" stroke="#ef4444" strokeWidth={2} name="Health Status" />
                    <Line type="monotone" dataKey="nutritionImprovement" stroke="#f59e0b" strokeWidth={2} name="Nutrition ↑" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Academic Performance Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={healthMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="academicScore" fill="#dbeafe" stroke="#3b82f6" name="Academic Score" opacity={0.5} />
                    <Line type="monotone" dataKey="academicScore" stroke="#3b82f6" strokeWidth={3} name="Score Trend" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <p className="text-xs font-semibold text-gray-600">ATTENDANCE RATE</p>
                </div>
                <p className="text-3xl font-bold text-green-600">94%</p>
                <p className="text-xs text-gray-600 mt-2">↑ 12% improvement from June</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <p className="text-xs font-semibold text-gray-600">ACADEMIC SCORE</p>
                </div>
                <p className="text-3xl font-bold text-blue-600">85</p>
                <p className="text-xs text-gray-600 mt-2">↑ 17 points improvement</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <p className="text-xs font-semibold text-gray-600">HEALTH STATUS</p>
                </div>
                <p className="text-3xl font-bold text-red-600">91%</p>
                <p className="text-xs text-gray-600 mt-2">↑ 16% improvement from June</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <p className="text-xs font-semibold text-gray-600">NUTRITION</p>
                </div>
                <p className="text-3xl font-bold text-amber-600">88%</p>
                <p className="text-xs text-gray-600 mt-2">↑ 28% improvement from June</p>
              </div>
            </div>
          </div>
        )}

        {/* COST ANALYSIS TAB */}
        {activeTab === 'cost' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Budget vs Actual per Sekolah</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="school" angle={-45} textAnchor="end" height={80} style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalCost" fill="#3b82f6" name="Total Cost" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="forecast" fill="#93c5fd" name="Forecast" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cost per Student vs Efficiency</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="school" angle={-45} textAnchor="end" height={80} style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="costPerStudent" stroke="#ef4444" strokeWidth={2} name="Cost/Student (Rp)" />
                    <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} name="Efficiency %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Analysis Detail per Sekolah</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Sekolah</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Siswa</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost/Siswa</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Cost</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Efficiency</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Forecast</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costAnalysis.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{row.school}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{row.students.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">Rp {(row.costPerStudent/1000).toFixed(0)}K</td>
                        <td className="py-3 px-4 text-right text-gray-700">Rp {(row.totalCost/1000000).toFixed(1)}M</td>
                        <td className="py-3 px-4 text-right"><span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-xs">{row.efficiency}%</span></td>
                        <td className="py-3 px-4 text-right text-gray-700">Rp {(row.forecast/1000000).toFixed(1)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">AVG COST PER STUDENT</p>
                <p className="text-3xl font-bold text-purple-600">Rp 47.3K</p>
                <p className="text-xs text-gray-600 mt-2">Range: 45K - 49K</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">AVG EFFICIENCY</p>
                <p className="text-3xl font-bold text-green-600">88%</p>
                <p className="text-xs text-gray-600 mt-2">Overall program efficiency</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">TOTAL BUDGET</p>
                <p className="text-3xl font-bold text-blue-600">Rp 188.8M</p>
                <p className="text-xs text-gray-600 mt-2">YTD allocation across schools</p>
              </div>
            </div>
          </div>
        )}

        {/* SATISFACTION DETAILS TAB */}
        {activeTab === 'satisfaction' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Satisfaction Score per Sekolah</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={satisfactionDetails}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="school" angle={-45} textAnchor="end" height={80} style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#10b981" name="Overall Score" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Satisfaction Components</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={satisfactionDetails}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="school" style={{ fontSize: '11px' }} />
                    <PolarRadiusAxis style={{ fontSize: '11px' }} domain={[0, 100]} />
                    <Radar name="Food Quality" dataKey="foodQuality" stroke="#3b82f6" fill="#3b82f6" opacity={0.6} />
                    <Radar name="Nutrition" dataKey="nutrition" stroke="#10b981" fill="#10b981" opacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Satisfaction Detail & Complaint Tracking</h3>
              <div className="space-y-4">
                {satisfactionDetails.map((item, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">{item.school}</h4>
                        <p className="text-xs text-gray-500 mt-1">Overall Score: {item.score}/100</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">{item.complaints} Complaints</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">Food Quality</p>
                        <p className="text-lg font-bold text-gray-900">{item.foodQuality}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Nutrition</p>
                        <p className="text-lg font-bold text-gray-900">{item.nutrition}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Service</p>
                        <p className="text-lg font-bold text-gray-900">{item.service}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Communication</p>
                        <p className="text-lg font-bold text-gray-900">{item.communication}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600"><span className="font-semibold">Last Complaint:</span> {item.lastComplaint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KITCHEN PERFORMANCE TAB */}
        {activeTab === 'kitchen' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Production Efficiency vs Target</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kitchenPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="school" angle={-45} textAnchor="end" height={80} style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="mealsProduced" fill="#3b82f6" name="Produced" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="mealsTarget" fill="#93c5fd" name="Target" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Waste Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={kitchenPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="school" angle={-45} textAnchor="end" height={80} style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={3} name="Waste %" dot={{ fill: '#ef4444', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Kitchen Performance Detail</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Sekolah</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Meals Produced</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Target</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Efficiency</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Waste %</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Quality</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kitchenPerformance.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{row.school}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{row.mealsProduced.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{row.mealsTarget.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right"><span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-xs">{row.efficiency}%</span></td>
                        <td className="py-3 px-4 text-right"><span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold text-xs">{row.waste}%</span></td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">{row.quality}</td>
                        <td className="py-3 px-4 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.status === 'Excellent' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE & MILESTONES TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Program Timeline & Milestone Progress</h3>
              <div className="space-y-4">
                {programMilestones.map((milestone, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          milestone.status === 'Completed' ? 'bg-green-500' : 
                          milestone.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-300'
                        }`}>
                          {milestone.status === 'Completed' ? '✓' : milestone.status === 'In Progress' ? '⟳' : '◦'}
                        </div>
                        {idx < programMilestones.length - 1 && <div className={`w-1 h-16 mt-2 ${milestone.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{milestone.milestone}</p>
                            <p className="text-sm text-gray-600">{milestone.month}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            milestone.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            milestone.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {milestone.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{milestone.targets}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${milestone.progress}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{milestone.progress}% Complete</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Forecast vs Actual</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={budgetForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} name="Actual Spending" connectNulls />
                  <Line type="linear" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </CSRLayout>
  );
};

export default CSRDashboard;