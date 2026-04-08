'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

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
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
    province: '',
    fotoUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [dapur, setDapur] = useState<{ id: string; nama: string }[]>([]);
  const [selectedDapurId, setSelectedDapurId] = useState('');
  const [selectedDapurDetail, setSelectedDapurDetail] = useState<DapurItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const provinceIdMap: { [key: string]: string } = {
    'Aceh': '11', 'Sumatera Utara': '12', 'Sumatera Barat': '13', 'Riau': '14', 'Jambi': '15',
    'Sumatera Selatan': '16', 'Bengkulu': '17', 'Lampung': '18', 'Kepulauan Bangka Belitung': '19',
    'Kepulauan Riau': '21', 'DKI Jakarta': '31', 'Jawa Barat': '32', 'Jawa Tengah': '33',
    'Daerah Istimewa Yogyakarta': '34', 'Jawa Timur': '35', 'Banten': '36', 'Bali': '51',
    'Nusa Tenggara Barat': '52', 'Nusa Tenggara Timur': '53', 'Kalimantan Barat': '61',
    'Kalimantan Tengah': '62', 'Kalimantan Selatan': '63', 'Kalimantan Timur': '64',
    'Kalimantan Utara': '65', 'Sulawesi Utara': '71', 'Sulawesi Tengah': '72',
    'Sulawesi Selatan': '73', 'Sulawesi Tenggara': '74', 'Gorontalo': '75',
    'Sulawesi Barat': '76', 'Maluku': '81', 'Maluku Utara': '82', 'Papua': '91',
    'Papua Barat': '92', 'Papua Selatan': '93', 'Papua Tengah': '94',
    'Papua Pegunungan': '95', 'Papua Barat Daya': '96',
  };

  useEffect(() => {
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
        fetchDapur(token);
        fetchPICList(token);
    } catch (err) {
        router.push('/auth/login');
    }
  }, [router]);

  const fetchDapur = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dapur?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const list = data.data?.data || data.data || data || [];
        const filtered = list.filter((d: any) => !(d.pic || (d.picDapur && d.picDapur.length > 0)));
        setDapur(filtered.map((d:any) => ({ id: d.id, nama: d.nama || d.name })));
      }
    } catch (err) {}
  };

  const fetchPICList = async (token: string) => {
    try {
      setLoadingPic(true);
      const response = await fetch(`${API_BASE_URL}/api/dapur?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const list = data.data?.data || data.data || data || [];
        setPicList(list.map((d: any) => {
          const pic = d.pic || (d.picDapur && d.picDapur[0]);
          return {
            id: d.id,
            name: d.nama || d.name,
            hasPIC: !!pic,
            email: pic?.email || '-',
            phone: pic?.phone || '-',
            picData: pic ? { id: pic.id, name: pic.name, email: pic.email, phone: pic.phone } : undefined
          };
        }));
      }
    } finally {
      setLoadingPic(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDapurId || !formData.name || !formData.email || !formData.password) {
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
          role: 'PIC_DAPUR',
          dapurId: selectedDapurId,
          provinceId: provinceIdMap[formData.province] || ''
        })
      });
      if (!res.ok) throw new Error('Gagal mendaftarkan PIC');
      showToast('success', 'PIC BERHASIL DIDAFDARKAN');
      setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '', province: '', fotoUrl: '' });
      setSelectedFile(null);
      setSelectedDapurId('');
      fetchDapur(authToken);
      fetchPICList(authToken);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPics = picList.filter(p => {
    const MatchesStatus = filterStatus === 'all' ? true : filterStatus === 'with-pic' ? p.hasPIC : !p.hasPIC;
    const Search = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return MatchesStatus && Search;
  });

  return (
    <AdminLayout currentPage="register-pic">
      <div className="space-y-6">
        {toastMessage && (
          <div className={`fixed top-4 right-4 z-50 p-4 border-2 border-black font-black uppercase text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${toastMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {toastMessage.type === 'success' ? 'BERHASIL' : 'KESALAHAN'} // {toastMessage.text}
          </div>
        )}

        <div className="flex justify-between items-center border-b-4 border-black pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">REGISTRASI_PIC_DAPUR</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">SISTEM PENDAFTARAN OTORITAS UNIT</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FORM */}
          <div className="lg:col-span-1 space-y-6 text-black">
            <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 underline decoration-black underline-offset-4">FORMULIR_PENDAFTARAN</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">PILIH_UNIT_DAPUR</label>
                  <select
                    value={selectedDapurId}
                    onChange={e => setSelectedDapurId(e.target.value)}
                    className="w-full p-3 border-2 border-black text-xs font-black uppercase outline-none focus:bg-gray-50"
                  >
                    <option value="">-- PILIH UNIT --</option>
                    {dapur.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
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
                            placeholder="email@pusat.com"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black underline"
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
            <div className="bg-gray-900 border-2 border-black p-4 text-white">
                <p className="text-[8px] font-black italic uppercase tracking-widest leading-relaxed">
                    PEMBERITAHUAN: PENDAFTARAN HANYA UNTUK PERSONEL RESMI. SEMUA AKTIVITAS DICATAT DALAM DATABASE TENAGA KERJA PUSAT.
                </p>
            </div>
          </div>

          {/* TABLE */}
          <div className="lg:col-span-2 space-y-4 text-black">
            <div className="flex gap-4">
                <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 text-[10px] font-black uppercase border-2 border-black transition-all ${filterStatus === 'all' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}>SEMUA_UNIT</button>
                <button onClick={() => setFilterStatus('without-pic')} className={`px-4 py-2 text-[10px] font-black uppercase border-2 border-black transition-all ${filterStatus === 'without-pic' ? 'bg-yellow-500 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}>TANPA_PIC</button>
                <button onClick={() => setFilterStatus('with-pic')} className={`px-4 py-2 text-[10px] font-black uppercase border-2 border-black transition-all ${filterStatus === 'with-pic' ? 'bg-green-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}>AKTIF</button>
            </div>

            <div className="border-2 border-black bg-white p-3 flex items-center">
                <span className="text-[10px] font-black text-gray-400 mr-4 uppercase">CARI_DATA:</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 text-sm font-black uppercase outline-none"
                    placeholder="NAMA UNIT / EMAIL..."
                />
            </div>

            <div className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
                <table className="w-full text-left">
                    <thead className="bg-black text-white border-b-2 border-black">
                        <tr className="divide-x divide-white/20">
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">NAMA_UNIT_DAPUR</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">IDENTITAS_PIC</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black">
                        {loadingPic ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse bg-white">
                                    <td className="p-4"><div className="h-4 w-32 bg-gray-200"></div></td>
                                    <td className="p-4"><div className="h-4 w-48 bg-gray-100"></div></td>
                                    <td className="p-4"><div className="h-6 w-20 bg-gray-200 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : filteredPics.length === 0 ? (
                            <tr><td colSpan={3} className="p-12 text-center text-xs font-black text-gray-400 uppercase italic">DATA_KOSONG</td></tr>
                        ) : (
                            filteredPics.map((p, idx) => (
                                <tr key={p.id} className="divide-x-2 divide-black bg-white hover:bg-gray-50 group cursor-pointer" onClick={() => { setSelectedDapurDetail(p); setShowDetailModal(true); }}>
                                    <td className="p-4 font-black uppercase text-xs italic tracking-tighter">{p.name}</td>
                                    <td className="p-4">
                                        {p.hasPIC ? (
                                            <div className="leading-tight">
                                                <p className="font-black text-xs uppercase">{p.picData?.name}</p>
                                                <p className="text-[9px] font-bold text-gray-400 mt-0.5 lowercase tracking-normal">{p.email}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] font-black text-red-500 italic">OTORITAS_KOSONG</p>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={`px-3 py-1 border-2 font-black text-[9px] uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${p.hasPIC ? 'border-green-600 text-green-600' : 'border-yellow-600 text-yellow-600 animate-pulse'}`}>
                                            {p.hasPIC ? 'AKTIF' : 'MENUNGGU'}
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

        {/* DETAIL MODAL */}
        {showDetailModal && selectedDapurDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md text-black">
                <div className="bg-white border-8 border-black max-w-sm w-full p-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">INFO_UNIT</p>
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{selectedDapurDetail.name}</h3>
                        </div>
                        <button onClick={() => setShowDetailModal(false)} className="text-xs font-black border-2 border-black px-2 py-1 hover:bg-black hover:text-white transition-all uppercase">TUTUP [X]</button>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PIC_DITETAPKAN</p>
                            {selectedDapurDetail.hasPIC ? (
                                <div className="p-4 border-4 border-black bg-gray-50 flex flex-col gap-2">
                                    <p className="font-black text-xl uppercase italic tracking-tight">{selectedDapurDetail.picData?.name}</p>
                                    <div className="text-[11px] font-black text-gray-600 space-y-1 mt-2">
                                        <p className="lowercase tracking-normal">E: {selectedDapurDetail.email}</p>
                                        <p>P: {selectedDapurDetail.phone}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 border-4 border-dashed border-red-500 text-center">
                                    <p className="text-sm font-black text-red-500 uppercase italic">BELUM_ADA_PIC</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t-2 border-black">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">AKSI_SISTEM</p>
                            <button
                                onClick={() => { setShowDetailModal(false); if(!selectedDapurDetail.hasPIC) setSelectedDapurId(selectedDapurDetail.id); }}
                                className="w-full py-4 bg-black text-white font-black uppercase tracking-widest text-xs hover:underline decoration-white decoration-2"
                            >
                                {selectedDapurDetail.hasPIC ? 'UBAH_PENETAPAN' : 'MULAI_REGISTRASI'}
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

export default RegisterPICPage;