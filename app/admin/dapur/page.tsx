'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Building2, Users, Truck, Phone, Mail,
  Edit, Trash2, Plus, Search, AlertCircle,
  Loader2, CheckCircle, MapPinIcon, X, Navigation,
  Maximize2, Minimize2
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface Dapur {
  id: string;
  nama: string;
  alamat: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  province?: string | null;
  pic?: { id: string; name: string; phone?: string; email?: string };
  picDapur?: any[];
  drivers?: any[];
  karyawan?: any[];
  stok?: any[];
  stokBahanBaku?: any[];
  sekolah?: any[];
  sekolahDilayani?: any[];
  
  // Stats added from BE summary
  totalSekolah?: number;
  totalKaryawan?: number;
  totalStokKg?: number;
  totalBebanSiswa?: number;
  readinessScore?: number;
  readinessStatus?: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  
  _count?: {
    karyawan?: number;
    stokBahanBaku?: number;
    sekolahDilayani?: number;
  };
}

interface PICUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

const DapurMapDashboard = () => {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const selectedProvinceLayerRef = useRef<any>(null);
  const [dapur, setDapur] = useState<Dapur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDapur, setSelectedDapur] = useState<Dapur | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssignPICModal, setShowAssignPICModal] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [picUsers, setPicUsers] = useState<PICUser[]>([]);
  const [selectedPicId, setSelectedPicId] = useState("");
  const [assigningPic, setAssigningPic] = useState(false);
  const [formData, setFormData] = useState({ nama: "", alamat: "", latitude: "", longitude: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
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

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\/+/, '');
    return `${API_BASE_URL}/${cleanPath.startsWith('uploads') ? cleanPath : 'uploads/' + cleanPath}`;
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

  const collectPICUsers = useCallback((dapurList: Dapur[]) => {
    const picMap = new Map<string, PICUser>();
    
    dapurList.forEach((d) => {
      if (d.picDapur && Array.isArray(d.picDapur)) {
        d.picDapur.forEach((pic: any) => {
          if (!picMap.has(pic.id)) {
            picMap.set(pic.id, {
              id: pic.id,
              name: pic.name,
              email: pic.email,
              phone: pic.phone
            });
          }
        });
      }
    });

    return Array.from(picMap.values());
  }, []);

  const handleAssignPIC = async () => {
    if (!selectedDapur?.id || !selectedPicId) {
      showToast('error', 'Pilih PIC terlebih dahulu');
      return;
    }

    try {
      setAssigningPic(true);

      const response = await fetch(
        `${API_BASE_URL}/api/dapur/${selectedDapur.id}/assign-pic`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: selectedPicId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API Error: ${response.status}`
        );
      }

      showToast('success', 'PIC berhasil di-assign ke dapur!');
      setShowAssignPICModal(false);
      setSelectedPicId("");
      setShowDetailModal(false);
      fetchDapur();
    } catch (err: any) {
      showToast('error', 'Gagal assign PIC: ' + err.message);
    } finally {
      setAssigningPic(false);
    }
  };

  const openAssignPICModal = () => {
    setSelectedPicId(selectedDapur?.pic?.id || "");
    
    const allPics = collectPICUsers(dapur);
    setPicUsers(allPics);
    
    if (allPics.length === 0) {
      showToast('error', 'Belum ada PIC yang terdaftar');
      return;
    }

    setShowAssignPICModal(true);
  };

  const handleUpdateStatus = async (dapurId: string, newStatus: string) => {
    if (!dapurId) {
      showToast('error', 'ID Dapur tidak valid');
      return;
    }

    try {
      setUpdatingStatus(true);

      const response = await fetch(
        `${API_BASE_URL}/api/dapur/${dapurId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API Error: ${response.status}`
        );
      }

      const responseData = await response.json();

      setDapur(prevDapur =>
        prevDapur.map(d =>
          d.id === dapurId
            ? { ...d, status: newStatus, ...responseData.data }
            : d
        )
      );

      if (selectedDapur?.id === dapurId) {
        setSelectedDapur(prev =>
          prev ? { ...prev, status: newStatus, ...responseData.data } : null
        );
      }

      showToast('success', `Status dapur berhasil diubah menjadi ${newStatus}!`);
    } catch (err: any) {
      showToast('error', 'Gagal update status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Initialize Map with Province Boundaries
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


  // Add markers to map
  useEffect(() => {
    if (!mapRef.current || dapur.length === 0 || !isMapReady) return;

    const updateMarkers = async () => {
      try {
        markersRef.current.forEach((marker: any) => marker.remove());
        markersRef.current = [];

        const L = await import('leaflet');
        const filteredDapurList = dapur.filter(d => {
          if (searchQuery === "") return true;
          return (
            d.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.alamat.toLowerCase().includes(searchQuery.toLowerCase())
          );
        });

        filteredDapurList.forEach((d: Dapur) => {
          if (d.latitude && d.longitude) {
            try {
              const statusColor = d.readinessStatus === 'CRITICAL' ? '#ef4444' : d.readinessStatus === 'WARNING' ? '#f97316' : d.readinessStatus === 'OPTIMAL' ? '#3b82f6' : '#22c55e';
              
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
                    <p style="font-size: 8px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin: 0; margin-bottom: 2px;">NAMA DAPUR</p>
                    <h4 style="font-weight: 900; font-size: 14px; line-height: 1.2; text-transform: uppercase; margin: 0;">${d.nama}</h4>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <p style="font-size: 8px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin: 0; margin-bottom: 2px;">LOKASI</p>
                    <p style="font-size: 10px; color: #4b5563; font-weight: 500; line-height: 1.3; margin: 0;">${d.alamat}</p>
                  </div>

                  ${d.pic ? `<p style="font-size: 10px; font-weight: 800; font-style: italic; margin: 0;">[PIC] ${d.pic.name}</p>` : `<p style="font-size: 10px; font-weight: 800; font-style: italic; margin: 0; color: red;">BELUM ADA PIC</p>`}
                  <button class="map-detail-btn-dapur" data-id="${d.id}" style="width: 100%; margin-top: 8px; padding: 6px; background: white; border: 2px solid black; font-weight: 900; font-size: 10px; cursor: pointer; text-transform: uppercase; font-family: inherit;">
                     LIHAT DETAIL
                  </button>
                </div>
              `;

              const marker = L.marker([d.latitude, d.longitude], {
                icon: customIcon,
                title: d.nama
              })
                .bindPopup(popupContent)
                .addTo(mapRef.current!);

              // Map click handling
              marker.on('popupopen', () => {
                setTimeout(() => {
                  const btn = document.querySelector(`.map-detail-btn-dapur[data-id="${d.id}"]`);
                  if (btn) {
                    btn.addEventListener('click', () => {
                      fetchDapurDetail(d.id);
                    });
                  }
                }, 0);
              });

              marker.on('click', () => {
                 // Nothing
              });

              markersRef.current.push(marker);
            } catch (err) {
              console.error(`Error adding marker for ${d.nama}:`, err);
            }
          }
        });
      } catch (err) {
        console.error("Error updating markers:", err);
      }
    };

    updateMarkers();
  }, [dapur, searchQuery, isMapReady]);

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

  const fetchDapur = useCallback(async () => {
    if (!authToken) return;

    try {
      setLoading(true);
      setError(null);

      const [dapurRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dapur?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_BASE_URL}/api/admin/dapur/summary-stats`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }).catch(() => null)
      ]);

      if (!dapurRes.ok) {
        throw new Error(`API Error: ${dapurRes.status}`);
      }

      const data = await dapurRes.json();
      
      let statsMap = new Map();
      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          statsData.data.forEach((d: any) => statsMap.set(d.id, d));
        }
      }

      let dapurList = [];
      if (Array.isArray(data.data?.data)) {
        dapurList = data.data.data;
      } else if (Array.isArray(data.data)) {
        dapurList = data.data;
      } else if (Array.isArray(data)) {
        dapurList = data;
      }

      const mappedDapurList = dapurList.map((d: any) => {
        const beStats = statsMap.get(d.id);
        
        let totalSekolah = d.sekolahDilayani?.length || 0;
        let totalKaryawan = d._count?.karyawan || 0;
        let totalStokKg = 0;
        let totalBebanSiswa = 0;
        let readinessScore = 100;
        let readinessStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
        
        if (beStats) {
          totalSekolah = beStats.totalSekolah;
          totalKaryawan = beStats.totalKaryawan;
          totalStokKg = beStats.totalStokKg;
          totalBebanSiswa = beStats.totalBebanSiswa;
          readinessScore = beStats.readinessScore;
          
          if (readinessScore < 50) readinessStatus = 'CRITICAL';
          else if (readinessScore < 85) readinessStatus = 'WARNING';
        }

        return {
          ...d,
          pic: d.picDapur && d.picDapur.length > 0 ? d.picDapur[0] : undefined,
          karyawan: totalKaryawan,
          stok: d._count?.stokBahanBaku || 0,
          sekolah: d.sekolahDilayani || [],
          totalSekolah,
          totalKaryawan,
          totalStokKg,
          totalBebanSiswa,
          readinessScore,
          readinessStatus,
          province: (typeof d.province === 'object' && d.province?.name)
            ? d.province.name
            : (typeof d.provinces === 'object' && d.provinces?.name)
              ? d.provinces.name
              : (d.province || d.provinces) || null,
        };
      });

      setDapur(mappedDapurList);
    } catch (err: any) {
      const errorMsg = err.message || "Gagal mengambil data dapur";
      setError(errorMsg);
      showToast('error', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const handleCreateDapur = async (e: React.FormEvent) => {
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

      const response = await fetch(`${API_BASE_URL}/api/dapur`, {
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

      showToast('success', 'Dapur berhasil ditambahkan!');
      setFormData({ nama: "", alamat: "", latitude: "", longitude: "" });
      setShowAddModal(false);
      fetchDapur();
    } catch (err: any) {
      showToast('error', 'Gagal menambahkan dapur: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDapur = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDapur?.id || !formData.nama || !formData.alamat || !formData.latitude || !formData.longitude) {
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

      const response = await fetch(`${API_BASE_URL}/api/dapur/${selectedDapur.id}`, {
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

      showToast('success', 'Dapur berhasil diperbarui!');
      setShowEditModal(false);
      setFormData({ nama: "", alamat: "", latitude: "", longitude: "" });
      fetchDapur();
    } catch (err: any) {
      showToast('error', 'Gagal memperbarui dapur: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDapur = async (dapurId: string) => {
    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      showToast('success', 'Dapur berhasil dihapus!');
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      fetchDapur();
    } catch (err: any) {
      showToast('error', 'Gagal menghapus dapur: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchDapurDetail = useCallback(async (dapurId: string) => {
    if (!authToken) return;

    try {
      // INSTANT UI FEEDBACK: Set immediately from list if available
      const cached = dapur.find(d => d.id === dapurId);
      if (cached) {
        setSelectedDapur(cached);
        setShowDetailModal(true);
      }

      // BACKGROUND REFRESH
      const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const detailRaw = data.data || data;
      
      const detail = {
        ...detailRaw,
        pic: detailRaw.picDapur && detailRaw.picDapur.length > 0 ? detailRaw.picDapur[0] : undefined,
        sekolah: (detailRaw.sekolahDilayani || [])
          .filter((sd: any) => sd.status !== 'REJECTED')
          .map((sd: any) => ({
            id: sd.sekolah?.id,
            nama: sd.sekolah?.nama || sd.sekolah?.name,
            status: sd.status
          }))
      };
      
      // Merge with our precalculated stats
      if (cached) {
          detail.readinessScore = cached.readinessScore;
          detail.readinessStatus = cached.readinessStatus;
          detail.totalBebanSiswa = cached.totalBebanSiswa;
          detail.totalStokKg = cached.totalStokKg;
      }
      
      setSelectedDapur(detail);
      setShowDetailModal(true);
    } catch (err: any) {
      showToast('error', 'Gagal mengambil detail dapur: ' + err.message);
    }
  }, [authToken, dapur]);

  const openEditModal = (d: Dapur) => {
    setSelectedDapur(d);
    setFormData({
      nama: d.nama,
      alamat: d.alamat,
      latitude: d.latitude?.toString() || "",
      longitude: d.longitude?.toString() || "",
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const openDeleteConfirm = (dapurId: string) => {
    setDeleteTargetId(dapurId);
    setShowDeleteConfirm(true);
    setShowDetailModal(false);
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

  useEffect(() => {
    if (authToken) {
      fetchDapur();
    }
  }, [authToken, fetchDapur]);

  const filteredDapur = useMemo(() => {
    let filtered = dapur;

    // Filter by selected province
    if (selectedProvince) {
      filtered = filtered.filter(d => {
        // Handle different data types
        let provinceValue: any = d.province;

        // If it's an object or array, try to get the name property
        if (typeof provinceValue === 'object' && provinceValue !== null) {
          provinceValue = (provinceValue as any).name || (provinceValue as any).nama || JSON.stringify(provinceValue);
        }

        // Convert to string if not already
        provinceValue = String(provinceValue || '').trim();

        // Normalize both sides for comparison
        const normalizedProvince = normalizeProvinceName(provinceValue);
        const normalizedSelected = normalizeProvinceName(selectedProvince);

        return normalizedProvince === normalizedSelected;
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(d =>
        d.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.pic?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [dapur, searchQuery, selectedProvince]);

  const stats = useMemo(() => {
    return {
      totalDapur: dapur.length,
      totalPIC: dapur.filter(d => d.pic).length,
      totalDriver: dapur.reduce((sum, d) => sum + (d.drivers?.length || 0), 0),
      totalKaryawan: dapur.reduce((sum, d) => sum + (d.karyawan?.length || 0), 0),
    };
  }, [dapur]);

  if (loading) {
    return (
      <AdminLayout currentPage="dapur">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

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

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
            <div className="lg:col-span-2 bg-gray-200 rounded-lg animate-pulse"></div>
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
    <AdminLayout currentPage="dapur">
      <div className="space-y-4">
        {toastMessage && (
          <div className={`fixed top-4 right-4 px-6 py-4 rounded-none text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-widest text-xs border-2 border-white z-[100] ${
            toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toastMessage.text}
          </div>
        )}

        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tighter italic">Manajemen Dapur</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Logistik & Distribusi Suplai Makanan</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-black text-white border border-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            TAMBAH DAPUR
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border-l-4 border-l-blue-600 border border-gray-200 p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Unit Dapur</p>
            </div>
            <p className="text-3xl font-black text-black uppercase tracking-tighter">{stats.totalDapur}</p>
          </div>

          <div className="bg-white border-l-4 border-l-green-600 border border-gray-200 p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">PIC Aktif</p>
            </div>
            <p className="text-3xl font-black text-black uppercase tracking-tighter">{stats.totalPIC}</p>
          </div>

          <div className="bg-white border-l-4 border-l-orange-600 border border-gray-200 p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Keranjang</p>
            </div>
            <p className="text-3xl font-black text-black uppercase tracking-tighter">{stats.totalDriver || 0}</p>
          </div>

          <div className="bg-white border-l-4 border-l-black border border-gray-200 p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Personel</p>
            </div>
            <p className="text-3xl font-black text-black uppercase tracking-tighter">{stats.totalKaryawan || 0}</p>
          </div>
        </div>


        {error && (
          <div className="border-4 border-red-600 bg-red-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Terjadi Kesalahan</p>
            <p className="text-xs text-red-700 mt-1 font-bold italic underline">{error}</p>
          </div>
        )}

        <div className="bg-white border-2 border-black p-0 flex items-center gap-0 overflow-hidden">
          <div className="bg-black px-6 py-4 flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <input
            type="text"
            placeholder="Cari nama dapur, alamat, atau PIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 placeholder:text-gray-400 text-sm font-bold uppercase border-0 focus:ring-0 focus:outline-none"
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
                      <span className="text-gray-400">DAPUR AKTIF</span>
                      <span className="text-white text-lg leading-none">{filteredDapur.length}</span>
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

          <div className="bg-white border-2 border-black overflow-hidden flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-4 border-b-2 border-black bg-black text-white">
              <h3 className="text-xs font-black uppercase tracking-widest italic">KITCHEN LIST ({filteredDapur.length}) // MONITORING</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredDapur.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p className="text-sm font-black uppercase">Tidak ada dapur ditemukan</p>
                </div>
              ) : (
                <div className="divide-y-2 divide-black">
                  {filteredDapur.map((d) => (
                    <div key={d.id} className={`p-4 transition-all group hover:bg-gray-50 border-l-4 ${selectedDapur?.id === d.id ? 'border-l-black bg-gray-50' : 'border-l-transparent'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 pr-2 min-w-0">
                           <div className="flex justify-between gap-2 items-start">
                              <h3 className="text-xs font-black uppercase tracking-tighter text-black truncate flex-1">{d.nama}</h3>
                              <div className="text-right flex-shrink-0">
                                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">BEBAN SUPLAI</p>
                                 <p className="text-sm font-black text-blue-600 leading-none">{d.totalSekolah || 0} SEKOLAH</p>
                              </div>
                           </div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">{d.pic?.name || 'BELUM ADA PIC'}</p>
                           <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5 truncate">{d.alamat}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => fetchDapurDetail(d.id)}
                          className="flex-1 p-2 bg-black text-white text-[8px] font-black uppercase tracking-widest border border-black hover:bg-gray-800"
                        >
                          DETAIL
                        </button>
                        <button
                          onClick={() => openEditModal(d)}
                          className="px-3 p-2 bg-white text-black border border-black hover:bg-gray-100 transition-colors flex items-center justify-center"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(d.id)}
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

      {/* Detail Modal */}
      {showDetailModal && selectedDapur && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
            <div className="bg-black text-white p-6 sticky top-0 z-10 flex items-center justify-between border-b-4 border-black">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">{selectedDapur.nama}</h2>
                <p className="text-white/60 text-[10px] font-bold mt-1 uppercase tracking-widest">Detail Dapur & Resources</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 bg-white text-black border-2 border-black hover:bg-gray-200 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Lokasi */}
              <div>
                <h3 className="font-black text-black mb-3 flex items-center gap-2 uppercase tracking-tight text-sm">
                  <MapPinIcon className="w-5 h-5 text-black" />
                  Lokasi & Alamat
                </h3>
                <div className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                  <p className="text-sm text-black font-bold uppercase">{selectedDapur.alamat}</p>
                </div>
              </div>

              {/* PIC dengan Assign Button */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
                  <h3 className="font-black text-black flex items-center gap-2 uppercase tracking-tight text-sm">
                    <Users className="w-5 h-5 text-black" />
                    Person In Charge (PIC)
                  </h3>
                  <button
                    onClick={openAssignPICModal}
                    className="px-4 py-2 bg-black text-white text-[10px] uppercase font-black tracking-widest border-2 border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                  >
                    {selectedDapur.pic ? "UBAH PIC" : "ASSIGN PIC"}
                  </button>
                </div>

                {selectedDapur.pic ? (
                  <div className="bg-white p-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex gap-4">
                    <div className="w-16 h-20 bg-black border-2 border-black flex-shrink-0 grayscale hover:grayscale-0 transition-all cursor-zoom-in overflow-hidden">
                        {(selectedDapur as any).picFoto || (selectedDapur as any).pic?.fotoUrl ? (
                            <img 
                                src={getImageUrl((selectedDapur as any).picFoto || (selectedDapur as any).pic?.fotoUrl)!} 
                                alt={selectedDapur.pic.name} 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20 text-xl font-black">
                                {selectedDapur.pic.name[0]}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 uppercase tracking-tight text-lg leading-none mb-1 truncate">{selectedDapur.pic.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">PIC_RESMI</p>
                        <div className="space-y-1">
                            {selectedDapur.pic.phone && (
                                <p className="text-[10px] font-black uppercase text-gray-400">
                                    P: <span className="text-black">{selectedDapur.pic.phone}</span>
                                </p>
                            )}
                            {selectedDapur.pic.email && (
                                <p className="text-[10px] font-black uppercase text-gray-400 truncate">
                                    E: <span className="text-black">{selectedDapur.pic.email}</span>
                                </p>
                            )}
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-300 p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
                    <p className="text-[10px] font-black text-black uppercase tracking-widest italic">MENUNGGU_PENGAKTIFAN_PIC</p>
                  </div>
                )}
              </div>

              {/* Status Dapur */}
              <div>
                <h3 className="font-black text-black mb-3 flex items-center gap-2 uppercase tracking-tight text-sm">
                  <CheckCircle className="w-5 h-5 text-black" />
                  Sirkulasi & Status
                </h3>
                <div className="bg-white p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status Sistem:</p>
                      <p className="text-xl font-black text-black">
                        <span className={`inline-block px-4 py-1 border-2 border-black ${
                          selectedDapur.status === 'AKTIF' 
                            ? 'bg-green-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                            : 'bg-red-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        }`}>
                          {selectedDapur.status || 'TIDAK DIKETAHUI'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6 pt-6 border-t-2 border-black border-dashed">
                    <button
                      onClick={() => handleUpdateStatus(selectedDapur.id, 'AKTIF')}
                      disabled={updatingStatus || selectedDapur.status === 'AKTIF'}
                      className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest transition-all border-2 border-black ${
                        selectedDapur.status === 'AKTIF'
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-green-400 text-black hover:bg-green-500 hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      {updatingStatus ? 'PROCESSING...' : 'AKTIFKAN SISTEM'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedDapur.id, 'TIDAK_AKTIF')}
                      disabled={updatingStatus || selectedDapur.status === 'TIDAK_AKTIF'}
                      className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest transition-all border-2 border-black ${
                        selectedDapur.status === 'TIDAK_AKTIF'
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-red-500 text-white hover:bg-red-600 hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      {updatingStatus ? 'PROCESSING...' : 'NON-AKTIFKAN'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="grid md:grid-cols-3 gap-0 border-4 border-black">
                <div className="bg-orange-400 p-6 border-b-4 md:border-b-0 md:border-r-4 border-black">
                  <p className="text-[10px] text-black font-black uppercase tracking-widest mb-1 italic">Drivers</p>
                  <p className="text-4xl font-black text-black">{selectedDapur.drivers?.length || 0}</p>
                </div>

                <div className="bg-purple-400 p-6 border-b-4 md:border-b-0 md:border-r-4 border-black">
                  <p className="text-[10px] text-black font-black uppercase tracking-widest mb-1 italic">Karyawan</p>
                  <p className="text-4xl font-black text-black">{selectedDapur.karyawan?.length || 0}</p>
                </div>

                <div className="bg-blue-400 p-6">
                  <p className="text-[10px] text-black font-black uppercase tracking-widest mb-1 italic">Stok Bahan</p>
                  <p className="text-4xl font-black text-black">{selectedDapur.stok?.length || 0}</p>
                </div>
              </div>

              {/* Sekolah */}
              {selectedDapur.sekolah && selectedDapur.sekolah.length > 0 && (
                <div>
                  <h3 className="font-black text-black mb-3 border-b-2 border-black pb-2 text-sm uppercase tracking-tight">
                    Sekolah Terlayani ({selectedDapur.sekolah.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto pr-2">
                    {selectedDapur.sekolah.map((s: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <div className="bg-black p-2"><Building2 className="w-4 h-4 text-white flex-shrink-0" /></div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black uppercase tracking-tighter text-black truncate block">{s.nama || s.name}</span>
                          <span className={`text-[8px] font-black uppercase px-1 border border-black ${s.status === 'APPROVED' ? 'bg-green-400 text-black' : 'bg-yellow-300 text-black'}`}>
                            {s.status || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-4 pt-6 border-t-4 border-black">
                <button
                  onClick={() => openEditModal(selectedDapur)}
                  className="flex-1 px-4 py-4 bg-[#D0B064] text-black border-2 border-black hover:bg-[#C9A355] transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                >
                  EDIT INFORMASI
                </button>
                <button
                  onClick={() => openDeleteConfirm(selectedDapur.id)}
                  className="flex-1 px-4 py-4 bg-red-600 text-white border-2 border-black hover:bg-red-700 transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                >
                  HAPUS
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                >
                  BAIK, TUTUP
                </button>
              </div>
            </div>
          </div>
        </div>      )}

      {/* Assign PIC Modal */}
      {showAssignPICModal && selectedDapur && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black max-w-md w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] flex flex-col">
            <div className="bg-black text-white px-6 py-5 flex items-center justify-between border-b-4 border-black flex-shrink-0">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">ASSIGN PERSONEL (PIC)</h3>
                <p className="text-white/60 text-[10px] font-bold mt-1 uppercase tracking-widest">{selectedDapur.nama}</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignPICModal(false);
                  setSelectedPicId("");
                }}
                className="p-2 border-2 border-white hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Info */}
              <div className="bg-yellow-300 p-4 border-4 border-black text-black">
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  NOTE: HANYA PERSONEL TERDAFTAR YANG DAPAT DIPILIH. DAFTARKAN DULU JIKA BELUM ADA.
                </p>
              </div>

              {/* PIC List */}
              {picUsers.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-3">
                    PILIH KANDIDAT AKTIF:
                  </label>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {picUsers.map((pic) => (
                      <label
                        key={pic.id}
                        className={`flex items-center p-4 border-4 border-black cursor-pointer transition-all ${selectedPicId === pic.id ? 'bg-black text-white shadow-none translate-x-1 translate-y-1' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`}
                      >
                        <input
                          type="radio"
                          name="pic"
                          value={pic.id}
                          checked={selectedPicId === pic.id}
                          onChange={(e) => setSelectedPicId(e.target.value)}
                          className="hidden"
                        />
                        <div className="w-6 h-6 border-2 flex-shrink-0 flex items-center justify-center mr-4 transition-all ${selectedPicId === pic.id ? 'border-white bg-white' : 'border-black bg-white'}">
                           {selectedPicId === pic.id && <div className="w-3 h-3 bg-black"></div>}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black uppercase tracking-tight leading-none mb-1">{pic.name}</p>
                          <p className="text-[9px] font-bold mt-1 opacity-60">E: {pic.email}</p>
                          {pic.phone && (
                            <p className="text-[9px] font-bold opacity-60">P: {pic.phone}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* No PIC Available */}
              {picUsers.length === 0 && (
                <div className="bg-red-500 p-6 border-4 border-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
                  <p className="text-xs font-black uppercase italic tracking-widest">
                    ⚠️ BELUM ADA PERSONEL (PIC_DAPUR) YANG TERSEDIA DI SISTEM.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-4 border-black">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignPICModal(false);
                    setSelectedPicId("");
                  }}
                  className="w-full sm:flex-1 px-4 py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                >
                  BATAL 
                </button>
                <button
                  onClick={handleAssignPIC}
                  disabled={assigningPic || !selectedPicId || picUsers.length === 0}
                  className="w-full sm:flex-1 px-4 py-4 bg-green-500 text-black border-2 border-black hover:bg-green-600 transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {assigningPic ? 'MEMPROSES...' : 'ASSIGN SEKARANG'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDapur && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black max-w-md w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
            <div className="bg-black text-white px-6 py-5 flex items-center justify-between border-b-4 border-black">
              <h3 className="text-xl font-black uppercase italic tracking-tighter">EDIT DATA DAPUR</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setFormData({ nama: "", alamat: "", latitude: "", longitude: "" });
                }}
                className="p-2 border-2 border-white hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateDapur} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">IDENTITAS DAPUR</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-black text-sm font-black uppercase focus:outline-none focus:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">ALAMAT LENGKAP</label>
                <textarea
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-black text-sm font-bold uppercase focus:outline-none focus:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">LATITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-black text-sm font-black focus:outline-none focus:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">LONGITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-black text-sm font-black focus:outline-none focus:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setFormData({ nama: "", alamat: "", latitude: "", longitude: "" });
                  }}
                  className="w-full sm:flex-1 px-4 py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:flex-1 px-4 py-4 bg-[#D0B064] text-black border-2 border-black hover:bg-[#C9A355] transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 disabled:opacity-50"
                >
                  {submitting ? "MEMPROSES..." : "SIMPAN PERUBAHAN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black max-w-md w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
            <div className="bg-black text-white px-6 py-5 flex items-center justify-between border-b-4 border-black">
              <h3 className="text-xl font-black uppercase italic tracking-tighter">TAMBAH DAPUR BARU</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ nama: "", alamat: "", latitude: "", longitude: "" });
                }}
                className="p-2 border-2 border-white hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateDapur} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">NAMA DAPUR</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-black text-sm font-black uppercase focus:outline-none focus:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="CONTOH: DAPUR PUSAT"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">ALAMAT</label>
                <textarea
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-black text-sm font-bold uppercase focus:outline-none focus:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="JL. MERDEKA NO 123..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">KORDINAT SINKRONISASI GPS</label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-blue-600 text-white border-2 border-black hover:bg-blue-700 transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:-translate-y-1"
                >
                  {locationLoading ? "MENGAMBIL LOKASI..." : "📍 AUTO-DETECT LOKASI SAAT INI"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">LATITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-black text-sm font-black focus:outline-none focus:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    placeholder="-6.2088"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">LONGITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-black text-sm font-black focus:outline-none focus:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    placeholder="106.8456"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ nama: "", alamat: "", latitude: "", longitude: "" });
                  }}
                  className="w-full sm:flex-1 px-4 py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:flex-1 px-4 py-4 bg-[#D0B064] text-black border-2 border-black hover:bg-[#C9A355] transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 disabled:opacity-50"
                >
                  {submitting ? "MEMINTA..." : "DAFTARKAN DAPUR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black max-w-sm w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-center p-8">
            <div className="w-16 h-16 bg-red-500 border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black mb-4">HAPUS DAPUR INI?</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-8 leading-relaxed">
              TINDAKAN INI BERSIFAT PERMANEN DAN TIDAK BISA DIBATALKAN. PASTIKAN TIDAK ADA OPERASIONAL AKTIF.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleDeleteDapur(deleteTargetId)}
                disabled={submitting}
                className="w-full px-4 py-4 bg-red-600 text-white border-2 border-black hover:bg-red-700 transition-all font-black uppercase tracking-widest text-xs shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 disabled:opacity-50"
              >
                {submitting ? "MENGHAPUS..." : "YA, HAPUS PERMANEN"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
                className="w-full px-4 py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-all font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
              >
                KEMBALI AMAN
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DapurMapDashboard;