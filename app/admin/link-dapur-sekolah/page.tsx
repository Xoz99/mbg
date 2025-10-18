'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Loader2, Search, Trash2, Plus, X, MapPin, Building2, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Sekolah {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface DapurItem {
  id: string;
  nama: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  linkedSekolah?: Sekolah[];
}

const LinkDapurSekolahPage = () => {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [dapurList, setDapurList] = useState<DapurItem[]>([]);
  const [sekolahList, setSekolahList] = useState<Sekolah[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedDapur, setSelectedDapur] = useState<DapurItem | null>(null);
  const [selectedSekolahIds, setSelectedSekolahIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'with-sekolah' | 'without-sekolah'>('without-sekolah');
  const [sekolahSearchQuery, setSekolahSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 2 baris x 3 kolom

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    const token = localStorage.getItem('mbg_token');

    if (!userData || !token) {
      router.push('/auth/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      const role = user.role || user.routeRole;

      if (role !== 'SUPERADMIN') {
        router.push('/auth/login');
        return;
      }

      setAuthToken(token);
      fetchDapurList(token);
      fetchSekolahList(token);
    } catch (error) {
      router.push('/auth/login');
    }
  }, [router]);

  const fetchDapurList = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://72.60.79.126:3000/api/dapur?page=1&limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let dapurListData = [];
        if (Array.isArray(data.data?.data)) {
          dapurListData = data.data.data;
        } else if (Array.isArray(data.data)) {
          dapurListData = data.data;
        } else if (Array.isArray(data)) {
          dapurListData = data;
        }

        const dapurWithLinks = await Promise.all(
          dapurListData.map(async (d: any) => {
            try {
              const linkResponse = await fetch(
                `http://72.60.79.126:3000/api/dapur/${d.id}/link-sekolah`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (linkResponse.ok) {
                const linkData = await linkResponse.json();
                return {
                  ...d,
                  linkedSekolah: linkData.data || []
                };
              }
              
              return { ...d, linkedSekolah: [] };
            } catch (err) {
              return { ...d, linkedSekolah: [] };
            }
          })
        );

        setDapurList(dapurWithLinks);
      }
    } catch (err) {
      showToast('error', 'Gagal memuat data dapur');
    } finally {
      setLoading(false);
    }
  };

  const fetchSekolahList = async (token: string) => {
    try {
      const response = await fetch('http://72.60.79.126:3000/api/sekolah?page=1&limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let sekolahListData = [];
        if (Array.isArray(data.data?.data)) {
          sekolahListData = data.data.data;
        } else if (Array.isArray(data.data)) {
          sekolahListData = data.data;
        } else if (Array.isArray(data)) {
          sekolahListData = data;
        }

        const mapped = sekolahListData.map((s: any) => ({
          id: s.id,
          name: s.nama || s.name,
          email: s.email,
          phone: s.phone,
        }));

        setSekolahList(mapped);
      }
    } catch (err) {
      console.log('Gagal load sekolah list');
    }
  };

  const handleOpenModal = async (dapur: DapurItem) => {
    try {
      // Coba fetch fresh linked sekolah data
      const linkResponse = await fetch(
        `http://72.60.79.126:3000/api/dapur/${dapur.id}/link-sekolah`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let linkedSekolah: Sekolah[] = dapur.linkedSekolah || [];
      
      if (linkResponse.ok) {
        const linkData = await linkResponse.json();
        linkedSekolah = linkData.data || dapur.linkedSekolah || [];
      }
      // Jika 404 atau error, gunakan data yang sudah ada di state

      setSelectedDapur({
        ...dapur,
        linkedSekolah
      });
      setSelectedSekolahIds(linkedSekolah.map(s => s.id));
      setShowModal(true);
    } catch (err) {
      // Fallback ke data lama jika error
      setSelectedDapur(dapur);
      setSelectedSekolahIds(dapur.linkedSekolah?.map(s => s.id) || []);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDapur(null);
    setSelectedSekolahIds([]);
    setSekolahSearchQuery('');
  };

  const handleSekolahToggle = (sekolahId: string) => {
    setSelectedSekolahIds(prev =>
      prev.includes(sekolahId)
        ? prev.filter(id => id !== sekolahId)
        : [...prev, sekolahId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedDapur || selectedSekolahIds.length === 0) {
      showToast('error', 'Pilih minimal 1 sekolah');
      return;
    }

    try {
      setSubmitting(true);

      // Filter hanya sekolah yang belum ter-link
      const alreadyLinkedIds = selectedDapur.linkedSekolah?.map(s => s.id) || [];
      let newSekolahIds = selectedSekolahIds.filter(id => !alreadyLinkedIds.includes(id));

      if (newSekolahIds.length === 0) {
        showToast('error', 'Semua sekolah yang dipilih sudah ter-link');
        return;
      }

      // Loop setiap sekolah baru dan buat link
      const failedSekolah: { sekolahId: string; reason: string }[] = [];
      const successSekolah: string[] = [];
      
      for (const sekolahId of newSekolahIds) {
        try {
          const response = await fetch(
            `http://72.60.79.126:3000/api/dapur/${selectedDapur.id}/link-sekolah`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sekolahId }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Jika error "already linked", treat sebagai success
            if (errorData.message?.toLowerCase().includes('already linked')) {
              successSekolah.push(sekolahId);
            } else {
              failedSekolah.push({ 
                sekolahId, 
                reason: errorData.message || `Error ${response.status}` 
              });
            }
          } else {
            successSekolah.push(sekolahId);
          }
        } catch (err) {
          failedSekolah.push({ 
            sekolahId, 
            reason: 'Network error' 
          });
        }
      }

      if (failedSekolah.length === 0) {
        showToast('success', `${successSekolah.length} sekolah berhasil di-link!`);
        handleCloseModal();
        // Refresh data dari backend
        await fetchDapurList(authToken);
      } else {
        const successCount = successSekolah.length;
        const failCount = failedSekolah.length;
        showToast('error', `${failCount} sekolah gagal. ${successCount} berhasil di-link.`);
        // Refresh data dari backend
        await fetchDapurList(authToken);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan link dapur ke sekolah');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async (dapurId: string, sekolahId: string) => {
    if (!window.confirm('Yakin ingin menghapus link ini?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://72.60.79.126:3000/api/dapur/${dapurId}/link-sekolah/${sekolahId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Gagal menghapus link');
      }

      showToast('success', 'Link berhasil dihapus!');
      await fetchDapurList(authToken);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus link');
    }
  };

  const filteredDapur = dapurList.filter(d =>
    d.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout currentPage="link-dapur-sekolah">
      <div className="space-y-6">
        {toastMessage && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg z-50 ${
            toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {toastMessage.text}
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Link Dapur ke Sekolah</h1>
          <p className="text-gray-600 mt-1">Kelola hubungan antara dapur dan sekolah</p>
        </div>

        {/* Search Bar + Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama dapur..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua Dapur ({dapurList.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('with-sekolah');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'with-sekolah'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sudah Ada Sekolah ({dapurList.filter(d => d.linkedSekolah && d.linkedSekolah.length > 0).length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('without-sekolah');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'without-sekolah'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Belum Ada Sekolah ({dapurList.filter(d => !d.linkedSekolah || d.linkedSekolah.length === 0).length})
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-28"></div>
              </div>
            ))}
          </div>
        ) : (() => {
          const filtered = filteredDapur.filter(d => {
            if (statusFilter === 'with-sekolah') return d.linkedSekolah && d.linkedSekolah.length > 0;
            if (statusFilter === 'without-sekolah') return !d.linkedSekolah || d.linkedSekolah.length === 0;
            return true;
          });

          // Pagination
          const totalPages = Math.ceil(filtered.length / itemsPerPage);
          const startIdx = (currentPage - 1) * itemsPerPage;
          const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage);

          return filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{searchQuery ? 'Tidak ada hasil pencarian' : 'Tidak ada data dapur'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedData.map((dapur) => (
                  <div
                    key={dapur.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#D0B064] transition-all group"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] p-5 text-white">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg leading-tight">{dapur.nama}</h3>
                          <p className="text-xs text-white/70 mt-1">{dapur.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {dapur.linkedSekolah && dapur.linkedSekolah.length > 0 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                            ✓ Terhubung dengan {dapur.linkedSekolah.length} sekolah
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            ⚠ Belum terhubung dengan sekolah
                          </span>
                        )}
                      </div>

                      {/* Sekolah Terhubung */}
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          Sekolah Terhubung
                        </h4>
                        
                        {dapur.linkedSekolah && dapur.linkedSekolah.length > 0 ? (
                          <div className="space-y-2">
                            {dapur.linkedSekolah.map((sekolah) => (
                              <div
                                key={sekolah.id}
                                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">{sekolah.name}</p>
                                  {sekolah.email && (
                                    <p className="text-xs text-gray-600 truncate">{sekolah.email}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleUnlink(dapur.id, sekolah.id)}
                                  className="p-1.5 ml-2 hover:bg-red-200 text-red-600 rounded transition-colors flex-shrink-0"
                                  title="Hapus link"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                            <p className="text-xs text-yellow-800">Belum ada sekolah terhubung</p>
                          </div>
                        )}

                        {/* Badge Count */}
                        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200">
                          {dapur.linkedSekolah?.length || 0} sekolah
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={() => handleOpenModal(dapur)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white rounded-lg hover:from-[#162031] hover:to-[#1f2a38] transition-all font-semibold text-sm shadow-sm hover:shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah Sekolah
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Modal */}
        {showModal && selectedDapur && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex justify-between items-center sticky top-0">
                <div>
                  <p className="text-sm text-white/80">Kelola Sekolah</p>
                  <h3 className="text-lg font-bold">{selectedDapur.nama}</h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Search Sekolah */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Cari Sekolah</label>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Ketik nama sekolah..."
                      value={sekolahSearchQuery}
                      onChange={(e) => setSekolahSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm">Pilih Sekolah</h4>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(() => {
                    const filtered = sekolahList.filter(s =>
                      s.name.toLowerCase().includes(sekolahSearchQuery.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {sekolahSearchQuery ? 'Tidak ada hasil pencarian' : 'Tidak ada data sekolah'}
                        </p>
                      );
                    }

                    return filtered.map((sekolah) => {
                      const isLinked = selectedDapur.linkedSekolah?.some(s => s.id === sekolah.id);
                      const isSelected = selectedSekolahIds.includes(sekolah.id);

                      return (
                        <label
                          key={sekolah.id}
                          className={`flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-200 hover:border-gray-300 ${
                            isLinked ? 'opacity-60 bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isLinked && handleSekolahToggle(sekolah.id)}
                            disabled={isLinked}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{sekolah.name}</p>
                            {sekolah.email && (
                              <p className="text-xs text-gray-600 truncate">{sekolah.email}</p>
                            )}
                          </div>
                          {isLinked && (
                            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded flex-shrink-0">
                              Sudah Link
                            </span>
                          )}
                        </label>
                      );
                    });
                  })()}
                </div>

                {selectedSekolahIds.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">Pilih minimal 1 sekolah untuk disimpan</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-2 sticky bottom-0">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || selectedSekolahIds.length === 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white rounded-lg hover:from-[#162031] hover:to-[#1f2a38] transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default LinkDapurSekolahPage;