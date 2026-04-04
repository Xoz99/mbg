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
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ClipboardCheck,
  RotateCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// Skeleton Components
const SkeletonStatCard = () => (
  <div className="animate-pulse py-3">
    <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
    <div className="h-7 w-10 bg-gray-200 rounded mb-1" />
    <div className="h-3 w-20 bg-gray-100 rounded" />
  </div>
);

const SkeletonChartContainer = () => (
  <div className="border border-gray-100 rounded-xl p-5 animate-pulse">
    <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
    <div className="w-full h-56 bg-gray-100 rounded-lg" />
  </div>
);

const SkeletonCard = () => (
  <div className="border border-gray-100 rounded-xl overflow-hidden animate-pulse">
    <div className="p-4 space-y-3">
      <div className="h-5 w-2/3 bg-gray-200 rounded" />
      <div className="h-4 w-1/3 bg-gray-100 rounded" />
      <div className="h-8 bg-gray-100 rounded" />
    </div>
  </div>
);

const KelasChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={240}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="nama" stroke="#94a3b8" style={{ fontSize: '11px' }} />
      <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
      <Bar dataKey="totalSiswa" fill="#1B263A" name="Total Siswa" radius={[4, 4, 0, 0]} />
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
    siswaHadir: [] as string[], // Array of siswa IDs
  });

  // Search state untuk modal absensi
  const [absensiSearchTerm, setAbsensiSearchTerm] = useState("");

  // Refresh hadir hari ini state
  const [refreshingHadir, setRefreshingHadir] = useState(false);

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

    if (absensiForm.siswaHadir.length === 0) {
      alert("Pilih minimal 1 siswa yang hadir");
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
        jumlahHadir: absensiForm.siswaHadir.length,
        siswaHadir: absensiForm.siswaHadir,
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
        // Handle specific error: Absensi already exists
        if (response.status === 400 && responseText.includes("already exists")) {
          const userChoice = confirm(
            "Absensi untuk tanggal ini sudah ada.\n\n" +
            "Pilih:\n" +
            "✓ OK = Ubah tanggal dan coba lagi\n" +
            "✗ Cancel = Batal"
          );

          if (userChoice) {
            // Auto set tanggal ke hari berikutnya
            const nextDate = new Date(absensiForm.tanggal);
            nextDate.setDate(nextDate.getDate() + 1);
            setAbsensiForm({
              ...absensiForm,
              tanggal: nextDate.toISOString().split('T')[0],
            });
            alert("Tanggal sudah diubah ke hari berikutnya. Coba lagi!");
          }
          return;
        }

        throw new Error(`API Error ${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log("[CREATE ABSENSI] Success:", data);

      setAbsensiForm({
        tanggal: new Date().toISOString().split('T')[0],
        siswaHadir: [],
      });
      setAbsensiSearchTerm("");
      setShowAbsensiModal(false);

      // ✅ Optimistic update: Update kelas hadirHariIni count
      const totalHadir = absensiForm.siswaHadir.length;
      const updatedKelasData = kelasData.map((k) => {
        if (k.id === kelasId) {
          return {
            ...k,
            hadirHariIni: totalHadir,
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
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      alert(`Gagal membuat absensi: ${errorMsg}`);
      console.error("[CREATE ABSENSI] Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Refresh hadir hari ini untuk kelas tertentu
  const handleRefreshHadirHariIni = async () => {
    if (!selectedKelas) return;

    try {
      setRefreshingHadir(true);
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
      if (!authToken) {
        alert("Token tidak ditemukan");
        return;
      }

      const kelasId = selectedKelas.id || selectedKelas._id;
      const url = `${API_BASE_URL}/api/kelas/${kelasId}/absensi`;

      console.log("[REFRESH HADIR] Fetching from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error ${response.status}`);
      }

      const data = await response.json();
      console.log("[REFRESH HADIR] Response:", data);

      // Parse hadir hari ini dari response
      let hadirCount = 0;
      const today = new Date().toISOString().split('T')[0];

      if (Array.isArray(data.data?.data)) {
        const todayRecords = data.data.data.filter((record: any) => {
          const recordDate = record.tanggal?.split('T')[0];
          return recordDate === today;
        });
        if (todayRecords.length > 0) {
          hadirCount = todayRecords[0].jumlahHadir || 0;
        }
      } else if (Array.isArray(data.data)) {
        const todayRecord = data.data.find((record: any) => {
          const recordDate = record.tanggal?.split('T')[0];
          return recordDate === today;
        });
        hadirCount = todayRecord?.jumlahHadir || 0;
      } else if (typeof data.data === 'object' && data.data?.jumlahHadir !== undefined) {
        hadirCount = data.data.jumlahHadir || 0;
      } else if (data.jumlahHadir !== undefined) {
        hadirCount = data.jumlahHadir || 0;
      }

      console.log("[REFRESH HADIR] Hadir hari ini:", hadirCount);

      // Update selectedKelas
      const updatedKelas = {
        ...selectedKelas,
        hadirHariIni: hadirCount,
      };
      setSelectedKelas(updatedKelas);

      // Update kelasData juga
      const updatedKelasData = kelasData.map((k) => {
        if (k.id === kelasId) {
          return { ...k, hadirHariIni: hadirCount };
        }
        return k;
      });
      setKelasData(updatedKelasData);

      // Update unified cache
      const sekolahId = localStorage.getItem("sekolahId");
      if (sekolahId && authToken) {
        updateCache(sekolahId, authToken, {
          kelasData: updatedKelasData,
          siswaData: siswaData,
          absensiData: absensiData,
        });
      }
    } catch (err) {
      alert(`Gagal refresh: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error("[REFRESH HADIR] Error:", err);
    } finally {
      setRefreshingHadir(false);
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
    <div className="py-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color === 'bg-blue-500' ? 'text-[#1B263A]' : color === 'bg-green-500' ? 'text-emerald-600' : color === 'bg-red-500' ? 'text-red-500' : 'text-[#D0B064]'}`} />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );

  // Loading state with skeleton
  if (loading && kelasData.length === 0) {
    return (
      <SekolahLayout currentPage="kelas">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-6 w-36 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-64 bg-gray-100 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border border-gray-100 rounded-xl p-5">
            {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
          <SkeletonChartContainer />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </SekolahLayout>
    );
  }

  if (error && kelasData.length === 0) {
    return (
      <SekolahLayout currentPage="kelas">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-700 font-medium mb-4">{error}</p>
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
              className="px-4 py-2 bg-[#1B263A] text-white text-sm rounded-lg hover:bg-[#2A3749] transition-colors font-medium"
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
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Kelas</h1>
          <p className="text-sm text-gray-500 mt-1">Informasi lengkap kelas dan siswa</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B263A] text-white text-sm rounded-lg hover:bg-[#2A3749] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 border border-gray-100 rounded-xl p-5 bg-white mb-6">
        <StatCard title="Total Kelas" value={stats.totalKelas} subtitle="Kelas aktif" icon={GraduationCap} color="bg-blue-500" />
        <StatCard title="Total Siswa" value={stats.totalSiswa} subtitle="Seluruh tingkat" icon={Users} color="bg-green-500" />
        <StatCard title="Siswa Alergi" value={stats.totalAlergi} subtitle={`${stats.persenAlergi}% dari total`} icon={AlertCircle} color="bg-red-500" />
        <StatCard title="Kehadiran" value={`${stats.avgKehadiran}%`} subtitle="rata-rata hari ini" icon={UserCheck} color="bg-orange-500" />
      </div>

      {kelasData.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-5 bg-white mb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Grafik Siswa per Kelas</h3>
          <KelasChart data={chartData} />
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kelas atau wali kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
      </div>

      {kelasData.length === 0 ? (
        <div className="py-12 text-center">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium mb-1">Belum ada data kelas</p>
          <p className="text-xs text-gray-400 mb-4">Mulai tambahkan kelas untuk sekolah ini</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B263A] text-white text-sm rounded-lg hover:bg-[#2A3749] transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Tambah Kelas
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {paginatedData.map((kelas) => {
              const kelasKey = kelas.id || kelas._id;
              return (
                <div key={kelasKey} className="border border-gray-100 rounded-xl overflow-hidden bg-white hover:border-gray-200 transition-colors">
                  <div className="px-5 pt-5 pb-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Kelas {kelas.nama || 'Kelas'}</h3>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Laki-laki</p>
                        <p className="text-xl font-bold text-gray-900">{kelas.lakiLaki || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Perempuan</p>
                        <p className="text-xl font-bold text-gray-900">{kelas.perempuan || 0}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Total Siswa</span>
                        <span className="font-medium text-gray-900">{kelas.totalSiswa || 0}</span>
                      </div>
                      {kelas.alergiCount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-red-500 text-xs">Alergi</span>
                          <span className="text-xs font-medium text-red-600">{kelas.alergiCount} siswa</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    <button
                      onClick={async () => {
                        const kelasId = kelas.id || kelas._id;
                        setSelectedKelas(kelas);
                        try {
                          const authToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
                          if (!authToken) return;
                          const url = `${API_BASE_URL}/api/kelas/${kelasId}/absensi`;
                          const response = await fetch(url, {
                            method: "GET",
                            headers: {
                              Authorization: `Bearer ${authToken}`,
                              "Content-Type": "application/json",
                            },
                          });
                          if (response.ok) {
                            const data = await response.json();
                            let hadirCount = 0;
                            const today = new Date().toISOString().split('T')[0];
                            if (Array.isArray(data.data?.data)) {
                              const todayRecords = data.data.data.filter((record: any) => {
                                const recordDate = record.tanggal?.split('T')[0];
                                return recordDate === today;
                              });
                              if (todayRecords.length > 0) hadirCount = todayRecords[0].jumlahHadir || 0;
                            } else if (Array.isArray(data.data)) {
                              const todayRecord = data.data.find((record: any) => record.tanggal?.split('T')[0] === today);
                              hadirCount = todayRecord?.jumlahHadir || 0;
                            } else if (typeof data.data === 'object' && data.data?.jumlahHadir !== undefined) {
                              hadirCount = data.data.jumlahHadir || 0;
                            } else if (data.jumlahHadir !== undefined) {
                              hadirCount = data.jumlahHadir || 0;
                            }
                            setSelectedKelas((prev: any) => ({ ...prev, hadirHariIni: hadirCount }));
                          }
                        } catch (err) {
                          console.error("[CLICK AUTO-FETCH] Error:", err);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between py-3">
            <p className="text-xs text-gray-500">
              {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 font-medium">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
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
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1B263A] to-[#24314d] text-white px-6 py-5 flex items-center justify-between rounded-t-2xl flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold">Absensi Siswa</h3>
                <p className="text-sm text-white/80 mt-1">{selectedKelas.nama}</p>
              </div>
              <button onClick={() => {
                setShowAbsensiModal(false);
                setAbsensiSearchTerm("");
              }} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAbsensi} className="flex flex-col flex-1 overflow-hidden">
              {/* Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Absensi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={absensiForm.tanggal}
                    onChange={(e) => setAbsensiForm({ ...absensiForm, tanggal: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Search Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cari Siswa
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari nama atau NIS..."
                      value={absensiSearchTerm}
                      onChange={(e) => setAbsensiSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* List Siswa dengan Checkbox */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Pilih Siswa Hadir <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {absensiForm.siswaHadir.length} dipilih
                    </span>
                  </div>

                  <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {siswaData
                        .filter((siswa) => {
                          const siswaKelasId = String(siswa.kelasId?.id || siswa.kelasId || '');
                          const selectedKelasId = String(selectedKelas.id || '');
                          return siswaKelasId === selectedKelasId;
                        })
                        .filter((siswa) => {
                          const searchLower = absensiSearchTerm.toLowerCase();
                          return (
                            (siswa.nama || '').toLowerCase().includes(searchLower) ||
                            (siswa.nis || '').toLowerCase().includes(searchLower)
                          );
                        })
                        .sort((a, b) => (a.nama || '').localeCompare(b.nama || ''))
                        .map((siswa, idx) => {
                          const siswaId = siswa.id || siswa._id;
                          const isChecked = absensiForm.siswaHadir.includes(siswaId);
                          return (
                            <label
                              key={siswaId}
                              className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-all ${
                                idx !== 0 ? 'border-t border-gray-100' : ''
                              } ${isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAbsensiForm({
                                      ...absensiForm,
                                      siswaHadir: [...absensiForm.siswaHadir, siswaId]
                                    });
                                  } else {
                                    setAbsensiForm({
                                      ...absensiForm,
                                      siswaHadir: absensiForm.siswaHadir.filter(id => id !== siswaId)
                                    });
                                  }
                                }}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded cursor-pointer flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isChecked ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {siswa.nama}
                                </p>
                                <p className="text-xs text-gray-500">{siswa.nis}</p>
                              </div>
                              {siswa.jenisKelamin && (
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                                  siswa.jenisKelamin === 'LAKI_LAKI'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-pink-100 text-pink-700'
                                }`}>
                                  {siswa.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P'}
                                </span>
                              )}
                            </label>
                          );
                        })}

                      {siswaData.filter((siswa) => {
                        const siswaKelasId = String(siswa.kelasId?.id || siswa.kelasId || '');
                        const selectedKelasId = String(selectedKelas.id || '');
                        return siswaKelasId === selectedKelasId;
                      }).filter((siswa) => {
                        const searchLower = absensiSearchTerm.toLowerCase();
                        return (
                          (siswa.nama || '').toLowerCase().includes(searchLower) ||
                          (siswa.nis || '').toLowerCase().includes(searchLower)
                        );
                      }).length === 0 && (
                        <div className="p-6 text-center">
                          <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            {absensiSearchTerm ? 'Siswa tidak ditemukan' : 'Tidak ada siswa di kelas ini'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                    <span>
                      {siswaData.filter((siswa) => {
                        const siswaKelasId = String(siswa.kelasId?.id || siswa.kelasId || '');
                        const selectedKelasId = String(selectedKelas.id || '');
                        return siswaKelasId === selectedKelasId;
                      }).length} siswa total
                    </span>
                    <span className="font-semibold text-blue-600">
                      {absensiForm.siswaHadir.length} hadir
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer with Buttons */}
              <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAbsensiModal(false);
                    setAbsensiSearchTerm("");
                  }}
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || absensiForm.siswaHadir.length === 0}
                  className="flex-1 px-4 py-3 bg-[#1B263A] text-white rounded-xl hover:bg-[#24314d] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="w-5 h-5" />
                      Simpan Absensi ({absensiForm.siswaHadir.length})
                    </>
                  )}
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
                <div className="bg-green-50 rounded-xl p-4 border border-green-100 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <UserCheck className="w-6 h-6 text-green-600" />
                    {(loading || refreshingHadir) && <Loader2 className="w-4 h-4 text-green-600 animate-spin" />}
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {selectedKelas.hadirHariIni !== undefined && selectedKelas.hadirHariIni !== null
                      ? selectedKelas.hadirHariIni
                      : (loading ? '...' : 0)}
                  </p>
                  <p className="text-xs text-green-700">Hadir Hari Ini</p>
                  <button
                    onClick={handleRefreshHadirHariIni}
                    disabled={refreshingHadir}
                    className="absolute top-2 right-2 p-1.5 rounded hover:bg-green-100 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Refresh hadir hari ini"
                  >
                    <RotateCw className={`w-4 h-4 text-green-600 ${refreshingHadir ? 'animate-spin' : ''}`} />
                  </button>
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