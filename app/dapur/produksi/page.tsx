'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useProduksiCache } from '@/lib/hooks/useProduksiCache';
import DapurLayout from '@/components/layout/DapurLayout';
import {
  AlertCircle, CheckCircle, Clock, Eye, Flame,
  ListChecks, Package, QrCode,
  TrendingUp, Utensils, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

const ProductionTimeline = memo(({ batches }: { batches: any[] }) => {
  const chartData = batches.map(b => ({
    menu: b.dailyMenu?.namaMenu?.split(' ').slice(0, 2).join(' ') || 'Menu',
    packed: b.packedTrays || 0,
    remaining: (b.expectedTrays || 0) - (b.packedTrays || 0)
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
        <YAxis dataKey="menu" type="category" stroke="#94a3b8" style={{ fontSize: '11px' }} width={100} />
        <Tooltip />
        <Bar dataKey="packed" stackId="a" fill="#22c55e" />
        <Bar dataKey="remaining" stackId="a" fill="#e5e7eb" />
      </BarChart>
    </ResponsiveContainer>
  );
});
ProductionTimeline.displayName = 'ProductionTimeline';

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse-fast">
    <div className="bg-gray-200 h-20"></div>
    <div className="p-4 space-y-3">
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded mt-4"></div>
    </div>
  </div>
);

const SkeletonStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse-fast">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    ))}
  </div>
);

const SkeletonChart = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse-fast">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded"></div>
      ))}
    </div>
  </div>
);

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <TrendingUp className="w-3 h-3" />
          {trend}%
        </div>
      )}
    </div>
    <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </div>
);

