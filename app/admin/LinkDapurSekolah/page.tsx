// app/admin/LinkDapurSekolah/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { 
  Plus, X, Search 
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

const LinkDapurSekolahPage = () => {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dapurList, setDapurList] = useState<any[]>([]);
  const [sekolahList, setSekolahList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDapur, setSelectedDapur] = useState<any | null>(null);
  const [selectedSekolahIds, setSelectedSekolahIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'with-sekolah' | 'without-sekolah'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('mbg_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setAuthToken(token);
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      setLoading(true);
      const [dRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dapur?page=1&limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=100`, { headers: { Authorization: `Bearer ${token}` } })
       ]);
       
       if (dRes.ok && sRes.ok) {
         const dData = await dRes.json();
         const sData = await sRes.json();
         
         const dList = dData.data?.data || dData.data || dData || [];
         const sList = sData.data?.data || sData.data || sData || [];

         // Fetch links for each dapur to determine status
         const enrichedDapur = await Promise.all(dList.map(async (d: any) => {
            const linkRes = await fetch(`${API_BASE_URL}/api/dapur/${d.id}/link-sekolah`, { 
              headers: { Authorization: `Bearer ${token}` } 
            });
            const linkData = linkRes.ok ? await linkRes.json() : { data: [] };
            return { ...d, linkedSekolah: linkData.data || [] };
         }));

         setDapurList(enrichedDapur);
         setSekolahList(sList.map((s: any) => ({ 
            id: s.id, 
            name: s.nama || s.name 
         })));
       }
    } catch (err) {
      showToast('error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dapur: any) => {
    setSelectedDapur(dapur);
    setSelectedSekolahIds(dapur.linkedSekolah.map((s: any) => s.id));
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedDapur) return;
    try {
      setSubmitting(true);
      // Currently API only supports linking one by one via POST
      // or we might need a batch endpoint. Assuming standard behavior:
      const results = await Promise.all(selectedSekolahIds.map(sid => 
        fetch(`${API_BASE_URL}/api/dapur/${selectedDapur.id}/link-sekolah`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sekolahId: sid })
        })
      ));
      
      showToast('success', 'Hubungan dapur-sekolah diperbarui');
      setShowModal(false);
      fetchData(authToken);
    } catch (err) {
      showToast('error', 'Gagal menyimpan perubahan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDapur = dapurList.filter(d => {
    const matchesSearch = d.nama?.toLowerCase().includes(searchQuery.toLowerCase());
    const hasSekolah = d.linkedSekolah?.length > 0;
    if (statusFilter === 'with-sekolah') return matchesSearch && hasSekolah;
    if (statusFilter === 'without-sekolah') return matchesSearch && !hasSekolah;
    return matchesSearch;
  });

  const paginatedDapur = filteredDapur.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredDapur.length / itemsPerPage);

  if (loading) return (
    <AdminLayout currentPage="LinkDapurSekolah">
      <div className="flex items-center justify-center h-64 font-black uppercase italic animate-pulse">
        LOADING_SYSTEM_LINKS...
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="LinkDapurSekolah">
      <div className="space-y-6">
        {/* TOAST */}
        {toastMessage && (
          <div className={`fixed top-8 right-8 z-50 p-4 border-2 border-black font-black uppercase text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${toastMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}`}>
             {toastMessage.text}
          </div>
        )}

        {/* HEADER */}
        <div className="flex justify-between items-center border-b-4 border-black pb-4 text-black">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">KEBIJAKAN_HUBUNGAN</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">SINKRONISASI_DAPUR_KE_UNIT_SEKOLAH</p>
          </div>
          <div className="flex gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-black uppercase text-gray-400">TOTAL_DAPUR</span>
                <span className="text-xl font-black">{dapurList.length}</span>
             </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
           <div className="md:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">CARI_DAPUR</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-black" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-black font-black uppercase text-xs focus:bg-gray-50 outline-none" 
                  placeholder="NAMA_DAPUR..."
                />
              </div>
           </div>
           <div>
              <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">STATUS_LINK</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border-2 border-black font-black uppercase text-xs focus:bg-gray-50 outline-none appearance-none"
              >
                  <option value="all">SEMUA_DAPUR</option>
                  <option value="with-sekolah">TERPAUT_SEKOLAH</option>
                  <option value="without-sekolah">BELUM_TERPAUT</option>
              </select>
           </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {paginatedDapur.map(dapur => (
             <div key={dapur.id} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col justify-between min-h-[280px]">
                <div>
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-black flex items-center justify-center text-white font-black italic">
                         {dapur.nama[0]}
                      </div>
                      <span className={`text-[8px] font-black px-2 py-1 border-2 border-black uppercase ${dapur.linkedSekolah.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'}`}>
                         {dapur.linkedSekolah.length > 0 ? 'STATUS:TERPAUT' : 'STATUS:KOSONG'}
                      </span>
                   </div>
                   <h3 className="text-lg font-black uppercase tracking-tight mb-1">{dapur.nama}</h3>
                   <p className="text-[9px] font-black text-gray-400 uppercase truncate mb-4">{dapur.email || 'NO_EMAIL'}</p>
                   
                   <div className="border-t-2 border-dashed border-black pt-4">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2">SEKOLAH_PILIHAN:</p>
                      <div className="space-y-1">
                        {dapur.linkedSekolah.length > 0 ? (
                           dapur.linkedSekolah.slice(0, 3).map((s: any) => (
                             <div key={s.id} className="text-[10px] font-black uppercase flex items-center gap-2">
                                <div className="h-1 w-1 bg-black rounded-full"></div>
                                {s.name}
                             </div>
                           ))
                        ) : (
                           <p className="text-[10px] font-black text-red-500 uppercase italic">BELUM_ADA_LINK</p>
                        )}
                        {dapur.linkedSekolah.length > 3 && <p className="text-[9px] font-bold text-gray-400 mt-1">+{dapur.linkedSekolah.length - 3} LAINNYA</p>}
                      </div>
                   </div>
                </div>

                <div className="mt-6">
                   <button 
                     onClick={() => handleOpenModal(dapur)}
                     className="w-full py-3 bg-black text-white font-black uppercase text-xs tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                   >
                     <Plus className="w-4 h-4" />
                     {dapur.linkedSekolah.length > 0 ? 'EDIT_LINK' : 'HUBUNGKAN_SEKOLAH'}
                   </button>
                </div>
             </div>
           ))}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 py-8">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-3 border-4 border-black font-black uppercase text-xs disabled:opacity-30 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              PREV
            </button>
            <span className="font-black text-xl italic tracking-tighter">BLOCK_{currentPage}_OF_{totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-3 border-4 border-black font-black uppercase text-xs disabled:opacity-30 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              NEXT
            </button>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <div className="bg-white border-8 border-black w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[32px_32px_0px_0px_rgba(0,0,0,1)]">
              <div className="p-6 border-b-4 border-black flex justify-between items-center bg-gray-50">
                 <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">KONFIGURASI_LINK</h2>
                    <p className="text-xs font-black text-gray-500 uppercase">{selectedDapur?.nama}</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 border-4 border-black font-black hover:bg-black hover:text-white">[X]</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-white">
                 <div className="mb-6">
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">PILIH_SEKOLAH_UNIT</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {sekolahList.map(sekolah => {
                         const isSelected = selectedSekolahIds.includes(sekolah.id);
                         return (
                           <button
                             key={sekolah.id}
                             onClick={() => {
                               if (isSelected) setSelectedSekolahIds(prev => prev.filter(id => id !== sekolah.id));
                               else setSelectedSekolahIds(prev => [...prev, sekolah.id]);
                             }}
                             className={`p-3 border-2 font-black uppercase text-[10px] text-left transition-all ${isSelected ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,255,0,0.5)]' : 'bg-white text-black border-black hover:bg-gray-50'}`}
                           >
                             {sekolah.name}
                           </button>
                         );
                       })}
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t-4 border-black bg-gray-50 flex justify-end gap-4">
                 <button 
                   onClick={() => setShowModal(false)}
                   className="px-6 py-3 border-4 border-black font-black uppercase text-xs hover:bg-gray-200"
                 >
                   BATAL
                 </button>
                 <button 
                   onClick={handleSubmit}
                   disabled={submitting}
                   className="px-8 py-3 bg-black text-white font-black uppercase text-xs tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,255,0,1)] hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                 >
                   {submitting ? 'MENYIMPAN...' : 'SIMPAN_KONFIGURASI'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default LinkDapurSekolahPage;