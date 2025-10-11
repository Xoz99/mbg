// components/layout/MinistryLayout.tsx
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
  Users,
  Menu,
  X,
  LogOut,
  AlertCircle,
  Settings,
  Bell,
  ChefHat
} from 'lucide-react';

interface MinistryLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const MinistryLayout = ({ children, currentPage = 'dashboard' }: MinistryLayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('monitoring');
  
  // Data kementerian - bisa dari API/localStorage berdasarkan user yang login
  const [ministryInfo, setMinistryInfo] = useState({
    nama: 'Kementerian Pendidikan',
    role: 'Admin Pusat',
    pic: 'Dr. Ahmad Wijaya',
    region: 'Nasional'
  });

  // Notifikasi count
  const [notificationCount, setNotificationCount] = useState(15);

  // Bisa fetch data user dari API saat component mount
  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role === 'MINISTRY_ADMIN') {
          setMinistryInfo({
            nama: 'Kementerian Pendidikan',
            role: user.roleDisplay || 'Admin Pusat',
            pic: user.nama || 'Dr. Ahmad Wijaya',
            region: user.region || 'Nasional'
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
      name: 'Dashboard Nasional', 
      icon: Home, 
      path: '/kementerian/dashboard' 
    },
    { 
      id: 'peta-dapur', 
      name: 'Peta Dapur', 
      icon: ChefHat, 
      path: '/kementerian/peta-dapur' 
    },
    { 
      id: 'peta-sekolah', 
      name: 'Peta Sekolah', 
      icon: School, 
      path: '/kementerian/peta-sekolah' 
    },
    { 
      id: 'monitoring', 
      name: 'Monitoring Distribusi', 
      icon: Truck, 
      path: '/kementerian/monitoring' 
    },
    { 
      id: 'laporan', 
      name: 'Laporan Konsumsi', 
      icon: FileText, 
      path: '/kementerian/laporan' 
    },
    { 
      id: 'anggaran', 
      name: 'Pengelolaan Anggaran', 
      icon: DollarSign, 
      path: '/kementerian/anggaran' 
    },
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
                <div className="w-12 h-12 bg-[#D0B064] rounded-full flex items-center justify-center overflow-hidden">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-sm">KEMENTERIAN</h2>
                  <p className="text-xs text-[#D0B064] font-semibold">Pendidikan</p>
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

        {/* Ministry Info Card - Only when sidebar open */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-start gap-2 mb-2">
              <Building2 className="w-4 h-4 text-[#D0B064] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Wilayah</p>
                <p className="font-semibold text-sm text-white truncate">{ministryInfo.region}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-gray-400">Admin</p>
              <p className="text-sm font-medium text-white">{ministryInfo.pic}</p>
              <p className="text-xs text-gray-400 mt-0.5">{ministryInfo.role}</p>
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
            {/* Tabs - Centered */}

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {/* Settings */}
              <button 
                onClick={() => router.push('/kementerian/settings')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* User Badge */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-[#D0B064] to-[#C9A355] px-6 py-2.5 rounded-full shadow-lg ml-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-white/80 font-medium">{ministryInfo.role}</p>
                  <p className="font-bold text-white tracking-wide leading-tight">{ministryInfo.pic}</p>
                </div>
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

export default MinistryLayout;