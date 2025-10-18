// components/layout/CSRLayout.tsx
'use client';

import { useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home,
  Heart,
  ChefHat,
  School,
  FileText,
  Menu,
  X,
  LogOut,
  Building2,
} from 'lucide-react';

interface CSRLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const CSRLayout = ({ children, currentPage = 'dashboard' }: CSRLayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Data CSR - bisa dari API/localStorage berdasarkan user yang login
  const [csrInfo, setCSRInfo] = useState({
    nama: 'PT Maju Bersama',
    pic: 'Bapak Joko Santoso',
    kode: 'CSR-001',
    type: 'Corporate'
  });

  // Fetch data CSR dari API saat component mount
  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.csr) {
          setCSRInfo({
            nama: user.csr.nama || 'PT Maju Bersama',
            pic: user.nama || 'Bapak Joko Santoso',
            kode: user.csr.kode || 'CSR-001',
            type: user.csr.type || 'Corporate'
          });
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Navigation untuk CSR
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/csr/dashboard' },
    { id: 'laporan', name: 'Laporan', icon: FileText, path: '/csr/laporan' },
    { id: 'sekolah', name: 'Sekolah Binaan', icon: School, path: '/csr/sekolah' },
    { id: 'dapur', name: 'Dapur', icon: ChefHat, path: '/csr/dapur' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mbg_user');
      document.cookie = 'mbg_user=; path=/; max-age=0';
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
                <div className="w-12 h-12 bg-gradient-to-br from-[#D0B064] to-[#C9A355] rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-sm">CSR PARTNER</h2>
                  <p className="text-xs text-[#D0B064] font-semibold">{csrInfo.type}</p>
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

        {/* CSR Info Card - Only when sidebar open */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 bg-gradient-to-br from-[#D0B064]/10 to-[#C9A355]/5 rounded-lg p-3 border border-[#D0B064]/20">
            <div className="flex items-start gap-2 mb-2">
              <Building2 className="w-4 h-4 text-[#D0B064] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Partner CSR</p>
                <p className="font-semibold text-sm text-white truncate">{csrInfo.nama}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-gray-400">PIC</p>
              <p className="text-sm font-medium text-white">{csrInfo.pic}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-xs text-gray-400">Kode Partner</p>
              <p className="text-sm font-bold text-[#D0B064]">{csrInfo.kode}</p>
            </div>
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
                    ? 'bg-gradient-to-r from-[#D0B064] to-[#C9A355] text-white shadow-lg' 
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
            {/* Welcome Section - Left */}
            <div>
              <p className="text-sm text-gray-400">Selamat datang kembali,</p>
              <p className="text-xl font-bold text-white">{csrInfo.pic}</p>
            </div>

            {/* CSR Badge - Right */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#D0B064] to-[#C9A355] px-6 py-2.5 rounded-full shadow-lg">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/80 font-medium">{csrInfo.kode}</p>
                <p className="font-bold text-white tracking-wide leading-tight">{csrInfo.nama}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area with rounded corner */}
        <div className="flex-1 bg-gray-50 rounded-tl-[32px] overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CSRLayout;