export default function ProduksiHarianPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    const token = localStorage.getItem('mbg_token');
    
    if (!userData || !token) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    const loadProduction = async () => {
      try {
        setLoading(true);

        // Optimize: Aggressive pagination untuk menu-planning (limit 20)
        const planningRes = await apiCall<any>("/api/menu-planning?limit=20&page=1");
        const plannings = extractArray(planningRes.data?.data || []);

        // ✅ PERBAIKAN: Get today's date dalam local timezone (UTC+7)
        // Jangan gunakan UTC langsung karena backend menyimpan dalam UTC
        const now = new Date();
        const todayLocalDate = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // +7 jam untuk Indonesia
        const today = `${todayLocalDate.getUTCFullYear()}-${String(todayLocalDate.getUTCMonth() + 1).padStart(2, '0')}-${String(todayLocalDate.getUTCDate()).padStart(2, '0')}`;
        console.log(`[PRODUKSI] Today's date (local): ${today}`);

        // Parallel fetch menu-harian untuk semua planning (limit 20 per planning)
        const menuPromises = plannings.map(planning =>
          apiCall<any>(`/api/menu-planning/${planning.id}/menu-harian?limit=20&page=1&tanggal=${today}`)
            .then(menuRes => {
              const menus = extractArray(menuRes.data?.data || []);
              return { planning, menus };
            })
            .catch(err => {
              console.warn(`Gagal fetch menu untuk planning ${planning.id}:`, err);
              return { planning, menus: [] };
            })
        );

        const menuResults = await Promise.all(menuPromises);

        // Flat all menus dan filter hanya untuk hari ini
        const todayMenus: any[] = [];
        menuResults.forEach(({ planning, menus }) => {
          menus.forEach(menu => {
            // ✅ PERBAIKAN: Gunakan normalizeDateString untuk handle timezone conversion
            const menuDate = normalizeDateString(menu.tanggal);
            console.log(`[PRODUKSI] Menu date: ${menuDate}, Today: ${today}, Match: ${menuDate === today}`);
            if (menuDate === today) {
              todayMenus.push({ planning, menu });
            }
          });
        });

        // Optimize: Skip sekolah API call, use planning.sekolah data yang sudah ada
        // Parallel fetch checkpoint untuk semua menu hari ini
        const batchPromises = todayMenus.map(({ planning, menu }) =>
          apiCall<any>(`/api/menu-harian/${menu.id}/checkpoint?limit=10`).catch(() => ({ data: { data: [] }, isNew: false }))
            .then((checkpointRes) => {
              const checkpoints = extractArray(checkpointRes.data?.data || []);
              const sekolahName = planning.sekolah?.nama || 'Unknown';
              const targetTrays = menu.targetTray || 1200;

              return {
                id: `BATCH-${menu.id}`,
                dailyMenu: menu,
                menuId: menu.id,
                sekolahId: planning.sekolahId,
                sekolahName: sekolahName,
                status: checkpoints.length >= 4 ? 'COMPLETED' : checkpoints.length >= 2 ? 'IN_PROGRESS' : 'PREPARING',
                expectedTrays: targetTrays,
                packedTrays: checkpoints.length >= 3 ? targetTrays : checkpoints.length >= 2 ? Math.round(targetTrays / 2) : 0,
                checkpoints: checkpoints,
                createdBy: 'System',
                startTime: menu.jamMulaiMasak,
                endTime: menu.jamSelesaiMasak
              };
            })
            .catch(err => {
              console.warn(`Gagal fetch batch data untuk menu ${menu.id}:`, err);
              return null;
            })
        );

        const batchesData = (await Promise.all(batchPromises)).filter(b => b !== null);
        setBatches(batchesData);
      } catch (err) {
        console.error('Gagal load produksi:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProduction();
  }, []);

  const filteredBatches = useMemo(() => {
    if (filterStatus === 'semua') return batches;
    return batches.filter(b => b.status === filterStatus);
  }, [batches, filterStatus]);

  const stats = useMemo(() => {
    const total = batches.reduce((acc, b) => acc + (b.expectedTrays || 0), 0);
    const packed = batches.reduce((acc, b) => acc + (b.packedTrays || 0), 0);
    const completed = batches.filter(b => b.status === 'COMPLETED').length;
    const inProgress = batches.filter(b => b.status === 'IN_PROGRESS').length;
    
    return {
      total,
      packed,
      completed,
      inProgress,
      progress: total > 0 ? Math.round((packed / total) * 100) : 0,
      totalCheckpoints: batches.reduce((acc, b) => acc + (b.checkpoints?.length || 0), 0)
    };
  }, [batches]);

  const getStatusConfig = (status: string) => {
    const configs: any = {
      COMPLETED: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Selesai', dot: 'bg-green-500' },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-700', icon: Flame, text: 'Sedang Proses', dot: 'bg-blue-500 animate-pulse' },
      PREPARING: { color: 'bg-gray-100 text-gray-700', icon: Clock, text: 'Persiapan', dot: 'bg-gray-500' },
      CANCELLED: { color: 'bg-red-100 text-red-700', icon: X, text: 'Dibatalkan', dot: 'bg-red-500' }
    };
    return configs[status] || configs.PREPARING;
  };

  if (loading) {
    return (
      <DapurLayout currentPage="produksi">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produksi Harian</h1>
            <p className="text-gray-600 mt-1">Monitor delivery batch dan tracking checkpoint</p>
          </div>

          <SkeletonStats />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse-fast">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-12 bg-gray-100 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <SkeletonChart />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse-fast">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </DapurLayout>
    );
  }

  return (
    <DapurLayout currentPage="produksi">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produksi Harian</h1>
            <p className="text-gray-600 mt-1">Monitor delivery batch dan tracking checkpoint</p>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <p className="text-gray-900 font-medium">Belum ada menu untuk hari ini</p>
            <p className="text-gray-600 text-sm mt-1">Silakan buat menu di halaman Menu Planning</p>
            <Link href="/dapur/menu" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
              <Utensils className="w-4 h-4" />
              Buat Menu
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="SEDANG PROSES" value={stats.inProgress} subtitle="batch" icon={Flame} color="bg-orange-600" />
              <StatCard title="SELESAI" value={stats.completed} subtitle="batch" icon={Package} color="bg-purple-600" />
              <StatCard title="CHECKPOINTS" value={stats.totalCheckpoints} subtitle="QR scans" icon={QrCode} color="bg-indigo-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-[#1B263A] to-[#2A3749] rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Progress Hari Ini</h3>
                </div>
                <div className="mb-6">
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-5xl font-bold">{stats.progress}%</span>
                    <span className="text-white/70 text-sm mb-2">selesai</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-4">
                    <div className="bg-gradient-to-r from-green-400 to-green-500 h-4 rounded-full transition-all" style={{ width: `${stats.progress}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mb-1"></div>
                    <p className="text-xs text-white/80">Selesai</p>
                    <p className="text-xl font-bold">{stats.completed}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mb-1"></div>
                    <p className="text-xs text-white/80">Proses</p>
                    <p className="text-xl font-bold">{stats.inProgress}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mb-1"></div>
                    <p className="text-xs text-white/80">Persiapan</p>
                    <p className="text-xl font-bold">{batches.filter(b => b.status === 'PREPARING').length}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline Produksi</h3>
                <ProductionTimeline batches={batches} />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">Filter:</span>
                  <div className="flex gap-2">
                    {[
                      { id: 'semua', label: 'Semua', count: batches.length },
                      { id: 'IN_PROGRESS', label: 'Proses', count: batches.filter(b => b.status === 'IN_PROGRESS').length },
                      { id: 'COMPLETED', label: 'Selesai', count: batches.filter(b => b.status === 'COMPLETED').length }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFilterStatus(f.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filterStatus === f.id ? 'bg-[#D0B064] text-white shadow-md' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {f.label} <span className="ml-1.5 text-xs">({f.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBatches.map((batch) => {
                const statusConfig = getStatusConfig(batch.status);
                const progress = batch.expectedTrays > 0 ? Math.round((batch.packedTrays / batch.expectedTrays) * 100) : 0;
                
                return (
                  <div key={batch.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                    <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] p-4 text-white">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono text-xs font-bold">{batch.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold bg-white/20 flex items-center gap-1`}>
                          <statusConfig.icon className="w-3 h-3" />
                          {statusConfig.text}
                        </span>
                      </div>
                      <h3 className="font-bold text-base">{batch.dailyMenu?.namaMenu}</h3>
                      <p className="text-xs text-white/70 mt-1">{batch.sekolahName}</p>
                    </div>

                    <div className="p-4 space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-bold text-blue-600">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-blue-600 mb-0.5">Target</p>
                          <p className="text-lg font-bold text-blue-900">{batch.expectedTrays}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                          <p className="text-xs text-green-600 mb-0.5">Packed</p>
                          <p className="text-lg font-bold text-green-900">{batch.packedTrays}</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{batch.startTime} - {batch.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 font-semibold">{batch.checkpoints?.length || 0} checkpoints</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1B263A] text-white rounded-xl hover:bg-[#2A3749] text-sm font-medium transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {selectedBatch && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{selectedBatch.dailyMenu?.namaMenu}</h3>
                  <p className="text-sm text-white/70">{selectedBatch.sekolahName}</p>
                  <p className="text-xs text-white/60 mt-0.5">{selectedBatch.dailyMenu?.tanggal}</p>
                </div>
                <button onClick={() => setSelectedBatch(null)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">Target Trays</p>
                    <p className="text-3xl font-bold text-blue-900">{selectedBatch.expectedTrays}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-xs text-green-700 mb-1">Sudah Packed</p>
                    <p className="text-3xl font-bold text-green-900">{selectedBatch.packedTrays}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Checkpoints</h4>
                  <div className="space-y-2">
                    {selectedBatch.checkpoints && selectedBatch.checkpoints.length > 0 ? (
                      selectedBatch.checkpoints.map((cp: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <QrCode className="w-4 h-4 text-gray-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{cp.tipe?.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-gray-600">Waktu: {cp.timestamp || 'N/A'}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Verified</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Belum ada checkpoint</p>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex gap-2">
                    <ListChecks className="w-5 h-5 text-yellow-700 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-yellow-700 font-bold mb-1">INFO</p>
                      <p className="text-sm text-yellow-900">Menu: {selectedBatch.dailyMenu?.namaMenu} | Jam: {selectedBatch.startTime} - {selectedBatch.endTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DapurLayout>
  );
}