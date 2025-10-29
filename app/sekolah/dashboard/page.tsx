'use client';

import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { 
  Users, 
  BarChart3,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Calendar,
  Bell,
  Clock,
  Truck,
  UtensilsCrossed,
  Activity
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://demombgv1.xyz';


const SkeletonStatCard = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3"></div>
    <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
    <div className="h-8 w-16 bg-gray-300 rounded mb-2"></div>
    <div className="h-3 w-20 bg-gray-200 rounded"></div>
  </div>
);

const SkeletonChartContainer = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
    <div className="w-full h-64 bg-gray-100 rounded-lg"></div>
  </div>
);

// ✅ FIXED: SkeletonTableRow as proper table row
const SkeletonTableRow = () => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="py-4 px-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="py-4 px-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="py-4 px-4"><div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div></td>
  </tr>
);

// ==================== CHART COMPONENTS ====================

const GiziDistributionChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={(entry) => `${entry.name}: ${entry.value}`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        <Cell fill="#10b981" />
        <Cell fill="#f59e0b" />
        <Cell fill="#ef4444" />
        <Cell fill="#8b5cf6" />
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
));

GiziDistributionChart.displayName = 'GiziDistributionChart';

const AttendanceChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="hari" stroke="#94a3b8" />
      <YAxis stroke="#94a3b8" />
      <Tooltip />
      <Legend />
      <Bar dataKey="hadir" fill="#10b981" name="Hadir" />
      <Bar dataKey="tidakHadir" fill="#ef4444" name="Tidak Hadir" />
    </BarChart>
  </ResponsiveContainer>
));

AttendanceChart.displayName = 'AttendanceChart';

const ConsumptionChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="hari" stroke="#94a3b8" />
      <YAxis stroke="#94a3b8" />
      <Tooltip />
      <Line type="monotone" dataKey="porsi" stroke="#1B263A" strokeWidth={3} dot={{ fill: '#D0B064', r: 5 }} />
    </LineChart>
  </ResponsiveContainer>
));

ConsumptionChart.displayName = 'ConsumptionChart';

// ==================== STAT CARD ====================

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className="w-4 h-4" />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm text-gray-500">{subtitle}</p>
  </div>
);

// ==================== KALENDER REMINDER ====================

