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
  MessageCircle,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface CSRLayoutProps {
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
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!,
  authToken = ""
}: BubbleReportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
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
      {/* Tombol Toggle & Bubble Group */}
      <div className="fixed bottom-8 right-8 z-50">
        {/* Tombol Toggle View (Eye/EyeOff) - Posisinya di atas icon utama seperti notif */}
        <button
          onClick={() => setShowBubble(!showBubble)}
          className={`absolute -top-2 -right-2 w-8 h-8 rounded-full shadow-lg transition-all flex items-center justify-center z-[51] border-2 border-white ${
            showBubble 
              ? 'bg-gray-100 text-gray-500 hover:bg-red-500 hover:text-white' 
              : 'bg-[#1B263A] text-[#D0B064] scale-125'
          }`}
          title={showBubble ? "Sembunyikan Menu" : "Tampilkan Menu"}
        >
          {showBubble ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Tombol Utama (Hanya muncul jika showBubble = true) */}
        {showBubble && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-gradient-to-br from-[#D0B064] to-[#C9A355] text-white rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center relative"
            aria-label="Open report form"
          >
            <MessageCircle className="w-8 h-8" />
          </button>
        )}
      </div>

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
                  placeholder="Contoh: Issue dengan laporan"
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

// CSRLayout Component
const CSRLayout = ({ children, currentPage = 'dashboard' }: CSRLayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authToken, setAuthToken] = useState("");
  
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
    const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

    if (userData && token) {
      setAuthToken(token);
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
        <div className="h-[88px] px-6 flex items-center justify-between border-b border-white/5">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D0B064] rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-white/10">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-white tracking-tight uppercase">CSR PARTNER</h2>
                  <p className="text-[10px] text-[#D0B064] font-bold uppercase tracking-widest leading-none truncate max-w-[120px]">
                    {csrInfo.nama}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="hover:bg-white/10 p-1.5 rounded-lg transition-colors text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="hover:bg-white/10 p-2.5 rounded-lg mx-auto transition-colors text-white/70 hover:text-white border border-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* CSR Info Card - Only when sidebar open */}
        {sidebarOpen && (
          <div className="mx-4 mt-6 mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Partner</p>
            <p className="text-sm font-semibold text-white truncate">{csrInfo.nama}</p>
            <p className="text-xs text-[#D0B064] font-medium mt-0.5">{csrInfo.kode}</p>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all border-l-4 ${isActive
                  ? 'bg-white/5 text-[#D0B064] border-[#D0B064] font-bold'
                  : 'text-white/50 border-transparent hover:bg-white/5 hover:text-white'
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
              <p className="text-[10px] uppercase tracking-widest text-[#D0B064] font-bold mb-0.5">CSR Partner</p>
              <h1 className="text-xl font-bold text-white capitalize">
                {currentPage === 'dashboard' ? 'Dashboard' : currentPage?.replace(/-/g, ' ')}
              </h1>
            </div>

            {/* CSR Badge - Flat & Minimalist */}
            <div className="flex items-center gap-3 px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white ml-auto">
              <div className="w-8 h-8 bg-[#D0B064] rounded-full flex items-center justify-center shadow-lg">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{csrInfo.kode}</p>
                <p className="font-bold text-white tracking-wide leading-tight text-sm line-clamp-1">{csrInfo.nama}</p>
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

export default CSRLayout;