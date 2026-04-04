'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DapurLayout from '@/components/layout/DapurLayout';
import { useSekolahTerdekatRealtime } from '@/lib/hooks/useSekolahTerdekatRealtime';
import {
  MapPin, RefreshCw, Check, AlertCircle, Trash2
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

export default function DapurSekolahProximityPage() {
  const router = useRouter();
  const [radiusKm, setRadiusKm] = useState(20);
  const [authToken, setAuthToken] = useState('');
  const [dapurId, setDapurId] = useState('');

  // Get auth token and dapur ID on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('mbg_token');
    const id = localStorage.getItem('userDapurId');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    setAuthToken(token);

    if (!id) {
      router.push('/auth/login');
      return;
    }

    setDapurId(id);
  }, [router]);

  // 🔥 REALTIME HOOK - Load dapur + sekolah dengan auto refresh
  // Only initialize hook once we have both token and dapurId
  const { dapurInfo, sekolahList, loading, error, refreshData, inviteSekolah, disconnectSekolah } = useSekolahTerdekatRealtime(
    authToken || '',
    dapurId || ''
  );

  // 🔥 Auto-filter sekolah by radius
  const filteredSekolah = useMemo(() => {
    return sekolahList
      .filter((s: SekolahWithDistance) => s.distance <= radiusKm)
      .sort((a: SekolahWithDistance, b: SekolahWithDistance) => a.distance - b.distance);
  }, [radiusKm, sekolahList]);

  // 🔥 Handle refresh
  const handleRefresh = async () => {
    await refreshData();
  };

  if (loading && !dapurInfo) {
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

        {/* Dapur Info Header */}
        {dapurInfo && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-5 mb-6 border-b border-gray-200 gap-4 mt-2">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Lokasi Dapur Aktif
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{dapurInfo.nama}</h2>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Sekolah Ditemukan</p>
                <p className="font-bold text-gray-900 text-xl">{filteredSekolah.length}</p>
              </div>
              <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Radius Aktif</p>
                <p className="font-bold text-[#D0B064] text-xl">{radiusKm} <span className="text-sm font-medium text-gray-500">km</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Radius Control */}
        <div className="py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-6 mb-6">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            Atur Radius Pencarian
          </label>
          <div className="flex items-center gap-4 flex-1">
            <input
              type="range"
              min="1"
              max="20"
              value={radiusKm}
              onChange={(e) => {
                setRadiusKm(parseInt(e.target.value));
              }}
              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #D0B064 0%, #D0B064 ${((radiusKm - 1) / 19) * 100}%, #e5e7eb ${((radiusKm - 1) / 19) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="text-center min-w-[40px] hidden md:block">
              <p className="text-lg font-bold text-gray-700">{radiusKm}<span className="text-xs font-normal">km</span></p>
            </div>
          </div>
        </div>

        {/* Sekolah List */}
        {loading ? (
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
          <div className="flex flex-col border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:grid">
              <div className="md:col-span-5">Nama & Alamat Sekolah</div>
              <div className="md:col-span-2 text-center">Jarak</div>
              <div className="md:col-span-2 text-center">Siswa</div>
              <div className="md:col-span-3 text-right">Status / Aksi</div>
            </div>

            {filteredSekolah.map(sekolah => {
              const handleInvite = async () => {
                if (window.confirm(`Kirim undangan ke ${sekolah.name}?`)) {
                  const res = await inviteSekolah(sekolah.id);
                  if (res.success) {
                    alert(res.message);
                  } else {
                    alert('Error: ' + res.message);
                  }
                }
              };

              const handleDisconnect = async () => {
                if (window.confirm(`Apakah Anda yakin ingin memutuskan hubungan dengan ${sekolah.name}?`)) {
                  const res = await disconnectSekolah(sekolah.id);
                  if (res.success) {
                    alert(res.message);
                  } else {
                    alert('Error: ' + res.message);
                  }
                }
              };

              return (
                <div
                  key={sekolah.id}
                  className="py-4 border-b border-gray-100 flex flex-col md:grid md:grid-cols-12 md:items-center gap-4"
                >
                  {/* Nama & Alamat */}
                  <div className="md:col-span-5 flex flex-col justify-center">
                    <h3 className="font-bold text-gray-900 text-[15px] mb-0.5 leading-tight">
                      {sekolah.name}
                    </h3>
                    {sekolah.alamat && (
                      <p className="text-sm text-gray-500 line-clamp-1">{sekolah.alamat}</p>
                    )}
                    {sekolah.phone && (
                      <p className="text-xs text-gray-400 mt-0.5">📱 {sekolah.phone}</p>
                    )}
                  </div>
                  
                  {/* Mobile Layout Jarak & Siswa */}
                  <div className="flex justify-between items-center md:hidden border-y border-gray-50 py-2 my-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{sekolah.distance} km</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="text-gray-500 text-xs mr-1">Siswa:</span>
                      <span className="font-semibold">{sekolah.siswaCount || '-'}</span>
                    </div>
                  </div>

                  {/* Desktop Layout Jarak & Siswa */}
                  <div className="md:col-span-2 hidden md:flex items-center justify-center gap-1.5 text-sm font-medium text-gray-700">
                    {sekolah.distance} km
                  </div>
                  <div className="md:col-span-2 hidden md:flex items-center justify-center text-sm font-semibold text-gray-700">
                    {sekolah.siswaCount || '-'} <span className="text-xs font-normal text-gray-400 ml-1">siswa</span>
                  </div>

                  {/* Status & Aksi */}
                  <div className="md:col-span-3 flex justify-end items-center">
                    {sekolah.isLinked && sekolah.status !== 'REJECTED' ? (
                      <div className="flex items-center gap-3">
                        {sekolah.status === 'APPROVED' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 border border-green-100 text-green-700">
                            <Check className="w-3.5 h-3.5" />
                            AKTIF
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-yellow-600 uppercase tracking-wider">
                            MENUNGGU
                          </div>
                        )}
                        <button
                          onClick={handleDisconnect}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Putus Hubungan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleInvite}
                        className="border border-[#D0B064] text-[#D0B064] px-4 py-1.5 rounded text-xs font-bold hover:bg-[#D0B064] hover:text-white transition-colors"
                      >
                        {sekolah.status === 'REJECTED' ? 'Undang Ulang' : 'Kirim Undangan'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DapurLayout>
  );
}