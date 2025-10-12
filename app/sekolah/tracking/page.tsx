// app/sekolah/tracking/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { 
  MapPin, Truck, Clock, CheckCircle, Navigation, Phone, User, Package, 
  TrendingUp, MapPinned, AlertCircle
} from 'lucide-react';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });

const TrackingPage = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [route, setRoute] = useState<[number, number][]>([]);

  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

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
    if (!currentTime) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [currentTime]);

  const formattedTime = useMemo(() => {
    if (!currentTime) return '--:--:--';
    return currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [currentTime]);

  const school = useMemo(() => ({
    name: 'SMAN 5 Karawang',
    address: 'Jl. Tuparev No.123, Karawang Barat',
    lat: -6.3156,
    lng: 107.3289
  }), []);

  const kitchen = useMemo(() => ({
    name: 'Dapur Karawang Pusat',
    lat: -6.3064,
    lng: 107.3006
  }), []);

  const vehicle = useMemo(() => ({
    id: 'MBG-KRW-05',
    driver: 'Pak Budi Santoso',
    phone: '081234567890',
    status: 'dalam_perjalanan' as const,
    lokasi: 'Jl. Raya Karawang - 2.8 km dari sekolah',
    lat: -6.3110,
    lng: 107.3150,
    estimasi: '12 menit',
    jarak: '2.8 km',
    kapasitas: 485,
    terisi: 485,
    waktuBerangkat: '10:15',
    estimasiTiba: '11:30',
    kecepatan: '35 km/jam'
  }), []);

  useEffect(() => {
    if (!mapReady || route.length > 0) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${vehicle.lng},${vehicle.lat};${school.lng},${school.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates;
          const leafletCoords: [number, number][] = coords.map((c: number[]) => [c[1], c[0]]);
          setRoute(leafletCoords);
          console.log('✅ Route loaded from vehicle to school:', leafletCoords.length, 'points');
        } else {
          setRoute([[vehicle.lat, vehicle.lng], [school.lat, school.lng]]);
        }
      } catch (error) {
        console.error('❌ Route error:', error);
        setRoute([[vehicle.lat, vehicle.lng], [school.lat, school.lng]]);
      }
    };

    fetchRoute();
  }, [mapReady, vehicle.lat, vehicle.lng, school.lat, school.lng, route.length]);

  const getStatusInfo = (status: string) => {
    const statusMap: any = {
      dalam_perjalanan: { text: 'Dalam Perjalanan', icon: Truck, bgClass: 'bg-blue-500' },
      sampai: { text: 'Sudah Sampai', icon: CheckCircle, bgClass: 'bg-green-500' },
      belum_berangkat: { text: 'Belum Berangkat', icon: Clock, bgClass: 'bg-orange-500' }
    };
    return statusMap[status] || statusMap.belum_berangkat;
  };

  const statusInfo = getStatusInfo(vehicle.status);
  const StatusIcon = statusInfo.icon;

  const createTruckIcon = () => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    const color = vehicle.status === 'sampai' ? '#10b981' : '#3b82f6';
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 18px;">🚚</div></div>`,
      className: 'custom-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  };

  const createSchoolIcon = () => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 16px;">🏫</div></div>`,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 mb-0.5">{title}</p>
          <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 pl-12">{subtitle}</p>
    </div>
  );

  return (
    <SekolahLayout currentPage="tracking">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Tracking Pengiriman MBG</h1>
            <p className="text-sm md:text-base text-gray-600">Pantau lokasi real-time kendaraan pengiriman makanan ke sekolah Anda</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard title="Kendaraan" value={vehicle.id} subtitle="ID Kendaraan MBG" icon={Truck} color="bg-blue-500" />
            <StatCard title="Status" value={statusInfo.text} subtitle={`ETA: ${vehicle.estimasi}`} icon={StatusIcon} color={statusInfo.bgClass} />
            <StatCard title="Jarak" value={vehicle.jarak} subtitle={`Kecepatan: ${vehicle.kecepatan}`} icon={Navigation} color="bg-green-500" />
            <StatCard title="Muatan" value={vehicle.terisi} subtitle={`Dari ${vehicle.kapasitas} porsi`} icon={Package} color="bg-purple-500" />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
                <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] p-4 md:p-5 text-white">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                      <div>
                        <h3 className="text-base md:text-lg font-semibold">Peta Live Tracking</h3>
                        <p className="text-xs text-white/70">OpenStreetMap - Real-time Location</p>
                      </div>
                    </div>
                    {vehicle.status === 'dalam_perjalanan' && (
                      <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-400/30">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs md:text-sm font-semibold">Live</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-[350px] md:h-[450px] lg:h-[500px]">
                  {mapReady ? (
                    <MapContainer center={[vehicle.lat, vehicle.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                      
                      {route.length > 0 && (
                        <Polyline positions={route} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7 }} />
                      )}

                      <Marker position={[school.lat, school.lng]} icon={createSchoolIcon()}>
                        <Popup>
                          <div className="p-2">
                            <p className="font-bold text-sm">{school.name}</p>
                            <p className="text-xs text-gray-600">{school.address}</p>
                          </div>
                        </Popup>
                      </Marker>

                      <Marker position={[vehicle.lat, vehicle.lng]} icon={createTruckIcon()}>
                        <Popup>
                          <div className="p-2">
                            <p className="font-bold text-sm">{vehicle.id}</p>
                            <p className="text-xs text-gray-600">{vehicle.driver}</p>
                            <p className="text-xs text-gray-600">ETA: {vehicle.estimasi}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">Loading map...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 lg:space-y-6">
              {/* Vehicle Info Card */}
              <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div className={`p-2.5 ${statusInfo.bgClass} rounded-lg flex-shrink-0`}>
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600">Kendaraan</p>
                    <p className="text-lg md:text-xl font-bold text-gray-900 truncate">{vehicle.id}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Driver</p>
                      <p className="font-medium text-gray-900 text-sm truncate">{vehicle.driver}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Telepon</p>
                      <p className="font-medium text-gray-900 text-sm">{vehicle.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                    <MapPinned className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Lokasi Saat Ini</p>
                      <p className="font-medium text-gray-900 text-sm break-words">{vehicle.lokasi}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                    <Package className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1.5">Muatan</p>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-medium text-gray-900 text-sm">{vehicle.terisi} / {vehicle.kapasitas} porsi</p>
                        <p className="text-xs text-green-600 font-semibold">100%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Card */}
              <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] rounded-xl p-4 md:p-5 text-white shadow-lg">
                <div className="flex items-center gap-2.5 mb-4">
                  <Clock className="w-5 h-5 flex-shrink-0" />
                  <h3 className="text-base md:text-lg font-semibold">Waktu Real-time</h3>
                </div>
                <div className="bg-[#D0B064] rounded-lg p-3 md:p-4 mb-4">
                  <p className="text-2xl md:text-3xl font-mono font-bold text-center">{formattedTime}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/70 mb-1">Berangkat</p>
                    <p className="text-base md:text-lg font-bold">{vehicle.waktuBerangkat}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/70 mb-1">Est. Tiba</p>
                    <p className="text-base md:text-lg font-bold">{vehicle.estimasiTiba}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Destination Info */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
              <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                <div className="p-3 md:p-4 bg-red-500 rounded-xl flex-shrink-0">
                  <MapPin className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-gray-600 mb-1">Tujuan Pengiriman</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">{school.name}</p>
                  <p className="text-sm md:text-base text-gray-600 mt-1 break-words">{school.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4 w-full lg:w-auto">
                <div className="text-center p-3 md:p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <Navigation className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Jarak</p>
                  <p className="text-lg md:text-xl font-bold text-blue-600">{vehicle.jarak}</p>
                </div>
                <div className="text-center p-3 md:p-4 bg-green-50 rounded-xl border border-green-100">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Kecepatan</p>
                  <p className="text-lg md:text-xl font-bold text-green-600">{vehicle.kecepatan}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SekolahLayout>
  );
};

export default TrackingPage;