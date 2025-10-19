// app/pemprov/peta-dapur/page.tsx
'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import PemprovLayout from '@/components/layout/PemprovLayout';
import {
  MapPin, ChefHat, School, TrendingUp, Package, Users,
  Filter, Search, Download, Eye, Phone, Navigation,
  CheckCircle, AlertCircle, XCircle, Activity, Maximize2
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

const PetaDapurPemprov = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKitchen, setSelectedKitchen] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userProvince, setUserProvince] = useState('');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require('leaflet');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setMapReady(true);

      const province = localStorage.getItem('userProvince') || 'Jawa Barat';
      setUserProvince(province);
    }
  }, []);

  useEffect(() => {
    if (selectedKitchen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedKitchen]);

  // Data Dapur untuk Jawa Barat
  const kitchensData = useMemo(() => [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      code: 'KTN-JB-001',
      name: 'Dapur Karawang Pusat',
      address: 'Jl. Galuh Mas Raya No. 45, Karawang',
      phone: '0267-123456',
      latitude: -6.3064,
      longitude: 107.3006,
      province: 'Jawa Barat',
      city: 'Karawang',
      picName: 'Budi Santoso',
      picPhone: '081234567890',
      isActive: true,
      totalSchools: 15,
      totalStudents: 6500,
      mealsToday: 6450,
      capacity: 8000,
      efficiency: 98.5,
      onTimeRate: 97,
      status: 'OPERATIONAL'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      code: 'KTN-JB-002',
      name: 'Dapur Bekasi Timur',
      address: 'Jl. Ahmad Yani No. 88, Bekasi',
      phone: '021-88123456',
      latitude: -6.2615,
      longitude: 107.0012,
      province: 'Jawa Barat',
      city: 'Bekasi',
      picName: 'Siti Aminah',
      picPhone: '081298765432',
      isActive: true,
      totalSchools: 22,
      totalStudents: 10200,
      mealsToday: 10150,
      capacity: 12000,
      efficiency: 97.8,
      onTimeRate: 96,
      status: 'OPERATIONAL'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      code: 'KTN-JB-003',
      name: 'Dapur Bogor Selatan',
      address: 'Jl. Pajajaran No. 112, Bogor',
      phone: '0251-321654',
      latitude: -6.5971,
      longitude: 106.8060,
      province: 'Jawa Barat',
      city: 'Bogor',
      picName: 'Ahmad Fauzi',
      picPhone: '081276543210',
      isActive: true,
      totalSchools: 18,
      totalStudents: 7800,
      mealsToday: 7750,
      capacity: 9000,
      efficiency: 96.2,
      onTimeRate: 95,
      status: 'OPERATIONAL'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      code: 'KTN-JB-004',
      name: 'Dapur Bandung Utara',
      address: 'Jl. Sudirman No. 200, Bandung',
      phone: '0274-456789',
      latitude: -6.9271,
      longitude: 107.6063,
      province: 'Jawa Barat',
      city: 'Bandung',
      picName: 'Rina Wati',
      picPhone: '081387654321',
      isActive: true,
      totalSchools: 20,
      totalStudents: 9500,
      mealsToday: 9450,
      capacity: 11000,
      efficiency: 98.1,
      onTimeRate: 98,
      status: 'OPERATIONAL'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      code: 'KTN-JB-005',
      name: 'Dapur Cimahi',
      address: 'Jl. Siliwangi No. 150, Cimahi',
      phone: '0274-555666',
      latitude: -6.8812,
      longitude: 107.5399,
      province: 'Jawa Barat',
      city: 'Cimahi',
      picName: 'Joko Widodo',
      picPhone: '081298761234',
      isActive: true,
      totalSchools: 12,
      totalStudents: 5200,
      mealsToday: 4800,
      capacity: 6000,
      efficiency: 92.8,
      onTimeRate: 91,
      status: 'MAINTENANCE'
    }
  ], []);

  const filteredKitchens = useMemo(() => {
    return kitchensData.filter(k => {
      const matchStatus = selectedStatus === 'all' || k.status === selectedStatus;
      const matchSearch = searchQuery === '' || 
        k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchStatus && matchSearch;
    });
  }, [kitchensData, selectedStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: kitchensData.length,
    active: kitchensData.filter(k => k.isActive).length,
    operational: kitchensData.filter(k => k.status === 'OPERATIONAL').length,
    totalSchools: kitchensData.reduce((sum, k) => sum + k.totalSchools, 0),
    totalStudents: kitchensData.reduce((sum, k) => sum + k.totalStudents, 0),
    totalMealsToday: kitchensData.reduce((sum, k) => sum + k.mealsToday, 0),
    avgEfficiency: (kitchensData.filter(k => k.isActive).reduce((sum, k) => sum + k.efficiency, 0) / kitchensData.filter(k => k.isActive).length).toFixed(1)
  }), [kitchensData]);

  const getStatusColor = (status: string) => {
    const colors: any = {
      OPERATIONAL: 'bg-green-100 text-green-700 border-green-300',
      MAINTENANCE: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      INACTIVE: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[status] || colors.INACTIVE;
  };

  const createCustomIcon = (status: string) => {
    if (typeof window === 'undefined') return null;
    
    const L = require('leaflet');
    const colors: any = {
      OPERATIONAL: '#10b981',
      MAINTENANCE: '#f59e0b',
      INACTIVE: '#6b7280'
    };
    
    const color = colors[status] || colors.INACTIVE;
    
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
            font-weight: bold;
          ">🍳</div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  // Batas map per provinsi
  const provinceBounds: { [key: string]: { center: [number, number]; bounds: [[number, number], [number, number]]; zoom: number } } = {
    'Jawa Barat': {
      center: [-6.9, 107.6],
      bounds: [[-7.2, 106.4], [-6.4, 108.8]],
      zoom: 9
    },
    'Jawa Tengah': {
      center: [-7.2, 110.4],
      bounds: [[-7.8, 109.0], [-6.6, 111.8]],
      zoom: 9
    },
    'Jawa Timur': {
      center: [-7.5, 112.5],
      bounds: [[-8.2, 111.0], [-6.8, 114.0]],
      zoom: 9
    },
    'Banten': {
      center: [-6.4, 106.2],
      bounds: [[-6.8, 104.9], [-5.9, 106.9]],
      zoom: 9
    },
    'DKI Jakarta': {
      center: [-6.2, 106.8],
      bounds: [[-6.4, 106.4], [-6.0, 107.2]],
      zoom: 11
    },
  };

  const mapConfig = provinceBounds[userProvince] || provinceBounds['Jawa Barat'];

  return (
    <PemprovLayout currentPage="peta-dapur">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Peta Lokasi Dapur - {userProvince}</h1>
          <p className="text-sm text-gray-600 mt-1">Monitoring lokasi dan status dapur di provinsi Anda</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-lg bg-blue-600">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-green-600">
                {stats.active}/{stats.total} Aktif
              </span>
            </div>
            <p className="text-xs font-medium text-gray-600 mt-3 mb-1">TOTAL DAPUR</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-green-600 w-fit">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-medium text-gray-600 mt-3 mb-1">OPERATIONAL</p>
            <p className="text-2xl font-bold text-gray-900">{stats.operational}</p>
            <p className="text-xs text-gray-500">Dapur beroperasi normal</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-purple-600 w-fit">
              <School className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-medium text-gray-600 mt-3 mb-1">SEKOLAH TERLAYANI</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSchools}</p>
            <p className="text-xs text-gray-500">{stats.totalStudents.toLocaleString()} siswa</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-orange-600 w-fit">
              <Package className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-medium text-gray-600 mt-3 mb-1">MEALS HARI INI</p>
            <p className="text-2xl font-bold text-gray-900">{(stats.totalMealsToday / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500">Avg efficiency {stats.avgEfficiency}%</p>
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
                  placeholder="Cari dapur berdasarkan nama, kode, atau kota..."
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
                <option value="OPERATIONAL">Operational</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <button className="px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-semibold text-sm flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Map and List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map View */}
          <div className={`lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px] lg:h-[650px] ${selectedKitchen ? 'pointer-events-none' : ''}`}>
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-900">Peta Lokasi Dapur</h3>
                  <p className="text-xs text-gray-500 mt-1">Menampilkan {filteredKitchens.length} dari {kitchensData.length} dapur</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Operational</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-600">Maintenance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-gray-600">Inactive</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {mapReady && (
                <MapContainer
                  center={mapConfig.center}
                  zoom={mapConfig.zoom}
                  style={{ height: '100%', width: '100%' }}
                  maxBounds={mapConfig.bounds}
                  maxBoundsViscosity={1.0}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredKitchens.map(kitchen => (
                    <Marker
                      key={kitchen.id}
                      position={[kitchen.latitude, kitchen.longitude]}
                      icon={createCustomIcon(kitchen.status)}
                      eventHandlers={{
                        click: () => setSelectedKitchen(kitchen)
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-bold text-sm">{kitchen.name}</p>
                          <p className="text-xs text-gray-600">{kitchen.code}</p>
                          <p className="text-xs text-gray-500 mt-1">{kitchen.city}</p>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs"><strong>{kitchen.totalSchools}</strong> sekolah</p>
                            <p className="text-xs"><strong>{kitchen.totalStudents.toLocaleString()}</strong> siswa</p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>

          {/* Kitchen List */}
          <div className={`lg:sticky lg:top-6 lg:self-start ${selectedKitchen ? 'pointer-events-none' : ''}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px] lg:h-[650px]">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="font-bold text-gray-900">Daftar Dapur</h3>
                <p className="text-xs text-gray-500 mt-1">{filteredKitchens.length} dapur ditemukan</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {filteredKitchens.map(kitchen => (
                    <div
                      key={kitchen.id}
                      onClick={() => setSelectedKitchen(kitchen)}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                        selectedKitchen?.id === kitchen.id
                          ? 'border-[#D0B064] bg-[#D0B064]/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{kitchen.name}</p>
                          <p className="text-xs text-gray-500">{kitchen.code}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusColor(kitchen.status)}`}>
                          {kitchen.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{kitchen.city}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <School className="w-3 h-3 flex-shrink-0" />
                          <span>{kitchen.totalSchools} sekolah • {kitchen.totalStudents.toLocaleString()} siswa</span>
                        </div>
                        {kitchen.isActive && (
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 flex-shrink-0" />
                            <span>{kitchen.mealsToday.toLocaleString()} meals hari ini</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kitchen Detail Modal */}
        {selectedKitchen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedKitchen(null);
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
                    <h3 className="text-xl font-bold">{selectedKitchen.name}</h3>
                    <p className="text-sm text-white/70 mt-1">{selectedKitchen.code}</p>
                  </div>
                  <button
                    onClick={() => setSelectedKitchen(null)}
                    className="text-white hover:text-[#D0B064] transition-colors flex-shrink-0"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(selectedKitchen.status)}`}>
                    {selectedKitchen.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#D0B064]" />
                    Lokasi
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <p className="text-gray-700">{selectedKitchen.address}</p>
                    <p className="text-gray-600">{selectedKitchen.city}, {selectedKitchen.province}</p>
                    <p className="text-gray-500 text-xs">
                      Koordinat: {selectedKitchen.latitude}, {selectedKitchen.longitude}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-[#D0B064]" />
                    Kontak
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">PIC Dapur</p>
                      <p className="font-semibold text-gray-900">{selectedKitchen.picName}</p>
                      <p className="text-gray-600">{selectedKitchen.picPhone}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-gray-500 text-xs">Telepon Dapur</p>
                      <p className="text-gray-900">{selectedKitchen.phone}</p>
                    </div>
                  </div>
                </div>

                {selectedKitchen.isActive && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#D0B064]" />
                      Performa
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-xs text-blue-600 font-semibold">Sekolah Dilayani</p>
                        <p className="text-2xl font-bold text-blue-900">{selectedKitchen.totalSchools}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-xs text-purple-600 font-semibold">Total Siswa</p>
                        <p className="text-2xl font-bold text-purple-900">{selectedKitchen.totalStudents.toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-xs text-green-600 font-semibold">Efficiency</p>
                        <p className="text-2xl font-bold text-green-900">{selectedKitchen.efficiency}%</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-xs text-orange-600 font-semibold">On-Time Rate</p>
                        <p className="text-2xl font-bold text-orange-900">{selectedKitchen.onTimeRate}%</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button className="flex-1 px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                    <Eye className="w-4 h-4" />
                    Lihat Detail
                  </button>
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps?q=${selectedKitchen.latitude},${selectedKitchen.longitude}`, '_blank')}
                    className="flex-1 px-4 py-2 border-2 border-[#D0B064] text-[#D0B064] rounded-lg hover:bg-[#D0B064]/5 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    Buka Maps
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

export default PetaDapurPemprov;