'use client';

import { useState, useMemo, memo, useEffect, useCallback, useRef } from 'react';
import SekolahLayout from '@/components/layout/SekolahLayout';
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
  Trash2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE_URL = "http://72.60.79.126:3000"

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // API State
  const [kelasData, setKelasData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [sekolahId, setSekolahId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
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

  const isFetchingRef = useRef(false);

  // Initialize auth & sekolahId
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
    const storedSekolahId = localStorage.getItem("sekolahId");

    if (storedToken) setAuthToken(storedToken);
    if (storedSekolahId) setSekolahId(storedSekolahId);

    if (!storedToken || !storedSekolahId) {
      setLoading(false);
      setError("Token atau Sekolah ID tidak ditemukan");
    }
  }, []);

  // Fetch kelas data
  const fetchKelas = useCallback(async () => {
    if (!sekolahId || !authToken || isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}/api/sekolah/${sekolahId}/kelas?page=1&limit=100`;
      console.log("[FETCH KELAS] URL:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[FETCH KELAS] Response status:", response.status);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("[FETCH KELAS] Response data:", data);

      let kelasList = [];
      if (Array.isArray(data.data?.data)) {
        kelasList = data.data.data;
      } else if (Array.isArray(data.data)) {
        kelasList = data.data;
      } else if (Array.isArray(data)) {
        kelasList = data;
      }

      console.log("[FETCH KELAS] Total kelas:", kelasList.length);
      setKelasData(kelasList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data kelas");
      console.error("[FETCH KELAS] Error:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [sekolahId, authToken]);

  // Create kelas
  const handleCreateKelas = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama || !formData.tingkat) {
      alert("Nama dan Tingkat harus diisi");
      return;
    }

    try {
      setSubmitting(true);
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
      await fetchKelas();
      alert("Kelas berhasil ditambahkan!");
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error("[CREATE KELAS] Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete kelas
  const handleDeleteKelas = async (kelasId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kelas ini?")) return;

    try {
      setSubmitting(true);
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
      await fetchKelas();
      alert("Kelas berhasil dihapus!");
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error("[DELETE KELAS] Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch saat component mount
  useEffect(() => {
    if (sekolahId && authToken) {
      fetchKelas();
    }
  }, [sekolahId, authToken, fetchKelas]);

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

  // Statistics
  const stats = useMemo(() => {
    const totalKelas = kelasData.length;
    const totalSiswa = kelasData.reduce((acc, k) => acc + (k.totalSiswa || 0), 0);
    const avgKehadiran = totalSiswa > 0 ? "95" : "0";
    return { totalKelas, totalSiswa, avgKehadiran };
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
                setError(null);
                if (sekolahId && authToken) fetchKelas();
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
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
        >
          <Plus className="w-5 h-5" />
          Tambah Kelas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Kelas" value={stats.totalKelas} subtitle="Kelas aktif" icon={GraduationCap} color="bg-blue-500" />
        <StatCard title="Total Siswa" value={stats.totalSiswa} subtitle="Seluruh tingkat" icon={Users} color="bg-green-500" />
        <StatCard title="Rata-rata" value={stats.totalKelas > 0 ? Math.round(stats.totalSiswa / stats.totalKelas) : 0} subtitle="Siswa per kelas" icon={TrendingUp} color="bg-purple-500" />
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
            {paginatedData.map((kelas) => (
              <div key={kelas.id || kelas._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] p-5 text-white">
                  <h3 className="text-2xl font-bold">{kelas.nama || 'Kelas'}</h3>
                  <p className="text-sm text-white/80">{kelas.waliKelas || 'Wali Kelas: -'}</p>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-blue-600">{kelas.totalSiswa || 0}</p>
                      <p className="text-xs text-gray-600">Total Siswa</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <UserCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-600">{kelas.lakiLaki || 0}</p>
                      <p className="text-xs text-gray-600">Laki-laki</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Perempuan</span>
                      <span className="font-semibold text-gray-900">{kelas.perempuan || 0} siswa</span>
                    </div>
                    {kelas.alergiCount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-600">Alergi</span>
                        <span className="font-semibold text-red-900">{kelas.alergiCount} siswa</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedKelas(kelas)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))}
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tingkat</label>
                  <select
                    value={formData.tingkat}
                    onChange={(e) => setFormData({ ...formData, tingkat: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={10}>X</option>
                    <option value={11}>XI</option>
                    <option value={12}>XII</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jurusan</label>
                  <select
                    value={formData.jurusan}
                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="IPA">IPA</option>
                    <option value="IPS">IPS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Wali Kelas</label>
                <input
                  type="text"
                  value={formData.waliKelas}
                  onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama Wali Kelas"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Siswa</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalSiswa}
                  onChange={(e) => setFormData({ ...formData, totalSiswa: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: 35"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Laki-laki</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lakiLaki}
                    onChange={(e) => setFormData({ ...formData, lakiLaki: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: 17"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Perempuan</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.perempuan}
                    onChange={(e) => setFormData({ ...formData, perempuan: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: 18"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Siswa dengan Alergi</label>
                <input
                  type="number"
                  min="0"
                  value={formData.alergiCount}
                  onChange={(e) => setFormData({ ...formData, alergiCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: 5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Daftar Alergi</label>
                <textarea
                  value={formData.alergiList}
                  onChange={(e) => setFormData({ ...formData, alergiList: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Udang, Telur, Kacang"
                  rows={2}
                />
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
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Tambah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedKelas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Detail Kelas {selectedKelas.nama}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedKelas.waliKelas || 'Wali Kelas: -'}</p>
              </div>
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
                  <UserCheck className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-900">{selectedKelas.hadirHariIni || 0}</p>
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
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
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