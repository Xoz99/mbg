// app/pemprov/monitoring/page.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import PemprovLayout from '@/components/layout/PemprovLayout';
import {
  Truck, MapPin, Clock, Package, CheckCircle,
  Search, Download, Phone, Navigation,
  TrendingUp, Users, ChefHat, School, PlayCircle, 
  XCircle, RefreshCw, Radio, PauseCircle
} from 'lucide-react';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

const MonitoringDistribusiPemprov = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [routes, setRoutes] = useState<any>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setMapReady(true);
    }
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedTrip]);

  const deliveryTrips = useMemo(() => [
    {
      id: 'TRIP-001', batchId: 'BATCH-001', vehicle: 'B 1234 XYZ', driver: 'Pak Budi Santoso',
      driverPhone: '081234567890', kitchen: 'Dapur Karawang Pusat', kitchenCode: 'KTN-JB-001',
      kitchenLat: -6.3064, kitchenLng: 107.3006, school: 'SDN Karawang 1', schoolCode: 'SDN-KRW-001',
      schoolLat: -6.3100, schoolLng: 107.2950, province: 'Jawa Barat', status: 'ON_THE_WAY',
      currentLat: -6.3087, currentLng: 107.2970, 
      expectedTrays: 450, actualTrays: 450,
      departureTime: '06:30', estimatedArrival: '08:15', progress: 65, distance: '5.2 km', timeRemaining: '15 menit'
    },
    {
      id: 'TRIP-002', batchId: 'BATCH-001', vehicle: 'B 5678 ABC', driver: 'Pak Ahmad Yani',
      driverPhone: '081234567891', kitchen: 'Dapur Karawang Pusat', kitchenCode: 'KTN-JB-001',
      kitchenLat: -6.3064, kitchenLng: 107.3006, school: 'SDN Karawang 5', schoolCode: 'SDN-KRW-002',
      schoolLat: -6.3200, schoolLng: 107.3100, province: 'Jawa Barat', status: 'ARRIVED',
      currentLat: -6.3200, currentLng: 107.3100, 
      expectedTrays: 380, actualTrays: 380,
      departureTime: '06:20', estimatedArrival: '08:05', arrivalTime: '08:03', progress: 100,
      distance: '0 km', timeRemaining: 'Sudah tiba'
    },
    {
      id: 'TRIP-003', batchId: 'BATCH-002', vehicle: 'B 9012 DEF', driver: 'Pak Hendra Gunawan',
      driverPhone: '081234567892', kitchen: 'Dapur Bekasi Timur', kitchenCode: 'KTN-JB-002',
      kitchenLat: -6.2615, kitchenLng: 107.0012, school: 'SDN Bekasi Jaya 1', schoolCode: 'SDN-BKS-001',
      schoolLat: -6.2700, schoolLng: 107.0100, province: 'Jawa Barat', status: 'LOADED',
      currentLat: -6.2615, currentLng: 107.0012, 
      expectedTrays: 520, actualTrays: 520,
      departureTime: '07:00', estimatedArrival: '08:30', progress: 0, distance: '8.5 km',
      timeRemaining: 'Belum berangkat'
    },
    {
      id: 'TRIP-004', batchId: 'BATCH-002', vehicle: 'B 3456 GHI', driver: 'Pak Joko Widodo',
      driverPhone: '081234567893', kitchen: 'Dapur Bekasi Timur', kitchenCode: 'KTN-JB-002',
      kitchenLat: -6.2615, kitchenLng: 107.0012, school: 'SDN Bekasi Utara 3', schoolCode: 'SDN-BKS-002',
      schoolLat: -6.2400, schoolLng: 106.9900, province: 'Jawa Barat', status: 'DISTRIBUTED',
      currentLat: -6.2400, currentLng: 106.9900, 
      expectedTrays: 490, actualTrays: 490,
      departureTime: '06:15', estimatedArrival: '07:50', arrivalTime: '07:48', progress: 100,
      distance: '0 km', timeRemaining: 'Selesai'
    }
  ], []);

  const filteredTrips = useMemo(() => {
    return deliveryTrips.filter(t => {
      const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;
      const matchSearch = searchQuery === '' || 
        t.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.school.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [deliveryTrips, selectedStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: deliveryTrips.length,
    onTheWay: deliveryTrips.filter(t => t.status === 'ON_THE_WAY').length,
    arrived: deliveryTrips.filter(t => t.status === 'ARRIVED').length,
    distributed: deliveryTrips.filter(t => t.status === 'DISTRIBUTED').length,
    pending: deliveryTrips.filter(t => t.status === 'PENDING' || t.status === 'LOADED').length,
    totalTrays: deliveryTrips.reduce((sum, t) => sum + t.expectedTrays, 0),
    deliveredTrays: deliveryTrips.filter(t => t.status === 'DISTRIBUTED' || t.status === 'ARRIVED').reduce((sum, t) => sum + t.actualTrays, 0)
  }), [deliveryTrips]);

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-gray-100 text-gray-700 border-gray-300',
      LOADED: 'bg-blue-100 text-blue-700 border-blue-300',
      ON_THE_WAY: 'bg-purple-100 text-purple-700 border-purple-300',
      ARRIVED: 'bg-green-100 text-green-700 border-green-300',
      DISTRIBUTED: 'bg-emerald-100 text-emerald-700 border-emerald-300'
    };
    return colors[status] || colors.PENDING;
  };

  const getStatusText = (status: string) => {
    const text: any = {
      PENDING: 'Menunggu', LOADED: 'Dimuat', ON_THE_WAY: 'Dalam Perjalanan',
      ARRIVED: 'Tiba', DISTRIBUTED: 'Selesai'
    };
    return text[status] || status;
  };

  const createTruckIcon = (status: string) => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    const colors: any = {
      PENDING: '#6b7280', LOADED: '#3b82f6', ON_THE_WAY: '#8b5cf6',
      ARRIVED: '#10b981', DISTRIBUTED: '#059669'
    };
    return L.divIcon({
      html: `<div style="background-color: ${colors[status] || colors.PENDING}; width: 36px; height: 36px; border-radius: 8px; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 18px;">🚚</div></div>`,
      className: 'custom-marker', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18]
    });
  };

  const createSchoolIcon = () => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 12px;">🫐</div></div>`,
      className: 'custom-marker', iconSize: [24, 24], iconAnchor: [12, 12]
    });
  };

  const createKitchenIcon = () => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      html: `<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 12px;">🍳</div></div>`,
      className: 'custom-marker', iconSize: [24, 24], iconAnchor: [12, 12]
    });
  };

  return (
    <PemprovLayout currentPage="monitoring">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitoring Distribusi Real-Time</h1>
            <p className="text-sm text-gray-600 mt-1">Tracking pengiriman makanan ke sekolah secara real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {autoRefresh ? <Radio className="w-4 h-4 animate-pulse" /> : <PauseCircle className="w-4 h-4" />}
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-semibold text-sm transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-blue-600 w-fit mb-3"><Truck className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">TOTAL PENGIRIMAN</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-purple-600 w-fit mb-3"><PlayCircle className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">DALAM PERJALANAN</p>
            <p className="text-2xl font-bold text-gray-900">{stats.onTheWay}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-green-600 w-fit mb-3"><CheckCircle className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">SUDAH TIBA</p>
            <p className="text-2xl font-bold text-gray-900">{stats.arrived}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-emerald-600 w-fit mb-3"><Package className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">SELESAI</p>
            <p className="text-2xl font-bold text-gray-900">{stats.distributed}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-gray-600 w-fit mb-3"><Clock className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">MENUNGGU</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-orange-600 w-fit mb-3"><TrendingUp className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">TRAYS TERKIRIM</p>
            <p className="text-2xl font-bold text-gray-900">{stats.deliveredTrays}</p>
            <p className="text-xs text-gray-500">{((stats.deliveredTrays/stats.totalTrays)*100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari berdasarkan kendaraan, driver, atau sekolah..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B064]" 
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)} 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D0B064]"
              >
                <option value="all">Semua Status</option>
                <option value="PENDING">Menunggu</option>
                <option value="LOADED">Dimuat</option>
                <option value="ON_THE_WAY">Dalam Perjalanan</option>
                <option value="ARRIVED">Tiba</option>
                <option value="DISTRIBUTED">Selesai</option>
              </select>
              <button className="px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-semibold text-sm flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Map & List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className={`lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px] lg:h-[650px] ${selectedTrip ? 'pointer-events-none' : ''}`}>
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-bold text-gray-900">Live Tracking Map</h3>
              <p className="text-xs text-gray-500 mt-1">Tracking {filteredTrips.length} pengiriman</p>
            </div>
            <div className="flex-1 min-h-0">
              {mapReady && (
                <MapContainer center={[-6.3, 107.1]} zoom={10} style={{ height: '100%', width: '100%' }}>
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  
                  {filteredTrips.map(trip => (
                    <Polyline 
                      key={`route-${trip.id}`} 
                      positions={[[trip.kitchenLat, trip.kitchenLng], [trip.schoolLat, trip.schoolLng]]}
                      pathOptions={{ 
                        color: trip.status === 'ON_THE_WAY' ? '#8b5cf6' : 
                               trip.status === 'ARRIVED' ? '#10b981' : 
                               trip.status === 'DISTRIBUTED' ? '#059669' : '#6b7280',
                        weight: 3,
                        opacity: 0.6
                      }} 
                    />
                  ))}
                  
                  {filteredTrips.map(trip => (
                    <Marker key={`kitchen-${trip.id}`} position={[trip.kitchenLat, trip.kitchenLng]} icon={createKitchenIcon()}>
                      <Popup><div className="p-2"><p className="font-bold text-xs">{trip.kitchen}</p></div></Popup>
                    </Marker>
                  ))}
                  
                  {filteredTrips.map(trip => (
                    <Marker key={`school-${trip.id}`} position={[trip.schoolLat, trip.schoolLng]} icon={createSchoolIcon()}>
                      <Popup><div className="p-2"><p className="font-bold text-xs">{trip.school}</p></div></Popup>
                    </Marker>
                  ))}
                  
                  {filteredTrips.map(trip => (
                    <Marker 
                      key={`truck-${trip.id}`} 
                      position={[trip.currentLat, trip.currentLng]} 
                      icon={createTruckIcon(trip.status)} 
                      eventHandlers={{ click: () => setSelectedTrip(trip) }}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-bold text-sm">{trip.vehicle}</p>
                          <p className="text-xs text-gray-600">{trip.driver}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>

          {/* Trip List */}
          <div className={`lg:sticky lg:top-6 lg:self-start ${selectedTrip ? 'pointer-events-none' : ''}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px] lg:h-[650px]">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="font-bold text-gray-900">Daftar Pengiriman</h3>
                <p className="text-xs text-gray-500 mt-1">{filteredTrips.length} pengiriman aktif</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredTrips.map(trip => (
                  <div 
                    key={trip.id} 
                    onClick={() => setSelectedTrip(trip)} 
                    className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${selectedTrip?.id === trip.id ? 'border-[#D0B064] bg-[#D0B064]/5' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{trip.vehicle}</p>
                        <p className="text-xs text-gray-500 truncate">{trip.driver}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusColor(trip.status)}`}>
                        {getStatusText(trip.status)}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <ChefHat className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{trip.kitchen}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <School className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{trip.school}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 flex-shrink-0" />
                        <span>{trip.expectedTrays} trays</span>
                      </div>
                    </div>
                    {trip.status === 'ON_THE_WAY' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all" 
                            style={{ width: `${trip.progress}%` }} 
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">⏱ {trip.timeRemaining}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {selectedTrip && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedTrip(null);
              }
            }}
          >
            <div 
              className="bg-white rounded-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold">{selectedTrip.vehicle}</h3>
                    <p className="text-sm text-white/70 mt-1">{selectedTrip.id}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedTrip(null)} 
                    className="text-white hover:text-[#D0B064] transition-colors flex-shrink-0"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(selectedTrip.status)}`}>
                    {getStatusText(selectedTrip.status)}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#D0B064]" /> Informasi Driver
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Nama Driver</p>
                      <p className="font-semibold text-gray-900">{selectedTrip.driver}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Nomor Telepon</p>
                      <p className="text-gray-900">{selectedTrip.driverPhone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#D0B064]" /> Rute Pengiriman
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-green-600 font-semibold mb-1">Dari</p>
                      <p className="font-semibold text-gray-900">{selectedTrip.kitchen}</p>
                      <p className="text-xs text-gray-600">{selectedTrip.kitchenCode}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Ke</p>
                      <p className="font-semibold text-gray-900">{selectedTrip.school}</p>
                      <p className="text-xs text-gray-600">{selectedTrip.schoolCode}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Detail Pengiriman</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Jumlah Trays</p>
                      <p className="text-xl font-bold text-gray-900">{selectedTrip.expectedTrays}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Jarak</p>
                      <p className="text-xl font-bold text-gray-900">{selectedTrip.distance}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Waktu Berangkat</p>
                      <p className="text-xl font-bold text-gray-900">{selectedTrip.departureTime}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">ETA</p>
                      <p className="text-xl font-bold text-gray-900">{selectedTrip.estimatedArrival}</p>
                    </div>
                  </div>
                </div>

                {selectedTrip.status === 'ON_THE_WAY' && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Progress Pengiriman</h4>
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-purple-600 h-3 rounded-full transition-all" 
                          style={{ width: `${selectedTrip.progress}%` }} 
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{selectedTrip.progress}% Complete</span>
                        <span className="font-semibold text-purple-600">⏱ {selectedTrip.timeRemaining}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTrip.arrivalTime && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <p className="font-semibold">Pengiriman Selesai</p>
                    </div>
                    <p className="text-sm text-green-600 mt-1">Tiba pada: {selectedTrip.arrivalTime}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => window.open(`tel:${selectedTrip.driverPhone}`)} 
                    className="flex-1 px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Hubungi Driver
                  </button>
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps?q=${selectedTrip.currentLat},${selectedTrip.currentLng}`, '_blank')} 
                    className="flex-1 px-4 py-2 border-2 border-[#D0B064] text-[#D0B064] rounded-lg hover:bg-[#D0B064]/5 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Navigation className="w-4 h-4" /> Track di Maps
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PemprovLayout>
  );
};

export default MonitoringDistribusiPemprov;