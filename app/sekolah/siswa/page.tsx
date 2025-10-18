'use client';

import { useState, useMemo, memo, useEffect, useCallback, useRef } from 'react';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { 
  Search, Eye, AlertTriangle, TrendingUp, User, Calendar, Ruler, Weight, X,
  ChevronLeft, ChevronRight, Phone, MapPin, AlertCircle, Plus, Loader2, Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE_URL = "http://72.60.79.126:3000"

const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
    <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-32"></div>
  </div>
);

const SkeletonTableRow = () => (
  <tr className="border-b border-gray-100">
    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></td>
    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div></td>
    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></td>
    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div></td>
    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div></td>
    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></td>
    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></td>
    <td className="py-4 px-4"><div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div></td>
    <td className="py-4 px-4"><div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div></td>
  </tr>
);

const GrowthChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="bulan" stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <Tooltip />
      <Line type="monotone" dataKey="tinggi" stroke="#1B263A" strokeWidth={2} dot={{ fill: '#1B263A', r: 3 }} name="Tinggi (cm)" />
      <Line type="monotone" dataKey="berat" stroke="#D0B064" strokeWidth={2} dot={{ fill: '#D0B064', r: 3 }} name="Berat (kg)" />
    </LineChart>
  </ResponsiveContainer>
));

GrowthChart.displayName = 'GrowthChart';

