'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DapurLayout from '@/components/layout/DapurLayout';
import { useSekolahTerdekatCache } from '@/lib/hooks/useSekolahTerdekatCache';
import {
  MapPin, RefreshCw, Check, AlertCircle
} from 'lucide-react';

interface Sekolah {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  alamat?: string;
  latitude?: number;
  longitude?: number;
  siswaCount?: number;
  jumlahSiswa?: number;
}

interface DapurInfo {
  id: string;
  nama: string;
  latitude?: number;
  longitude?: number;
}

interface SekolahWithDistance extends Sekolah {
  distance: number;
  isLinked?: boolean;
}

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

export default function DapurSekolahProximityPage() {
  const router = useRouter();
  const [radiusKm, setRadiusKm] = useState(20);
  const [dapurInfo, setDapurInfo] = useState<DapurInfo | null>(null);

  const { loading: cacheLoading, error: cacheError, loadData, refreshData } = useSekolahTerdekatCache();
  const [sekolahList, setSekolahList] = useState<SekolahWithDistance[]>([]);
  const [loadingSekolah, setLoadingSekolah] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get auth token and dapur info on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('mbg_token');
    const dapurId = localStorage.getItem('userDapurId');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (!dapurId) {
      setError('Dapur ID tidak ditemukan');
      return;
    }

    fetchDapurInfo(token, dapurId);
  }, [router]);

  // Load sekolah cache data
  useEffect(() => {
    if (cacheLoading) return;

    const loadSekolah = async () => {
      try {
        const cachedData = await loadData();
        if (cachedData?.sekolah) {
          updateSekolahList(cachedData.sekolah);
        }
      } catch (err) {
        setError('Gagal memuat data sekolah');
        console.error(err);
      } finally {
        setLoadingSekolah(false);
      }
    };

    loadSekolah();
  }, [cacheLoading]);

  const fetchDapurInfo = async (token: string, dapurId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dapur/${dapurId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal memuat data dapur');
      }

      const dapurData = await response.json();
      const dapur = dapurData.data || dapurData;

      if (!dapur.latitude || !dapur.longitude) {
        setError('Dapur tidak memiliki koordinat lokasi. Silakan update data dapur terlebih dahulu.');
        return;
      }

      setDapurInfo({
        id: dapur.id,
        nama: dapur.nama || dapur.name,
        latitude: dapur.latitude,
        longitude: dapur.longitude,
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dapur:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data dapur');
    }
  };

  const updateSekolahList = async (sekolahList: any[]) => {
    if (!dapurInfo) return;

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('mbg_token') || '';

      // Calculate distances
      let sekolahWithDistance = sekolahList
        .map((s: any) => {
          const distance = calculateDistance(
            dapurInfo.latitude || 0,
            dapurInfo.longitude || 0,
            s.latitude || 0,
            s.longitude || 0
          );

          return {
            id: s.id,
            name: s.nama || s.name,
            email: s.email,
            phone: s.phone,
            alamat: s.alamat || s.address || '',
            latitude: s.latitude,
            longitude: s.longitude,
            siswaCount: 0,
            distance: Math.round(distance * 100) / 100,
            isLinked: false,
          };
        })
        .sort((a: SekolahWithDistance, b: SekolahWithDistance) => a.distance - b.distance);

      // Fetch siswa count and linked status
      const sekolahWithDetails = await Promise.all(
        sekolahWithDistance.map(async (sekolah: SekolahWithDistance) => {
          try {
            const siswaRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sekolah/${sekolah.id}/siswa`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (siswaRes.ok) {
              const siswaData = await siswaRes.json();
              let siswaList = Array.isArray(siswaData.data?.data) ? siswaData.data.data : Array.isArray(siswaData.data) ? siswaData.data : [];

              return {
                ...sekolah,
                siswaCount: siswaList.length,
              };
            }
            return sekolah;
          } catch (err) {
            console.warn(`Failed to fetch siswa for ${sekolah.id}`);
            return sekolah;
          }
        })
      );

      setSekolahList(sekolahWithDetails);
    } catch (err) {
      console.error('Error updating sekolah list:', err);
    }
  };

  const handleRefresh = async () => {
    try {
      const cachedData = await refreshData();
      if (cachedData?.sekolah) {
        updateSekolahList(cachedData.sekolah);
      }
    } catch (err) {
      setError('Gagal memperbarui data');
      console.error(err);
    }
  };

  // Filter sekolah by radius
  const filteredSekolah = useMemo(() => {
    return sekolahList
      .filter((s: SekolahWithDistance) => s.distance <= radiusKm)
      .sort((a: SekolahWithDistance, b: SekolahWithDistance) => a.distance - b.distance);
  }, [sekolahList, radiusKm]);

  if (loadingSekolah && !dapurInfo) {
    return (
      <DapurLayout currentPage="sekolah">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-start justify-between animate-pulse">
            <div className="space-y-2">
              <div className="h-8 bg-gray-300 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-300 rounded w-24"></div>
          </div>

          {/* Dapur Info Skeleton */}
          <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg p-6 h-48 animate-pulse"></div>

          {/* Radius Control Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm animate-pulse">
            <div className="h-5 bg-gray-300 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Sekolah List Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm animate-pulse">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Box Skeleton */}
          <div className="bg-gray-100 rounded-lg p-4 h-20 animate-pulse"></div>
        </div>
      </DapurLayout>
    );
  }

  if (error) {
    return (
      <DapurLayout currentPage="sekolah">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Terjadi Kesalahan</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </DapurLayout>
    );
  }

  const linkedCount = sekolahList.filter(s => s.isLinked).length;

  return (
    <DapurLayout currentPage="sekolah">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1B263A] mb-2">Sekolah Terdekat</h1>
            <p className="text-gray-600">
              Daftar sekolah di sekitar lokasi dapur Anda
            </p>
          </div>
        </div>

        {/* Dapur Info Card */}
        {dapurInfo && (
          <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm mb-1 font-medium">DAPUR</p>
                <h2 className="text-2xl font-bold">{dapurInfo.nama}</h2>
              </div>
              <MapPin className="w-8 h-8 text-white/50" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-white/70 text-xs font-medium">DALAM RADIUS</p>
                <p className="text-3xl font-bold mt-1">{filteredSekolah.length}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">RADIUS</p>
                <p className="text-3xl font-bold mt-1">{radiusKm} km</p>
              </div>
              <div className="flex items-end justify-end">
                <button
                  onClick={handleRefresh}
                  disabled={loadingSekolah}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Radius Control */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Atur Radius Pencarian (km)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="20"
              value={radiusKm}
              onChange={(e) => {
                const newRadius = parseInt(e.target.value);
                setRadiusKm(newRadius);
                
                // Fetch ulang dari BE untuk dapat data sekolah terbaru
                if (authToken && dapurInfo) {
                  const dapurId = localStorage.getItem('userDapurId');
                  if (dapurId) {
                    fetchDapurAndSekolah(authToken, dapurId);
                  }
                }
              }}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #D0B064 0%, #D0B064 ${((radiusKm - 1) / 19) * 100}%, #e5e7eb ${((radiusKm - 1) / 19) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="text-center min-w-[80px]">
              <p className="text-2xl font-bold text-[#D0B064]">{radiusKm}</p>
              <p className="text-xs text-gray-600">km</p>
            </div>
          </div>
        </div>

        {/* Sekolah List */}
        {loadingSekolah ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm animate-pulse">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSekolah.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-yellow-900 mb-2">Tidak Ada Sekolah</h3>
            <p className="text-yellow-700">
              Tidak ada sekolah dalam radius {radiusKm} km dari dapur ini
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSekolah.map(sekolah => {
              return (
                <div
                  key={sekolah.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header dengan status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                        {sekolah.name}
                      </h3>
                      {sekolah.alamat && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-1">{sekolah.alamat}</p>
                      )}
                      {sekolah.email && (
                        <p className="text-xs text-gray-500 truncate">{sekolah.email}</p>
                      )}
                    </div>
                    {sekolah.isLinked && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Distance & Siswa */}
                  <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Jarak</p>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <p className="text-sm font-semibold text-gray-900">{sekolah.distance} km</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Siswa</p>
                      <p className="text-sm font-semibold text-gray-900">{sekolah.siswaCount || '-'}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  {sekolah.phone && (
                    <p className="text-xs text-gray-600">
                      📱 {sekolah.phone}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DapurLayout>
  );
}