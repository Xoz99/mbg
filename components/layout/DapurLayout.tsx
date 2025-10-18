'use client';
import { useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  ChefHat,
  Package,
  Truck,
  ClipboardList,
  Users,
  BarChart3,
  Menu,
  X,
  LogOut,
  AlertCircle,
  MapPin,
} from 'lucide-react';

interface DapurLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const DapurLayout = ({ children, currentPage = 'dashboard' }: DapurLayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('produksi');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dapurInfo, setDapurInfo] = useState({
    nama: '',
    alamat: '',
    kota: '',
    pic: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');
    const dapurId = localStorage.getItem('userDapurId');

    if (!userData || !token) {
      router.push('/auth/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      
      console.log('User data:', user);
      console.log('Dapur ID from storage:', dapurId);
      
      // Set user info immediately
      setDapurInfo(prev => ({
        ...prev,
        pic: user.name || '-',
        email: user.email || '',
        phone: user.phone || '',
      }));

      // Fetch dapur detail from API if dapurId exists
      if (dapurId) {
        fetchDapurDetail(dapurId, token);
      } else {
        // Jika tidak ada dapurId, cari dapur berdasarkan PIC user
        findDapurByPIC(user.id, user.name, token);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setLoading(false);
      router.push('/auth/login');
    }
  }, [router]);

  // Fungsi untuk mencari dapur berdasarkan PIC ID atau nama
  const findDapurByPIC = async (picId: string, picName: string, token: string) => {
    try {
      setLoading(true);
      console.log('Searching for dapur with PIC ID:', picId);
      
      // Fetch list dapur
      const response = await fetch(
        `http://72.60.79.126:3000/api/dapur?page=1&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn(`HTTP error! status: ${response.status}`);
        setError(`Gagal memuat data dapur (${response.status})`);
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('Dapur list response:', result);
      
      // Parse response - bisa berbagai struktur
      let dapurList = [];
      if (Array.isArray(result.data?.data)) {
        dapurList = result.data.data;
      } else if (Array.isArray(result.data)) {
        dapurList = result.data;
      } else if (Array.isArray(result)) {
        dapurList = result;
      }

      console.log('Parsed dapur list:', dapurList);

      // Cari dapur yang memiliki PIC dengan ID atau nama yang match
      let foundDapur = null;
      
      for (const dapur of dapurList) {
        if (dapur.picDapur && Array.isArray(dapur.picDapur)) {
          const matchingPIC = dapur.picDapur.find(
            (pic: any) => pic.id === picId || pic.name === picName
          );
          
          if (matchingPIC) {
            foundDapur = dapur;
            console.log('Found dapur matching PIC:', foundDapur);
            break;
          }
        }
      }

      if (foundDapur) {
        // Simpan dapurId ke localStorage untuk digunakan lagi
        localStorage.setItem('userDapurId', foundDapur.id);
        console.log('Dapur ID saved:', foundDapur.id);
        
        // Update dapurInfo dengan data yang ditemukan
        updateDapurInfo(foundDapur);
      } else {
        console.warn('No dapur found for this PIC');
        setError('Dapur tidak ditemukan untuk PIC ini');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error finding dapur by PIC:', err);
      setError('Gagal mencari data dapur');
      setLoading(false);
    }
  };

  const fetchDapurDetail = async (dapurId: string, token: string) => {
    try {
      setLoading(true);
      console.log('Fetching dapur detail for ID:', dapurId);
      
      const response = await fetch(
        `http://72.60.79.126:3000/api/dapur/${dapurId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        console.warn(`HTTP error! status: ${response.status}`);
        setError(`Gagal memuat data dapur (${response.status})`);
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('Dapur data:', result);
      
      // Handle different response structures
      const dapur = result.data || result;

      updateDapurInfo(dapur);
      setError(null);
    } catch (err) {
      console.error('Error fetching dapur detail:', err);
      setError('Gagal memuat data dapur. Menggunakan data default.');
      setLoading(false);
    }
  };

  const updateDapurInfo = (dapur: any) => {
    // Ambil PIC dari picDapur array
    const picData = dapur.picDapur && Array.isArray(dapur.picDapur) && dapur.picDapur.length > 0 ? dapur.picDapur[0] : null;

    setDapurInfo({
      nama: dapur.nama || 'Dapur MBG',
      alamat: dapur.alamat || '',
      kota: extractKotaFromAlamat(dapur.alamat) || 'Jakarta',
      pic: picData?.name || '-',
      phone: picData?.phone || '',
      email: picData?.email || '',
    });

    setError(null);
    setLoading(false);
  };

  const extractKotaFromAlamat = (alamat: string): string => {
    if (!alamat) return '';
    const parts = alamat.split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return '';
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/dapur/dashboard' },
    { id: 'produksi', name: 'Produksi Harian', icon: ChefHat, path: '/dapur/produksi' },
    { id: 'menu', name: 'Menu Planning', icon: ClipboardList, path: '/dapur/menu' },
    { id: 'bahan', name: 'Stok Bahan Baku', icon: Package, path: '/dapur/bahan' },
    { id: 'distribusi', name: 'Jadwal Distribusi', icon: Truck, path: '/dapur/distribusi' },
    { id: 'karyawan', name: 'Data Karyawan', icon: Users, path: '/dapur/karyawan' },
    { id: 'laporan', name: 'Laporan Produksi', icon: BarChart3, path: '/dapur/laporan' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mbg_user');
      localStorage.removeItem('mbg_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userDapurId');
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
                <div className="w-12 h-12 bg-[#D0B064] rounded-full flex items-center justify-center overflow-hidden">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-sm">DAPUR</h2>
                  {loading ? (
                    <div className="h-3 bg-white/10 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-xs text-[#D0B064] font-semibold">{dapurInfo.kota}</p>
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

        {/* Dapur Info Card - Only when sidebar open */}
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
                <p className="text-xs text-red-400">{error}</p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[#D0B064] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Nama Dapur</p>
                    <p className="font-semibold text-sm text-white truncate">{dapurInfo.nama}</p>
                    {dapurInfo.alamat && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{dapurInfo.alamat}</p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400">PIC Dapur</p>
                  <p className="text-sm font-medium text-white">{dapurInfo.pic}</p>
                  {dapurInfo.phone && (
                    <p className="text-xs text-gray-400 mt-1">{dapurInfo.phone}</p>
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
            <div>
              <h1 className="text-xl font-bold text-white">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="text-sm text-gray-400">{dapurInfo.nama}</p>
            </div>

            {/* Dapur Badge */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#D0B064] to-[#C9A355] px-6 py-2.5 rounded-full shadow-lg ml-6">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div className="text-left hidden md:block">
                {loading ? (
                  <div className="space-y-1">
                    <div className="h-2 bg-white/20 rounded w-12"></div>
                    <div className="h-3 bg-white/20 rounded w-24"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-white/80 font-medium">Dapur</p>
                    <p className="font-bold text-white tracking-wide leading-tight line-clamp-1">{dapurInfo.nama}</p>
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

export default DapurLayout;