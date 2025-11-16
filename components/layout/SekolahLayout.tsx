'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSekolahData } from '@/lib/hooks/useSekolahData';
import {
  Home,
  GraduationCap,
  MapPin,
  ClipboardCheck,
  Menu,
  X,
  LogOut,
  AlertCircle,
  Loader2,
  BookOpen,
  MessageCircle,
  Send,
  CheckCircle,
  ChevronDown
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL||'https://demombgv1.xyz';

interface SekolahLayoutProps {
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
  apiBaseUrl = "https://demombgv1.xyz",
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
                  placeholder="Contoh: Issue dengan login"
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

// SekolahLayout Component
const SekolahLayout = ({ children, currentPage = 'dashboard' }: SekolahLayoutProps) => {
  const router = useRouter();
  const { loading, error, sekolahInfo, clearCache } = useSekolahData();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>('data');

  // Auto-expand menu based on currentPage
  useEffect(() => {
    const getNavigation = () => {
      return [
        { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/sekolah/dashboard' },
        {
          id: 'data',
          name: 'Data',
          icon: GraduationCap,
          hasSubmenu: true,
          submenu: [
            { id: 'siswa', name: 'Data Siswa', path: '/sekolah/siswa' },
            { id: 'kelas', name: 'Data Kelas', path: '/sekolah/kelas' },
            { id: 'kalender-akademik', name: 'Kalender Akademik', path: '/sekolah/kalender-akademik' }
          ]
        },
        {
          id: 'operasional',
          name: 'Operasional',
          icon: ClipboardCheck,
          hasSubmenu: true,
          submenu: [
            { id: 'presensi', name: 'Presensi Siswa', path: '/sekolah/presensi' },
            { id: 'absensi', name: 'Absensi Penerima', path: '/sekolah/absensi' },
            { id: 'tracking', name: 'Tracking MBG', path: '/sekolah/tracking' },
          ]
        },
      ]
    }

    const nav = getNavigation()
    // Find parent menu yang contains current page
    const parentMenu = nav.find((item: any) =>
      item.submenu?.some((subitem: any) => subitem.id === currentPage)
    )

    if (parentMenu) {
      setExpandedMenu(parentMenu.id)
    }
  }, [currentPage])

  const getNavigation = () => {
    return [
      { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/sekolah/dashboard' },
      
      // KATEGORI: DATA
      {
        id: 'data',
        name: 'Data',
        icon: GraduationCap,
        hasSubmenu: true,
        submenu: [
          { id: 'siswa', name: 'Data Siswa', path: '/sekolah/siswa' },
          { id: 'kelas', name: 'Data Kelas', path: '/sekolah/kelas' },
          { id: 'kalender-akademik', name: 'Kalender Akademik', path: '/sekolah/kalender-akademik' }
        ]
      },

      // KATEGORI: OPERASIONAL
      {
        id: 'operasional',
        name: 'Operasional',
        icon: ClipboardCheck,
        hasSubmenu: true,
        submenu: [
          { id: 'presensi', name: 'Presensi Siswa', path: '/sekolah/presensi' },
          { id: 'absensi', name: 'Absensi Penerima', path: '/sekolah/absensi' },
          { id: 'tracking', name: 'Tracking MBG', path: '/sekolah/tracking' },
        ]
      },
    ];
  };

  const navigation = getNavigation();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    // Clear sekolah data cache
    clearCache();

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

  const toggleMenu = (menuId: string) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
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

        {/* Sekolah Info Card */}
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
          {navigation.map((item: any) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isSubmenuOpen = expandedMenu === item.id;

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.hasSubmenu) {
                      toggleMenu(item.id);
                    } else {
                      handleNavigation(item.path);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-[#D0B064] text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium text-sm flex-1 text-left">{item.name}</span>
                      {item.hasSubmenu && (
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform ${
                            isSubmenuOpen ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Submenu dengan Animasi */}
                {item.hasSubmenu && sidebarOpen && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isSubmenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-0">
                      {item.submenu.map((subitem: any, index: number) => (
                        <button
                          key={subitem.id}
                          onClick={() => {
                            handleNavigation(subitem.path);
                            // Keep submenu open after navigation
                            // (state will update based on currentPage from parent)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm transform ${
                            isSubmenuOpen
                              ? 'translate-x-0 opacity-100'
                              : '-translate-x-2 opacity-0'
                          } ${
                            currentPage === subitem.id
                              ? 'bg-[#D0B064]/30 text-[#D0B064] font-medium'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                          style={{
                            transitionDelay: isSubmenuOpen ? `${index * 50}ms` : '0ms',
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                          <span className="text-left">{subitem.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

      {/* BubbleReport Component */}
      <BubbleReport
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
};

export default SekolahLayout;