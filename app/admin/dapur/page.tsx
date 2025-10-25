'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Building2, Users, Package, Truck, MapPin, Phone, Mail, 
  Eye, Edit, Trash2, Plus, Search, Filter, AlertCircle, 
  Loader2, CheckCircle, MapPinIcon, Download, X, Navigation
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = "http://72.60.79.126:3000";

interface Dapur {
  id: string;
  nama: string;
  alamat: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  pic?: { id: string; name: string; phone?: string; email?: string };
  picDapur?: any[];
  drivers?: any[];
  karyawan?: any[];
  stok?: any[];
  stokBahanBaku?: any[];
  sekolah?: any[];
  sekolahDilayani?: any[];
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
  const [loadingPics, setLoadingPics] = useState(false);
  const [selectedPicId, setSelectedPicId] = useState("");
  const [assigningPic, setAssigningPic] = useState(false);
  const [formData, setFormData] = useState({ nama: "", alamat: "", latitude: "", longitude: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  // Assign PIC to Dapur
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

  // Open assign modal
  const openAssignPICModal = () => {
    setSelectedPicId(selectedDapur?.pic?.id || "");
    
    // Collect PIC users dari dapur list yang sudah ada
    const allPics = collectPICUsers(dapur);
    setPicUsers(allPics);
    
    if (allPics.length === 0) {
      showToast('error', 'Belum ada PIC yang terdaftar');
      return;
    }

    setShowAssignPICModal(true);
  };

  // Update Status Dapur
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

      showToast('success', `Status dapur berhasil diubah menjadi ${newStatus}!`);
      fetchDapur();
    } catch (err: any) {
      showToast('error', 'Gagal update status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Initialize Map
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
              const hasPIC = d.pic && d.pic.name;
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
                  🍳
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
                  <h4 class="font-bold text-sm mb-2">${d.nama}</h4>
                  <p class="text-xs text-gray-600 mb-2">${d.alamat}</p>
                  <div class="border-t pt-2 mt-2 text-xs">
                    ${d.pic ? `<p class="mb-1"><strong>PIC:</strong> ${d.pic.name}</p>` : '<p class="mb-1 text-red-600"><strong>PIC:</strong> Belum ada</p>'}
                    ${d.pic?.phone ? `<p class="mb-1"><strong>Telepon:</strong> ${d.pic.phone}</p>` : ''}
                    <p class="mb-1"><strong>Drivers:</strong> ${d.drivers?.length || 0}</p>
                    <p class="mb-1"><strong>Karyawan:</strong> ${d.karyawan || 0}</p>
                    <p><strong>Sekolah:</strong> ${d.sekolah?.length || 0}</p>
                  </div>
                </div>
              `;

              const marker = L.marker([d.latitude, d.longitude], {
                icon: customIcon,
                title: d.nama
              })
                .bindPopup(popupContent)
                .addTo(mapRef.current!)
                .on('click', () => {
                  setSelectedDapur(d);
                  setShowDetailModal(true);
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

      const response = await fetch(`${API_BASE_URL}/api/dapur?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      let dapurList = [];
      if (Array.isArray(data.data?.data)) {
        dapurList = data.data.data;
      } else if (Array.isArray(data.data)) {
        dapurList = data.data;
      } else if (Array.isArray(data)) {
        dapurList = data;
      }

      const mappedDapurList = dapurList.map((d: any) => ({
        ...d,
        pic: d.picDapur && d.picDapur.length > 0 ? d.picDapur[0] : undefined,
        karyawan: d._count?.karyawan || 0,
        stok: d._count?.stokBahanBaku || 0,
        sekolah: d.sekolahDilayani || [],
      }));

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
      const detail = data.data || data;
      setSelectedDapur(detail);
      setShowDetailModal(true);
    } catch (err: any) {
      showToast('error', 'Gagal mengambil detail dapur');
    }
  }, [authToken]);

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

  useEffect(() => {
    if (authToken) {
      fetchDapur();
    }
  }, [authToken, fetchDapur]);

