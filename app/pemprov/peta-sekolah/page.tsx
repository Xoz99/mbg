// app/pemprov/peta-sekolah/page.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import PemprovLayout from '@/components/layout/PemprovLayout';
import {
  MapPin, School, Users, Package, TrendingUp,
  Search, Download, Eye, Phone, Navigation,
  CheckCircle, AlertCircle, Award, XCircle, Filter
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
const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
);

const PetaSekolahPemprov = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userProvince, setUserProvince] = useState('Jawa Barat');

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
      
      const province = localStorage.getItem('userProvince') || 'Jawa Barat';
      setUserProvince(province);
    }
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedSchool]);

  // Data Sekolah Jawa Barat
  const schoolsData = useMemo(() => [
    {
      id: '1', code: 'SDN-KRW-001', name: 'SDN Karawang 1',
      address: 'Jl. Tuparev No. 123, Karawang Barat', phone: '0267-400111',
      latitude: -6.3100, longitude: 107.2950, city: 'Karawang',
      picName: 'Ibu Siti Nurhaliza', picPhone: '081234567801',
      isActive: true, totalStudents: 450, studentsServed: 448,
      attendanceRate: 99.6, nutritionScore: 92, status: 'EXCELLENT'
    },
    {
      id: '2', code: 'SDN-KRW-002', name: 'SDN Karawang 5',
      address: 'Jl. Kertabumi No. 45, Karawang Timur', phone: '0267-400222',
      latitude: -6.3200, longitude: 107.3100, city: 'Karawang',
      picName: 'Bapak Ahmad Yani', picPhone: '081234567802',
      isActive: true, totalStudents: 380, studentsServed: 375,
      attendanceRate: 98.7, nutritionScore: 88, status: 'GOOD'
    },
    {
      id: '3', code: 'SDN-BKS-001', name: 'SDN Bekasi Jaya 1',
      address: 'Jl. Raya Bekasi No. 88, Bekasi Timur', phone: '021-88400111',
      latitude: -6.2700, longitude: 107.0100, city: 'Bekasi',
      picName: 'Ibu Dewi Sartika', picPhone: '081234567803',
      isActive: true, totalStudents: 520, studentsServed: 515,
      attendanceRate: 99.0, nutritionScore: 95, status: 'EXCELLENT'
    },
    {
      id: '4', code: 'SDN-BKS-002', name: 'SDN Bekasi Utara 3',
      address: 'Jl. Perjuangan No. 156, Bekasi Utara', phone: '021-88400222',
      latitude: -6.2400, longitude: 106.9900, city: 'Bekasi',
      picName: 'Bapak Hendra Gunawan', picPhone: '081234567804',
      isActive: true, totalStudents: 490, studentsServed: 485,
      attendanceRate: 99.0, nutritionScore: 72, status: 'NEEDS_IMPROVEMENT'
    },
    {
      id: '5', code: 'SDN-BGR-001', name: 'SDN Bogor Tengah 2',
      address: 'Jl. Pajajaran No. 200, Bogor Tengah', phone: '0251-888111',
      latitude: -6.6000, longitude: 106.8000, city: 'Bogor',
      picName: 'Ibu Kartini Wijaya', picPhone: '081234567805',
      isActive: true, totalStudents: 410, studentsServed: 408,
      attendanceRate: 99.5, nutritionScore: 85, status: 'GOOD'
    },
    {
      id: '6', code: 'SDN-BDG-001', name: 'SDN Bandung 12',
      address: 'Jl. Pemuda No. 180, Bandung Tengah', phone: '0274-888111',
      latitude: -6.9271, longitude: 107.6063, city: 'Bandung',
      picName: 'Bapak Bambang Suryono', picPhone: '081234567807',
      isActive: true, totalStudents: 480, studentsServed: 478,
      attendanceRate: 99.6, nutritionScore: 96, status: 'EXCELLENT'
    }
  ], []);

  const filteredSchools = useMemo(() => {
    return schoolsData.filter(s => {
      const matchStatus = selectedStatus === 'all' || s.status === selectedStatus;
      const matchSearch = searchQuery === '' || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [schoolsData, selectedStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: schoolsData.length,
    active: schoolsData.filter(s => s.isActive).length,
    totalStudents: schoolsData.reduce((sum, s) => sum + s.totalStudents, 0),
    servedToday: schoolsData.reduce((sum, s) => sum + s.studentsServed, 0),
    avgAttendance: (schoolsData.reduce((sum, s) => sum + s.attendanceRate, 0) / schoolsData.length).toFixed(1),
    excellent: schoolsData.filter(s => s.status === 'EXCELLENT').length,
    good: schoolsData.filter(s => s.status === 'GOOD').length,
    avgNutrition: (schoolsData.reduce((sum, s) => sum + s.nutritionScore, 0) / schoolsData.length).toFixed(1)
  }), [schoolsData]);

  const getStatusColor = (status: string) => {
    const colors: any = {
      EXCELLENT: 'bg-green-100 text-green-700 border-green-300',
      GOOD: 'bg-blue-100 text-blue-700 border-blue-300',
      NEEDS_IMPROVEMENT: 'bg-orange-100 text-orange-700 border-orange-300'
    };
    return colors[status] || colors.GOOD;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: any = {
      EXCELLENT: '#10b981',
      GOOD: '#3b82f6',
      NEEDS_IMPROVEMENT: '#f59e0b'
    };
    return colors[status] || '#3b82f6';
  };

  const createSchoolIcon = (status: string) => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    const color = getStatusBadgeColor(status);
    
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
        ">
          📚
        </div>
      `,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };



  return (
    <PemprovLayout currentPage="peta-sekolah">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Peta Sekolah & Analisis Gizi - {userProvince}</h1>
          <p className="text-sm text-gray-600 mt-1">Monitoring lokasi sekolah dan status pemenuhan gizi</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-blue-600 w-fit mb-3"><School className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">TOTAL SEKOLAH</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-green-600 w-fit mb-3"><Award className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">GIZI SANGAT BAIK</p>
            <p className="text-2xl font-bold text-gray-900">{stats.excellent}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-blue-500 w-fit mb-3"><CheckCircle className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">GIZI BAIK</p>
            <p className="text-2xl font-bold text-gray-900">{stats.good}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-purple-600 w-fit mb-3"><Users className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">TOTAL SISWA</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-orange-600 w-fit mb-3"><Package className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">TERLAYANI HARI INI</p>
            <p className="text-2xl font-bold text-gray-900">{stats.servedToday.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-indigo-600 w-fit mb-3"><TrendingUp className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mb-1">AVG SKOR GIZI</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgNutrition}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari sekolah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B064]"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D0B064]"
            >
              <option value="all">Semua Status</option>
              <option value="EXCELLENT">Gizi Sangat Baik</option>
              <option value="GOOD">Gizi Baik</option>
              <option value="NEEDS_IMPROVEMENT">Perlu Perbaikan</option>
            </select>
            <button className="px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-semibold text-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Map and List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[500px] lg:h-[650px]">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Peta Sekolah</h3>
              <p className="text-xs text-gray-500 mt-1">{filteredSchools.length} dari {schoolsData.length} sekolah</p>
            </div>
            {mapReady && (
              <MapContainer
                center={[-6.86, 107.6]}
                zoom={9}
                style={{ height: '100%', width: '100%' }}
                maxBounds={[[-8.40, 106.06], [-5.32, 109.14]]}
                maxBoundsViscosity={1.0}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredSchools.map(school => (
                  <Marker
                    key={school.id}
                    position={[school.latitude, school.longitude]}
                    icon={createSchoolIcon(school.status)}
                    eventHandlers={{ click: () => setSelectedSchool(school) }}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-bold text-sm">{school.name}</p>
                        <p className="text-xs text-gray-600">{school.code}</p>
                        <p className="text-xs text-gray-500 mt-1">Skor Gizi: {school.nutritionScore}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[500px] lg:h-[650px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-bold text-gray-900">Daftar Sekolah</h3>
              <p className="text-xs text-gray-500 mt-1">{filteredSchools.length} ditemukan</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredSchools.map(school => (
                <div
                  key={school.id}
                  onClick={() => setSelectedSchool(school)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSchool?.id === school.id
                      ? 'border-[#D0B064] bg-[#D0B064]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{school.name}</p>
                      <p className="text-xs text-gray-500">{school.code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusColor(school.status)}`}>
                      {school.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {school.city}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {school.totalStudents} siswa
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" /> Skor: {school.nutritionScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Detail */}
        {selectedSchool && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={(e) => e.target === e.currentTarget && setSelectedSchool(null)}
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white p-6 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedSchool.name}</h3>
                  <p className="text-sm text-white/70 mt-1">{selectedSchool.code}</p>
                </div>
                <button onClick={() => setSelectedSchool(null)} className="text-white hover:text-[#D0B064]">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(selectedSchool.status)}`}>
                  {selectedSchool.status}
                </span>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#D0B064]" /> Lokasi
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                    <p className="text-gray-700">{selectedSchool.address}</p>
                    <p className="text-gray-600">{selectedSchool.city}</p>
                    <p className="text-xs text-gray-500">Koordinat: {selectedSchool.latitude}, {selectedSchool.longitude}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-[#D0B064]" /> Kontak
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">PIC Sekolah</p>
                      <p className="font-semibold text-gray-900">{selectedSchool.picName}</p>
                      <p className="text-gray-600">{selectedSchool.picPhone}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Telepon</p>
                      <p className="text-gray-900">{selectedSchool.phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Data Siswa</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-sm">
                      <p className="text-xs text-blue-600 font-semibold">Total Siswa</p>
                      <p className="text-xl font-bold text-blue-900">{selectedSchool.totalStudents}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-sm">
                      <p className="text-xs text-green-600 font-semibold">Kehadiran</p>
                      <p className="text-xl font-bold text-green-900">{selectedSchool.attendanceRate}%</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Pemenuhan Gizi</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3 text-sm">
                      <p className="text-xs text-purple-600 font-semibold">Skor Gizi</p>
                      <p className="text-xl font-bold text-purple-900">{selectedSchool.nutritionScore}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-sm">
                      <p className="text-xs text-orange-600 font-semibold">Terlayani</p>
                      <p className="text-xl font-bold text-orange-900">{selectedSchool.studentsServed}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button className="flex-1 px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] font-semibold text-sm flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" /> Detail
                  </button>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps?q=${selectedSchool.latitude},${selectedSchool.longitude}`, '_blank')}
                    className="flex-1 px-4 py-2 border-2 border-[#D0B064] text-[#D0B064] rounded-lg hover:bg-[#D0B064]/5 font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" /> Maps
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

export default PetaSekolahPemprov;