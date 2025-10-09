// app/sekolah/kelas/page.tsx
'use client';

import { useState, useMemo, memo } from 'react';
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
  BookOpen,
  Calendar,
  Award,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const KelasChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="kelas" stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <Tooltip />
      <Legend />
      <Bar dataKey="siswa" fill="#3b82f6" name="Total Siswa" radius={[8, 8, 0, 0]} />
      <Bar dataKey="hadir" fill="#22c55e" name="Hadir Hari Ini" radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
));

KelasChart.displayName = 'KelasChart';

const DataKelas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Dummy Data Kelas
  const kelasData = useMemo(() => [
    {
      id: 1,
      nama: 'X-1',
      tingkat: 'X',
      jurusan: 'IPA',
      waliKelas: 'Ibu Siti Aminah, S.Pd',
      totalSiswa: 36,
      lakiLaki: 18,
      perempuan: 18,
      hadirHariIni: 34,
      sudahMakan: 32,
      rataKehadiran: 94.4,
      rataGizi: 88.5,
      ruangan: 'R-101',
      jadwalMakan: '11:30 - 12:00'
    },
    {
      id: 2,
      nama: 'X-2',
      tingkat: 'X',
      jurusan: 'IPA',
      waliKelas: 'Bapak Ahmad Fauzi, S.Pd',
      totalSiswa: 35,
      lakiLaki: 17,
      perempuan: 18,
      hadirHariIni: 33,
      sudahMakan: 31,
      rataKehadiran: 92.8,
      rataGizi: 86.2,
      ruangan: 'R-102',
      jadwalMakan: '11:30 - 12:00'
    },
    {
      id: 3,
      nama: 'X-3',
      tingkat: 'X',
      jurusan: 'IPS',
      waliKelas: 'Ibu Dewi Lestari, S.Pd',
      totalSiswa: 34,
      lakiLaki: 16,
      perempuan: 18,
      hadirHariIni: 32,
      sudahMakan: 30,
      rataKehadiran: 91.2,
      rataGizi: 85.8,
      ruangan: 'R-103',
      jadwalMakan: '12:00 - 12:30'
    },
    {
      id: 4,
      nama: 'XI-1',
      tingkat: 'XI',
      jurusan: 'IPA',
      waliKelas: 'Bapak Rizky Pratama, S.Pd',
      totalSiswa: 34,
      lakiLaki: 16,
      perempuan: 18,
      hadirHariIni: 32,
      sudahMakan: 30,
      rataKehadiran: 93.5,
      rataGizi: 89.2,
      ruangan: 'R-201',
      jadwalMakan: '12:00 - 12:30'
    },
    {
      id: 5,
      nama: 'XI-2',
      tingkat: 'XI',
      jurusan: 'IPA',
      waliKelas: 'Ibu Maya Kartika, S.Pd',
      totalSiswa: 36,
      lakiLaki: 18,
      perempuan: 18,
      hadirHariIni: 35,
      sudahMakan: 34,
      rataKehadiran: 95.8,
      rataGizi: 90.5,
      ruangan: 'R-202',
      jadwalMakan: '12:00 - 12:30'
    },
    {
      id: 6,
      nama: 'XI-3',
      tingkat: 'XI',
      jurusan: 'IPS',
      waliKelas: 'Bapak Hendra Wijaya, S.Pd',
      totalSiswa: 33,
      lakiLaki: 15,
      perempuan: 18,
      hadirHariIni: 31,
      sudahMakan: 29,
      rataKehadiran: 90.5,
      rataGizi: 84.5,
      ruangan: 'R-203',
      jadwalMakan: '12:30 - 13:00'
    },
    {
      id: 7,
      nama: 'XII-1',
      tingkat: 'XII',
      jurusan: 'IPA',
      waliKelas: 'Ibu Nur Haliza, S.Pd',
      totalSiswa: 33,
      lakiLaki: 16,
      perempuan: 17,
      hadirHariIni: 31,
      sudahMakan: 29,
      rataKehadiran: 92.2,
      rataGizi: 87.8,
      ruangan: 'R-301',
      jadwalMakan: '12:30 - 13:00'
    },
    {
      id: 8,
      nama: 'XII-2',
      tingkat: 'XII',
      jurusan: 'IPA',
      waliKelas: 'Bapak Agus Santoso, S.Pd',
      totalSiswa: 32,
      lakiLaki: 15,
      perempuan: 17,
      hadirHariIni: 30,
      sudahMakan: 28,
      rataKehadiran: 91.8,
      rataGizi: 86.5,
      ruangan: 'R-302',
      jadwalMakan: '12:30 - 13:00'
    },
    {
      id: 9,
      nama: 'XII-3',
      tingkat: 'XII',
      jurusan: 'IPS',
      waliKelas: 'Ibu Fatimah, S.Pd',
      totalSiswa: 31,
      lakiLaki: 14,
      perempuan: 17,
      hadirHariIni: 29,
      sudahMakan: 27,
      rataKehadiran: 89.5,
      rataGizi: 83.2,
      ruangan: 'R-303',
      jadwalMakan: '13:00 - 13:30'
    }
  ], []);

  // Filter data
  const filteredData = useMemo(() => {
    return kelasData.filter(kelas => 
      kelas.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kelas.waliKelas.toLowerCase().includes(searchTerm.toLowerCase())
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
    const totalSiswa = kelasData.reduce((acc, k) => acc + k.totalSiswa, 0);
    const totalHadir = kelasData.reduce((acc, k) => acc + k.hadirHariIni, 0);
    const avgKehadiran = (totalHadir / totalSiswa * 100).toFixed(1);
    return { totalKelas, totalSiswa, totalHadir, avgKehadiran };
  }, [kelasData]);

  // Chart data
  const chartData = useMemo(() => {
    return kelasData.map(k => ({
      kelas: k.nama,
      siswa: k.totalSiswa,
      hadir: k.hadirHariIni
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

  return (
    <SekolahLayout currentPage="kelas">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Kelas</h1>
        <p className="text-gray-600">Informasi lengkap kelas dan siswa</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Kelas" 
          value={stats.totalKelas} 
          subtitle="Kelas aktif" 
          icon={GraduationCap} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Total Siswa" 
          value={stats.totalSiswa} 
          subtitle="Seluruh tingkat" 
          icon={Users} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Hadir Hari Ini" 
          value={stats.totalHadir} 
          subtitle={`${stats.avgKehadiran}% kehadiran`}
          icon={UserCheck} 
          color="bg-orange-500" 
        />
        <StatCard 
          title="Rata-rata/Kelas" 
          value={Math.round(stats.totalSiswa / stats.totalKelas)} 
          subtitle="Siswa per kelas" 
          icon={TrendingUp} 
          color="bg-purple-500" 
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Grafik Kehadiran per Kelas</h3>
            <p className="text-sm text-gray-600 mt-1">Perbandingan total siswa dengan kehadiran hari ini</p>
          </div>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        <KelasChart data={chartData} />
      </div>

      {/* Search */}
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

      {/* Kelas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {paginatedData.map((kelas) => (
          <div key={kelas.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold">{kelas.nama}</h3>
                <div className="px-3 py-1 bg-white/20 rounded-lg text-xs font-semibold">
                  {kelas.jurusan}
                </div>
              </div>
              <p className="text-sm text-white/80">{kelas.waliKelas}</p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-600">{kelas.totalSiswa}</p>
                  <p className="text-xs text-gray-600">Total Siswa</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-600">{kelas.hadirHariIni}</p>
                  <p className="text-xs text-gray-600">Hadir Hari Ini</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Laki-laki</span>
                  <span className="font-semibold text-gray-900">{kelas.lakiLaki} siswa</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Perempuan</span>
                  <span className="font-semibold text-gray-900">{kelas.perempuan} siswa</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sudah Makan</span>
                  <span className="font-semibold text-green-600">{kelas.sudahMakan} siswa</span>
                </div>
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

      {/* Pagination */}
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

      {/* Modal Detail */}
      {selectedKelas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Detail Kelas {selectedKelas.nama}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedKelas.waliKelas}</p>
              </div>
              <button onClick={() => setSelectedKelas(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <Users className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{selectedKelas.totalSiswa}</p>
                  <p className="text-xs text-blue-700">Total Siswa</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <UserCheck className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-900">{selectedKelas.hadirHariIni}</p>
                  <p className="text-xs text-green-700">Hadir Hari Ini</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <TrendingUp className="w-6 h-6 text-orange-600 mb-2" />
                  <p className="text-2xl font-bold text-orange-900">{selectedKelas.rataKehadiran}%</p>
                  <p className="text-xs text-orange-700">Rata Kehadiran</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <Award className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-purple-900">{selectedKelas.rataGizi}%</p>
                  <p className="text-xs text-purple-700">Status Gizi</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Informasi Kelas</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <BookOpen className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Ruangan</p>
                        <p className="font-medium text-gray-900">{selectedKelas.ruangan}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Jurusan</p>
                        <p className="font-medium text-gray-900">{selectedKelas.jurusan}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Jadwal Makan</p>
                        <p className="font-medium text-gray-900">{selectedKelas.jadwalMakan}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Komposisi Siswa</h4>
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Laki-laki</span>
                        <span className="text-lg font-bold text-blue-900">{selectedKelas.lakiLaki}</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${(selectedKelas.lakiLaki / selectedKelas.totalSiswa) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">{Math.round((selectedKelas.lakiLaki / selectedKelas.totalSiswa) * 100)}%</p>
                    </div>

                    <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-pink-900">Perempuan</span>
                        <span className="text-lg font-bold text-pink-900">{selectedKelas.perempuan}</span>
                      </div>
                      <div className="w-full bg-pink-200 rounded-full h-2">
                        <div 
                          className="bg-pink-600 h-2 rounded-full transition-all" 
                          style={{ width: `${(selectedKelas.perempuan / selectedKelas.totalSiswa) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-pink-700 mt-1">{Math.round((selectedKelas.perempuan / selectedKelas.totalSiswa) * 100)}%</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-900">Sudah Makan</span>
                        <span className="text-lg font-bold text-green-900">{selectedKelas.sudahMakan}</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all" 
                          style={{ width: `${(selectedKelas.sudahMakan / selectedKelas.hadirHariIni) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-green-700 mt-1">{Math.round((selectedKelas.sudahMakan / selectedKelas.hadirHariIni) * 100)}% dari hadir</p>
                    </div>
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

export default DataKelas;