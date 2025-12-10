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
  Filter,
  Bot,
  Share2,
  Copy,
  Check
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

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
  <div className="bg-white rounded-lg p-5 border border-gray-100 animate-pulse h-full flex flex-col">
    {/* Icon skeleton */}
    <div className="flex justify-center mb-4">
      <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
    </div>

    {/* Content skeleton */}
    <div className="flex-1 flex flex-col space-y-3">
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="h-5 bg-gray-200 rounded w-2/3 mx-auto"></div>
      </div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-100 rounded w-full"></div>
        <div className="h-4 bg-gray-100 rounded w-5/6 mx-auto"></div>
        <div className="h-4 bg-gray-100 rounded w-4/5 mx-auto"></div>
      </div>
    </div>

    {/* Footer skeleton */}
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
      <div className="h-3 bg-gray-100 rounded w-32 mx-auto"></div>
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

  const isIoTSystem = !ticket.user;
  const isIoTDetection = ticket.judul?.toLowerCase().includes('basi') ||
                         ticket.deskripsi?.toLowerCase().includes('basi');

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-5 border transition-all cursor-pointer h-full flex flex-col ${
        isIoTDetection
          ? 'border-red-200 hover:border-red-400 hover:shadow-lg hover:shadow-red-100'
          : 'border-gray-100 hover:border-blue-300 hover:shadow-lg'
      }`}
    >
      {/* Icon di atas */}
      <div className="flex justify-center mb-4">
        <div className={`p-4 rounded-xl ${
          isIoTDetection ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          {isIoTSystem ? (
            <Bot className={`w-8 h-8 ${isIoTDetection ? 'text-red-600' : 'text-blue-600'}`} />
          ) : (
            <MessageSquare className="w-8 h-8 text-blue-600" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col space-y-3">
        <h3 className="font-bold text-gray-900 text-center line-clamp-2 min-h-[3rem]">{ticket.judul}</h3>
        <p className="text-sm text-gray-600 text-center line-clamp-4 flex-1">{ticket.deskripsi}</p>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs">
          {isIoTSystem ? (
            <>
              <Bot className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-700">IoT System</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-gray-500" />
              <span className="truncate text-gray-600">{ticket.user?.name || 'Unknown'}</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
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
  const [copied, setCopied] = useState(false);

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

  const isIoTSystem = !ticket.user;

  // Format text untuk share
  const formatShareText = () => {
    const lines = [
      '📋 *LAPORAN TICKET*',
      '━━━━━━━━━━━━━━━━━━━━',
      '',
      `*Judul:*`,
      ticket.judul,
      '',
      `*Deskripsi:*`,
      ticket.deskripsi,
      '',
      '━━━━━━━━━━━━━━━━━━━━',
    ];

    if (isIoTSystem) {
      lines.push(
        `🤖 *Sumber:* Automated Alert - IoT System`,
        `⚠️ *Tipe:* Deteksi Makanan Basi / Expired`
      );
    } else {
      lines.push(
        `👤 *Pelapor:* ${ticket.user.name}`,
        `📧 *Email:* ${ticket.user.email}`,
        `🔑 *Role:* ${ticket.user.role}`
      );
    }

    lines.push(
      '',
      `📅 *Dibuat:* ${createdDate}`,
      `🔄 *Update:* ${updatedDate}`,
      `🆔 *Ticket ID:* ${ticket.id}`,
      '',
      '━━━━━━━━━━━━━━━━━━━━',
      '_Dikirim dari Sistem MBG_'
    );

    return lines.join('\n');
  };

  // Share ke WhatsApp
  const handleShareWhatsApp = () => {
    const text = formatShareText();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Copy to clipboard
  const handleCopyText = async () => {
    const text = formatShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Native share (jika support)
  const handleNativeShare = async () => {
    const text = formatShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket: ${ticket.judul}`,
          text: text
        });
      } catch (err) {
        console.error('Failed to share:', err);
      }
    } else {
      // Fallback ke copy
      handleCopyText();
    }
  };

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

            {/* User Info or IoT System Info */}
            {ticket.user ? (
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
            ) : (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Bot className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900">Automated Alert dari IoT System</h3>
                    <p className="text-xs text-amber-700 mt-1">Alert ini dibuat otomatis oleh sistem IoT untuk mendeteksi kondisi kritis</p>
                  </div>
                </div>
                <div className="space-y-2 mt-3 pt-3 border-t border-amber-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-amber-700 font-medium">Sumber</p>
                      <p className="text-sm text-amber-900 font-semibold">Sistem Monitoring Makanan (IoT Sensors)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-amber-700 font-medium">Tipe Alert</p>
                      <p className="text-sm text-amber-900 font-semibold">Deteksi Makanan Basi / Expired</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
          <div className="p-6 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              {/* Share Buttons Row */}
              <div className="grid grid-cols-3 gap-2">
                {/* WhatsApp Share */}
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  title="Share ke WhatsApp"
                >
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                {/* Copy Text */}
                <button
                  onClick={handleCopyText}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  title="Copy Text"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="hidden sm:inline">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 text-blue-600" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>

                {/* Native Share / Other */}
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  title="Share ke platform lain"
                >
                  <Share2 className="w-5 h-5 text-purple-600" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
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
      (ticket.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchRole = filterRole === '' || ticket.user?.role === filterRole;

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
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
                <option value="PIC_DAPUR">PIC Dapur</option>
                <option value="KEMENTRIAN">Kementrian</option>
                <option value="PEMPROV">Pemerintah Provinsi</option>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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