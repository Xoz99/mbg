'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Search,
  Mail,
  Phone,
  Shield,
  AlertCircle,
  Loader2,
  Download,
  EyeOff,
  Check,
  ChevronDown,
  Building2,
  User as UserIcon,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL||'https://demombgv1.xyz';

interface User {
  id: string;
  email?: string; // Hidden (generated karyawan-{UUID}@local format)
  name: string;
  phone?: string;
  role: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  source?: string; // dapur, sekolah, karyawan
}

// ===== SKELETON LOADING =====
const SkeletonUserRow = () => (
  <tr className="border-b border-gray-100 animate-pulse">
    <td className="px-6 py-4"><div className="h-4 w-4 bg-gray-300 rounded"></div></td>
    <td className="px-6 py-4">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-gray-300 rounded"></div>
        <div className="h-3 w-40 bg-gray-200 rounded"></div>
      </div>
    </td>
    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 rounded"></div></td>
    <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-300 rounded-full"></div></td>
    <td className="px-6 py-4">
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-gray-300 rounded"></div>
        <div className="h-8 w-8 bg-gray-300 rounded"></div>
      </div>
    </td>
  </tr>
);

const UserManagement = () => {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('semua');
  const [filterSource, setFilterSource] = useState('semua');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    posisi: 'KOKI', // Karyawan posisi
    foto: null as File | null,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Role list - from backend
  const roles = [
    { value: 'PIC_DAPUR', label: 'PIC Dapur', color: 'bg-blue-100 text-blue-900' },
    { value: 'PIC_SEKOLAH', label: 'PIC Sekolah', color: 'bg-green-100 text-green-900' },
    { value: 'KOKI', label: 'Koki', color: 'bg-orange-100 text-orange-900' },
    { value: 'AHLI_GIZI', label: 'Ahli Gizi', color: 'bg-purple-100 text-purple-900' },
    { value: 'TUKANG_CUCI_PIRING', label: 'Tukang Cuci Piring', color: 'bg-yellow-100 text-yellow-900' },
    { value: 'ADMIN', label: 'Admin', color: 'bg-red-100 text-red-900' },
    { value: 'SUPERADMIN', label: 'Super Admin', color: 'bg-red-200 text-red-900' },
    { value: 'KARYAWAN', label: 'Karyawan', color: 'bg-gray-100 text-gray-900' },
  ];

  // Auth check
  useEffect(() => {
    const userData = localStorage.getItem('mbg_user');
    const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

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
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  // ===== FETCH FROM MULTIPLE SOURCES =====
  const fetchAllUsers = useCallback(async () => {
    if (!authToken) return;

    try {
      setLoading(true);
      setError(null);

      const allUsersList: User[] = [];
      let hasError = false;

      console.log('[FETCH] Starting multi-source user fetch...');

      // 1. GET PIC DAPUR from /api/dapur
      try {
        console.log('[FETCH] Getting PIC DAPUR from /api/dapur...');
        const dapurResponse = await fetch(`${API_BASE_URL}/api/dapur?page=1&limit=1000`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (dapurResponse.ok) {
          const dapurData = await dapurResponse.json();
          let dapurList = [];

          if (Array.isArray(dapurData.data?.data)) {
            dapurList = dapurData.data.data;
          } else if (Array.isArray(dapurData.data)) {
            dapurList = dapurData.data;
          } else if (Array.isArray(dapurData)) {
            dapurList = dapurData;
          }

          console.log(`[FETCH] Found ${dapurList.length} dapur`);

          // Extract PIC DAPUR info with role from BE
          dapurList.forEach((dapur: any) => {
            if (dapur.picEmail || dapur.picName) {
              allUsersList.push({
                id: `dapur-${dapur.id}`,
                email: dapur.picEmail || `pic-${dapur.id}@dapur.local`,
                name: dapur.picName || `PIC ${dapur.nama}`,
                phone: dapur.picPhone,
                role: dapur.picRole || 'PIC_DAPUR', // Get from BE, fallback to PIC_DAPUR
                source: 'dapur',
                createdAt: dapur.createdAt,
              });
            }
          });
        }
      } catch (err) {
        console.error('[FETCH] Error getting dapur:', err);
        hasError = true;
      }

      // 2. GET PIC SEKOLAH from /api/sekolah
      try {
        console.log('[FETCH] Getting PIC SEKOLAH from /api/sekolah...');
        const sekolahResponse = await fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=1000`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (sekolahResponse.ok) {
          const sekolahData = await sekolahResponse.json();
          let sekolahList = [];

          if (Array.isArray(sekolahData.data?.data)) {
            sekolahList = sekolahData.data.data;
          } else if (Array.isArray(sekolahData.data)) {
            sekolahList = sekolahData.data;
          } else if (Array.isArray(sekolahData)) {
            sekolahList = sekolahData;
          }

          console.log(`[FETCH] Found ${sekolahList.length} sekolah`);

          // Extract PIC SEKOLAH info with role from BE
          sekolahList.forEach((sekolah: any) => {
            if (sekolah.picEmail || sekolah.picName) {
              allUsersList.push({
                id: `sekolah-${sekolah.id}`,
                email: sekolah.picEmail || `pic-${sekolah.id}@sekolah.local`,
                name: sekolah.picName || `PIC ${sekolah.nama}`,
                phone: sekolah.picPhone,
                role: sekolah.picRole || 'PIC_SEKOLAH', // Get from BE, fallback to PIC_SEKOLAH
                source: 'sekolah',
                createdAt: sekolah.createdAt,
              });
            }
          });
        }
      } catch (err) {
        console.error('[FETCH] Error getting sekolah:', err);
        hasError = true;
      }

      // 3. GET KARYAWAN from /api/karyawan
      try {
        console.log('[FETCH] Getting KARYAWAN from /api/karyawan...');
        const karyawanResponse = await fetch(`${API_BASE_URL}/api/karyawan?page=1&limit=1000`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (karyawanResponse.ok) {
          const karyawanData = await karyawanResponse.json();
          let karyawanList = [];

          if (Array.isArray(karyawanData.data?.data)) {
            karyawanList = karyawanData.data.data;
          } else if (Array.isArray(karyawanData.data)) {
            karyawanList = karyawanData.data;
          } else if (Array.isArray(karyawanData)) {
            karyawanList = karyawanData;
          }

          console.log(`[FETCH] Found ${karyawanList.length} karyawan`);

          // Extract KARYAWAN info with posisi as role (KOKI, AHLI_GIZI, TUKANG_CUCI_PIRING, dll)
          karyawanList.forEach((karyawan: any) => {
            allUsersList.push({
              id: karyawan.id,
              name: karyawan.nama,
              phone: undefined, // Karyawan doesn't have phone
              role: karyawan.posisi || 'KARYAWAN', // posisi is the role (KOKI, AHLI_GIZI, etc)
              source: 'karyawan',
              createdAt: karyawan.createdAt,
            });
          });
        }
      } catch (err) {
        console.error('[FETCH] Error getting karyawan:', err);
        hasError = true;
      }

      // 4. Deduplicate by ID (not email, since email is generated format)
      const uniqueUsers = Array.from(
        new Map(allUsersList.map((user) => [user.id, user])).values()
      );

      console.log(`[FETCH] Total unique users: ${uniqueUsers.length}`);

      if (uniqueUsers.length === 0 && hasError) {
        setError('Gagal mengambil data user dari beberapa sumber. Cek koneksi dan token.');
      }

      setAllUsers(uniqueUsers);
      setUsers(uniqueUsers);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Gagal memload data user');
      setAllUsers([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  // Fetch saat authToken tersedia
  useEffect(() => {
    if (authToken) {
      fetchAllUsers();
    }
  }, [authToken, fetchAllUsers]);

  // ===== FILTER & SEARCH =====
  useEffect(() => {
    let filtered = [...allUsers];

    // Filter by role
    if (filterRole !== 'semua') {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Filter by source
    if (filterSource !== 'semua') {
      filtered = filtered.filter((user) => user.source === filterSource);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          (user.phone && user.phone.includes(query))
      );
    }

    setUsers(filtered);
  }, [searchQuery, filterRole, filterSource, allUsers]);

  // ===== CRUD OPERATIONS =====
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormLoading(true);

      const formDataPayload = new FormData();
      formDataPayload.append('nama', formData.name);
      formDataPayload.append('posisi', formData.posisi);
      if (formData.foto) {
        formDataPayload.append('foto', formData.foto);
      }

      const response = await fetch(`${API_BASE_URL}/api/karyawan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataPayload,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('Create success:', result);

      setFormData({ name: '', posisi: 'KOKI', foto: null });
      setShowAddModal(false);
      await fetchAllUsers();
      alert('Karyawan berhasil ditambahkan!');
    } catch (err: any) {
      console.error('Create error:', err);
      alert(err.message || 'Gagal menambah karyawan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      setFormLoading(true);

      const formDataPayload = new FormData();
      formDataPayload.append('nama', formData.name);
      formDataPayload.append('posisi', formData.posisi);
      if (formData.foto) {
        formDataPayload.append('foto', formData.foto);
      }

      const response = await fetch(`${API_BASE_URL}/api/karyawan/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataPayload,
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }

      setShowEditModal(false);
      setSelectedUser(null);
      await fetchAllUsers();
      alert('Karyawan berhasil diupdate!');
    } catch (err: any) {
      console.error('Update error:', err);
      alert(err.message || 'Gagal update karyawan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setFormLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/karyawan/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      await fetchAllUsers();
      alert('Karyawan berhasil dihapus!');
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Gagal hapus karyawan');
    } finally {
      setFormLoading(false);
    }
  };

  // ===== HELPER FUNCTIONS =====
  const getRoleConfig = (role: string) => {
    return roles.find((r) => r.value === role) || { value: role, label: role, color: 'bg-gray-100 text-gray-700' };
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'dapur':
        return 'Dapur';
      case 'sekolah':
        return 'Sekolah';
      case 'karyawan':
        return 'Karyawan';
      default:
        return 'Other';
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      posisi: user.role,
      foto: null,
    });
    setShowEditModal(true);
  };

  // ===== RENDER =====
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen User</h1>
          <p className="text-gray-600 mt-1">Kelola semua user dari PIC Dapur, PIC Sekolah, Karyawan, dan lainnya</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setFormData({ name: '', posisi: 'KOKI', foto: null });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah User
            </button>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Role:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              >
                <option value="semua">Semua</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Sumber:</span>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              >
                <option value="semua">Semua</option>
                <option value="dapur">Dapur</option>
                <option value="sekolah">Sekolah</option>
                <option value="karyawan">Karyawan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Nama</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Posisi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Sumber</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonUserRow key={i} />)
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada user
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getRoleConfig(user.role).color}`}>
                          {getRoleConfig(user.role).label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-900">
                          {getSourceLabel(user.source)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailModal(true);
                            }}
                            className="p-2 hover:bg-blue-100 text-blue-900 rounded-lg transition-colors"
                            title="Lihat detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 hover:bg-yellow-100 text-yellow-900 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTargetId(user.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {users.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Menampilkan {users.length} dari {allUsers.length} user
            </div>
          )}
        </div>

        {/* ===== MODAL: Add User ===== */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-5 flex justify-between items-center">
                <h3 className="text-lg font-bold">Tambah Karyawan</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Karyawan</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Masukkan nama karyawan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Posisi</label>
                  <select
                    value={formData.posisi}
                    onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  >
                    {roles.filter(r => r.value !== 'PIC_DAPUR' && r.value !== 'PIC_SEKOLAH' && r.value !== 'ADMIN' && r.value !== 'SUPERADMIN').map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Foto (Opsional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, foto: e.target.files?.[0] || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                  {formData.foto && (
                    <p className="text-sm text-gray-600 mt-2">File: {formData.foto.name}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Tambah
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== MODAL: Edit User ===== */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-5 flex justify-between items-center">
                <h3 className="text-lg font-bold">Edit User</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Karyawan</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Masukkan nama karyawan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Posisi</label>
                  <select
                    value={formData.posisi}
                    onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  >
                    {roles.filter(r => r.value !== 'PIC_DAPUR' && r.value !== 'PIC_SEKOLAH' && r.value !== 'ADMIN' && r.value !== 'SUPERADMIN').map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Foto (Opsional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, foto: e.target.files?.[0] || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                  {formData.foto && (
                    <p className="text-sm text-gray-600 mt-2">File: {formData.foto.name}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== MODAL: Delete Confirmation ===== */}
        {showDeleteConfirm && deleteTargetId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Karyawan?</h3>
                <p className="text-sm text-gray-600 mb-6">Tindakan ini tidak dapat dibatalkan.</p>

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
                    onClick={() => deleteTargetId && handleDeleteUser(deleteTargetId)}
                    disabled={formLoading}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL: Detail User ===== */}
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-5 flex items-center justify-between">
                <h3 className="text-xl font-bold">Detail Karyawan</h3>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Nama</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedUser.name}</p>
                </div>

                {selectedUser.phone && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Telepon</label>
                    <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selectedUser.phone}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-600">Posisi</label>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getRoleConfig(selectedUser.role).color}`}>
                      {getRoleConfig(selectedUser.role).label}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Sumber</label>
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
                      {getSourceLabel(selectedUser.source)}
                    </span>
                  </div>
                </div>

                {selectedUser.createdAt && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Dibuat: {new Date(selectedUser.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openEditModal(selectedUser);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
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
      </div>
    </AdminLayout>
  );
};

export default UserManagement;