'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Plus, Loader2, AlertCircle, CheckCircle, X, Eye, EyeOff,
  Users, Mail, Phone, Search, ChevronLeft, ChevronRight
} from 'lucide-react';

interface SekolahItem {
  id: string;
  nama: string;
  hasPIC: boolean;
  picName?: string;
  picEmail?: string;
  picPhone?: string;
}

const provinceIdMap: { [key: string]: string } = {
  'Aceh': '11',
  'Sumatera Utara': '12',
  'Sumatera Barat': '13',
  'Riau': '14',
  'Jambi': '15',
  'Sumatera Selatan': '16',
  'Lampung': '18',
  'Kepulauan Bangka Belitung': '19',
  'Kepulauan Riau': '17',
  'DKI Jakarta': '31',
  'Jawa Barat': '32',
  'Jawa Tengah': '33',
  'DI Yogyakarta': '34',
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
  'Papua Barat': '91',
  'Papua': '94',
  'Papua Selatan': '93',
  'Papua Tengah': '94',
  'Papua Barat Daya': '96',
};

const RegisterPICSekolahPage = () => {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sekolahList, setSekolahList] = useState<SekolahItem[]>([]);
  const [loadingSekolah, setLoadingSekolah] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-pic' | 'without-pic'>('without-pic');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    province: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [sekolah, setSekolah] = useState<{ id: string; nama: string }[]>([]);
  const [selectedSekolahId, setSelectedSekolahId] = useState('');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
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
      fetchSekolah(token);
      fetchSekolahList(token);
    } catch (error) {
      router.push('/auth/login');
    }
  }, [router]);

  const fetchSekolah = async (token: string) => {
    try {
      const response = await fetch('https://demombgv1.xyz/api/sekolah?page=1&limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let list = [];
        if (Array.isArray(data.data?.data)) {
          list = data.data.data;
        } else if (Array.isArray(data.data)) {
          list = data.data;
        } else if (Array.isArray(data)) {
          list = data;
        }

        const filtered = list.filter((s: any) => {
          const hasPIC = s.pic || (s.picSekolah && s.picSekolah.length > 0);
          return !hasPIC;
        });

        setSekolah(filtered);
      }
    } catch (err) {
      console.log('Gagal load sekolah');
    }
  };

  const fetchSekolahList = async (token: string) => {
    try {
      setLoadingSekolah(true);
      const response = await fetch('https://demombgv1.xyz/api/sekolah?page=1&limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let list = [];
        if (Array.isArray(data.data?.data)) {
          list = data.data.data;
        } else if (Array.isArray(data.data)) {
          list = data.data;
        } else if (Array.isArray(data)) {
          list = data;
        }

        const mapped = list.map((s: any) => {
          const hasPIC = s.pic || (s.picSekolah && s.picSekolah.length > 0);
          const picInfo = s.pic || (s.picSekolah && s.picSekolah[0]);

          return {
            id: s.id,
            nama: s.nama || s.name,
            hasPIC: hasPIC,
            picName: picInfo?.name,
            picEmail: picInfo?.email,
            picPhone: picInfo?.phone,
          };
        });

        setSekolahList(mapped);
      }
    } catch (err) {
      console.log('Gagal load sekolah list');
    } finally {
      setLoadingSekolah(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap harus diisi';
    }

    if (!selectedSekolahId) {
      newErrors.sekolah = 'Pilih sekolah terlebih dahulu';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email tidak valid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon harus diisi';
    } else if (!/^(\+62|0)[0-9]{9,}$/.test(formData.phone)) {
      newErrors.phone = 'Nomor telepon tidak valid';
    }

    if (!formData.province) {
      newErrors.province = 'Pilih provinsi terlebih dahulu';
    }

    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }

    if (formData.password !== formData.confirmPassword) {
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
        role: 'PIC_SEKOLAH',
        sekolahId: selectedSekolahId,
        provinceId: formData.province ? provinceIdMap[formData.province] : ''
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      // Update sekolah with provinceId
      if (selectedSekolahId && formData.province) {
        const provinceId = provinceIdMap[formData.province];
        await fetch(`https://demombgv1.xyz/api/sekolah/${selectedSekolahId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ provinceId }),
        });
      }

      showToast('success', 'PIC Sekolah berhasil didaftarkan!');
      setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '', province: '' });
      setErrors({});
      setSelectedSekolahId('');
      await fetchSekolahList(authToken);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mendaftar PIC Sekolah');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSekolah = sekolahList.filter(s =>
    s.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displaySekolah = filteredSekolah.filter(s => {
    if (filterStatus === 'with-pic') return s.hasPIC;
    if (filterStatus === 'without-pic') return !s.hasPIC;
    return true;
  });

  const totalPages = Math.ceil(displaySekolah.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = displaySekolah.slice(startIdx, startIdx + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <AdminLayout currentPage="register-pic-sekolah">
      <div className="space-y-6">
        {toastMessage && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg z-50 ${
            toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {toastMessage.text}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register PIC Sekolah</h1>
          <p className="text-gray-600 mt-1">Daftarkan PIC Sekolah baru ke dalam sistem MBG</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Form Registrasi</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pilih Sekolah</label>
                  <select
                    value={selectedSekolahId}
                    onChange={(e) => {
                      setSelectedSekolahId(e.target.value);
                      if (errors.sekolah) setErrors({ ...errors, sekolah: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.sekolah ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Pilih Sekolah --</option>
                    {sekolah.map((s) => (
                      <option key={s.id} value={s.id}>{s.nama}</option>
                    ))}
                  </select>
                  {errors.sekolah && <p className="text-xs text-red-600 mt-1">{errors.sekolah}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Nama PIC"
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nomor Telepon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="08123456789"
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Provinsi</label>
                  <select
                    value={formData.province}
                    onChange={(e) => {
                      setFormData({ ...formData, province: e.target.value });
                      if (errors.province) setErrors({ ...errors, province: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.province ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Pilih Provinsi --</option>
                    <option value="Aceh">Aceh</option>
                    <option value="Sumatera Utara">Sumatera Utara</option>
                    <option value="Sumatera Barat">Sumatera Barat</option>
                    <option value="Riau">Riau</option>
                    <option value="Jambi">Jambi</option>
                    <option value="Sumatera Selatan">Sumatera Selatan</option>
                    <option value="Lampung">Lampung</option>
                    <option value="Kepulauan Bangka Belitung">Kepulauan Bangka Belitung</option>
                    <option value="Kepulauan Riau">Kepulauan Riau</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="DI Yogyakarta">DI Yogyakarta</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Banten">Banten</option>
                    <option value="Bali">Bali</option>
                    <option value="Nusa Tenggara Barat">Nusa Tenggara Barat</option>
                    <option value="Nusa Tenggara Timur">Nusa Tenggara Timur</option>
                    <option value="Kalimantan Barat">Kalimantan Barat</option>
                    <option value="Kalimantan Tengah">Kalimantan Tengah</option>
                    <option value="Kalimantan Selatan">Kalimantan Selatan</option>
                    <option value="Kalimantan Timur">Kalimantan Timur</option>
                    <option value="Kalimantan Utara">Kalimantan Utara</option>
                    <option value="Sulawesi Utara">Sulawesi Utara</option>
                    <option value="Sulawesi Tengah">Sulawesi Tengah</option>
                    <option value="Sulawesi Selatan">Sulawesi Selatan</option>
                    <option value="Sulawesi Tenggara">Sulawesi Tenggara</option>
                    <option value="Gorontalo">Gorontalo</option>
                    <option value="Sulawesi Barat">Sulawesi Barat</option>
                    <option value="Maluku">Maluku</option>
                    <option value="Maluku Utara">Maluku Utara</option>
                    <option value="Papua Barat">Papua Barat</option>
                    <option value="Papua">Papua</option>
                    <option value="Papua Selatan">Papua Selatan</option>
                    <option value="Papua Tengah">Papua Tengah</option>
                    <option value="Papua Barat Daya">Papua Barat Daya</option>
                  </select>
                  {errors.province && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: '' });
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Min. 8 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Konfirmasi Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${
                        errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ulangi password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-300 mt-4">
                <p className="text-xs text-blue-900">
                    <strong>Note:</strong> PIC akan bisa login setelah terdaftar.
                  </p>
                </div>

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

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
              <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-4">
                <h2 className="text-lg font-bold">Daftar Sekolah ({sekolahList.length})</h2>
              </div>

              {loadingSekolah ? (
                <>
                  <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 space-y-3">
                    <div className="flex gap-3">
                      <div className="h-10 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nama Sekolah</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">PIC</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(5)].map((_, idx) => (
                          <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-4 text-sm"><div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div></td>
                            <td className="px-6 py-4 text-sm"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></td>
                            <td className="px-6 py-4 text-sm"><div className="h-6 bg-gray-200 rounded-full w-28 animate-pulse"></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="flex gap-2">
                      <div className="h-9 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                      <div className="h-9 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                      <div className="h-9 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => {
                          setFilterStatus('all');
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterStatus === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                      >
                        Semua ({sekolahList.length})
                      </button>
                      <button
                        onClick={() => {
                          setFilterStatus('without-pic');
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterStatus === 'without-pic'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                      >
                        Tanpa PIC ({sekolahList.filter(s => !s.hasPIC).length})
                      </button>
                      <button
                        onClick={() => {
                          setFilterStatus('with-pic');
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterStatus === 'with-pic'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                      >
                        Sudah Ada PIC ({sekolahList.filter(s => s.hasPIC).length})
                      </button>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari nama sekolah..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nama Sekolah</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">PIC</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displaySekolah.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                              Tidak ada data
                            </td>
                          </tr>
                        ) : (
                          paginatedData.map((item, idx) => (
                            <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nama}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{item.picName || '-'}</td>
                              <td className="px-6 py-4 text-sm">
                                {item.hasPIC ? (
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

                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Halaman {currentPage} dari {totalPages || 1} ({displaySekolah.length} total)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Sebelumnya
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        Selanjutnya
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RegisterPICSekolahPage;