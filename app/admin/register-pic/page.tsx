'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Plus, Loader2, AlertCircle, CheckCircle, X, Eye, EyeOff,
  Users, Mail, Phone, Lock, Trash2, Edit, Search
} from 'lucide-react';

interface PICUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
}

interface DapurItem {
  id: string;
  name: string;
  hasPIC: boolean;
  email?: string;
  phone?: string;
  createdAt?: string;
  picData?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
}

const RegisterPICPage = () => {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [picList, setPicList] = useState<DapurItem[]>([]);
  const [loadingPic, setLoadingPic] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-pic' | 'without-pic'>('without-pic');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    province: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [dapur, setDapur] = useState<{ id: string; nama: string }[]>([]);
  const [selectedDapurId, setSelectedDapurId] = useState('');
  const [selectedDapurDetail, setSelectedDapurDetail] = useState<DapurItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Province name to ID mapping (BPS Indonesia Standard - from API)
  const provinceIdMap: { [key: string]: string } = {
    'Aceh': '11',
    'Sumatera Utara': '12',
    'Sumatera Barat': '13',
    'Riau': '14',
    'Jambi': '15',
    'Sumatera Selatan': '16',
    'Bengkulu': '17',
    'Lampung': '18',
    'Kepulauan Bangka Belitung': '19',
    'Kepulauan Riau': '21',
    'DKI Jakarta': '31',
    'Jawa Barat': '32',
    'Jawa Tengah': '33',
    'Daerah Istimewa Yogyakarta': '34',
    'Jawa Timur': '35',
    'Banten': '36',
    'Bali': '51',
    'Nusa Tenggara Barat': '52',
    'Nusa Tenggara Timur': '53',
    'Kalimantan Barat': '61',
    'Kalimantan Tengah': '62',
    'Kalimantan Selatan': '63',
    'Kalimantan Timur': '64',
    'Kalimantan Utara': '65',
    'Sulawesi Utara': '71',
    'Sulawesi Tengah': '72',
    'Sulawesi Selatan': '73',
    'Sulawesi Tenggara': '74',
    'Gorontalo': '75',
    'Sulawesi Barat': '76',
    'Maluku': '81',
    'Maluku Utara': '82',
    'Papua': '91',
    'Papua Barat': '92',
    'Papua Selatan': '93',
    'Papua Tengah': '94',
    'Papua Pegunungan': '95',
    'Papua Barat Daya': '96',
  };

  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    const token = localStorage.getItem('mbg_token');

    if (!userData || !token) {
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
      fetchDapur(token);
      fetchPICList(token);
    } catch (error) {
      router.push('/auth/login');
    }
  }, [router]);

  const fetchDapur = async (token: string) => {
    try {
      const response = await fetch('https://demombgv1.xyz/api/dapur?page=1&limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let dapurList = [];
        if (Array.isArray(data.data?.data)) {
          dapurList = data.data.data;
        } else if (Array.isArray(data.data)) {
          dapurList = data.data;
        } else if (Array.isArray(data)) {
          dapurList = data;
        }

        const dapurWithoutPIC = dapurList.filter((d: any) => {
          const hasPIC = d.pic || (d.picDapur && d.picDapur.length > 0);
          return !hasPIC;
        });

        setDapur(dapurWithoutPIC);
      }
    } catch (err) {
      // Failed to load dapur list
    }
  };

  const fetchPICList = async (token: string) => {
    try {
      setLoadingPic(true);
      const response = await fetch('https://demombgv1.xyz/api/dapur?page=1&limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let dapurList = [];
        if (Array.isArray(data.data?.data)) {
          dapurList = data.data.data;
        } else if (Array.isArray(data.data)) {
          dapurList = data.data;
        } else if (Array.isArray(data)) {
          dapurList = data;
        }

        const allDapurWithStatus = dapurList.map((d: any) => {
          const hasPIC = d.pic || (d.picDapur && d.picDapur.length > 0);
          const picInfo = d.pic || (d.picDapur && d.picDapur[0]);
          return {
            id: d.id,
            name: d.nama || d.name,
            hasPIC: hasPIC,
            email: hasPIC ? picInfo?.email || 'kitchen@mbg.com' : 'kitchen@mbg.com',
            phone: hasPIC ? picInfo?.phone || '-' : '-',
            createdAt: d.createdAt,
            picData: hasPIC ? {
              id: picInfo?.id,
              name: picInfo?.name,
              email: picInfo?.email,
              phone: picInfo?.phone
            } : undefined
          };
        });

        setPicList(allDapurWithStatus);
      }
    } catch (err) {
      // Failed to load pic list
    } finally {
      setLoadingPic(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap harus diisi';
    }

    if (!selectedDapurId) {
      newErrors.dapur = 'Pilih dapur terlebih dahulu';
    }

    if (!formData.province) {
      newErrors.province = 'Pilih provinsi terlebih dahulu';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email tidak valid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon harus diisi';
    } else if (!/^(\+62|0)[0-9]{9,}$/.test(formData.phone)) {
      newErrors.phone = 'Nomor telepon tidak valid (gunakan format 08xx atau +62xxx)';
    }

    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('error', 'Silakan periksa kembali form Anda');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'PIC_DAPUR',
        dapurId: selectedDapurId,
        provinceId: provinceIdMap[formData.province] || ''
      };

      const response = await fetch('https://demombgv1.xyz/api/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Full error response:', errorData);
          
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((e: any) => {
              if (typeof e === 'string') return e;
              if (e.message) return e.message;
              return JSON.stringify(e);
            }).join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
          
          console.error('Parsed error message:', errorMessage);
        } catch (e) {
          const text = await response.text();
          console.error('Error response text:', text);
        }
        throw new Error(errorMessage);
      }

      // Setelah register PIC berhasil, update dapur dengan provinceId
      if (selectedDapurId && formData.province) {
        const provinceId = provinceIdMap[formData.province];
        try {
          await fetch(`https://demombgv1.xyz/api/dapur/${selectedDapurId}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ provinceId }),
          });
        } catch (err) {
          console.error('Gagal update provinceId:', err);
        }
      }

      showToast('success', 'PIC Dapur berhasil didaftarkan!');

      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        province: ''
      });
      setErrors({});
      setSelectedDapurId('');

      await fetchPICList(authToken);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mendaftar PIC Dapur');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPics = picList
  .filter(pic => {
    if (filterStatus === 'with-pic') return pic.hasPIC;
    if (filterStatus === 'without-pic') return !pic.hasPIC;
    return true;
  })
  .filter(pic =>
    (pic.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (pic.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (pic.phone?.includes(searchQuery) || false)
  );

  const withPICCount = picList.filter(p => p.hasPIC).length;
  const withoutPICCount = picList.filter(p => !p.hasPIC).length;

  return (
    <AdminLayout currentPage="register-pic">
      <div className="space-y-6">
        {/* Toast Message */}
        {toastMessage && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg z-40 ${
            toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {toastMessage.text}
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register PIC Dapur</h1>
          <p className="text-gray-600 mt-1">Daftarkan PIC Dapur baru ke dalam sistem MBG</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Form Registrasi</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Pilih Dapur */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Pilih Dapur
                  </label>
                  <select
                    value={selectedDapurId}
                    onChange={(e) => {
                      setSelectedDapurId(e.target.value);
                      if (errors.dapur) setErrors({ ...errors, dapur: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.dapur ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Pilih Dapur --</option>
                    {dapur.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nama}
                      </option>
                    ))}
                  </select>
                  {errors.dapur && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.dapur}
                    </p>
                  )}
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Nama PIC"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Nomor Telepon */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="08123456789"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Provinsi */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Provinsi
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => {
                      setFormData({ ...formData, province: e.target.value });
                      if (errors.province) setErrors({ ...errors, province: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.province ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Pilih Provinsi</option>
                    <option value="Aceh">Aceh</option>
                    <option value="Bali">Bali</option>
                    <option value="Banten">Banten</option>
                    <option value="Bengkulu">Bengkulu</option>
                    <option value="Daerah Istimewa Yogyakarta">Daerah Istimewa Yogyakarta</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="Gorontalo">Gorontalo</option>
                    <option value="Jambi">Jambi</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Kalimantan Barat">Kalimantan Barat</option>
                    <option value="Kalimantan Selatan">Kalimantan Selatan</option>
                    <option value="Kalimantan Tengah">Kalimantan Tengah</option>
                    <option value="Kalimantan Timur">Kalimantan Timur</option>
                    <option value="Kalimantan Utara">Kalimantan Utara</option>
                    <option value="Kepulauan Bangka Belitung">Kepulauan Bangka Belitung</option>
                    <option value="Kepulauan Riau">Kepulauan Riau</option>
                    <option value="Lampung">Lampung</option>
                    <option value="Maluku">Maluku</option>
                    <option value="Maluku Utara">Maluku Utara</option>
                    <option value="Nusa Tenggara Barat">Nusa Tenggara Barat</option>
                    <option value="Nusa Tenggara Timur">Nusa Tenggara Timur</option>
                    <option value="Papua">Papua</option>
                    <option value="Papua Barat">Papua Barat</option>
                    <option value="Papua Selatan">Papua Selatan</option>
                    <option value="Papua Tengah">Papua Tengah</option>
                    <option value="Papua Pegunungan">Papua Pegunungan</option>
                    <option value="Papua Barat Daya">Papua Barat Daya</option>
                    <option value="Riau">Riau</option>
                    <option value="Sulawesi Barat">Sulawesi Barat</option>
                    <option value="Sulawesi Selatan">Sulawesi Selatan</option>
                    <option value="Sulawesi Tengah">Sulawesi Tengah</option>
                    <option value="Sulawesi Tenggara">Sulawesi Tenggara</option>
                    <option value="Sulawesi Utara">Sulawesi Utara</option>
                    <option value="Sumatera Barat">Sumatera Barat</option>
                    <option value="Sumatera Selatan">Sumatera Selatan</option>
                    <option value="Sumatera Utara">Sumatera Utara</option>
                  </select>
                  {errors.province && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.province}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: '' });
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Min. 8 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ulangi password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Info */}
                <div className="bg-slate-100 rounded-lg p-3 border border-slate-400 mt-4">
  <p className="text-xs text-slate-900">
    <strong>Note:</strong> PIC akan bisa login setelah terdaftar.
  </p>
</div>

                {/* Submit Button */}
                <button
  type="submit"
  disabled={submitting}
  className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white rounded-lg hover:from-[#162031] hover:to-[#1f2a38] transition-colors font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
>
  {submitting ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      Mendaftar...
    </>
  ) : (
    <>
      <Plus className="w-4 h-4" />
      Register
    </>
  )}
</button>
              </form>
            </div>
          </div>

          {/* Table Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-4">
                <h2 className="text-lg font-bold">Daftar Dapur ({picList.length})</h2>
              </div>

              {/* Filter Tabs */}
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Semua ({picList.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('without-pic')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === 'without-pic'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Tanpa PIC ({withoutPICCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus('with-pic')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === 'with-pic'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Sudah Ada PIC ({withPICCount})
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama dapur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nama Dapur</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Kontak</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPic ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : filteredPics.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                          {searchQuery ? 'Tidak ada hasil pencarian' : 'Tidak ada data'}
                        </td>
                      </tr>
                    ) : (
                      filteredPics.map((pic, idx) => (
                        <tr key={pic.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedDapurDetail(pic);
                          setShowDetailModal(true);
                        }}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{pic.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{pic.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{pic.phone}</td>
                          <td className="px-6 py-4 text-sm">
                            {pic.hasPIC ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Sudah Ada PIC
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Menunggu PIC
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedDapurDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
                <h3 className="text-lg font-bold">Detail Dapur</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Nama Dapur */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Dapur</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedDapurDetail.name}</p>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status PIC</label>
                  <div className="mt-1">
                    {selectedDapurDetail.hasPIC ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Sudah Ada PIC
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Menunggu PIC
                      </span>
                    )}
                  </div>
                </div>

                {/* PIC Info - Show only if hasPIC */}
                {selectedDapurDetail.hasPIC && selectedDapurDetail.picData && (
                  <div className="border-t pt-5 space-y-4">
                    <h4 className="font-semibold text-gray-900 text-sm">Informasi PIC</h4>

                    {/* Nama PIC */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        Nama PIC
                      </label>
                      <p className="text-gray-900 font-medium mt-1">{selectedDapurDetail.picData.name || '-'}</p>
                    </div>

                    {/* Email PIC */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        Email
                      </label>
                      <p className="text-gray-900 font-medium mt-1 break-all">{selectedDapurDetail.picData.email || '-'}</p>
                    </div>

                    {/* Telepon PIC */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        Telepon
                      </label>
                      <p className="text-gray-900 font-medium mt-1">{selectedDapurDetail.picData.phone || '-'}</p>
                    </div>
                  </div>
                )}

                {/* No PIC Message */}
                {!selectedDapurDetail.hasPIC && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Dapur ini belum memiliki PIC. Silakan daftarkan PIC melalui form registrasi di sebelah kiri.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RegisterPICPage;