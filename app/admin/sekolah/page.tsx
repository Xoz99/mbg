'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Building2, Users, Phone, Mail, Plus, Search, AlertCircle,
  Loader2, X, Navigation, Edit, Trash2, MapPinIcon, Maximize2, Minimize2
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

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
              const hasPIC = s.pic && s.pic.name;
              const iconColor = hasPIC ? '#22c55e' : '#6b7280';
              const iconHTML = `
                <div style="
                  background: ${iconColor};
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 16px;
                  border: 3px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  cursor: pointer;
                ">
                  🏫
                </div>
              `;

              const customIcon = L.divIcon({
                html: iconHTML,
                className: '',
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                popupAnchor: [0, -16],
              });

              const popupContent = `
                <div class="w-48">
                  <h4 class="font-bold text-sm mb-2">${s.nama}</h4>
                  <p class="text-xs text-gray-600 mb-2">${s.alamat}</p>
                  <div class="border-t pt-2 mt-2 text-xs">
                    ${s.pic ? `<p class="mb-1"><strong>PIC:</strong> ${s.pic.name}</p>` : '<p class="mb-1 text-red-600"><strong>PIC:</strong> Belum ada</p>'}
                    ${s.pic?.phone ? `<p class="mb-1"><strong>Telepon:</strong> ${s.pic.phone}</p>` : ''}
                    <p class="mb-1"><strong>Kelas:</strong> ${s.kelas || 0}</p>
                    <p><strong>Siswa:</strong> ${s.siswa || 0}</p>
                  </div>
                </div>
              `;

              const marker = L.marker([s.latitude, s.longitude], {
                icon: customIcon,
                title: s.nama
              })
                .bindPopup(popupContent)
                .addTo(mapRef.current!)
                .on('click', () => {
                  setSelectedSekolah(s);
                  setShowDetailModal(true);
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

      const response = await fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      let sekolahList = [];
      if (Array.isArray(data.data?.data)) {
        sekolahList = data.data.data;
      } else if (Array.isArray(data.data)) {
        sekolahList = data.data;
      } else if (Array.isArray(data)) {
        sekolahList = data;
      }

      const mappedSekolahList = sekolahList.map((s: any) => ({
        ...s,
        pic: s.picSekolah && s.picSekolah.length > 0 ? s.picSekolah[0] : undefined,
        kelas: s._count?.kelas || 0,
        siswa: s._count?.siswa || 0,
        province: s.provinces || s.province,
      }));

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
    if (!authToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const detail = data.data || data;
      setSelectedSekolah(detail);
      setShowDetailModal(true);
    } catch (err: any) {
      showToast('error', 'Gagal mengambil detail sekolah');
    }
  }, [authToken]);

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg z-40 ${
            toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {toastMessage.text}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Sekolah</h1>
            <p className="text-gray-600 mt-1">Monitor dan kelola semua sekolah di seluruh lokasi</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold shadow-md">
            <Plus className="w-5 h-5" />
            Tambah Sekolah
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Total Sekolah</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSekolah}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">PIC Sekolah</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPIC}</p>
              </div>
              <div className="p-3 bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Total Kelas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalKelas}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Total Siswa</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSiswa}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama sekolah, alamat, atau PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 border-0 focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px] relative z-0">
          <div className="lg:col-span-2 bg-transparent border-0 overflow-hidden relative z-0 rounded-lg">
            <div className="relative w-full h-full">
              <div id="map-container" className="w-full h-full" style={{ minHeight: '600px', position: 'relative', zIndex: 0 }}></div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-40 p-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 shadow-lg transition-colors border border-gray-200"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>

              {selectedProvince && (
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-40">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Selected Province</h4>
                    <button
                      onClick={() => {
                        setSelectedProvince(null);
                        if (selectedProvinceLayerRef.current) {
                          selectedProvinceLayerRef.current.setStyle({
                            stroke: true,
                            color: '#810FCB',
                            weight: 2,
                            opacity: 1,
                            fill: true,
                            fillColor: '#810FCB',
                            fillOpacity: 0.08,
                          });
                          selectedProvinceLayerRef.current = null;
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-base font-bold text-gray-900 mb-2">{selectedProvince}</p>
                  <div className="space-y-2 border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Sekolah di Province:</span>
                      <span className="text-sm font-semibold text-green-600">{filteredSekolah.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Total di Sistem:</span>
                      <span className="text-sm font-semibold text-gray-700">{sekolah.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {hoveredProvince && !selectedProvince && (
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-40">
                  <p className="text-sm font-semibold text-gray-900">{hoveredProvince}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Daftar Sekolah ({filteredSekolah.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredSekolah.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Tidak ada sekolah ditemukan</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredSekolah.map((s) => (
                    <div key={s.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-l-transparent hover:border-l-green-600">
                      <div onClick={() => fetchSekolahDetail(s.id)}>
                        <p className="font-semibold text-gray-900 text-sm">{s.nama}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.alamat}</p>
                        <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {s.pic?.name || 'Belum ada PIC'}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openEditModal(s)}
                          className="flex-1 p-1.5 bg-amber-50 text-amber-600 rounded text-xs hover:bg-amber-100 transition-colors"
                        >
                          <Edit className="w-3 h-3 mx-auto" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(s.id)}
                          className="flex-1 p-1.5 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 mx-auto" />
                        </button>
                      </div>
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white p-6 sticky top-0 z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedSekolah.nama}</h2>
                <p className="text-white/80 text-sm mt-1">Detail Sekolah & Informasi</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-blue-600" />
                  Lokasi
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700">{selectedSekolah.alamat}</p>
                </div>
              </div>

              {selectedSekolah.pic && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    PIC Sekolah
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="font-semibold text-gray-900">{selectedSekolah.pic.name}</p>
                    {selectedSekolah.pic.phone && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {selectedSekolah.pic.phone}
                      </p>
                    )}
                    {selectedSekolah.pic.email && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {selectedSekolah.pic.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-purple-600 font-semibold mb-2">Total Kelas</p>
                  <p className="text-3xl font-bold text-purple-900">{selectedSekolah.kelas || 0}</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs text-orange-600 font-semibold mb-2">Total Siswa</p>
                  <p className="text-3xl font-bold text-orange-900">{selectedSekolah.siswa || 0}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openEditModal(selectedSekolah)}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Edit Sekolah
                </button>
                <button
                  onClick={() => openDeleteConfirm(selectedSekolah.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Hapus
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedSekolah && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between sticky top-0">
              <h3 className="text-xl font-bold">Edit Sekolah</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setFormData({ nama: "", alamat: "", picName: "", latitude: "", longitude: "" });
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateSekolah} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Sekolah</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat</label>
                <textarea
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setFormData({ nama: "", alamat: "", picName: "", latitude: "", longitude: "" });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit className="w-5 h-5" />}
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between sticky top-0">
              <h3 className="text-xl font-bold">Tambah Sekolah Baru</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ nama: "", alamat: "", picName: "", latitude: "", longitude: "" });
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSekolah} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Sekolah</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Contoh: SD Negeri 1 Jakarta"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat</label>
                <textarea
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Jl. Pendidikan No. 10, Jakarta Pusat"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Koordinat Lokasi</label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {locationLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                  {locationLoading ? "Mengambil lokasi..." : "Ambil Lokasi Saat Ini"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    placeholder="-6.2100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    placeholder="106.8500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ nama: "", alamat: "", picName: "", latitude: "", longitude: "" });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {submitting ? "Menambahkan..." : "Tambah Sekolah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Sekolah?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Anda yakin ingin menghapus sekolah ini? Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTargetId(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteSekolah(deleteTargetId)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  {submitting ? "Menghapus..." : "Hapus"}
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