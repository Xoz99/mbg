'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';

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

const SkeletonTicketRow = () => (
    <tr className="border-b-2 border-black animate-pulse">
        <td className="p-3"><div className="h-3 w-4 bg-gray-200"></div></td>
        <td className="p-3"><div className="h-4 w-48 bg-gray-200"></div></td>
        <td className="p-3"><div className="h-3 w-24 bg-gray-100"></div></td>
        <td className="p-3 text-right"><div className="h-8 w-20 bg-gray-200 ml-auto border-2 border-black"></div></td>
    </tr>
)

const AdminTickets = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [authToken, setAuthToken] = useState('');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
    });

    const isFetchingRef = useRef(false);

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
                if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
                    router.push('/admin/dashboard');
                    return;
                }
                setAuthToken(token);
            } catch (err) {
                router.push('/auth/login');
            }
        }
    }, [router]);

    const fetchTickets = useCallback(async (page = 1) => {
        if (!authToken || isFetchingRef.current) return;
        try {
            isFetchingRef.current = true;
            setLoading(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const res = await fetch(`${API_BASE_URL}/api/tickets?page=${page}&limit=20`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!res.ok) throw new Error('Gagal memuat tiket');
            const data: TicketsResponse = await res.json();
            if (data.success) {
                setTickets(data.data.tickets);
                setPagination(data.data.pagination);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [authToken]);

    useEffect(() => {
        if (authToken) fetchTickets();
    }, [authToken, fetchTickets]);

    const filteredTickets = tickets.filter(t => {
        const matchSearch = t.judul.toLowerCase().includes(searchQuery.toLowerCase()) || (t.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchRole = filterRole === '' || t.user?.role === filterRole;
        return matchSearch && matchRole;
    });

    const formatShareText = (ticket: Ticket) => {
        const createdDate = new Date(ticket.createdAt).toLocaleString('id-ID');
        return `📋 *LAPORAN TICKET* \nJudul: ${ticket.judul}\nDeskripsi: ${ticket.deskripsi}\nPelapor: ${ticket.user?.name || 'Sistem IoT'}\nWaktu: ${createdDate}\nID: ${ticket.id}`;
    };

    const handleShareWhatsApp = (ticket: Ticket) => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(formatShareText(ticket))}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <AdminLayout currentPage="tickets">
            <div className="space-y-6">
                {/* HEADER */}
                <div className="flex justify-between items-center border-b-4 border-black pb-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter">BRANKAS_TIKET_PUSAT</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">LOG_INSIDEN // TOTAL_LAPORAN: {pagination.total}</p>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-black bg-white p-3">
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">CARI_INSIDEN</label>
                        <input
                            type="text"
                            placeholder="NAMA / SUBJEK / ID..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-sm font-black uppercase outline-none"
                        />
                    </div>
                    <div className="border-2 border-black bg-white p-3">
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">TINGKAT_OTORITAS</label>
                        <select
                            value={filterRole}
                            onChange={e => setFilterRole(e.target.value)}
                            className="w-full bg-transparent text-sm font-black uppercase outline-none"
                        >
                            <option value="">SEMUA_SEKTOR</option>
                            <option value="PIC_SEKOLAH">PIC_SEKOLAH</option>
                            <option value="PIC_DAPUR">PIC_DAPUR</option>
                            <option value="SUPERADMIN">SUPERADMIN</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                </div>

                {/* TABLE */}
                <div className="relative border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden text-black">
                    {/* LOADING OVERLAY */}
                    {loading && tickets.length > 0 && (
                        <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="px-6 py-3 bg-black text-white font-black uppercase text-[10px] animate-bounce shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                LOADING_DATA...
                            </div>
                        </div>
                    )}
                    <table className="w-full text-left">
                        <thead className="bg-black text-white border-b-2 border-black">
                            <tr className="divide-x divide-white/20">
                                <th className="p-3 text-[10px] font-black uppercase tracking-widest w-16">URUT</th>
                                <th className="p-3 text-[10px] font-black uppercase tracking-widest">SUBJEK_INSIDEN</th>
                                <th className="p-3 text-[10px] font-black uppercase tracking-widest">ID_OPERATIF</th>
                                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-right">PROTOKOL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-black">
                            {loading && tickets.length === 0 ? (
                                Array(6).fill(0).map((_, i) => <SkeletonTicketRow key={i} />)
                            ) : filteredTickets.length === 0 ? (
                                <tr><td colSpan={4} className="p-12 text-center text-xs font-black text-gray-400 uppercase italic">BRANKAS_KOSONG</td></tr>
                            ) : (
                                filteredTickets.map((t, idx) => {
                                    const isIoT = !t.user;
                                    const isBasi = t.judul.toLowerCase().includes('basi') || t.deskripsi.toLowerCase().includes('basi');
                                    return (
                                        <tr key={t.id} className={`divide-x-2 divide-black hover:bg-gray-50 group cursor-pointer ${isBasi ? 'bg-red-50' : ''}`} onClick={() => { setSelectedTicket(t); setIsDetailOpen(true); }}>
                                            <td className="p-3 text-[9px] font-black text-gray-300 italic">{String(idx + 1).padStart(3, '0')}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    {isBasi && <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black animate-pulse">PERINGATAN_KRITIS</span>}
                                                    <p className="font-black text-xs uppercase truncate max-w-md italic">{t.judul}</p>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="leading-tight">
                                                    <p className="font-black text-[10px] uppercase">{isIoT ? 'SISTEM_AI_01' : t.user.name}</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Level: {isIoT ? 'STASIUN_SENSOR' : t.user.role}</p>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button className="px-3 py-1.5 bg-black text-white text-[8px] font-black uppercase tracking-widest hover:bg-gray-800 active:translate-y-0.5 transition-all">DEKRIPSI_LOG</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 py-4">
                        <button
                            onClick={() => fetchTickets(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="px-4 py-2 border-2 border-black text-[10px] font-black uppercase disabled:opacity-30 hover:bg-gray-50"
                        >
                            BLOK_SEBELUMNYA
                        </button>
                        <span className="text-xs font-black uppercase tracking-widest border-b-2 border-black pb-1 text-black">
                            SEGMEN_{pagination.page}_DARI_{pagination.totalPages}
                        </span>
                        <button
                            onClick={() => fetchTickets(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-4 py-2 border-2 border-black text-[10px] font-black uppercase disabled:opacity-30 hover:bg-gray-50"
                        >
                            BLOK_BERIKUTNYA
                        </button>
                    </div>
                )}

                {/* DETAIL MODAL */}
                {isDetailOpen && selectedTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-black">
                        <div className="bg-white border-[8px] border-black max-w-lg w-full shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
                             <div className="bg-black text-white p-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">DEKRIPSI_DATA</h2>
                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">ID_INSIDEN: {selectedTicket.id}</p>
                                </div>
                                <button
                                    onClick={() => setIsDetailOpen(false)}
                                    className="w-10 h-10 border-4 border-white flex items-center justify-center text-xs font-black hover:bg-white hover:text-black transition-all"
                                >
                                    [X]
                                </button>
                            </div>
                            <div className="p-8 space-y-8">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">DESKRIPSI_INSIDEN</label>
                                    <div className="bg-gray-50 border-4 border-black p-5">
                                        <h3 className="text-xl font-black uppercase italic leading-tight mb-4 text-black">{selectedTicket.judul}</h3>
                                        <p className="text-xs font-black text-gray-600 leading-relaxed uppercase tracking-tight break-words">{selectedTicket.deskripsi}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">NAMA_OPERATIF</label>
                                            <p className="font-black text-xs uppercase italic">{selectedTicket.user?.name || 'SISTEM_AI_IoT'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">LEVEL_OTORITAS</label>
                                            <p className="font-black text-xs uppercase italic text-gray-500">{selectedTicket.user?.role || 'STASIUN_SISTEM'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">WAKTU_KEJADIAN</label>
                                            <p className="font-black text-xs uppercase italic">{new Date(selectedTicket.createdAt).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">ID_SEKTOR</label>
                                            <p className="font-black text-xs uppercase italic text-gray-500">SEKTOR_ALPHA_01</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t-2 border-black flex flex-col gap-3">
                                    <button
                                        onClick={() => handleShareWhatsApp(selectedTicket)}
                                        className="w-full py-4 bg-green-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-green-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                                    >
                                        KIRIM_KE_WHATSAPP [+]
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(formatShareText(selectedTicket));
                                            alert('LOG_BERHASIL_DISALIN');
                                        }}
                                        className="w-full py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                                    >
                                        SALIN_DATA_KE_PAPAN_KLIP
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminTickets;