'use client';

import { useState, useMemo, memo } from 'react';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { 
  Search,
  Download,
  Eye,
  AlertTriangle,
  TrendingUp,
  User,
  Calendar,
  Ruler,
  Weight,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Growth Chart Component
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Data Siswa
  const siswaData = useMemo(() => [
    {
      id: 1, nis: '2024001', nama: 'Ahmad Fauzi Rahman', kelas: 'X-1', jenisKelamin: 'L',
      tanggalLahir: '2008-05-15', umur: 16, tinggiBadan: 158, beratBadan: 45, imt: 18.0,
      statusGizi: 'Normal', statusStunting: 'Normal', alamat: 'Jl. Merdeka No. 12, Karawang',
      namaOrtu: 'Budi Rahman', kontakOrtu: '081234567890', alergi: 'Tidak ada', foto: '👨',
      riwayatPengukuran: [
        { bulan: 'Jan', tinggi: 155, berat: 43 },
        { bulan: 'Feb', tinggi: 156, berat: 43.5 },
        { bulan: 'Mar', tinggi: 157, berat: 44 },
        { bulan: 'Apr', tinggi: 157.5, berat: 44.5 },
        { bulan: 'Mei', tinggi: 158, berat: 45 }
      ],
      absensiMakan: 95
    },
    {
      id: 2, nis: '2024002', nama: 'Siti Nurhaliza', kelas: 'X-1', jenisKelamin: 'P',
      tanggalLahir: '2008-08-20', umur: 16, tinggiBadan: 152, beratBadan: 42, imt: 18.2,
      statusGizi: 'Normal', statusStunting: 'Normal', alamat: 'Jl. Sudirman No. 45, Karawang',
      namaOrtu: 'Hendra Wijaya', kontakOrtu: '081298765432', alergi: 'Kacang', foto: '👩',
      riwayatPengukuran: [
        { bulan: 'Jan', tinggi: 150, berat: 40 },
        { bulan: 'Feb', tinggi: 150.5, berat: 40.5 },
        { bulan: 'Mar', tinggi: 151, berat: 41 },
        { bulan: 'Apr', tinggi: 151.5, berat: 41.5 },
        { bulan: 'Mei', tinggi: 152, berat: 42 }
      ],
      absensiMakan: 98
    },
    {
      id: 3, nis: '2024003', nama: 'Budi Santoso', kelas: 'X-2', jenisKelamin: 'L',
      tanggalLahir: '2008-03-10', umur: 16, tinggiBadan: 148, beratBadan: 38, imt: 17.3,
      statusGizi: 'Gizi Kurang', statusStunting: 'Stunted', alamat: 'Jl. Pahlawan No. 78, Karawang',
      namaOrtu: 'Agus Santoso', kontakOrtu: '081345678901', alergi: 'Tidak ada', foto: '👨',
      riwayatPengukuran: [
        { bulan: 'Jan', tinggi: 146, berat: 36 },
        { bulan: 'Feb', tinggi: 146.5, berat: 36.5 },
        { bulan: 'Mar', tinggi: 147, berat: 37 },
        { bulan: 'Apr', tinggi: 147.5, berat: 37.5 },
        { bulan: 'Mei', tinggi: 148, berat: 38 }
      ],
      absensiMakan: 88
    },
    {
      id: 4, nis: '2024004', nama: 'Dewi Lestari', kelas: 'XI-1', jenisKelamin: 'P',
      tanggalLahir: '2007-11-25', umur: 17, tinggiBadan: 160, beratBadan: 52, imt: 20.3,
      statusGizi: 'Normal', statusStunting: 'Normal', alamat: 'Jl. Diponegoro No. 23, Karawang',
      namaOrtu: 'Iwan Setiawan', kontakOrtu: '081456789012', alergi: 'Seafood', foto: '👩',
      riwayatPengukuran: [
        { bulan: 'Jan', tinggi: 159, berat: 50 },
        { bulan: 'Feb', tinggi: 159.5, berat: 50.5 },
        { bulan: 'Mar', tinggi: 159.5, berat: 51 },
        { bulan: 'Apr', tinggi: 160, berat: 51.5 },
        { bulan: 'Mei', tinggi: 160, berat: 52 }
      ],
      absensiMakan: 100
    },
    {
      id: 5, nis: '2024005', nama: 'Rizky Pratama', kelas: 'XI-2', jenisKelamin: 'L',
      tanggalLahir: '2007-07-08', umur: 17, tinggiBadan: 165, beratBadan: 58, imt: 21.3,
      statusGizi: 'Normal', statusStunting: 'Normal', alamat: 'Jl. Gatot Subroto No. 56, Karawang',
      namaOrtu: 'Bambang Pratama', kontakOrtu: '081567890123', alergi: 'Tidak ada', foto: '👨',
      riwayatPengukuran: [
        { bulan: 'Jan', tinggi: 163, berat: 56 },
        { bulan: 'Feb', tinggi: 163.5, berat: 56.5 },
        { bulan: 'Mar', tinggi: 164, berat: 57 },
        { bulan: 'Apr', tinggi: 164.5, berat: 57.5 },
        { bulan: 'Mei', tinggi: 165, berat: 58 }
      ],
      absensiMakan: 92
    },
    {
      id: 6, nis: '2024006', nama: 'Maya Kartika', kelas: 'XII-1', jenisKelamin: 'P',
      tanggalLahir: '2006-12-30', umur: 18, tinggiBadan: 145, beratBadan: 35, imt: 16.6,
      statusGizi: 'Gizi Buruk', statusStunting: 'Severely Stunted', alamat: 'Jl. Ahmad Yani No. 89, Karawang',
      namaOrtu: 'Susilo Kartika', kontakOrtu: '081678901234', alergi: 'Susu', foto: '👩',
      riwayatPengukuran: [
        { bulan: 'Jan', tinggi: 144, berat: 34 },
        { bulan: 'Feb', tinggi: 144.5, berat: 34.2 },
        { bulan: 'Mar', tinggi: 144.5, berat: 34.5 },
        { bulan: 'Apr', tinggi: 145, berat: 34.8 },
        { bulan: 'Mei', tinggi: 145, berat: 35 }
      ],
      absensiMakan: 85
    }
  ], []);

  // Filter & Search
  const filteredData = useMemo(() => {
    return siswaData.filter(siswa => {
      const matchSearch = siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) || siswa.nis.includes(searchTerm);
      const matchKelas = filterKelas === 'semua' || siswa.kelas === filterKelas;
      const matchStatus = filterStatus === 'semua' || siswa.statusGizi === filterStatus;
      return matchSearch && matchKelas && matchStatus;
    });
  }, [siswaData, searchTerm, filterKelas, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    const total = siswaData.length;
    const normal = siswaData.filter(s => s.statusGizi === 'Normal').length;
    const giziKurang = siswaData.filter(s => s.statusGizi === 'Gizi Kurang').length;
    const giziBuruk = siswaData.filter(s => s.statusGizi === 'Gizi Buruk').length;
    const stunted = siswaData.filter(s => s.statusStunting !== 'Normal').length;
    return { total, normal, giziKurang, giziBuruk, stunted };
  }, [siswaData]);

  // Status Colors
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Normal': return 'bg-green-100 text-green-700 border-green-200';
      case 'Gizi Kurang': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Gizi Buruk': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStuntingColor = (status: string) => {
    switch(status) {
      case 'Normal': return 'bg-green-100 text-green-700';
      case 'Stunted': return 'bg-yellow-100 text-yellow-700';
      case 'Severely Stunted': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Stat Card Component
  const StatCard = ({ title, value, subtitle, color }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold mb-1 ${color}`}>{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );

  return (
    <SekolahLayout currentPage="siswa">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Siswa</h1>
        <p className="text-gray-600">Monitoring Gizi & Pencegahan Stunting</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard 
          title="Total Siswa" 
          value={stats.total} 
          subtitle="Siswa terdaftar" 
          color="text-gray-900" 
        />
        <StatCard 
          title="Gizi Normal" 
          value={stats.normal} 
          subtitle={`${Math.round((stats.normal / stats.total) * 100)}% dari total`} 
          color="text-green-600" 
        />
        <StatCard 
          title="Gizi Kurang" 
          value={stats.giziKurang} 
          subtitle="Perlu perhatian" 
          color="text-yellow-600" 
        />
        <StatCard 
          title="Gizi Buruk" 
          value={stats.giziBuruk} 
          subtitle="Prioritas tinggi" 
          color="text-red-600" 
        />
        <StatCard 
          title="Berisiko Stunting" 
          value={stats.stunted} 
          subtitle="Memerlukan intervensi" 
          color="text-orange-600" 
        />
      </div>

      {/* Alert for Stunting Risk */}
      {stats.stunted > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Perhatian!</p>
              <p className="text-sm text-red-700">
                Terdapat {stats.stunted} siswa berisiko stunting yang memerlukan perhatian khusus.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="semua">Semua Kelas</option>
              <option value="X-1">X-1</option>
              <option value="X-2">X-2</option>
              <option value="XI-1">XI-1</option>
              <option value="XI-2">XI-2</option>
              <option value="XII-1">XII-1</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="semua">Semua Status</option>
              <option value="Normal">Normal</option>
              <option value="Gizi Kurang">Gizi Kurang</option>
              <option value="Gizi Buruk">Gizi Buruk</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">NIS</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Nama Siswa</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Kelas</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">L/P</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Umur</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">TB</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">BB</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">IMT</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status Gizi</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Stunting</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((siswa) => (
                <tr key={siswa.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-sm text-gray-900 font-medium">{siswa.nis}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                        {siswa.foto}
                      </div>
                      <span className="font-medium text-gray-900">{siswa.nama}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.kelas}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.jenisKelamin}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.umur} th</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.tinggiBadan} cm</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.beratBadan} kg</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{siswa.imt}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(siswa.statusGizi)}`}>
                      {siswa.statusGizi}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStuntingColor(siswa.statusStunting)}`}>
                      {siswa.statusStunting}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => setSelectedSiswa(siswa)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} siswa
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
      </div>

      {/* Modal Detail */}
      {selectedSiswa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900">Detail Siswa</h3>
              <button 
                onClick={() => setSelectedSiswa(null)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="flex items-start gap-6 bg-gradient-to-br from-[#1B263A] to-[#2A3749] rounded-xl p-6 text-white">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl flex-shrink-0">
                  {selectedSiswa.foto}
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold mb-2">{selectedSiswa.nama}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>NIS: {selectedSiswa.nis}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedSiswa.umur} tahun ({selectedSiswa.tanggalLahir})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Kelas:</span>
                      <span>{selectedSiswa.kelas}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Jenis Kelamin:</span>
                      <span>{selectedSiswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Tinggi Badan</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{selectedSiswa.tinggiBadan} cm</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Weight className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Berat Badan</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{selectedSiswa.beratBadan} kg</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <p className="text-sm font-medium text-purple-900">IMT</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{selectedSiswa.imt}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <p className="text-sm font-medium text-orange-900">Absensi Makan</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{selectedSiswa.absensiMakan}%</p>
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">Status Gizi</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(selectedSiswa.statusGizi)}`}>
                    {selectedSiswa.statusGizi}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">Status Stunting</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStuntingColor(selectedSiswa.statusStunting)}`}>
                    {selectedSiswa.statusStunting}
                  </span>
                </div>
              </div>

              {/* Growth Chart */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Grafik Pertumbuhan (5 Bulan Terakhir)</h4>
                <GrowthChart data={selectedSiswa.riwayatPengukuran} />
              </div>

              {/* Contact & Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Informasi Orang Tua</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Nama Orang Tua</p>
                        <p className="font-medium text-gray-900">{selectedSiswa.namaOrtu}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">No. Telepon</p>
                        <p className="font-medium text-gray-900">{selectedSiswa.kontakOrtu}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Alamat</p>
                        <p className="font-medium text-gray-900">{selectedSiswa.alamat}</p>
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
                    {selectedSiswa.statusGizi !== 'Normal' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-yellow-900 mb-1">Catatan Penting</p>
                        <p className="text-sm text-yellow-700">
                          Siswa memerlukan perhatian khusus dalam program gizi. Pastikan mendapatkan porsi yang sesuai dan monitor perkembangan secara rutin.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SekolahLayout>
  );
};

export default DataSiswa;