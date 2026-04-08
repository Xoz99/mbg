'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface User {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  role: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  source?: string; // dapur, sekolah, karyawan
  sourceName?: string;
  fotoUrl?: string; // Primary field from backend
}

// ===== SKELETON LOADING =====
const SkeletonUserRow = () => (
  <tr className="border-b-2 border-black animate-pulse">
    <td className="px-4 py-3"><div className="h-3 w-4 bg-gray-200"></div></td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 border-2 border-black"></div>
        <div className="space-y-1">
          <div className="h-3 w-24 bg-gray-200"></div>
          <div className="h-2 w-32 bg-gray-100"></div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 border-2 border-black"></div></td>
    <td className="px-4 py-3 text-center"><div className="h-3 w-16 bg-gray-200 mx-auto"></div></td>
    <td className="px-4 py-3 text-right">
      <div className="flex justify-end gap-2">
        <div className="h-8 w-16 bg-gray-200"></div>
        <div className="h-8 w-10 bg-gray-100 border-2 border-black"></div>
      </div>
    </td>
  </tr>
);

const UserManagement = () => {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
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
    posisi: 'KOKI',
    foto: null as File | null,
  });
  const [formLoading, setFormLoading] = useState(false);

  const roles = [
    { value: 'PIC_DAPUR', label: 'PIC Dapur', color: 'border-blue-600 text-blue-600' },
    { value: 'PIC_SEKOLAH', label: 'PIC Sekolah', color: 'border-green-600 text-green-600' },
    { value: 'KOKI', label: 'Koki', color: 'border-orange-600 text-orange-600' },
    { value: 'AHLI_GIZI', label: 'Ahli Gizi', color: 'border-purple-600 text-purple-600' },
    { value: 'TUKANG_CUCI_PIRING', label: 'Tukang Cuci Piring', color: 'border-yellow-600 text-yellow-600' },
    { value: 'ADMIN', label: 'Admin', color: 'border-red-600 text-red-600' },
    { value: 'SUPERADMIN', label: 'Super Admin', color: 'border-black text-black' },
    { value: 'KARYAWAN', label: 'Karyawan', color: 'border-gray-600 text-gray-600' },
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
    } catch (err) {
      router.push('/auth/login');
    }
  }, [router]);

  const fetchAllUsers = useCallback(async () => {
    if (!authToken) return;
    try {
      setLoading(true);
      setError(null);
      const allUsersList: User[] = [];
      
      const dRes = await fetch(`${API_BASE_URL}/api/dapur?limit=1000`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (dRes.ok) {
        const dData = await dRes.json();
        const dList = dData.data?.data || dData.data || dData || [];
        dList.forEach((d: any) => {
          const pic = d.pic || (d.picDapur && d.picDapur[0]) || null;
          if (pic || d.picName || d.picEmail) {
            allUsersList.push({
              id: pic?.id ? `pic-d-${pic.id}` : `dapur-${d.id}`,
              name: pic?.name || d.picName || `PIC ${d.nama || d.name}`,
              role: pic?.role || d.picRole || 'PIC_DAPUR',
              source: 'dapur',
              sourceName: d.nama || d.name,
              phone: pic?.phone || d.picPhone,
              email: pic?.email || d.picEmail,
              fotoUrl: pic?.fotoUrl || pic?.picFoto || d.picFoto || d.fotoUrl,
              createdAt: pic?.createdAt || d.createdAt
            });
          }
        });
      }

      const sRes = await fetch(`${API_BASE_URL}/api/sekolah?limit=1000`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        const sList = sData.data?.data || sData.data || sData || [];
        sList.forEach((s: any) => {
          const pic = s.pic || (s.picSekolah && s.picSekolah[0]) || null;
          if (pic || s.picName || s.picEmail) {
            allUsersList.push({
              id: pic?.id ? `pic-s-${pic.id}` : `sekolah-${s.id}`,
              name: pic?.name || s.picName || `PIC ${s.nama || s.name}`,
              role: pic?.role || s.picRole || 'PIC_SEKOLAH',
              source: 'sekolah',
              sourceName: s.nama || s.name,
              phone: pic?.phone || s.picPhone,
              email: pic?.email || s.picEmail,
              fotoUrl: pic?.fotoUrl || pic?.picFoto || s.picFoto || s.fotoUrl,
              createdAt: pic?.createdAt || s.createdAt
            });
          }
        });
      }

      const kRes = await fetch(`${API_BASE_URL}/api/karyawan?limit=1000`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (kRes.ok) {
        const kData = await kRes.json();
        const kList = kData.data?.data || kData.data || kData || [];
        kList.forEach((k: any) => {
          allUsersList.push({
            id: k.id,
            name: k.nama,
            role: k.posisi || 'KARYAWAN',
            source: 'karyawan',
            sourceName: 'PUSAT_MBG',
            fotoUrl: k.fotoUrl || k.foto,
            createdAt: k.createdAt
          });
        });
      }

      const unique = Array.from(new Map(allUsersList.map(u => [u.id, u])).values());
      const sorted = unique.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
      });
      setAllUsers(sorted);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data personel');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) fetchAllUsers();
  }, [authToken, fetchAllUsers]);

  const filteredUsers = useMemo(() => {
    let filtered = [...allUsers];
    if (filterRole !== 'semua') filtered = filtered.filter(u => u.role === filterRole);
    if (filterSource !== 'semua') filtered = filtered.filter(u => u.source === filterSource);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(q) || 
        (u.phone && u.phone.includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [searchQuery, filterRole, filterSource, allUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      const fd = new FormData();
      fd.append('nama', formData.name);
      fd.append('posisi', formData.posisi);
      if (formData.foto) fd.append('foto', formData.foto);

      const res = await fetch(`${API_BASE_URL}/api/karyawan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: fd
      });

      if (!res.ok) throw new Error('Gagal memproses pendaftaran');
      
      setShowAddModal(false);
      setFormData({ name: '', posisi: 'KOKI', foto: null });
      fetchAllUsers();
    } catch (err: any) {
      alert(`ERR: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setFormLoading(true);
      const fd = new FormData();
      fd.append('nama', formData.name);
      fd.append('posisi', formData.posisi);
      if (formData.foto) fd.append('foto', formData.foto);

      const endpoint = selectedUser.source === 'karyawan' 
        ? `/api/karyawan/${selectedUser.id}`
        : null;

      if (!endpoint) {
        alert("Peringatan: User unit harus dikelola dide menu registrasi terkait.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
        body: fd
      });

      if (!res.ok) throw new Error('Gagal update data');
      
      setShowEditModal(false);
      setSelectedUser(null);
      fetchAllUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      setFormLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/karyawan/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Gagal hapus data');
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      fetchAllUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleConfig = (role: string) => {
    return roles.find(r => r.value === role) || { value: role, label: role, color: 'border-black text-black' };
  };

  const getSourceLabel = (src?: string) => {
    if (src === 'dapur') return 'UNIT_DAPUR';
    if (src === 'sekolah') return 'UNIT_SEKOLAH';
    return 'INTERNAL_PUSAT';
  };

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\/+/, '');
    return `${API_BASE_URL}/${cleanPath.startsWith('uploads') ? cleanPath : 'uploads/' + cleanPath}`;
  };

  return (
    <AdminLayout currentPage="user">
       <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center border-b-4 border-black pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">DAFTAR_PERSONEL</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">SISTEM INTEGRASI TENAGA KERJA PUSAT</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', posisi: 'KOKI', foto: null });
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            TAMBAH_PERSONEL [+]
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-600 text-white p-4 border-2 border-black font-black text-xs uppercase tracking-widest">
            KESALAHAN // {error}
          </div>
        )}

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-2 border-black bg-white p-3">
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">CARI PERSONEL</label>
            <input
              type="text"
              placeholder="CARI NAMA / EMAIL / TELP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-black uppercase outline-none"
            />
          </div>
          <div className="border-2 border-black bg-white p-3">
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">JABATAN_OTORITAS</label>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="w-full bg-transparent text-sm font-black uppercase outline-none"
            >
              <option value="semua">SEMUA JABATAN</option>
              {roles.map(r => <option key={r.value} value={r.value}>{r.label.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="border-2 border-black bg-white p-3">
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">SUMBER_DATA_UNIT</label>
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              className="w-full bg-transparent text-sm font-black uppercase outline-none"
            >
              <option value="semua">SEMUA UNIT</option>
              <option value="dapur">DAPUR</option>
              <option value="sekolah">SEKOLAH</option>
              <option value="karyawan">MBG PUSAT</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="border-2 border-black bg-white overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-left">
            <thead className="bg-black text-white border-b-2 border-black">
              <tr className="divide-x divide-white/20">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest w-12 text-center">NO</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">IDENTITAS_PERSONEL</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">OTORITAS</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center">UNIT_ASAL</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {loading ? (
                Array(5).fill(0).map((_, i) => <SkeletonUserRow key={i} />)
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs font-black uppercase text-gray-400 italic tracking-[0.2em]">DATA_TIDAK_DITEMUKAN</td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-gray-50 group divide-x divide-black transition-colors text-black">
                    <td className="px-4 py-3 text-[9px] font-black text-gray-300 italic text-center">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black border-2 border-black overflow-hidden flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-300">
                          {getImageUrl(u.fotoUrl) ? (
                            <img src={getImageUrl(u.fotoUrl)!} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white font-black text-xs">
                              {u.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="leading-tight">
                          <p className="font-black text-xs uppercase tracking-tight">{u.name}</p>
                          <p className="text-[8px] font-bold text-gray-400 mt-0.5">{u.email || u.phone || u.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 border font-black text-[8px] uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${getRoleConfig(u.role).color}`}>
                        {getRoleConfig(u.role).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-black italic underline decoration-gray-200">{getSourceLabel(u.source)}</p>
                        <p className="text-[7px] font-black text-gray-400">{u.sourceName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 text-black">
                        <button
                          onClick={() => { setSelectedUser(u); setShowDetailModal(true); }}
                          className="px-3 py-1.5 bg-black text-white text-[8px] font-black uppercase hover:bg-gray-800 transition-colors"
                        >
                          DETAIL
                        </button>
                        {u.source === 'karyawan' && (
                          <button
                            onClick={() => {
                                setSelectedUser(u);
                                setFormData({ name: u.name, posisi: u.role, foto: null });
                                setShowEditModal(true);
                            }}
                            className="px-3 py-1.5 border-2 border-black text-[8px] font-black uppercase hover:bg-gray-50 transition-colors"
                          >
                            UBAH
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="bg-gray-50 px-4 py-2 border-t-2 border-black flex justify-between items-center text-[9px] font-black uppercase tracking-widest italic decoration-black decoration-2">
            <span>DATABASE_PERSONEL_AKTIF // MBG_CENTRAL</span>
            <span className="text-gray-400">TOTAL_ASET: {filteredUsers.length}</span>
          </div>
        </div>

        {/* MODAL: DETAIL */}
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border-4 border-black max-w-lg w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200 overflow-hidden text-black">
              <div className="bg-black text-white p-5 flex justify-between items-center">
                <h2 className="text-xl font-black uppercase italic tracking-tighter">DEKRIPSI_DATA_PERSONEL</h2>
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedUser(null); }}
                  className="w-8 h-8 border-2 border-white flex items-center justify-center text-xs font-black hover:bg-white hover:text-black transition-all"
                >
                  X
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex gap-6">
                  <div className="w-32 h-40 bg-black border-2 border-black flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-500 cursor-zoom-in overflow-hidden">
                    {getImageUrl(selectedUser.fotoUrl) ? (
                      <img src={getImageUrl(selectedUser.fotoUrl)!} alt={selectedUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/20 p-4 text-center">
                        <p className="text-5xl font-black">{selectedUser.name[0]}</p>
                        <p className="text-[8px] font-black mt-2">KOSONG</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">NAMA_PERSONEL</p>
                      <p className="text-2xl font-black uppercase italic leading-none">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">ID_OTORITAS</p>
                      <p className="text-xs font-black inline-block bg-gray-100 px-2 py-1">{selectedUser.id}</p>
                    </div>
                    <div className="pt-2">
                       <span className={`px-4 py-1.5 border-2 font-black text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${getRoleConfig(selectedUser.role).color}`}>
                        {getRoleConfig(selectedUser.role).label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">UNIT_SUMBER</p>
                    <p className="text-xs font-black uppercase italic">{getSourceLabel(selectedUser.source)}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase">{selectedUser.sourceName}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">TANGGAL_DAFTAR</p>
                    <p className="text-xs font-black uppercase italic">
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('id-ID') : 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">DATA_KONTAK</p>
                    <p className="text-xs font-black italic">{selectedUser.phone || 'TIDAK_ADA_WhatsApp'}</p>
                    {selectedUser.email && <p className="text-[10px] text-gray-400 font-bold break-all mt-1 lowercase font-medium tracking-normal">{selectedUser.email}</p>}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  {selectedUser.source === 'karyawan' && (
                    <button
                      onClick={() => { setShowDetailModal(false); setShowEditModal(true); setFormData({ name: selectedUser.name, posisi: selectedUser.role, foto: null }); }}
                      className="flex-1 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800"
                    >
                      UBAH_DATA
                    </button>
                  )}
                  {selectedUser.source === 'karyawan' && (
                    <button
                      onClick={() => { setShowDetailModal(false); setDeleteTargetId(selectedUser.id); setShowDeleteConfirm(true); }}
                      className="px-6 py-3 border-2 border-red-600 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50"
                    >
                      HAPUS
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: FORM (INTERNAL) */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border-4 border-black max-w-sm w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200 text-black">
               <div className="bg-black text-white p-4 flex justify-between items-center">
                <h2 className="text-lg font-black uppercase italic tracking-tighter">
                    {showAddModal ? 'PERSONEL_BARU' : 'PEMBARUAN_DATA'}
                </h2>
                <button
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedUser(null); }}
                  className="font-black text-xs hover:text-red-500"
                >
                  [X]
                </button>
              </div>
              <form onSubmit={showAddModal ? handleCreateUser : handleUpdateUser} className="p-6 space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">NAMA LENGKAP</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border-2 border-black text-sm font-black uppercase focus:bg-gray-50 outline-none"
                    placeholder="MASUKKAN NAMA..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">JABATAN</label>
                        <select
                            value={formData.posisi}
                            onChange={e => setFormData({ ...formData, posisi: e.target.value })}
                            className="w-full p-2.5 border-2 border-black text-xs font-black uppercase outline-none bg-white"
                        >
                            {roles.filter(r => !['PIC_DAPUR', 'PIC_SEKOLAH', 'ADMIN', 'SUPERADMIN'].includes(r.value)).map(r => (
                                <option key={r.value} value={r.value}>{r.label.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">UNGGAH_FOTO</label>
                        <div className="relative h-[42px] border-2 border-black overflow-hidden bg-gray-50 flex items-center px-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setFormData({ ...formData, foto: e.target.files ? e.target.files[0] : null })}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <span className="text-[8px] font-black truncate text-gray-400">
                                {formData.foto ? formData.foto.name : 'PILIH_FILE'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedUser(null); }}
                        className="flex-1 py-3 border-2 border-black font-black uppercase text-[10px] tracking-widest hover:bg-gray-50"
                    >
                        BATAL
                    </button>
                    <button
                        type="submit"
                        disabled={formLoading}
                        className="flex-1 py-3 bg-black text-white font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                        {formLoading ? 'PROSES...' : 'EKSEKUSI_DATA'}
                    </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DELETE */}
        {showDeleteConfirm && deleteTargetId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-600/80 backdrop-blur-sm">
            <div className="bg-white border-4 border-black max-w-xs w-full p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-center animate-in zoom-in-95 duration-200 text-black">
              <div className="w-16 h-16 bg-red-600 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-3xl font-black text-white italic">!</span>
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4">HAPUS DATA?</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed mb-6">
                Data yang dihapus tidak dapat dikembalikan ke sistem. Konfirmasi penghapusan personel?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleDeleteUser(deleteTargetId)}
                  disabled={formLoading}
                  className="w-full py-3 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 border-2 border-black"
                >
                  {formLoading ? '...PENGHAPUSAN' : 'KONFIRMASI_HAPUS'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteTargetId(null); }}
                  className="w-full py-3 border-2 border-black font-black uppercase text-[10px] tracking-widest transition-all hover:bg-gray-50"
                >
                  BATAL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserManagement;