'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { useSekolahData } from '@/lib/hooks/useSekolahData';
import { useTraySummaryRealtime } from '@/lib/hooks/useTraySummaryRealtime';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Loader,
  Send,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Clock,
  Package,
} from 'lucide-react';

interface ValidationResult {
  sekolahId: string;
  tanggalMenu: string;
  namaMenu: string;
  totalSiswaHadir: number;
  analisisAlergi: {
    totalAlergi: number;
    siswaAlergiDetails: any[];
  };
  perhitunganTray: {
    trayYangSeharusnya: number;
    trayDiterima: number;
    selisih: number;
    peringatan: string;
  };
  statusValidasi: 'SESUAI' | 'TIDAK_SESUAI';
  catatan: string;
  validasiTime: string;
}

interface MenuData {
  id: string;
  tanggal: string;
  namaMenu: string;
  targetTray: number;
  jamMulaiMasak: string;
  jamSelesaiMasak: string;
  biayaPerTray: number;
  kalori: number;
  protein: number;
  karbohidrat: number;
  lemak: number;
}

// Skeleton Loading Components
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
      <div className="h-6 bg-gray-100 rounded w-3/4"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-16 bg-gray-100 rounded-lg"></div>
        <div className="h-16 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  </div>
);

const SkeletonTrayCard = () => (
  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 shadow-sm animate-pulse">
    <div className="space-y-3">
      <div className="h-5 bg-blue-200 rounded w-1/3"></div>
      <div className="h-12 bg-blue-200 rounded w-1/4"></div>
      <div className="h-4 bg-blue-100 rounded w-1/2"></div>
    </div>
  </div>
);

const SkeletonMenuCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded-lg w-2/3"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const SkeletonFormCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="h-10 bg-gray-100 rounded-lg"></div>
      <div className="h-24 bg-gray-100 rounded-lg"></div>
      <div className="flex gap-3">
        <div className="h-10 bg-gray-100 rounded-lg flex-1"></div>
        <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
      </div>
    </div>
  </div>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const ValidasiTrayPage = () => {
  const router = useRouter();
  const { sekolahInfo, sekolahId } = useSekolahData();
  const { traySummary, loading: loadingTraySummary, isConnected: wsConnected } = useTraySummaryRealtime(sekolahId || '');

  const [menus, setMenus] = useState<MenuData[]>([]);
  const [currentMenuIndex, setCurrentMenuIndex] = useState(0);
  const [loadingMenus, setLoadingMenus] = useState(true);

  // Form state
  const [totalTrayDiterima, setTotalTrayDiterima] = useState<number | ''>('');
  const [keterangan, setKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Validation result state
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Fetch menu harian untuk hari ini
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoadingMenus(true);
        const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

        if (!token) {
          return;
        }

        // Use same endpoint as sekolah dashboard - auto-detect today
        const response = await fetch(`${API_BASE_URL}/api/menu-harian/today`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Gagal fetch menu harian');
        }

        const data = await response.json();

        // Handle different response formats
        let menuList: MenuData[] = [];
        if (data.data) {
          if (Array.isArray(data.data)) {
            // Response is array
            menuList = data.data;
          } else if (typeof data.data === 'object' && data.data.id) {
            // Response is single object
            menuList = [data.data];
          }
        } else if (Array.isArray(data)) {
          menuList = data;
        }

        setMenus(menuList);
        if (menuList.length > 0) {
          setCurrentMenuIndex(0);
        }
      } catch (err) {
        console.error('Error fetching menus:', err);
      } finally {
        setLoadingMenus(false);
      }
    };

    fetchMenus();
  }, []);

  const currentMenu = useMemo(() => {
    return menus[currentMenuIndex] || null;
  }, [menus, currentMenuIndex]);

  const handlePrevMenu = () => {
    setCurrentMenuIndex((prev) => (prev > 0 ? prev - 1 : menus.length - 1));
    resetForm();
  };

  const handleNextMenu = () => {
    setCurrentMenuIndex((prev) => (prev < menus.length - 1 ? prev + 1 : 0));
    resetForm();
  };

  const resetForm = () => {
    setTotalTrayDiterima('');
    setKeterangan('');
    setSubmitError('');
    setShowResult(false);
    setValidationResult(null);
  };

  const handleSubmitValidasi = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentMenu || totalTrayDiterima === '') {
      setSubmitError('Harap isi semua field');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/rfid/validate-tray`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menuHarianId: currentMenu.id,
          totalTrayDiterima: Number(totalTrayDiterima),
          keterangan: keterangan.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal submit validasi tray');
      }

      const result = await response.json();
      setValidationResult(result.data);
      setShowResult(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading skeleton while menus are loading
  if (loadingMenus) {
    return (
      <SekolahLayout currentPage="validasi-tray">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1B263A] mb-2">Validasi Penerimaan Tray</h1>
              <p className="text-gray-600">Verifikasi tray yang diterima dari dapur</p>
            </div>
          </div>

          <SkeletonTrayCard />
          <SkeletonMenuCard />
          <SkeletonFormCard />
        </div>
      </SekolahLayout>
    );
  }

  return (
    <SekolahLayout currentPage="validasi-tray">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1B263A] mb-2">Validasi Penerimaan Tray</h1>
            <p className="text-gray-600">Verifikasi tray yang diterima dari dapur</p>
          </div>
        </div>

        {menus.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-yellow-900 mb-2">Tidak Ada Menu Hari Ini</h3>
            <p className="text-yellow-700">Tidak ada menu yang disiapkan untuk hari ini</p>
          </div>
        ) : (
          <>
            {/* Row 1: Tray Summary & Menu Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Total Tray Dikirim */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Total Tray Dikirim</p>
                    <p className="text-5xl font-black text-blue-700 mt-2">
                      {traySummary?.totalTrayUnik || traySummary?.total || 0}
                    </p>
                  </div>
                  {wsConnected && (
                    <div className="flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-green-600" />
                      <span className="text-xs font-semibold text-green-600">Live</span>
                    </div>
                  )}
                </div>
                <div className="pt-6 mt-2 border-t border-blue-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Clock className="w-6 h-6 text-blue-700" />
                      <p className="text-sm font-semibold uppercase text-blue-700 tracking-wide">Update Terakhir</p>
                    </div>
                    <p className="text-5xl font-black text-blue-900">
                      {new Date().toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Carousel */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#1B263A]">Menu Hari Ini</h2>
                    {menus.length > 1 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {currentMenuIndex + 1} / {menus.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {currentMenu && (
                    <div className="space-y-4 mb-6">
                      {/* Menu Info */}
                      <div className="bg-gradient-to-br from-[#1B263A]/5 to-[#D0B064]/5 rounded-xl p-4 border border-[#D0B064]/20">
                        <h3 className="text-lg font-bold text-[#1B263A] mb-3">{currentMenu.namaMenu}</h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-[#D0B064] uppercase mb-1">Tanggal</p>
                            <p className="text-sm font-bold text-[#1B263A]">{currentMenu.tanggal}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#D0B064] uppercase mb-1">Jam Masak</p>
                            <p className="text-sm font-bold text-[#1B263A]">
                              {currentMenu.jamMulaiMasak} - {currentMenu.jamSelesaiMasak}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#D0B064] uppercase mb-1">Biaya/Tray</p>
                            <p className="text-sm font-bold text-[#1B263A]">Rp {currentMenu.biayaPerTray?.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Nutrition Info */}
                        <div className="mt-4 pt-4 border-t border-[#D0B064]/20">
                          <p className="text-xs font-semibold text-[#D0B064] uppercase mb-2">Informasi Gizi</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-sm">
                              <span className="text-gray-600">Kalori: </span>
                              <span className="font-bold text-[#1B263A]">{currentMenu.kalori} kcal</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Protein: </span>
                              <span className="font-bold text-[#1B263A]">{currentMenu.protein}g</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Karbo: </span>
                              <span className="font-bold text-[#1B263A]">{currentMenu.karbohidrat}g</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Lemak: </span>
                              <span className="font-bold text-[#1B263A]">{currentMenu.lemak}g</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Navigation */}
                      {menus.length > 1 && (
                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={handlePrevMenu}
                            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                          <div className="flex items-center gap-2 flex-1">
                            {menus.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setCurrentMenuIndex(idx);
                                  resetForm();
                                }}
                                className={`h-2 rounded-full transition-all ${
                                  idx === currentMenuIndex ? 'w-8 bg-[#D0B064]' : 'w-2 bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <button
                            onClick={handleNextMenu}
                            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>

            {/* Row 2: Validation Form - Full Width */}
            {!showResult ? (
              <form onSubmit={handleSubmitValidasi} className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-[#1B263A] mb-6">Form Validasi Tray</h3>

                      <div className="space-y-4">
                        {/* Total Tray Diterima */}
                        <div>
                          <label className="block text-sm font-semibold text-[#1B263A] mb-2">
                            Total Tray Diterima <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={totalTrayDiterima}
                              onChange={(e) => setTotalTrayDiterima(e.target.value ? Number(e.target.value) : '')}
                              placeholder="Masukkan jumlah tray yang diterima"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D0B064] focus:ring-2 focus:ring-[#D0B064]/20"
                            />
                            <Package className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        {/* Keterangan */}
                        <div>
                          <label className="block text-sm font-semibold text-[#1B263A] mb-2">
                            Keterangan Kondisi Tray
                          </label>
                          <textarea
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            placeholder="Contoh: Tray diterima dalam kondisi baik, ada beberapa tray yang kotor..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D0B064] focus:ring-2 focus:ring-[#D0B064]/20 resize-none"
                          />
                        </div>

                        {/* Error Message */}
                        {submitError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{submitError}</p>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Reset
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || totalTrayDiterima === ''}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D0B064] to-[#C9A355] text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Memproses...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Validasi Tray
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Validation Result */
                  validationResult && (
                    <div className="space-y-6">
                      {/* Status Alert */}
                      <div
                        className={`rounded-2xl p-6 border ${
                          validationResult.statusValidasi === 'SESUAI'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {validationResult.statusValidasi === 'SESUAI' ? (
                            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                          ) : (
                            <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1">
                            <h3
                              className={`text-lg font-bold mb-2 ${
                                validationResult.statusValidasi === 'SESUAI'
                                  ? 'text-green-900'
                                  : 'text-red-900'
                              }`}
                            >
                              {validationResult.statusValidasi === 'SESUAI'
                                ? 'Validasi Sesuai'
                                : 'Validasi Tidak Sesuai'}
                            </h3>
                            <p
                              className={`text-sm ${
                                validationResult.statusValidasi === 'SESUAI'
                                  ? 'text-green-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {validationResult.catatan}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Detail Result */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
                        {/* Perhitungan Tray */}
                        <div>
                          <h4 className="text-lg font-bold text-[#1B263A] mb-4">Perhitungan Tray</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Seharusnya</p>
                              <p className="text-3xl font-bold text-blue-900">
                                {validationResult.perhitunganTray.trayYangSeharusnya}
                              </p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                              <p className="text-xs text-purple-700 font-semibold uppercase mb-1">Diterima</p>
                              <p className="text-3xl font-bold text-purple-900">
                                {validationResult.perhitunganTray.trayDiterima}
                              </p>
                            </div>
                            <div
                              className={`rounded-lg p-4 border ${
                                validationResult.perhitunganTray.selisih === 0
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-orange-50 border-orange-200'
                              }`}
                            >
                              <p
                                className={`text-xs font-semibold uppercase mb-1 ${
                                  validationResult.perhitunganTray.selisih === 0
                                    ? 'text-green-700'
                                    : 'text-orange-700'
                                }`}
                              >
                                Selisih
                              </p>
                              <p
                                className={`text-3xl font-bold ${
                                  validationResult.perhitunganTray.selisih === 0
                                    ? 'text-green-900'
                                    : 'text-orange-900'
                                }`}
                              >
                                {validationResult.perhitunganTray.selisih > 0
                                  ? '+'
                                  : ''}
                                {validationResult.perhitunganTray.selisih}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <p className="text-xs text-gray-700 font-semibold uppercase">Waktu Validasi</p>
                              </div>
                              <p className="text-2xl font-bold text-gray-900 font-mono">
                                {new Date(validationResult.validasiTime).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                })}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {new Date(validationResult.validasiTime).toLocaleDateString('id-ID', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          {validationResult.perhitunganTray.peringatan && (
                            <div className="mt-4 bg-orange-100 border border-orange-300 rounded-lg p-3">
                              <p className="text-sm font-semibold text-orange-900">
                                ⚠️ {validationResult.perhitunganTray.peringatan}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Alergi Information */}
                        {validationResult.analisisAlergi.totalAlergi > 0 && (
                          <div className="pt-4 border-t border-gray-200">
                            <h4 className="text-lg font-bold text-[#1B263A] mb-4">Informasi Alergi</h4>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm font-semibold text-yellow-900 mb-3">
                                Total Siswa Alergi: {validationResult.analisisAlergi.totalAlergi}
                              </p>
                              {validationResult.analisisAlergi.siswaAlergiDetails.length > 0 && (
                                <div className="space-y-2">
                                  {validationResult.analisisAlergi.siswaAlergiDetails.map((siswa, idx) => (
                                    <div key={idx} className="text-sm text-yellow-800">
                                      • {siswa.nama}: {siswa.alergi}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            resetForm();
                            if (currentMenuIndex < menus.length - 1) {
                              handleNextMenu();
                            }
                          }}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D0B064] to-[#C9A355] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                        >
                          {currentMenuIndex < menus.length - 1 ? 'Validasi Menu Berikutnya' : 'Validasi Selesai'}
                        </button>
                      </div>
                    </div>
                  )
                )}
          </>
        )}
      </div>
    </SekolahLayout>
  );
};

export default ValidasiTrayPage;
