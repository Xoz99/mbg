// components/layout/AdminBiasaLayout.tsx
'use client';

import { useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home, Building2, GraduationCap, Users, BarChart3,
  Menu, X, LogOut, MapPin, ShieldAlert, MessageSquare,
  Loader2
} from 'lucide-react';

interface AdminBiasaLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const AdminBiasaLayout = ({ children, currentPage = 'dashboard' }: AdminBiasaLayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: 'Loading...',
    email: '',
    role: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    const token = localStorage.getItem('mbg_token');
    
    console.log('=== AdminBiasaLayout Auth Check ===');
    console.log('Token exists:', !!token);
    
    if (!userData || !token) {
      console.log('No token or user data, redirecting to login');
      router.push('/auth/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      const role = user.role || user.routeRole;

      console.log('User role:', role);

      // Only allow ADMIN role
      if (role !== 'ADMIN') {
        console.log('Role not ADMIN, redirecting to /admin/dashboard');
        router.push('/admin/dashboard');
        return;
      }

      console.log('Auth check passed for AdminBiasaLayout');

      setUserInfo({
        name: user.name || 'User',
        email: user.email || '',
        role: role,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  // Navigation menu untuk ADMIN (limited)
  const getNavigation = () => {
    return [
      { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/adminbiasa/dashboard' },
      { id: 'dapur', name: 'Dapur Saya', icon: Building2, path: '/adminbiasa/dapur' },
      { id: 'sekolah', name: 'Sekolah', icon: GraduationCap, path: '/adminbiasa/sekolah' },
      { id: 'user', name: 'User', icon: Users, path: '/adminbiasa/user' },
      { id: 'laporan', name: 'Laporan', icon: BarChart3, path: '/adminbiasa/laporan' },
      { id: 'tickets', name: 'Tickets', icon: MessageSquare, path: '/adminbiasa/tickets' },
    ];
  };

  const navigation = getNavigation();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mbg_user');
      localStorage.removeItem('mbg_token');
      localStorage.removeItem('dapurId');
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
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse"></div>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-bold text-sm line-clamp-1 text-white">ADMIN</h2>
                      <p className="text-xs text-blue-300 font-semibold">Staff</p>
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

        {/* Info Card */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 bg-white/5 rounded-lg p-3 border border-white/10">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-2/3"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Admin</p>
                    <p className="font-semibold text-sm text-white truncate">{userInfo.name}</p>
                  </div>
                </div>
                {userInfo.email && (
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-xs font-medium text-white truncate">{userInfo.email}</p>
                  </div>
                )}
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
                    ? 'bg-blue-500 text-white shadow-lg' 
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
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
              {loading ? (
                <div className="space-y-2">
                  <div className="h-5 bg-white/10 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-white/10 rounded w-40 animate-pulse"></div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-white">Welcome, {userInfo.name}</h1>
                  <p className="text-sm text-gray-400">Manage your data in MBG System</p>
                </>
              )}
            </div>

            {/* Right side - Badge */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-3 px-6 py-2.5 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    userInfo.name.charAt(0)
                  )}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs text-white/80 font-medium">ADMIN</p>
                  <p className="font-bold text-white tracking-wide leading-tight text-sm">{userInfo.name}</p>
                </div>
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

export default AdminBiasaLayout;