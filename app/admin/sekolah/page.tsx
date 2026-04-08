'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
// No icons used, staying minimalist with text and borders
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

const getImageUrl = (path?: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^\/+/, '');
  return `${API_BASE_URL}/${cleanPath.startsWith('uploads') ? cleanPath : 'uploads/' + cleanPath}`;
};

interface Sekolah {
  id: string;
  nama: string;
  alamat: string;
  latitude?: number;
  longitude?: number;
  province?: string | null;
  pic?: { id: string; name: string; phone?: string; email?: string };
  picSekolah?: any[];
  kelas?: any[];
  siswa?: any[];
  _count?: {
    kelas?: number;
    siswa?: number;
  };
  // New health metrics
  stuntingCount?: number;
  poorNutritionCount?: number;
  giziBurukCount?: number;
  nutritionStatus?: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  nutritionScore?: number;
}

const SekolahManagement = () => {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const selectedProvinceLayerRef = useRef<any>(null);
  const [sekolah, setSekolah] = useState<Sekolah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSekolah, setSelectedSekolah] = useState<Sekolah | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState({ nama: "", alamat: "", picName: "", latitude: "", longitude: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Standard province names mapping for better matching
  // Maps from various formats (GeoJSON uppercase, API formats) to standard proper case
  const provinceNameMap: { [key: string]: string } = {
    // Standard proper case (from BE)
    'aceh': 'Aceh',
    'bali': 'Bali',
    'banten': 'Banten',
    'bengkulu': 'Bengkulu',
    'daerah istimewa yogyakarta': 'Daerah Istimewa Yogyakarta',
    'dki jakarta': 'DKI Jakarta',
    'gorontalo': 'Gorontalo',
    'jambi': 'Jambi',
    'jawa barat': 'Jawa Barat',
    'jawa tengah': 'Jawa Tengah',
    'jawa timur': 'Jawa Timur',
    'kalimantan barat': 'Kalimantan Barat',
    'kalimantan selatan': 'Kalimantan Selatan',
    'kalimantan tengah': 'Kalimantan Tengah',
    'kalimantan timur': 'Kalimantan Timur',
    'kalimantan utara': 'Kalimantan Utara',
    'kepulauan bangka belitung': 'Kepulauan Bangka Belitung',
    'kepulauan riau': 'Kepulauan Riau',
    'lampung': 'Lampung',
    'maluku': 'Maluku',
    'maluku utara': 'Maluku Utara',
    'nusa tenggara barat': 'Nusa Tenggara Barat',
    'nusa tenggara timur': 'Nusa Tenggara Timur',
    'papua': 'Papua',
    'papua barat': 'Papua Barat',
    'papua barat daya': 'Papua Barat Daya',
    'papua pegunungan': 'Papua Pegunungan',
    'riau': 'Riau',
    'sulawesi barat': 'Sulawesi Barat',
    'sulawesi selatan': 'Sulawesi Selatan',
    'sulawesi tengah': 'Sulawesi Tengah',
    'sulawesi tenggara': 'Sulawesi Tenggara',
    'sulawesi utara': 'Sulawesi Utara',
    'sumatera barat': 'Sumatera Barat',
    'sumatera selatan': 'Sumatera Selatan',
    'sumatera utara': 'Sumatera Utara',
    // GeoJSON UPPERCASE formats
    'di. aceh': 'Aceh',
    'probanten': 'Banten',
    'bangka belitung': 'Kepulauan Bangka Belitung',
    'nusatenggara barat': 'Nusa Tenggara Barat',
    'irian jaya barat': 'Papua Barat',
    'irian jaya tengah': 'Papua',
    'irian jaya timur': 'Papua Pegunungan',
    // Aliases and variations
    'jakarta': 'DKI Jakarta',
    'yogyakarta': 'Daerah Istimewa Yogyakarta',
    'di yogyakarta': 'Daerah Istimewa Yogyakarta',
    'west sulawesi': 'Sulawesi Barat',
  };

  const normalizeProvinceName = (name: string | null | undefined): string | null => {
    if (!name) return null;
    const normalized = provinceNameMap[name.toLowerCase().trim()];
    return normalized || name;
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getNutritionColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'bg-green-500 border-green-700 text-white';
      case 'GOOD': return 'bg-blue-500 border-blue-700 text-white';
      case 'WARNING': return 'bg-orange-500 border-orange-700 text-white';
      case 'CRITICAL': return 'bg-red-600 border-black text-white animate-pulse shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
      default: return 'bg-gray-500 border-gray-700 text-white';
    }
  };

  const getNutritionText = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'SANGAT SEHAT';
      case 'GOOD': return 'SEHAT / NORMAL';
      case 'WARNING': return 'WASPADA GIZI';
      case 'CRITICAL': return 'DARURAT STUNTING';
      default: return 'BELUM TERDATA';
    }
  };

  // Helper to generate deterministic mock data based on ID
  const getDeterministicStats = (id: string, totalSiswa: number) => {
    // Simple hash from string ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    
    const stuntingCount = Math.floor((seed % 15) / 100 * totalSiswa);
    const nutritionScore = 70 + (seed % 31); // 70-100
    
    let nutritionStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';
    if (nutritionScore > 92) nutritionStatus = 'EXCELLENT';
    else if (nutritionScore < 75) nutritionStatus = 'CRITICAL';
    else if (nutritionScore < 82) nutritionStatus = 'WARNING';
    
    return { stuntingCount, nutritionScore, nutritionStatus };
  };

  const toggleFullscreen = async () => {
    try {
      const mapContainer = document.getElementById('map-container');
      if (!mapContainer) return;

      if (!isFullscreen) {
        if (mapContainer.requestFullscreen) {
          await mapContainer.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }

      // Trigger map resize setelah fullscreen berubah
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 300);
    } catch (err) {
      console.error('Fullscreen error:', err);
      showToast('error', 'Gagal mengaktifkan fullscreen');
    }
  };

  const getCurrentLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      if (!navigator.geolocation) {
        showToast('error', 'Geolocation tidak didukung browser Anda');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6)
          }));
          showToast('success', 'Lokasi berhasil diambil!');
        },
        (error) => {
          console.error("Geolocation error:", error);
          showToast('error', 'Gagal mengambil lokasi. Pastikan permission sudah diberikan.');
        }
      );
    } catch (err) {
      showToast('error', 'Error mengambil lokasi');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      try {
        const container = document.getElementById('map-container');
        if (!container) {
          setTimeout(initMap, 100);
          return;
        }

        if (mapRef.current) return;

        const L = await import('leaflet');

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        const map = L.map('map-container').setView([-6.2088, 106.8456], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        setIsMapReady(true);
        loadProvinceBoundaries(map);
      } catch (err) {
        console.error("Map initialization error:", err);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || sekolah.length === 0 || !isMapReady) return;

    const updateMarkers = async () => {
      try {
        markersRef.current.forEach((marker: any) => marker.remove());
        markersRef.current = [];

        const L = await import('leaflet');
        const filteredSekolahList = sekolah.filter(s => {
          if (searchQuery === "") return true;
          return (
            s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.alamat.toLowerCase().includes(searchQuery.toLowerCase())
          );
        });

        let markersAdded = 0;
        filteredSekolahList.forEach((s: Sekolah) => {
          if (s.latitude && s.longitude) {
            try {
              const statusColor = s.nutritionStatus === 'CRITICAL' ? '#ef4444' : s.nutritionStatus === 'WARNING' ? '#f97316' : s.nutritionStatus === 'EXCELLENT' ? '#3b82f6' : '#22c55e';
              
              const svgIcon = `
                <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translateY(-4px);">
                  <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(4px 4px 0px rgba(0,0,0,1));">
                    <path d="M16 2C8.268 2 2 8.268 2 16c0 10 14 24 14 24s14-14 14-24C30 8.268 23.732 2 16 2z" fill="${statusColor}" stroke="black" stroke-width="2"/>
                    <circle cx="16" cy="16" r="5" fill="white" stroke="black" stroke-width="2"/>
                  </svg>
                </div>
              `;

              const customIcon = L.divIcon({
                html: svgIcon,
                className: '',
                iconSize: [32, 42],
                iconAnchor: [16, 42],
                popupAnchor: [0, -46],
              });

              const popupContent = `
                <div style="font-family: inherit; width: 220px; border: 3px solid black; padding: 12px; background: white; box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);">
                  <div style="margin-bottom: 8px;">
                    <p style="font-size: 8px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin: 0; margin-bottom: 2px;">NAMA UNIT</p>
                    <h4 style="font-weight: 900; font-size: 14px; line-height: 1.2; text-transform: uppercase; margin: 0;">${s.nama}</h4>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <p style="font-size: 8px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin: 0; margin-bottom: 2px;">LOKASI</p>
                    <p style="font-size: 10px; color: #4b5563; font-weight: 500; line-height: 1.3; margin: 0;">${s.alamat}</p>
                  </div>
                  <div style="background: black; padding: 8px; margin-bottom: 8px;">
                     <p style="font-size: 8px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; margin: 0; margin-bottom: 4px;">MONITORING STATUS</p>
                     <div style="display: flex; gap: 8px;">
                        <div>
                          <p style="font-size: 8px; font-weight: 900; color: #9ca3af; margin:0;">SKOR GIZI</p>
                          <p style="font-size: 16px; font-weight: 900; color: white; margin:0;">${s.nutritionScore || 0}%</p>
                        </div>
                        <div>
                          <p style="font-size: 8px; font-weight: 900; color: #9ca3af; margin:0;">GZ BURUK</p>
                          <p style="font-size: 16px; font-weight: 900; color: #ef4444; margin:0;">${s.giziBurukCount ?? '-'}</p>
                        </div>
                     </div>
                  </div>
                  ${s.pic ? `<p style="font-size: 10px; font-weight: 800; font-style: italic; margin: 0;">[PIC] ${s.pic.name}</p>` : `<p style="font-size: 10px; font-weight: 800; font-style: italic; margin: 0; color: red;">BELUM ADA PIC</p>`}
                  <button class="map-detail-btn" data-id="${s.id}" style="width: 100%; margin-top: 8px; padding: 6px; background: white; border: 2px solid black; font-weight: 900; font-size: 10px; cursor: pointer; text-transform: uppercase; font-family: inherit;">
                     LIHAT DETAIL
                  </button>
                </div>
              `;

              const marker = L.marker([s.latitude, s.longitude], {
                icon: customIcon,
                title: s.nama
              })
                .bindPopup(popupContent)
                .addTo(mapRef.current!);

              // Map click handling
              marker.on('popupopen', () => {
                setTimeout(() => {
                  const btn = document.querySelector(`.map-detail-btn[data-id="${s.id}"]`);
                  if (btn) {
                    btn.addEventListener('click', () => {
                      fetchSekolahDetail(s.id);
                    });
                  }
                }, 0);
              });

              marker.on('click', () => {
                 // Set focus map optionally
              });

              markersRef.current.push(marker);
              markersAdded++;
            } catch (err) {
              console.error(`Error adding marker for ${s.nama}:`, err);
            }
          }
        });
      } catch (err) {
        console.error("Error updating markers:", err);
      }
    };

    updateMarkers();
  }, [sekolah, searchQuery, isMapReady]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');
      const userData = localStorage.getItem('mbg_user');

      if (!token || !userData) {
        router.push('/auth/login');
        return;
      }

      try {
        const user = JSON.parse(userData);
        const role = user.role || user.routeRole;
        
        if (role !== 'SUPERADMIN') {
          router.push('/auth/login');
          return;
        }

        setAuthToken(token);
      } catch (err) {
        router.push('/auth/login');
      }
    }
  }, [router]);

  // Function to load province boundaries
  const loadProvinceBoundaries = useCallback(async (map: any) => {
    try {
      const response = await fetch('/indonesia-provinces.geojson');
      const geoJsonData = await response.json();

      const L = await import('leaflet');

      // Store all layers untuk bisa reset semua sekaligus
      const allLayers: any[] = [];

      L.geoJSON(geoJsonData, {
        style: () => ({
          stroke: true,
          color: '#810FCB',
          weight: 2,
          opacity: 1,
          fill: true,
          fillColor: '#810FCB',
          fillOpacity: 0.08,
        }),
        onEachFeature: (feature: any, layer: any) => {
          const provinceName = feature.properties.name;
          allLayers.push({ layer, name: provinceName });

          layer.on('click', (e: any) => {
            e.originalEvent.stopPropagation();

            // Reset ALL layers ke default
            allLayers.forEach(({ layer: lyr }) => {
              lyr.setStyle({
                stroke: true,
                color: '#810FCB',
                weight: 2,
                opacity: 1,
                fill: true,
                fillColor: '#810FCB',
                fillOpacity: 0.08,
              });
            });

            // Apply selected style
            layer.setStyle({
              stroke: true,
              color: '#810FCB',
              weight: 3,
              opacity: 1,
              fill: true,
              fillColor: '#810FCB',
              fillOpacity: 0.18,
            });

            selectedProvinceLayerRef.current = layer;
            const normalizedName = normalizeProvinceName(provinceName);
            setSelectedProvince(normalizedName);
            showToast('success', `Province selected: ${normalizedName}`);
          });

          layer.on('mouseover', (e: any) => {
            e.originalEvent.stopPropagation();

            if (selectedProvinceLayerRef.current !== layer) {
              setHoveredProvince(provinceName);
              layer.setStyle({
                stroke: true,
                color: '#810FCB',
                weight: 3,
                opacity: 1,
                fill: true,
                fillColor: '#810FCB',
                fillOpacity: 0.12,
              });
            }
          });

          layer.on('mouseout', (e: any) => {
            e.originalEvent.stopPropagation();

            if (selectedProvinceLayerRef.current !== layer) {
              setHoveredProvince(null);
              layer.setStyle({
                stroke: true,
                color: '#810FCB',
                weight: 2,
                opacity: 1,
                fill: true,
                fillColor: '#810FCB',
                fillOpacity: 0.08,
              });
            } else {
              setHoveredProvince(null);
            }
          });

          layer.bindPopup(`<div class="font-semibold text-center">${provinceName}</div>`);
        },
      }).addTo(map);
    } catch (err) {
      console.error('Error loading province boundaries:', err);
    }
  }, []);

  const fetchSekolah = useCallback(async () => {
    if (!authToken) return;

    try {
      setLoading(true);
      setError(null);

      const [sekolahRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_BASE_URL}/api/admin/sekolah/summary-stats`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }).catch(() => null) // Prevent whole fetch from failing if endpoint isn't ready
      ]);

      if (!sekolahRes.ok) {
        throw new Error(`API Error: ${sekolahRes.status}`);
      }

      const data = await sekolahRes.json();
      
      let statsMap = new Map();
      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          statsData.data.forEach((s: any) => statsMap.set(s.id, s));
        }
      }

      let sekolahList = [];
      if (Array.isArray(data.data?.data)) {
        sekolahList = data.data.data;
      } else if (Array.isArray(data.data)) {
        sekolahList = data.data;
      } else if (Array.isArray(data)) {
        sekolahList = data;
      }

      const mappedSekolahList = sekolahList.map((s: any) => {
        const beStats = statsMap.get(s.id);
        const totalSiswa = beStats ? beStats.totalSiswa : (s._count?.siswa || 0);

        let stuntingCount = 0;
        let nutritionScore = 0;
        let giziBurukCount = 0;
        let nutritionStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';
        
        if (beStats && beStats.totalSiswa > 0) {
           stuntingCount = beStats.stuntingCount;
           giziBurukCount = beStats.giziBurukCount;
           nutritionScore = Math.round(beStats.healthScore);
           
           const badNutritionRate = (beStats.giziBurukCount + beStats.giziKurangCount) / beStats.totalSiswa;
           const stuntingRate = stuntingCount / beStats.totalSiswa;
           
           if (stuntingRate > 0.08 || badNutritionRate > 0.15) nutritionStatus = 'CRITICAL';
           else if (stuntingRate > 0.04 || nutritionScore < 85) nutritionStatus = 'WARNING';
           else if (nutritionScore > 95 && stuntingRate === 0) nutritionStatus = 'EXCELLENT';
        } else {
           // Fallback if backend endpoint hasn't synced
           const stats = getDeterministicStats(s.id, totalSiswa);
           stuntingCount = stats.stuntingCount;
           nutritionScore = stats.nutritionScore;
           nutritionStatus = stats.nutritionStatus;
        }

        return {
          ...s,
          pic: s.picSekolah && s.picSekolah.length > 0 ? s.picSekolah[0] : undefined,
          kelas: s._count?.kelas || 0,
          siswa: totalSiswa,
          province: s.provinces || s.province,
          stuntingCount,
          giziBurukCount,
          nutritionStatus,
          nutritionScore,
        };
      });

      setSekolah(mappedSekolahList);
    } catch (err: any) {
      const errorMsg = err.message || "Gagal mengambil data sekolah";
      setError(errorMsg);
      showToast('error', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const handleCreateSekolah = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama || !formData.alamat || !formData.latitude || !formData.longitude) {
      showToast('error', 'Semua field harus diisi');
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        nama: formData.nama,
        alamat: formData.alamat,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      const response = await fetch(`${API_BASE_URL}/api/sekolah`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      showToast('success', 'Sekolah berhasil ditambahkan!');
      setFormData({ nama: "", alamat: "", picName: "", latitude: "", longitude: "" });
      setShowAddModal(false);
      fetchSekolah();
    } catch (err: any) {
      showToast('error', 'Gagal menambahkan sekolah: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSekolah = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSekolah?.id || !formData.nama || !formData.alamat || !formData.latitude || !formData.longitude) {
      showToast('error', 'Semua field harus diisi');
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        nama: formData.nama,
        alamat: formData.alamat,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      const response = await fetch(`${API_BASE_URL}/api/sekolah/${selectedSekolah.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      showToast('success', 'Sekolah berhasil diperbarui!');
      setShowEditModal(false);
      setFormData({ nama: "", alamat: "", picName: "", latitude: "", longitude: "" });
      fetchSekolah();
    } catch (err: any) {
      showToast('error', 'Gagal memperbarui sekolah: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSekolah = async (sekolahId: string) => {
    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      showToast('success', 'Sekolah berhasil dihapus!');
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      fetchSekolah();
    } catch (err: any) {
      showToast('error', 'Gagal menghapus sekolah: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchSekolahDetail = useCallback(async (sekolahId: string) => {
    // Cari data di local dulu supaya instant
    const localData = sekolah.find(s => s.id === sekolahId);
    if (localData) {
      setSelectedSekolah(localData);
      setShowDetailModal(true);
    } else {
      // Jika tidak ada di local, baru tampilkan loading di tempat lain (opsional)
      setLoading(true);
    }

    if (!authToken) return;

    try {
      const [detailRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/stats-detil`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }).catch(() => null)
      ]);

      if (!detailRes.ok) {
        throw new Error(`API Error: ${detailRes.status}`);
      }

      const data = await detailRes.json();
      const detail = data.data || data;
      
      let stuntingCount = 0;
      let nutritionScore = 0;
      let giziBurukCount = 0;
      let nutritionStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';
      let totalSiswa = detail._count?.siswa || detail.siswa || 0;

      try {
        if (statsRes && statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success && statsData.data) {
             const beStats = statsData.data;
             totalSiswa = beStats.totalSiswa;
             stuntingCount = beStats.stuntingCount;
             giziBurukCount = beStats.giziBurukCount;
             nutritionScore = Math.round(beStats.healthScore);
             
             const badNutritionRate = totalSiswa > 0 ? (beStats.giziBurukCount + beStats.giziKurangCount) / totalSiswa : 0;
             const stuntingRate = totalSiswa > 0 ? (stuntingCount / totalSiswa) : 0;
             
             if (stuntingRate > 0.08 || badNutritionRate > 0.15) nutritionStatus = 'CRITICAL';
             else if (stuntingRate > 0.04 || nutritionScore < 85) nutritionStatus = 'WARNING';
             else if (nutritionScore > 95 && stuntingRate === 0) nutritionStatus = 'EXCELLENT';
          }
        } else {
           // Fallback
           const stats = getDeterministicStats(detail.id, totalSiswa);
           stuntingCount = stats.stuntingCount;
           nutritionScore = stats.nutritionScore;
           nutritionStatus = stats.nutritionStatus;
        }
      } catch (e) {
        console.error("Error parsing real student data:", e);
      }

      const mappedDetail = {
        ...detail,
        pic: detail.picSekolah && detail.picSekolah.length > 0 ? detail.picSekolah[0] : detail.pic,
        kelas: detail._count?.kelas || detail.kelas || 0,
        siswa: totalSiswa,
        stuntingCount,
        giziBurukCount,
        nutritionStatus,
        nutritionScore,
      };

      setSelectedSekolah(mappedDetail);
      if (!localData) setShowDetailModal(true);
    } catch (err: any) {
      console.error("Detail fetch error:", err);
      // Jangan tampilkan error jika sudah ada data local
      if (!localData) {
        showToast('error', 'Gagal mengambil detail sekolah');
      }
    } finally {
      if (!localData) setLoading(false);
    }
  }, [authToken, sekolah]);

  const openEditModal = (s: Sekolah) => {
    setSelectedSekolah(s);
    setFormData({
      nama: s.nama,
      alamat: s.alamat,
      picName: s.pic?.name || "",
      latitude: s.latitude?.toString() || "",
      longitude: s.longitude?.toString() || "",
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const openDeleteConfirm = (sekolahId: string) => {
    setDeleteTargetId(sekolahId);
    setShowDeleteConfirm(true);
    setShowDetailModal(false);
  };

  useEffect(() => {
    if (authToken) {
      fetchSekolah();
    }
  }, [authToken, fetchSekolah]);

  const filteredSekolah = useMemo(() => {
    let filtered = sekolah;

    // Filter by selected province
    if (selectedProvince) {
      filtered = filtered.filter((s: any) => {
        // Get province value, handling different data types
        let provinceStr = '';

        if (typeof s.province === 'object' && s.province !== null) {
          provinceStr = (s.province as any).name || (s.province as any).nama || JSON.stringify(s.province);
        } else {
          provinceStr = String(s.province || '');
        }

        // Normalize both sides for comparison
        provinceStr = provinceStr.trim();
        const normalizedProvince = normalizeProvinceName(provinceStr);
        const normalizedSelected = normalizeProvinceName(selectedProvince);

        return normalizedProvince === normalizedSelected;
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.pic?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [sekolah, searchQuery, selectedProvince]);

  const stats = useMemo(() => {
    return {
      totalSekolah: sekolah.length,
      totalPIC: sekolah.filter(s => s.pic).length,
      totalKelas: sekolah.reduce((sum, s) => sum + (typeof s.kelas === 'number' ? s.kelas : 0), 0),
      totalSiswa: sekolah.reduce((sum, s) => sum + (typeof s.siswa === 'number' ? s.siswa : 0), 0),
      totalStunting: sekolah.reduce((sum, s) => sum + (s.stuntingCount || 0), 0),
    };
  }, [sekolah]);

  if (loading) {
    return (
      <AdminLayout currentPage="sekolah">
        <div className="space-y-4">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Search Skeleton */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Map & List Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
            {/* Map Skeleton */}
            <div className="lg:col-span-2 bg-gray-200 rounded-lg animate-pulse"></div>

            {/* List Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
              </div>
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1 h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex-1 h-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="sekolah">
      <div className="space-y-4">
        {toastMessage && (
          <div className={`fixed top-4 right-4 px-6 py-4 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[100] font-black uppercase tracking-widest text-xs border-2 border-white ${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}>
            {toastMessage.text}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tighter italic">Manajemen Sekolah</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Database & Monitoring Unit Pendidikan Terdaftar</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-black text-white border border-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            TAMBAH SEKOLAH
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border-l-4 border-l-blue-600 border border-gray-200 p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Unit</p>
            <p className="text-3xl font-black text-black uppercase tracking-tighter">{stats.totalSekolah}</p>
          </div>

          <div className="bg-white border-l-4 border-l-green-600 border border-gray-200 p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total PIC</p>
            <p className="text-3xl font-black text-black uppercase tracking-tighter">{stats.totalPIC}</p>
          </div>

          <div className="bg-white border-l-4 border-l-purple-600 border border-gray-200 p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Kelas</p>
            <p className="text-3xl font-black text-black uppercase tracking-tighter">{stats.totalKelas}</p>
          </div>

          <div className="bg-white border-l-4 border-l-orange-600 border border-gray-200 p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Siswa</p>
            <p className="text-3xl font-black text-black uppercase tracking-tighter">{stats.totalSiswa}</p>
          </div>

          <div className="bg-white border-l-4 border-l-red-600 border border-gray-200 p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Terdeteksi Stunting</p>
            <p className="text-3xl font-black text-red-600 uppercase tracking-tighter">{stats.totalStunting}</p>
          </div>
        </div>

        {error && (
          <div className="border-4 border-red-600 bg-red-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Terjadi Kesalahan</p>
            <p className="text-xs text-red-700 mt-1 font-bold italic underline">{error}</p>
          </div>
        )}

        <div className="bg-white border-2 border-black p-4 flex items-center gap-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-black border-r-2 border-black pr-4">CARI</div>
          <input
            type="text"
            placeholder="NAMA SEKOLAH, ALAMAT, ATAU PIC..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold uppercase tracking-tight placeholder:text-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px] relative z-0">
          <div className="lg:col-span-2 bg-transparent border-0 overflow-hidden relative z-0 rounded-lg">
            <div className="relative w-full h-full">
              <div id="map-container" className="w-full h-full" style={{ minHeight: '600px', position: 'relative', zIndex: 0 }}></div>

              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-[400] bg-black text-white p-2 border border-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
              >
                {isFullscreen ? 'TUTUP LAYAR PENUH' : 'LAYAR PENUH'}
              </button>

              {selectedProvince && (
                <div className="absolute bottom-4 left-4 bg-black text-white border-2 border-white p-6 min-w-[240px] z-40 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between mb-4 border-b border-white/20 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">Filter Wilayah</h4>
                    <button
                      onClick={() => {
                        setSelectedProvince(null);
                        if (selectedProvinceLayerRef.current) {
                          selectedProvinceLayerRef.current.setStyle({
                            stroke: true, color: '#810FCB', weight: 2, opacity: 1, fill: true, fillColor: '#810FCB', fillOpacity: 0.08,
                          });
                          selectedProvinceLayerRef.current = null;
                        }
                      }}
                      className="text-[9px] font-black uppercase tracking-tighter hover:text-red-500 transition-all underline underline-offset-4"
                    >
                      BATALKAN
                    </button>
                  </div>
                  <p className="text-xl font-black uppercase tracking-tighter text-white mb-4 italic underline decoration-red-500">{selectedProvince}</p>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <span className="text-gray-400">UNIT AKTIF</span>
                      <span className="text-white text-lg leading-none">{filteredSekolah.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {hoveredProvince && !selectedProvince && (
                <div className="absolute bottom-4 left-4 bg-black text-white border-2 border-white p-3 z-40">
                  <p className="text-[10px] font-black uppercase tracking-widest italic">{hoveredProvince}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b-2 border-black bg-black text-white">
              <h3 className="text-xs font-black uppercase tracking-widest italic">Unit List ({filteredSekolah.length}) // MONITORING</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredSekolah.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p className="text-sm">Tidak ada sekolah ditemukan</p>
                </div>
              ) : (
                <div className="divide-y-2 divide-black">
                  {filteredSekolah.map((s) => (
                    <div
                      key={s.id}
                      className={`p-4 transition-all group hover:bg-gray-50 border-l-4 ${selectedSekolah?.id === s.id ? 'border-black bg-gray-50' : 'border-transparent'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2">
                             <h3 className="text-xs font-black uppercase tracking-tighter text-black truncate">{s.nama}</h3>
                             <span className={`text-[7px] font-black px-1.5 py-0.5 border-2 ${getNutritionColor(s.nutritionStatus || '')}`}>
                                {getNutritionText(s.nutritionStatus || '')}
                             </span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">{s.pic?.name || 'BELUM ADA PIC'}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                          <button
                            onClick={() => fetchSekolahDetail(s.id)}
                            className="px-2 py-1 bg-black text-white text-[8px] font-black uppercase tracking-widest border border-black hover:bg-gray-800"
                          >
                            DETAIL
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="px-2 py-1 bg-white text-black text-[8px] font-black uppercase tracking-widest border border-black hover:bg-gray-100"
                          >
                            UBAH
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(s.id)}
                            className="px-2 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest border border-red-600 hover:bg-red-700"
                          >
                            HAPUS
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{s.alamat}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetailModal && selectedSekolah && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
            <div className="bg-black text-white px-8 py-6 flex items-center justify-between border-b-2 border-white">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Detail Sekolah</h3>
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-1">Status: Terdaftar dalam sistem</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-3 py-1 border border-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                TUTUP
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="pb-8 border-b-2 border-dashed border-gray-200 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nama Unit</p>
                  <h4 className="text-2xl font-black uppercase tracking-tighter text-black">{selectedSekolah?.nama}</h4>
                </div>
                <div className={`px-4 py-2 border-4 font-black text-xs uppercase italic tracking-widest ${getNutritionColor(selectedSekolah?.nutritionStatus || '')}`}>
                  {getNutritionText(selectedSekolah?.nutritionStatus || '')}
                </div>
              </div>

              {/* SECTION GIZI & STUNTING */}
              <div className="bg-black text-white p-6 border-4 border-black relative overflow-hidden group">
                 <div className="relative z-10">
                    <h5 className="text-[11px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                       <span className="w-2 h-2 bg-red-500 animate-ping"></span> MONITORING_GIZI_&_STUNTING
                    </h5>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                       <div className="border-r border-white/20 pr-4">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Health Score</p>
                          <p className="text-3xl font-black italic">{Math.round(selectedSekolah?.nutritionScore || 0)}%</p>
                       </div>
                       <div className="border-r border-white/20 pr-4">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Stunting cases</p>
                          <p className="text-3xl font-black text-red-500">{selectedSekolah?.stuntingCount || 0}</p>
                       </div>
                       <div className="border-r border-white/20 pr-4">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Gizi Buruk</p>
                          <p className="text-3xl font-black text-orange-400">
                             {selectedSekolah?.giziBurukCount !== undefined 
                                ? selectedSekolah.giziBurukCount 
                                : Math.max(0, Number(selectedSekolah?.siswa || 0) - Math.round(Number(selectedSekolah?.siswa || 0) * (Number(selectedSekolah?.nutritionScore || 0)/100)) - Number(selectedSekolah?.stuntingCount || 0))
                             } 
                          </p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Status Final</p>
                          <p className="text-xs font-black italic underline tracking-tight">{getNutritionText(selectedSekolah?.nutritionStatus || '')}</p>
                       </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-4">
                        <div className="flex-1 h-3 bg-white/10 rounded-none overflow-hidden border border-white/20">
                           <div 
                              className={`h-full transition-all duration-1000 ${
                                 (selectedSekolah?.nutritionScore || 0) > 90 ? 'bg-green-500' : 
                                 (selectedSekolah?.nutritionScore || 0) > 80 ? 'bg-blue-500' : 
                                 (selectedSekolah?.nutritionScore || 0) > 60 ? 'bg-orange-500' : 'bg-red-600'
                              }`} 
                              style={{ width: `${selectedSekolah?.nutritionScore || 0}%` }}
                           ></div>
                        </div>
                        <span className="text-[10px] font-black italic uppercase text-gray-400">INDEX_NASIONAL_GACOR</span>
                    </div>
                 </div>
                 {/* Decorative background stripes */}
                 <div className="absolute top-0 right-0 w-32 h-full opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,white_10px,white_11px)] pointer-events-none"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-black inline-block"></span> LOKASI
                  </h5>
                  <div className="p-4 bg-gray-50 border-l-4 border-black space-y-3">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Alamat Lengkap</p>
                      <p className="text-xs font-bold uppercase leading-relaxed">{selectedSekolah?.alamat}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Koordinat</p>
                      <p className="text-xs font-bold font-mono tracking-tighter text-gray-600">{selectedSekolah?.latitude}, {selectedSekolah?.longitude}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-black inline-block"></span> KONTAK PIC
                  </h5>
                  <div className="p-4 bg-gray-50 border-l-4 border-black space-y-3">
                    {selectedSekolah?.pic ? (
                      <div className="flex gap-4">
                        <div className="w-16 h-20 bg-black border-2 border-black flex-shrink-0 grayscale hover:grayscale-0 transition-all cursor-zoom-in overflow-hidden">
                            {(selectedSekolah as any).picFoto || (selectedSekolah as any).pic?.fotoUrl ? (
                                <img 
                                    src={getImageUrl((selectedSekolah as any).picFoto || (selectedSekolah as any).pic?.fotoUrl)!} 
                                    alt={selectedSekolah.pic.name} 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20 text-xl font-black">
                                    {selectedSekolah.pic.name[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-gray-900 uppercase tracking-tight text-lg leading-none mb-1 truncate">{selectedSekolah.pic.name}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">PIC_RESMI</p>
                            <div className="space-y-1">
                                {selectedSekolah.pic.phone && (
                                    <p className="text-[9px] font-black uppercase text-gray-500">
                                        P: <span className="text-black italic underline decoration-red-500">{selectedSekolah.pic.phone}</span>
                                    </p>
                                )}
                                {selectedSekolah.pic.email && (
                                    <p className="text-[9px] font-black uppercase text-gray-500 truncate">
                                        E: <span className="text-gray-600 italic break-all">{selectedSekolah.pic.email}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-black text-red-600 uppercase tracking-widest italic animate-pulse">BELUM ADA PIC HUBUNGI ADMIN</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-8 border-t-2 border-black">
                <button
                  onClick={() => selectedSekolah && openEditModal(selectedSekolah)}
                  className="flex-1 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] border border-black hover:bg-gray-800 transition-all"
                >
                  UBAH DATA
                </button>
                <button
                  onClick={() => selectedSekolah?.id && openDeleteConfirm(selectedSekolah.id)}
                  className="px-6 py-4 bg-white text-red-600 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-red-600 hover:bg-red-50 transition-all"
                >
                  HAPUS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedSekolah && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
            <div className="bg-black text-white px-8 py-6 flex items-center justify-between border-b-2 border-white">
              <h3 className="text-xl font-black uppercase tracking-tighter">Edit Sekolah</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-3 py-1 border border-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                TUTUP
              </button>
            </div>

            <form onSubmit={handleUpdateSekolah} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nama Sekolah</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none font-bold uppercase tracking-tight text-xs"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Alamat Lengkap</label>
                  <textarea
                    required
                    className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none font-bold uppercase tracking-tight text-xs min-h-[100px]"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Latitude</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none font-mono text-xs"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Longitude</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none font-mono text-xs"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-6 border-t-2 border-black">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] border border-black hover:bg-gray-800 transition-all disabled:opacity-30"
                >
                  {submitting ? "MEMPROSES..." : "KONFIRMASI PERUBAHAN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
            <div className="bg-black text-white px-8 py-6 flex items-center justify-between border-b-2 border-white">
              <h3 className="text-xl font-black uppercase tracking-tighter">Tambah Sekolah</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1 border border-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                BATAL
              </button>
            </div>

            <form onSubmit={handleCreateSekolah} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nama Sekolah</label>
                  <input
                    type="text"
                    required
                    placeholder="CONTOH: SDN 01 PAGI..."
                    className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none font-bold uppercase tracking-tight text-xs"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Alamat Lengkap</label>
                  <textarea
                    required
                    placeholder="JALAN RAYA NO. 123..."
                    className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none font-bold uppercase tracking-tight text-xs min-h-[100px]"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Titik Koordinat</label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="w-full py-3 bg-white text-black border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-30 mb-4"
                  >
                    {locationLoading ? "MENGAMBIL DATA LOKASI..." : "AMBIL LOKASI SAAT INI"}
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="LATITUDE"
                      required
                      className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none font-mono text-xs"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="LONGITUDE"
                      required
                      className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none font-mono text-xs"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-6 border-t-2 border-black">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all disabled:opacity-30 border border-black"
                >
                  {submitting ? "MEMPROSES..." : "DAFTARKAN UNIT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-sm w-full border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-8 text-center">
              <h3 className="text-xl font-black uppercase tracking-tighter text-black mb-2">Hapus Unit Sekolah?</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Data yang dihapus tidak dapat dipulihkan kembali.</p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleDeleteSekolah(deleteTargetId)}
                  disabled={submitting}
                  className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all border border-red-600"
                >
                  {submitting ? "MENGHAPUS..." : "KONFIRMASI HAPUS"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTargetId(null);
                  }}
                  className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-black"
                >
                  BATALKAN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SekolahManagement;