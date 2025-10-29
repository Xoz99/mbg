'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/Adminbiasalayout';
import {
  Building2, Users, Truck, Loader2, AlertCircle, MessageSquare
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL||'https://demombgv1.xyz';

interface DashboardStats {
  totalDapur: number;
  totalSekolah: number;
  totalDriver: number;
  totalKaryawan: number;
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

const AdminUserDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalDapur: 0,
    totalSekolah: 0,
    totalDriver: 0,
    totalKaryawan: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');
      const userData = localStorage.getItem('mbg_user');

      console.log('=== AUTH CHECK DEBUG ===');
      console.log('Token exists:', !!token);

      if (!token || !userData) {
        console.log('No token or user data, redirecting to login');
        router.push('/auth/login');
        return;
      }

      try {
        const user = JSON.parse(userData);
        const role = user.role || user.routeRole;

        console.log('Extracted role:', role);

        // Only ADMIN role can access this dashboard
        if (role !== 'ADMIN') {
          console.log(`Wrong role: ${role}, redirecting to /admin/dapur`);
          router.push('/admin/dapur');
          return;
        }

        console.log('Auth check passed, setting token');
        setAuthToken(token);
      } catch (err) {
        console.error('Error parsing user data:', err);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, []);

  // Fetch stats & recent tickets
  const fetchStats = useCallback(
    async () => {
      if (!authToken) {
        console.error('No auth token');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('=== DEBUG FETCH STATS (ADMIN) ===');
        console.log('Auth token exists:', !!authToken);

        // ADMIN role mungkin tidak punya akses ke /api/dapur
        // Jadi kami set stats default dan hanya fetch tickets
        console.log('ADMIN role detected - stats data tidak tersedia (API restriction)');
        
        setStats({
          totalDapur: 0,
          totalSekolah: 0,
          totalDriver: 0,
          totalKaryawan: 0,
        });

        // Fetch recent tickets
        try {
          console.log('Fetching tickets from:', `${API_BASE_URL}/api/tickets?page=1&limit=5`);
          
          const ticketsRes = await fetch(`${API_BASE_URL}/api/tickets?page=1&limit=5`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('Tickets response status:', ticketsRes.status);

          if (ticketsRes.ok) {
            const ticketsData = await ticketsRes.json();
            console.log('Tickets data:', ticketsData);
            
            if (ticketsData.success && ticketsData.data?.tickets) {
              setRecentTickets(ticketsData.data.tickets);
            }
          } else {
            const errorText = await ticketsRes.text();
            console.error('Tickets error:', ticketsRes.status, errorText);
          }
        } catch (ticketErr) {
          console.error("Error fetching recent tickets:", ticketErr);
        }
      } catch (err: any) {
        console.error("Error in fetchStats:", err);
        setError(err.message || "Gagal mengambil data");
      } finally {
        setLoading(false);
      }
    },
    [authToken]
  );

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
    }, 5000);

    return () => clearInterval(interval);
  }, [recentTickets.length]);

  // Loading state
  if (loading) {
    return (
      <AdminLayout currentPage="dashboard">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>

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

        {/* Info Message - Stats not available */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Informasi</p>
            <p className="text-xs text-blue-700 mt-1">Data statistik tidak tersedia untuk role Admin. Gunakan menu Manajemen untuk melihat detail data.</p>
          </div>
        </div>

        {/* Main Stats Grid - Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Dapur */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dapur</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">-</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-lg">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Sekolah */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sekolah</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">-</p>
              </div>
              <div className="p-4 bg-green-100 rounded-lg">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Driver + Karyawan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Driver + Karyawan</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">-</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-lg">
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
            </div>
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
              <div className="relative h-64">
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
            <div className="p-4 pt-6 flex items-center justify-center gap-2 border-t border-gray-200 bg-gray-50">
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

        {/* No tickets message */}
        {!loading && recentTickets.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Tidak ada tickets terbaru</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserDashboard;