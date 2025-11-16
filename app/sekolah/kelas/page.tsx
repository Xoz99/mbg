'use client';

import { useState, useMemo, memo, useEffect, useRef, useCallback } from 'react';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { useSekolahDataCache } from '@/lib/hooks/useSekolahDataCache';
import { 
  Users, 
  GraduationCap,
  TrendingUp,
  UserCheck,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ClipboardCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL||'https://demombgv1.xyz';

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
    <div className="w-full h-80 bg-gray-100 rounded-lg"></div>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="bg-gray-200 h-24"></div>
    <div className="p-5 space-y-4">
      <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-16 bg-gray-100 rounded"></div>
        <div className="h-16 bg-gray-100 rounded"></div>
      </div>
      <div className="h-10 bg-gray-100 rounded"></div>
    </div>
  </div>
);

const KelasChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="nama" stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <Tooltip />
      <Legend />
      <Bar dataKey="totalSiswa" fill="#3b82f6" name="Total Siswa" radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
));

KelasChart.displayName = 'KelasChart';

const DataKelas = () => {
  const hasInitialized = useRef(false)
  const [kelasData, setKelasData] = useState<any[]>([]);
  const [siswaData, setSiswaData] = useState<any[]>([]);
  const [absensiData, setAbsensiData] = useState<any[]>([]);

  // ✅ Callback ketika unified cache ter-update dari page lain (instant sync!)
  const handleCacheUpdate = useCallback((cachedData: any) => {
    console.log("🔄 [KELAS] Received cache update from siswa page - updating state instantly!")
    setKelasData(cachedData.kelasData || [])
    setSiswaData(cachedData.siswaData || [])
    setAbsensiData(cachedData.absensiData || [])
  }, [])

  const { loading, error, loadData, updateCache } = useSekolahDataCache(handleCacheUpdate)

  const [credentialsReady, setCredentialsReady] = useState(false)

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAbsensiModal, setShowAbsensiModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nama: "",
    tingkat: 10,
    jurusan: "IPA",
    waliKelas: "",
    totalSiswa: 0,
    lakiLaki: 0,
    perempuan: 0,
    alergiCount: 0,
    alergiList: "",
  });

  // Absensi form state
  const [absensiForm, setAbsensiForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jumlahHadir: 0,
    keterangan: "",
  });

  // ✅ EFFECT 1: Wait for sekolahId to be available
  useEffect(() => {
    if (typeof window === "undefined") return
    if (credentialsReady) return // Skip if already ready

    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const schoolId = localStorage.getItem("sekolahId")

    console.log("[KELAS] Check credentials - token:", token ? "EXISTS" : "MISSING", "schoolId:", schoolId ? "EXISTS" : "MISSING")

    if (!token) {
      console.error("[KELAS] ❌ Token not found")
      return
    }

    if (schoolId) {
      // Both credentials are ready!
      console.log("[KELAS] ✅ Both credentials ready, setting flag")
      setCredentialsReady(true)
      return
    }

    // sekolahId not ready, set up polling
    console.log("[KELAS] sekolahId not ready, waiting for SekolahLayout...")
    const pollInterval = setInterval(() => {
      const newSchoolId = localStorage.getItem("sekolahId")
      if (newSchoolId) {
        console.log("[KELAS] ✅ sekolahId detected:", newSchoolId)
        clearInterval(pollInterval)
        setCredentialsReady(true) // This will trigger EFFECT 2
      }
    }, 1000)

    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      console.error("[KELAS] ❌ sekolahId timeout after 10s")
    }, 10000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [credentialsReady])

  // ✅ EFFECT 2: Fetch data when credentials are ready
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!credentialsReady) {
      console.log("[KELAS EFFECT 2] Waiting for credentialsReady flag...")
      return
    }

    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const schoolId = localStorage.getItem("sekolahId")

    // Double-check both are available
    if (!token || !schoolId) {
      console.error("[KELAS EFFECT 2] ❌ Missing credentials even though flag is true!")
      return
    }

    if (hasInitialized.current) {
      console.log("[KELAS EFFECT 2] Already initialized, skipping")
      return
    }

    const fetchAllData = async () => {
      try {
        hasInitialized.current = true
        const cachedData = await loadData(schoolId, token)

        if (cachedData) {
          setKelasData(cachedData.kelasData || [])
          setSiswaData(cachedData.siswaData || [])
          setAbsensiData(cachedData.absensiData || [])
          console.log("✅ [KELAS] Data loaded successfully")
        }
      } catch (err) {
        console.error("❌ [KELAS] Error loading data:", err)
      }
    }

    fetchAllData()
  }, [credentialsReady, loadData]) // Re-run when credentialsReady changes

  // ✅ EFFECT 3: Setup listener untuk auto-reload dari unified cache (other tabs/windows)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!credentialsReady) return

    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const schoolId = localStorage.getItem("sekolahId")

    if (!token || !schoolId) return

    // Listen untuk cache updates dari unified hook (other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sekolah_unified_cache" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          // Update state dengan unified cache terbaru
          setKelasData(data.kelasData || [])
          setSiswaData(data.siswaData || [])
          setAbsensiData(data.absensiData || [])
          console.log("✅ [UNIFIED SYNC] Auto-synced from another tab/window")
        } catch (err) {
          console.error("Error parsing unified cache:", err)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [credentialsReady])


  // Create kelas
  const handleCreateKelas = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama || !formData.tingkat) {
      alert("Nama dan Tingkat harus diisi");
      return;
    }

    try {
      setSubmitting(true);
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
      const sekolahId = localStorage.getItem("sekolahId");

      if (!authToken || !sekolahId) {
        alert("Token atau Sekolah ID tidak ditemukan");
        return;
      }

      const payload = {
        nama: formData.nama,
        tingkat: formData.tingkat,
        jurusan: formData.jurusan,
        waliKelas: formData.waliKelas,
        totalSiswa: parseInt(formData.totalSiswa.toString()),
        lakiLaki: parseInt(formData.lakiLaki.toString()),
        perempuan: parseInt(formData.perempuan.toString()),
        alergiCount: parseInt(formData.alergiCount.toString()),
        alergiList: formData.alergiList,
      };

      console.log("[CREATE KELAS] Full Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/kelas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("[CREATE KELAS] Response status:", response.status);
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log("[CREATE KELAS] Success:", data);

      setFormData({ nama: "", tingkat: 10, jurusan: "IPA", waliKelas: "", totalSiswa: 0, lakiLaki: 0, perempuan: 0, alergiCount: 0, alergiList: "" });
      setShowAddModal(false);

      // ✅ Optimistic update: Add new kelas to local state immediately
      const newKelas = {
        ...data.data,
        totalSiswa: 0,
        lakiLaki: 0,
        perempuan: 0,
        alergiCount: 0,
        hadirHariIni: 0,
      }

      setKelasData([...kelasData, newKelas])

      // 🔄 Update unified cache (auto-sync to all pages - no broadcast needed!)
      updateCache(sekolahId, authToken, {
        kelasData: [...kelasData, newKelas],
        siswaData: siswaData,
        absensiData: absensiData,
      }, (freshData) => {
        // Update state dengan data fresh dari API
        setKelasData(freshData.kelasData || [])
        setSiswaData(freshData.siswaData || [])
        setAbsensiData(freshData.absensiData || [])
        console.log("✅ [KELAS] State synced with fresh API data + auto-synced to siswa page!")
      })

      alert("Kelas berhasil ditambahkan!");
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error("[CREATE KELAS] Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Create absensi untuk kelas
  const handleCreateAbsensi = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedKelas) {
      alert("Kelas tidak dipilih");
      return;
    }

    if (!absensiForm.tanggal) {
      alert("Tanggal harus diisi");
      return;
    }

    if (absensiForm.jumlahHadir < 0) {
      alert("Jumlah hadir tidak boleh negatif");
      return;
    }

    if (absensiForm.jumlahHadir > selectedKelas.totalSiswa) {
      alert(`Jumlah hadir tidak boleh melebihi total siswa (${selectedKelas.totalSiswa})`);
      return;
    }

    try {
      setSubmitting(true);
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
      const sekolahId = localStorage.getItem("sekolahId");

      if (!authToken || !sekolahId) {
        alert("Token atau Sekolah ID tidak ditemukan");
        return;
      }

      const kelasId = selectedKelas.id || selectedKelas._id;

      const payload = {
        tanggal: absensiForm.tanggal,
        jumlahHadir: parseInt(absensiForm.jumlahHadir.toString()),
        keterangan: absensiForm.keterangan,
      };

      console.log("[CREATE ABSENSI] Kelas ID:", kelasId);
      console.log("[CREATE ABSENSI] Payload:", JSON.stringify(payload, null, 2));

      const url = `${API_BASE_URL}/api/kelas/${kelasId}/absensi`;
      console.log("[CREATE ABSENSI] URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("[CREATE ABSENSI] Response status:", response.status);
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log("[CREATE ABSENSI] Success:", data);

      setAbsensiForm({
        tanggal: new Date().toISOString().split('T')[0],
        jumlahHadir: 0,
        keterangan: "",
      });
      setShowAbsensiModal(false);

      // ✅ Optimistic update: Update kelas hadirHariIni count
      const updatedKelasData = kelasData.map((k) => {
        if (k.id === kelasId) {
          return {
            ...k,
            hadirHariIni: absensiForm.jumlahHadir,
          }
        }
        return k
      })

      setKelasData(updatedKelasData)

      // 🔄 Update unified cache (auto-sync to all pages - no broadcast needed!)
      updateCache(sekolahId, authToken, {
        kelasData: updatedKelasData,
        siswaData: siswaData,
        absensiData: absensiData,
      }, (freshData) => {
        // Update state dengan data fresh dari API
        setKelasData(freshData.kelasData || [])
        setSiswaData(freshData.siswaData || [])
        setAbsensiData(freshData.absensiData || [])
        console.log("✅ [KELAS] State synced with fresh API data + auto-synced to siswa page!")
      })

      alert("Absensi berhasil dibuat!");
    } catch (err) {
      alert(`Gagal membuat absensi: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error("[CREATE ABSENSI] Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete kelas
  const handleDeleteKelas = async (kelasId: string) => {
    console.log("[DELETE] Attempting to delete Kelas ID:", kelasId);
    if (!confirm("Apakah Anda yakin ingin menghapus kelas ini?")) {
      console.log("[DELETE] Deletion cancelled by user");
      return;
    }

    try {
      setSubmitting(true);
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
      const sekolahId = localStorage.getItem("sekolahId");

      if (!authToken || !sekolahId) {
        alert("Token atau Sekolah ID tidak ditemukan");
        return;
      }

      const url = `${API_BASE_URL}/api/kelas/${kelasId}`;
      console.log("[DELETE KELAS] URL:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[DELETE KELAS] Response status:", response.status);
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${responseText}`);
      }

      console.log("[DELETE KELAS] Success");
      setSelectedKelas(null);

      // ✅ Optimistic update: Remove kelas from local state immediately
      const updatedKelasData = kelasData.filter((k) => k.id !== kelasId)
      setKelasData(updatedKelasData)

      // 🔄 Update unified cache (auto-sync to all pages - no broadcast needed!)
      updateCache(sekolahId, authToken, {
        kelasData: updatedKelasData,
        siswaData: siswaData,
        absensiData: absensiData,
      }, (freshData) => {
        // Update state dengan data fresh dari API
        setKelasData(freshData.kelasData || [])
        setSiswaData(freshData.siswaData || [])
        setAbsensiData(freshData.absensiData || [])
        console.log("✅ [KELAS] State synced with fresh API data + auto-synced to siswa page!")
      })

      alert("Kelas berhasil dihapus!");
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error("[DELETE KELAS] Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter data
  const filteredData = useMemo(() => {
    return kelasData.filter(kelas => 
      (kelas.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (kelas.waliKelas || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [kelasData, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics dengan alergi
  const stats = useMemo(() => {
    const totalKelas = kelasData.length;
    const totalSiswa = kelasData.reduce((acc, k) => acc + (k.totalSiswa || 0), 0);
    const totalAlergi = kelasData.reduce((acc, k) => acc + (k.alergiCount || 0), 0);
    const avgKehadiran = totalSiswa > 0 ? "95" : "0";
    const persenAlergi = totalSiswa > 0 ? Math.round((totalAlergi / totalSiswa) * 100) : 0;
    return { totalKelas, totalSiswa, avgKehadiran, totalAlergi, persenAlergi };
  }, [kelasData]);

  // Chart data
  const chartData = useMemo(() => {
    return kelasData.map(k => ({
      nama: k.nama || 'Kelas',
      totalSiswa: k.totalSiswa || 0,
    }));
  }, [kelasData]);

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

  // Loading state with skeleton
  if (loading && kelasData.length === 0) {
    return (
      <SekolahLayout currentPage="kelas">
        <div className="space-y-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>

          <SkeletonChartContainer />

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-10 w-full bg-gray-200 rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </SekolahLayout>
    );
  }

  if (error && kelasData.length === 0) {
    return (
      <SekolahLayout currentPage="kelas">
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
                const schoolId = localStorage.getItem("sekolahId");
                if (schoolId && token) {
                  hasInitialized.current = false
                  setCredentialsReady(false)
                  setCredentialsReady(true)
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </SekolahLayout>
    );
  }

  return (
    <SekolahLayout currentPage="kelas">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Kelas</h1>
          <p className="text-gray-600">Informasi lengkap kelas dan siswa</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1B263A] text-white rounded-lg hover:bg-[#24314d] transition-colors font-semibold shadow-md"
          >
          <Plus className="w-5 h-5" />
          Tambah Kelas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Kelas" value={stats.totalKelas} subtitle="Kelas aktif" icon={GraduationCap} color="bg-blue-500" />
        <StatCard title="Total Siswa" value={stats.totalSiswa} subtitle="Seluruh tingkat" icon={Users} color="bg-green-500" />
        <StatCard title="Siswa Alergi" value={stats.totalAlergi} subtitle={`${stats.persenAlergi}% dari total`} icon={AlertCircle} color="bg-red-500" />
        <StatCard title="Kehadiran" value={`${stats.avgKehadiran}%`} subtitle="rata-rata hari ini" icon={UserCheck} color="bg-orange-500" />
      </div>

      {kelasData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Grafik Siswa per Kelas</h3>
              <p className="text-sm text-gray-600 mt-1">Distribusi siswa di setiap kelas</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <KelasChart data={chartData} />
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kelas atau wali kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {kelasData.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium mb-2">Belum ada data kelas</p>
          <p className="text-gray-500 mb-6">Mulai tambahkan kelas untuk sekolah ini</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Tambah Kelas
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {paginatedData.map((kelas) => {
              const kelasKey = kelas.id || kelas._id;
              console.log(`[MAP] Rendering Kelas: ${kelas.nama}, ID: ${kelasKey}`);
              return (
                <div key={kelasKey} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] p-5 text-white">
                    <h3 className="text-2xl font-bold">Kelas: {kelas.nama || 'Kelas'}</h3>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-green-600">{kelas.lakiLaki || 0}</p>
                        <p className="text-xs text-gray-600">Laki-laki</p>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <Users className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-pink-600">{kelas.perempuan || 0}</p>
                        <p className="text-xs text-gray-600">Perempuan</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Siswa</span>
                        <span className="font-semibold text-gray-900">{kelas.totalSiswa || 0} siswa</span>
                      </div>
                      {kelas.alergiCount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-600">Alergi</span>
                          <span className="font-semibold text-red-900">{kelas.alergiCount} siswa</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const kelasId = kelas.id || kelas._id;
                        console.log("[CLICK] Kelas dipilih:", kelas.nama);
                        console.log("[CLICK] Kelas ID:", kelasId);
                        console.log("[CLICK] Full Kelas Object:", kelas);
                        setSelectedKelas(kelas);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Lihat Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} kelas
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">Hal {currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal Tambah Kelas */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold">Tambah Kelas Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: X-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateKelas}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#1B263A] text-white rounded-xl hover:bg-[#24314d] transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Tambah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create Absensi */}
      {showAbsensiModal && selectedKelas && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className="bg-gradient-to-r from-[#1B263A] to-[#24314d] text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div>
                <h3 className="text-xl font-bold">Buat Absensi</h3>
                <p className="text-sm text-white/80 mt-1">Kelas {selectedKelas.nama}</p>
              </div>
              <button onClick={() => setShowAbsensiModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAbsensi} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Absensi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={absensiForm.tanggal}
                  onChange={(e) => setAbsensiForm({ ...absensiForm, tanggal: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Siswa Hadir <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={selectedKelas.totalSiswa}
                  value={absensiForm.jumlahHadir}
                  onChange={(e) => setAbsensiForm({ ...absensiForm, jumlahHadir: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={`Max: ${selectedKelas.totalSiswa} siswa`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total siswa di kelas: {selectedKelas.totalSiswa}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAbsensiModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#1B263A] text-white rounded-xl hover:bg-[#24314d] transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
                  Buat Absensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Kelas */}
      {selectedKelas && !showAbsensiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <button onClick={() => setSelectedKelas(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <Users className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{selectedKelas.totalSiswa || 0}</p>
                  <p className="text-xs text-blue-700">Total Siswa</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <UserCheck className="w-6 h-6 text-green-600" />
                    {loading && <Loader2 className="w-4 h-4 text-green-600 animate-spin" />}
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {loading ? '...' : (selectedKelas.hadirHariIni || 0)}
                  </p>
                  <p className="text-xs text-green-700">Hadir Hari Ini</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Komposisi Siswa</h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Laki-laki</span>
                      <span className="text-lg font-bold text-blue-900">{selectedKelas.lakiLaki || 0}</span>
                    </div>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-pink-900">Perempuan</span>
                      <span className="text-lg font-bold text-pink-900">{selectedKelas.perempuan || 0}</span>
                    </div>
                  </div>

                  {selectedKelas.alergiCount > 0 && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-900">Siswa dengan Alergi</span>
                        <span className="text-lg font-bold text-red-900">{selectedKelas.alergiCount}</span>
                      </div>
                      {selectedKelas.alergiList && (
                        <p className="text-xs text-red-700 mt-2">{selectedKelas.alergiList}</p>
                      )}
                      {/* Detail siswa dengan alergi */}
                      <div className="mt-4 pt-4 border-t border-red-200">
                        <p className="text-xs font-semibold text-red-900 mb-2">Detail Siswa ({siswaData.filter(s => {
                          const kelasId = s.kelasId?.id || s.kelasId;
                          return String(kelasId) === String(selectedKelas.id);
                        }).length}):</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {siswaData
                            .filter(siswa => {
                              const siswaKelasId = String(siswa.kelasId?.id || siswa.kelasId || '');
                              const selectedKelasId = String(selectedKelas.id || '');
                              return siswaKelasId === selectedKelasId;
                            })
                            .filter(siswa => {
                              // Cek apakah benar-benar ada alergi
                              if (!siswa.alergi) return false;
                              
                              if (Array.isArray(siswa.alergi)) {
                                return siswa.alergi.some((a: any) => {
                                  if (typeof a === 'string') return a.trim() !== '';
                                  if (typeof a === 'object' && a) {
                                    const val = a.namaAlergi || a.nama || '';
                                    return String(val).trim() !== '';
                                  }
                                  return false;
                                });
                              } else if (typeof siswa.alergi === 'string') {
                                return siswa.alergi.trim() !== '';
                              } else if (typeof siswa.alergi === 'object') {
                                return true;
                              }
                              return false;
                            })
                            .map((siswa, idx) => {
                              let alergiText = '';
                              
                              // Handle berbagai format alergi seperti di DataSiswa
                              if (siswa.alergi) {
                                if (Array.isArray(siswa.alergi)) {
                                  alergiText = siswa.alergi
                                    .map((a: any) => {
                                      if (typeof a === 'string') return a;
                                      if (typeof a === 'object' && a) {
                                        return String(a.namaAlergi || a.nama || '');
                                      }
                                      return '';
                                    })
                                    .filter((a: string) => a && a.trim())
                                    .join(', ');
                                } else if (typeof siswa.alergi === 'object' && siswa.alergi !== null) {
                                  if (siswa.alergi.namaAlergi) {
                                    alergiText = String(siswa.alergi.namaAlergi);
                                  } else if (siswa.alergi.nama) {
                                    alergiText = String(siswa.alergi.nama);
                                  }
                                } else if (typeof siswa.alergi === 'string') {
                                  alergiText = siswa.alergi.trim();
                                }
                              }
                              
                              return (
                                <div key={idx} className="bg-white rounded p-2 text-xs border border-red-100">
                                  <p className="font-semibold text-gray-900">{siswa.nama || 'Siswa'}</p>
                                  <p className="text-red-700">
                                    {alergiText || 'Alergi tidak terdaftar'}
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAbsensiModal(true)}
                  className="flex-1 px-5 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all font-bold flex items-center justify-center gap-2"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  Buat Absensi
                </button>
                <button
                  onClick={() => handleDeleteKelas(selectedKelas.id || selectedKelas._id)}
                  disabled={submitting}
                  className="flex-1 px-5 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  Hapus Kelas
                </button>
                <button
                  onClick={() => setSelectedKelas(null)}
                  className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SekolahLayout>
  );
};

export default DataKelas;