'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { 
  Users, 
  Utensils,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  ChevronRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const DashboardSekolah = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const stats = useMemo(() => ({
    totalSiswa: 485,
    hadirHariIni: 456,
    sudahMakan: 432,
    rataGizi: 87.5
  }), []);

  const konsumsiHarian = useMemo(() => [
    { hari: 'Sen', porsi: 450 },
    { hari: 'Sel', porsi: 478 },
    { hari: 'Rab', porsi: 465 },
    { hari: 'Kam', porsi: 432 },
    { hari: 'Jum', porsi: 456 },
    { hari: 'Sab', porsi: 441 }
  ], []);

  const kelasList = useMemo(() => [
    { kelas: 'X-1', siswa: 36, hadir: 34, makan: 32 },
    { kelas: 'X-2', siswa: 35, hadir: 33, makan: 31 },
    { kelas: 'XI-1', siswa: 34, hadir: 32, makan: 30 },
    { kelas: 'XI-2', siswa: 36, hadir: 35, makan: 34 },
    { kelas: 'XII-1', siswa: 33, hadir: 31, makan: 29 }
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const lunch = new Date();
      lunch.setHours(11, 30, 0, 0);
      if (now > lunch) lunch.setDate(lunch.getDate() + 1);

      const diff = lunch.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => 
    currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
    [currentTime]
  );

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
    <SekolahLayout currentPage="dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Siswa" value={stats.totalSiswa} subtitle="Siswa terdaftar" icon={Users} color="bg-blue-500" />
        <StatCard title="Hadir Hari Ini" value={stats.hadirHariIni} subtitle={`${Math.round((stats.hadirHariIni / stats.totalSiswa) * 100)}% kehadiran`} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Sudah Makan" value={stats.sudahMakan} subtitle={`${stats.hadirHariIni - stats.sudahMakan} siswa belum`} icon={Utensils} color="bg-orange-500" />
        <StatCard title="Rata-rata Gizi" value={`${stats.rataGizi}%`} subtitle="Status gizi baik" icon={TrendingUp} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Grafik Konsumsi */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Konsumsi Mingguan</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <ConsumptionChart data={konsumsiHarian} />
        </div>

        {/* Menu Hari Ini */}
        <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Menu Hari Ini</h3>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <p className="text-sm font-mono font-semibold">{formattedTime}</p>
            </div>
          </div>

          <div className="bg-[#D0B064] rounded-lg p-4 mb-4">
            <p className="text-xs text-white/80 mb-2">Makan siang akan datang dalam:</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{countdown.hours}</p>
                <p className="text-xs text-white/80">Jam</p>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="text-center">
                <p className="text-3xl font-bold">{countdown.minutes}</p>
                <p className="text-xs text-white/80">Menit</p>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="text-center">
                <p className="text-3xl font-bold">{countdown.seconds}</p>
                <p className="text-xs text-white/80">Detik</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-2xl font-bold">Nasi Goreng + Ayam + Sayur</p>
            <p className="text-gray-300">Waktu distribusi: 11:30 - 12:30</p>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-lg">4.5</span>
                <span className="text-sm text-gray-300">(432 feedback)</span>
              </div>
              <span className="bg-white/10 px-4 py-2 rounded-lg text-sm font-medium">650 kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Kelas */}
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
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kelas</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total Siswa</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Hadir</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sudah Makan</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {kelasList.map((kelas, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-gray-900">{kelas.kelas}</td>
                  <td className="py-4 px-4 text-gray-600">{kelas.siswa}</td>
                  <td className="py-4 px-4 text-gray-600">{kelas.hadir}</td>
                  <td className="py-4 px-4 text-gray-600">{kelas.makan}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      kelas.makan === kelas.hadir ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {kelas.makan === kelas.hadir ? 'Selesai' : 'Berlangsung'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SekolahLayout>
  );
};

export default DashboardSekolah;