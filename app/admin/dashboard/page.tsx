'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { apiCache, generateCacheKey } from '@/lib/utils/cache';
// No icons used, staying minimalist with text and borders

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface DashboardStats {
  totalDapur: number;
  totalSekolah: number;
  totalDriver: number;
  totalKaryawan: number;
  dapurDenganPIC: number;
  dapurTanpaPIC: number;
}

interface Ticket {
  id: string;
  judul: string;
  deskripsi: string;
  createdAt: string;
  userId: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const AdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalDapur: 0,
    totalSekolah: 0,
    totalDriver: 0,
    totalKaryawan: 0,
    dapurDenganPIC: 0,
    dapurTanpaPIC: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const isInitialLoad = useRef(true);
  const lastLoadTimeRef = useRef<number>(0); // ✅ Track last load time untuk smart refresh

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');
      const userData = localStorage.getItem('mbg_user');

      if (!token || !userData) {
        router.push('/auth/login');
        return;
      }

    try {
      const user = JSON.parse(userData);
      const role = user.role || user.routeRole;

      if (role !== 'SUPERADMIN') {
        router.push('/admin/dapur');
        return;
      }

        setAuthToken(token);
      } catch (err) {
        router.push('/auth/login');
      }
    }
  }, [router]);

  // Fetch stats dengan smart caching
  const fetchStats = useCallback(async () => {
    if (!authToken) return;

    try {
      // ✅ Smart refresh: skip background refresh jika data sudah di-load < 25 detik lalu
      const now = Date.now();
      if (!isInitialLoad.current && (now - lastLoadTimeRef.current) < 25000) {
        console.log("[ADMIN DASHBOARD] Skipping refresh - data masih fresh");
        return;
      }
      lastLoadTimeRef.current = now;

      // Show loading hanya pada initial load
      if (isInitialLoad.current) {
        setLoading(true);
        isInitialLoad.current = false;
      }
      setError(null);

      // Parallel fetch dapur dan sekolah dengan smart cache
      const [dapurResult, sekolahResult] = await Promise.all([
        apiCache.smartFetch(
          generateCacheKey(`${API_BASE_URL}/api/dapur`, { page: 1, limit: 1000 }),
          () => fetch(`${API_BASE_URL}/api/dapur?page=1&limit=1000`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch dapur (${res.status})`);
            return res.json();
          }),
          10 * 60 * 1000 // ✅ Increase to 10 minute cache untuk performa lebih baik
        ),
        apiCache.smartFetch(
          generateCacheKey(`${API_BASE_URL}/api/sekolah`, { page: 1, limit: 1000 }),
          () => fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=1000`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch sekolah (${res.status})`);
            return res.json();
          }),
          10 * 60 * 1000 // ✅ Increase to 10 minute cache untuk performa lebih baik
        ),
      ]);

      // Process dapur data
      const dapurData = dapurResult.data;
      let dapurList = [];

      if (dapurData.data?.data && Array.isArray(dapurData.data.data)) {
        dapurList = dapurData.data.data;
      } else if (dapurData.data && Array.isArray(dapurData.data)) {
        dapurList = dapurData.data;
      }

      const dapurDenganPIC = dapurList.filter((d: any) => d.picDapur && d.picDapur.length > 0).length;
      const dapurTanpaPIC = dapurList.length - dapurDenganPIC;
      const totalKaryawan = dapurList.reduce((sum: number, d: any) => sum + (d._count?.karyawan || 0), 0);
      const totalDriver = dapurList.reduce((sum: number, d: any) => sum + (d.drivers?.length || 0), 0);

      // Process sekolah data
      const sekolahData = sekolahResult.data;
      let sekolahList = [];

      if (sekolahData.data?.data && Array.isArray(sekolahData.data.data)) {
        sekolahList = sekolahData.data.data;
      } else if (sekolahData.data && Array.isArray(sekolahData.data)) {
        sekolahList = sekolahData.data;
      }

      // Only update stats if data changed
      if (dapurResult.isNew || sekolahResult.isNew) {
        setStats({
          totalDapur: dapurList.length,
          totalSekolah: sekolahList.length,
          totalDriver,
          totalKaryawan,
          dapurDenganPIC,
          dapurTanpaPIC,
        });
      }

      // Fetch recent tickets (optional - doesn't need caching)
      try {
        const ticketsRes = await fetch(`${API_BASE_URL}/api/tickets?page=1&limit=5`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          if (ticketsData.success && ticketsData.data?.tickets) {
            setRecentTickets(ticketsData.data.tickets);
          }
        }
      } catch (ticketErr) {
        console.error("Error fetching recent tickets:", ticketErr);
        // Don't throw - tickets are optional
      }
    } catch (err: any) {
      console.error("Error fetching stats:", err);
      setError(err.message || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) {
      fetchStats();

      // ✅ Setup polling untuk real-time update setiap 30 detik (dari 10s)
      // Smart refresh logic akan skip jika data masih fresh
      const pollingInterval = setInterval(() => {
        fetchStats();
      }, 30000);

      return () => clearInterval(pollingInterval);
    }
  }, [authToken, fetchStats]);

  // Auto-scroll tickets carousel
  useEffect(() => {
    if (recentTickets.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTicketIndex((prev) => (prev + 1) % recentTickets.length);
    }, 5000); // Auto-next every 5 seconds

    return () => clearInterval(interval);
  }, [recentTickets.length]);

  // ✅ Skeleton loading state - tampil langsung saat awal masuk halaman
  const SkeletonContent = (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse-fast"></div>
        <div className="h-4 bg-gray-200 rounded w-96 animate-pulse-fast"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse-fast"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse-fast"></div>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse-fast"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activities Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse-fast"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse-fast"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2 animate-pulse-fast"></div>
                  <div className="h-3 bg-gray-100 rounded w-64 mb-2 animate-pulse-fast"></div>
                  <div className="h-3 bg-gray-100 rounded w-24 animate-pulse-fast"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ✅ Always show skeleton on initial load, data fetches in background
  if (loading) {
    return (
      <AdminLayout currentPage="dashboard">
        {SkeletonContent}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1 text-[10px] font-bold uppercase tracking-widest italic">Ringkasan Sistem MBG Secara Keseluruhan</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border-4 border-red-600 bg-red-50 p-6 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Terjadi Kesalahan</p>
            <p className="text-xs text-red-700 font-bold italic underline">{error}</p>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Dapur */}
          <div className="bg-white border-l-4 border-l-blue-600 border border-gray-200 p-6 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Dapur</p>
            <p className="text-5xl font-black text-gray-900 mt-2">{stats.totalDapur}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Status PIC</span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{stats.dapurDenganPIC} TERDATA</span>
            </div>
          </div>

          {/* Total Sekolah */}
          <div className="bg-white border-l-4 border-l-green-600 border border-gray-200 p-6 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Sekolah</p>
            <p className="text-5xl font-black text-gray-900 mt-2">{stats.totalSekolah}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Registrasi</span>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">AKTIF</span>
            </div>
          </div>

          {/* Total Driver + Karyawan */}
          <div className="bg-white border-l-4 border-l-purple-600 border border-gray-200 p-6 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Driver + Karyawan</p>
            <p className="text-5xl font-black text-gray-900 mt-2">{stats.totalDriver + stats.totalKaryawan}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">DRIVERS: <span className="text-black">{stats.totalDriver}</span></span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">STAFF: <span className="text-black">{stats.totalKaryawan}</span></span>
            </div>
          </div>
        </div>

        {/* Warning - Dapur Tanpa PIC */}
        {stats.dapurTanpaPIC > 0 && (
          <div className="bg-white border-2 border-red-600 p-6 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">PERHATIAN: TINDAKAN DIPERLUKAN</p>
                <p className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{stats.dapurTanpaPIC} Dapur Belum Memiliki PIC</p>
                <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest italic">Segera tentukan PIC untuk mengelola operasional dapur.</p>
              </div>
              <div className="px-4 py-2 border-2 border-red-600 text-red-600 font-black italic uppercase text-xs animate-pulse">
                URGENT
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Aksi Akses Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {/* Register PIC Dapur */}
            <a
              href="/admin/register-pic"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">REGISTRASI</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">PIC Dapur</p>
            </a>

            {/* Register PIC Sekolah */}
            <a
              href="/admin/register-pic-sekolah"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">REGISTRASI</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">PIC Sekolah</p>
            </a>

            {/* User Management */}
            <a
              href="/admin/user"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">MANAGEMENT</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">User List</p>
            </a>

            {/* Manajemen Dapur */}
            <a
              href="/admin/dapur"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">DRAFTER</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">Kelola Dapur</p>
            </a>

            {/* Manajemen Sekolah */}
            <a
              href="/admin/sekolah"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">DRAFTER</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">Kelola Sekolah</p>
            </a>

            {/* Laporan Tiketing */}
            <a
              href="/admin/tickets"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">HELPDESK</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">Tickets</p>
            </a>



            {/* Pengaturan Sistem */}
            <a
              href="/admin/settings"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">PREFERENCE</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">Settings</p>
            </a>
          </div>
        </div>

        {/* Recent Tickets Carousel */}
        {recentTickets.length > 0 && (
          <div className="bg-white border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-8">
            <div className="p-6 border-b-2 border-black bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-black">Tickets Terbaru</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 italic">
                Active Queue: {currentTicketIndex + 1} / {recentTickets.length}
              </span>
            </div>

            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              <div className="relative h-48">
                {recentTickets.map((ticket, index) => {
                  const createdDate = new Date(ticket.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  });

                  const isActive = index === currentTicketIndex;

                  return (
                    <div
                      key={ticket.id}
                      className={`absolute inset-0 p-8 transition-all duration-700 ease-in-out ${isActive
                        ? 'opacity-100 translate-x-0'
                        : index < currentTicketIndex
                          ? 'opacity-0 -translate-x-full'
                          : 'opacity-0 translate-x-full'
                        }`}
                    >
                      <div className="flex flex-col h-full border-l-4 border-l-black pl-6">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-gray-400 mb-1">{createdDate} | FROM: {ticket.user.name}</p>
                        <p className="font-black text-gray-900 uppercase tracking-tighter text-lg line-clamp-1">{ticket.judul}</p>
                        <p className="text-gray-500 text-xs mt-2 line-clamp-2 italic font-medium">{ticket.deskripsi}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="absolute right-6 bottom-6 flex gap-2">
                <button
                  onClick={() =>
                    setCurrentTicketIndex(
                      (prev) => (prev - 1 + recentTickets.length) % recentTickets.length
                    )
                  }
                  className="px-3 py-1 bg-white border border-black text-[9px] font-black tracking-widest hover:bg-black hover:text-white transition-all uppercase"
                >
                  PREV
                </button>
                <button
                  onClick={() => setCurrentTicketIndex((prev) => (prev + 1) % recentTickets.length)}
                  className="px-3 py-1 bg-white border border-black text-[9px] font-black tracking-widest hover:bg-black hover:text-white transition-all uppercase"
                >
                  NEXT
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 w-full overflow-hidden">
               <div 
                 className="h-full bg-black transition-all duration-500" 
                 style={{ width: `${((currentTicketIndex + 1) / recentTickets.length) * 100}%` }}
               ></div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;