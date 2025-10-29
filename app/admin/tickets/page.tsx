'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Search,
  AlertCircle,
  Loader2,
  ChevronRight,
  Clock,
  User,
  Mail,
  MessageSquare,
  X,
  Filter
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL||'https://demombgv1.xyz';

interface Ticket {
  id: string;
  judul: string;
  deskripsi: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface TicketsResponse {
  success: boolean;
  message: string;
  data: {
    tickets: Ticket[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// Skeleton Components
const SkeletonTicketCard = () => (
  <div className="bg-white rounded-lg p-4 border border-gray-100 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
      </div>
    </div>
    <div className="flex items-center justify-between text-sm">
      <div className="h-3 bg-gray-200 rounded w-32"></div>
      <div className="h-3 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

const TicketCard = ({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) => {
  const createdDate = new Date(ticket.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-4 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{ticket.judul}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{ticket.deskripsi}</p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-blue-600" />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="truncate">{ticket.user.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{createdDate}</span>
        </div>
      </div>
    </div>
  );
};

const TicketDetailModal = ({
  ticket,
  isOpen,
  onClose
}: {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !ticket) return null;

  const createdDate = new Date(ticket.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const updatedDate = new Date(ticket.updatedAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{ticket.judul}</h2>
              <p className="text-sm text-gray-500 mt-1">ID: {ticket.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Deskripsi */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Deskripsi</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{ticket.deskripsi}</p>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Informasi Pelapor</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Nama</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.user.role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Dibuat</p>
                <p className="font-medium text-gray-900">{createdDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Terakhir Diupdate</p>
                <p className="font-medium text-gray-900">{updatedDate}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const AdminTickets = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [userRole, setUserRole] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  const isFetchingRef = useRef(false);

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');
    const userData = localStorage.getItem('mbg_user');

    console.log('=== Tickets Page Auth ===');
    console.log('Token exists:', !!token);

    if (!token || !userData) {
      console.log('No token or user data, redirecting to login');
      router.push('/auth/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      const role = user.role || user.routeRole;

      console.log('User role:', role);

      // Allow both SUPERADMIN and ADMIN
      if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
        console.log('Role not allowed, redirecting to /admin/dashboard');
        router.push('/admin/dashboard');
        return;
      }

      console.log('Auth check passed for tickets page');
      setUserRole(role);
      setAuthToken(token);
    } catch (err) {
      console.error('Error parsing user data:', err);
      router.push('/auth/login');
    }
  }, [router]);

  // Fetch tickets
  const fetchTickets = useCallback(
    async (page = 1) => {
      if (!authToken || isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);

        console.log('Fetching tickets, page:', page);

        const response = await fetch(`${API_BASE_URL}/api/tickets?page=${page}&limit=10`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Tickets response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Tickets error:', errorText);
          throw new Error(`Failed to fetch tickets (${response.status})`);
        }

        const data: TicketsResponse = await response.json();

        console.log('Tickets data received:', data);

        if (data.success && data.data.tickets) {
          setTickets(data.data.tickets);
          setPagination(data.data.pagination);
        } else {
          throw new Error(data.message || 'Failed to fetch tickets');
        }
      } catch (err: any) {
        console.error('Error fetching tickets:', err);
        setError(err.message || 'Gagal memuat tickets');
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [authToken]
  );

  // Initial fetch
  useEffect(() => {
    if (authToken) {
      fetchTickets();
    }
  }, [authToken, fetchTickets]);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchSearch =
      ticket.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchRole = filterRole === '' || ticket.user.role === filterRole;

    return matchSearch && matchRole;
  });

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  // Loading state
  if (loading && tickets.length === 0) {
    return (
      <AdminLayout currentPage="tickets">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Semua Tickets</h1>
            <p className="text-gray-600 mt-1">Kelola semua laporan dari user</p>
          </div>

          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonTicketCard key={i} />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="tickets">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Semua Tickets</h1>
          <p className="text-gray-600 mt-1">Kelola semua laporan dari user (Total: {pagination.total})</p>
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

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari judul, deskripsi, atau nama user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Role */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Semua Role</option>
                <option value="PIC_SEKOLAH">PIC Sekolah</option>
                <option value="SUPERADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Results info */}
            <p className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold">{filteredTickets.length}</span> dari{' '}
              <span className="font-semibold">{pagination.total}</span> tickets
            </p>
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => handleTicketClick(ticket)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Tidak ada tickets yang sesuai dengan filter</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {pagination.page > 1 && (
              <button
                onClick={() => fetchTickets(pagination.page - 1)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Sebelumnya
              </button>
            )}

            <span className="text-sm text-gray-600">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>

            {pagination.page < pagination.totalPages && (
              <button
                onClick={() => fetchTickets(pagination.page + 1)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Selanjutnya
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </AdminLayout>
  );
};

export default AdminTickets;