'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { 
  MapPin, Truck, Clock, CheckCircle, Navigation, Phone, User, Package, 
  TrendingUp, MapPinned, AlertCircle, UtensilsCrossed
} from 'lucide-react';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://demombgv1.xyz';

interface DriverPosition {
  lat: number;
  lng: number;
  timestamp: number;
}

// Skeleton Components
const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div className="min-w-0 flex-1">
        <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
    <div className="h-3 bg-gray-200 rounded w-32 ml-12"></div>
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
    <div className="h-[350px] md:h-[450px] lg:h-[500px] bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-bounce" />
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
      </div>
    </div>
  </div>
);

const SkeletonSidebar = () => (
  <div className="space-y-4 lg:space-y-6">
    {/* Vehicle Info Skeleton */}
    <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
        <div className="min-w-0 flex-1">
          <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
            <div className="w-4 h-4 bg-gray-200 rounded mt-0.5 flex-shrink-0"></div>
            <div className="min-w-0 flex-1">
              <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Time Card Skeleton */}
    <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-4 md:p-5 shadow-lg animate-pulse">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-5 h-5 bg-gray-600 rounded flex-shrink-0"></div>
        <div className="h-5 bg-gray-600 rounded w-40"></div>
      </div>
      <div className="bg-gray-600 rounded-lg p-3 md:p-4 mb-4">
        <div className="h-10 bg-gray-500 rounded w-32 mx-auto"></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-600/50 rounded-lg p-3">
          <div className="h-3 bg-gray-500 rounded w-20 mb-2"></div>
          <div className="h-6 bg-gray-500 rounded w-16"></div>
        </div>
        <div className="bg-gray-600/50 rounded-lg p-3">
          <div className="h-3 bg-gray-500 rounded w-20 mb-2"></div>
          <div className="h-6 bg-gray-500 rounded w-16"></div>
        </div>
      </div>
    </div>
  </div>
);

const SkeletonDestination = () => (
  <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
        <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0"></div>
        <div className="min-w-0 flex-1">
          <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-7 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 w-full lg:w-auto">
        <div className="text-center p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-6 h-6 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
        </div>
        <div className="text-center p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-6 h-6 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
);

