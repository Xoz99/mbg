// app/csr/sekolah/page.tsx
'use client';
import { useState, useEffect } from 'react';
import CSRLayout from '@/components/layout/CSRLayout';
import {
  School, MapPin, Users, TrendingUp, Search, List, Map as MapIcon,
  Phone, Mail, MapPin as LocationIcon, Award, Eye
} from 'lucide-react';

// Dynamic import untuk Leaflet (hindari window error saat build)
let MapContainer: any;
let TileLayer: any;
let Marker: any;
let Popup: any;
let L: any;

const CSRSekolahBinaan = () => {
  const [viewMode, setViewMode] = useState('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet hanya di client
  useEffect(() => {
    setIsClient(true);
    
    (async () => {
      try {
        const leafletModule = await import('leaflet');
        L = leafletModule.default;
        
        const reactLeaflet = await import('react-leaflet');
        MapContainer = reactLeaflet.MapContainer;
        TileLayer = reactLeaflet.TileLayer;
        Marker = reactLeaflet.Marker;
        Popup = reactLeaflet.Popup;
        
        import('leaflet/dist/leaflet.css');
        setLeafletReady(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    })();
  }, []);

  // Data sekolah binaan
  const schools = [
    {
      id: 'SKL-001',
      name: 'SD Negeri Karawang 1',
      province: 'Jawa Barat',
      lat: -6.3157,
      lng: 107.2869,
      students: 850,
      mealsToday: 820,
      efficiency: 98.5,
      satisfaction: 96,
      status: 'EXCELLENT',
      kepalaSekolah: 'Ibu Siti Nurhaliza',
      contact: '0267-123-4567',
      email: 'sd.karawang1@example.com'
    },
    {
      id: 'SKL-002',
      name: 'SD Negeri Karawang 2',
      province: 'Jawa Barat',
      lat: -6.3200,
      lng: 107.2900,
      students: 720,
      mealsToday: 715,
      efficiency: 97.8,
      satisfaction: 95,
      status: 'EXCELLENT',
      kepalaSekolah: 'Bapak Ahmad Hidayat',
      contact: '0267-123-4568',
      email: 'sd.karawang2@example.com'
    },
    {
      id: 'SKL-003',
      name: 'SMP Negeri Bekasi',
      province: 'Jawa Barat',
      lat: -6.2349,
      lng: 106.9896,
      students: 1200,
      mealsToday: 1185,
      efficiency: 96.2,
      satisfaction: 93,
      status: 'GOOD',
      kepalaSekolah: 'Bapak Bambang Suryanto',
      contact: '0267-234-5678',
      email: 'smp.bekasi@example.com'
    },
    {
      id: 'SKL-004',
      name: 'SD Negeri Depok 1',
      province: 'Jawa Barat',
      lat: -6.4031,
      lng: 106.8201,
      students: 650,
      mealsToday: 645,
      efficiency: 98.1,
      satisfaction: 94,
      status: 'EXCELLENT',
      kepalaSekolah: 'Ibu Dewi Lestari',
      contact: '0267-345-6789',
      email: 'sd.depok1@example.com'
    },
    {
      id: 'SKL-005',
      name: 'SD Negeri Depok 2',
      province: 'Jawa Barat',
      lat: -6.4050,
      lng: 106.8250,
      students: 580,
      mealsToday: 575,
      efficiency: 96.8,
      satisfaction: 92,
      status: 'GOOD',
      kepalaSekolah: 'Bapak Rudi Hermawan',
      contact: '0267-345-6790',
      email: 'sd.depok2@example.com'
    }
  ];

  const filteredSchools = schools.filter(school => {
    const matchSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchProvince = selectedProvince === 'all' || school.province === selectedProvince;
    return matchSearch && matchProvince;
  });

  const provinces = ['all', ...new Set(schools.map(s => s.province))];

  const getStatusColor = (status: string) => {
    const colors: any = {
      EXCELLENT: 'bg-green-100 text-green-700 border-green-200',
      GOOD: 'bg-blue-100 text-blue-700 border-blue-200',
      NEEDS_ATTENTION: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[status] || colors.GOOD;
  };

  const getStatusBgColor = (status: string) => {
    const colors: any = {
      EXCELLENT: 'bg-green-50',
      GOOD: 'bg-blue-50',
      NEEDS_ATTENTION: 'bg-orange-50'
    };
    return colors[status] || 'bg-gray-50';
  };

  const getMarkerIcon = (status: string) => {
    if (!L) return undefined;
    
    const colors: any = {
      EXCELLENT: '#10b981',
      GOOD: '#3b82f6',
      NEEDS_ATTENTION: '#f59e0b'
    };

    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${colors[status] || '#3b82f6'}">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      </svg>
    `;

    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  return (
    <CSRLayout currentPage="sekolah">
      <div className="p-8 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sekolah Binaan</h2>
          <p className="text-gray-600">Monitor dan kelola sekolah-sekolah yang Anda dukung</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari sekolah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D0B064]"
            />
          </div>

          {/* Province Filter */}
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
          >
            <option value="all">Semua Provinsi</option>
            {provinces.filter(p => p !== 'all').map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-[#D0B064] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapIcon className="w-4 h-4 inline mr-2" />
              Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#D0B064] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4 inline mr-2" />
              List
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Sekolah</p>
            <p className="text-2xl font-bold text-gray-900">{filteredSchools.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Siswa</p>
            <p className="text-2xl font-bold text-gray-900">{filteredSchools.reduce((sum, s) => sum + s.students, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Rata-rata Efisiensi</p>
            <p className="text-2xl font-bold text-gray-900">{(filteredSchools.reduce((sum, s) => sum + s.efficiency, 0) / filteredSchools.length).toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Rata-rata Kepuasan</p>
            <p className="text-2xl font-bold text-gray-900">{(filteredSchools.reduce((sum, s) => sum + s.satisfaction, 0) / filteredSchools.length).toFixed(1)}%</p>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'map' ? (
          leafletReady && isClient && MapContainer ? (
            <div className="flex gap-6 flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden">
              {/* Map */}
              <div className="flex-1 rounded-lg overflow-hidden border border-gray-200">
                <MapContainer center={[-6.35, 106.95]} zoom={10} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {filteredSchools.map(school => (
                    <Marker
                      key={school.id}
                      position={[school.lat, school.lng]}
                      icon={getMarkerIcon(school.status)}
                      eventHandlers={{
                        click: () => setSelectedSchool(school)
                      }}
                    >
                      <Popup>
                        <div className="w-48">
                          <h3 className="font-bold text-sm mb-1">{school.name}</h3>
                          <p className="text-xs text-gray-600 mb-2">{school.province}</p>
                          <div className="space-y-1 text-xs">
                            <p>Siswa: {school.students}</p>
                            <p>Efisiensi: {school.efficiency}%</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(school.status)}`}>
                              {school.status}
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Detail Panel */}
              {selectedSchool && (
                <div className={`w-80 rounded-lg p-4 border border-gray-200 overflow-y-auto ${getStatusBgColor(selectedSchool.status)}`}>
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{selectedSchool.name}</h3>
                        <p className="text-sm text-gray-600">{selectedSchool.province}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedSchool.status)}`}>
                        {selectedSchool.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm">
                    {/* Contact Info */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-900 mb-2">Informasi Kontak</p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <School className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-600">Kepala Sekolah</p>
                            <p className="font-medium text-gray-900">{selectedSchool.kepalaSekolah}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-600">Telepon</p>
                            <p className="font-medium text-gray-900">{selectedSchool.contact}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-600">Email</p>
                            <p className="font-medium text-gray-900 break-all">{selectedSchool.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-900 mb-2">Metrik</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Jumlah Siswa</span>
                          <span className="font-semibold text-gray-900">{selectedSchool.students}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Meals Hari Ini</span>
                          <span className="font-semibold text-gray-900">{selectedSchool.mealsToday}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Efisiensi</span>
                          <span className="font-semibold text-green-700">{selectedSchool.efficiency}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kepuasan</span>
                          <span className="font-semibold text-blue-700">{selectedSchool.satisfaction}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-semibold transition-all">
                      <Eye className="w-4 h-4 inline mr-2" />
                      Lihat Detail Lengkap
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-center">
              <p className="text-gray-500">Loading map...</p>
            </div>
          )
        ) : (
          /* List View */
          <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-y-auto">
            <div className="space-y-3">
              {filteredSchools.map(school => (
                <div
                  key={school.id}
                  onClick={() => setSelectedSchool(school)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedSchool?.id === school.id
                      ? 'border-[#D0B064] bg-[#D0B064]/5'
                      : 'border-gray-200 hover:border-[#D0B064]/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{school.name}</h3>
                      <p className="text-sm text-gray-600">{school.province}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(school.status)}`}>
                      {school.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Siswa</p>
                      <p className="font-bold text-gray-900">{school.students}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Meals</p>
                      <p className="font-bold text-gray-900">{school.mealsToday}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Efisiensi</p>
                      <p className="font-bold text-green-700">{school.efficiency}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Kepuasan</p>
                      <p className="font-bold text-blue-700">{school.satisfaction}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CSRLayout>
  );
};

export default CSRSekolahBinaan;