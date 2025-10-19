// components/layout/PemprovLayout.tsx
'use client';

import { useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home,
  Building2,
  MapPin,
  Truck,
  School,
  BarChart3,
  DollarSign,
  FileText,
  Menu,
  X,
  LogOut,
  Settings,
  Bell,
  ChefHat,
  Users
} from 'lucide-react';

interface PemprovLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const PemprovLayout = ({ children, currentPage = 'dashboard' }: PemprovLayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [notificationCount, setNotificationCount] = useState(8);
  
  const [pemprovInfo, setPemprovInfo] = useState({
    nama: 'Pemerintah Provinsi',
    role: 'Admin Provinsi',
    pic: 'Drs. Hendra Gunawan',
    province: 'Jawa Barat'
  });

  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    const userProvince = localStorage.getItem('userProvince');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role === 'PEMPROV') {
          setPemprovInfo({
            nama: `Pemerintah Provinsi ${userProvince || 'Indonesia'}`,
            role: user.role || 'Admin Provinsi',
            pic: user.name?.replace('Pemerintah Provinsi ', '') || 'Admin',
            province: userProvince || 'Indonesia'
          });
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const navigation = [
    { 
      id: 'dashboard', 
      name: 'Dashboard Provinsi', 
      icon: Home, 
      path: '/pemprov/dashboard' 
    },
    { 
      id: 'peta-dapur', 
      name: 'Peta Dapur', 
      icon: ChefHat, 
      path: '/pemprov/peta-dapur' 
    },
    { 
      id: 'peta-sekolah', 
      name: 'Peta Sekolah', 
      icon: School, 
      path: '/pemprov/peta-sekolah' 
    },
    { 
      id: 'monitoring', 
      name: 'Monitoring Distribusi', 
      icon: Truck, 
      path: '/pemprov/monitoring' 
    },
    { 
      id: 'laporan', 
      name: 'Laporan Konsumsi', 
      icon: FileText, 
      path: '/pemprov/laporan' 
    },
    { 
      id: 'anggaran', 
      name: 'Pengelolaan Anggaran', 
      icon: DollarSign, 
      path: '/pemprov/anggaran' 
    },
  ];

  const topTabs = [
    { id: 'monitoring', name: 'Monitoring' },
    { id: 'laporan', name: 'Laporan' },
    { id: 'manajemen', name: 'Manajemen' }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mbg_user');
      localStorage.removeItem('userProvince');
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
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-sm">PEMERINTAH</h2>
                  <p className="text-xs text-[#D0B064] font-semibold">PROVINSI</p>
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

        {/* Provinsi Info Card */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[#D0B064] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Wilayah</p>
                <p className="font-semibold text-sm text-white truncate">{pemprovInfo.province}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-gray-400">Admin</p>
              <p className="text-sm font-medium text-white">{pemprovInfo.pic}</p>
              <p className="text-xs text-gray-400 mt-0.5">{pemprovInfo.role}</p>
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
            {/* Welcome Text */}
            <div>
              <h2 className="text-xl font-bold">Selamat Datang, {pemprovInfo.province}</h2>
              <p className="text-sm text-white/60 mt-0.5">{pemprovInfo.pic}</p>
            </div>

            {/* User Badge */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#D0B064] to-[#C9A355] px-6 py-2.5 rounded-full shadow-lg">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/80 font-medium">{pemprovInfo.role}</p>
                <p className="font-bold text-white tracking-wide leading-tight">{pemprovInfo.pic}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 bg-gray-50 rounded-tl-[32px] overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PemprovLayout;