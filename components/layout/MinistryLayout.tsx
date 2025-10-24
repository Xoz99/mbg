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
  ChefHat,
  MessageCircle,
  Send,
  CheckCircle,
  Loader2,
} from 'lucide-react';

const API_BASE_URL = "http://72.60.79.126:3000"

interface MinistryLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

// BubbleReport Component
type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

interface BubbleReportProps {
  apiBaseUrl?: string;
  authToken?: string;
}

const BubbleReport = ({ 
  apiBaseUrl = "http://72.60.79.126:3000",
  authToken = ""
}: BubbleReportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim() || !deskripsi.trim()) {
      setErrorMessage('Judul dan deskripsi tidak boleh kosong');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');

      const token = authToken || localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

      const response = await fetch(`${apiBaseUrl}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          judul: judul.trim(),
          deskripsi: deskripsi.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setStatus('success');
      setJudul('');
      setDeskripsi('');

      // Auto close after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Error submitting report:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Gagal mengirim laporan');
    }
  };

  const resetForm = () => {
    setJudul('');
    setDeskripsi('');
    setStatus('idle');
    setErrorMessage('');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  return (
    <>
      {/* Bubble Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-[#D0B064] to-[#C9A355] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-40"
        aria-label="Open report form"
      >
        <MessageCircle className="w-8 h-8" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Report Modal */}
      <div
        className={`fixed bottom-24 right-8 w-96 bg-white rounded-2xl shadow-2xl z-50 transition-all transform ${
          isOpen 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-75 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D0B064] to-[#C9A355] px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Laporkan Masalah</h3>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'success' ? (
            // Success Message
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">Laporan Terkirim!</h4>
              <p className="text-gray-600 text-center text-sm">
                Terima kasih telah melaporkan masalah. Tim kami akan segera menanganinya.
              </p>
            </div>
          ) : (
            // Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Judul Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Judul Laporan
                </label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Issue dengan monitoring"
                  disabled={status === 'loading'}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0B064] focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>

              {/* Deskripsi Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi Detail
                </label>
                <textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan masalah yang Anda alami..."
                  disabled={status === 'loading'}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0B064] focus:border-transparent transition-all resize-none disabled:bg-gray-100"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading' || !judul.trim() || !deskripsi.trim()}
                className="w-full bg-gradient-to-r from-[#D0B064] to-[#C9A355] text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Laporan
                  </>
                )}
              </button>

              {/* Info Text */}
              <p className="text-xs text-gray-500 text-center">
                Laporan Anda akan ditinjau oleh tim support kami
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

// MinistryLayout Component
const MinistryLayout = ({ children, currentPage = 'dashboard' }: MinistryLayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [authToken, setAuthToken] = useState("");
  
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
    const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

    if (userData && token) {
      setAuthToken(token);
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
      localStorage.removeItem('mbg_token');
      localStorage.removeItem('authToken');
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
            <div className="flex-1 flex justify-center gap-8">
              {topTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-base font-semibold pb-1 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-[#D0B064] text-white'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-white/30'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

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

      {/* BubbleReport Component */}
      <BubbleReport 
        apiBaseUrl={API_BASE_URL}
        authToken={authToken}
      />
    </div>
  );
};

export default MinistryLayout;