const TrackingPage = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [activeDrivers, setActiveDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [sekolahId, setSekolahId] = useState('');
  const [sekolahData, setSekolahData] = useState<any>(null);
  const [previousPosition, setPreviousPosition] = useState<DriverPosition | null>(null);

  const isFetchingRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize auth & sekolah
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken') || localStorage.getItem('mbg_token');
    const storedSekolahId = localStorage.getItem('sekolahId');

    console.log('[TRACKING INIT] authToken:', storedToken ? 'EXISTS' : 'MISSING');
    console.log('[TRACKING INIT] sekolahId:', storedSekolahId);

    if (storedToken) setAuthToken(storedToken);
    if (storedSekolahId) setSekolahId(storedSekolahId);

    if (!storedToken || !storedSekolahId) {
      setLoading(false);
      setError('Token atau Sekolah ID tidak ditemukan');
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

  // Fetch sekolah data
  const fetchSekolahData = useCallback(async () => {
    if (!sekolahId || !authToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();
      const sekolah = result.data || result;
      
      setSekolahData(sekolah);
      console.log('[TRACKING] Sekolah data:', sekolah);
    } catch (err) {
      console.error('Error fetching sekolah:', err);
    }
  }, [sekolahId, authToken]);

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

      console.log('[TRACKING] Active drivers:', drivers);

      if (Array.isArray(drivers) && drivers.length > 0) {
        // Store previous position for speed calculation
        if (activeDrivers.length > 0 && activeDrivers[0].lastLatitude && activeDrivers[0].lastLongitude) {
          setPreviousPosition({
            lat: activeDrivers[0].lastLatitude,
            lng: activeDrivers[0].lastLongitude,
            timestamp: new Date(activeDrivers[0].lastLocationUpdate).getTime()
          });
        }
        
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
  }, [authToken, activeDrivers]);

  // Initial fetch
  useEffect(() => {
    if (sekolahId && authToken) {
      fetchSekolahData();
      fetchActiveDrivers();
    }
  }, [sekolahId, authToken, fetchSekolahData, fetchActiveDrivers]);

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

  // Calculate speed from position changes
  const calculateSpeed = useCallback((currentLat: number, currentLng: number, currentTime: number) => {
    if (!previousPosition) return null;

    const R = 6371; // Earth radius in km
    const dLat = (currentLat - previousPosition.lat) * Math.PI / 180;
    const dLon = (currentLng - previousPosition.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(previousPosition.lat * Math.PI / 180) * Math.cos(currentLat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // in km

    const timeDiff = (currentTime - previousPosition.timestamp) / 1000 / 3600; // in hours
    if (timeDiff <= 0) return null;

    const speed = distance / timeDiff; // km/h
    return speed;
  }, [previousPosition]);

  // Get primary vehicle (first active driver)
  const vehicle = useMemo(() => {
    if (activeDrivers.length === 0) return null;

    const driver = activeDrivers[0];
    
    // Calculate distance between two points
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Get real position from API
    const driverLat = driver.lastLatitude;
    const driverLng = driver.lastLongitude;
    
    if (!driverLat || !driverLng) {
      console.error('[TRACKING] Driver position not available');
      return null;
    }

    let distance = 0;
    let eta = '-';
    let estimasiTiba = '-';
    let avgSpeed = 30; // default fallback
    
    // Calculate real speed from position changes
    const currentTimestamp = new Date(driver.lastLocationUpdate).getTime();
    const calculatedSpeed = calculateSpeed(driverLat, driverLng, currentTimestamp);
    
    if (calculatedSpeed !== null && calculatedSpeed > 0 && calculatedSpeed < 150) {
      avgSpeed = Math.round(calculatedSpeed);
    }
    
    // Calculate distance to school
    if (sekolahData?.latitude && sekolahData?.longitude) {
      distance = calculateDistance(driverLat, driverLng, sekolahData.latitude, sekolahData.longitude);
      
      // Calculate ETA based on real/calculated speed
      const etaMinutes = avgSpeed > 0 ? Math.round((distance / avgSpeed) * 60) : 0;
      eta = etaMinutes > 0 ? `${etaMinutes} menit` : 'Segera tiba';
      
      // Calculate estimated arrival time
      if (etaMinutes > 0) {
        const now = new Date();
        const arrivalTime = new Date(now.getTime() + etaMinutes * 60000);
        estimasiTiba = arrivalTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }
    }
    
    // Parse last update time
    const lastUpdate = driver.lastLocationUpdate ? new Date(driver.lastLocationUpdate) : null;
    const waktuBerangkat = lastUpdate 
      ? lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
      : '-';
    
    // Get dapur info from API
    const dapurNama = driver.driverOf?.nama || 'Dapur';
    const dapurAlamat = driver.driverOf?.alamat || '-';
    
    // Format location
    const lokasi = distance > 0 
      ? `${distance.toFixed(1)} km dari ${sekolahData?.nama || 'sekolah'}`
      : 'Lokasi real-time';
    
    // Get pengiriman data for capacity
    const pengiriman = driver.pengirimanDriver && driver.pengirimanDriver.length > 0 
      ? driver.pengirimanDriver[0] 
      : null;
    
    const kapasitas = pengiriman?.jumlahPorsi || pengiriman?.totalPorsi || 0;
    const terisi = pengiriman?.porsiTerisi || kapasitas;
    
    return {
      // Real data from API
      id: driver.nomorKendaraan || driver.id || 'N/A',
      driver: driver.name || 'Driver',
      email: driver.email || '-',
      phone: driver.phone || '-',
      status: driver.status || 'dalam_perjalanan',
      lokasi: lokasi,
      lat: driverLat,
      lng: driverLng,
      
      // Calculated from real data
      estimasi: eta,
      jarak: `${distance.toFixed(1)} km`,
      kecepatan: `${avgSpeed} km/jam`,
      
      // From API
      kapasitas: kapasitas,
      terisi: terisi,
      waktuBerangkat: waktuBerangkat,
      estimasiTiba: estimasiTiba,
      lastUpdate: lastUpdate,
      
      // Dapur info from API
      dapurInfo: {
        nama: dapurNama,
        alamat: dapurAlamat,
        lat: driver.driverOf?.latitude || null,
        lng: driver.driverOf?.longitude || null
      }
    };
  }, [activeDrivers, sekolahData, calculateSpeed]);

  // Get school location from API
  const school = useMemo(() => {
    if (!sekolahData) return null;

    return {
      name: sekolahData.nama || sekolahData.name || 'Sekolah',
      address: sekolahData.alamat || sekolahData.address || '-',
      lat: sekolahData.latitude || sekolahData.lat,
      lng: sekolahData.longitude || sekolahData.lng
    };
  }, [sekolahData]);

  // Fetch route when vehicle position changes
  useEffect(() => {
    if (!mapReady || !vehicle || !school || route.length > 0) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${vehicle.lng},${vehicle.lat};${school.lng},${school.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates;
          const leafletCoords: [number, number][] = coords.map((c: number[]) => [c[1], c[0]]);
          setRoute(leafletCoords);
          console.log('✅ Route loaded:', leafletCoords.length, 'points');
        } else {
          setRoute([[vehicle.lat, vehicle.lng], [school.lat, school.lng]]);
        }
      } catch (error) {
        console.error('❌ Route error:', error);
        setRoute([[vehicle.lat, vehicle.lng], [school.lat, school.lng]]);
      }
    };

    fetchRoute();
  }, [mapReady, vehicle, school, route.length]);

  // Refresh route when vehicle moves significantly
  useEffect(() => {
    if (vehicle && route.length > 0) {
      // Check if vehicle moved more than 100m
      const lastRoutePoint = route[0];
      const distance = Math.sqrt(
        Math.pow(vehicle.lat - lastRoutePoint[0], 2) + 
        Math.pow(vehicle.lng - lastRoutePoint[1], 2)
      ) * 111000; // rough conversion to meters
      
      if (distance > 100) {
        console.log('[TRACKING] Vehicle moved significantly, refreshing route');
        setRoute([]);
      }
    }
  }, [vehicle?.lat, vehicle?.lng]);

  const getStatusInfo = (status: string) => {
    const statusMap: any = {
      dalam_perjalanan: { text: 'Dalam Perjalanan', icon: Truck, bgClass: 'bg-blue-500' },
      sampai: { text: 'Sudah Sampai', icon: CheckCircle, bgClass: 'bg-green-500' },
      belum_berangkat: { text: 'Belum Berangkat', icon: Clock, bgClass: 'bg-orange-500' },
      active: { text: 'Dalam Perjalanan', icon: Truck, bgClass: 'bg-blue-500' },
      arrived: { text: 'Sudah Sampai', icon: CheckCircle, bgClass: 'bg-green-500' },
      idle: { text: 'Belum Berangkat', icon: Clock, bgClass: 'bg-orange-500' },
      pending: { text: 'Menunggu', icon: Clock, bgClass: 'bg-yellow-500' }
    };
    return statusMap[status] || statusMap.active;
  };

  const createTruckIcon = () => {
    if (typeof window === 'undefined' || !vehicle) return null;
    const L = require('leaflet');
    const statusInfo = getStatusInfo(vehicle.status);
    const color = statusInfo.bgClass.includes('green') ? '#10b981' : '#3b82f6';
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

  const createKitchenIcon = () => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      html: `<div style="background-color: #f97316; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 16px;">🍳</div></div>`,
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

  // Loading State with Skeleton
  if (loading) {
    return (
      <SekolahLayout currentPage="tracking">
        <div className="min-h-screen bg-gray-50">
          <div className="p-4 md:p-6 lg:p-8">
            {/* Header Skeleton */}
            <div className="mb-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Map Skeleton */}
              <div className="lg:col-span-2">
                <SkeletonMap />
              </div>

              {/* Sidebar Skeleton */}
              <SkeletonSidebar />
            </div>

            {/* Destination Skeleton */}
            <SkeletonDestination />
          </div>
        </div>
      </SekolahLayout>
    );
  }

  if (error) {
    return (
      <SekolahLayout currentPage="tracking">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold mb-2">Error</p>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </SekolahLayout>
    );
  }

  if (!vehicle || !school) {
    return (
      <SekolahLayout currentPage="tracking">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold mb-2">Tidak Ada Driver Aktif</p>
            <p className="text-gray-500 text-sm">Belum ada pengiriman yang sedang berlangsung</p>
          </div>
        </div>
      </SekolahLayout>
    );
  }

  const statusInfo = getStatusInfo(vehicle.status);
  const StatusIcon = statusInfo.icon;

  return (
    <SekolahLayout currentPage="tracking">
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 md:p-6 lg:p-8">
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
            <StatCard 
              title="Muatan" 
              value={vehicle.kapasitas > 0 ? `${vehicle.terisi}/${vehicle.kapasitas}` : 'N/A'} 
              subtitle={vehicle.kapasitas > 0 ? `${Math.round((vehicle.terisi / vehicle.kapasitas) * 100)}% terisi` : 'Data tidak tersedia'} 
              icon={Package} 
              color="bg-purple-500" 
            />
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
                    {(vehicle.status === 'dalam_perjalanan' || vehicle.status === 'active') && (
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

                      {/* School Marker */}
                      <Marker position={[school.lat, school.lng]} icon={createSchoolIcon()}>
                        <Popup>
                          <div className="p-2">
                            <p className="font-bold text-sm">🏫 {school.name}</p>
                            <p className="text-xs text-gray-600">{school.address}</p>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Kitchen/Dapur Marker */}
                      {vehicle.dapurInfo.lat && vehicle.dapurInfo.lng && (
                        <Marker position={[vehicle.dapurInfo.lat, vehicle.dapurInfo.lng]} icon={createKitchenIcon()}>
                          <Popup>
                            <div className="p-2">
                              <p className="font-bold text-sm">🍳 {vehicle.dapurInfo.nama}</p>
                              <p className="text-xs text-gray-600">{vehicle.dapurInfo.alamat}</p>
                            </div>
                          </Popup>
                        </Marker>
                      )}

                      {/* Vehicle Marker */}
                      <Marker position={[vehicle.lat, vehicle.lng]} icon={createTruckIcon()}>
                        <Popup>
                          <div className="p-2">
                            <p className="font-bold text-sm">🚚 {vehicle.id}</p>
                            <p className="text-xs text-gray-600">{vehicle.driver}</p>
                            <p className="text-xs text-gray-600">ETA: {vehicle.estimasi}</p>
                            <p className="text-xs text-gray-600">Kecepatan: {vehicle.kecepatan}</p>
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
                    <UtensilsCrossed className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Dapur</p>
                      <p className="font-medium text-gray-900 text-sm break-words">{vehicle.dapurInfo.nama}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                    <MapPinned className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Lokasi Saat Ini</p>
                      <p className="font-medium text-gray-900 text-sm break-words">{vehicle.lokasi}</p>
                    </div>
                  </div>

                  {vehicle.kapasitas > 0 && (
                    <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                      <Package className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1.5">Muatan</p>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-medium text-gray-900 text-sm">{vehicle.terisi} / {vehicle.kapasitas} porsi</p>
                          <p className="text-xs text-green-600 font-semibold">{Math.round((vehicle.terisi / vehicle.kapasitas) * 100)}%</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all" 
                            style={{ width: `${(vehicle.terisi / vehicle.kapasitas) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
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
                    <p className="text-xs text-white/70 mb-1">Update Terakhir</p>
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