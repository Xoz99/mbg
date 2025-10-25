// app/kementerian/peta-sekolah/page.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import MinistryLayout from '@/components/layout/MinistryLayout';
import {
  MapPin, School, Users, Package, TrendingUp, TrendingDown,
  Search, Download, Eye, Phone, Navigation, CheckCircle,
  XCircle, Clock, ChefHat, Calendar, AlertCircle, Award
} from 'lucide-react';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });

const PetaSekolahPage = () => {
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedKitchen, setSelectedKitchen] = useState('all');
  const [selectedNutritionFilter, setSelectedNutritionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [activeTab, setActiveTab] = useState('map');

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

  // Prevent body scroll when modal is open
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

  // Mock data dengan tambahan data gizi
  const schoolsData = useMemo(() => [
    {
      id: '660e8400-e29b-41d4-a716-446655440001', code: 'SDN-KRW-001', name: 'SDN Karawang 1',
      address: 'Jl. Tuparev No. 123, Karawang Barat', phone: '0267-400111',
      latitude: -6.3100, longitude: 107.2950, province: 'Jawa Barat', city: 'Karawang',
      picName: 'Ibu Siti Nurhaliza', picPhone: '081234567801', isActive: true,
      kitchenCode: 'KTN-JB-001', kitchenName: 'Dapur Karawang Pusat',
      totalStudents: 450, totalClassrooms: 12, studentsServedToday: 448,
      attendanceRate: 99.6, lastDeliveryTime: '08:15', onTimeDelivery: true,
      nutritionScore: 92, nutritionStatus: 'EXCELLENT',
      protein: 95, carbs: 98, vegetables: 90, fruits: 88, milk: 85,
      avgWastage: 1.2, mealFinishRate: 98.5
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002', code: 'SDN-KRW-002', name: 'SDN Karawang 5',
      address: 'Jl. Kertabumi No. 45, Karawang Timur', phone: '0267-400222',
      latitude: -6.3200, longitude: 107.3100, province: 'Jawa Barat', city: 'Karawang',
      picName: 'Bapak Ahmad Yani', picPhone: '081234567802', isActive: true,
      kitchenCode: 'KTN-JB-001', kitchenName: 'Dapur Karawang Pusat',
      totalStudents: 380, totalClassrooms: 10, studentsServedToday: 375,
      attendanceRate: 98.7, lastDeliveryTime: '08:25', onTimeDelivery: true,
      nutritionScore: 88, nutritionStatus: 'GOOD',
      protein: 90, carbs: 95, vegetables: 85, fruits: 82, milk: 88,
      avgWastage: 1.8, mealFinishRate: 96.2
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003', code: 'SDN-BKS-001', name: 'SDN Bekasi Jaya 1',
      address: 'Jl. Raya Bekasi No. 88, Bekasi Timur', phone: '021-88400111',
      latitude: -6.2700, longitude: 107.0100, province: 'Jawa Barat', city: 'Bekasi',
      picName: 'Ibu Dewi Sartika', picPhone: '081234567803', isActive: true,
      kitchenCode: 'KTN-JB-002', kitchenName: 'Dapur Bekasi Timur',
      totalStudents: 520, totalClassrooms: 15, studentsServedToday: 515,
      attendanceRate: 99.0, lastDeliveryTime: '08:10', onTimeDelivery: true,
      nutritionScore: 95, nutritionStatus: 'EXCELLENT',
      protein: 98, carbs: 96, vegetables: 94, fruits: 92, milk: 95,
      avgWastage: 0.9, mealFinishRate: 99.1
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440004', code: 'SDN-BKS-002', name: 'SDN Bekasi Utara 3',
      address: 'Jl. Perjuangan No. 156, Bekasi Utara', phone: '021-88400222',
      latitude: -6.2400, longitude: 106.9900, province: 'Jawa Barat', city: 'Bekasi',
      picName: 'Bapak Hendra Gunawan', picPhone: '081234567804', isActive: true,
      kitchenCode: 'KTN-JB-002', kitchenName: 'Dapur Bekasi Timur',
      totalStudents: 490, totalClassrooms: 14, studentsServedToday: 485,
      attendanceRate: 99.0, lastDeliveryTime: '08:35', onTimeDelivery: false,
      nutritionScore: 72, nutritionStatus: 'NEEDS_IMPROVEMENT',
      protein: 75, carbs: 85, vegetables: 68, fruits: 65, milk: 70,
      avgWastage: 3.2, mealFinishRate: 89.5
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440005', code: 'SDN-BGR-001', name: 'SDN Bogor Tengah 2',
      address: 'Jl. Pajajaran No. 200, Bogor Tengah', phone: '0251-888111',
      latitude: -6.6000, longitude: 106.8000, province: 'Jawa Barat', city: 'Bogor',
      picName: 'Ibu Kartini Wijaya', picPhone: '081234567805', isActive: true,
      kitchenCode: 'KTN-JB-003', kitchenName: 'Dapur Bogor Selatan',
      totalStudents: 410, totalClassrooms: 12, studentsServedToday: 408,
      attendanceRate: 99.5, lastDeliveryTime: '08:20', onTimeDelivery: true,
      nutritionScore: 85, nutritionStatus: 'GOOD',
      protein: 88, carbs: 90, vegetables: 82, fruits: 80, milk: 85,
      avgWastage: 1.5, mealFinishRate: 95.8
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440006', code: 'SDN-TNG-001', name: 'SDN Tangerang Kota 5',
      address: 'Jl. Daan Mogot Km. 20, Tangerang', phone: '021-55888111',
      latitude: -6.1850, longitude: 106.6400, province: 'Banten', city: 'Tangerang',
      picName: 'Ibu Ratna Sari', picPhone: '081234567806', isActive: true,
      kitchenCode: 'KTN-BT-001', kitchenName: 'Dapur Tangerang Barat',
      totalStudents: 550, totalClassrooms: 16, studentsServedToday: 545,
      attendanceRate: 99.1, lastDeliveryTime: '08:15', onTimeDelivery: true,
      nutritionScore: 68, nutritionStatus: 'NEEDS_IMPROVEMENT',
      protein: 70, carbs: 80, vegetables: 65, fruits: 60, milk: 65,
      avgWastage: 3.8, mealFinishRate: 87.2
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440007', code: 'SDN-SMG-001', name: 'SDN Semarang 12',
      address: 'Jl. Pemuda No. 180, Semarang Tengah', phone: '024-8888111',
      latitude: -6.9750, longitude: 110.4250, province: 'Jawa Tengah', city: 'Semarang',
      picName: 'Bapak Bambang Suryono', picPhone: '081234567807', isActive: true,
      kitchenCode: 'KTN-JT-001', kitchenName: 'Dapur Semarang Utara',
      totalStudents: 480, totalClassrooms: 14, studentsServedToday: 478,
      attendanceRate: 99.6, lastDeliveryTime: '08:18', onTimeDelivery: true,
      nutritionScore: 96, nutritionStatus: 'EXCELLENT',
      protein: 98, carbs: 97, vegetables: 95, fruits: 94, milk: 96,
      avgWastage: 0.8, mealFinishRate: 99.5
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440008', code: 'SDN-SBY-001', name: 'SDN Surabaya 45',
      address: 'Jl. Raya Darmo No. 88, Surabaya', phone: '031-7777111',
      latitude: -7.2650, longitude: 112.7400, province: 'Jawa Timur', city: 'Surabaya',
      picName: 'Ibu Tri Wahyuni', picPhone: '081234567808', isActive: true,
      kitchenCode: 'KTN-JI-001', kitchenName: 'Dapur Surabaya Timur',
      totalStudents: 620, totalClassrooms: 18, studentsServedToday: 615,
      attendanceRate: 99.2, lastDeliveryTime: '08:22', onTimeDelivery: true,
      nutritionScore: 78, nutritionStatus: 'GOOD',
      protein: 82, carbs: 85, vegetables: 75, fruits: 72, milk: 76,
      avgWastage: 2.1, mealFinishRate: 92.8
    }
  ], []);

  const kitchenLocations: any = {
    'KTN-JB-001': { lat: -6.3064, lng: 107.3006 },
    'KTN-JB-002': { lat: -6.2615, lng: 107.0012 },
    'KTN-JB-003': { lat: -6.5971, lng: 106.8060 },
    'KTN-BT-001': { lat: -6.1781, lng: 106.6298 },
    'KTN-JT-001': { lat: -6.9667, lng: 110.4167 },
    'KTN-JI-001': { lat: -7.2575, lng: 112.7521 }
  };

  const filteredSchools = useMemo(() => {
    return schoolsData.filter(s => {
      const matchProvince = selectedProvince === 'all' || s.province === selectedProvince;
      const matchKitchen = selectedKitchen === 'all' || s.kitchenCode === selectedKitchen;
      const matchNutrition = selectedNutritionFilter === 'all' || s.nutritionStatus === selectedNutritionFilter;
      const matchSearch = searchQuery === '' || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchProvince && matchKitchen && matchNutrition && matchSearch;
    });
  }, [schoolsData, selectedProvince, selectedKitchen, selectedNutritionFilter, searchQuery]);

  const provinces = useMemo(() => [...new Set(schoolsData.map(s => s.province))].sort(), [schoolsData]);
  const kitchens = useMemo(() => [...new Set(schoolsData.map(s => ({ code: s.kitchenCode, name: s.kitchenName })))], [schoolsData]);

  const stats = useMemo(() => ({
    total: schoolsData.length,
    active: schoolsData.filter(s => s.isActive).length,
    totalStudents: schoolsData.reduce((sum, s) => sum + s.totalStudents, 0),
    studentsServedToday: schoolsData.reduce((sum, s) => sum + s.studentsServedToday, 0),
    avgAttendance: (schoolsData.reduce((sum, s) => sum + s.attendanceRate, 0) / schoolsData.length).toFixed(1),
    onTimeDeliveries: schoolsData.filter(s => s.onTimeDelivery).length,
    excellentNutrition: schoolsData.filter(s => s.nutritionStatus === 'EXCELLENT').length,
    goodNutrition: schoolsData.filter(s => s.nutritionStatus === 'GOOD').length,
    needsImprovement: schoolsData.filter(s => s.nutritionStatus === 'NEEDS_IMPROVEMENT').length,
    avgNutritionScore: (schoolsData.reduce((sum, s) => sum + s.nutritionScore, 0) / schoolsData.length).toFixed(1)
  }), [schoolsData]);

  // Sort sekolah berdasarkan gizi
  const topNutritionSchools = useMemo(() => 
    [...schoolsData].sort((a, b) => b.nutritionScore - a.nutritionScore).slice(0, 5),
    [schoolsData]
  );

  const bottomNutritionSchools = useMemo(() => 
    [...schoolsData].sort((a, b) => a.nutritionScore - b.nutritionScore).slice(0, 5),
    [schoolsData]
  );

  const getNutritionColor = (status: string) => {
    const colors: any = {
      EXCELLENT: 'bg-green-100 text-green-700 border-green-300',
      GOOD: 'bg-blue-100 text-blue-700 border-blue-300',
      NEEDS_IMPROVEMENT: 'bg-orange-100 text-orange-700 border-orange-300',
      POOR: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[status] || colors.GOOD;
  };

  const getNutritionText = (status: string) => {
    const text: any = {
      EXCELLENT: 'Sangat Baik',
      GOOD: 'Baik',
      NEEDS_IMPROVEMENT: 'Perlu Perbaikan',
      POOR: 'Buruk'
    };
    return text[status] || status;
  };

  const createSchoolIcon = (status: string) => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    const colors: any = {
      EXCELLENT: '#10b981',
      GOOD: '#3b82f6',
      NEEDS_IMPROVEMENT: '#f59e0b',
      POOR: '#ef4444'
    };
    const color = colors[status] || colors.GOOD;
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="transform: rotate(45deg); color: white; font-size: 14px; font-weight: bold;">🏫</div></div>`,
      className: 'custom-marker', iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28]
    });
  };

  const createKitchenIcon = () => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 16px; font-weight: bold;">🍳</div></div>`,
      className: 'custom-marker', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16]
    });
  };

  return (
    <MinistryLayout currentPage="peta-sekolah">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Peta Sekolah & Analisis Gizi</h1>
          <p className="text-sm text-gray-600 mt-1">Monitoring lokasi sekolah dan status pemenuhan gizi</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-blue-600 w-fit"><School className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mt-3 mb-1">TOTAL SEKOLAH</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-green-600 w-fit"><Award className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mt-3 mb-1">GIZI SANGAT BAIK</p>
            <p className="text-2xl font-bold text-gray-900">{stats.excellentNutrition}</p>
            <p className="text-xs text-gray-500">{((stats.excellentNutrition/stats.total)*100).toFixed(0)}% sekolah</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-blue-500 w-fit"><CheckCircle className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mt-3 mb-1">GIZI BAIK</p>
            <p className="text-2xl font-bold text-gray-900">{stats.goodNutrition}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-orange-600 w-fit"><AlertCircle className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mt-3 mb-1">PERLU PERBAIKAN</p>
            <p className="text-2xl font-bold text-gray-900">{stats.needsImprovement}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-purple-600 w-fit"><Users className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mt-3 mb-1">TOTAL SISWA</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="p-2.5 rounded-lg bg-indigo-600 w-fit"><TrendingUp className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-medium text-gray-600 mt-3 mb-1">AVG SKOR GIZI</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgNutritionScore}</p>
            <p className="text-xs text-gray-500">dari 100</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Cari sekolah..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B064]" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D0B064]">
                <option value="all">Semua Provinsi</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={selectedNutritionFilter} onChange={(e) => setSelectedNutritionFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D0B064]">
                <option value="all">Semua Status Gizi</option>
                <option value="EXCELLENT">Sangat Baik</option>
                <option value="GOOD">Baik</option>
                <option value="NEEDS_IMPROVEMENT">Perlu Perbaikan</option>
              </select>
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={showConnections} onChange={(e) => setShowConnections(e.target.checked)} className="w-4 h-4 text-[#D0B064] rounded" />
                <span>Tampilkan Koneksi</span>
              </label>
              <button className="px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-semibold text-sm flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button onClick={() => setActiveTab('map')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'map' ? 'bg-[#D0B064] text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>Peta Sekolah</button>
          <button onClick={() => setActiveTab('nutrition')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'nutrition' ? 'bg-[#D0B064] text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>Analisis Gizi</button>
        </div>

        {activeTab === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px] lg:h-[650px] ${selectedSchool ? 'pointer-events-none' : ''}`}>
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="font-bold text-gray-900">Peta Lokasi Sekolah</h3>
                <p className="text-xs text-gray-500 mt-1">Menampilkan {filteredSchools.length} sekolah</p>
              </div>
              <div className="flex-1 min-h-0">
                {mapReady && (
                  <MapContainer center={[-2.5489, 118.0149]} zoom={6} style={{ height: '100%', width: '100%' }}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {showConnections && filteredSchools.map(school => {
                      const kitchen = kitchenLocations[school.kitchenCode];
                      if (!kitchen) return null;
                      return <Polyline key={`line-${school.id}`} positions={[[kitchen.lat, kitchen.lng], [school.latitude, school.longitude]]} pathOptions={{ color: '#10b981', weight: 2, opacity: 0.5, dashArray: '5, 10' }} />;
                    })}
                    {showConnections && Object.entries(kitchenLocations).map(([code, pos]: any) => (
                      <Marker key={`kitchen-${code}`} position={[pos.lat, pos.lng]} icon={createKitchenIcon()}>
                        <Popup><div className="p-2"><p className="font-bold text-sm">Dapur {code}</p></div></Popup>
                      </Marker>
                    ))}
                    {filteredSchools.map(school => (
                      <Marker key={school.id} position={[school.latitude, school.longitude]} icon={createSchoolIcon(school.nutritionStatus)} eventHandlers={{ click: () => setSelectedSchool(school) }}>
                        <Popup><div className="p-2"><p className="font-bold text-sm">{school.name}</p><p className="text-xs text-gray-600">{school.code}</p><p className="text-xs mt-1">Skor Gizi: <strong>{school.nutritionScore}</strong></p></div></Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </div>
            </div>
            <div className={`lg:sticky lg:top-6 lg:self-start ${selectedSchool ? 'pointer-events-none' : ''}`}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px] lg:h-[650px]">
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <h3 className="font-bold text-gray-900">Daftar Sekolah</h3>
                  <p className="text-xs text-gray-500 mt-1">{filteredSchools.length} sekolah ditemukan</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {filteredSchools.map(school => (
                      <div key={school.id} onClick={() => setSelectedSchool(school)} className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${selectedSchool?.id === school.id ? 'border-[#D0B064] bg-[#D0B064]/5' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{school.name}</p>
                            <p className="text-xs text-gray-500">{school.code}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getNutritionColor(school.nutritionStatus)}`}>{getNutritionText(school.nutritionStatus)}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${school.nutritionScore >= 90 ? 'bg-green-500' : school.nutritionScore >= 80 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${school.nutritionScore}%` }} />
                          </div>
                          <span className="text-xs font-bold">{school.nutritionScore}</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1"><Users className="w-3 h-3 flex-shrink-0" /><span>{school.totalStudents} siswa</span></div>
                          <div className="flex items-center gap-1"><ChefHat className="w-3 h-3 flex-shrink-0" /><span className="truncate">{school.kitchenName}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Nutrition */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Top 5 Sekolah - Gizi Terbaik</h3>
                  <p className="text-xs text-gray-500">Sekolah dengan skor gizi tertinggi</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {topNutritionSchools.map((school, idx) => (
                  <div key={school.id} onClick={() => setSelectedSchool(school)} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900">{school.name}</p>
                        <p className="text-xs text-gray-600">{school.city}, {school.province}</p>
                        <div className="grid grid-cols-5 gap-2 mt-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Protein</p>
                            <p className="text-sm font-bold text-green-700">{school.protein}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Karbo</p>
                            <p className="text-sm font-bold text-green-700">{school.carbs}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Sayur</p>
                            <p className="text-sm font-bold text-green-700">{school.vegetables}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Buah</p>
                            <p className="text-sm font-bold text-green-700">{school.fruits}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Susu</p>
                            <p className="text-sm font-bold text-green-700">{school.milk}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
                          <span className="text-xs text-gray-600">Skor Total</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-green-200 rounded-full h-2">
                              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${school.nutritionScore}%` }} />
                            </div>
                            <span className="text-lg font-bold text-green-700">{school.nutritionScore}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-gray-600">Wastage: <strong className="text-green-600">{school.avgWastage}%</strong></span>
                          <span className="text-gray-600">Finish Rate: <strong className="text-green-600">{school.mealFinishRate}%</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 5 Nutrition */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Perlu Perhatian - Gizi Rendah</h3>
                  <p className="text-xs text-gray-500">Sekolah yang memerlukan intervensi segera</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {bottomNutritionSchools.map((school, idx) => (
                  <div key={school.id} onClick={() => setSelectedSchool(school)} className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-orange-600 text-white rounded-full font-bold text-lg flex-shrink-0">
                        ⚠️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900">{school.name}</p>
                        <p className="text-xs text-gray-600">{school.city}, {school.province}</p>
                        <div className="grid grid-cols-5 gap-2 mt-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Protein</p>
                            <p className={`text-sm font-bold ${school.protein < 75 ? 'text-red-600' : school.protein < 85 ? 'text-orange-600' : 'text-green-600'}`}>{school.protein}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Karbo</p>
                            <p className={`text-sm font-bold ${school.carbs < 75 ? 'text-red-600' : school.carbs < 85 ? 'text-orange-600' : 'text-green-600'}`}>{school.carbs}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Sayur</p>
                            <p className={`text-sm font-bold ${school.vegetables < 75 ? 'text-red-600' : school.vegetables < 85 ? 'text-orange-600' : 'text-green-600'}`}>{school.vegetables}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Buah</p>
                            <p className={`text-sm font-bold ${school.fruits < 75 ? 'text-red-600' : school.fruits < 85 ? 'text-orange-600' : 'text-green-600'}`}>{school.fruits}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Susu</p>
                            <p className={`text-sm font-bold ${school.milk < 75 ? 'text-red-600' : school.milk < 85 ? 'text-orange-600' : 'text-green-600'}`}>{school.milk}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-200">
                          <span className="text-xs text-gray-600">Skor Total</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-orange-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${school.nutritionScore < 70 ? 'bg-red-600' : 'bg-orange-600'}`} style={{ width: `${school.nutritionScore}%` }} />
                            </div>
                            <span className="text-lg font-bold text-orange-700">{school.nutritionScore}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-gray-600">Wastage: <strong className="text-red-600">{school.avgWastage}%</strong></span>
                          <span className="text-gray-600">Finish Rate: <strong className="text-orange-600">{school.mealFinishRate}%</strong></span>
                        </div>
                        <div className="mt-3 p-2 bg-orange-100 rounded text-xs">
                          <p className="font-semibold text-orange-900">Rekomendasi:</p>
                          <ul className="mt-1 space-y-1 text-orange-800">
                            {school.protein < 75 && <li>• Tingkatkan porsi protein</li>}
                            {school.vegetables < 75 && <li>• Variasi sayuran lebih beragam</li>}
                            {school.fruits < 75 && <li>• Tambahkan buah segar</li>}
                            {school.milk < 75 && <li>• Program susu tambahan</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* School Detail Modal */}
        {selectedSchool && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedSchool(null);
              }
            }}
          >
            <div 
              className="bg-white rounded-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold">{selectedSchool.name}</h3>
                    <p className="text-sm text-white/70 mt-1">{selectedSchool.code}</p>
                  </div>
                  <button onClick={() => setSelectedSchool(null)} className="text-white hover:text-[#D0B064] transition-colors flex-shrink-0">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status Gizi */}
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getNutritionColor(selectedSchool.nutritionStatus)}`}>
                      {getNutritionText(selectedSchool.nutritionStatus)}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div className={`h-3 rounded-full ${selectedSchool.nutritionScore >= 90 ? 'bg-green-500' : selectedSchool.nutritionScore >= 80 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${selectedSchool.nutritionScore}%` }} />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{selectedSchool.nutritionScore}</span>
                    </div>
                  </div>
                </div>

                {/* Nutrition Breakdown */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#D0B064]" />
                    Detail Pemenuhan Gizi
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-600 font-semibold">Protein</p>
                      <p className="text-xl font-bold text-blue-900 my-1">{selectedSchool.protein}</p>
                      <div className="w-full bg-blue-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${selectedSchool.protein}%` }} />
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-600 font-semibold">Karbo</p>
                      <p className="text-xl font-bold text-green-900 my-1">{selectedSchool.carbs}</p>
                      <div className="w-full bg-green-200 rounded-full h-1.5">
                        <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${selectedSchool.carbs}%` }} />
                      </div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-emerald-600 font-semibold">Sayur</p>
                      <p className="text-xl font-bold text-emerald-900 my-1">{selectedSchool.vegetables}</p>
                      <div className="w-full bg-emerald-200 rounded-full h-1.5">
                        <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${selectedSchool.vegetables}%` }} />
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-orange-600 font-semibold">Buah</p>
                      <p className="text-xl font-bold text-orange-900 my-1">{selectedSchool.fruits}</p>
                      <div className="w-full bg-orange-200 rounded-full h-1.5">
                        <div className="bg-orange-600 h-1.5 rounded-full" style={{ width: `${selectedSchool.fruits}%` }} />
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600 font-semibold">Susu</p>
                      <p className="text-xl font-bold text-purple-900 my-1">{selectedSchool.milk}</p>
                      <div className="w-full bg-purple-200 rounded-full h-1.5">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${selectedSchool.milk}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Wastage Rate</p>
                      <p className={`text-xl font-bold ${selectedSchool.avgWastage < 1.5 ? 'text-green-600' : selectedSchool.avgWastage < 2.5 ? 'text-yellow-600' : 'text-red-600'}`}>{selectedSchool.avgWastage}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Meal Finish Rate</p>
                      <p className={`text-xl font-bold ${selectedSchool.mealFinishRate >= 95 ? 'text-green-600' : selectedSchool.mealFinishRate >= 90 ? 'text-blue-600' : 'text-orange-600'}`}>{selectedSchool.mealFinishRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Location & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#D0B064]" />
                      Lokasi
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-700">{selectedSchool.address}</p>
                      <p className="text-gray-600 mt-1">{selectedSchool.city}, {selectedSchool.province}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#D0B064]" />
                      Kontak
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-500 text-xs">PIC Sekolah</p>
                      <p className="font-semibold text-gray-900">{selectedSchool.picName}</p>
                      <p className="text-gray-600 text-xs">{selectedSchool.picPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button className="flex-1 px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                    <Eye className="w-4 h-4" /> Lihat Detail Lengkap
                  </button>
                  <button onClick={() => window.open(`https://www.google.com/maps?q=${selectedSchool.latitude},${selectedSchool.longitude}`, '_blank')} className="flex-1 px-4 py-2 border-2 border-[#D0B064] text-[#D0B064] rounded-lg hover:bg-[#D0B064]/5 font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                    <Navigation className="w-4 h-4" /> Buka Maps
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MinistryLayout>
  );
};

export default PetaSekolahPage;