'use client';

import { useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home,
  Users, 
  GraduationCap,
  MapPin,
  ClipboardCheck,
  MessageSquare,
  Calendar,
  Menu,
  X,
  LogOut,
  AlertCircle,
  Loader2,
  BookOpen
} from 'lucide-react';

const API_BASE_URL = "http://72.60.79.126:3000"

interface SekolahLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const SekolahLayout = ({ children, currentPage = 'dashboard' }: SekolahLayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [sekolahId, setSekolahId] = useState("");
  
  const [sekolahInfo, setSekolahInfo] = useState({
    nama: '',
    alamat: '',
    kota: '',
    pic: '',
    picPhone: '',
    picEmail: '',
    kode: '',
    latitude: 0,
    longitude: 0
  });

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/sekolah/dashboard' },
    { id: 'siswa', name: 'Data Siswa', icon: Users, path: '/sekolah/siswa' },
    { id: 'tracking', name: 'Tracking MBG', icon: MapPin, path: '/sekolah/tracking' },
    { id: 'kelas', name: 'Data Kelas', icon: GraduationCap, path: '/sekolah/kelas' },
    { id: 'absensi', name: 'Absensi Penerima', icon: ClipboardCheck, path: '/sekolah/absensi' },
    { id: 'feedback', name: 'Feedback Menu', icon: MessageSquare, path: '/sekolah/feedback' },
    { id: 'jadwal', name: 'Jadwal Distribusi', icon: Calendar, path: '/sekolah/jadwal' }
  ];

  const topTabs = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'sekolah', name: 'Sekolah' },
    { id: 'daerah', name: 'Daerah' }
  ];

  // Initialize auth dan ambil sekolah data
  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');
    const storedSekolahId = localStorage.getItem('sekolahId');

    if (!userData || !token) {
      router.push('/auth/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      setAuthToken(token);

      // Jika ada sekolahId di localStorage, gunakan itu
      if (storedSekolahId) {
        setSekolahId(storedSekolahId);
        console.log("[SEKOLAH LAYOUT] Sekolah ID dari localStorage:", storedSekolahId);
      } else {
        // Cari sekolah berdasarkan PIC user
        findSekolahByPIC(user.id, token);
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
      router.push('/auth/login');
    }
  }, [router]);

  // Fetch sekolah detail setelah sekolahId ada
  useEffect(() => {
    if (sekolahId && authToken) {
      fetchSekolahDetail(sekolahId, authToken);
    }
  }, [sekolahId, authToken]);

  const findSekolahByPIC = async (picId: string, token: string) => {
    try {
      setLoading(true);
      console.log("[SEKOLAH LAYOUT] Mencari sekolah untuk PIC ID:", picId);

      const response = await fetch(
        `${API_BASE_URL}/api/sekolah?page=1&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("[SEKOLAH LAYOUT] Sekolah list response:", result);

      let sekolahList = [];
      if (Array.isArray(result.data?.data)) {
        sekolahList = result.data.data;
      } else if (Array.isArray(result.data)) {
        sekolahList = result.data;
      } else if (Array.isArray(result)) {
        sekolahList = result;
      }

      // Cari sekolah yang memiliki PIC dengan ID yang match
      let foundSekolah = null;

      for (const sekolah of sekolahList) {
        if (sekolah.picSekolah && Array.isArray(sekolah.picSekolah)) {
          const matchingPIC = sekolah.picSekolah.find(
            (pic: any) => pic.id === picId
          );

          if (matchingPIC) {
            foundSekolah = sekolah;
            console.log("[SEKOLAH LAYOUT] Sekolah ditemukan:", foundSekolah);
            break;
          }
        }
      }

      if (foundSekolah) {
        localStorage.setItem('sekolahId', foundSekolah.id);
        setSekolahId(foundSekolah.id);
        updateSekolahInfo(foundSekolah);
      } else {
        console.warn("[SEKOLAH LAYOUT] Sekolah tidak ditemukan untuk PIC ini");
        setError('Sekolah tidak ditemukan untuk PIC ini');
        setLoading(false);
      }
    } catch (err) {
      console.error("[SEKOLAH LAYOUT] Error mencari sekolah:", err);
      setError('Gagal mencari sekolah');
      setLoading(false);
    }
  };

  const fetchSekolahDetail = async (sekolahId: string, token: string) => {
    try {
      setLoading(true);
      console.log("[SEKOLAH LAYOUT] Fetch detail sekolah:", sekolahId);

      const response = await fetch(
        `${API_BASE_URL}/api/sekolah/${sekolahId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("[SEKOLAH LAYOUT] Sekolah detail:", result);

      // Extract sekolah dari result.data atau result langsung
      let sekolah = result.data || result;
      
      // Jika result.data adalah object dengan data di dalamnya
      if (sekolah && typeof sekolah === 'object' && !sekolah.nama && sekolah.data) {
        sekolah = sekolah.data;
      }

      updateSekolahInfo(sekolah);
      setError(null);
    } catch (err) {
      console.error("[SEKOLAH LAYOUT] Error fetch detail:", err);
      setError('Gagal memuat data sekolah');
      setLoading(false);
    }
  };

  const updateSekolahInfo = (sekolah: any) => {
    // Ambil PIC dari picSekolah array
    const picData = sekolah.picSekolah && Array.isArray(sekolah.picSekolah) && sekolah.picSekolah.length > 0 
      ? sekolah.picSekolah[0] 
      : null;

    const alamat = String(sekolah.alamat || '');
    const kota = extractKota(alamat) || 'Sekolah';

    setSekolahInfo({
      nama: String(sekolah.nama || 'Sekolah MBG'),
      alamat: alamat,
      kota: kota,
      pic: picData ? String(picData.name || picData.namaLengkap || '-') : '-',
      picPhone: picData ? String(picData.phone || picData.noHp || '') : '',
      picEmail: picData ? String(picData.email || '') : '',
      kode: generateKodeSekolah(String(sekolah.id || '')),
      latitude: Number(sekolah.latitude) || 0,
      longitude: Number(sekolah.longitude) || 0
    });

    setError(null);
    setLoading(false);
  };

  const extractKota = (alamat: string): string => {
    if (!alamat) return '';
    const parts = String(alamat).split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return '';
  };

  const generateKodeSekolah = (id: string): string => {
    if (!id) return 'SKL-000';
    const shortId = String(id).slice(-3).toUpperCase();
    return `SKL-${shortId}`;
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mbg_user');
      localStorage.removeItem('mbg_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('sekolahId');
      document.cookie = 'mbg_user=; path=/; max-age=0';
      document.cookie = 'mbg_token=; path=/; max-age=0';
    }
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen bg-[#1B263A] overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1B263A] text-white transition-all duration-300 flex flex-col flex-shrink-0`}>
        {/* Logo Section */}
        <div className="h-[88px] px-6 flex items-center justify-between border-b border-white/10">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D0B064] to-[#C9A355] rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse"></div>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-bold text-sm line-clamp-1 text-white">{String(sekolahInfo.pic)}</h2>
                      <p className="text-xs text-gray-400">PIC Sekolah</p>
                    </>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="hover:bg-white/10 p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="hover:bg-white/10 p-2 rounded mx-auto transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Sekolah Info Card - Only when sidebar open */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 bg-white/5 rounded-lg p-3 border border-white/10">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-2/3"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            ) : error ? (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-400">{String(error)}</p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Nama Sekolah</p>
                    <p className="font-semibold text-sm text-white truncate">{String(sekolahInfo.nama)}</p>
                    {sekolahInfo.alamat && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{String(sekolahInfo.alamat)}</p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400">PIC Sekolah</p>
                  <p className="text-sm font-medium text-white">{String(sekolahInfo.pic)}</p>
                  {sekolahInfo.picPhone && (
                    <p className="text-xs text-gray-400 mt-1">{String(sekolahInfo.picPhone)}</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-[#D0B064] text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-[88px] bg-[#1B263A] text-white px-8 flex items-center flex-shrink-0 border-b border-white/10">
          <div className="flex items-center justify-between w-full">
            {/* Welcome Message - Left Side */}
            <div>
              <p className="text-gray-400 text-sm">Selamat datang di</p>
              <p className="text-2xl font-bold text-white">
                {loading ? 'Loading...' : `${String(sekolahInfo.nama)}`}
              </p>
            </div>

            {/* School Badge */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#D0B064] to-[#C9A355] px-6 py-2.5 rounded-full shadow-lg ml-auto">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GraduationCap className="w-4 h-4" />
                )}
              </div>
              <div className="text-left">
                {loading ? (
                  <div className="space-y-1">
                    <div className="h-2 bg-white/20 rounded w-12"></div>
                    <div className="h-3 bg-white/20 rounded w-24"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-white/80 font-medium">{String(sekolahInfo.kode)}</p>
                    <p className="font-bold text-white tracking-wide leading-tight line-clamp-1">{String(sekolahInfo.kota)}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area with rounded corner */}
        <div className="flex-1 bg-gray-50 rounded-tl-[32px] overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SekolahLayout;