  const filteredDapur = useMemo(() => {
    if (!searchQuery) return dapur;

    return dapur.filter(d =>
      d.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.pic?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dapur, searchQuery]);

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
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg z-40 ${
            toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {toastMessage.text}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Dapur</h1>
            <p className="text-gray-600 mt-1">Monitor dan kelola semua dapur di seluruh lokasi</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] transition-colors font-semibold shadow-md">
            <Plus className="w-5 h-5" />
            Tambah Dapur
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Total Dapur</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDapur}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">PIC Dapur</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPIC}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Total Driver</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDriver}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Total Karyawan</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalKaryawan}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
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
              placeholder="Cari nama dapur, alamat, atau PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 border-0 focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px] relative z-0">
          <div className="lg:col-span-2 bg-transparent border-0 overflow-hidden relative z-0 rounded-lg">
            <div id="map-container" className="w-full h-full" style={{ minHeight: '600px', position: 'relative', zIndex: 0 }}></div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Daftar Dapur ({filteredDapur.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredDapur.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Tidak ada dapur ditemukan</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredDapur.map((d) => (
                    <div key={d.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-l-transparent hover:border-l-[#D0B064]">
                      <div onClick={() => fetchDapurDetail(d.id)}>
                        <p className="font-semibold text-gray-900 text-sm">{d.nama}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.alamat}</p>
                        <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {d.pic?.name || 'Belum ada PIC'}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openEditModal(d)}
                          className="flex-1 p-1.5 bg-amber-50 text-amber-600 rounded text-xs hover:bg-amber-100 transition-colors"
                        >
                          <Edit className="w-3 h-3 mx-auto" />
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white p-6 sticky top-0 z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedDapur.nama}</h2>
                <p className="text-white/80 text-sm mt-1">Detail Dapur & Resources</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Lokasi */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-blue-600" />
                  Lokasi
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700">{selectedDapur.alamat}</p>
                </div>
              </div>

              {/* PIC dengan Assign Button */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    PIC Dapur
                  </h3>
                  <button
                    onClick={openAssignPICModal}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    {selectedDapur.pic ? "Ubah PIC" : "Assign PIC"}
                  </button>
                </div>

                {selectedDapur.pic ? (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="font-semibold text-gray-900">{selectedDapur.pic.name}</p>
                    {selectedDapur.pic.phone && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {selectedDapur.pic.phone}
                      </p>
                    )}
                    {selectedDapur.pic.email && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {selectedDapur.pic.email}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-800">Belum ada PIC yang di-assign. Klik "Assign PIC" untuk menambahkan.</p>
                  </div>
                )}
              </div>

              {/* Status Dapur */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-600" />
                  Status Dapur
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status saat ini:</p>
                      <p className="text-lg font-bold text-gray-900">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          selectedDapur.status === 'AKTIF' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedDapur.status || 'TIDAK DIKETAHUI'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleUpdateStatus(selectedDapur.id, 'AKTIF')}
                      disabled={updatingStatus || selectedDapur.status === 'AKTIF'}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        selectedDapur.status === 'AKTIF'
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      } disabled:opacity-50`}
                    >
                      {updatingStatus ? 'Memproses...' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedDapur.id, 'NONAKTIF')}
                      disabled={updatingStatus || selectedDapur.status === 'NONAKTIF'}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        selectedDapur.status === 'NONAKTIF'
                          ? 'bg-red-100 text-red-700 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      } disabled:opacity-50`}
                    >
                      {updatingStatus ? 'Memproses...' : 'Nonaktifkan'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs text-orange-600 font-semibold mb-2">Drivers</p>
                  <p className="text-3xl font-bold text-orange-900">{selectedDapur.drivers?.length || 0}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-purple-600 font-semibold mb-2">Karyawan</p>
                  <p className="text-3xl font-bold text-purple-900">{selectedDapur.karyawan?.length || 0}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-600 font-semibold mb-2">Stok Bahan</p>
                  <p className="text-3xl font-bold text-blue-900">{selectedDapur.stok?.length || 0}</p>
                </div>
              </div>

              {/* Sekolah */}
              {selectedDapur.sekolah && selectedDapur.sekolah.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Sekolah Terlayani ({selectedDapur.sekolah.length})</h3>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {selectedDapur.sekolah.map((s: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900 truncate">{s.nama || s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openEditModal(selectedDapur)}
                  className="flex-1 px-4 py-2.5 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] transition-colors font-semibold"
                >
                  Edit Dapur
                </button>
                <button
                  onClick={() => openDeleteConfirm(selectedDapur.id)}
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

      {/* Assign PIC Modal */}
      {showAssignPICModal && selectedDapur && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-5 flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-xl font-bold">Assign PIC ke Dapur</h3>
                <p className="text-green-100 text-sm mt-1">{selectedDapur.nama}</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignPICModal(false);
                  setSelectedPicId("");
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Pilih PIC yang sudah terdaftar. Data diambil dari daftar PIC yang ada di sistem.
                </p>
              </div>

              {/* PIC List */}
              {picUsers.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Pilih PIC Dapur
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {picUsers.map((pic) => (
                      <label
                        key={pic.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="pic"
                          value={pic.id}
                          checked={selectedPicId === pic.id}
                          onChange={(e) => setSelectedPicId(e.target.value)}
                          className="w-4 h-4 text-green-600"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-semibold text-gray-900">{pic.name}</p>
                          <p className="text-xs text-gray-600">{pic.email}</p>
                          {pic.phone && (
                            <p className="text-xs text-gray-600">{pic.phone}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* No PIC Available */}
              {picUsers.length === 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-sm text-yellow-900">
                    Belum ada PIC yang terdaftar di sistem. Silakan daftarkan PIC_DAPUR terlebih dahulu melalui sistem registrasi.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignPICModal(false);
                    setSelectedPicId("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleAssignPIC}
                  disabled={assigningPic || !selectedPicId || picUsers.length === 0}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {assigningPic ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Meng-assign...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Assign
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDapur && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between sticky top-0">
              <h3 className="text-xl font-bold">Edit Dapur</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setFormData({ nama: "", alamat: "", latitude: "", longitude: "" });
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateDapur} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Dapur</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat</label>
                <textarea
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setFormData({ nama: "", alamat: "", latitude: "", longitude: "" });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit className="w-5 h-5" />}
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between sticky top-0">
              <h3 className="text-xl font-bold">Tambah Dapur Baru</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ nama: "", alamat: "", latitude: "", longitude: "" });
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateDapur} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Dapur</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                  placeholder="Contoh: Dapur MBG Pusat"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat</label>
                <textarea
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                  placeholder="Jl. Merdeka No. 123, Jakarta"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                    placeholder="-6.2088"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                    placeholder="106.8456"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ nama: "", alamat: "", latitude: "", longitude: "" });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {submitting ? "Menambahkan..." : "Tambah Dapur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Dapur?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Anda yakin ingin menghapus dapur ini? Tindakan ini tidak dapat dibatalkan.
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
                  onClick={() => handleDeleteDapur(deleteTargetId)}
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

export default DapurMapDashboard;