'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DapurLayout from '@/components/layout/DapurLayout';
import { Truck, CheckCircle, AlertCircle, Loader2, Plus, Trash2, Eye, EyeOff, User, Phone, Mail, Key, Search, X } from 'lucide-react';

const API_BASE_URL = "https://demombgv1.xyz";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  nomorKendaraan: string;
}

interface CreateDriverForm {
  email: string;
  name: string;
  phone: string;
  password: string;
  nomorKendaraan: string;
}

// Skeleton Loading Component untuk Driver List
const SkeletonDriverCard = () => (
  <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 animate-pulse">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 space-y-3 w-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
        <div className="h-3 bg-gray-300 rounded w-full"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        <div className="h-6 bg-gray-300 rounded-full w-1/3"></div>
      </div>
      <div className="w-8 h-8 bg-gray-300 rounded-lg flex-shrink-0"></div>
    </div>
  </div>
);

const SkeletonListHeader = () => (
  <div className="p-6 border-b border-gray-100" style={{ backgroundColor: '#1B263A' }}>
    <div className="h-6 bg-gray-700 rounded w-1/3 animate-pulse"></div>
  </div>
);

const CreateDriverPage = () => {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [form, setForm] = useState<CreateDriverForm>({
    email: '',
    name: '',
    phone: '',
    password: '',
    nomorKendaraan: '',
  });

  // Get auth token
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken") || "";
    }
    return "";
  };

  // Load drivers list
  useEffect(() => {
    loadDrivers();
  }, []);

  // Filter drivers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDrivers(drivers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = drivers.filter(driver =>
        driver.name.toLowerCase().includes(query) ||
        driver.email.toLowerCase().includes(query) ||
        driver.phone.toLowerCase().includes(query) ||
        driver.nomorKendaraan.toLowerCase().includes(query)
      );
      setFilteredDrivers(filtered);
    }
  }, [searchQuery, drivers]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/api/dapur/drivers`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load drivers: ${response.status}`);
      }

      const data = await response.json();

      // Extract drivers array
      let driversList: Driver[] = [];
      
      if (data?.data) {
        if (Array.isArray(data.data)) {
          driversList = data.data;
        } 
        else if (typeof data.data === 'object') {
          if (Array.isArray(data.data.drivers)) {
            driversList = data.data.drivers;
          } else if (Array.isArray(data.data.items)) {
            driversList = data.data.items;
          } else if (Array.isArray(data.data.list)) {
            driversList = data.data.list;
          } else {
            for (const [key, value] of Object.entries(data.data)) {
              if (Array.isArray(value)) {
                driversList = value as Driver[];
                break;
              }
            }
          }
        }
      }
      
      setDrivers(driversList);
      setFilteredDrivers(driversList);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat driver list");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!form.email.trim()) return "Email harus diisi";
    if (!form.email.includes("@")) return "Email tidak valid";
    if (!form.name.trim()) return "Nama harus diisi";
    if (!form.phone.trim()) return "Nomor telepon harus diisi";
    if (form.password.length < 6) return "Password minimal 6 karakter";
    if (!form.nomorKendaraan.trim()) return "Nomor kendaraan harus diisi";
    return null;
  };

  // Handle create driver
  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const token = getToken();

      const payload = {
        email: form.email.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        nomorKendaraan: form.nomorKendaraan.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/api/dapur/drivers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create driver: ${response.status}`);
      }

      const newDriver = await response.json();

      // Reset form
      setForm({
        email: '',
        name: '',
        phone: '',
        password: '',
        nomorKendaraan: '',
      });

      setSuccess('Driver berhasil dibuat');
      setShowPassword(false);

      // Reload drivers list
      setTimeout(() => {
        loadDrivers();
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Gagal membuat driver");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete driver
  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus driver ini?')) {
      return;
    }

    try {
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/api/dapur/drivers/${driverId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete driver: ${response.status}`);
      }

      setSuccess('Driver berhasil dihapus');

      // Reload drivers list
      setTimeout(() => {
        loadDrivers();
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Gagal menghapus driver");
    }
  };

  return (
    <DapurLayout currentPage="daftardriver">
      <div className="space-y-6">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            Daftar Driver
          </h1>
          <p className="text-gray-500 mt-2">Kelola dan tambahkan driver baru untuk armada kendaraan</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg animate-in">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg animate-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Left - Create Driver Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              {/* Form Header */}
              <div className="p-6 border-b border-gray-100" style={{ backgroundColor: '#1B263A' }}>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Tambah Driver Baru
                </h2>
              </div>

              {/* Form Content */}
              <div className="p-8">
                <form onSubmit={handleCreateDriver} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#1B263A' }}>
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email <span style={{ color: '#D0B064' }}>*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="driver@example.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none transition-all"
                      style={{ 
                        borderColor: form.email ? '#D0B064' : '#e5e7eb',
                        '--tw-ring-color': '#D0B064'
                      } as any}
                      required
                    />
                  </div>

                  {/* Nama */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#1B263A' }}>
                      <User className="w-4 h-4 inline mr-2" />
                      Nama Driver <span style={{ color: '#D0B064' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="Nama Driver"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none transition-all"
                      style={{ 
                        borderColor: form.name ? '#D0B064' : '#e5e7eb',
                        '--tw-ring-color': '#D0B064'
                      } as any}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#1B263A' }}>
                      <Phone className="w-4 h-4 inline mr-2" />
                      Nomor Telepon <span style={{ color: '#D0B064' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      placeholder="08123456789"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none transition-all"
                      style={{ 
                        borderColor: form.phone ? '#D0B064' : '#e5e7eb',
                        '--tw-ring-color': '#D0B064'
                      } as any}
                      required
                    />
                  </div>

                  {/* Nomor Kendaraan */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#1B263A' }}>
                      <Truck className="w-4 h-4 inline mr-2" />
                      Nomor Kendaraan <span style={{ color: '#D0B064' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="nomorKendaraan"
                      value={form.nomorKendaraan}
                      onChange={handleInputChange}
                      placeholder="B 1234 CD"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none transition-all"
                      style={{ 
                        borderColor: form.nomorKendaraan ? '#D0B064' : '#e5e7eb',
                        '--tw-ring-color': '#D0B064'
                      } as any}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#1B263A' }}>
                      <Key className="w-4 h-4 inline mr-2" />
                      Password <span style={{ color: '#D0B064' }}>*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleInputChange}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none transition-all pr-10"
                        style={{ 
                          borderColor: form.password ? '#D0B064' : '#e5e7eb',
                          '--tw-ring-color': '#D0B064'
                        } as any}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ 
                      backgroundColor: submitting ? '#d1d5db' : '#D0B064',
                      color: submitting ? '#6b7280' : '#F2F9F8'
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg mt-8"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Membuat Driver...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Buat Driver
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right - Drivers List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 sticky top-0">
              {/* List Header */}
              {loading ? (
                <SkeletonListHeader />
              ) : (
                <div className="p-6 border-b border-gray-100" style={{ backgroundColor: '#1B263A' }}>
                  <h2 className="text-lg font-bold text-white mb-4">
                    Driver List <span style={{ color: '#D0B064' }}>({filteredDrivers.length})</span>
                  </h2>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari driver..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#D0B064] transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* List Body */}
              <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
                {loading ? (
                  // Skeleton Loading
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <SkeletonDriverCard key={i} />
                    ))}
                  </div>
                ) : filteredDrivers.length === 0 ? (
                  // Empty State
                  <div className="text-center py-12">
                    <Truck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    {searchQuery ? (
                      <>
                        <p className="text-sm text-gray-500 font-medium">Tidak ada driver ditemukan</p>
                        <p className="text-xs text-gray-400 mt-1">Coba ubah pencarian Anda</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 font-medium">Belum ada driver</p>
                    )}
                  </div>
                ) : (
                  // Drivers List
                  <div className="space-y-3">
                    {filteredDrivers.map((driver) => (
                      <div 
                        key={driver.id} 
                        className="p-4 rounded-lg border border-gray-100 hover:border-amber-200 transition-all duration-200 bg-gradient-to-br from-gray-50 to-white group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D0B064' }}></div>
                              <p className="font-semibold text-gray-900 truncate text-sm">{driver.name}</p>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{driver.email}</p>
                            <p className="text-xs text-gray-500 truncate">{driver.phone}</p>
                            {driver.nomorKendaraan && (
                              <p className="text-xs font-medium mt-2 px-2 py-1 rounded-full inline-block" 
                                 style={{ backgroundColor: '#fef9f3', color: '#D0B064' }}>
                                🚗 {driver.nomorKendaraan}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                            title="Hapus driver"
                          >
                            <Trash2 className="w-4 h-4" />
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
        `}</style>
      </div>
    </DapurLayout>
  );
};

export default CreateDriverPage;