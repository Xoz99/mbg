// app/dapur/distribusi/page.tsx
'use client';

import { useState, useMemo, memo } from 'react';
import DapurLayout from '@/components/layout/DapurLayout';
import { 
  Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, Eye, X,
  Navigation, Phone, User, Calendar, Boxes, QrCode, Camera, TrendingUp,
  Route, Download, RefreshCw, PlayCircle, School
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StatusPieChart = memo(({ data }: { data: any[] }) => {
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
});
StatusPieChart.displayName = 'StatusPieChart';

const TripBarChart = memo(({ trips }: { trips: any[] }) => {
  const data = trips.slice(0, 6).map(t => ({
    school: t.school.name.split(' ').slice(0, 2).join(' '),
    trays: t.actualTrays || t.expectedTrays
  }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="school" stroke="#94a3b8" style={{ fontSize: '11px' }} angle={-15} textAnchor="end" height={60} />
        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
        <Tooltip />
        <Bar dataKey="trays" fill="#3b82f6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});
TripBarChart.displayName = 'TripBarChart';

const DistribusiDelivery = () => {
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');

  // Sample delivery batches
  const deliveryBatches = useMemo(() => [
    {
      id: 'BATCH-001',
      date: '2025-01-13',
      status: 'COMPLETED',
      menu: 'Nasi Putih + Rendang Sapi',
      vehicle: 'B 1234 ABC',
      driver: 'Pak Budi',
      totalTrips: 3,
      completedTrips: 3,
      trips: [
        {
          id: 'TRIP-001',
          order: 1,
          status: 'RETURNED',
          school: { name: 'SMAN 5 Karawang', address: 'Jl. Veteran 45', pic: 'Ibu Siti', phone: '0267-123456' },
          expectedTrays: 485,
          actualTrays: 485,
          expectedBaskets: 10,
          departureTime: '09:00',
          arrivalTime: '09:35',
          returnTime: '12:20',
          checkpoints: [
            { type: 'KITCHEN_TO_DRIVER', time: '08:50', photo: true },
            { type: 'DRIVER_DEPARTURE', time: '09:00', photo: true },
            { type: 'SCHOOL_RECEIVED', time: '09:35', photo: true },
            { type: 'SCHOOL_TO_DRIVER_RETURN', time: '11:45', photo: true }
          ],
          notes: 'Pengiriman lancar'
        },
        {
          id: 'TRIP-002',
          order: 2,
          status: 'RETURNED',
          school: { name: 'SMAN 2 Karawang', address: 'Jl. Proklamasi 12', pic: 'Pak Ahmad', phone: '0267-234567' },
          expectedTrays: 420,
          actualTrays: 420,
          expectedBaskets: 9,
          departureTime: '10:30',
          arrivalTime: '11:00',
          returnTime: '13:25',
          checkpoints: [
            { type: 'DRIVER_DEPARTURE', time: '10:30', photo: true },
            { type: 'SCHOOL_RECEIVED', time: '11:00', photo: true },
            { type: 'SCHOOL_TO_DRIVER_RETURN', time: '12:50', photo: true }
          ],
          notes: 'Sesuai jadwal'
        },
        {
          id: 'TRIP-003',
          order: 3,
          status: 'RETURNED',
          school: { name: 'SMP 1 Karawang', address: 'Jl. Merdeka 89', pic: 'Ibu Wati', phone: '0267-345678' },
          expectedTrays: 295,
          actualTrays: 295,
          expectedBaskets: 6,
          departureTime: '11:45',
          arrivalTime: '12:15',
          returnTime: '13:45',
          checkpoints: [
            { type: 'DRIVER_DEPARTURE', time: '11:45', photo: false },
            { type: 'SCHOOL_RECEIVED', time: '12:15', photo: true }
          ],
          notes: 'Trip terakhir selesai'
        }
      ]
    },
    {
      id: 'BATCH-002',
      date: '2025-01-13',
      status: 'IN_PROGRESS',
      menu: 'Nasi Goreng Spesial',
      vehicle: 'B 5678 DEF',
      driver: 'Pak Ahmad',
      totalTrips: 3,
      completedTrips: 1,
      trips: [
        {
          id: 'TRIP-004',
          order: 1,
          status: 'RETURNED',
          school: { name: 'SMK 1 Karawang', address: 'Jl. Industri 23', pic: 'Pak Dedi', phone: '0267-456789' },
          expectedTrays: 450,
          actualTrays: 450,
          expectedBaskets: 9,
          departureTime: '10:00',
          arrivalTime: '10:30',
          returnTime: '13:00',
          checkpoints: [
            { type: 'KITCHEN_TO_DRIVER', time: '09:50', photo: true },
            { type: 'SCHOOL_RECEIVED', time: '10:30', photo: true }
          ],
          notes: 'Selesai'
        },
        {
          id: 'TRIP-005',
          order: 2,
          status: 'DISTRIBUTED',
          school: { name: 'SMA 3 Karawang', address: 'Jl. Pahlawan 67', pic: 'Ibu Nur', phone: '0267-567890' },
          expectedTrays: 380,
          actualTrays: 380,
          expectedBaskets: 8,
          departureTime: '11:15',
          arrivalTime: '11:45',
          returnTime: null,
          checkpoints: [
            { type: 'DRIVER_DEPARTURE', time: '11:15', photo: false },
            { type: 'SCHOOL_RECEIVED', time: '11:45', photo: true }
          ],
          notes: 'Menunggu pickup'
        },
        {
          id: 'TRIP-006',
          order: 3,
          status: 'LOADED',
          school: { name: 'SMP 5 Karawang', address: 'Jl. Kartini 34', pic: 'Pak Rizky', phone: '0267-678901' },
          expectedTrays: 350,
          actualTrays: 0,
          expectedBaskets: 7,
          departureTime: null,
          arrivalTime: null,
          returnTime: null,
          checkpoints: [
            { type: 'KITCHEN_TO_DRIVER', time: '13:10', photo: true }
          ],
          notes: 'Siap berangkat'
        }
      ]
    }
  ], []);

  const filteredBatches = useMemo(() => {
    if (viewMode === 'active') {
      return deliveryBatches.filter(b => b.status === 'IN_PROGRESS' || b.status === 'READY');
    }
    return deliveryBatches.filter(b => b.status === 'COMPLETED');
  }, [deliveryBatches, viewMode]);

  const stats = useMemo(() => {
    const allTrips = deliveryBatches.flatMap(b => b.trips);
    const completed = allTrips.filter(t => t.status === 'RETURNED').length;
    const inProgress = allTrips.filter(t => t.status === 'DISTRIBUTED' || t.status === 'ON_THE_WAY').length;
    const pending = allTrips.filter(t => t.status === 'LOADED' || t.status === 'PENDING').length;
    const totalTrays = allTrips.reduce((acc, t) => acc + t.expectedTrays, 0);
    const deliveredTrays = allTrips.filter(t => t.status === 'RETURNED').reduce((acc, t) => acc + t.actualTrays, 0);
    return { totalTrips: allTrips.length, completed, inProgress, pending, totalTrays, deliveredTrays };
  }, [deliveryBatches]);

  const chartData = [
    { name: 'Selesai', value: stats.completed },
    { name: 'Progress', value: stats.inProgress },
    { name: 'Menunggu', value: stats.pending }
  ];

  const getTripStatus = (status: string) => {
    const configs: any = {
      RETURNED: { color: 'bg-green-100 text-green-700', text: '✓ Kembali' },
      DISTRIBUTED: { color: 'bg-blue-100 text-blue-700', text: '🍱 Distribusi' },
      LOADED: { color: 'bg-purple-100 text-purple-700', text: '📦 Dimuat' },
      PENDING: { color: 'bg-gray-100 text-gray-700', text: '⏳ Menunggu' }
    };
    return configs[status] || configs.PENDING;
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className={`p-2.5 rounded-lg ${color} mb-3 w-fit`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );

  return (
    <DapurLayout currentPage="distribusi">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Distribusi & Delivery</h1>
            <p className="text-gray-600">Monitor delivery batch dan tracking pengiriman</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] font-semibold shadow-sm">
            <PlayCircle className="w-5 h-5" />
            Mulai Batch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard title="TOTAL TRIP" value={stats.totalTrips} subtitle="trip hari ini" icon={Route} color="bg-blue-600" />
        <StatCard title="SELESAI" value={stats.completed} subtitle={`${Math.round((stats.completed/stats.totalTrips)*100)}%`} icon={CheckCircle} color="bg-green-600" />
        <StatCard title="PROGRESS" value={stats.inProgress} subtitle="on the way" icon={Truck} color="bg-orange-600" />
        <StatCard title="MENUNGGU" value={stats.pending} subtitle="belum berangkat" icon={Clock} color="bg-gray-600" />
        <StatCard title="TRAYS" value={stats.deliveredTrays.toLocaleString()} subtitle={`dari ${stats.totalTrays.toLocaleString()}`} icon={Boxes} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Status Trip</h3>
          <StatusPieChart data={chartData} />
        </div>
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Volume per Sekolah</h3>
          <TripBarChart trips={deliveryBatches.flatMap(b => b.trips)} />
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('active')} className={`px-4 py-2 rounded-md text-sm font-medium ${viewMode === 'active' ? 'bg-white shadow-sm' : ''}`}>
              🚚 Aktif
            </button>
            <button onClick={() => setViewMode('history')} className={`px-4 py-2 rounded-md text-sm font-medium ${viewMode === 'history' ? 'bg-white shadow-sm' : ''}`}>
              📋 Riwayat
            </button>
          </div>
          <p className="text-sm text-gray-600">Menampilkan <span className="font-bold">{filteredBatches.length}</span> batch</p>
        </div>
      </div>

      <div className="space-y-6">
        {filteredBatches.map((batch) => {
          const progress = Math.round((batch.completedTrips / batch.totalTrips) * 100);
          return (
            <div key={batch.id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] p-5 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-mono text-sm font-bold">{batch.id}</p>
                    <p className="text-xs text-white/70">{batch.date}</p>
                  </div>
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/20">
                    {batch.status === 'COMPLETED' ? '✓ Selesai' : '🚚 Berjalan'}
                  </span>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-white/70">Menu</p>
                    <p className="font-bold">{batch.menu}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Kendaraan</p>
                    <p className="font-bold">{batch.vehicle} • {batch.driver}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Progress</p>
                    <p className="font-bold">{batch.completedTrips}/{batch.totalTrips} trip</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs">Progress</span>
                    <span className="text-xs font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <h4 className="font-bold text-gray-900 mb-4">Daftar Trip ({batch.trips.length})</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {batch.trips.map((trip) => {
                    const statusConfig = getTripStatus(trip.status);
                    return (
                      <div key={trip.id} onClick={() => setSelectedTrip(trip)} className="border-2 border-gray-200 rounded-xl p-4 hover:border-[#D0B064] hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-700">{trip.order}</span>
                            </div>
                            <div>
                              <p className="font-bold text-sm">{trip.school.name}</p>
                              <p className="text-xs text-gray-500">{trip.school.pic}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Trays:</span>
                            <span className="font-semibold">{trip.actualTrays || trip.expectedTrays}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Baskets:</span>
                            <span className="font-semibold">{trip.expectedBaskets}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
                            {statusConfig.text}
                          </span>
                          <span className="text-xs text-gray-500">{trip.checkpoints.length} scan</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex justify-between rounded-t-2xl">
              <div>
                <p className="text-sm text-white/80">Trip #{selectedTrip.order}</p>
                <h3 className="text-xl font-bold">{selectedTrip.school.name}</h3>
              </div>
              <button onClick={() => setSelectedTrip(null)} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <School className="w-5 h-5 text-blue-600" />
                  Informasi Sekolah
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-blue-600 mb-1">Alamat</p>
                    <p className="text-sm font-semibold">{selectedTrip.school.address}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-blue-600 mb-1">PIC Sekolah</p>
                    <p className="text-sm font-semibold">{selectedTrip.school.pic}</p>
                    <p className="text-xs text-gray-600">{selectedTrip.school.phone}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <Boxes className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-blue-600">Target</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedTrip.expectedTrays}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-green-600">Actual</p>
                  <p className="text-2xl font-bold text-green-900">{selectedTrip.actualTrays || '-'}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <Package className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs text-purple-600">Baskets</p>
                  <p className="text-2xl font-bold text-purple-900">{selectedTrip.expectedBaskets}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <QrCode className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-xs text-orange-600">Scans</p>
                  <p className="text-2xl font-bold text-orange-900">{selectedTrip.checkpoints.length}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Checkpoints ({selectedTrip.checkpoints.length})
                </h4>
                <div className="space-y-3">
                  {selectedTrip.checkpoints.map((cp: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm">{cp.type.replace(/_/g, ' ')}</p>
                          {cp.photo && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold flex items-center gap-1"><Camera className="w-3 h-3" />Photo</span>}
                        </div>
                        <p className="text-xs text-indigo-700">{cp.time}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] font-bold">
                  <Navigation className="w-5 h-5" />
                  Maps
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold">
                  <Phone className="w-5 h-5" />
                  Hubungi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DapurLayout>
  );
};

export default DistribusiDelivery;