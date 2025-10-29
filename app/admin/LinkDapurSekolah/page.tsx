'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Loader2, Search, Trash2, Plus, X, MapPin, Building2, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';

const SkeletonDapurCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-8 w-8 bg-gray-300 rounded"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-300 rounded w-full"></div>
      <div className="h-3 bg-gray-300 rounded w-5/6"></div>
    </div>
    <div className="flex gap-2 pt-3 border-t border-gray-200">
      <div className="flex-1 h-8 bg-gray-300 rounded"></div>
      <div className="flex-1 h-8 bg-gray-300 rounded"></div>
    </div>
  </div>
);

const SkeletonTableRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-gray-300 rounded w-4 h-4"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-300 rounded w-32"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-300 rounded w-40"></div></td>
    <td className="px-6 py-4"><div className="h-6 bg-gray-300 rounded w-20"></div></td>
    <td className="px-6 py-4"><div className="h-8 bg-gray-300 rounded w-16"></div></td>
  </tr>
);

const SkeletonLoadingScreen = () => (
  <div className="space-y-6 p-6">
    {/* Header Skeleton */}
    <div className="flex justify-between items-center animate-pulse">
      <div className="space-y-2">
        <div className="h-8 bg-gray-300 rounded w-48"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>
      <div className="h-10 bg-gray-300 rounded w-32"></div>
    </div>

    {/* Filter Skeleton */}
    <div className="flex gap-3 animate-pulse">
      <div className="h-10 bg-gray-300 rounded w-32"></div>
      <div className="h-10 bg-gray-300 rounded w-40"></div>
    </div>

    {/* Cards/Table Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <SkeletonDapurCard key={i} />
      ))}
    </div>
  </div>
);

// ===== HELPER FUNCTIONS =====
const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const autoDetectSekolahByRadius = (
  dapur: any,
  sekolahList: any[],
  radiusKm: number
): any[] => {
  if (!dapur.latitude || !dapur.longitude) {
    return [];
  }

  const sekolahInRadius = sekolahList
    .map((sekolah) => {
      if (!sekolah.latitude || !sekolah.longitude) {
        return null;
      }

      const distance = calculateDistance(
        dapur.latitude,
        dapur.longitude,
        sekolah.latitude,
        sekolah.longitude
      );

      return {
        ...sekolah,
        distance: Math.round(distance * 100) / 100,
      };
    })
    .filter((sekolah) => sekolah !== null && sekolah.distance <= radiusKm)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));

  return sekolahInRadius;
};

// ===== INTERFACE =====
interface Sekolah {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

interface DapurItem {
  id: string;
  nama: string;
  email?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  linkedSekolah?: Sekolah[];
}

// ===== MAIN COMPONENT =====
const LinkDapurSekolahPage = () => {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [dapurList, setDapurList] = useState<DapurItem[]>([]);
  const [sekolahList, setSekolahList] = useState<Sekolah[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedDapur, setSelectedDapur] = useState<DapurItem | null>(null);
  const [selectedSekolahIds, setSelectedSekolahIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'with-sekolah' | 'without-sekolah'>('without-sekolah');
  const [sekolahSearchQuery, setSekolahSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // ===== STATE AUTO-LINK =====
  const [radiusInput, setRadiusInput] = useState<number>(5);
  const [showAutoLinkModal, setShowAutoLinkModal] = useState(false);
  const [autoLinkResults, setAutoLinkResults] = useState<any[]>([]);
  const [selectedDapurForAutoLink, setSelectedDapurForAutoLink] = useState<DapurItem | null>(null);
  const [autoLinkLoading, setAutoLinkLoading] = useState(false);
  const [testingResults, setTestingResults] = useState<any>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
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
      const response = await fetch('https://demombgv1.xyz/api/dapur?page=1&limit=100', {
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

        const dapurWithLinks = dapurListData.map((d: any) => ({
          ...d,
          linkedSekolah: []
        }));

        setDapurList(dapurWithLinks);
      }
    } catch (err) {
      console.error('Error fetching dapur:', err);
      showToast('error', 'Gagal memuat data dapur');
    } finally {
      setLoading(false);
    }
  };

  const fetchSekolahList = async (token: string) => {
    try {
      const response = await fetch('https://demombgv1.xyz/api/sekolah?page=1&limit=100', {
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
          latitude: s.latitude,
          longitude: s.longitude,
        }));

        setSekolahList(mapped);
      }
    } catch (err) {
      console.error('Error fetching sekolah:', err);
    }
  };

  const fetchLinkedSekolah = async (dapurId: string): Promise<Sekolah[]> => {
    try {
      const linkUrl = `https://demombgv1.xyz/api/dapur/${dapurId}/link-sekolah`;

      const linkResponse = await fetch(linkUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (linkResponse.ok) {
        const linkData = await linkResponse.json();
        return linkData.data || [];
      } else {
        return [];
      }
    } catch (err) {
      console.error('Error fetching linked sekolah:', err);
      return [];
    }
  };

  const handleOpenModal = async (dapur: DapurItem) => {
    try {
      if (!dapur.id) {
        showToast('error', 'Data dapur tidak valid');
        return;
      }

      const linkedSekolah = await fetchLinkedSekolah(dapur.id);

      setSelectedDapur({
        ...dapur,
        linkedSekolah
      });
      setSelectedSekolahIds(linkedSekolah.map(s => s.id));
      setShowModal(true);
    } catch (err) {
      console.error('Error opening modal:', err);
      setSelectedDapur(dapur);
      setSelectedSekolahIds([]);
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

      const validSekolahIds = selectedSekolahIds
        .filter(id => id && typeof id === 'string' && id.trim() !== '');

      if (validSekolahIds.length === 0) {
        showToast('error', 'Tidak ada sekolah yang valid');
        return;
      }

      const response = await fetch(
        `https://demombgv1.xyz/api/dapur/${selectedDapur.id}/link-sekolah`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sekolahId: validSekolahIds[0] }),
        }
      );

      if (response.ok) {
        showToast('success', `${validSekolahIds.length} sekolah berhasil ditambahkan!`);
        handleCloseModal();
        await fetchDapurList(authToken);
      } else {
        showToast('error', `Error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error submitting:', err);
      showToast('error', 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== AUTO-LINK SUBMIT - FIXED WITH UI UPDATE =====
  const handleSubmitAutoLink = async () => {
    if (!selectedDapurForAutoLink || autoLinkResults.length === 0) {
      showToast('error', 'Data tidak lengkap');
      return;
    }

    try {
      setSubmitting(true);
      
      const sekolahIdsToLink = autoLinkResults
        .map(s => s.id)
        .filter(id => id && typeof id === 'string' && id.trim() !== '');

      if (sekolahIdsToLink.length === 0) {
        showToast('error', 'Tidak ada sekolah yang valid');
        setSubmitting(false);
        return;
      }

      const dapurId = selectedDapurForAutoLink.id;
      const endpoint = `https://demombgv1.xyz/api/dapur/${dapurId}/link-sekolah`;
      const results: any = { strategies: [] };

      console.log('🚀 LINKING SEKOLAH - CORRECT FORMAT');
      console.log('Endpoint:', endpoint);
      console.log('sekolahIds to link:', sekolahIdsToLink);
      console.log('Expected format: { sekolahId: "uuid" } (SINGULAR STRING)');

      // ===== CORRECT FORMAT - sekolahId (singular) - ONE BY ONE LOOP =====
      console.log('🔵 Using format: { sekolahId: "uuid" } - LOOP ONE BY ONE');
      
      let successCount = 0;
      let failedIds: string[] = [];
      const linkedResults: any[] = [];
      
      for (let i = 0; i < sekolahIdsToLink.length; i++) {
        const sekolahId = sekolahIdsToLink[i];
        try {
          console.log(`\n[${i + 1}/${sekolahIdsToLink.length}] Linking: ${sekolahId}`);
          
          const loopResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sekolahId: sekolahId }),  // ✅ CORRECT FORMAT
          });

          console.log(`  Response Status: ${loopResponse.status}`);

          if (loopResponse.ok) {
            const responseData = await loopResponse.json();
            console.log(`  ✅ SUCCESS - Response:`, responseData);
            successCount++;
            linkedResults.push({ sekolahId, status: 'success' });
          } else {
            console.log(`  ❌ FAILED - Status ${loopResponse.status}`);
            failedIds.push(sekolahId);
            linkedResults.push({ sekolahId, status: 'failed', statusCode: loopResponse.status });
          }
        } catch (e) {
          console.error(`  ❌ ERROR for ${sekolahId}:`, e);
          failedIds.push(sekolahId);
          linkedResults.push({ sekolahId, status: 'error', error: (e as any).message });
        }
      }

      results.strategies.push({
        name: 'sekolahId (singular) - LOOP',
        status: successCount > 0 ? 200 : 500,
        success: successCount > 0,
        successCount: successCount,
        failedCount: failedIds.length,
        linkedResults: linkedResults
      });

      setTestingResults(results);

      if (results.strategies[0].success) {
        showToast('success', `✅ ${successCount} sekolah berhasil di-link!`);
        setTimeout(() => {
          setShowAutoLinkModal(false);
          fetchDapurList(authToken);
        }, 1500);
      }
    } catch (err) {
      console.error('Error auto-linking:', err);
      showToast('error', 'Gagal melakukan auto-link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoDetect = async (dapur: DapurItem) => {
    try {
      setAutoLinkLoading(true);
      setSelectedDapurForAutoLink(dapur);

      const detected = autoDetectSekolahByRadius(dapur, sekolahList, radiusInput);

      if (detected.length === 0) {
        showToast('warning', `Tidak ada sekolah dalam radius ${radiusInput} km`);
        setAutoLinkResults([]);
        setShowAutoLinkModal(false);
        setAutoLinkLoading(false);
        return;
      }

      setAutoLinkResults(detected);
      setShowAutoLinkModal(true);
      setTestingResults(null);
    } catch (err) {
      console.error('Error in auto-detect:', err);
      showToast('error', 'Gagal melakukan auto-detect');
    } finally {
      setAutoLinkLoading(false);
    }
  };

  const handleDelete = async (dapurId: string) => {
    if (!confirm('Yakin ingin menghapus?')) return;

    try {
      const response = await fetch(`https://demombgv1.xyz/api/dapur/${dapurId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showToast('success', 'Data berhasil dihapus');
        await fetchDapurList(authToken);
      } else {
        showToast('error', `Error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error deleting:', err);
      showToast('error', 'Gagal menghapus data');
    }
  };

  // ===== FILTERING & PAGINATION =====
  const filteredDapurList = dapurList.filter(dapur => {
    const matchesSearch = dapur.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dapur.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const hasSekolah = dapur.linkedSekolah && dapur.linkedSekolah.length > 0;
    
    if (statusFilter === 'with-sekolah') return matchesSearch && hasSekolah;
    if (statusFilter === 'without-sekolah') return matchesSearch && !hasSekolah;
    return matchesSearch;
  });

  const paginatedDapurList = filteredDapurList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDapurList.length / itemsPerPage);

  // ===== RENDER =====
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* ===== TOAST ===== */}
        {toastMessage && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white z-50 ${
            toastMessage.type === 'success' ? 'bg-green-500' :
            toastMessage.type === 'error' ? 'bg-[#D0B064]' :
            toastMessage.type === 'warning' ? 'bg-yellow-500' :
            'bg-[#1B263A]'
          }`}>
            {toastMessage.text}
          </div>
        )}

        {/* ===== SKELETON LOADING ===== */}
        {loading && <SkeletonLoadingScreen />}

        {/* ===== MAIN CONTENT ===== */}
        {!loading && (
          <>
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Link Dapur & Sekolah</h1>
                <p className="text-gray-600 mt-1">Kelola hubungan antara dapur dan sekolah</p>
              </div>
              <button
                onClick={() => router.push('/admin/dapur')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: '#D0B064' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E60C00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D0B064'}
              >
                <Plus className="w-5 h-5" />
                Tambah Dapur
              </button>
            </div>

            {/* FILTER & SEARCH */}
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-64">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Cari</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama atau email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none transition-colors"
                    style={{ borderColor: '#1B263A', '--tw-ring-color': '#1B263A' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none transition-colors"
                  style={{ borderColor: '#1B263A' }}
                >
                  <option value="without-sekolah">Belum Link</option>
                  <option value="with-sekolah">Sudah Link</option>
                  <option value="all">Semua</option>
                </select>
              </div>
            </div>

            {/* NO DATA */}
            {filteredDapurList.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Tidak ada data dapur</p>
              </div>
            )}

            {/* DAPUR GRID */}
            {filteredDapurList.length > 0 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {paginatedDapurList.map((dapur) => {
                    const linkedCount = dapur.linkedSekolah?.length || 0;
                    const isLinked = linkedCount > 0;

                    return (
                      <div
                        key={dapur.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{dapur.nama}</h3>
                            {dapur.email && (
                              <p className="text-sm text-gray-600 truncate">{dapur.email}</p>
                            )}
                          </div>
                          {isLinked && (
                            <span
                              className="text-xs font-semibold text-white px-3 py-1 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#1B263A' }}
                            >
                              {linkedCount} Sekolah
                            </span>
                          )}
                        </div>

                        {dapur.phone && (
                          <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                            <span className="text-gray-400">📱</span> {dapur.phone}
                          </p>
                        )}

                        {isLinked && dapur.linkedSekolah && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Sekolah Terpaut:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {dapur.linkedSekolah.slice(0, 3).map(s => (
                                <li key={s.id}>• {s.name}</li>
                              ))}
                              {dapur.linkedSekolah.length > 3 && (
                                <li className="text-gray-500">+{dapur.linkedSekolah.length - 3} lainnya</li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleOpenModal(dapur)}
                            className="flex-1 px-3 py-2 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#1B263A' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#141B28'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1B263A'}
                          >
                            <Plus className="w-4 h-4" />
                            {isLinked ? 'Edit Link' : 'Link Sekolah'}
                          </button>

                          <button
                            onClick={() => handleAutoDetect(dapur)}
                            disabled={autoLinkLoading}
                            className="flex-1 px-3 py-2 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#D0B064', opacity: autoLinkLoading ? 0.6 : 1 }}
                            onMouseEnter={(e) => !autoLinkLoading && (e.currentTarget.style.backgroundColor = '#E60C00')}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D0B064'}
                          >
                            {autoLinkLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <MapPin className="w-4 h-4" />
                                Auto-Detect
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(dapur.id)}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === i + 1
                            ? 'text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: currentPage === i + 1 ? '#1B263A' : 'transparent'
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ===== MODAL: Link Sekolah ===== */}
            {showModal && selectedDapur && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 text-white px-6 py-5 flex justify-between items-center" style={{ backgroundColor: '#1B263A' }}>
                    <div>
                      <p className="text-sm opacity-80">Kelola Link Sekolah</p>
                      <h3 className="text-lg font-bold">{selectedDapur.nama}</h3>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Cari Sekolah</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cari nama sekolah..."
                          value={sekolahSearchQuery}
                          onChange={(e) => setSekolahSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                          style={{ '--tw-ring-color': '#1B263A' }}
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
                                className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                                style={{ '--tw-ring-color': '#1B263A' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{sekolah.name}</p>
                                {sekolah.email && (
                                  <p className="text-xs text-gray-600 truncate">{sekolah.email}</p>
                                )}
                              </div>
                              {isLinked && (
                                <span className="text-xs font-semibold text-white px-2 py-1 rounded flex-shrink-0" style={{ backgroundColor: '#1B263A' }}>
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
                      className="flex-1 px-4 py-2 text-white rounded-lg hover:brightness-110 transition-all font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#D0B064' }}
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

            {/* ===== MODAL: Auto-Link Results ===== */}
            {showAutoLinkModal && selectedDapurForAutoLink && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 text-white px-6 py-5 flex justify-between items-center" style={{ backgroundColor: '#D0B064' }}>
                    <div>
                      <p className="text-sm opacity-80">Auto-Detect Sekolah</p>
                      <h3 className="text-lg font-bold">{selectedDapurForAutoLink.nama}</h3>
                    </div>
                    <button
                      onClick={() => setShowAutoLinkModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm" style={{ color: '#1B263A' }}>
                        <strong>{autoLinkResults.length} sekolah ditemukan</strong> dalam radius{' '}
                        <strong>{radiusInput} km</strong>
                      </p>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {autoLinkResults.map((sekolah) => (
                        <div
                          key={sekolah.id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm">{sekolah.name}</h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#1B263A' }}>
                              {sekolah.distance} km
                            </span>
                          </div>
                          {sekolah.email && (
                            <p className="text-xs text-gray-600">{sekolah.email}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Testing Results Display */}
                    {testingResults && (
                      <div className={`border-2 rounded-lg p-4 space-y-3 ${
                        testingResults.strategies?.[0]?.success 
                          ? 'border-green-300 bg-green-50'
                          : 'border-red-300 bg-red-50'
                      }`}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            testingResults.strategies?.[0]?.success ? 'text-green-600' : 'text-red-600'
                          }`} />
                          <div>
                            <h4 className={`font-semibold ${
                              testingResults.strategies?.[0]?.success ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {testingResults.strategies?.[0]?.success ? '✅ Berhasil!' : '❌ Gagal'}
                            </h4>
                          </div>
                        </div>
                        
                        {showErrorDetails && (
                          <div className="space-y-2 text-xs font-mono bg-white rounded p-3 border">
                            <div className="font-semibold">Linked Results:</div>
                            {testingResults.strategies?.[0]?.linkedResults?.map((r: any, idx: number) => (
                              <div key={idx} className={`flex items-start gap-2 py-1 ${
                                r.status === 'success' ? 'text-green-700' : 'text-red-700'
                              }`}>
                                <span className="w-20 font-semibold">{r.status === 'success' ? '✅' : '❌'} {r.status}</span>
                                <span className="flex-1 break-all">{r.sekolahId}</span>
                                {r.statusCode && <span className="text-gray-600">({r.statusCode})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-2 sticky bottom-0">
                    <button
                      onClick={() => setShowAutoLinkModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={handleSubmitAutoLink}
                      disabled={submitting || testingResults?.allFailed}
                      className="flex-1 px-4 py-2 text-white rounded-lg hover:brightness-110 transition-all font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#D0B064' }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Linking...
                        </>
                      ) : testingResults?.allFailed ? (
                        '❌ Link Gagal'
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          Link {autoLinkResults.length} Sekolah
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default LinkDapurSekolahPage;