// ✅ FIXED: KalenderReminder dengan useEffect untuk menghindari hydration mismatch
const KalenderReminder = ({ reminder }: { reminder: any }) => {
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');
  const [daysStatus, setDaysStatus] = useState({
    daysUntil: 0,
    bgColor: 'from-green-50 to-green-100',
    borderColor: 'border-green-200',
    iconBg: 'bg-green-500',
    textColor: 'text-green-900',
    statusText: 'Sedang Berlangsung'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !reminder?.tanggalMulai) return;

    const today = new Date();
    const eventDate = new Date(reminder.tanggalMulai);
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let bgColor = 'from-green-50 to-green-100';
    let borderColor = 'border-green-200';
    let iconBg = 'bg-green-500';
    let textColor = 'text-green-900';
    let statusText = 'Sedang Berlangsung';

    if (daysUntil > 0 && daysUntil <= 7) {
      bgColor = 'from-yellow-50 to-yellow-100';
      borderColor = 'border-yellow-200';
      iconBg = 'bg-yellow-500';
      textColor = 'text-yellow-900';
      statusText = `${daysUntil} hari lagi`;
    } else if (daysUntil > 7) {
      bgColor = 'from-purple-50 to-purple-100';
      borderColor = 'border-purple-200';
      iconBg = 'bg-purple-500';
      textColor = 'text-purple-900';
      statusText = `${Math.ceil(daysUntil / 7)} minggu lagi`;
    } else if (daysUntil < 0) {
      bgColor = 'from-gray-50 to-gray-100';
      borderColor = 'border-gray-200';
      iconBg = 'bg-gray-500';
      textColor = 'text-gray-900';
      statusText = 'Sudah Berlalu';
    }

    const formatted = new Date(reminder.tanggalMulai).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    setFormattedDate(formatted);
    setDaysStatus({
      daysUntil,
      bgColor,
      borderColor,
      iconBg,
      textColor,
      statusText
    });
  }, [reminder, mounted]);

  if (!mounted || !reminder) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 flex items-start gap-4">
        <div className="p-3 bg-blue-500 rounded-lg flex-shrink-0">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">Jadwal Pengiriman Belum Tersedia</h3>
          <p className="text-sm text-blue-700">Periksa kembali nanti untuk informasi jadwal pengiriman makanan sekolah.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r ${daysStatus.bgColor} border ${daysStatus.borderColor} rounded-xl p-6 flex items-start gap-4`}>
      <div className={`p-3 ${daysStatus.iconBg} rounded-lg flex-shrink-0`}>
        {daysStatus.daysUntil <= 7 && daysStatus.daysUntil > 0 ? (
          <Bell className="w-6 h-6 text-white" />
        ) : (
          <Calendar className="w-6 h-6 text-white" />
        )}
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold ${daysStatus.textColor} mb-1`}>{reminder.deskripsi}</h3>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          <span className={daysStatus.textColor}>
            {formattedDate}
          </span>
        </div>
        <p className={`text-sm mt-2 ${daysStatus.textColor}`}>
          <span className="font-semibold">{daysStatus.statusText}</span>
        </p>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const DashboardSekolah = () => {
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [sekolahId, setSekolahId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSiswa: 0,
    normalGizi: 0,
    giziKurang: 0,
    stuntingRisiko: 0,
    hadirHariIni: 0,
    pengirimanSelesai: 0,
    totalPengiriman: 0,
    sudahMakan: 0,
    totalKelas: 0,
    rataGizi: 0
  });
  const [siswaList, setSiswaList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [kalenderReminder, setKalenderReminder] = useState(null);
  const [siswaDiagram, setSiswaDiagram] = useState([
    { name: 'Normal', value: 0 },
    { name: 'Kurang', value: 0 },
    { name: 'Risiko Stunting', value: 0 },
    { name: 'Berlebih', value: 0 }
  ]);
  const [absensiChart, setAbsensiChart] = useState([
    { hari: 'Senin', hadir: 0, tidakHadir: 0 },
    { hari: 'Selasa', hadir: 0, tidakHadir: 0 },
    { hari: 'Rabu', hadir: 0, tidakHadir: 0 },
    { hari: 'Kamis', hadir: 0, tidakHadir: 0 },
    { hari: 'Jumat', hadir: 0, tidakHadir: 0 }
  ]);
  const [konsumsiHarian, setKonsumsiHarian] = useState([
    { hari: 'Senin', porsi: 0 },
    { hari: 'Selasa', porsi: 0 },
    { hari: 'Rabu', porsi: 0 },
    { hari: 'Kamis', porsi: 0 },
    { hari: 'Jumat', porsi: 0 }
  ]);

  // ✅ FIXED: useEffect untuk mendapatkan authToken dan sekolahId dari localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('authToken');
    const schoolId = localStorage.getItem('sekolahId');

    if (!token) {
      setError('Token tidak ditemukan. Silakan login terlebih dahulu.');
      setLoading(false);
      return;
    }

    setAuthToken(token);
    setSekolahId(schoolId);
  }, []);

  // Fetch data ketika authToken dan sekolahId tersedia
  useEffect(() => {
    if (!authToken || !sekolahId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // ✅ FIXED: Fetch siswa dengan error handling
        await fetchSiswaData(sekolahId, authToken);

        // ✅ FIXED: Fetch kelas dengan error handling
        await fetchKelasData(sekolahId, authToken);

        // ✅ FIXED: Fetch absensi dengan error handling
        await fetchAbsensiData(sekolahId, authToken);

        // Fetch reminder (asumsi endpoint ini ada)
        await fetchReminderData(sekolahId, authToken);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
        setLoading(false);
      }
    };

    fetchData();
  }, [authToken, sekolahId]);

  // ✅ FIXED: Fungsi fetch siswa dengan error handling
  const fetchSiswaData = async (schoolId: string, token: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/siswa?sekolahId=${schoolId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Endpoint siswa tidak ditemukan (404)');
          setSiswaList([]);
          return;
        }
        throw new Error(`HTTP ${response.status}: Gagal fetch siswa`);
      }

      const data = await response.json();
      setSiswaList(data.data || []);

      // Update stats
      const totalSiswa = data.data?.length || 0;
      const normalGizi = data.data?.filter((s: any) => s.statusGizi === 'normal').length || 0;
      const giziKurang = data.data?.filter((s: any) => s.statusGizi === 'kurang').length || 0;
      const stuntingRisiko = data.data?.filter((s: any) => s.statusGizi === 'stunting').length || 0;

      setStats(prev => ({
        ...prev,
        totalSiswa,
        normalGizi,
        giziKurang,
        stuntingRisiko,
        rataGizi: totalSiswa > 0 ? Math.round((normalGizi / totalSiswa) * 100) : 0
      }));

      // Update diagram gizi
      setSiswaDiagram([
        { name: 'Normal', value: normalGizi },
        { name: 'Kurang', value: giziKurang },
        { name: 'Risiko Stunting', value: stuntingRisiko },
        { name: 'Berlebih', value: totalSiswa - normalGizi - giziKurang - stuntingRisiko }
      ]);
    } catch (err) {
      console.error('Error fetching siswa:', err);
      setSiswaList([]);
    }
  };

  // ✅ FIXED: Fungsi fetch kelas dengan error handling
  const fetchKelasData = async (schoolId: string, token: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/kelas?sekolahId=${schoolId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Endpoint kelas tidak ditemukan (404)');
          setKelasList([]);
          return;
        }
        throw new Error(`HTTP ${response.status}: Gagal fetch kelas`);
      }

      const data = await response.json();
      const kelasData = data.data || [];
      setKelasList(kelasData);

      setStats(prev => ({
        ...prev,
        totalKelas: kelasData.length
      }));
    } catch (err) {
      console.error('Error fetching kelas:', err);
      setKelasList([]);
    }
  };

  // ✅ FIXED: Fungsi fetch absensi dengan error handling
  const fetchAbsensiData = async (schoolId: string, token: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

      const response = await fetch(
        `${API_BASE_URL}/api/absensi?sekolahId=${schoolId}&tanggal=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Endpoint absensi tidak ditemukan (404)');
          return;
        }
        throw new Error(`HTTP ${response.status}: Gagal fetch absensi`);
      }

      const data = await response.json();
      const absensiData = data.data || [];

      // Count hadir hari ini
      const hadirCount = absensiData.filter((a: any) => a.status === 'hadir').length;

      setStats(prev => ({
        ...prev,
        hadirHariIni: hadirCount,
        pengirimanSelesai: Math.floor(hadirCount * 0.8), // Asumsi
        sudahMakan: hadirCount
      }));
    } catch (err) {
      console.error('Error fetching absensi:', err);
    }
  };

  // ✅ FIXED: Fungsi fetch reminder dengan error handling
  const fetchReminderData = async (schoolId: string, token: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reminder?sekolahId=${schoolId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn('Endpoint reminder tidak ditemukan atau error');
        return;
      }

      const data = await response.json();
      setKalenderReminder(data.data?.[0] || null);
    } catch (err) {
      console.error('Error fetching reminder:', err);
      setKalenderReminder(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SekolahLayout currentPage="dashboard">
        <div className="space-y-6 p-6">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChartContainer />
            <SkeletonChartContainer />
          </div>

          <SkeletonChartContainer />

          {/* ✅ FIXED: Skeleton table dengan proper structure */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <SkeletonTableRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SekolahLayout>
    );
  }

  // Error state
  if (error && !authToken) {
    return (
      <SekolahLayout currentPage="dashboard">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">{error}</p>
            <p className="text-sm text-red-700">Silakan login terlebih dahulu</p>
          </div>
        </div>
      </SekolahLayout>
    );
  }

  return (
    <SekolahLayout currentPage="dashboard">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard PIC Sekolah</h1>
          <p className="text-gray-600">Monitoring Distribusi Makanan Bergizi & Status Gizi Siswa</p>
        </div>

        {/* Kalender Reminder */}
        <KalenderReminder reminder={kalenderReminder} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Siswa" 
            value={stats.totalSiswa} 
            subtitle="Siswa terdaftar" 
            icon={Users} 
            color="bg-blue-500"
            trend={2.5}
          />
          <StatCard 
            title="Gizi Normal" 
            value={stats.normalGizi} 
            subtitle={`${stats.rataGizi}% dari total`} 
            icon={CheckCircle} 
            color="bg-green-500"
            trend={5.2}
          />
          <StatCard 
            title="Hadir Hari Ini" 
            value={stats.hadirHariIni} 
            subtitle={`${stats.totalSiswa > 0 ? ((stats.hadirHariIni / stats.totalSiswa) * 100).toFixed(1) : 0}% kehadiran`} 
            icon={Activity} 
            color="bg-purple-500"
            trend={1.8}
          />
          <StatCard 
            title="Pengiriman Selesai" 
            value={stats.pengirimanSelesai} 
            subtitle={`${stats.totalPengiriman} total hari ini`} 
            icon={Truck} 
            color="bg-orange-500"
            trend={3.1}
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Gizi Kurang" 
            value={stats.giziKurang} 
            subtitle="Perlu perhatian" 
            icon={AlertCircle} 
            color="bg-yellow-500"
          />
          <StatCard 
            title="Berisiko Stunting" 
            value={stats.stuntingRisiko} 
            subtitle="Memerlukan intervensi" 
            icon={TrendingUp} 
            color="bg-red-500"
          />
          <StatCard 
            title="Total Kelas" 
            value={stats.totalKelas} 
            subtitle="Kelas aktif" 
            icon={BarChart3} 
            color="bg-indigo-500"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gizi Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Distribusi Status Gizi</h3>
              <CheckCircle className="w-5 h-5 text-gray-400" />
            </div>
            <GiziDistributionChart data={siswaDiagram} />
          </div>

          {/* Absensi Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Absensi Mingguan</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <AttendanceChart data={absensiChart} />
          </div>
        </div>

        {/* Consumption Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Konsumsi Mingguan</h3>
            <UtensilsCrossed className="w-5 h-5 text-gray-400" />
          </div>
          <ConsumptionChart data={konsumsiHarian} />
        </div>

        {/* Kelas Table */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Data Kelas</h3>
            <button className="text-sm text-[#1B263A] hover:text-[#D0B064] font-medium flex items-center gap-1 transition-colors">
              Lihat Semua
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {kelasList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kelas</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total Siswa</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Laki-laki</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Perempuan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Alergi</th>
                  </tr>
                </thead>
                <tbody>
                  {kelasList.slice(0, 10).map((kelas: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-semibold text-gray-900">{kelas.nama}</td>
                      <td className="py-4 px-4 text-gray-600">{kelas.totalSiswa || 0}</td>
                      <td className="py-4 px-4 text-gray-600">{kelas.lakiLaki || 0}</td>
                      <td className="py-4 px-4 text-gray-600">{kelas.perempuan || 0}</td>
                      <td className="py-4 px-4">
                        {kelas.alergiCount > 0 ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {kelas.alergiCount} siswa
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800">Data kelas tidak tersedia</p>
            </div>
          )}
        </div>

        {/* Additional Info Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Pengiriman Hari Ini</h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">{stats.sudahMakan}/{stats.totalPengiriman || stats.totalSiswa}</p>
            <p className="text-sm text-blue-700">Pengiriman telah diterima sekolah</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Status Kehadiran</h3>
            <p className="text-3xl font-bold text-green-600 mb-2">{stats.hadirHariIni}/{stats.totalSiswa}</p>
            <p className="text-sm text-green-700">Siswa hadir hingga saat ini</p>
          </div>
        </div>
      </div>
    </SekolahLayout>
  );
};

export default DashboardSekolah;