// app/dapur/monitoringdriver/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DapurLayout from '@/components/layout/DapurLayout';
import {
  MapPin, Truck, Navigation, Phone, User, Package,
  TrendingUp, MapPinned, AlertCircle, Loader, Clock,
  UtensilsCrossed, Activity, Radio, Maximize2, Minimize2, X
} from 'lucide-react';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://demombgv1.xyz';

// Skeleton Components
const SkeletonStatCard = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  </div>
);

const SkeletonMap = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
    <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4 md:p-5">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-600 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-600 rounded w-64"></div>
      </div>
    </div>
    <div className="h-[500px] md:h-[600px] lg:h-[700px] bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-bounce" />
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
      </div>
    </div>
  </div>
);

const SkeletonDriverCard = () => (
  <div className="p-4 rounded-lg border border-gray-100 bg-white animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      <div className="h-3 bg-gray-200 rounded w-3/6"></div>
    </div>
  </div>
);

const SkeletonDriverList = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4">
      <div className="h-5 bg-gray-600 rounded w-32 animate-pulse"></div>
    </div>
    <div className="p-4 space-y-3">
      {[...Array(3)].map((_, i) => (
        <SkeletonDriverCard key={i} />
      ))}
    </div>
  </div>
);

const MonitoringDriversPage = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeDrivers, setActiveDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isFetchingRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<any>(null);
  const fullscreenMapRef = useRef<any>(null);

  // Initialize auth
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken') || localStorage.getItem('mbg_token');
    
    console.log('[MONITORING INIT] authToken:', storedToken ? 'EXISTS' : 'MISSING');

    if (storedToken) setAuthToken(storedToken);

    if (!storedToken) {
      setLoading(false);
      setError('Token autentikasi tidak ditemukan');
    }
  }, []);

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

  // Fetch active drivers
  const fetchActiveDrivers = useCallback(async () => {
    if (!authToken || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;

      const response = await fetch(`${API_BASE_URL}/api/drivers/active`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();
      const drivers = result.data || result;

      console.log('[MONITORING] Active drivers:', drivers);

      if (Array.isArray(drivers) && drivers.length > 0) {
        setActiveDrivers(drivers);
        setError(null);
      } else {
        setActiveDrivers([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching active drivers:', err);
      setError(err instanceof Error ? err.message : 'Gagal mengambil data driver');
      setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [authToken]);

  // Initial fetch
  useEffect(() => {
    if (authToken) {
      fetchActiveDrivers();
    }
  }, [authToken, fetchActiveDrivers]);

  // Polling every 5 seconds
  useEffect(() => {
    if (!authToken) return;

    pollingIntervalRef.current = setInterval(() => {
      fetchActiveDrivers();
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [authToken, fetchActiveDrivers]);

  // Handle keyboard shortcut for fullscreen (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  // Process drivers data
  const processedDrivers = useMemo(() => {
    return activeDrivers.map(driver => {
      const lat = driver.lastLatitude;
      const lng = driver.lastLongitude;
      
      if (!lat || !lng) return null;

      const lastUpdate = driver.lastLocationUpdate ? new Date(driver.lastLocationUpdate) : null;
      const waktuUpdate = lastUpdate 
        ? lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
        : '-';

      const dapurNama = driver.driverOf?.nama || 'Dapur';
      
      const pengiriman = driver.pengirimanDriver && driver.pengirimanDriver.length > 0 
        ? driver.pengirimanDriver[0] 
        : null;

      // Calculate time since last update
      const minutesSinceUpdate = lastUpdate 
        ? Math.round((Date.now() - lastUpdate.getTime()) / 60000)
        : null;

      const isActive = minutesSinceUpdate !== null && minutesSinceUpdate < 10;

      return {
        id: driver.id,
        name: driver.name || 'Driver',
        email: driver.email || '-',
        phone: driver.phone || '-',
        vehicleId: driver.nomorKendaraan || 'N/A',
        lat,
        lng,
        dapurNama,
        waktuUpdate,
        minutesSinceUpdate,
        isActive,
        pengiriman,
        status: isActive ? 'active' : 'idle',
        lastUpdate
      };
    }).filter(d => d !== null);
  }, [activeDrivers]);

  // Map center - average of all driver positions or default
  const mapCenter = useMemo(() => {
    if (processedDrivers.length === 0) {
      return [-6.2, 106.816666]; // Default Jakarta
    }

    const avgLat = processedDrivers.reduce((sum, d) => sum + d.lat, 0) / processedDrivers.length;
    const avgLng = processedDrivers.reduce((sum, d) => sum + d.lng, 0) / processedDrivers.length;

    return [avgLat, avgLng];
  }, [processedDrivers]);

  // Stats
  const stats = useMemo(() => {
    const total = processedDrivers.length;
    const active = processedDrivers.filter(d => d.isActive).length;
    const idle = total - active;
    
    return { total, active, idle };
  }, [processedDrivers]);

  const createDriverIcon = (isActive: boolean, isSelected: boolean) => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    const color = isActive ? '#10b981' : '#6b7280';
    const size = isSelected ? 44 : 36;
    const borderWidth = isSelected ? 4 : 3;
    
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${borderWidth}px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; position: relative;">
        <div style="color: white; font-size: 18px;">🚚</div>
        ${isActive ? '<div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background-color: #10b981; border: 2px solid white; border-radius: 50%; animation: pulse 2s infinite;"></div>' : ''}
      </div>`,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  const handleDriverClick = (driverId: string) => {
    setSelectedDriver(driverId);
    
    // Center map on selected driver
    const driver = processedDrivers.find(d => d.id === driverId);
    if (driver && mapRef.current) {
      mapRef.current.setView([driver.lat, driver.lng], 15, {
        animate: true,
        duration: 0.5
      });
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (error && !authToken) {
    return (
      <DapurLayout currentPage="monitoringdriver">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold mb-2">Error</p>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </DapurLayout>
    );
  }

  return (
    <DapurLayout currentPage="monitoringdriver">
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
  <h1 className="text-3xl font-bold text-gray-900 mb-1 -mt-2">
    Monitoring Driver Real-time
  </h1>
  <p className="text-sm text-gray-600">
    Pantau lokasi dan status semua driver aktif secara real-time
  </p>
</div>


          {/* Stats Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard 
                title="Total Driver" 
                value={stats.total} 
                subtitle="Driver terdaftar"
                icon={Truck} 
                color="bg-blue-500" 
              />
              <StatCard 
                title="Driver Aktif" 
                value={stats.active} 
                subtitle={stats.active > 0 ? "Sedang dalam perjalanan" : "Tidak ada aktivitas"}
                icon={Activity} 
                color="bg-green-500" 
              />
              <StatCard 
                title="Driver Idle" 
                value={stats.idle} 
                subtitle="Tidak aktif / Offline"
                icon={Radio} 
                color="bg-gray-500" 
              />
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-3">
              {loading ? (
                <SkeletonMap />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
                  {/* Map Header */}
                  <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] p-4 md:p-5 text-white">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                        <div>
                          <h3 className="text-base md:text-lg font-semibold">Peta Monitoring Driver</h3>
                          <p className="text-xs text-white/70">OpenStreetMap - Live Location Tracking</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-400/30">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs md:text-sm font-semibold">Live • {formattedTime}</span>
                        </div>
                        <button
                          onClick={() => setIsFullscreen(true)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Full Screen (ESC untuk kembali)"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Map Container */}
                  <div className="h-[500px] md:h-[600px] lg:h-[700px]">
                    {mapReady ? (
                      processedDrivers.length > 0 ? (
                        <MapContainer 
                          center={mapCenter as [number, number]} 
                          zoom={12} 
                          style={{ height: '100%', width: '100%' }}
                          ref={mapRef}
                        >
                          <TileLayer 
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                            attribution="&copy; OpenStreetMap" 
                          />
                          
                          {processedDrivers.map((driver) => (
                            <Marker 
                              key={driver.id} 
                              position={[driver.lat, driver.lng]} 
                              icon={createDriverIcon(driver.isActive, selectedDriver === driver.id)}
                              eventHandlers={{
                                click: () => handleDriverClick(driver.id)
                              }}
                            >
                              <Popup>
                                <div className="p-2 min-w-[200px]">
                                  <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                    <div className={`w-3 h-3 rounded-full ${driver.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    <p className="font-bold text-sm">{driver.name}</p>
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <p className="text-gray-600">🚗 {driver.vehicleId}</p>
                                    <p className="text-gray-600">📞 {driver.phone}</p>
                                    <p className="text-gray-600">🍳 {driver.dapurNama}</p>
                                    <p className="text-gray-600">🕒 Update: {driver.waktuUpdate}</p>
                                    {driver.minutesSinceUpdate !== null && (
                                      <p className={`text-xs font-medium ${driver.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                        {driver.minutesSinceUpdate < 1 ? 'Baru saja' : `${driver.minutesSinceUpdate} menit lalu`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Popup>
                            </Marker>
                          ))}
                        </MapContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-100">
                          <div className="text-center">
                            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-semibold">Tidak Ada Driver Aktif</p>
                            <p className="text-gray-400 text-sm mt-1">Belum ada driver yang sedang online</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-100">
                        <Loader className="w-12 h-12 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Driver List Sidebar */}
            <div className="lg:col-span-1">
              {loading ? (
                <SkeletonDriverList />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                  <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] p-4 text-white">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Driver List ({processedDrivers.length})
                    </h3>
                  </div>

                  <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
                    {processedDrivers.length === 0 ? (
                      <div className="text-center py-12">
                        <Truck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 font-medium">Belum ada driver aktif</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {processedDrivers.map((driver) => (
                          <div 
                            key={driver.id}
                            onClick={() => handleDriverClick(driver.id)}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              selectedDriver === driver.id 
                                ? 'border-[#D0B064] bg-amber-50' 
                                : 'border-gray-100 hover:border-[#D0B064] bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${driver.isActive ? 'bg-green-500' : 'bg-gray-400'}`}>
                                <Truck className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate text-sm">{driver.name}</p>
                                <p className="text-xs text-gray-500">{driver.vehicleId}</p>
                              </div>
                              {driver.isActive && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-3 h-3" />
                                <span className="truncate">{driver.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <UtensilsCrossed className="w-3 h-3" />
                                <span className="truncate">{driver.dapurNama}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>{driver.waktuUpdate}</span>
                              </div>
                              {driver.minutesSinceUpdate !== null && (
                                <div className={`text-xs font-medium ${driver.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                  {driver.minutesSinceUpdate < 1 ? '• Baru saja' : `• ${driver.minutesSinceUpdate} menit lalu`}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #D0B064;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #1B263A;
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>

      {/* Fullscreen Map Modal - Outside main layout */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col overflow-hidden">
          {/* Fullscreen Header */}
          <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] p-4 md:p-5 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <MapPin className="w-6 h-6 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-semibold truncate">Peta Monitoring Driver - Full Screen</h3>
                <p className="text-xs text-white/70">OpenStreetMap - Live Location Tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-400/30 whitespace-nowrap">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs md:text-sm font-semibold">Live • {formattedTime}</span>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                title="Exit Full Screen (ESC)"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Map Container */}
          <div className="flex-1 relative w-full overflow-hidden">
            {mapReady ? (
              processedDrivers.length > 0 ? (
                <MapContainer
                  center={mapCenter as [number, number]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  ref={fullscreenMapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap"
                  />

                  {processedDrivers.map((driver) => (
                    <Marker
                      key={driver.id}
                      position={[driver.lat, driver.lng]}
                      icon={createDriverIcon(driver.isActive, selectedDriver === driver.id)}
                      eventHandlers={{
                        click: () => handleDriverClick(driver.id)
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                            <div className={`w-3 h-3 rounded-full ${driver.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <p className="font-bold text-sm">{driver.name}</p>
                          </div>
                          <div className="space-y-1 text-xs">
                            <p className="text-gray-600">🚗 {driver.vehicleId}</p>
                            <p className="text-gray-600">📞 {driver.phone}</p>
                            <p className="text-gray-600">🍳 {driver.dapurNama}</p>
                            <p className="text-gray-600">🕒 Update: {driver.waktuUpdate}</p>
                            {driver.minutesSinceUpdate !== null && (
                              <p className={`text-xs font-medium ${driver.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                {driver.minutesSinceUpdate < 1 ? 'Baru saja' : `${driver.minutesSinceUpdate} menit lalu`}
                              </p>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-300 font-semibold">Tidak Ada Driver Aktif</p>
                    <p className="text-gray-400 text-sm mt-1">Belum ada driver yang sedang online</p>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-900">
                <Loader className="w-12 h-12 animate-spin text-blue-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </DapurLayout>
  );
};

export default MonitoringDriversPage;