'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, dayjsLocalizer, View } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { 
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import 'dayjs/locale/id';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL||'https://demombgv1.xyz';
dayjs.locale('id');
const localizer = dayjsLocalizer(dayjs);

// Skeleton
const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 w-full bg-gray-200 rounded"></div>
      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Add/Edit Modal
const ModalForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  isLoading 
}: any) => {
  const [form, setForm] = useState({
    tanggalMulai: '',
    tanggalSelesai: '',
    deskripsi: ''
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        tanggalMulai: initialData.tanggalMulai || '',
        tanggalSelesai: initialData.tanggalSelesai || '',
        deskripsi: initialData.deskripsi || ''
      });
    } else {
      setForm({ tanggalMulai: '', tanggalSelesai: '', deskripsi: '' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {initialData ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai *
            </label>
            <input
              type="date"
              value={form.tanggalMulai}
              onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Selesai *
            </label>
            <input
              type="date"
              value={form.tanggalSelesai}
              onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi *
            </label>
            <textarea
              placeholder="Cth: Hari Raya Natal, Ujian Tengah Semester"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent outline-none resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#c09d52] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Detail Modal
const ModalDetail = ({
  isOpen,
  onClose,
  data,
  onEdit,
  onDelete
}: any) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Detail Kegiatan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Deskripsi</p>
            <p className="text-lg font-bold text-gray-900">{data.deskripsi}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Periode</p>
            <p className="text-gray-900">
              {new Date(data.tanggalMulai).toLocaleDateString('id-ID', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })} - {new Date(data.tanggalSelesai).toLocaleDateString('id-ID', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                onEdit(data);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[#D0B064] border border-[#D0B064] rounded-lg hover:bg-[#D0B064] hover:text-white transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => {
                onDelete(data);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation
const ModalDelete = ({
  isOpen,
  onClose,
  data,
  onConfirm,
  isLoading
}: any) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Hapus Kegiatan</h2>
          </div>

          <p className="text-gray-600 mb-2">Apakah Anda yakin menghapus:</p>
          <p className="text-gray-900 font-semibold mb-6">{data.deskripsi}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Toolbar
const CustomToolbar = ({ label, onNavigate, onView, view, views }: any) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-2">
      <button
        onClick={() => onNavigate('PREV')}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>
      <h2 className="text-lg font-semibold text-gray-900 min-w-40 text-center">
        {label}
      </h2>
      <button
        onClick={() => onNavigate('NEXT')}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>

    <div className="flex gap-2">
      {views.map((viewName: string) => (
        <button
          key={viewName}
          onClick={() => onView(viewName)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm capitalize ${
            view === viewName
              ? 'bg-[#D0B064] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {viewName === 'month' ? 'Bulan' : viewName === 'week' ? 'Minggu' : 'Hari'}
        </button>
      ))}
    </div>
  </div>
);

const KalenderAkademik = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [sekolahId, setSekolahId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFetchingRef = useRef(false);

  // Init
  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
    // Coba berbagai key yang mungkin tersimpan
    const sekolah = localStorage.getItem("userSekolahId") 
      || localStorage.getItem("sekolahId")
      || localStorage.getItem("schoolId");

    console.log('Token:', token ? 'Found' : 'Not found');
    console.log('Sekolah ID:', sekolah);
    console.log('All localStorage keys:', Object.keys(localStorage));

    if (token) setAuthToken(token);
    if (sekolah) setSekolahId(sekolah);

    if (!token || !sekolah) {
      setError("Token atau Sekolah ID tidak ditemukan");
      setLoading(false);
    }
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!authToken || !sekolahId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching kalender data...');

      const url = `${API_BASE_URL}/api/kalender-akademik`;
      console.log('Fetch URL:', url);

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Gagal memuat data');

      const data = await res.json();
      console.log('Full response:', data);
      
      // Parse kalenders dari response
      let kalenders = [];
      if (data.data?.kalenders && Array.isArray(data.data.kalenders)) {
        kalenders = data.data.kalenders;
      } else if (data.kalenders && Array.isArray(data.kalenders)) {
        kalenders = data.kalenders;
      } else if (Array.isArray(data.data)) {
        kalenders = data.data;
      } else if (Array.isArray(data)) {
        kalenders = data;
      }

      console.log('Kalenders found:', kalenders);
      console.log('Kalenders count:', kalenders.length);

      setList(kalenders);

      // Transform to calendar events
      const calendarEvents = kalenders.map((item: any) => ({
        id: item.id,
        title: item.deskripsi,
        start: new Date(item.tanggalMulai),
        end: new Date(item.tanggalSelesai),
        resource: item,
        tanggalMulai: item.tanggalMulai,
        tanggalSelesai: item.tanggalSelesai,
        deskripsi: item.deskripsi
      }));

      console.log('Calendar events:', calendarEvents);
      setEvents(calendarEvents);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [authToken, sekolahId]);

  useEffect(() => {
    if (authToken && sekolahId) {
      fetchData();
    }
  }, [authToken, sekolahId, fetchData]);

  // Create/Update
  const handleSubmit = async (formData: any) => {
    if (!authToken) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const isEdit = !!selected;
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit
        ? `${API_BASE_URL}/api/kalender-akademik/${selected.id}`
        : `${API_BASE_URL}/api/kalender-akademik`;

      console.log('Sending body:', formData);

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const responseData = await res.json();
      console.log('Response:', responseData);

      if (!res.ok) {
        throw new Error(responseData.message || 'Gagal membuat');
      }

      setSuccess(isEdit ? 'Kegiatan berhasil diupdate' : 'Kegiatan berhasil ditambahkan');
      setShowForm(false);
      setSelected(null);

      setTimeout(() => setSuccess(null), 3000);
      
      // Reset flag dan fetch ulang
      isFetchingRef.current = false;
      setTimeout(() => {
        console.log('Fetching data after create/update...');
        fetchData();
      }, 300);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Gagal menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!authToken || !selected) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch(
        `${API_BASE_URL}/api/kalender-akademik/${selected.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!res.ok) throw new Error('Gagal menghapus');

      setSuccess('Kegiatan berhasil dihapus');
      setShowDelete(false);
      setSelected(null);

      setTimeout(() => setSuccess(null), 3000);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <SekolahLayout currentPage="kalender-akademik">
        <div className="space-y-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <SkeletonCard />
            </div>
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </SekolahLayout>
    );
  }

  return (
    <SekolahLayout currentPage="kalender-akademik">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-[#D0B064]" />
            Kalender Akademik
          </h1>
          <p className="text-gray-600">Kelola kegiatan dan libur sekolah</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="font-semibold text-red-900">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="font-semibold text-green-900">{success}</p>
          </div>
        )}

        {/* Calendar & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <style>{`
              .rbc-calendar { font-family: inherit; }
              .rbc-header { background-color: #f3f4f6; border-color: #e5e7eb; font-weight: 600; color: #374151; padding: 12px 4px; }
              .rbc-today { background-color: #fffbf0; }
              .rbc-off-range-bg { background-color: #fafafa; }
              .rbc-event { background-color: #D0B064; border: none; border-radius: 6px; }
              .rbc-event-label { font-size: 11px; }
              .rbc-event-content { font-size: 12px; font-weight: 500; }
              .rbc-selected { background-color: #c09d52; }
              .rbc-toolbar { margin-bottom: 0; }
              .rbc-toolbar button { color: #1B263A; border: 1px solid #d1d5db; background: white; border-radius: 6px; padding: 6px 12px; margin: 0 2px; font-size: 14px; }
              .rbc-toolbar button:hover:not(:disabled) { background: #f3f4f6; }
              .rbc-toolbar button.rbc-active { background: #D0B064; color: white; border-color: #D0B064; }
              .rbc-day-bg { cursor: pointer; }
              .rbc-day-bg:hover { background-color: #f9f9f9; }
            `}</style>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={(event) => {
                setSelected(event.resource || event);
                setShowDetail(true);
              }}
              onSelectSlot={(slotInfo) => {
                setSelected(null);
                setShowForm(true);
              }}
              popup
              selectable
              components={{ toolbar: CustomToolbar }}
            />
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#D0B064]" />
              Daftar Kegiatan
            </h3>

            <button
              onClick={() => {
                setSelected(null);
                setShowForm(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#D0B064] text-white rounded-lg hover:bg-[#c09d52] transition-colors font-medium mb-4"
            >
              <Plus className="w-5 h-5" />
              Tambah Kegiatan
            </button>

            {list.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Belum ada kegiatan
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {list.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelected(item);
                      setShowDetail(true);
                    }}
                    className="p-3 rounded-lg border border-gray-200 hover:border-[#D0B064] hover:bg-[#fffbf0] cursor-pointer transition-all"
                  >
                    <p className="font-semibold text-gray-900 text-sm">
                      {item.deskripsi}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.tanggalMulai).toLocaleDateString('id-ID')} - {new Date(item.tanggalSelesai).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modals */}
      <ModalForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelected(null);
        }}
        onSubmit={handleSubmit}
        initialData={selected}
        isLoading={isSubmitting}
      />

      <ModalDetail
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelected(null);
        }}
        data={selected}
        onEdit={(item: any) => {
          setSelected(item);
          setShowDetail(false);
          setShowForm(true);
        }}
        onDelete={(item: any) => {
          setSelected(item);
          setShowDetail(false);
          setShowDelete(true);
        }}
      />

      <ModalDelete
        isOpen={showDelete}
        onClose={() => {
          setShowDelete(false);
          setSelected(null);
        }}
        data={selected}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </SekolahLayout>
  );
};

export default KalenderAkademik;