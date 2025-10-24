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
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE_URL = 'http://72.60.79.126:3000';

// Skeleton Components
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

const SkeletonTableRow = () => (
  <tr className="border-b border-gray-100">
    <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="py-4 px-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="py-4 px-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="py-4 px-4"><div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="py-4 px-4"><div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div></td>
  </tr>
);

const SkeletonCalendarReminder = () => (
  <div className="bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-xl p-6 flex items-start gap-4 animate-pulse">
    <div className="p-3 bg-gray-300 rounded-lg flex-shrink-0 w-12 h-12"></div>
    <div className="flex-1 space-y-3">
      <div className="h-5 bg-gray-300 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

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

const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm text-gray-500">{subtitle}</p>
  </div>
);

// Kalender Reminder Component
const KalenderReminder = ({ reminder }: { reminder: any }) => {
  if (!reminder) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 flex items-start gap-4">
        <div className="p-3 bg-blue-500 rounded-lg flex-shrink-0">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">Kalender Akademik Belum Diatur</h3>
          <p className="text-sm text-blue-700">Silakan menambahkan data kalender akademik terlebih dahulu untuk memudahkan manajemen kegiatan sekolah.</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className={`bg-gradient-to-r ${bgColor} border ${borderColor} rounded-xl p-6 flex items-start gap-4`}>
      <div className={`p-3 ${iconBg} rounded-lg flex-shrink-0`}>
        {daysUntil <= 7 && daysUntil > 0 ? (
          <Bell className="w-6 h-6 text-white" />
        ) : (
          <Calendar className="w-6 h-6 text-white" />
        )}
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold ${textColor} mb-1`}>{reminder.deskripsi}</h3>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          <span className={textColor}>
            {new Date(reminder.tanggalMulai).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
        <p className={`text-sm mt-2 ${textColor}`}>
          <span className="font-semibold">{statusText}</span>
        </p>
      </div>
    </div>
  );
};

const DashboardSekolah = () => {
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [sekolahId, setSekolahId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalSiswa: 0,
    normalGizi: 0,
    giziKurang: 0,
    giziBuruk: 0,
    stuntingRisiko: 0,
    totalKelas: 0,
    hadirHariIni: 0,
    sudahMakan: 0,
    rataGizi: 0
  });

  const [kelasList, setKelasList] = useState<any[]>([]);
  const [kalenderReminder, setKalenderReminder] = useState<any>(null);
  const [konsumsiHarian] = useState([
    { hari: 'Sen', porsi: 450 },
    { hari: 'Sel', porsi: 478 },
    { hari: 'Rab', porsi: 465 },
    { hari: 'Kam', porsi: 432 },
    { hari: 'Jum', porsi: 456 },
    { hari: 'Sab', porsi: 441 }
  ]);

  const isFetchingRef = useRef(false);

  // Initialize auth
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
    const storedSekolahId = localStorage.getItem("sekolahId");

    if (storedToken) {
      setAuthToken(storedToken);
    }
    if (storedSekolahId) {
      setSekolahId(storedSekolahId);
    }

    if (!storedToken || !storedSekolahId) {
      setError("Token atau Sekolah ID tidak ditemukan");
      setLoading(false);
    }
  }, []);

  // Main fetch function
  const fetchDashboardData = useCallback(async () => {
    if (!authToken || !sekolahId || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      // Fetch kalender akademik
      try {
        const kalenderRes = await fetch(`${API_BASE_URL}/api/kalender-akademik`, { headers });
        if (kalenderRes.ok) {
          const kalenderData = await kalenderRes.json();
          let kalenders = [];
          if (kalenderData.data?.kalenders && Array.isArray(kalenderData.data.kalenders)) {
            kalenders = kalenderData.data.kalenders;
          } else if (kalenderData.kalenders && Array.isArray(kalenderData.kalenders)) {
            kalenders = kalenderData.kalenders;
          }

          // Find upcoming event
          if (kalenders.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const upcomingEvent = kalenders.find((event: any) => {
              const eventDate = new Date(event.tanggalMulai);
              eventDate.setHours(0, 0, 0, 0);
              return eventDate >= today;
            });

            setKalenderReminder(upcomingEvent || kalenders[kalenders.length - 1]);
          }
        }
      } catch (err) {
        console.error('Kalender fetch error:', err);
      }

      // Fetch kelas
      let kelasArray: any[] = [];
      try {
        const kelasRes = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/kelas`, { headers });
        if (kelasRes.ok) {
          const kelasData = await kelasRes.json();
          kelasArray = Array.isArray(kelasData.data?.data) 
            ? kelasData.data.data 
            : Array.isArray(kelasData.data) 
            ? kelasData.data 
            : [];
          setKelasList(kelasArray);
        }
      } catch (err) {
        console.error('Kelas fetch error:', err);
      }

      // Fetch siswa
      let siswaArray: any[] = [];
      try {
        const siswaRes = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/siswa`, { headers });
        if (siswaRes.ok) {
          const siswaData = await siswaRes.json();
          siswaArray = Array.isArray(siswaData.data?.data) 
            ? siswaData.data.data 
            : Array.isArray(siswaData.data) 
            ? siswaData.data 
            : [];
        }
      } catch (err) {
        console.error('Siswa fetch error:', err);
      }

      // Calculate siswa per kelas
      const siswaPerKelas: { [key: string]: { laki: number; perempuan: number; alergi: number } } = {};
      siswaArray.forEach((siswa: any) => {
        const kelasId = siswa.kelasId?.id || siswa.kelasId;
        if (!siswaPerKelas[kelasId]) {
          siswaPerKelas[kelasId] = { laki: 0, perempuan: 0, alergi: 0 };
        }
        if (siswa.jenisKelamin === 'LAKI_LAKI') {
          siswaPerKelas[kelasId].laki++;
        } else {
          siswaPerKelas[kelasId].perempuan++;
        }
        
        // Count alergi
        if (siswa.alergi && (Array.isArray(siswa.alergi) && siswa.alergi.length > 0)) {
          siswaPerKelas[kelasId].alergi++;
        }
      });

      // Update kelas dengan siswa count
      kelasArray = kelasArray.map((kelas: any) => ({
        ...kelas,
        totalSiswa: (siswaPerKelas[kelas.id]?.laki || 0) + (siswaPerKelas[kelas.id]?.perempuan || 0),
        lakiLaki: siswaPerKelas[kelas.id]?.laki || 0,
        perempuan: siswaPerKelas[kelas.id]?.perempuan || 0,
        alergiCount: siswaPerKelas[kelas.id]?.alergi || 0
      }));
      setKelasList(kelasArray);

      // Calculate gizi stats
      let normalGizi = 0, giziKurang = 0, giziBuruk = 0, stuntingRisiko = 0;
      
      siswaArray.forEach((siswa: any) => {
        if (siswa.statusGizi === 'NORMAL') normalGizi++;
        else if (siswa.statusGizi === 'GIZI_KURANG') giziKurang++;
        else if (siswa.statusGizi === 'GIZI_BURUK') giziBuruk++;
        
        if (siswa.statusStunting && siswa.statusStunting !== 'NORMAL') stuntingRisiko++;
      });

      const rataGizi = siswaArray.length > 0 
        ? Math.round((normalGizi / siswaArray.length) * 100) 
        : 0;

      // Fetch absensi
      let hadirHariIni = 0;
      try {
        const absRes = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/absensi`, { headers });
        if (absRes.ok) {
          const absData = await absRes.json();
          hadirHariIni = absData.data?.[0]?.jumlahHadir || Math.round(siswaArray.length * 0.95);
        }
      } catch (err) {
        console.error('Absensi fetch error:', err);
        hadirHariIni = Math.round(siswaArray.length * 0.95);
      }

      // Fetch pengiriman
      let sudahMakan = 0;
      try {
        const pengirimRes = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/pengiriman`, { headers });
        if (pengirimRes.ok) {
          const pengirimData = await pengirimRes.json();
          sudahMakan = Array.isArray(pengirimData.data) 
            ? pengirimData.data.filter((p: any) => p.scanSekolah).length 
            : 0;
        }
      } catch (err) {
        console.error('Pengiriman fetch error:', err);
        sudahMakan = Math.round(hadirHariIni * 0.95);
      }

      // Update stats
      setStats({
        totalSiswa: siswaArray.length,
        normalGizi,
        giziKurang,
        giziBuruk,
        stuntingRisiko,
        totalKelas: kelasArray.length,
        hadirHariIni,
        sudahMakan,
        rataGizi
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [authToken, sekolahId]);

  // Fetch on mount
  useEffect(() => {
    if (authToken && sekolahId) {
      fetchDashboardData();
    }
  }, [authToken, sekolahId, fetchDashboardData]);

  // Loading state
  if (loading) {
    return (
      <SekolahLayout currentPage="dashboard">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
          </div>

          {/* Kalender Reminder Skeleton */}
          <SkeletonCalendarReminder />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>

          {/* Chart */}
          <SkeletonChartContainer />

          {/* Table */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kelas</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total Siswa</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Laki-laki</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Perempuan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Alergi</th>
                  </tr>
                </thead>
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Sekolah</h1>
          <p className="text-gray-600">Monitoring Distribusi Makanan Bergizi</p>
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
          />
          <StatCard 
            title="Gizi Normal" 
            value={stats.normalGizi} 
            subtitle={`${stats.rataGizi}% dari total`} 
            icon={CheckCircle} 
            color="bg-green-500"
          />
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
            color="bg-orange-500"
          />
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Konsumsi Mingguan</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <ConsumptionChart data={konsumsiHarian} />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Data Kelas Hari Ini</h3>
            <button className="text-sm text-[#1B263A] hover:text-[#D0B064] font-medium flex items-center gap-1 transition-colors">
              Lihat Semua
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

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
                {kelasList.slice(0, 5).map((kelas, idx) => (
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
        </div>
      </div>
    </SekolahLayout>
  );
};

export default DashboardSekolah;