'use client';

import { useState, ReactNode } from 'react';
import Image from 'next/image';
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
  LogOut
} from 'lucide-react';

interface SekolahLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const SekolahLayout = ({ children, currentPage = 'dashboard' }: SekolahLayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

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

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    // Clear user data
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
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/logo/bgn_logo.png" 
                    alt="Logo" 
                    width={48} 
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-sm">REPUBLIK</h2>
                  <p className="text-xs text-gray-300">INDONESIA</p>
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
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
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-[88px] bg-[#1B263A] text-white px-8 flex items-center flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            {/* Tabs - Centered */}
            <div className="flex-1 flex justify-center gap-8">
              {topTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-lg font-semibold pb-1 border-b-2 transition-all ${
                    activeTab === tab.id 
                      ? 'border-white text-white' 
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* School Badge */}
            <div className="flex items-center gap-3 bg-[#D0B064] px-6 py-2.5 rounded-full shadow-lg">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg">🏫</span>
              </div>
              <span className="font-bold text-white tracking-wide">SMAN 5 KARAWANG</span>
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