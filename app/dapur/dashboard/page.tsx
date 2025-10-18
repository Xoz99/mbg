// app/dapur/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import DapurLayout from '@/components/layout/DapurLayout';
import { 
  ChefHat, Package, Truck, CheckCircle, TrendingUp, Calendar, 
  PlayCircle, Activity, Utensils, QrCode, MapPin, ChevronLeft, 
  ChevronRight, FileText, Eye, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';

const ProductionChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={220}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="hari" stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} name="Target" />
      <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} name="Actual" />
    </LineChart>
  </ResponsiveContainer>
));
ProductionChart.displayName = 'ProductionChart';

const DeliveryChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="school" stroke="#94a3b8" style={{ fontSize: '11px' }} />
      <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <Tooltip />
      <Bar dataKey="trays" fill="#3b82f6" radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
));
DeliveryChart.displayName = 'DeliveryChart';

const MiniCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const menuDates = useMemo(() => new Set([
    '2025-01-13', '2025-01-14', '2025-01-15', '2025-01-16', '2025-01-17', '2025-01-18'
  ]), []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const calendarDays = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  for (let i = adjustedStartDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, isCurrentMonth: true });
  }
  
  const remainingCells = 42 - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({ day, isCurrentMonth: false });
  }

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const hasMenu = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return menuDates.has(dateStr);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#D0B064]" />
          Kalender Menu
        </h4>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-gray-700 min-w-[100px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-gray-500 py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, index) => {
          const { day, isCurrentMonth } = item;
          const today = isCurrentMonth && isToday(day);
          const hasMenuDay = isCurrentMonth && hasMenu(day);

          return (
            <button
              key={index}
              disabled={!isCurrentMonth}
              className={`aspect-square rounded text-[11px] font-medium transition-all relative flex items-center justify-center
                ${!isCurrentMonth ? "text-gray-300" : ""}
                ${today ? "ring-1 ring-[#D0B064]" : ""}
                ${hasMenuDay && isCurrentMonth ? "bg-blue-500 text-white hover:bg-blue-600" : isCurrentMonth ? "text-gray-700 hover:bg-gray-50" : "text-gray-300"}`}
            >
              <span className="relative z-10">{day}</span>
              {hasMenuDay && isCurrentMonth && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-blue-500" />
          <span className="text-gray-600">Ada Menu</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded border border-[#D0B064]" />
          <span className="text-gray-600">Hari Ini</span>
        </div>
      </div>
    </div>
  );
};

const DashboardDapur = () => {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [userInfo, setUserInfo] = useState({
    name: 'Loading...',
    email: '',
    phone: '',
    dapurName: 'Dapur MBG'
  });

  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    const token = localStorage.getItem('mbg_token');
    
    if (!userData || !token) {
      router.push('/auth/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUserInfo({
        name: user.name || 'PIC Dapur',
        email: user.email || '',
        phone: user.phone || '',
        dapurName: user.name || 'Dapur MBG'
      });
    } catch (error) {
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const prodStart = new Date();
      prodStart.setHours(6, 0, 0, 0);
      if (now > prodStart) prodStart.setDate(prodStart.getDate() + 1);

      const diff = prodStart.getTime() - now.getTime();
      setCountdown({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const schoolMenuStatus = useMemo(() => [
    { id: '1', name: 'SDN Melati 01', menuPlanned: 6, menuNeeded: 7, status: 'INCOMPLETE', daysLeft: 1 },
    { id: '2', name: 'SMP Harapan 02', menuPlanned: 7, menuNeeded: 7, status: 'COMPLETE', daysLeft: 0 },
    { id: '3', name: 'SMA Nusantara 03', menuPlanned: 4, menuNeeded: 7, status: 'INCOMPLETE', daysLeft: 3 },
    { id: '4', name: 'SMAN 5 Karawang', menuPlanned: 0, menuNeeded: 7, status: 'INCOMPLETE', daysLeft: 7 },
    { id: '5', name: 'SMK Teknik 1', menuPlanned: 7, menuNeeded: 7, status: 'COMPLETE', daysLeft: 0 }
  ], []);

  const menuPlanningStats = useMemo(() => {
    const total = schoolMenuStatus.length;
    const complete = schoolMenuStatus.filter(s => s.status === 'COMPLETE').length;
    const incomplete = total - complete;
    const critical = schoolMenuStatus.filter(s => s.daysLeft >= 5).length;
    return { total, complete, incomplete, critical, percentComplete: Math.round((complete / total) * 100) };
  }, [schoolMenuStatus]);

  const stats = useMemo(() => ({
    targetHariIni: 5000,
    sudahPacking: 3850,
    totalTrays: 5500,
    traysAvailable: 4200,
    totalBaskets: 120,
    basketsAvailable: 85,
    totalSekolah: 12,
    sudahDikirim: 8,
    totalBatch: 3,
    batchInProgress: 2
  }), []);

  const produksiMingguan = useMemo(() => [
    { hari: 'Sen', target: 5000, actual: 4950 },
    { hari: 'Sel', target: 5000, actual: 5100 },
    { hari: 'Rab', target: 5000, actual: 4800 },
    { hari: 'Kam', target: 5000, actual: 5200 },
    { hari: 'Jum', target: 5000, actual: 4900 },
    { hari: 'Sab', target: 4500, actual: 4400 }
  ], []);

  const deliveryTrips = useMemo(() => [
    { school: 'SMAN 5', trays: 485 },
    { school: 'SMAN 2', trays: 420 },
    { school: 'SMP 1', trays: 380 },
    { school: 'SMK 1', trays: 450 },
    { school: 'SMAN 3', trays: 395 }
  ], []);

  const todayMenu = useMemo(() => ({
    menuName: 'Nasi Goreng Spesial',
    description: 'Nasi Goreng + Ayam Suwir + Acar + Kerupuk + Buah',
    kalori: 650,
    protein: 25,
    cookingStartAt: '06:00',
    cookingEndAt: '08:30',
    difficulty: 'EASY',
    totalBahan: 6,
    allergyRisk: false
  }), []);

  const recentCheckpoints = useMemo(() => [
    { type: 'DRIVER_TO_SCHOOL', school: 'SMAN 5 Karawang', driver: 'Pak Budi', time: '10:45' },
    { type: 'SCHOOL_RECEIVED', school: 'SMAN 2 Karawang', driver: 'Pak Ahmad', time: '10:30' },
    { type: 'DRIVER_DEPARTURE', school: 'SMP 1 Karawang', driver: 'Pak Dedi', time: '10:15' }
  ], []);

  const formattedTime = useMemo(() => 
    currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
    [currentTime]
  );

  const progressPercentage = Math.round((stats.sudahPacking / stats.targetHariIni) * 100);

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );

  return (
    <DapurLayout currentPage="dashboard">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard {userInfo.dapurName}</h1>
            <p className="text-sm text-gray-600">Monitoring produksi, distribusi & menu planning real-time</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <p className="text-xs text-blue-600 font-medium">PIC Dapur</p>
            <p className="text-sm font-bold text-blue-900">{userInfo.name}</p>
            {userInfo.phone && <p className="text-xs text-blue-600 mt-0.5">{userInfo.phone}</p>}
          </div>
        </div>

        {menuPlanningStats.incomplete > 0 && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base mb-1">
                  ⚠️ {menuPlanningStats.incomplete} Sekolah Belum Lengkap Menu Planning!
                </p>
                <p className="text-sm text-white/90 mb-3">
                  {menuPlanningStats.critical} sekolah kritis (5+ hari kosong) • {menuPlanningStats.complete}/{menuPlanningStats.total} sekolah sudah complete
                </p>
                <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                  <div 
                    className="bg-white h-2 rounded-full transition-all" 
                    style={{ width: `${menuPlanningStats.percentComplete}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              {schoolMenuStatus.filter(s => s.status === 'INCOMPLETE').map((school) => (
                <div key={school.id} className="bg-white/10 rounded-lg p-3 backdrop-blur">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{school.name}</p>
                      <p className="text-xs text-white/80 mt-0.5">
                        Menu: {school.menuPlanned}/{school.menuNeeded} hari • 
                        <span className={`ml-1 ${school.daysLeft >= 5 ? 'text-red-200 font-bold' : ''}`}>
                          {school.daysLeft} hari kosong
                        </span>
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      school.daysLeft >= 5 ? 'bg-red-500' : 'bg-orange-500'
                    }`}>
                      {school.daysLeft >= 5 ? 'URGENT' : 'PERLU'}
                    </div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div 
                      className="bg-white h-1.5 rounded-full transition-all" 
                      style={{ width: `${(school.menuPlanned / school.menuNeeded) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Link 
              href="/dapur/menu"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-white/90 transition-colors font-semibold text-sm"
            >
              <FileText className="w-4 h-4" />
              Lengkapi Menu Planning Sekarang
            </Link>
          </div>
        )}

        {menuPlanningStats.complete > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900 text-sm">Sekolah dengan Menu Lengkap (7 Hari ke Depan)</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {schoolMenuStatus.filter(s => s.status === 'COMPLETE').map((school) => (
                <div key={school.id} className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-xs font-semibold text-green-900">{school.name}</p>
                  <p className="text-[10px] text-green-600 mt-0.5">✓ {school.menuPlanned}/7 hari</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatCard 
            title="Target Hari Ini" 
            value={stats.targetHariIni.toLocaleString()} 
            subtitle="Baki (trays)" 
            icon={Utensils} 
            color="bg-blue-500"
            trend={2.5}
          />
          <StatCard 
            title="Sudah Packing" 
            value={stats.sudahPacking.toLocaleString()} 
            subtitle={`${progressPercentage}% dari target`}
            icon={CheckCircle} 
            color="bg-green-500"
            trend={5.2}
          />
          <StatCard 
            title="Batch Delivery" 
            value={`${stats.batchInProgress}/${stats.totalBatch}`}
            subtitle="Sedang distribusi" 
            icon={Truck} 
            color="bg-orange-500"
          />
          <StatCard 
            title="Equipment Ready" 
            value={stats.traysAvailable.toLocaleString()} 
            subtitle="Baki siap pakai" 
            icon={Package} 
            color="bg-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  <div>
                    <h3 className="text-base font-semibold">Status Produksi Real-time</h3>
                    <p className="text-xs text-white/70">Update otomatis setiap 30 detik</p>
                  </div>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-lg">
                  <p className="text-sm font-mono font-semibold">{formattedTime}</p>
                </div>
              </div>

              <div className="bg-[#D0B064] rounded-lg p-3 mb-3">
                <p className="text-xs text-white/80 mb-2">Produksi berikutnya dimulai dalam:</p>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{countdown.hours}</p>
                    <p className="text-xs text-white/80">Jam</p>
                  </div>
                  <span className="text-xl font-bold">:</span>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{countdown.minutes}</p>
                    <p className="text-xs text-white/80">Menit</p>
                  </div>
                  <span className="text-xl font-bold">:</span>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{countdown.seconds}</p>
                    <p className="text-xs text-white/80">Detik</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progress Packing</span>
                  <span className="text-sm font-bold">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-white/80">
                  <span>0 baki</span>
                  <span>{stats.targetHariIni.toLocaleString()} baki</span>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Grafik Produksi Mingguan</h4>
              <ProductionChart data={produksiMingguan} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-white/80">Menu Hari Ini</p>
                    <p className="font-bold text-base">{todayMenu.menuName}</p>
                  </div>
                </div>
                <Link 
                  href="/dapur/menu"
                  className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-xs text-white/90 mb-3">{todayMenu.description}</p>
              <div className="bg-white/20 rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Kalori</span>
                  <span className="font-bold">{todayMenu.kalori} kcal</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Protein</span>
                  <span className="font-bold">{todayMenu.protein}g</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Tingkat Kesulitan</span>
                  <span className="px-2 py-0.5 bg-green-500/30 rounded-full font-bold">
                    {todayMenu.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Total Bahan</span>
                  <span className="font-bold">{todayMenu.totalBahan} items</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Risiko Alergi</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    todayMenu.allergyRisk ? 'bg-red-500/30' : 'bg-emerald-500/30'
                  }`}>
                    {todayMenu.allergyRisk ? 'Ada' : 'Aman'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/20">
                  <span>Waktu Masak</span>
                  <span className="font-bold">{todayMenu.cookingStartAt} - {todayMenu.cookingEndAt}</span>
                </div>
              </div>
            </div>

            <MiniCalendar />

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-purple-600" />
                Status Equipment
              </h4>
              <div className="space-y-2.5">
                <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-purple-700 font-medium">Trays (Baki)</span>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
                      RFID
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-purple-600">Available</span>
                    <span className="font-bold text-sm text-purple-900">
                      {stats.traysAvailable}/{stats.totalTrays}
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-1.5">
                    <div 
                      className="bg-purple-600 h-1.5 rounded-full" 
                      style={{ width: `${(stats.traysAvailable / stats.totalTrays) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-blue-700 font-medium">Baskets (Keranjang)</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-semibold">
                      RFID
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-blue-600">Available</span>
                    <span className="font-bold text-sm text-blue-900">
                      {stats.basketsAvailable}/{stats.totalBaskets}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${(stats.basketsAvailable / stats.totalBaskets) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm">
                  <PlayCircle className="w-4 h-4" />
                  Mulai Batch Baru
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm">
                  <QrCode className="w-4 h-4" />
                  Scan Checkpoint
                </button>
                <Link 
                  href="/dapur/menu"
                  className="w-full flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Menu Planning
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Distribusi Hari Ini</h3>
              <Truck className="w-4 h-4 text-gray-400" />
            </div>
            <DeliveryChart data={deliveryTrips} />
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-gray-600">Progress Pengiriman</span>
                <span className="font-semibold text-gray-900">
                  {stats.sudahDikirim}/{stats.totalSekolah} sekolah
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all" 
                  style={{ width: `${(stats.sudahDikirim / stats.totalSekolah) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Tracking Terbaru</h3>
              <QrCode className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="space-y-2.5">
              {recentCheckpoints.map((checkpoint, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{checkpoint.school}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {checkpoint.type.replace(/_/g, ' ')} • {checkpoint.driver}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">{checkpoint.time}</span>
                </div>
              ))}
            </div>

            <button className="w-full mt-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
              Lihat Semua Tracking
            </button>
          </div>
        </div>
      </div>
    </DapurLayout>
  );
};

export default DashboardDapur;