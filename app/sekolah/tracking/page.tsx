// app/sekolah/tracking/page.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { 
  MapPin, 
  Truck, 
  Clock, 
  CheckCircle,
  Navigation,
  Phone,
  User,
  Package,
  Timer,
  TrendingUp,
  MapPinned,
  AlertCircle,
  Activity
} from 'lucide-react';

// Leaflet Map Component
function LeafletMap({ vehicle, school }: any) {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        if (!mapRef.current) {
          const map = L.map('map').setView([school.lat, school.lng], 13);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);

          mapRef.current = map;
        }

        mapRef.current.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            layer.remove();
          }
        });

        const schoolIcon = L.divIcon({
          html: `<div class="flex flex-col items-center">
            <div class="p-4 bg-red-500 rounded-full shadow-xl border-4 border-white">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
            <div class="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold whitespace-nowrap">
              ${school.name}
            </div>
          </div>`,
          className: 'custom-marker',
          iconSize: [80, 100],
          iconAnchor: [40, 100]
        });

        L.marker([school.lat, school.lng], { icon: schoolIcon })
          .addTo(mapRef.current)
          .bindPopup(`
            <div class="p-3">
              <h3 class="font-bold text-gray-900 mb-2 text-lg">${school.name}</h3>
              <p class="text-sm text-gray-600 mb-1"><strong>📍 Alamat:</strong> ${school.address}</p>
              <p class="text-sm text-gray-600"><strong>🎯 Status:</strong> Tujuan Pengiriman</p>
            </div>
          `);

        const vehicleColor = vehicle.status === 'sampai' ? 'green' : 
                            vehicle.status === 'dalam_perjalanan' ? 'blue' : 'orange';
        
        const vehicleIcon = L.divIcon({
          html: `<div class="relative flex flex-col items-center">
            ${vehicle.status === 'dalam_perjalanan' ? `
              <div class="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
            ` : ''}
            <div class="relative p-4 bg-${vehicleColor}-500 rounded-full shadow-xl border-4 border-white z-10">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
              </svg>
            </div>
            <div class="mt-2 bg-${vehicleColor}-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <p class="text-sm font-bold whitespace-nowrap">${vehicle.id}</p>
            </div>
          </div>`,
          className: 'custom-marker',
          iconSize: [80, 100],
          iconAnchor: [40, 100]
        });

        const vehicleMarker = L.marker([vehicle.lat, vehicle.lng], { icon: vehicleIcon })
          .addTo(mapRef.current)
          .bindPopup(`
            <div class="p-3">
              <h3 class="font-bold text-gray-900 mb-2 text-lg">${vehicle.id}</h3>
              <p class="text-sm text-gray-600 mb-1"><strong>🚗 Driver:</strong> ${vehicle.driver}</p>
              <p class="text-sm text-gray-600 mb-1"><strong>📦 Porsi:</strong> ${vehicle.terisi} / ${vehicle.kapasitas}</p>
              <p class="text-sm text-gray-600 mb-1"><strong>⏱️ ETA:</strong> ${vehicle.estimasi}</p>
              <p class="text-sm font-semibold ${vehicle.status === 'sampai' ? 'text-green-600' : 'text-blue-600'}">
                ${vehicle.status === 'sampai' ? '✅ Sudah Sampai' : '🚚 Dalam Perjalanan'}
              </p>
            </div>
          `);

        if (vehicle.status === 'dalam_perjalanan') {
          L.polyline(
            [[vehicle.lat, vehicle.lng], [school.lat, school.lng]],
            {
              color: '#3b82f6',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10'
            }
          ).addTo(mapRef.current);
        }

        const bounds = L.latLngBounds([
          [vehicle.lat, vehicle.lng],
          [school.lat, school.lng]
        ]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });

        vehicleMarker.openPopup();
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [vehicle, school]);

  return (
    <>
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div id="map" className="w-full h-[550px] rounded-b-xl"></div>
    </>
  );
}

const TrackingPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  const school = useMemo(() => ({
    name: 'SMAN 5 Karawang',
    address: 'Jl. Tuparev No.123, Karawang Barat',
    lat: -6.3156,
    lng: 107.3289
  }), []);

  const vehicle = useMemo(() => ({
    id: 'MBG-KRW-05',
    driver: 'Pak Budi Santoso',
    phone: '081234567890',
    status: 'dalam_perjalanan' as const,
    lokasi: 'Jl. Raya Karawang - 2.8 km dari sekolah',
    lat: -6.3245,
    lng: 107.3380,
    estimasi: '12 menit',
    jarak: '2.8 km',
    kapasitas: 485,
    terisi: 485,
    waktuBerangkat: '10:15',
    waktuTiba: '-',
    estimasiTiba: '11:30',
    kecepatan: '35 km/jam'
  }), []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => 
    currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
    [currentTime]
  );

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'dalam_perjalanan':
        return {
          text: 'Dalam Perjalanan',
          icon: Truck,
          bgClass: 'bg-blue-500',
          textClass: 'text-blue-700',
          borderClass: 'border-blue-200',
          lightBgClass: 'bg-blue-50'
        };
      case 'sampai':
        return {
          text: 'Sudah Sampai',
          icon: CheckCircle,
          bgClass: 'bg-green-500',
          textClass: 'text-green-700',
          borderClass: 'border-green-200',
          lightBgClass: 'bg-green-50'
        };
      case 'belum_berangkat':
        return {
          text: 'Belum Berangkat',
          icon: Clock,
          bgClass: 'bg-orange-500',
          textClass: 'text-orange-700',
          borderClass: 'border-orange-200',
          lightBgClass: 'bg-orange-50'
        };
      default:
        return {
          text: 'Unknown',
          icon: AlertCircle,
          bgClass: 'bg-gray-500',
          textClass: 'text-gray-700',
          borderClass: 'border-gray-200',
          lightBgClass: 'bg-gray-50'
        };
    }
  };

  const statusInfo = getStatusInfo(vehicle.status);
  const StatusIcon = statusInfo.icon;

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );

  return (
    <SekolahLayout currentPage="tracking">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tracking Pengiriman MBG</h1>
        <p className="text-gray-600">Pantau lokasi real-time kendaraan pengiriman makanan ke sekolah Anda</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Kendaraan" 
          value={vehicle.id} 
          subtitle="ID Kendaraan MBG" 
          icon={Truck} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Status" 
          value={statusInfo.text} 
          subtitle={'ETA: ' + vehicle.estimasi} 
          icon={StatusIcon} 
          color={statusInfo.bgClass} 
        />
        <StatCard 
          title="Jarak" 
          value={vehicle.jarak} 
          subtitle={'Kecepatan: ' + vehicle.kecepatan} 
          icon={Navigation} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Muatan" 
          value={vehicle.terisi} 
          subtitle={'Dari ' + vehicle.kapasitas + ' porsi'} 
          icon={Package} 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-semibold">Peta Live Tracking</h3>
                    <p className="text-xs text-white/70">OpenStreetMap - Real-time Location</p>
                  </div>
                </div>
                {vehicle.status === 'dalam_perjalanan' && (
                  <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-400/30">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold">Live</span>
                  </div>
                )}
              </div>
            </div>

            <LeafletMap vehicle={vehicle} school={school} />
          </div>
        </div>

        {/* Vehicle Info Panel */}
        <div className="space-y-6">
          {/* Vehicle Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className={'p-3 ' + statusInfo.bgClass + ' rounded-lg'}>
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Kendaraan</p>
                <p className="text-xl font-bold text-gray-900">{vehicle.id}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Driver</p>
                  <p className="font-medium text-gray-900">{vehicle.driver}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Telepon</p>
                  <p className="font-medium text-gray-900">{vehicle.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPinned className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Lokasi Saat Ini</p>
                  <p className="font-medium text-gray-900 text-sm">{vehicle.lokasi}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Muatan</p>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{vehicle.terisi} / {vehicle.kapasitas} porsi</p>
                    <p className="text-sm text-green-600 font-semibold">100%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time Card */}
          <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Waktu Real-time</h3>
            </div>
            <div className="bg-[#D0B064] rounded-lg p-4">
              <p className="text-sm font-mono font-bold text-center text-3xl">
                {formattedTime}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">Berangkat</p>
                <p className="text-lg font-bold">{vehicle.waktuBerangkat}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">Est. Tiba</p>
                <p className="text-lg font-bold">{vehicle.estimasiTiba}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* School Info Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-red-500 rounded-xl">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tujuan Pengiriman</p>
              <p className="text-2xl font-bold text-gray-900">{school.name}</p>
              <p className="text-gray-600 mt-1">{school.address}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                <Navigation className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Jarak</p>
                <p className="text-xl font-bold text-blue-600">{vehicle.jarak}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Kecepatan</p>
                <p className="text-xl font-bold text-green-600">{vehicle.kecepatan}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SekolahLayout>
  );
};

export default TrackingPage;