const DataSiswa = () => {
  // State
  const [siswaData, setSiswaData] = useState<any[]>([]);
  const [kelasData, setKelasData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [sekolahId, setSekolahId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFetchingRef = useRef(false);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAlergiModal, setShowAlergiModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: "", nis: "", kelasId: "", jenisKelamin: "LAKI_LAKI", umur: 7, tinggiBadan: 0, beratBadan: 0, alergi: ""
  });
  const [alergiForm, setAlergiForm] = useState('');
  const [loadingAlergi, setLoadingAlergi] = useState(false);

  // Init
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

  // Fetch Siswa
  const fetchSiswa = useCallback(async () => {
    if (!sekolahId || !authToken || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/siswa?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      let siswaList = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : data;

      const normalizedList = siswaList.map((siswa: any) => {
        let kelasNama = '';
        if (typeof siswa.kelas === 'string') {
          kelasNama = siswa.kelas;
        } else if (siswa.kelas?.nama) {
          kelasNama = String(siswa.kelas.nama);
        } else if (siswa.kelasId?.nama) {
          kelasNama = String(siswa.kelasId.nama);
        }

        let alergiText = 'Tidak ada';
        if (siswa.alergi) {
          if (Array.isArray(siswa.alergi)) {
            alergiText = siswa.alergi.map((a: any) => String(a.namaAlergi || a.nama || '')).filter((a: string) => a.trim()).join(', ') || 'Tidak ada';
          } else if (typeof siswa.alergi === 'object') {
            alergiText = String(siswa.alergi.namaAlergi || siswa.alergi.nama || '');
          } else {
            alergiText = String(siswa.alergi);
          }
        }

        return {
          ...siswa,
          id: String(siswa.id || siswa._id || ''),
          nama: String(siswa.nama || ''),
          nis: String(siswa.nis || ''),
          kelas: kelasNama,
          kelasId: String(siswa.kelasId?.id || siswa.kelas?.id || ''),
          jenisKelamin: String(siswa.jenisKelamin || 'LAKI_LAKI'),
          umur: Number(siswa.umur || 0),
          tinggiBadan: Number(siswa.tinggiBadan || 0),
          beratBadan: Number(siswa.beratBadan || 0),
          imt: Number(siswa.imt || 0),
          statusGizi: String(siswa.statusGizi || 'NORMAL'),
          statusStunting: String(siswa.statusStunting || 'NORMAL'),
          alergi: alergiText,
          namaOrtu: String(siswa.namaOrtu || ''),
          kontakOrtu: String(siswa.kontakOrtu || ''),
          alamat: String(siswa.alamat || ''),
          riwayatPengukuran: Array.isArray(siswa.riwayatPengukuran) ? siswa.riwayatPengukuran : []
        };
      });

      setSiswaData(normalizedList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data siswa");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [sekolahId, authToken]);

  // Fetch Kelas
  const fetchKelas = useCallback(async () => {
    if (!sekolahId || !authToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/kelas?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      let kelasList = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : data;
      setKelasData(kelasList);
    } catch (err) {
      console.error("[FETCH KELAS] Error:", err);
    }
  }, [sekolahId, authToken]);

  // Fetch Alergi
  const fetchAlergiSiswa = useCallback(async (siswaId: string) => {
    try {
      setLoadingAlergi(true);
      const response = await fetch(`${API_BASE_URL}/api/siswa/${siswaId}/alergi`, {
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
      });

      if (!response.ok) {
        setAlergiForm('');
        return;
      }

      const data = await response.json();
      let alergiText = '';

      if (Array.isArray(data.data)) {
        alergiText = data.data.map((a: any) => String(a.namaAlergi || a.nama || '')).filter((a: string) => a.trim()).join(', ');
      } else if (data.data?.namaAlergi) {
        alergiText = String(data.data.namaAlergi);
      }

      setAlergiForm(alergiText);
    } catch (err) {
      console.error("[FETCH ALERGI] Error:", err);
      setAlergiForm('');
    } finally {
      setLoadingAlergi(false);
    }
  }, [authToken]);

  // Create Siswa
  const handleCreateSiswa = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama || !formData.nis || !formData.kelasId) {
      alert("Nama, NIS, dan Kelas harus diisi");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nama: formData.nama,
        nis: formData.nis,
        kelasId: formData.kelasId,
        jenisKelamin: formData.jenisKelamin,
        umur: parseInt(formData.umur.toString()),
        tinggiBadan: parseFloat(formData.tinggiBadan.toString()),
        beratBadan: parseFloat(formData.beratBadan.toString()),
      };

      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/siswa`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      if (!response.ok) throw new Error(`API Error ${response.status}: ${responseText}`);

      const data = JSON.parse(responseText);
      const siswaId = data.data?.id;

      if (formData.alergi.trim() && siswaId) {
        try {
          await fetch(`${API_BASE_URL}/api/siswa/${siswaId}/alergi`, {
            method: "POST",
            headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ namaAlergi: formData.alergi.trim() }),
          });
        } catch (err) {
          console.error("[CREATE ALERGI] Error:", err);
        }
      }

      setFormData({ nama: "", nis: "", kelasId: "", jenisKelamin: "LAKI_LAKI", umur: 7, tinggiBadan: 0, beratBadan: 0, alergi: "" });
      setShowAddModal(false);
      await fetchSiswa();
      alert("Siswa berhasil ditambahkan!");
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Save Alergi
  const handleSaveAlergi = async (siswaId: string) => {
    if (!alergiForm.trim()) {
      alert('Alergi tidak boleh kosong');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/api/siswa/${siswaId}/alergi`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ namaAlergi: alergiForm.trim() }),
      });

      const responseText = await response.text();
      if (!response.ok) throw new Error(`API Error ${response.status}: ${responseText}`);

      if (selectedSiswa) {
        setSelectedSiswa({ ...selectedSiswa, alergi: alergiForm });
      }

      alert('Alergi berhasil disimpan!');
      setShowAlergiModal(false);
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Alergi
  const handleDeleteAlergi = async (alergiId: string) => {
    if (!confirm('Yakin ingin menghapus alergi ini?')) return;

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/api/alergi/${alergiId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);

      setAlergiForm('');
      if (selectedSiswa) {
        setSelectedSiswa({ ...selectedSiswa, alergi: 'Tidak ada' });
      }

      alert('Alergi berhasil dihapus!');
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (sekolahId && authToken) {
      fetchSiswa();
      fetchKelas();
    }
  }, [sekolahId, authToken, fetchSiswa, fetchKelas]);

  // Computed
  const filteredData = useMemo(() => {
    return siswaData.filter(siswa => {
      const matchSearch = siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) || siswa.nis.includes(searchTerm);
      const matchKelas = filterKelas === 'semua' || siswa.kelas === filterKelas;
      const matchStatus = filterStatus === 'semua' || siswa.statusGizi === filterStatus;
      return matchSearch && matchKelas && matchStatus;
    });
  }, [siswaData, searchTerm, filterKelas, filterStatus]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => {
    const total = siswaData.length;
    const normal = siswaData.filter(s => s.statusGizi === 'NORMAL').length;
    const giziKurang = siswaData.filter(s => s.statusGizi === 'GIZI_KURANG').length;
    const giziBuruk = siswaData.filter(s => s.statusGizi === 'GIZI_BURUK').length;
    const stunted = siswaData.filter(s => s.statusStunting && s.statusStunting !== 'NORMAL').length;
    return { total, normal, giziKurang, giziBuruk, stunted };
  }, [siswaData]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'NORMAL': 'bg-green-100 text-green-700 border-green-200',
      'GIZI_KURANG': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'GIZI_BURUK': 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStuntingColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'NORMAL': 'bg-green-100 text-green-700',
      'STUNTED': 'bg-yellow-100 text-yellow-700',
      'SEVERELY_STUNTED': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const displayStatusText = (status: string) => {
    const map: { [key: string]: string } = {
      'NORMAL': 'Normal', 'GIZI_KURANG': 'Gizi Kurang', 'GIZI_BURUK': 'Gizi Buruk',
      'STUNTED': 'Stunted', 'SEVERELY_STUNTED': 'Severely Stunted'
    };
    return map[status] || status;
  };

  const StatCard = ({ title, value, subtitle, color }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold mb-1 ${color}`}>{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );

  if (loading && siswaData.length === 0) {
    return (
      <SekolahLayout currentPage="siswa">
        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900 mb-2">Data Siswa</h1><p className="text-gray-600">Monitoring Gizi & Pencegahan Stunting</p></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">NIS</th><th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Nama Siswa</th><th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Kelas</th><th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">L/P</th><th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Umur</th><th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">TB</th><th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">BB</th><th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status Gizi</th><th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Aksi</th></tr></thead><tbody>{[...Array(10)].map((_, i) => <SkeletonTableRow key={i} />)}</tbody></table></div></div>
      </SekolahLayout>
    );
  }

  if (error && siswaData.length === 0) {
    return <SekolahLayout currentPage="siswa"><div className="flex items-center justify-center h-96"><div className="text-center max-w-md"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><p className="text-red-600 mb-4">{error}</p><button onClick={() => { setError(null); if (sekolahId && authToken) fetchSiswa(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Coba Lagi</button></div></div></SekolahLayout>;
  }

  return (
    <SekolahLayout currentPage="siswa">
      <div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900 mb-2">Data Siswa</h1><p className="text-gray-600">Monitoring Gizi & Pencegahan Stunting</p></div><button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"><Plus className="w-5 h-5" />Tambah Siswa</button></div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Siswa" value={stats.total} subtitle="Siswa terdaftar" color="text-gray-900" />
        <StatCard title="Gizi Normal" value={stats.normal} subtitle={`${stats.total > 0 ? Math.round((stats.normal / stats.total) * 100) : 0}% dari total`} color="text-green-600" />
        <StatCard title="Gizi Kurang" value={stats.giziKurang} subtitle="Perlu perhatian" color="text-yellow-600" />
        <StatCard title="Gizi Buruk" value={stats.giziBuruk} subtitle="Prioritas tinggi" color="text-red-600" />
        <StatCard title="Berisiko Stunting" value={stats.stunted} subtitle="Memerlukan intervensi" color="text-orange-600" />
      </div>

      {stats.stunted > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg"><div className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" /><div><p className="font-semibold text-red-900">Perhatian!</p><p className="text-sm text-red-700">Terdapat {stats.stunted} siswa berisiko stunting yang memerlukan perhatian khusus.</p></div></div></div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Cari nama atau NIS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" /></div></div>
          <div><select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"><option value="semua">Semua Kelas</option>{kelasData.map((kelas) => (<option key={kelas.id} value={String(kelas.nama || '')}>{String(kelas.nama || '')}</option>))}</select></div>
          <div><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"><option value="semua">Semua Status</option><option value="NORMAL">Normal</option><option value="GIZI_KURANG">Gizi Kurang</option><option value="GIZI_BURUK">Gizi Buruk</option></select></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">NIS</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Nama</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Kelas</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">L/P</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Umur</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">TB</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">BB</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((siswa) => (
                <tr key={siswa.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-sm text-gray-900 font-medium">{siswa.nis}</td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">{siswa.nama}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.kelas}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P'}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.umur} th</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.tinggiBadan} cm</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.beratBadan} kg</td>
                  <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(siswa.statusGizi)}`}>{siswa.statusGizi}</span></td>
                  <td className="py-4 px-4"><button onClick={() => { setSelectedSiswa(siswa); setShowDetailModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"><Eye className="w-4 h-4" />Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} siswa
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">Hal {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Siswa Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold">Tambah Siswa</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Siswa</label>
                <input type="text" required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nama lengkap" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">NIS</label>
                <input type="text" required value={formData.nis} onChange={(e) => setFormData({ ...formData, nis: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="2024001" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kelas</label>
                <select required value={formData.kelasId} onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Pilih Kelas</option>
                  {kelasData.map((kelas) => (<option key={kelas.id} value={String(kelas.id || '')}>{String(kelas.nama || '')}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Kelamin</label>
                  <select value={formData.jenisKelamin} onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Umur</label>
                  <input type="number" value={formData.umur} onChange={(e) => setFormData({ ...formData, umur: parseInt(e.target.value) || 7 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" min="5" max="18" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tinggi Badan (cm)</label>
                  <input type="number" step="0.1" value={formData.tinggiBadan} onChange={(e) => setFormData({ ...formData, tinggiBadan: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="120.5" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Berat Badan (kg)</label>
                  <input type="number" step="0.1" value={formData.beratBadan} onChange={(e) => setFormData({ ...formData, beratBadan: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="22.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alergi (Opsional)</label>
                <input type="text" value={formData.alergi} onChange={(e) => setFormData({ ...formData, alergi: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Contoh: Kacang, Susu, Seafood" />
                <p className="text-xs text-gray-500 mt-1">Pisahkan dengan koma jika lebih dari satu</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold">Batal</button>
                <button onClick={handleCreateSiswa} disabled={submitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Tambah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSiswa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900">Detail Siswa</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-6 bg-gradient-to-br from-[#1B263A] to-[#2A3749] rounded-xl p-6 text-white">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl flex-shrink-0">{selectedSiswa.jenisKelamin === 'LAKI_LAKI' ? '👨' : '👩'}</div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold mb-2">{selectedSiswa.nama}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>NIS: {selectedSiswa.nis}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{selectedSiswa.umur} tahun</span></div>
                    <div className="flex items-center gap-2"><span className="font-semibold">Kelas:</span><span>{selectedSiswa.kelas}</span></div>
                    <div className="flex items-center gap-2"><span className="font-semibold">Jenis Kelamin:</span><span>{selectedSiswa.jenisKelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2"><Ruler className="w-5 h-5 text-blue-600" /><p className="text-sm font-medium text-blue-900">Tinggi Badan</p></div>
                  <p className="text-2xl font-bold text-blue-900">{selectedSiswa.tinggiBadan} cm</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2"><Weight className="w-5 h-5 text-green-600" /><p className="text-sm font-medium text-green-900">Berat Badan</p></div>
                  <p className="text-2xl font-bold text-green-900">{selectedSiswa.beratBadan} kg</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-purple-600" /><p className="text-sm font-medium text-purple-900">IMT</p></div>
                  <p className="text-2xl font-bold text-purple-900">{selectedSiswa.imt?.toFixed(1) || 0}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5 text-orange-600" /><p className="text-sm font-medium text-orange-900">Status Gizi</p></div>
                  <p className="text-sm font-bold text-orange-900">{displayStatusText(selectedSiswa.statusGizi)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">Status Gizi</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(selectedSiswa.statusGizi)}`}>{displayStatusText(selectedSiswa.statusGizi)}</span>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">Status Stunting</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStuntingColor(selectedSiswa.statusStunting)}`}>{displayStatusText(selectedSiswa.statusStunting)}</span>
                </div>
              </div>

              {selectedSiswa.riwayatPengukuran && selectedSiswa.riwayatPengukuran.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Grafik Pertumbuhan</h4>
                  <GrowthChart data={selectedSiswa.riwayatPengukuran} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Informasi Orang Tua</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Nama Orang Tua</p>
                        <p className="font-medium text-gray-900">{selectedSiswa.namaOrtu || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">No. Telepon</p>
                        <p className="font-medium text-gray-900">{selectedSiswa.kontakOrtu || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Alamat</p>
                        <p className="font-medium text-gray-900">{selectedSiswa.alamat || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kesehatan</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Alergi</p>
                        <p className="font-medium text-gray-900">{selectedSiswa.alergi}</p>
                      </div>
                    </div>
                    <button onClick={() => { setAlergiForm(selectedSiswa.alergi === 'Tidak ada' ? '' : selectedSiswa.alergi); setShowDetailModal(false); setShowAlergiModal(true); }} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm mt-2">Edit Alergi</button>
                    {selectedSiswa.statusGizi !== 'NORMAL' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-yellow-900 mb-1">Catatan Penting</p>
                        <p className="text-sm text-yellow-700">Siswa memerlukan perhatian khusus dalam program gizi. Pastikan mendapatkan porsi yang sesuai dan monitor perkembangan secara rutin.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alergi Modal */}
      {showAlergiModal && selectedSiswa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold">Informasi Alergi - {selectedSiswa.nama}</h3>
              <button onClick={() => { setShowAlergiModal(false); setShowDetailModal(true); }} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alergi Siswa</label>
                {loadingAlergi ? (
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                ) : (
                  <textarea value={alergiForm} onChange={(e) => setAlergiForm(e.target.value)} placeholder="Contoh: Alergi kacang, susu, seafood, dll" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" rows={4} />
                )}
                <p className="text-xs text-gray-500 mt-1">Tuliskan jenis alergi yang dimiliki siswa. Gunakan pemisah koma jika lebih dari satu.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowAlergiModal(false); setShowDetailModal(true); }} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold">Batal</button>
                <button onClick={() => handleSaveAlergi(selectedSiswa.id)} disabled={submitting || loadingAlergi} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '💾'}
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SekolahLayout>
  );
};

export default DataSiswa;