'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { useSekolahData } from '@/lib/hooks/useSekolahData';
import { useTraySummaryRealtime } from '@/lib/hooks/useTraySummaryRealtime';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Loader,
  Send,
  Package,
  Calendar,
  HelpCircle,
  Wifi,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  MessageCircle,
} from 'lucide-react';

interface ValidationResult {
  sekolahId: string;
  tanggalMenu: string;
  namaMenu: string;
  totalSiswaHadir: number;
  analisisAlergi: {
    totalAlergi: number;
    siswaAlergiDetails: any[];
  };
  perhitunganTray: {
    trayYangSeharusnya: number;
    trayDiterima: number;
    selisih: number;
    peringatan: string;
  };
  statusValidasi: 'SESUAI' | 'TIDAK_SESUAI';
  catatan: string;
  validasiTime: string;
}

interface MenuData {
  id: string;
  tanggal: string;
  namaMenu: string;
  targetTray: number;
  jamMulaiMasak: string;
  jamSelesaiMasak: string;
  jamSajikan: string;
  biayaPerTray: number;
  kalori: number;
  protein: number;
  karbohidrat: number;
  lemak: number;
}

// Skeleton Loading Components
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
      <div className="h-6 bg-gray-100 rounded w-3/4"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-16 bg-gray-100 rounded-lg"></div>
        <div className="h-16 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  </div>
);

const SkeletonTrayCard = () => (
  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 shadow-sm animate-pulse">
    <div className="space-y-3">
      <div className="h-5 bg-blue-200 rounded w-1/3"></div>
      <div className="h-12 bg-blue-200 rounded w-1/4"></div>
      <div className="h-4 bg-blue-100 rounded w-1/2"></div>
    </div>
  </div>
);

const SkeletonMenuCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded-lg w-2/3"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const SkeletonFormCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="h-10 bg-gray-100 rounded-lg"></div>
      <div className="h-24 bg-gray-100 rounded-lg"></div>
      <div className="flex gap-3">
        <div className="h-10 bg-gray-100 rounded-lg flex-1"></div>
        <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
      </div>
    </div>
  </div>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// Helper function untuk menentukan waktu makan berdasarkan jam
function getWaktuMakan(jamSajikan: string | null | undefined): string {
  if (!jamSajikan) return "Tidak ada jadwal";

  try {
    const [hours] = jamSajikan.split(':').map(Number);

    if (hours >= 5 && hours < 11) {
      return "Pagi";
    } else if (hours >= 11 && hours < 15) {
      return "Siang";
    } else if (hours >= 15 && hours < 19) {
      return "Sore";
    } else {
      return "Malam";
    }
  } catch (e) {
    return "Tidak valid";
  }
}

function getStatusWaktuSajikan(jamSajikan: string | null | undefined): {
  status: 'belum' | 'sebentar-lagi' | 'sudah' | 'terlambat';
  message: string;
  color: string;
} {
  if (!jamSajikan) {
    return {
      status: 'belum',
      message: 'Belum ada jadwal',
      color: 'gray'
    };
  }

  try {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    const [targetHours, targetMinutes] = jamSajikan.split(':').map(Number);
    const targetTotalMinutes = targetHours * 60 + targetMinutes;

    const diffMinutes = targetTotalMinutes - currentTotalMinutes;

    if (diffMinutes > 30) {
      return {
        status: 'belum',
        message: 'Belum waktunya',
        color: 'blue'
      };
    } else if (diffMinutes > 0 && diffMinutes <= 30) {
      return {
        status: 'sebentar-lagi',
        message: 'Sebentar lagi',
        color: 'yellow'
      };
    } else if (diffMinutes >= -15 && diffMinutes <= 0) {
      return {
        status: 'sudah',
        message: 'Sudah waktunya!',
        color: 'green'
      };
    } else {
      return {
        status: 'terlambat',
        message: 'Terlambat perlu cek dengan alat',
        color: 'red'
      };
    }
  } catch (e) {
    return {
      status: 'belum',
      message: 'Tidak valid',
      color: 'gray'
    };
  }
}

interface DapurInfoParsed {
  nama: string;
  alamat: string;
  phone: string;
}

// Helper function untuk parse dapur data
function parseDapurInfo(dapurData: any): DapurInfoParsed | null {
  if (!dapurData) return null;

  return {
    nama: dapurData.nama || 'Dapur MBG',
    alamat: String(dapurData.alamat || ''),
    phone: dapurData.phone || '',
  };
}

