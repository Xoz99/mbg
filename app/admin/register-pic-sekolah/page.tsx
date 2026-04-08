'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface SekolahItem {
  id: string;
  nama: string;
  hasPIC: boolean;
  picName?: string;
  picEmail?: string;
  picPhone?: string;
}

const RegisterPICSekolahPage = () => {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sekolahList, setSekolahList] = useState<SekolahItem[]>([]);
  const [loadingSekolah, setLoadingSekolah] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-pic' | 'without-pic'>('without-pic');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    province: '',
    fotoUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [sekolah, setSekolah] = useState<{ id: string; nama: string }[]>([]);
  const [selectedSekolahId, setSelectedSekolahId] = useState('');

  const provinceIdMap: { [key: string]: string } = {
    'Aceh': '11', 'Sumatera Utara': '12', 'Sumatera Barat': '13', 'Riau': '14', 'Jambi': '15',
    'Sumatera Selatan': '16', 'Bengkulu': '17', 'Lampung': '18', 'Kepulauan Bangka Belitung': '19',
    'Kepulauan Riau': '21', 'DKI Jakarta': '31', 'Jawa Barat': '32', 'Jawa Tengah': '33',
    'DI Yogyakarta': '34', 'Jawa Timur': '35', 'Banten': '36', 'Bali': '51',
    'Nusa Tenggara Barat': '52', 'Nusa Tenggara Timur': '53', 'Kalimantan Barat': '61',
    'Kalimantan Tengah': '62', 'Kalimantan Selatan': '63', 'Kalimantan Timur': '64',
    'Kalimantan Utara': '65', 'Sulawesi Utara': '71', 'Sulawesi Tengah': '72',
    'Sulawesi Selatan': '73', 'Sulawesi Tenggara': '74', 'Gorontalo': '75',
    'Sulawesi Barat': '76', 'Maluku': '81', 'Maluku Utara': '82', 'Papua Barat': '91',
    'Papua': '94', 'Papua Selatan': '93', 'Papua Tengah': '94', 'Papua Barat Daya': '96',
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('mbg_user');
      const token = localStorage.getItem('mbg_token') || localStorage.getItem('authToken');

      if (!userData || !token) {
          router.push('/auth/login');
          return;
      }

      try {
          const user = JSON.parse(userData);
          if ((user.role || user.routeRole) !== 'SUPERADMIN') {
              router.push('/auth/login');
              return;
          }
          setAuthToken(token);
          fetchSekolah(token);
          fetchSekolahList(token);
      } catch (err) {
          router.push('/auth/login');
      }
    }
  }, [router]);

  const fetchSekolah = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const list = data.data?.data || data.data || data || [];
        const filtered = list.filter((s: any) => !(s.pic || (s.picSekolah && s.picSekolah.length > 0)));
        setSekolah(filtered.map((s:any) => ({ id: s.id, nama: s.nama || s.name })));
      }
    } catch (err) {}
  };

  const fetchSekolahList = async (token: string) => {
    try {
      setLoadingSekolah(true);
      const response = await fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const list = data.data?.data || data.data || data || [];
        setSekolahList(list.map((s: any) => {
          const pic = s.pic || (s.picSekolah && s.picSekolah[0]);
          return {
            id: s.id,
            nama: s.nama || s.name,
            hasPIC: !!pic,
            picName: pic?.name,
            picEmail: pic?.email,
            picPhone: pic?.phone,
          };
        }));
      }
    } finally {
      setLoadingSekolah(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSekolahId || !formData.name || !formData.email || !formData.password) {
        showToast('error', 'Semua data wajib diisi');
        return;
    }
    try {
      setSubmitting(true);
      let FinalFotoUrl = formData.fotoUrl;

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('image', selectedFile);
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload/image`, {
           method: 'POST',
           headers: { Authorization: `Bearer ${authToken}` },
           body: fileData
        });
        if (!uploadRes.ok) throw new Error('Gagal mengunggah foto');
        const uploadJson = await uploadRes.json();
        FinalFotoUrl = uploadJson.data.url;
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fotoUrl: FinalFotoUrl,
          role: 'PIC_SEKOLAH',
          sekolahId: selectedSekolahId,
          provinceId: provinceIdMap[formData.province] || ''
        })
      });
      if (!res.ok) throw new Error('Gagal mendaftarkan PIC');
      showToast('success', 'PIC SEKOLAH BERHASIL DIDAFDARKAN');
      setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '', province: '', fotoUrl: '' });
      setSelectedFile(null);
      setSelectedSekolahId('');
      fetchSekolah(authToken);
      fetchSekolahList(authToken);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSekolah = sekolahList.filter(s => {
    const MatchesStatus = filterStatus === 'all' ? true : filterStatus === 'with-pic' ? s.hasPIC : !s.hasPIC;
    const Search = s.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return MatchesStatus && Search;
  });

  return (
    <AdminLayout currentPage="register-pic-sekolah">
      <div className="space-y-6">
        {toastMessage && (
          <div className={`fixed top-4 right-4 z-50 p-4 border-2 border-black font-black uppercase text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${toastMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {toastMessage.type === 'success' ? 'BERHASIL' : 'KESALAHAN'} // {toastMessage.text}
          </div>
        )}

        <div className="flex justify-between items-center border-b-4 border-black pb-4 text-black">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">REGISTRASI_PIC_SEKOLAH</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">SISTEM OTORITAS PENDIDIKAN PUSAT</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-black">
          {/* FORM */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 underline decoration-black underline-offset-4">FORMULIR_PENDAFTARAN</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">PILIH_UNIT_SEKOLAH</label>
                  <select
                    value={selectedSekolahId}
                    onChange={e => setSelectedSekolahId(e.target.value)}
                    className="w-full p-3 border-2 border-black text-xs font-black uppercase outline-none focus:bg-gray-50"
                  >
                    <option value="">-- PILIH UNIT --</option>
                    {sekolah.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">NAMA_LENGKAP_PIC</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border-2 border-black text-xs font-black uppercase outline-none focus:bg-gray-50"
                    placeholder="NAMA LENGKAP..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">EMAIL_LINK</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-3 border-2 border-black text-xs font-black outline-none focus:bg-gray-50 text-black"
                            placeholder="email@sekolah.com"
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">KODE_TELEPON</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-3 border-2 border-black text-xs font-black uppercase outline-none focus:bg-gray-50"
                            placeholder="08XXX..."
                        />
                    </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">DOMAIN_PROVINSI</label>
                  <select
                    value={formData.province}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    className="w-full p-3 border-2 border-black text-xs font-black uppercase outline-none bg-white font-black"
                  >
                    <option value="">-- PILIH PROVINSI --</option>
                    {Object.keys(provinceIdMap).sort().map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">UNGGAH_FOTO_WAJAH_(OPSIONAL)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                        if (e.target.files && e.target.files.length > 0) {
                            setSelectedFile(e.target.files[0]);
                        } else {
                            setSelectedFile(null);
                        }
                    }}
                    className="w-full p-2 border-2 border-black text-xs font-black outline-none focus:bg-gray-50 text-black mb-4 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">KATA_SANDI_AMAN</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-3 border-2 border-black text-xs font-black uppercase outline-none focus:bg-gray-50"
                      placeholder="SANDI..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black underline tracking-widest uppercase"
                    >
                      {showPassword ? 'TUTUP' : 'LIHAT'}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-black text-white font-black uppercase tracking-widest text-xs hover:bg-gray-800 disabled:opacity-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                >
                  {submitting ? 'MEMPROSES...' : 'DAFTARKAN_PIC [+]'}
                </button>
              </form>
            </div>
            <div className="bg-red-900 border-2 border-black p-4 text-white">
                <p className="text-[8px] font-black italic uppercase tracking-widest leading-relaxed">
                    PEMBERITAHUAN: PENDAFTARAN HANYA UNTUK PERSONEL RESMI. SEMUA PIC UNIT PENDIDIKAN DIVERIFIKASI OLEH ADMINISTRASI PUSAT.
                </p>
            </div>
          </div>

          {/* TABLE */}
          <div className="lg:col-span-2 space-y-4 text-black">
            <div className="flex gap-4">
                <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 text-[10px] font-black uppercase border-2 border-black transition-all ${filterStatus === 'all' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}>SEMUA_UNIT</button>
                <button onClick={() => setFilterStatus('without-pic')} className={`px-4 py-2 text-[10px] font-black uppercase border-2 border-black transition-all ${filterStatus === 'without-pic' ? 'bg-yellow-500 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}>TANPA_PIC</button>
                <button onClick={() => setFilterStatus('with-pic')} className={`px-4 py-2 text-[10px] font-black uppercase border-2 border-black transition-all ${filterStatus === 'with-pic' ? 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}>AKTIF</button>
            </div>

            <div className="border-2 border-black bg-white p-3 flex items-center">
                <span className="text-[10px] font-black text-gray-400 mr-4 uppercase">CARI_UNIT:</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 text-sm font-black uppercase outline-none"
                    placeholder="NAMA SEKOLAH / ID..."
                />
            </div>

            <div className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
                <table className="w-full text-left">
                    <thead className="bg-black text-white border-b-2 border-black">
                        <tr className="divide-x divide-white/20">
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">NAMA_UNIT_PENDIDIKAN</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">IDENTITAS_PIC</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black">
                        {loadingSekolah ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse bg-white">
                                    <td className="p-4"><div className="h-4 w-32 bg-gray-200"></div></td>
                                    <td className="p-4"><div className="h-4 w-48 bg-gray-100"></div></td>
                                    <td className="p-4"><div className="h-6 w-20 bg-gray-200 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : filteredSekolah.length === 0 ? (
                            <tr><td colSpan={3} className="p-12 text-center text-xs font-black text-gray-400 uppercase italic">DATA_TIDAK_DITEMUKAN</td></tr>
                        ) : (
                            filteredSekolah.map((s, idx) => (
                                <tr key={s.id} className="divide-x-2 divide-black bg-white hover:bg-gray-50 group transition-colors">
                                    <td className="p-4 font-black uppercase text-xs italic tracking-tighter transition-all group-hover:pl-6">{s.nama}</td>
                                    <td className="p-4">
                                        {s.hasPIC ? (
                                            <div className="leading-tight">
                                                <p className="font-black text-xs uppercase">{s.picName}</p>
                                                <p className="text-[9px] font-bold text-gray-400 mt-0.5 lowercase tracking-normal">{s.picEmail}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] font-black text-red-500 italic uppercase">BELUM_ADA_OTORITAS</p>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={`px-3 py-1 border-2 font-black text-[9px] uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${s.hasPIC ? 'border-blue-600 text-blue-600' : 'border-red-600 text-red-600 animate-pulse'}`}>
                                            {s.hasPIC ? 'AKTIF' : 'MENUNGGU'}
                                        </span>
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
    </AdminLayout>
  );
};

export default RegisterPICSekolahPage;