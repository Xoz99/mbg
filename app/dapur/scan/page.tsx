'use client';

import { useState, useEffect } from 'react';
import DapurLayout from '@/components/layout/DapurLayout';
import { 
  CheckCircle, AlertCircle, Loader, RefreshCw, ChefHat, Package, 
  Boxes, Navigation, X, ZoomIn
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

enum TipeCheckpoint {
  MULAI_MEMASAK = 'MULAI_MEMASAK',
  SELESAI_MEMASAK = 'SELESAI_MEMASAK',
  SELESAI_PACKING = 'SELESAI_PACKING',
  SCHOOL_TO_DRIVER_RETURN = 'SCHOOL_TO_DRIVER_RETURN',
  DRIVER_TO_KITCHEN = 'DRIVER_TO_KITCHEN',
  KITCHEN_RECEIVED = 'KITCHEN_RECEIVED',
  WASHING_COMPLETE = 'WASHING_COMPLETE'
}

interface CheckpointType {
  id: TipeCheckpoint;
  label: string;
  description: string;
  icon: any;
  color: string;
  requiresPhoto: boolean;
}

interface CheckpointData {
  id: string;
  tipe: TipeCheckpoint;
  timestamp: string;
  catatan?: string;
  lokasi: string;
  pemindaiOleh: string;
  fotoUrl?: string;
}

const CheckpointViewPage = () => {
  const [menuHarianId, setMenuHarianId] = useState('');
  const [allMenus, setAllMenus] = useState<any[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [checkpointStatus, setCheckpointStatus] = useState<Record<TipeCheckpoint, CheckpointData | null>>({
    [TipeCheckpoint.MULAI_MEMASAK]: null,
    [TipeCheckpoint.SELESAI_MEMASAK]: null,
    [TipeCheckpoint.SELESAI_PACKING]: null,
    [TipeCheckpoint.SCHOOL_TO_DRIVER_RETURN]: null,
    [TipeCheckpoint.DRIVER_TO_KITCHEN]: null,
    [TipeCheckpoint.KITCHEN_RECEIVED]: null,
    [TipeCheckpoint.WASHING_COMPLETE]: null,
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [photoModal, setPhotoModal] = useState<{ isOpen: boolean; photoUrl: string; title: string }>({
    isOpen: false,
    photoUrl: '',
    title: ''
  });

  const checkpointTypes: CheckpointType[] = [
    { 
      id: TipeCheckpoint.MULAI_MEMASAK, 
      label: 'Mulai Memasak',
      description: 'Scan saat mulai proses memasak',
      icon: ChefHat,
      color: 'bg-orange-400',
      requiresPhoto: true
    },
    { 
      id: TipeCheckpoint.SELESAI_MEMASAK, 
      label: 'Selesai Memasak',
      description: 'Scan saat makanan selesai dimasak',
      icon: CheckCircle,
      color: 'bg-green-400',
      requiresPhoto: true
    },
    { 
      id: TipeCheckpoint.SELESAI_PACKING, 
      label: 'Selesai Packing',
      description: 'Scan saat packing selesai',
      icon: Boxes,
      color: 'bg-purple-400',
      requiresPhoto: true
    },
    { 
      id: TipeCheckpoint.SCHOOL_TO_DRIVER_RETURN, 
      label: 'Pickup Baki Kosong',
      description: 'Scan saat driver pickup baki kosong',
      icon: Package,
      color: 'bg-yellow-400',
      requiresPhoto: true
    },
    { 
      id: TipeCheckpoint.DRIVER_TO_KITCHEN, 
      label: 'Kembali ke Dapur',
      description: 'Scan saat dalam perjalanan kembali',
      icon: Navigation,
      color: 'bg-purple-500',
      requiresPhoto: false
    },
    { 
      id: TipeCheckpoint.KITCHEN_RECEIVED, 
      label: 'Baki Diterima Dapur',
      description: 'Scan saat baki kosong kembali ke dapur',
      icon: CheckCircle,
      color: 'bg-green-500',
      requiresPhoto: true
    },
    { 
      id: TipeCheckpoint.WASHING_COMPLETE, 
      label: 'Selesai Cuci Baki',
      description: 'Scan saat baki selesai dicuci',
      icon: RefreshCw,
      color: 'bg-blue-500',
      requiresPhoto: false
    }
  ];

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || '';
    }
    return '';
  };

  const fetchCheckpointsData = async (id: string) => {
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/menu-harian/${id}/checkpoint`,
        {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Menu Harian ID tidak ditemukan');
        }
        if (response.status === 401) {
          throw new Error('Unauthorized - Token tidak valid');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const checkpoints = result.data || result.checkpoints || [];

      const statusMap: Record<TipeCheckpoint, CheckpointData | null> = {
        [TipeCheckpoint.MULAI_MEMASAK]: null,
        [TipeCheckpoint.SELESAI_MEMASAK]: null,
        [TipeCheckpoint.SELESAI_PACKING]: null,
        [TipeCheckpoint.SCHOOL_TO_DRIVER_RETURN]: null,
        [TipeCheckpoint.DRIVER_TO_KITCHEN]: null,
        [TipeCheckpoint.KITCHEN_RECEIVED]: null,
        [TipeCheckpoint.WASHING_COMPLETE]: null,
      };

      checkpoints.forEach((cp: CheckpointData) => {
        statusMap[cp.tipe] = cp;
      });

      setCheckpointStatus(statusMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setCheckpointStatus({
        [TipeCheckpoint.MULAI_MEMASAK]: null,
        [TipeCheckpoint.SELESAI_MEMASAK]: null,
        [TipeCheckpoint.SELESAI_PACKING]: null,
        [TipeCheckpoint.SCHOOL_TO_DRIVER_RETURN]: null,
        [TipeCheckpoint.DRIVER_TO_KITCHEN]: null,
        [TipeCheckpoint.KITCHEN_RECEIVED]: null,
        [TipeCheckpoint.WASHING_COMPLETE]: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAllMenus = async () => {
      try {
        setLoadingMenus(true);
        const token = getAuthToken();
        
        // Fetch semua menu-planning dulu
        const planningRes = await fetch(`${API_BASE_URL}/api/menu-planning`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const planningData = await planningRes.json();
        const plannings = Array.isArray(planningData?.data?.data) ? planningData.data.data : 
                         Array.isArray(planningData?.data) ? planningData.data : [];
        
        const allMenusData: any[] = [];
        
        // Untuk setiap planning, fetch menu-harian
        for (const planning of plannings) {
          try {
            const menuRes = await fetch(`${API_BASE_URL}/api/menu-planning/${planning.id}/menu-harian`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            const menuData = await menuRes.json();
            const menus = Array.isArray(menuData?.data?.data) ? menuData.data.data :
                         Array.isArray(menuData?.data) ? menuData.data : [];
            
            // Add semua menus dari planning ini
            for (const menu of menus) {
              allMenusData.push({
                id: menu.id,
                nama: menu.namaMenu,
                tanggal: menu.tanggal,
                sekolahId: planning.sekolahId,
                sekolahNama: planning.sekolah?.nama || 'Unknown',
                displayText: `${menu.namaMenu} - ${new Date(menu.tanggal).toLocaleDateString('id-ID')} (${planning.sekolah?.nama || 'Unknown'})`
              });
            }
          } catch (err) {
            console.warn(`Gagal fetch menu untuk planning ${planning.id}:`, err);
          }
        }
        
        console.log('Loaded menus:', allMenusData);
        setAllMenus(allMenusData);
      } catch (err) {
        console.error('Gagal load menus:', err);
        setAllMenus([]);
      } finally {
        setLoadingMenus(false);
      }
    };
    
    loadAllMenus();
  }, []);

  const handleSearch = () => {
    if (menuHarianId.trim()) {
      fetchCheckpointsData(menuHarianId);
    } else {
      setError('Masukkan Menu Harian ID terlebih dahulu');
    }
  };

  const completedCount = Object.values(checkpointStatus).filter(c => c !== null).length;
  const totalCount = Object.keys(checkpointStatus).length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <DapurLayout currentPage="scan">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B263A] mb-1">Checkpoint Status</h1>
        <p className="text-gray-600">Lihat progress checkpoint untuk menu harian</p>
      </div>

      <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div>
          <label className="block text-sm font-bold text-[#1B263A] mb-2">
            Pilih Menu Harian <span className="text-red-500">*</span>
          </label>
          {loadingMenus ? (
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              <Loader className="w-4 h-4 inline animate-spin mr-2" />
              Loading menu...
            </div>
          ) : (
            <select
              value={menuHarianId}
              onChange={(e) => {
                const selectedId = e.target.value;
                setMenuHarianId(selectedId);
                setHasSearched(false);
                setCheckpointStatus({
                  [TipeCheckpoint.MULAI_MEMASAK]: null,
                  [TipeCheckpoint.SELESAI_MEMASAK]: null,
                  [TipeCheckpoint.SELESAI_PACKING]: null,
                  [TipeCheckpoint.SCHOOL_TO_DRIVER_RETURN]: null,
                  [TipeCheckpoint.DRIVER_TO_KITCHEN]: null,
                  [TipeCheckpoint.KITCHEN_RECEIVED]: null,
                  [TipeCheckpoint.WASHING_COMPLETE]: null,
                });
                
                // Auto-fetch checkpoint saat pilih menu
                if (selectedId.trim()) {
                  fetchCheckpointsData(selectedId);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent bg-white"
            >
              <option value="">-- Pilih Menu --</option>
              {allMenus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.displayText}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-12">
          <p className="text-gray-500">Masukkan Menu Harian ID untuk melihat status checkpoint</p>
        </div>
      )}

      {loading && hasSearched && (
        <>
          {/* Skeleton for Progress Bar */}
          <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden animate-pulse"></div>
            </div>
          </div>

          {/* Skeleton for Checkpoint Cards */}
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="rounded-2xl border-2 border-gray-200 bg-white p-6">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {hasSearched && !loading && (
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#1B263A]">Progress Checkpoint</h3>
              <span className="text-lg font-bold text-[#D0B064]">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#D0B064] to-[#D0B064] h-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          {completedCount === totalCount && (
            <div className="mt-4 p-4 bg-[#1B263A] bg-opacity-5 border border-[#D0B064] rounded-lg">
              <p className="text-[#F2F9F8] font-bold text-center">✓ Semua checkpoint sudah selesai!</p>
            </div>
          )}
        </div>
      )}

      {hasSearched && !loading && (
        <>
          <h2 className="text-xl font-bold text-[#1B263A] mb-6">Status Checkpoint</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checkpointTypes.map((checkpoint) => {
              const data = checkpointStatus[checkpoint.id];
              const isCompleted = data !== null;
              const Icon = checkpoint.icon;

              return (
                <div
                  key={checkpoint.id}
                  className={`rounded-2xl border-2 p-6 transition-all ${
                    isCompleted
                      ? 'bg-white border-[#D0B064] shadow-sm'
                      : 'bg-white border-gray-200 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`w-14 h-14 ${checkpoint.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-[#1B263A]">{checkpoint.label}</h3>
                      {checkpoint.requiresPhoto && (
                        <p className="text-sm text-[#D0B064] font-semibold">📷 Wajib foto</p>
                      )}
                    </div>
                    {isCompleted && (
                      <div className="bg-[#D0B064] text-white rounded-full p-1.5 flex-shrink-0">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{checkpoint.description}</p>

                  {isCompleted && data ? (
                    <div className="bg-green-50 rounded-lg p-4 space-y-2 border border-green-200">
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">Waktu:</span>
                        <span className="text-green-700 font-bold">{formatDate(data.timestamp)}</span>
                      </div>
                      <div className="border-t border-green-200 pt-2 flex justify-between text-xs">
                        <span className="text-green-600">Lokasi:</span>
                        <span className="text-green-900 font-bold">{data.lokasi}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">Pemindai:</span>
                        <span className="text-green-900 font-bold">{data.pemindaiOleh}</span>
                      </div>
                      {data.catatan && (
                        <div className="border-t border-green-200 pt-2">
                          <p className="text-xs text-green-600 mb-1">Catatan:</p>
                          <p className="text-xs text-green-900">{data.catatan}</p>
                        </div>
                      )}
                      {data.fotoUrl && (
                        <div className="border-t border-green-200 pt-2">
                          <button
                            onClick={() => setPhotoModal({
                              isOpen: true,
                              photoUrl: data.fotoUrl || '',
                              title: checkpoint.label
                            })}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-green-100 hover:bg-green-200 rounded text-xs text-green-700 font-semibold transition-all"
                          >
                            <ZoomIn className="w-4 h-4" />
                            Lihat Foto
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <p className="text-sm font-semibold">Belum ada checkpoint</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {photoModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Bukti Foto - {photoModal.title}</h2>
              <button
                onClick={() => setPhotoModal({ isOpen: false, photoUrl: '', title: '' })}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={photoModal.photoUrl}
                alt={photoModal.title}
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </DapurLayout>
  );
};

export default CheckpointViewPage;