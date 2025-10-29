'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Building2, Users, Truck, Loader2, AlertCircle, TrendingUp, MessageSquare
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL||'https://demombgv1.xyz';

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

  useEffect(() => {
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
  }, [router]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!authToken) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch dapur
      const dapurRes = await fetch(`${API_BASE_URL}/api/dapur?page=1&limit=1000`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!dapurRes.ok) {
        throw new Error(`Failed to fetch dapur (${dapurRes.status})`);
      }

      const dapurData = await dapurRes.json();
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

      // Fetch sekolah
      const sekolahRes = await fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=1000`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!sekolahRes.ok) {
        throw new Error(`Failed to fetch sekolah (${sekolahRes.status})`);
      }

      const sekolahData = await sekolahRes.json();
      let sekolahList = [];
      
      if (sekolahData.data?.data && Array.isArray(sekolahData.data.data)) {
        sekolahList = sekolahData.data.data;
      } else if (sekolahData.data && Array.isArray(sekolahData.data)) {
        sekolahList = sekolahData.data;
      }

      setStats({
        totalDapur: dapurList.length,
        totalSekolah: sekolahList.length,
        totalDriver,
        totalKaryawan,
        dapurDenganPIC,
        dapurTanpaPIC,
      });

      // Fetch recent tickets
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

  // Loading state
  if (loading) {
    return (
      <AdminLayout currentPage="dashboard">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activities Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>
            <div className="divide-y divide-gray-200">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-100 rounded w-64 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-1">Overview sistem MBG secara keseluruhan</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Dapur */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dapur</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalDapur}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.dapurDenganPIC} dengan PIC
                </p>
              </div>
              <div className="p-4 bg-blue-100 rounded-lg">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Sekolah */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sekolah</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalSekolah}</p>
                <p className="text-xs text-gray-500 mt-2">Terdaftar dalam sistem</p>
              </div>
              <div className="p-4 bg-green-100 rounded-lg">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Driver + Karyawan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Driver + Karyawan</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalDriver + stats.totalKaryawan}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.totalDriver} driver, {stats.totalKaryawan} karyawan
                </p>
              </div>
              <div className="p-4 bg-purple-100 rounded-lg">
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Warning - Dapur Tanpa PIC */}
        {stats.dapurTanpaPIC > 0 && (
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">⚠️ Dapur Tanpa PIC</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.dapurTanpaPIC} dapur</p>
                <p className="text-sm text-yellow-700 mt-1">Segera ditunjukkan PIC untuk mengelola dapur</p>
              </div>
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Register PIC Dapur */}
            <a
              href="/admin/register-pic"
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="p-3 bg-blue-100 rounded-lg mb-3 w-fit group-hover:bg-blue-200 transition-colors">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Register PIC Dapur</p>
              <p className="text-xs text-gray-500 mt-1">Tambah PIC baru</p>
            </a>

            {/* Register PIC Sekolah */}
            <a
              href="/admin/register-pic-sekolah"
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-green-300 transition-all group"
            >
              <div className="p-3 bg-green-100 rounded-lg mb-3 w-fit group-hover:bg-green-200 transition-colors">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Register PIC Sekolah</p>
              <p className="text-xs text-gray-500 mt-1">Tambah PIC baru</p>
            </a>

            {/* User Management */}
            <a
              href="/admin/user"
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-purple-300 transition-all group"
            >
              <div className="p-3 bg-purple-100 rounded-lg mb-3 w-fit group-hover:bg-purple-200 transition-colors">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">User Management</p>
              <p className="text-xs text-gray-500 mt-1">Kelola pengguna</p>
            </a>

            {/* Manajemen Dapur */}
            <a
              href="/admin/dapur"
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-orange-300 transition-all group"
            >
              <div className="p-3 bg-orange-100 rounded-lg mb-3 w-fit group-hover:bg-orange-200 transition-colors">
                <Building2 className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Manajemen Dapur</p>
              <p className="text-xs text-gray-500 mt-1">Lihat semua dapur</p>
            </a>

            {/* Manajemen Sekolah */}
            <a
              href="/admin/sekolah"
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-indigo-300 transition-all group"
            >
              <div className="p-3 bg-indigo-100 rounded-lg mb-3 w-fit group-hover:bg-indigo-200 transition-colors">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Manajemen Sekolah</p>
              <p className="text-xs text-gray-500 mt-1">Lihat semua sekolah</p>
            </a>

            {/* Laporan Tiketing */}
            <a
              href="/admin/tickets"
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-red-300 transition-all group"
            >
              <div className="p-3 bg-red-100 rounded-lg mb-3 w-fit group-hover:bg-red-200 transition-colors">
                <MessageSquare className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Laporan Tiketing</p>
              <p className="text-xs text-gray-500 mt-1">Lihat semua tickets</p>
            </a>

            {/* Dapur Ke Sekolah */}
            <a
              href="/admin/LinkDapurSekolah"
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-cyan-300 transition-all group"
            >
              <div className="p-3 bg-cyan-100 rounded-lg mb-3 w-fit group-hover:bg-cyan-200 transition-colors">
                <Truck className="w-5 h-5 text-cyan-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Dapur Ke Sekolah</p>
              <p className="text-xs text-gray-500 mt-1">Link dapur & sekolah</p>
            </a>

            {/* Pengaturan Sistem */}
            <a
              href="/admin/settings"
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="p-3 bg-gray-100 rounded-lg mb-3 w-fit group-hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Pengaturan Sistem</p>
              <p className="text-xs text-gray-500 mt-1">Konfigurasi sistem</p>
            </a>
          </div>
        </div>

        {/* Recent Tickets Carousel */}
        {recentTickets.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Tickets Terbaru</h3>
                <span className="ml-auto text-xs text-gray-500">
                  {currentTicketIndex + 1} / {recentTickets.length}
                </span>
              </div>
            </div>

            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              {/* Tickets */}
              <div className="relative h-48">
                {recentTickets.map((ticket, index) => {
                  const createdDate = new Date(ticket.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  const isActive = index === currentTicketIndex;

                  return (
                    <div
                      key={ticket.id}
                      className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out ${
                        isActive
                          ? 'opacity-100 translate-x-0'
                          : index < currentTicketIndex
                          ? 'opacity-0 -translate-x-full'
                          : 'opacity-0 translate-x-full'
                      }`}
                    >
                      <div className="flex items-start gap-4 h-full">
                        <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 h-fit">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <p className="font-semibold text-gray-900 line-clamp-1">{ticket.judul}</p>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-3 flex-1">{ticket.deskripsi}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                            <span className="truncate">{ticket.user.name}</span>
                            <span className="flex-shrink-0 ml-2">{createdDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() =>
                  setCurrentTicketIndex(
                    (prev) => (prev - 1 + recentTickets.length) % recentTickets.length
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-lg shadow-md transition-all"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentTicketIndex((prev) => (prev + 1) % recentTickets.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-lg shadow-md transition-all"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="pt-3 flex items-center justify-center gap-2 border-t border-gray-200 bg-gray-50">
              {recentTickets.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTicketIndex(index)}
                  className={`transition-all ${
                    index === currentTicketIndex
                      ? 'w-8 h-2 bg-blue-600 rounded-full'
                      : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400'
                  }`}
                  aria-label={`Go to ticket ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;