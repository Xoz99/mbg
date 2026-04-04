'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dayjsLocalizer, View } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { useKalenderAkademikCache } from '@/lib/hooks/useKalenderAkademikCache';
import { 
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import 'dayjs/locale/id';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
dayjs.locale('id');
const localizer = dayjsLocalizer(dayjs);

// Skeleton
const SkeletonCard = () => (
  <div className="border border-gray-100 rounded-xl p-5 animate-pulse">
    <div className="h-4 w-28 bg-gray-200 rounded mb-3" />
    <div className="space-y-2">
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-3/4 bg-gray-100 rounded" />
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
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {initialData ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {form.tanggalMulai && (
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-1">📅 Rentang tanggal dipilih</p>
              <p className="text-sm text-gray-900">
                {new Date(form.tanggalMulai).toLocaleDateString('id-ID')} - {new Date(form.tanggalSelesai).toLocaleDateString('id-ID')}
              </p>
            </div>
          )}

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
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100">
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
                if (window.confirm(`Apakah Anda yakin menghapus "${data.deskripsi}"?`)) {
                  onDelete(data);
                }
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

// Custom Toolbar
const CustomToolbar = ({ label, onNavigate, onView, view, views }: any) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-1">
      <button
        onClick={() => onNavigate('PREV')}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>
      <h2 className="text-sm font-bold text-gray-900 min-w-36 text-center">
        {label}
      </h2>
      <button
        onClick={() => onNavigate('NEXT')}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>
    </div>

    <div className="flex gap-1">
      {views.map((viewName: string) => (
        <button
          key={viewName}
          onClick={() => onView(viewName)}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-xs capitalize ${
            view === viewName
              ? 'bg-[#1B263A] text-white'
              : 'text-gray-600 hover:bg-gray-100'
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
  const [success, setSuccess] = useState<string | null>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Callback ketika unified cache ter-update dari page lain (instant sync!)
  const handleCacheUpdate = useCallback((cachedData: any) => {
    const kalenders = cachedData.kalenderList || []
    setList(kalenders)

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
    }))
    setEvents(calendarEvents)
  }, [])

  const { loading, error, loadData, updateCache } = useKalenderAkademikCache(handleCacheUpdate)

  // Init
  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token");
    const sekolah = localStorage.getItem("userSekolahId")
      || localStorage.getItem("sekolahId")
      || localStorage.getItem("schoolId");

    console.log('Token:', token ? 'Found' : 'Not found');
    console.log('Sekolah ID:', sekolah);

    if (token) setAuthToken(token);
    if (sekolah) setSekolahId(sekolah);
  }, []);

  // Load data when credentials ready
  useEffect(() => {
    if (authToken && sekolahId) {
      loadData(sekolahId, authToken).then((cachedData) => {
        if (cachedData) {
          const kalenders = cachedData.kalenderList || []
          setList(kalenders)

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
          }))
          setEvents(calendarEvents)
        }
      })
    }
  }, [authToken, sekolahId, loadData]);

  // Create/Update
  const handleSubmit = async (formData: any) => {
    if (!authToken || !sekolahId) return;

    try {
      setIsSubmitting(true);

      const isEdit = !!selected && !!selected.id;
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

      // ✅ Optimistic update: Add/update ke list
      let updatedList: any[]
      if (isEdit) {
        updatedList = list.map(item => item.id === selected.id ? { ...item, ...formData } : item)
      } else {
        updatedList = [...list, responseData.data || { ...formData, id: responseData.id }]
      }

      setList(updatedList)
      // Transform to calendar events
      const calendarEvents = updatedList.map((item: any) => ({
        id: item.id,
        title: item.deskripsi,
        start: new Date(item.tanggalMulai),
        end: new Date(item.tanggalSelesai),
        resource: item,
        tanggalMulai: item.tanggalMulai,
        tanggalSelesai: item.tanggalSelesai,
        deskripsi: item.deskripsi
      }))
      setEvents(calendarEvents)

      setSuccess(isEdit ? 'Kegiatan berhasil diupdate' : 'Kegiatan berhasil ditambahkan');
      setShowForm(false);
      setSelected(null);

      setTimeout(() => setSuccess(null), 3000);

      // 🔄 Update cache dengan callback untuk sync data dari API
      updateCache(sekolahId, authToken, {
        kalenderList: updatedList
      }, (freshData) => {
        // Update state dengan data fresh dari API
        const freshKalenders = freshData.kalenderList || []
        setList(freshKalenders)
        const freshEvents = freshKalenders.map((item: any) => ({
          id: item.id,
          title: item.deskripsi,
          start: new Date(item.tanggalMulai),
          end: new Date(item.tanggalSelesai),
          resource: item,
          tanggalMulai: item.tanggalMulai,
          tanggalSelesai: item.tanggalSelesai,
          deskripsi: item.deskripsi
        }))
        setEvents(freshEvents)
        console.log("✅ [KALENDER] State synced with fresh API data + auto-synced to dashboard!")
      })
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!authToken || !sekolahId || !selected) return;

    try {
      setIsSubmitting(true);

      console.log('Deleting item with ID:', selected.id);
      console.log('Delete URL:', `${API_BASE_URL}/api/kalender-akademik/${selected.id}`);

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

      console.log('Delete response status:', res.status);

      // Check response
      const contentType = res.headers.get("content-type");
      let responseData;

      if (contentType && contentType.includes("application/json")) {
        responseData = await res.json();
        console.log('Delete response data:', responseData);
      } else {
        responseData = await res.text();
        console.log('Delete response text:', responseData);
      }

      // Accept 200, 204, or any 2xx status as success
      if (res.ok || res.status === 204) {
        // ✅ Optimistic update: Remove dari list
        const updatedList = list.filter(item => item.id !== selected.id)
        setList(updatedList)

        // Transform to calendar events
        const calendarEvents = updatedList.map((item: any) => ({
          id: item.id,
          title: item.deskripsi,
          start: new Date(item.tanggalMulai),
          end: new Date(item.tanggalSelesai),
          resource: item,
          tanggalMulai: item.tanggalMulai,
          tanggalSelesai: item.tanggalSelesai,
          deskripsi: item.deskripsi
        }))
        setEvents(calendarEvents)

        setSuccess('Kegiatan berhasil dihapus');
        setShowDetail(false);
        setSelected(null);

        setTimeout(() => setSuccess(null), 3000);

        // 🔄 Update cache dengan callback untuk sync data dari API
        updateCache(sekolahId, authToken, {
          kalenderList: updatedList
        }, (freshData) => {
          // Update state dengan data fresh dari API
          const freshKalenders = freshData.kalenderList || []
          setList(freshKalenders)
          const freshEvents = freshKalenders.map((item: any) => ({
            id: item.id,
            title: item.deskripsi,
            start: new Date(item.tanggalMulai),
            end: new Date(item.tanggalSelesai),
            resource: item,
            tanggalMulai: item.tanggalMulai,
            tanggalSelesai: item.tanggalSelesai,
            deskripsi: item.deskripsi
          }))
          setEvents(freshEvents)
          console.log("✅ [KALENDER] State synced with fresh API data + auto-synced to dashboard!")
        })
      } else {
        throw new Error(responseData.message || responseData || 'Gagal menghapus kegiatan');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <SekolahLayout currentPage="kalender-akademik">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-64 bg-gray-100 rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <div className="border border-gray-100 rounded-xl p-5 animate-pulse">
                <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
                <div className="w-full h-72 bg-gray-100 rounded-lg" />
              </div>
            </div>
            <div className="space-y-3">
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
          <h1 className="text-2xl font-bold text-gray-900">Kalender Akademik</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola kegiatan dan libur sekolah</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-gray-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 border border-emerald-200 rounded-xl">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-gray-700">{success}</p>
          </div>
        )}

        {/* Calendar & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Calendar */}
          <div className="lg:col-span-3 border border-gray-100 rounded-xl p-5 bg-white">
            <style>{`
              .rbc-calendar { font-family: inherit; }
              .rbc-header { background-color: transparent; border-color: #e5e7eb; font-weight: 600; color: #6b7280; padding: 8px 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
              .rbc-today { background-color: #fafafa; }
              .rbc-off-range-bg { background-color: #fafafa; }
              .rbc-event { background-color: #1B263A; border: none; border-radius: 4px; font-size: 11px; }
              .rbc-event-label { font-size: 10px; }
              .rbc-event-content { font-size: 11px; font-weight: 500; }
              .rbc-selected { background-color: #D0B064; }
              .rbc-toolbar { margin-bottom: 0; }
              .rbc-toolbar button { color: #1B263A; border: 1px solid #e5e7eb; background: white; border-radius: 6px; padding: 4px 10px; margin: 0 1px; font-size: 12px; }
              .rbc-toolbar button:hover:not(:disabled) { background: #f9fafb; }
              .rbc-toolbar button.rbc-active { background: #1B263A; color: white; border-color: #1B263A; }
              .rbc-day-bg { cursor: pointer; }
              .rbc-day-bg:hover { background-color: #f9fafb; }
              .rbc-month-view { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
              .rbc-date-cell { font-size: 12px; padding: 4px 8px; }
            `}</style>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 520 }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={(event: any) => {
                setSelected(event.resource || event);
                setShowDetail(true);
              }}
              onSelectSlot={(slotInfo: any) => {
                setSelected({
                  tanggalMulai: slotInfo.start.toISOString().split('T')[0],
                  tanggalSelesai: slotInfo.end.toISOString().split('T')[0],
                  deskripsi: ''
                });
                setShowForm(true);
              }}
              popup
              selectable
              components={{ toolbar: CustomToolbar }}
            />
          </div>

          {/* Sidebar */}
          <div className="border border-gray-100 rounded-xl p-5 bg-white h-fit">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Daftar Kegiatan</h3>

            <button
              onClick={() => {
                setSelected(null);
                setShowForm(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1B263A] text-white text-sm rounded-lg hover:bg-[#2A3749] transition-colors font-medium mb-4"
            >
              <Plus className="w-4 h-4" />
              Tambah Kegiatan
            </button>

            {list.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                Belum ada kegiatan
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {list.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelected(item);
                      setShowDetail(true);
                    }}
                    className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm">
                      {item.deskripsi}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
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
          handleDelete();
        }}
      />

    </SekolahLayout>
  );
};

export default KalenderAkademik;