const HubungiDapurCard = ({ dapurInfo, loading }: { dapurInfo: DapurInfoParsed | null; loading?: boolean }) => {
  if (loading) return <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md animate-pulse h-[140px]" />;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">Hubungi Dapur</h3>
          <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">Koordinasi & Bantuan</p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4 transition-all">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Dapur Penyaji</p>
          <p className="text-sm font-bold text-slate-900 leading-tight">{dapurInfo?.nama || 'Dapur MBG Central'}</p>
          {dapurInfo?.alamat && (
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed tracking-tight">{dapurInfo.alamat}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
      </div>
    </div>
  );
};


const ValidasiTrayPage = () => {
  const router = useRouter();
  const { sekolahInfo, sekolahId } = useSekolahData();
  const { traySummary, loading: loadingTraySummary, isConnected: wsConnected } = useTraySummaryRealtime(sekolahId || '');

  const [menus, setMenus] = useState<MenuData[]>([]);
  const [currentMenuIndex, setCurrentMenuIndex] = useState(0);
  const [loadingMenus, setLoadingMenus] = useState(true);

  // Form state
  const [totalTrayDiterima, setTotalTrayDiterima] = useState<number | ''>('');
  const [keterangan, setKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Validation result state
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Dapur Info state
  const [dapurInfo, setDapurInfo] = useState<DapurInfoParsed | null>(null);

  // Current time state for real-time updates
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch menu harian untu hari ini
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoadingMenus(true);
        const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

        if (!token) {
          return;
        }

        // Use same endpoint as sekolah dashboard - auto-detect today
        const response = await fetch(`${API_BASE_URL}/api/menu-harian/today`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Gagal fetch menu harian');
        }

        const data = await response.json();

        // Handle different response formats
        let menuList: MenuData[] = [];
        let dapurData = null;

        if (data.data) {
          if (Array.isArray(data.data)) {
            menuList = data.data;
            // Try to get dapur from first menu item
            if (data.data[0]?.dapur) {
              dapurData = data.data[0].dapur;
            } else if (data.data[0]?.menuPlanning?.dapur) {
              dapurData = data.data[0].menuPlanning.dapur;
            }
          } else if (data.data.menuHarian && Array.isArray(data.data.menuHarian)) {
            menuList = data.data.menuHarian;
            dapurData = data.data.dapur;
          } else if (data.data.id) {
            menuList = [data.data];
            dapurData = data.data.dapur || data.data.menuPlanning?.dapur;
          }
        } else if (Array.isArray(data)) {
          menuList = data;
          // Try to get dapur from first menu item
          if (data[0]?.dapur) {
            dapurData = data[0].dapur;
          } else if (data[0]?.menuPlanning?.dapur) {
            dapurData = data[0].menuPlanning.dapur;
          }
        }

        if (dapurData) {
          setDapurInfo(parseDapurInfo(dapurData));
        }

        setMenus(menuList);
        if (menuList.length > 0) {
          setCurrentMenuIndex(0);
        }
      } catch (err) {
        console.error('Error fetching menus:', err);
      } finally {
        setLoadingMenus(false);
      }
    };

    fetchMenus();
  }, [sekolahId]);

  const currentMenu = useMemo(() => {
    return menus[currentMenuIndex] || null;
  }, [menus, currentMenuIndex]);

  // Calculate status in real-time based on currentTime
  const menuSajikanStatus = useMemo(() => {
    if (!currentMenu?.jamSajikan) return null;
    return {
      status: getStatusWaktuSajikan(currentMenu.jamSajikan),
      waktuMakan: getWaktuMakan(currentMenu.jamSajikan)
    };
  }, [currentMenu, currentTime]);

  const handlePrevMenu = () => {
    setCurrentMenuIndex((prev) => (prev > 0 ? prev - 1 : menus.length - 1));
    resetForm();
  };

  const handleNextMenu = () => {
    setCurrentMenuIndex((prev) => (prev < menus.length - 1 ? prev + 1 : 0));
    resetForm();
  };

  const resetForm = () => {
    setTotalTrayDiterima('');
    setKeterangan('');
    setSubmitError('');
    setShowResult(false);
    setValidationResult(null);
  };

  const handleSubmitValidasi = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentMenu || totalTrayDiterima === '') {
      setSubmitError('Harap isi semua field');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/rfid/validate-tray`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menuHarianId: currentMenu.id,
          totalTrayDiterima: Number(totalTrayDiterima),
          keterangan: keterangan.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal submit validasi tray');
      }

      const result = await response.json();
      setValidationResult(result.data);
      setShowResult(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading skeleton while menus are loading
  if (loadingMenus) {
    return (
      <SekolahLayout currentPage="validasi-tray">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1B263A] mb-2">Validasi Penerimaan Tray</h1>
              <p className="text-gray-600">Verifikasi tray yang diterima dari dapur</p>
            </div>
          </div>

          <SkeletonTrayCard />
          <SkeletonMenuCard />
          <SkeletonFormCard />
        </div>
      </SekolahLayout>
    );
  }

  return (
    <SekolahLayout currentPage="validasi-tray">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Validasi Penerimaan Tray</h1>
            <p className="text-slate-500 font-medium mt-1">Verifikasi tray yang diterima dari dapur untuk hari ini</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D0B064]" />
              <span className="text-sm font-bold text-slate-700">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </div>

        {menus.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <p className="text-yellow-700">Tidak ada menu yang disiapkan untuk hari ini</p>
          </div>
        ) : (
          <>
            {/* Split Section: Menu Info & Tray Summary */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Side: Tray Summary Stats */}
              <div className="xl:col-span-4 space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1 min-h-[20px] flex items-center">Ringkasan Pengiriman</h3>
                <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${menuSajikanStatus?.status.status !== 'terlambat' ? 'p-10 md:p-12 min-h-[300px] flex flex-col justify-center' : 'p-6 md:p-8'}`}>
                  <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform ${menuSajikanStatus?.status.status !== 'terlambat' ? 'scale-150' : ''}`}>
                    <Package className="w-20 h-20 text-slate-900" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200 ${menuSajikanStatus?.status.status !== 'terlambat' ? 'scale-125 origin-left' : ''}`}>
                        <Package className="w-6 h-6 text-[#D0B064]" />
                      </div>
                      {wsConnected && (
                        <div className="flex items-center gap-2 bg-green-50 px-2.5 py-1.5 rounded-xl border border-green-100">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live Monitor</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className={`${menuSajikanStatus?.status.status !== 'terlambat' ? 'text-8xl' : 'text-6xl'} font-black text-slate-900 tracking-tighter italic transition-all duration-500`}>
                        {traySummary?.totalTrayUnik || traySummary?.total || 0}
                      </p>
                      <span className={`${menuSajikanStatus?.status.status !== 'terlambat' ? 'text-2xl' : 'text-base'} font-black text-[#D0B064] uppercase tracking-widest transition-all duration-500`}>TRAY</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-3 font-medium">Tray unik terdeteksi alat RFID dapur</p>
                  </div>
                </div>

                {/* Hubungi Dapur Card - Conditional Display */}
                {menuSajikanStatus?.status.status === 'terlambat' && (
                  <HubungiDapurCard dapurInfo={dapurInfo} />
                )}
              </div>

              {/* Right Side: Menu Info */}
              <div className="xl:col-span-8 space-y-6">
                <div className="flex items-center justify-between px-1 min-h-[20px]">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Informasi Menu Harian</h3>
                  {menus.length > 1 && (
                    <div className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-black text-slate-600 tracking-wider">
                        MENU {currentMenuIndex + 1} / {menus.length}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm h-full flex flex-col hover:shadow-md transition-all">
                  {currentMenu && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                      {/* Menu Info Grid */}
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-[#1B263A]">{currentMenu.namaMenu}</h3>
                          <span className="bg-[#D0B064]/20 text-[#D0B064] px-3 py-1 rounded-full text-xs font-black uppercase">Aktif</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#D0B064]" />
                              <p className="text-sm font-bold text-slate-700">
                                {Number.isNaN(Date.parse(currentMenu.tanggal))
                                  ? currentMenu.tanggal
                                  : new Date(currentMenu.tanggal).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jam Masak</p>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-[#D0B064]" />
                              <p className="text-sm font-bold text-slate-700">
                                {currentMenu.jamMulaiMasak} - {currentMenu.jamSelesaiMasak}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biaya Estimasi</p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-[#1B263A]">Rp {currentMenu.biayaPerTray?.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400">/ tray</span>
                            </div>
                          </div>
                        </div>

                        {/* Waktu Sajikan Alert */}
                        {currentMenu.jamSajikan && menuSajikanStatus && (() => {
                          const statusInfo = menuSajikanStatus.status;
                          const waktuMakan = menuSajikanStatus.waktuMakan;

                          const themeClasses = {
                            blue: 'bg-blue-50 border-blue-200 text-blue-900 icon-blue-600',
                            yellow: 'bg-amber-50 border-amber-200 text-amber-900 icon-amber-600',
                            green: 'bg-emerald-50 border-emerald-200 text-emerald-900 icon-emerald-600',
                            red: 'bg-red-50 border-red-200 text-red-900 icon-red-600',
                            gray: 'bg-slate-100 border-slate-200 text-slate-900 icon-slate-600'
                          };

                          const iconColors = {
                            blue: 'text-blue-600',
                            yellow: 'text-amber-600',
                            green: 'text-emerald-600',
                            red: 'text-red-600',
                            gray: 'text-slate-600'
                          };

                          return (
                            <div className={`mt-6 p-6 rounded-2xl border ${themeClasses[statusInfo.color as keyof typeof themeClasses]}`}>
                              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
                                {/* Left Side: Real-time Clock */}
                                <div className="flex items-center gap-4 flex-shrink-0">
                                  <div className={`p-3 bg-white rounded-xl shadow-sm ${iconColors[statusInfo.color as keyof typeof iconColors]}`}>
                                    <Clock className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Waktu Sekarang</p>
                                    <p className="text-3xl font-black font-mono tracking-tighter">
                                      {currentTime.toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                </div>

                                {/* Divider or spacing */}
                                <div className="hidden xl:block w-px h-12 bg-current opacity-10 flex-shrink-0"></div>

                                {/* Right Side: Target & Status */}
                                <div className="flex flex-wrap items-center gap-6 xl:gap-8 flex-1 xl:justify-end">
                                  <div className="min-w-[140px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Sajian</p>
                                    <p className="text-xl font-black leading-tight tracking-tight">{statusInfo.message}</p>
                                  </div>
                                  <div className="xl:text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Baik di Sajikan</p>
                                    <div className="flex items-center gap-2 xl:justify-end mt-0.5">
                                      <p className="text-2xl font-black leading-none">{currentMenu.jamSajikan}</p>
                                      <span className="bg-white/50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight">
                                        {waktuMakan}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Nutrition Info Strip */}
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-wrap items-center gap-x-8 gap-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full md:w-auto">Nutrition:</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Calori:</span>
                          <span className="text-sm font-black text-slate-800">{currentMenu.kalori} kcal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Protein:</span>
                          <span className="text-sm font-black text-slate-800">{currentMenu.protein}g</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Carbo:</span>
                          <span className="text-sm font-black text-slate-800">{currentMenu.karbohidrat}g</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Lemak:</span>
                          <span className="text-sm font-black text-slate-800">{currentMenu.lemak}g</span>
                        </div>
                      </div>

                      {/* Navigation Controls */}
                      {menus.length > 1 && (
                        <div className="flex items-center justify-between gap-4 pt-4 mt-auto border-t border-slate-100">
                          <button
                            onClick={handlePrevMenu}
                            className="bg-white border border-slate-200 p-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:shadow active:scale-95"
                          >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                          </button>
                          <div className="flex items-center gap-2 flex-1 justify-center">
                            {menus.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setCurrentMenuIndex(idx);
                                  resetForm();
                                }}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentMenuIndex ? 'w-10 bg-[#D0B064]' : 'w-2 bg-slate-200'
                                  }`}
                              />
                            ))}
                          </div>
                          <button
                            onClick={handleNextMenu}
                            className="bg-white border border-slate-200 p-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:shadow active:scale-95"
                          >
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Form - Full Width */}
            {!showResult ? (
              <form onSubmit={handleSubmitValidasi} className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#1B263A] mb-6">Form Validasi Tray</h3>

                  <div className="space-y-4">
                    {/* Total Tray Diterima */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1B263A] mb-2">
                        Total Tray Diterima <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={totalTrayDiterima}
                          onChange={(e) => setTotalTrayDiterima(e.target.value ? Number(e.target.value) : '')}
                          placeholder="Masukkan jumlah tray yang diterima"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D0B064] focus:ring-2 focus:ring-[#D0B064]/20"
                        />
                        <Package className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Keterangan */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1B263A] mb-2">
                        Keterangan Kondisi Tray
                      </label>
                      <textarea
                        value={keterangan}
                        onChange={(e) => setKeterangan(e.target.value)}
                        placeholder="Contoh: Tray diterima dalam kondisi baik, ada beberapa tray yang kotor..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D0B064] focus:ring-2 focus:ring-[#D0B064]/20 resize-none"
                      />
                    </div>

                    {/* Error Message */}
                    {submitError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{submitError}</p>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || totalTrayDiterima === ''}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D0B064] to-[#C9A355] text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Validasi Tray
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Validation Result */
              validationResult && (
                <div className="space-y-6">
                  {/* Status Alert */}
                  <div
                    className={`rounded-2xl p-6 border ${validationResult.statusValidasi === 'SESUAI'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      {validationResult.statusValidasi === 'SESUAI' ? (
                        <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <h3
                          className={`text-lg font-bold mb-2 ${validationResult.statusValidasi === 'SESUAI'
                            ? 'text-green-900'
                            : 'text-red-900'
                            }`}
                        >
                          {validationResult.statusValidasi === 'SESUAI'
                            ? 'Validasi Sesuai'
                            : 'Validasi Tidak Sesuai'}
                        </h3>
                        <p
                          className={`text-sm ${validationResult.statusValidasi === 'SESUAI'
                            ? 'text-green-700'
                            : 'text-red-700'
                            }`}
                        >
                          {validationResult.catatan}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detail Result */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
                    {/* Perhitungan Tray */}
                    <div>
                      <h4 className="text-lg font-bold text-[#1B263A] mb-4">Perhitungan Tray</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Seharusnya</p>
                          <p className="text-3xl font-bold text-blue-900">
                            {validationResult.perhitunganTray.trayYangSeharusnya}
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <p className="text-xs text-purple-700 font-semibold uppercase mb-1">Diterima</p>
                          <p className="text-3xl font-bold text-purple-900">
                            {validationResult.perhitunganTray.trayDiterima}
                          </p>
                        </div>
                        <div
                          className={`rounded-lg p-4 border ${validationResult.perhitunganTray.selisih === 0
                            ? 'bg-green-50 border-green-200'
                            : 'bg-orange-50 border-orange-200'
                            }`}
                        >
                          <p
                            className={`text-xs font-semibold uppercase mb-1 ${validationResult.perhitunganTray.selisih === 0
                              ? 'text-green-700'
                              : 'text-orange-700'
                              }`}
                          >
                            Selisih
                          </p>
                          <p
                            className={`text-3xl font-bold ${validationResult.perhitunganTray.selisih === 0
                              ? 'text-green-900'
                              : 'text-orange-900'
                              }`}
                          >
                            {validationResult.perhitunganTray.selisih > 0
                              ? '+'
                              : ''}
                            {validationResult.perhitunganTray.selisih}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <p className="text-xs text-gray-700 font-semibold uppercase">Waktu Validasi</p>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 font-mono">
                            {new Date(validationResult.validasiTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            })}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(validationResult.validasiTime).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      {validationResult.perhitunganTray.peringatan && (
                        <div className="mt-4 bg-orange-100 border border-orange-300 rounded-lg p-3">
                          <p className="text-sm font-semibold text-orange-900">
                            ⚠️ {validationResult.perhitunganTray.peringatan}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Alergi Information */}
                    {validationResult.analisisAlergi.totalAlergi > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-lg font-bold text-[#1B263A] mb-4">Informasi Alergi</h4>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm font-semibold text-yellow-900 mb-3">
                            Total Siswa Alergi: {validationResult.analisisAlergi.totalAlergi}
                          </p>
                          {validationResult.analisisAlergi.siswaAlergiDetails.length > 0 && (
                            <div className="space-y-2">
                              {validationResult.analisisAlergi.siswaAlergiDetails.map((siswa, idx) => (
                                <div key={idx} className="text-sm text-yellow-800">
                                  • {siswa.nama}: {siswa.alergi}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        resetForm();
                        if (currentMenuIndex < menus.length - 1) {
                          handleNextMenu();
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D0B064] to-[#C9A355] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      {currentMenuIndex < menus.length - 1 ? 'Validasi Menu Berikutnya' : 'Validasi Selesai'}
                    </button>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
    </SekolahLayout>
  );
};

export default ValidasiTrayPage;
