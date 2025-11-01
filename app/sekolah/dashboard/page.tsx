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

const SkeletonTableRow = () => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="py-4 px-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="py-4 px-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="py-4 px-4"><div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div></td>
  </tr>
);


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
    if (!mounted || !reminder?.tanggalMulai && !reminder?.tanggal) return;

    const today = new Date();
    const dateToUse = reminder?.tanggalMulai || reminder?.tanggal;
    const eventDate = new Date(dateToUse);
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

    const dateToFormat = reminder?.tanggalMulai || reminder?.tanggal;
    const formatted = new Date(dateToFormat).toLocaleDateString('id-ID', {
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
        <h3 className={`font-semibold ${daysStatus.textColor} mb-1`}>{reminder.deskripsi || reminder.namaSekolah || 'Jadwal Pengiriman'}</h3>
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


const DashboardSekolah = () => {
  // ✅ FIX: Gunakan useRef untuk track initialization
  const hasInitialized = useRef(false);
  const fetchInProgress = useRef(false);

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

  // ✅ FIX #1: Effect untuk initialize - HANYA SEKALI
  useEffect(() => {
    if (hasInitialized.current) return; // ✅ Prevent re-run
    if (typeof window === 'undefined') return;

    hasInitialized.current = true;

    const token = localStorage.getItem('authToken');
    const schoolId = localStorage.getItem('sekolahId');

    if (!token) {
      setError('Token tidak ditemukan. Silakan login terlebih dahulu.');
      setLoading(false);
      return;
    }

    setAuthToken(token);
    setSekolahId(schoolId);
  }, []); // ✅ Empty dependency array - hanya run sekali


  // ✅ FIX #2: Effect untuk fetch data - memiliki guard untuk prevent duplicate
  useEffect(() => {
    if (!authToken || !sekolahId) return;
    if (fetchInProgress.current) return; // ✅ Prevent duplicate fetch
    if (error && error.includes('Token tidak ditemukan')) return;

    const fetchData = async () => {
      if (fetchInProgress.current) return; // ✅ Double check
      
      try {
        fetchInProgress.current = true;
        setLoading(true);

        // ✅ Fetch semua data secara parallel
        await Promise.all([
          fetchSiswaData(sekolahId, authToken),
          fetchKelasData(sekolahId, authToken),
          fetchAbsensiData(sekolahId, authToken),
          fetchPengirimanData(sekolahId, authToken),
          fetchKalenderAkademik(authToken)
        ]);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
        setLoading(false);
      } finally {
        fetchInProgress.current = false;
      }
    };

    fetchData();
  }, [authToken, sekolahId, error]); // ✅ Dependencies yang tepat


  // ✅ FIX #3: ENDPOINT SISWA - Gunakan /api/sekolah/:sekolahId/siswa
  const fetchSiswaData = async (schoolId: string, token: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sekolah/${schoolId}/siswa?page=1&limit=100`,
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
      
      // Handle response format - sama seperti DataSiswa.tsx
      let siswaData = Array.isArray(data.data?.data)
        ? data.data.data
        : Array.isArray(data.data)
        ? data.data
        : [];
      
      setSiswaList(siswaData);

      // Update stats - gunakan statusGizi langsung dari API
      const totalSiswa = siswaData.length || 0;
      const normalGizi = siswaData.filter((s: any) => s.statusGizi === 'NORMAL').length || 0;
      const giziKurang = siswaData.filter((s: any) => s.statusGizi === 'GIZI_KURANG').length || 0;
      const giziBuruk = siswaData.filter((s: any) => s.statusGizi === 'GIZI_BURUK').length || 0;
      const obesitas = siswaData.filter((s: any) => s.statusGizi === 'OBESITAS').length || 0;
      const berlebih = obesitas;

      setStats(prev => ({
        ...prev,
        totalSiswa,
        normalGizi,
        giziKurang,
        stuntingRisiko: giziBuruk,
        rataGizi: totalSiswa > 0 ? Math.round((normalGizi / totalSiswa) * 100) : 0
      }));

      // Update diagram gizi
      setSiswaDiagram([
        { name: 'Normal', value: normalGizi },
        { name: 'Kurang', value: giziKurang },
        { name: 'Risiko Stunting', value: giziBuruk },
        { name: 'Berlebih', value: berlebih }
      ]);
    } catch (err) {
      console.error('Error fetching siswa:', err);
      setSiswaList([]);
    }
  };

  const fetchKelasData = async (schoolId: string, token: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sekolah/${schoolId}/kelas?page=1&limit=100`,
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
      
      // Handle response format - sama seperti DataKelas.tsx
      let kelasData = [];
      if (Array.isArray(data.data?.data)) {
        kelasData = data.data.data;
      } else if (Array.isArray(data.data)) {
        kelasData = data.data;
      } else if (Array.isArray(data)) {
        kelasData = data;
      }

      // Fetch siswa untuk mendapatkan count per kelas
      let siswaArray: any[] = [];
      try {
        const siswaRes = await fetch(
          `${API_BASE_URL}/api/sekolah/${schoolId}/siswa?page=1&limit=100`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
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
        if (siswa.alergi) {
          if (Array.isArray(siswa.alergi) && siswa.alergi.length > 0) {
            siswaPerKelas[kelasId].alergi++;
          } else if (typeof siswa.alergi === 'string' && siswa.alergi.trim() !== '') {
            siswaPerKelas[kelasId].alergi++;
          }
        }
      });

      // Update kelas dengan siswa count
      kelasData = kelasData.map((kelas: any) => ({
        ...kelas,
        totalSiswa: (siswaPerKelas[kelas.id]?.laki || 0) + (siswaPerKelas[kelas.id]?.perempuan || 0) || kelas.totalSiswa || 0,
        lakiLaki: siswaPerKelas[kelas.id]?.laki || kelas.lakiLaki || 0,
        perempuan: siswaPerKelas[kelas.id]?.perempuan || kelas.perempuan || 0,
        alergiCount: siswaPerKelas[kelas.id]?.alergi || kelas.alergiCount || 0
      }));

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


  const fetchAbsensiData = async (schoolId: string, token: string) => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // ✅ STEP 1: Hitung range minggu ini (Senin-Jumat)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const mondayDate = new Date(today);
      mondayDate.setDate(today.getDate() - daysToMonday);
      mondayDate.setHours(0, 0, 0, 0);

      const fridayDate = new Date(mondayDate);
      fridayDate.setDate(mondayDate.getDate() + 4);
      fridayDate.setHours(23, 59, 59, 999);

      const mondayString = mondayDate.toISOString().split('T')[0];
      const fridayString = fridayDate.toISOString().split('T')[0];
      const todayString = today.toISOString().split('T')[0];

      console.log(`[ABSENSI] Range minggu ini: ${mondayString} - ${fridayString}`);

      // ✅ STEP 2: Get all kelas
      const kelasRes = await fetch(
        `${API_BASE_URL}/api/sekolah/${schoolId}/kelas?page=1&limit=100`,
        { headers }
      );

      if (!kelasRes.ok) {
        console.warn('[ABSENSI] Failed to fetch kelas');
        setStats(prev => ({
          ...prev,
          hadirHariIni: 0,
          pengirimanSelesai: 0,
          sudahMakan: 0
        }));
        return;
      }

      const kelasData = await kelasRes.json();
      let kelasList = Array.isArray(kelasData.data?.data)
        ? kelasData.data.data
        : Array.isArray(kelasData.data)
        ? kelasData.data
        : [];

      // ✅ STEP 3: Initialize chart data
      const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      const chartDataByDate: { [key: string]: { hari: string; hadir: number; tidakHadir: number } } = {};

      for (let i = 0; i < 5; i++) {
        const dateForDay = new Date(mondayDate);
        dateForDay.setDate(mondayDate.getDate() + i);
        const dateString = dateForDay.toISOString().split('T')[0];
        chartDataByDate[dateString] = {
          hari: daysOfWeek[i],
          hadir: 0,
          tidakHadir: 0
        };
      }

      let totalHadirHariIni = 0;

      // ✅ STEP 4: Fetch absensi untuk setiap kelas
      const absensiPromises = kelasList.map(async (kelas: any) => {
        try {
          const absenRes = await fetch(
            `${API_BASE_URL}/api/kelas/${kelas.id}/absensi`,
            { headers }
          );

          if (!absenRes.ok) {
            console.warn(`[ABSENSI] Failed to fetch absensi for kelas ${kelas.nama}`);
            return 0;
          }

          const absenData = await absenRes.json();
          let absensiList = Array.isArray(absenData.data?.data)
            ? absenData.data.data
            : Array.isArray(absenData.data)
            ? absenData.data
            : [];

          let hadirToday = 0;

          // ✅ STEP 5: Filter & aggregate hanya untuk minggu ini
          for (const a of absensiList) {
            if (!a.tanggal) continue;

            try {
              const eventDate = new Date(a.tanggal);
              eventDate.setHours(0, 0, 0, 0);
              const absenDateString = eventDate.toISOString().split('T')[0];

              if (absenDateString < mondayString || absenDateString > fridayString) {
                continue;
              }

              if (chartDataByDate[absenDateString]) {
                if (a.jumlahHadir !== undefined && a.jumlahHadir !== null) {
                  chartDataByDate[absenDateString].hadir += a.jumlahHadir;
                } else if (a.status === 'hadir' || a.status === 'Hadir' || a.status === 'HADIR') {
                  chartDataByDate[absenDateString].hadir += 1;
                }

                if (a.jumlahTidakHadir !== undefined && a.jumlahTidakHadir !== null) {
                  chartDataByDate[absenDateString].tidakHadir += a.jumlahTidakHadir;
                } else if (a.status === 'tidak_hadir' || a.status === 'Tidak Hadir' || a.status === 'TIDAK_HADIR') {
                  chartDataByDate[absenDateString].tidakHadir += 1;
                }
              }

              if (absenDateString === todayString) {
                if (a.jumlahHadir !== undefined && a.jumlahHadir !== null) {
                  hadirToday += a.jumlahHadir;
                } else if (a.status === 'hadir' || a.status === 'Hadir' || a.status === 'HADIR') {
                  hadirToday += 1;
                }
              }
            } catch (e) {
              console.warn('[ABSENSI] Error parsing date:', e);
              continue;
            }
          }

          return hadirToday;
        } catch (err) {
          console.warn(`[ABSENSI] Error fetching for kelas ${kelas.id}:`, err);
          return 0;
        }
      });

      const hadirPerKelas = await Promise.all(absensiPromises);
      totalHadirHariIni = hadirPerKelas.reduce((sum, count) => sum + count, 0);

      // ✅ STEP 6: Convert ke chart format
      const chartData = Object.keys(chartDataByDate)
        .sort()
        .map(dateKey => chartDataByDate[dateKey]);

      // ✅ STEP 7: Update states
      setAbsensiChart(chartData);
      setStats(prev => ({
        ...prev,
        hadirHariIni: totalHadirHariIni,
        pengirimanSelesai: Math.floor(totalHadirHariIni * 0.8),
        sudahMakan: totalHadirHariIni
      }));
    } catch (err) {
      console.error('[ABSENSI] Error aggregating:', err);
      setStats(prev => ({
        ...prev,
        hadirHariIni: 0,
        pengirimanSelesai: 0,
        sudahMakan: 0
      }));
    }
  };

  // ✅ FIX #3: FETCH PENGIRIMAN
  const fetchPengirimanData = async (schoolId: string, token: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sekolah/${schoolId}/pengiriman`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn('Endpoint pengiriman tidak ditemukan atau error');
        return;
      }

      const data = await response.json();
      
      if (Array.isArray(data.data) && data.data.length > 0) {
        const latestPengiriman = data.data[0];
        setKalenderReminder({
          tanggalMulai: latestPengiriman.tanggal || latestPengiriman.createdAt,
          deskripsi: `Pengiriman ke ${latestPengiriman.namaSekolah || 'Sekolah'}`,
          status: latestPengiriman.status
        });
      }
    } catch (err) {
      console.error('Error fetching pengiriman:', err);
      setKalenderReminder(null);
    }
  };

  // ✅ FETCH KALENDER AKADEMIK
  const fetchKalenderAkademik = async (token: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/kalender-akademik`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn('Endpoint kalender akademik tidak ditemukan');
        return;
      }

      const data = await response.json();
      
      let kalenders = [];
      if (data.data?.kalenders && Array.isArray(data.data.kalenders)) {
        kalenders = data.data.kalenders;
      } else if (data.kalenders && Array.isArray(data.kalenders)) {
        kalenders = data.kalenders;
      } else if (Array.isArray(data.data)) {
        kalenders = data.data;
      } else if (Array.isArray(data)) {
        kalenders = data;
      }

      if (kalenders.length > 0) {
        const upcomingEvent = kalenders.find((k: any) => {
          const eventDate = new Date(k.tanggalMulai);
          return eventDate >= new Date();
        }) || kalenders[0];

        if (upcomingEvent && !kalenderReminder) {
          setKalenderReminder({
            tanggalMulai: upcomingEvent.tanggalMulai,
            deskripsi: upcomingEvent.deskripsi || 'Kegiatan akademik',
            status: 'scheduled'
          });
        }
      }
    } catch (err) {
      console.error('Error fetching kalender akademik:', err);
    }
  };

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