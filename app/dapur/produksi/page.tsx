// app/dapur/produksi/page.tsx
'use client';

import { useState, useMemo, memo } from 'react';
import DapurLayout from '@/components/layout/DapurLayout';
import { 
  ChefHat,
  Package,
  Truck,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  User,
  Thermometer,
  ListChecks,
  Eye,
  X,
  RefreshCw,
  Plus,
  Clock,
  TrendingUp,
  Calendar,
  Users,
  Flame,
  Camera,
  QrCode,
  Utensils,
  ShoppingBag,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Timeline Chart Component
const ProductionTimeline = memo(({ batches }: { batches: any[] }) => {
  const chartData = batches.map(b => ({
    menu: b.dailyMenu.menuName.split(' ').slice(0, 2).join(' '),
    packed: b.packedTrays,
    remaining: b.expectedTrays - b.packedTrays
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
        <YAxis dataKey="menu" type="category" stroke="#94a3b8" style={{ fontSize: '11px' }} width={100} />
        <Tooltip />
        <Bar dataKey="packed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
        <Bar dataKey="remaining" stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

ProductionTimeline.displayName = 'ProductionTimeline';

const ProduksiHarian = () => {
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);

  // Production batches - Sesuai ERD: DeliveryBatch dengan DailyMenu
  const productionBatches = useMemo(() => [
    {
      id: 'BATCH-2025-01-13-001',
      dailyMenu: {
        id: 'menu-001',
        menuName: 'Nasi Putih + Rendang Sapi',
        description: 'Rendang Sapi + Sayur Asem + Kerupuk + Pisang',
        date: '2025-01-13',
        dayNumber: 1, // Senin
        cookingStartAt: '06:00',
        cookingEndAt: '08:30',
        samplePhotoUrl: '/photos/sample-rendang.jpg',
        ingredients: [
          { name: 'Beras', quantity: '850 kg', photoUrl: '/photos/beras.jpg' },
          { name: 'Daging Sapi', quantity: '120 kg', photoUrl: '/photos/daging.jpg' },
          { name: 'Sayur Asem Mix', quantity: '200 kg', photoUrl: null },
          { name: 'Bumbu Rendang', quantity: '35 kg', photoUrl: null }
        ]
      },
      status: 'COMPLETED', // PREPARING, READY, IN_PROGRESS, COMPLETED, CANCELLED
      expectedTrays: 1200,
      packedTrays: 1200,
      vehicle: { licensePlate: 'B 1234 ABC', driver: 'Pak Budi' },
      startTime: '06:00',
      endTime: '08:30',
      createdBy: 'Bu Siti',
      checkpoints: [
        { type: 'COOKING_START', timestamp: '06:00', scannedBy: 'Bu Siti', photoUrl: '/photos/start.jpg' },
        { type: 'COOKING_COMPLETE', timestamp: '08:00', scannedBy: 'Bu Siti', photoUrl: '/photos/cooked.jpg' },
        { type: 'PACKING_START', timestamp: '08:05', scannedBy: 'Tim Packing', photoUrl: null },
        { type: 'PACKING_COMPLETE', timestamp: '08:30', scannedBy: 'Tim Packing', photoUrl: '/photos/packed.jpg' }
      ],
      trips: [
        { school: 'SMAN 5 Karawang', trays: 485, status: 'DISTRIBUTED' },
        { school: 'SMAN 2 Karawang', trays: 420, status: 'DISTRIBUTED' },
        { school: 'SMP 1 Karawang', trays: 295, status: 'DISTRIBUTED' }
      ],
      notes: 'Produksi lancar, kualitas optimal. Semua trip sudah selesai.'
    },
    {
      id: 'BATCH-2025-01-13-002',
      dailyMenu: {
        id: 'menu-002',
        menuName: 'Nasi Goreng Spesial',
        description: 'Nasi Goreng + Ayam Suwir + Acar + Kerupuk + Jeruk',
        date: '2025-01-13',
        dayNumber: 1,
        cookingStartAt: '08:45',
        cookingEndAt: '10:30',
        samplePhotoUrl: null,
        ingredients: [
          { name: 'Beras', quantity: '850 kg', photoUrl: '/photos/beras.jpg' },
          { name: 'Ayam', quantity: '180 kg', photoUrl: '/photos/ayam.jpg' },
          { name: 'Bumbu Nasi Goreng', quantity: '45 kg', photoUrl: null },
          { name: 'Acar', quantity: '80 kg', photoUrl: null }
        ]
      },
      status: 'IN_PROGRESS',
      expectedTrays: 1500,
      packedTrays: 1050,
      vehicle: { licensePlate: 'B 5678 DEF', driver: 'Pak Ahmad' },
      startTime: '08:45',
      endTime: null,
      createdBy: 'Bu Siti',
      checkpoints: [
        { type: 'COOKING_START', timestamp: '08:45', scannedBy: 'Bu Siti', photoUrl: '/photos/start2.jpg' },
        { type: 'COOKING_COMPLETE', timestamp: '10:15', scannedBy: 'Bu Siti', photoUrl: null },
        { type: 'PACKING_START', timestamp: '10:20', scannedBy: 'Tim Packing', photoUrl: null }
      ],
      trips: [
        { school: 'SMK 1 Karawang', trays: 450, status: 'LOADED' },
        { school: 'SMA 3 Karawang', trays: 380, status: 'LOADED' },
        { school: 'SMP 5 Karawang', trays: 350, status: 'PENDING' }
      ],
      notes: 'Dalam proses packing. Estimasi selesai 11:00. Target 1500 trays.'
    },
    {
      id: 'BATCH-2025-01-13-003',
      dailyMenu: {
        id: 'menu-003',
        menuName: 'Nasi Kuning + Ayam Goreng',
        description: 'Nasi Kuning + Ayam Goreng + Sambal Goreng Ati + Kerupuk',
        date: '2025-01-13',
        dayNumber: 1,
        cookingStartAt: '11:00',
        cookingEndAt: null,
        samplePhotoUrl: null,
        ingredients: [
          { name: 'Beras', quantity: '700 kg', photoUrl: null },
          { name: 'Ayam', quantity: '150 kg', photoUrl: null },
          { name: 'Kunyit', quantity: '15 kg', photoUrl: null },
          { name: 'Ati Ampela', quantity: '60 kg', photoUrl: null }
        ]
      },
      status: 'PREPARING',
      expectedTrays: 1000,
      packedTrays: 0,
      vehicle: { licensePlate: 'B 9012 GHI', driver: 'Pak Dedi' },
      startTime: '11:00',
      endTime: null,
      createdBy: 'Bu Siti',
      checkpoints: [],
      trips: [
        { school: 'SD 12 Karawang', trays: 380, status: 'PENDING' },
        { school: 'SD 15 Karawang', trays: 320, status: 'PENDING' },
        { school: 'SD 20 Karawang', trays: 300, status: 'PENDING' }
      ],
      notes: 'Menunggu batch sebelumnya selesai. Bahan sudah disiapkan.'
    },
    {
      id: 'BATCH-2025-01-13-004',
      dailyMenu: {
        id: 'menu-004',
        menuName: 'Nasi + Soto Ayam',
        description: 'Nasi Putih + Soto Ayam Kuning + Emping + Sambal',
        date: '2025-01-13',
        dayNumber: 1,
        cookingStartAt: '09:00',
        cookingEndAt: null,
        samplePhotoUrl: null,
        ingredients: [
          { name: 'Beras', quantity: '400 kg', photoUrl: null },
          { name: 'Ayam', quantity: '80 kg', photoUrl: null },
          { name: 'Bumbu Soto', quantity: '25 kg', photoUrl: null },
          { name: 'Kunyit', quantity: '8 kg', photoUrl: null }
        ]
      },
      status: 'CANCELLED',
      expectedTrays: 500,
      packedTrays: 150,
      vehicle: null,
      startTime: '09:00',
      endTime: null,
      createdBy: 'Bu Siti',
      checkpoints: [
        { type: 'COOKING_START', timestamp: '09:00', scannedBy: 'Bu Siti', photoUrl: null }
      ],
      trips: [],
      notes: '⚠️ CANCELLED: Kekurangan kunyit untuk bumbu. Batch dibatalkan, akan diganti menu lain.'
    }
  ], []);

  // Filter batches
  const filteredBatches = useMemo(() => {
    if (filterStatus === 'semua') return productionBatches;
    return productionBatches.filter(b => b.status === filterStatus);
  }, [productionBatches, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = productionBatches.reduce((acc, b) => acc + b.expectedTrays, 0);
    const packed = productionBatches.reduce((acc, b) => acc + b.packedTrays, 0);
    const inProgress = productionBatches.filter(b => b.status === 'IN_PROGRESS').reduce((acc, b) => acc + b.expectedTrays, 0);
    const completed = productionBatches.filter(b => b.status === 'COMPLETED').length;
    const cancelled = productionBatches.filter(b => b.status === 'CANCELLED').length;
    const totalCheckpoints = productionBatches.reduce((acc, b) => acc + b.checkpoints.length, 0);
    
    return { 
      total, 
      packed, 
      inProgress,
      completed,
      cancelled,
      totalCheckpoints,
      progress: total > 0 ? Math.round((packed / total) * 100) : 0
    };
  }, [productionBatches]);

  const getStatusConfig = (status: string) => {
    const configs = {
      COMPLETED: {
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle,
        text: 'Selesai',
        dotColor: 'bg-green-500'
      },
      IN_PROGRESS: {
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Flame,
        text: 'Sedang Proses',
        dotColor: 'bg-blue-500 animate-pulse'
      },
      PREPARING: {
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: Clock,
        text: 'Persiapan',
        dotColor: 'bg-gray-500'
      },
      READY: {
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: Package,
        text: 'Siap Kirim',
        dotColor: 'bg-purple-500'
      },
      CANCELLED: {
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: X,
        text: 'Dibatalkan',
        dotColor: 'bg-red-500'
      }
    };
    return configs[status as keyof typeof configs] || configs.PREPARING;
  };

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

  return (
    <DapurLayout currentPage="produksi">
      {/* Header dengan Action */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Produksi Harian</h1>
            <p className="text-gray-600">Monitor delivery batch, menu, dan tracking checkpoint</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCheckpointModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#D0B064] text-[#D0B064] rounded-xl hover:bg-[#D0B064] hover:text-white transition-colors font-semibold shadow-sm"
            >
              <QrCode className="w-5 h-5" />
              Scan Checkpoint
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold shadow-sm">
              <Plus className="w-5 h-5" />
              Batch Baru
            </button>
          </div>
        </div>
      </div>

      {/* Alert untuk batch cancelled */}
      {productionBatches.some(b => b.status === 'CANCELLED') && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-bold text-red-900 text-lg mb-1">Perhatian - Ada Batch Dibatalkan!</p>
              <p className="text-sm text-red-700 mb-2">
                {productionBatches.filter(b => b.status === 'CANCELLED').length} batch dibatalkan karena kendala bahan/teknis.
              </p>
              <button className="text-sm font-semibold text-red-700 hover:text-red-800 underline">
                Lihat Detail →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard 
          title="TOTAL TARGET" 
          value={stats.total.toLocaleString()} 
          subtitle="trays hari ini" 
          icon={Utensils} 
          color="bg-blue-600"
        />
        <StatCard 
          title="SUDAH PACKING" 
          value={stats.packed.toLocaleString()} 
          subtitle={`${stats.progress}% dari target`}
          icon={CheckCircle} 
          color="bg-green-600"
          trend={stats.progress}
        />
        <StatCard 
          title="SEDANG PROSES" 
          value={stats.inProgress.toLocaleString()} 
          subtitle="dalam pengerjaan" 
          icon={Flame} 
          color="bg-orange-600"
        />
        <StatCard 
          title="BATCH SELESAI" 
          value={stats.completed} 
          subtitle="siap distribusi" 
          icon={Package} 
          color="bg-purple-600"
        />
        <StatCard 
          title="CHECKPOINTS" 
          value={stats.totalCheckpoints} 
          subtitle="QR scans hari ini" 
          icon={QrCode} 
          color="bg-indigo-600"
        />
      </div>

      {/* Progress Overview & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Progress Card */}
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
            <div className="w-full bg-white/20 rounded-full h-4 mb-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-4 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${stats.progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>0</span>
              <span className="font-semibold text-white">{stats.packed.toLocaleString()} / {stats.total.toLocaleString()} trays</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <p className="text-xs text-white/80">Selesai</p>
              </div>
              <p className="text-xl font-bold">{productionBatches.filter(b => b.status === 'COMPLETED').length}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <p className="text-xs text-white/80">Proses</p>
              </div>
              <p className="text-xl font-bold">{productionBatches.filter(b => b.status === 'IN_PROGRESS').length}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <p className="text-xs text-white/80">Cancel</p>
              </div>
              <p className="text-xl font-bold">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        {/* Production Timeline Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Timeline Produksi</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Packed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span className="text-gray-600">Remaining</span>
              </div>
            </div>
          </div>
          <ProductionTimeline batches={productionBatches} />
        </div>
      </div>

      {/* Filter & View Toggle */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Filter:</span>
            <div className="flex gap-2">
              {[
                { id: 'semua', label: 'Semua', count: productionBatches.length },
                { id: 'IN_PROGRESS', label: 'Sedang Proses', count: productionBatches.filter(b => b.status === 'IN_PROGRESS').length },
                { id: 'COMPLETED', label: 'Selesai', count: productionBatches.filter(b => b.status === 'COMPLETED').length },
                { id: 'PREPARING', label: 'Persiapan', count: productionBatches.filter(b => b.status === 'PREPARING').length },
                { id: 'CANCELLED', label: 'Dibatalkan', count: productionBatches.filter(b => b.status === 'CANCELLED').length }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === filter.id
                      ? 'bg-[#D0B064] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                    filterStatus === filter.id ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              Grid
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Production Batches - Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => {
            const statusConfig = getStatusConfig(batch.status);
            const progress = batch.expectedTrays > 0 ? Math.round((batch.packedTrays / batch.expectedTrays) * 100) : 0;
            
            return (
              <div key={batch.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#D0B064] transition-all group">
                {/* Header dengan Status */}
                <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] p-4 text-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                      <span className="font-mono text-xs font-bold">{batch.id}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 bg-white/20 border-white/30 flex items-center gap-1.5`}>
                      <statusConfig.icon className="w-3.5 h-3.5" />
                      {statusConfig.text}
                    </span>
                  </div>
                  <h3 className="font-bold text-base leading-tight mb-1">{batch.dailyMenu.menuName}</h3>
                  <p className="text-xs text-white/70">{batch.dailyMenu.description}</p>
                </div>

                <div className="p-4">
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">Progress Packing</span>
                      <span className="font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 relative ${
                          batch.status === 'COMPLETED' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                          batch.status === 'IN_PROGRESS' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                          'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      >
                        {batch.status === 'IN_PROGRESS' && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-blue-600 mb-0.5">Target</p>
                      <p className="text-lg font-bold text-blue-900">{batch.expectedTrays}</p>
                      <p className="text-xs text-blue-600">trays</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-green-600 mb-0.5">Packed</p>
                      <p className="text-lg font-bold text-green-900">{batch.packedTrays}</p>
                      <p className="text-xs text-green-600">trays</p>
                    </div>
                  </div>

                  {/* Info Detail */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{batch.dailyMenu.cookingStartAt}</span>
                      {batch.dailyMenu.cookingEndAt && <span className="text-gray-400">→ {batch.dailyMenu.cookingEndAt}</span>}
                    </div>
                    {batch.vehicle && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span>{batch.vehicle.licensePlate} • {batch.vehicle.driver}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-700">
                      <QrCode className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">{batch.checkpoints.length} checkpoints</span>
                    </div>
                  </div>

                  {/* Trips */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Tujuan ({batch.trips.length} sekolah):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {batch.trips.slice(0, 3).map((trip: any, idx: number) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium">
                          {trip.school}
                        </span>
                      ))}
                      {batch.trips.length > 3 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-semibold">
                          +{batch.trips.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setSelectedBatch(batch)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white rounded-xl hover:from-[#2A3749] hover:to-[#1B263A] transition-all font-semibold shadow-sm group-hover:shadow-md"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Detail
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Menu</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Kendaraan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Checkpoints</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBatches.map((batch) => {
                  const statusConfig = getStatusConfig(batch.status);
                  const progress = batch.expectedTrays > 0 ? Math.round((batch.packedTrays / batch.expectedTrays) * 100) : 0;
                  
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                          <span className="font-mono text-sm font-bold text-gray-900">{batch.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm font-semibold text-gray-900">{batch.dailyMenu.menuName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{batch.trips.length} sekolah tujuan</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                          <statusConfig.icon className="w-3.5 h-3.5" />
                          {statusConfig.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">{batch.packedTrays}/{batch.expectedTrays}</span>
                            <span className="font-bold text-blue-600">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                batch.status === 'COMPLETED' ? 'bg-green-500' :
                                batch.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {batch.vehicle ? (
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{batch.vehicle.licensePlate}</p>
                            <p className="text-xs text-gray-500">{batch.vehicle.driver}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                          <QrCode className="w-3 h-3" />
                          {batch.checkpoints.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedBatch(batch)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-sm font-bold bg-white/20 px-3 py-1 rounded-lg">{selectedBatch.id}</span>
                  {(() => {
                    const statusConfig = getStatusConfig(selectedBatch.status);
                    return (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/30">
                        <statusConfig.icon className="w-4 h-4" />
                        {statusConfig.text}
                      </span>
                    );
                  })()}
                </div>
                <h3 className="text-xl font-bold">{selectedBatch.dailyMenu.menuName}</h3>
                <p className="text-sm text-white/70 mt-1">{selectedBatch.dailyMenu.description}</p>
              </div>
              <button 
                onClick={() => setSelectedBatch(null)} 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Progress Section */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Progress Produksi & Packing
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Utensils className="w-5 h-5 text-blue-600" />
                      <p className="text-xs text-blue-700 font-medium">Target Trays</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{selectedBatch.expectedTrays}</p>
                    <p className="text-xs text-blue-600 mt-1">total baki</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-xs text-green-700 font-medium">Sudah Packing</p>
                    </div>
                    <p className="text-3xl font-bold text-green-900">{selectedBatch.packedTrays}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {selectedBatch.expectedTrays > 0 ? Math.round((selectedBatch.packedTrays / selectedBatch.expectedTrays) * 100) : 0}% progress
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Ingredients */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                  Bahan Baku yang Digunakan
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {selectedBatch.dailyMenu.ingredients.map((ingredient: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          {ingredient.photoUrl ? (
                            <ImageIcon className="w-6 h-6 text-orange-600" />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{ingredient.name}</p>
                          <p className="text-xs text-gray-500">Bahan utama</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-900">{ingredient.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkpoints Timeline */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-gray-600" />
                  Tracking Checkpoints ({selectedBatch.checkpoints.length})
                </h4>
                <div className="space-y-3">
                  {selectedBatch.checkpoints.length > 0 ? (
                    selectedBatch.checkpoints.map((checkpoint: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-indigo-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-indigo-900">{checkpoint.type.replace(/_/g, ' ')}</p>
                            {checkpoint.photoUrl && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                Photo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-indigo-700">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {checkpoint.timestamp}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {checkpoint.scannedBy}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            ✓ Verified
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Belum ada checkpoint yang di-scan</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Trips */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gray-600" />
                  Jadwal Distribusi ({selectedBatch.trips.length} sekolah)
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {selectedBatch.trips.map((trip: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-gray-900">{trip.school}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          trip.status === 'DISTRIBUTED' ? 'bg-green-100 text-green-700' :
                          trip.status === 'LOADED' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {trip.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">{trip.trays} trays</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle Info */}
              {selectedBatch.vehicle && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Kendaraan & Driver</p>
                      <p className="font-semibold text-gray-900">
                        {selectedBatch.vehicle.licensePlate} • {selectedBatch.vehicle.driver}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ListChecks className="w-5 h-5 text-yellow-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-yellow-700 font-semibold mb-1 uppercase tracking-wide">Catatan</p>
                    <p className="text-sm text-yellow-900">{selectedBatch.notes}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedBatch.status === 'IN_PROGRESS' && (
                  <>
                    <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-all font-bold shadow-md hover:shadow-lg">
                      <QrCode className="w-5 h-5" />
                      Scan Checkpoint
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold shadow-md hover:shadow-lg">
                      <CheckCircle className="w-5 h-5" />
                      Tandai Selesai
                    </button>
                  </>
                )}
                {selectedBatch.status === 'PREPARING' && (
                  <button className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold shadow-md hover:shadow-lg">
                    <PlayCircle className="w-5 h-5" />
                    Mulai Produksi
                  </button>
                )}
                {selectedBatch.status === 'COMPLETED' && (
                  <button className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-md hover:shadow-lg">
                    <Truck className="w-5 h-5" />
                    Lihat Distribusi
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DapurLayout>
  );
};

export default ProduksiHarian;