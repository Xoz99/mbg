'use client';

import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DapurLayout from '@/components/layout/DapurLayout';
import { 
  ChefHat, Package, Truck, CheckCircle, TrendingUp,
  Eye, AlertTriangle, CheckCircle2, AlertCircle, FileText, Plus, MapPin, QrCode
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://demombgv1.xyz";
const REFRESH_INTERVAL = 300000;

async function getAuthToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("authToken") || "";
}

async function apiCall<T>(endpoint: string, options: any = {}): Promise<T> {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    throw error;
  }
}

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (typeof data === "object") {
    const arr = Object.values(data).find((v) => Array.isArray(v));
    if (arr) return arr as any[];
  }
  return [];
}

const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 bg-gray-200 rounded-lg h-64"></div>
      <div className="bg-gray-200 rounded-lg h-64"></div>
    </div>
  </div>
);

const ProductionChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={220}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="hari" stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
      <Tooltip />
      <Legend />
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

const DashboardDapur = () => {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [userInfo, setUserInfo] = useState({
    name: 'Loading...',
    email: '',
    phone: '',
    dapurName: 'Dapur MBG'
  });

  const [menuPlanningData, setMenuPlanningData] = useState<any[]>([]);
  const [loadingMenuPlanning, setLoadingMenuPlanning] = useState(true);
  const [errorMenuPlanning, setErrorMenuPlanning] = useState<string | null>(null);
  const [todayMenu, setTodayMenu] = useState<any>(null);

  const [stats, setStats] = useState({
    targetHariIni: 0,
    sudahPacking: 0,
    totalTrays: 0,
    traysAvailable: 0,
    totalBaskets: 0,
    basketsAvailable: 0,
    totalSekolah: 0,
    sudahDikirim: 0,
    totalBatch: 0,
    batchInProgress: 0
  });

  const [produksiMingguan, setProduksiMingguan] = useState<any[]>([]);
  const [deliveryTrips, setDeliveryTrips] = useState<any[]>([]);
  const [recentCheckpoints, setRecentCheckpoints] = useState<any[]>([]);

  // Initialize user info
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

  // Main data loading function
  const loadData = useCallback(async () => {
    try {
      setLoadingMenuPlanning(true);
      setErrorMenuPlanning(null);

      const planningRes = await apiCall<any>("/api/menu-planning");
      const plannings = extractArray(planningRes?.data || []);

      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      let foundTodayMenu: any = null;
      let allMenus: any[] = [];
      let allDelivery: any[] = [];

      const weeklyStats = await Promise.all(
        plannings.map(async (planning: any) => {
          try {
            const menuRes = await apiCall<any>(`/api/menu-planning/${planning.id}/menu-harian`);
            const menus = extractArray(menuRes?.data || []);
            allMenus = [...allMenus, ...menus];

            const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            const daysStatus = dayNames.map((day, idx) => {
              const dayOfWeek = idx + 1;
              const hasMenu = menus.some((m: any) => {
                const menuDate = new Date(m.tanggal);
                const dateDay = menuDate.getDay();
                const adjustedDay = dateDay === 0 ? 7 : dateDay;
                return adjustedDay === dayOfWeek;
              });

              return {
                day,
                completed: hasMenu,
                menuCount: menus.filter((m: any) => {
                  const menuDate = new Date(m.tanggal);
                  const dateDay = menuDate.getDay();
                  const adjustedDay = dateDay === 0 ? 7 : dateDay;
                  return adjustedDay === dayOfWeek;
                }).length
              };
            });

            if (!foundTodayMenu) {
              const todayMenus = menus.filter((m: any) => {
                const menuDate = new Date(m.tanggal).toISOString().split('T')[0];
                return menuDate === todayString;
              });
              if (todayMenus.length > 0) {
                foundTodayMenu = {
                  ...todayMenus[0],
                  sekolahNama: planning.sekolah?.nama || 'Unknown'
                };
              }
            }

            const completedDays = daysStatus.filter(d => d.completed).length;
            const totalDays = 6;

            return {
              id: planning.id,
              mingguanKe: planning.mingguanKe,
              sekolahId: planning.sekolahId,
              sekolahNama: planning.sekolah?.nama || 'Unknown',
              tanggalMulai: planning.tanggalMulai,
              tanggalSelesai: planning.tanggalSelesai,
              daysStatus,
              completedDays,
              totalDays,
              status: completedDays === totalDays ? 'COMPLETE' : 'INCOMPLETE',
              daysLeft: totalDays - completedDays,
              totalMenuCount: menus.length
            };
          } catch (err) {
            return null;
          }
        })
      );

      const validStats = weeklyStats
        .filter((s) => s !== null)
        .sort((a, b) => {
          if (a.status === b.status) return 0;
          return a.status === 'COMPLETE' ? -1 : 1;
        });

      setMenuPlanningData(validStats);
      setTodayMenu(foundTodayMenu);

      // Fetch delivery data
      try {
        const deliveryRes = await apiCall<any>("/api/sekolah/1/pengiriman").catch(() => null);
        if (deliveryRes?.data) {
          allDelivery = Array.isArray(deliveryRes.data) ? deliveryRes.data : [];
        }
      } catch (err) {
        // Silent error handling
      }

      // Process data untuk stats
      const dateMap: { [key: string]: number } = {};
      const schoolMap: { [key: string]: number } = {};

      allMenus.forEach((menu) => {
        if (menu.tanggal) {
          const date = new Date(menu.tanggal).toLocaleDateString('id-ID', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
          });
          dateMap[date] = (dateMap[date] || 0) + 1;
        }
      });

      allDelivery.forEach((delivery) => {
        const school = delivery.sekolah?.nama || delivery.school || 'Unknown';
        schoolMap[school] = (schoolMap[school] || 0) + (delivery.jumlahTray || 1);
      });

      // Set stats
      const onTime = allDelivery.filter((d) => d.status === 'DELIVERED' || d.scanSekolahTime).length;
      const late = allDelivery.length - onTime;

      setStats({
        targetHariIni: allMenus.filter(m => {
          const menuDate = new Date(m.tanggal).toISOString().split('T')[0];
          return menuDate === todayString;
        }).length * 50 || 5000,
        sudahPacking: allMenus.length,
        totalTrays: allDelivery.reduce((sum, d) => sum + (d.jumlahTray || 100), 0) || 5500,
        traysAvailable: Math.max(0, (allDelivery.reduce((sum, d) => sum + (d.jumlahTray || 100), 0) || 5500) - allMenus.length),
        totalBaskets: 120,
        basketsAvailable: 85,
        totalSekolah: plannings.length,
        sudahDikirim: onTime,
        totalBatch: Math.ceil(allMenus.length / 500),
        batchInProgress: Math.ceil(allMenus.length / 500) - onTime
      });

      // Set produksi mingguan chart data
      const produksiData = Object.entries(dateMap)
        .map(([date, count]) => ({ hari: date, actual: count }))
        .slice(-6);
      setProduksiMingguan(produksiData);

      // Set delivery trips
      const deliveryData = Object.entries(schoolMap)
        .map(([school, trays]) => ({ school, trays }))
        .slice(0, 5);
      setDeliveryTrips(deliveryData);

      // Set recent checkpoints
      const checkpoints = allDelivery
        .filter(d => d.scanSekolahTime || d.status === 'DELIVERED')
        .map((d, idx) => ({
          type: d.status === 'DELIVERED' ? 'SCHOOL_RECEIVED' : 'DRIVER_TO_SCHOOL',
          school: d.sekolah?.nama || d.school || 'Unknown School',
          driver: d.driver?.nama || 'Driver',
          time: d.scanSekolahTime ? new Date(d.scanSekolahTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '00:00'
        }))
        .slice(-3);
      setRecentCheckpoints(checkpoints);

    } catch (err) {
      setErrorMenuPlanning(err instanceof Error ? err.message : 'Gagal memuat data');
      setMenuPlanningData([]);
    } finally {
      setLoadingMenuPlanning(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time update setup
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadData();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadData]);

  const menuPlanningStats = useMemo(() => {
    const total = menuPlanningData.length || 1;
    const complete = menuPlanningData.filter(s => s.status === 'COMPLETE').length;
    const incomplete = total - complete;
    const critical = menuPlanningData.filter(s => s.daysLeft >= 5).length;
    return { total, complete, incomplete, critical, percentComplete: Math.round((complete / total) * 100) };
  }, [menuPlanningData]);

  const progressPercentage = Math.round((stats.sudahPacking / stats.targetHariIni) * 100);

  return (
    <DapurLayout currentPage="dashboard">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Selamat Datang {userInfo.dapurName}</h1>
            <p className="text-sm text-gray-600 mt-1">Dashboard PIC DAPUR</p>
          </div>
        </div>

        {loadingMenuPlanning ? (
          <SkeletonLoader />
        ) : (
          <>
            {errorMenuPlanning && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Error Memuat Data</p>
                    <p className="text-sm text-red-700 mt-1">{errorMenuPlanning}</p>
                  </div>
                </div>
              </div>
            )}

            {menuPlanningStats.incomplete > 0 && (
              <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {menuPlanningStats.incomplete} Sekolah Belum Lengkap Menu Planning
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {menuPlanningStats.critical} sekolah kritis (5+ hari kosong)
                    </p>
                  </div>
                  <Link 
                    href="/dapur/menu"
                    className="flex-shrink-0 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-xs whitespace-nowrap"
                  >
                    Lengkapi Sekarang
                  </Link>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs font-semibold text-gray-900">{menuPlanningStats.percentComplete}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all" 
                      style={{ width: `${menuPlanningStats.percentComplete}%` }}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-600 font-medium">Sekolah</th>
                        <th className="text-center py-2 text-gray-600 font-medium">Week</th>
                        <th className="text-center py-2 text-gray-600 font-medium">Progress</th>
                        <th className="text-center py-2 text-gray-600 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuPlanningData
                        .filter(s => s.status === 'INCOMPLETE')
                        .map((week) => (
                        <tr key={week.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2.5">
                            <span className="font-medium text-gray-900">{week.sekolahNama}</span>
                          </td>
                          <td className="text-center py-2.5">
                            <span className="text-gray-600">W{week.mingguanKe}</span>
                          </td>
                          <td className="text-center py-2.5">
                            <span className="text-gray-900 font-medium">{week.completedDays}/{week.totalDays}</span>
                          </td>
                          <td className="text-center py-2.5">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${
                              week.daysLeft >= 5 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {week.daysLeft >= 5 ? 'URGENT' : 'PERLU'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {menuPlanningStats.complete > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">Sekolah dengan Menu Lengkap ({menuPlanningStats.complete})</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {menuPlanningData
                    .filter(s => s.status === 'COMPLETE')
                    .map((school) => (
                    <div key={school.id} className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <p className="text-xs font-semibold text-green-900">{school.sekolahNama}</p>
                      <p className="text-[10px] text-green-600 mt-0.5">✓ Week {school.mingguanKe}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard 
                title="Target Hari Ini" 
                value={stats.targetHariIni.toLocaleString()} 
                subtitle="Baki (trays)" 
                icon={CheckCircle} 
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 text-sm flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-blue-600" />
                    Grafik Produksi Mingguan
                  </h4>
                  <ProductionChart data={produksiMingguan} />
                </div>
              </div>

              <div className="space-y-4">
                {todayMenu ? (
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                          <ChefHat className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-white/80">Menu Hari Ini</p>
                          <p className="font-bold text-base">{todayMenu.namaMenu}</p>
                          <p className="text-xs text-white/70 mt-0.5">{todayMenu.sekolahNama || 'Sekolah'}</p>
                        </div>
                      </div>
                      <Link 
                        href="/dapur/menu"
                        className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
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
                        <span>Biaya per Tray</span>
                        <span className="font-bold">Rp {todayMenu.biayaPerTray.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-white/20">
                        <span>Waktu Masak</span>
                        <span className="font-bold">{todayMenu.jamMulaiMasak} - {todayMenu.jamSelesaiMasak}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                          <ChefHat className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-white/80">Menu Hari Ini</p>
                          <p className="font-bold text-base">Menu Tidak Tersedia</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-white/90 mb-3">Belum ada menu yang dijadwalkan untuk hari ini</p>
                    <Link
                      href="/dapur/menu"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white text-orange-600 rounded-lg hover:bg-white/90 transition-colors font-medium text-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Buat Menu
                    </Link>
                  </div>
                )}

                <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-purple-600" />
                    Status Equipment
                  </h4>
                  <div className="space-y-3">
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

                <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h4>
                  <div className="space-y-2.5">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Distribusi Hari Ini</h3>
                  <Truck className="w-4 h-4 text-gray-400" />
                </div>
                <DeliveryChart data={deliveryTrips} />
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm mb-2">
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

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Tracking Terbaru</h3>
                  <QrCode className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="space-y-3">
                  {recentCheckpoints.map((checkpoint, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{checkpoint.school}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {checkpoint.type.replace(/_/g, ' ')} • {checkpoint.driver}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{checkpoint.time}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  Lihat Semua Tracking
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DapurLayout>
  );
};

export default DashboardDapur;