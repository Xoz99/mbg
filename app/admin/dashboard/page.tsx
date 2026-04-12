'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { apiCache, generateCacheKey } from '@/lib/utils/cache';
import { Download, Loader2, FileText, CheckCircle, AlertTriangle, Info, XCircle, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
// No icons used, staying minimalist with text and borders

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface DashboardStats {
  totalDapur: number;
  totalSekolah: number;
  totalDriver: number;
  totalKaryawan: number;
  dapurDenganPIC: number;
  dapurTanpaPIC: number;
}

interface Ticket {
  id: string;
  judul: string;
  deskripsi: string;
  createdAt: string;
  userId: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const AdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalDapur: 0,
    totalSekolah: 0,
    totalDriver: 0,
    totalKaryawan: 0,
    dapurDenganPIC: 0,
    dapurTanpaPIC: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    dapurId: 'all',
    selectedDapurIds: ['all'] as string[]
  });
  const [kitchenListList, setKitchenListList] = useState<any[]>([]);
  const [loadingKitchens, setLoadingKitchens] = useState(false);
  const [kitchenSearchTerm, setKitchenSearchTerm] = useState("");
  const isInitialLoad = useRef(true);
  const lastLoadTimeRef = useRef<number>(0); // ✅ Track last load time untuk smart refresh

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
          router.push('/admin/dapur');
          return;
        }

        setAuthToken(token);
      } catch (err) {
        router.push('/auth/login');
      }
    }
  }, [router]);

  // Fetch stats dengan smart caching
  const fetchStats = useCallback(async () => {
    if (!authToken) return;

    try {
      // ✅ Smart refresh: skip background refresh jika data sudah di-load < 25 detik lalu
      const now = Date.now();
      if (!isInitialLoad.current && (now - lastLoadTimeRef.current) < 25000) {
        console.log("[ADMIN DASHBOARD] Skipping refresh - data masih fresh");
        return;
      }
      lastLoadTimeRef.current = now;

      // Show loading hanya pada initial load
      if (isInitialLoad.current) {
        setLoading(true);
        isInitialLoad.current = false;
      }
      setError(null);

      // Parallel fetch dapur dan sekolah dengan smart cache
      const [dapurResult, sekolahResult] = await Promise.all([
        apiCache.smartFetch(
          generateCacheKey(`${API_BASE_URL}/api/dapur`, { page: 1, limit: 1000 }),
          () => fetch(`${API_BASE_URL}/api/dapur?page=1&limit=1000`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch dapur (${res.status})`);
            return res.json();
          }),
          10 * 60 * 1000 // ✅ Increase to 10 minute cache untuk performa lebih baik
        ),
        apiCache.smartFetch(
          generateCacheKey(`${API_BASE_URL}/api/sekolah`, { page: 1, limit: 1000 }),
          () => fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=1000`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch sekolah (${res.status})`);
            return res.json();
          }),
          10 * 60 * 1000 // ✅ Increase to 10 minute cache untuk performa lebih baik
        ),
      ]);

      // Process dapur data
      const dapurData = dapurResult.data;
      let dapurList = [];

      if (dapurData.data?.data && Array.isArray(dapurData.data.data)) {
        dapurList = dapurData.data.data;
      } else if (dapurData.data && Array.isArray(dapurData.data)) {
        dapurList = dapurData.data;
      }

      const dapurDenganPIC = dapurList.filter((d: any) => d.picDapur && d.picDapur.length > 0).length;
      const dapurTanpaPIC = dapurList.length - dapurDenganPIC;
      const totalKaryawan = dapurList.reduce((sum: number, d: any) => sum + (d._count?.karyawan || 0), 0);
      const totalDriver = dapurList.reduce((sum: number, d: any) => sum + (d.drivers?.length || 0), 0);

      // Process sekolah data
      const sekolahData = sekolahResult.data;
      let sekolahList = [];

      if (sekolahData.data?.data && Array.isArray(sekolahData.data.data)) {
        sekolahList = sekolahData.data.data;
      } else if (sekolahData.data && Array.isArray(sekolahData.data)) {
        sekolahList = sekolahData.data;
      }

      // 🚀 Fix: Always update stats if local state is empty OR data actually changed
      // This solves the bug where navigating back shows "0" because cache isn't "isNew"
      const isDataEmpty = stats.totalDapur === 0 && stats.totalSekolah === 0;

      if (dapurResult.isNew || sekolahResult.isNew || isDataEmpty) {
        setStats({
          totalDapur: dapurList.length,
          totalSekolah: sekolahList.length,
          totalDriver,
          totalKaryawan,
          dapurDenganPIC,
          dapurTanpaPIC,
        });
      }

      // Fetch recent tickets (optional - doesn't need caching)
      try {
        const ticketsRes = await fetch(`${API_BASE_URL}/api/tickets?page=1&limit=5`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          if (ticketsData.success && ticketsData.data?.tickets) {
            setRecentTickets(ticketsData.data.tickets);
          }
        }
      } catch (ticketErr) {
        console.error("Error fetching recent tickets:", ticketErr);
        // Don't throw - tickets are optional
      }
    } catch (err: any) {
      console.error("Error fetching stats:", err);
      setError(err.message || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) {
      fetchStats();

      // ✅ Setup polling untuk real-time update setiap 30 detik (dari 10s)
      // Smart refresh logic akan skip jika data masih fresh
      const pollingInterval = setInterval(() => {
        fetchStats();
      }, 30000);

      return () => clearInterval(pollingInterval);
    }
  }, [authToken, fetchStats]);

  // Load kitchens for filter
  useEffect(() => {
    if (authToken && showReportModal) {
      const loadKitchens = async () => {
        setLoadingKitchens(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/dapur?page=1&limit=100`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          const data = await res.json();
          setKitchenListList(Array.isArray(data.data?.data) ? data.data.data : (Array.isArray(data.data) ? data.data : []));
        } finally {
          setLoadingKitchens(false);
        }
      };
      loadKitchens();
    }
  }, [authToken, showReportModal]);

  // Auto-scroll tickets carousel
  useEffect(() => {
    if (recentTickets.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTicketIndex((prev) => (prev + 1) % recentTickets.length);
    }, 5000); // Auto-next every 5 seconds

    return () => clearInterval(interval);
  }, [recentTickets.length]);

  // ✅ Skeleton loading state - tampil langsung saat awal masuk halaman
  const SkeletonContent = (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse-fast"></div>
        <div className="h-4 bg-gray-200 rounded w-96 animate-pulse-fast"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse-fast"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse-fast"></div>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse-fast"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activities Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse-fast"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse-fast"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2 animate-pulse-fast"></div>
                  <div className="h-3 bg-gray-100 rounded w-64 mb-2 animate-pulse-fast"></div>
                  <div className="h-3 bg-gray-100 rounded w-24 animate-pulse-fast"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ✅ Always show skeleton on initial load, data fetches in background
  if (loading) {
    return (
      <AdminLayout currentPage="dashboard">
        {SkeletonContent}
      </AdminLayout>
    );
  }

  const handleDownloadReport = async () => {
    if (!authToken || isGeneratingReport) return;

    try {
      setIsGeneratingReport(true);
      setReportProgress(0);

      const { startDate, endDate, dapurId } = reportFilters;
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      const diffDays = end.diff(start, 'day');

      if (diffDays < 0) throw new Error("Tanggal mulai tidak boleh melebihi tanggal selesai");
      if (diffDays > 31) throw new Error("Maksimal laporan adalah 31 hari");

      // 1. Filter kitchens based on selection
      let kitchensToProcess = [];
      const { selectedDapurIds } = reportFilters;

      if (selectedDapurIds.includes('all')) {
        const dapurRes = await fetch(`${API_BASE_URL}/api/dapur?page=1&limit=100`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const dapurData = await dapurRes.json();
        kitchensToProcess = Array.isArray(dapurData.data?.data) ? dapurData.data.data : (Array.isArray(dapurData.data) ? dapurData.data : []);
      } else {
        kitchensToProcess = kitchenListList.filter(k => selectedDapurIds.includes(k.id));
        // If selection is large or not in list, fallback could happen but here we rely on the list
        if (kitchensToProcess.length === 0 && selectedDapurIds.length > 0) {
          // fetch missing ones if necessary (rare)
          const missingPromises = selectedDapurIds.map(id =>
            fetch(`${API_BASE_URL}/api/dapur/${id}`, { headers: { Authorization: `Bearer ${authToken}` } }).then(r => r.json())
          );
          const results = await Promise.all(missingPromises);
          kitchensToProcess = results.map(r => r.data || r);
        }
      }

      if (kitchensToProcess.length === 0) throw new Error("Dapur tidak ditemukan");
      setReportProgress(5);

      const kitchenIds = kitchensToProcess.map((k: any) => k.id);

      // 1. Fetch School Stats and ALL relevant plannings first
      const statsRes = await fetch(`${API_BASE_URL}/api/admin/sekolah/summary-stats`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const statsData = await statsRes.json();
      const schoolStats = Array.isArray(statsData.data) ? statsData.data : [];
      const schoolStatsMap = new Map();
      schoolStats.forEach((s: any) => schoolStatsMap.get(s.id) ? null : schoolStatsMap.set(s.id, s));

      const planningsRes = await fetch(`${API_BASE_URL}/api/menu-planning?limit=500&page=1`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const planningsData = await planningsRes.json();
      const allPlannings = Array.isArray(planningsData.data?.data) ? planningsData.data.data : (Array.isArray(planningsData.data) ? planningsData.data : []);
      const relevantPlannings = allPlannings.filter((p: any) => kitchenIds.includes(p.dapurId) || kitchenIds.includes(p.dapur?.id));

      setReportProgress(15);

      const reportRows: any[] = [];
      const masterStudentRows: any[] = [];
      const nutritionalSummary: any[] = [];
      const processedMenuIds = new Set<string>();
      const schoolsProcessedForAnnex = new Set<string>();
      const schoolTotalSiswaMap = new Map<string, number>();
      const schoolSiswaIdsMap = new Map<string, Set<string>>();
      const schoolAbsensiCache = new Map<string, Map<string, number>>(); // schoolId -> Map(dateKey -> totalHadir)
      const daySchoolDataCache = new Map<string, any>();

      // Manual date start to avoid TZ shift
      const startParts = startDate.split('-').map(Number);
      let currIterDate = dayjs(new Date(startParts[0], startParts[1] - 1, startParts[2]));

      // 3. Loop through dates
      for (let i = 0; i <= diffDays; i++) {
        const dateKey = currIterDate.format('YYYY-MM-DD');
        const displayDate = currIterDate.locale('id').format('dddd, D MMMM YYYY');
        const schoolDayCache = new Map<string, any>();

        // 3.0 Fetch ALL pengambilan-makanan for this date (fallback for presensi)
        let datePickupSiswaIds = new Set<string>();
        try {
          const pickupsRes = await fetch(`${API_BASE_URL}/api/pengambilan-makanan?tanggal=${dateKey}&limit=2000`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (pickupsRes.ok) {
            const pickupsData = await pickupsRes.json();
            const pickupsList = Array.isArray(pickupsData.data?.data) ? pickupsData.data.data : (Array.isArray(pickupsData.data) ? pickupsData.data : []);
            pickupsList.forEach((p: any) => { if (p.siswaId) datePickupSiswaIds.add(p.siswaId); });
          }
        } catch (e) { }

        const dayMenusPromises = relevantPlannings.map(async (p: any) => {
          try {
            const hRes = await fetch(`${API_BASE_URL}/api/menu-planning/${p.id}/menu-harian?limit=50&page=1&tanggal=${dateKey}`, {
              headers: { Authorization: `Bearer ${authToken}` }
            });
            const hData = await hRes.json();
            const menus = Array.isArray(hData.data?.data) ? hData.data.data : (Array.isArray(hData.data) ? hData.data : (Array.isArray(hData) ? hData : []));

            return await Promise.all(menus.map(async (m: any) => {
              // Verify menu actually belongs to this iteration date (backend date filter can be unreliable)
              // Apply WIB timezone conversion since backend stores UTC
              const normalizeMenuDate = (ds: string): string => {
                if (!ds) return '';
                if (ds.includes('T')) {
                  const ud = new Date(ds);
                  if (isNaN(ud.getTime())) return ds.split('T')[0];
                  const ld = new Date(ud.getTime() + 7 * 60 * 60 * 1000);
                  return `${ld.getUTCFullYear()}-${String(ld.getUTCMonth() + 1).padStart(2, '0')}-${String(ld.getUTCDate()).padStart(2, '0')}`;
                }
                return ds;
              };
              const menuDateRaw = m.tanggal || m.tanggalMenu || m.date || m.tanggalPelaksanaan || '';
              const menuDate = normalizeMenuDate(String(menuDateRaw));
              if (menuDate && menuDate !== dateKey) return null;

              // Dedup by menu+date (same menu could legitimately appear across dates in different iterations)
              const dedupKey = `${m.id}_${dateKey}`;
              if (processedMenuIds.has(dedupKey)) return null;
              processedMenuIds.add(dedupKey);

              const schoolId = m.sekolahId || p.sekolahId || m.sekolah?.id || p.sekolah?.id;
              const scuolaStats = schoolStatsMap.get(schoolId);
              const sekolahName = m.sekolah?.nama || m.sekolah?.name || p.sekolah?.nama || p.sekolah?.name || scuolaStats?.nama || scuolaStats?.name || "-";

              // Centralized Data Fetch (Delivery only) — fetch wider window + try multiple date fields
              if (schoolId && !schoolDayCache.has(schoolId)) {
                let dayData = { pgMatch: null as any };
                try {
                  const pgRes = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/pengiriman?limit=100&page=1`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                  });
                  if (pgRes.ok) {
                    const pgResData = await pgRes.json();
                    const pgList = Array.isArray(pgResData.data?.data) ? pgResData.data.data : (Array.isArray(pgResData.data) ? pgResData.data : []);
                    const normalizeToWIB = (dateString: string): string => {
                      if (!dateString) return '';
                      if (dateString.includes('T')) {
                        const utcDate = new Date(dateString);
                        if (isNaN(utcDate.getTime())) return dateString.split('T')[0];
                        const localDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
                        const y = localDate.getUTCFullYear();
                        const mo = String(localDate.getUTCMonth() + 1).padStart(2, '0');
                        const d = String(localDate.getUTCDate()).padStart(2, '0');
                        return `${y}-${mo}-${d}`;
                      }
                      return dateString;
                    };
                    dayData.pgMatch = pgList.find((p: any) => {
                      const candidates = [p.waktuBuatQR, p.tanggal, p.tanggalKirim, p.waktuScanDriver, p.waktuSampai, p.createdAt];
                      return candidates.some(c => c && normalizeToWIB(String(c)) === dateKey);
                    });
                  }
                  schoolDayCache.set(schoolId, dayData);
                } catch (e) { }
              }

              const currentDayData = schoolDayCache.get(schoolId) || { pgMatch: null };

              // 3a. Checkpoints
              let checkpoints: any[] = [];
              try {
                const cpRes = await fetch(`${API_BASE_URL}/api/menu-harian/${m.id}/checkpoint`, {
                  headers: { Authorization: `Bearer ${authToken}` }
                });
                if (cpRes.ok) {
                  const cpData = await cpRes.json();
                  checkpoints = Array.isArray(cpData.data) ? cpData.data : [];
                }
              } catch (e) { }

              // 3b. Fetch absensi per-kelas for this school (cached, one-time per school)
              // Uses same pattern as /dapur/menu: fetch kelas list, then /api/kelas/{id}/absensi for each
              if (schoolId && !schoolAbsensiCache.has(schoolId)) {
                const dateToHadirMap = new Map<string, number>();
                try {
                  const kelasRes = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/kelas?page=1&limit=100`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                  });
                  if (kelasRes.ok) {
                    const kelasData = await kelasRes.json();
                    const kelasList = Array.isArray(kelasData.data?.data) ? kelasData.data.data : (Array.isArray(kelasData.data) ? kelasData.data : []);

                    const absensiPerKelas = await Promise.all(kelasList.map(async (k: any) => {
                      try {
                        const kAbsRes = await fetch(`${API_BASE_URL}/api/kelas/${k.id}/absensi?limit=500&page=1`, {
                          headers: { Authorization: `Bearer ${authToken}` }
                        });
                        if (kAbsRes.ok) {
                          const kAbsData = await kAbsRes.json();
                          return Array.isArray(kAbsData.data?.data) ? kAbsData.data.data : (Array.isArray(kAbsData.data) ? kAbsData.data : (Array.isArray(kAbsData) ? kAbsData : []));
                        }
                      } catch (e) { }
                      return [];
                    }));

                    // Aggregate jumlahHadir per date across all kelas
                    // ⚠️ Timezone: backend stores dates as UTC, but real date is WIB (UTC+7)
                    // e.g. "2026-04-09T17:00:00Z" is actually April 10 in WIB
                    const normalizeToWIB = (dateString: string): string => {
                      if (!dateString) return '';
                      if (dateString.includes('T')) {
                        const utcDate = new Date(dateString);
                        if (isNaN(utcDate.getTime())) return dateString.split('T')[0];
                        const localDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
                        const y = localDate.getUTCFullYear();
                        const mo = String(localDate.getUTCMonth() + 1).padStart(2, '0');
                        const d = String(localDate.getUTCDate()).padStart(2, '0');
                        return `${y}-${mo}-${d}`;
                      }
                      return dateString;
                    };

                    absensiPerKelas.flat().forEach((rec: any) => {
                      const rawDate = rec.tanggal || rec.date || rec.createdAt || '';
                      const recDate = normalizeToWIB(String(rawDate));
                      if (!recDate) return;
                      const hadir = Number(rec.jumlahHadir) || Number(rec.hadir) || 0;
                      dateToHadirMap.set(recDate, (dateToHadirMap.get(recDate) || 0) + hadir);
                    });
                  }
                } catch (e) { }
                schoolAbsensiCache.set(schoolId, dateToHadirMap);
              }

              // 3c. Fetch ALL Students for this school (Master Data)
              if (schoolId && !schoolsProcessedForAnnex.has(schoolId)) {
                try {
                  const sRes = await fetch(`${API_BASE_URL}/api/sekolah/${schoolId}/siswa?limit=2000&page=1`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                  });
                  if (sRes.ok) {
                    const sData = await sRes.json();
                    const sListOriginal = Array.isArray(sData.data?.data) ? sData.data.data : (Array.isArray(sData.data) ? sData.data : []);
                    const totalSiswaCount = sListOriginal.length;
                    schoolTotalSiswaMap.set(schoolId, totalSiswaCount);

                    // Build siswa ID set for presensi fallback
                    const siswaIds = new Set<string>();
                    sListOriginal.forEach((s: any) => { if (s.id) siswaIds.add(s.id); });
                    schoolSiswaIdsMap.set(schoolId, siswaIds);

                    // Sort by Kelas then Name
                    const sList = [...sListOriginal].sort((a, b) => {
                      const kA = a.kelas?.nama || "";
                      const kB = b.kelas?.nama || "";
                      if (kA !== kB) return kA.localeCompare(kB);
                      return (a.nama || "").localeCompare(b.nama || "");
                    });

                    let stats = { normal: 0, kurang: 0, buruk: 0, obesitas: 0 };

                    sList.forEach((s: any) => {
                      const status = (s.statusGizi || "").toLowerCase();
                      if (status.includes("normal")) stats.normal++;
                      else if (status.includes("buruk")) stats.buruk++;
                      else if (status.includes("kurang")) stats.kurang++;
                      else if (status.includes("obesitas") || status.includes("lebih")) stats.obesitas++;

                      masterStudentRows.push([
                        masterStudentRows.length + 1,
                        sekolahName,
                        s.kelas?.nama || "-",
                        s.nama || "-",
                        s.nis || "-",
                        s.beratBadan ? `${s.beratBadan} kg` : "-",
                        s.tinggiBadan ? `${s.tinggiBadan} cm` : "-",
                        s.statusGizi || "-"
                      ]);
                    });

                    nutritionalSummary.push([
                      nutritionalSummary.length + 1,
                      sekolahName,
                      stats.normal,
                      stats.kurang,
                      stats.buruk,
                      stats.obesitas,
                      totalSiswaCount
                    ]);
                    schoolsProcessedForAnnex.add(schoolId);
                  }
                } catch (e) { }
              }

              // 3d. Count presensi - Strategy 1: from per-kelas /absensi aggregation
              let presensi = 0;
              const schoolDateHadirMap = schoolAbsensiCache.get(schoolId);
              if (schoolDateHadirMap) {
                presensi = schoolDateHadirMap.get(dateKey) || 0;
              }

              // Strategy 2 fallback: cross-reference pengambilan-makanan with siswa list
              if (presensi === 0) {
                const schoolSiswaIds = schoolSiswaIdsMap.get(schoolId);
                if (schoolSiswaIds && datePickupSiswaIds.size > 0) {
                  schoolSiswaIds.forEach(siswaId => {
                    if (datePickupSiswaIds.has(siswaId)) presensi++;
                  });
                }
              }

              const totalSiswa = schoolTotalSiswaMap.get(schoolId) || scuolaStats?.totalSiswa || scuolaStats?.jumlahSiswa || 0;
              return { ...m, ...currentDayData, presensi, totalSiswa, sekolahName, checkpoints };
            }));
          } catch (e) { return []; }
        });

        const dayMenusRaw = (await Promise.all(dayMenusPromises)).flat();
        const dayMenus = dayMenusRaw.filter(m => m !== null);

        dayMenus.forEach((m: any) => {
          const cpX = (types: string[]) => {
            const found = (m.checkpoints || []).find((c: any) =>
              types.some(t => (c.tipe || "").toUpperCase() === t.toUpperCase())
            );
            if (!found) return "-";
            return new Date(found.timestamp || found.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
          };

          const formatTime = (ts: any) => {
            if (!ts) return "-";
            return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
          };

          reportRows.push([
            reportRows.length + 1, displayDate, m.sekolahName || "-", m.namaMenu || "Menu MBG",
            cpX(["MULAI_MEMASAK"]), cpX(["SELESAI_MEMASAK"]), cpX(["SELESAI_PACKING"]),
            m.pgMatch ? formatTime(m.pgMatch.waktuScanDriver) : "-",
            m.pgMatch ? formatTime(m.pgMatch.waktuSampai) : "-",
            cpX(["SCHOOL_TO_DRIVER_RETURN"]), cpX(["DRIVER_TO_KITCHEN"]), cpX(["WASHING_COMPLETE"]),
            m.targetTray || 0, 0, m.totalSiswa || "-", m.presensi || 0
          ]);
        });

        currIterDate = currIterDate.add(1, 'day');
        setReportProgress(Math.round(15 + ((i + 1) / (diffDays + 1)) * 80));
      }

      setReportProgress(100);

      if (reportRows.length === 0) throw new Error("Tidak ada data operasional untuk filter ini");

      const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });

      // PAGE 1: OPERATIONAL SUMMARY
      doc.setFillColor(27, 38, 58);
      doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont("helvetica", "bold");
      doc.text("LAPORAN HARIAN PENELITIAN (WAKTU OPERASIONAL DAN INFORMASI TRAY)", doc.internal.pageSize.width / 2, 18, { align: 'center' });
      doc.setFontSize(14); doc.text("SMART MONITORING MBG", doc.internal.pageSize.width / 2, 28, { align: 'center' });

      autoTable(doc, {
        head: [[
          'No.', 'Hari dan Tanggal', 'Sekolah', 'Menu', 'Jam mulai masak', 'Jam selesai masak',
          'Jam selesai kemas', 'Jam diantar', 'Jam sampai sekolah', 'Jam ambil ompreng', 'Jam sampai SPPG',
          'Jam selesai pencucian', 'Jml Tray', 'Tray Basi', 'Total Siswa', 'Jml Presensi'
        ]],
        body: reportRows, startY: 40, theme: 'grid',
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 7, halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0, 0, 0] },
        bodyStyles: { fontSize: 7, halign: 'center', textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0] },
        margin: { top: 40 }, styles: { font: "helvetica", cellPadding: 2 }
      });

      // PAGE 2 (ANNEX): STUDENT NUTRITION SUMMARY
      if (nutritionalSummary.length > 0) {
        doc.addPage('a3', 'landscape');
        doc.setFillColor(27, 38, 58);
        doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18); doc.setFont("helvetica", "bold");
        doc.text("LAMPIRAN: ANALISIS STATUS GIZI SISWA", doc.internal.pageSize.width / 2, 18, { align: 'center' });
        doc.setFontSize(14); doc.text("SMART MONITORING MBG", doc.internal.pageSize.width / 2, 28, { align: 'center' });

        autoTable(doc, {
          head: [['No.', 'Nama Sekolah', 'Gizi Normal', 'Gizi Kurang', 'Gizi Buruk', 'Obesitas', 'Total Siswa']],
          body: nutritionalSummary, startY: 40, theme: 'grid',
          headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 10, halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0, 0, 0] },
          bodyStyles: { fontSize: 10, halign: 'center', textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0] },
          margin: { top: 40 }
        });

        // Add Master Data Table below summary or on new page
        doc.addPage('a3', 'landscape');
        doc.setFillColor(27, 38, 58);
        doc.rect(0, 0, doc.internal.pageSize.width, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14); doc.setFont("helvetica", "bold");
        doc.text("DETAIL SISWA PENERIMA MBG", doc.internal.pageSize.width / 2, 15, { align: 'center' });

        autoTable(doc, {
          head: [['No.', 'Nama Sekolah', 'Kelas', 'Nama Siswa', 'NIS', 'Berat Badan', 'Tinggi Badan', 'Status Gizi']],
          body: masterStudentRows, startY: 25, theme: 'grid',
          headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 8, halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0, 0, 0] },
          bodyStyles: { fontSize: 8, halign: 'center', textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0] },
          margin: { top: 25 }
        });
      }

      doc.save(`Laporan_DEMO_MBG_Lengkap_${startDate}_to_${endDate}.pdf`);
      setShowReportModal(false);
    } catch (err: any) {
      console.error("Report generation failed:", err);
      setError(err.message || "Gagal membuat laporan");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-6">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1 text-[10px] font-bold uppercase tracking-widest italic">Ringkasan Sistem MBG Secara Keseluruhan</p>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 border-2 border-black hover:bg-white hover:text-black transition-all group disabled:opacity-50"
          >
            <Download className="w-4 h-4 group-hover:bounce" />
            <span className="text-xs font-black uppercase tracking-widest">Download Report</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border-4 border-red-600 bg-red-50 p-6 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Terjadi Kesalahan</p>
            <p className="text-xs text-red-700 font-bold italic underline">{error}</p>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Dapur */}
          <div className="bg-white border-l-4 border-l-blue-600 border border-gray-200 p-6 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Dapur</p>
            <p className="text-5xl font-black text-gray-900 mt-2">{stats.totalDapur}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Status PIC</span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{stats.dapurDenganPIC} TERDATA</span>
            </div>
          </div>

          {/* Total Sekolah */}
          <div className="bg-white border-l-4 border-l-green-600 border border-gray-200 p-6 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Sekolah</p>
            <p className="text-5xl font-black text-gray-900 mt-2">{stats.totalSekolah}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Registrasi</span>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">AKTIF</span>
            </div>
          </div>

          {/* Total Driver + Karyawan */}
          <div className="bg-white border-l-4 border-l-purple-600 border border-gray-200 p-6 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] transition-all">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Driver + Karyawan</p>
            <p className="text-5xl font-black text-gray-900 mt-2">{stats.totalDriver + stats.totalKaryawan}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">DRIVERS: <span className="text-black">{stats.totalDriver}</span></span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">STAFF: <span className="text-black">{stats.totalKaryawan}</span></span>
            </div>
          </div>
        </div>

        {/* Warning - Dapur Tanpa PIC */}
        {stats.dapurTanpaPIC > 0 && (
          <div className="bg-white border-2 border-red-600 p-6 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">PERHATIAN: TINDAKAN DIPERLUKAN</p>
                <p className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{stats.dapurTanpaPIC} Dapur Belum Memiliki PIC</p>
                <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest italic">Segera tentukan PIC untuk mengelola operasional dapur.</p>
              </div>
              <div className="px-4 py-2 border-2 border-red-600 text-red-600 font-black italic uppercase text-xs animate-pulse">
                URGENT
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Aksi Akses Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {/* Register PIC Dapur */}
            <a
              href="/admin/register-pic"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">REGISTRASI</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">PIC Dapur</p>
            </a>

            {/* Register PIC Sekolah */}
            <a
              href="/admin/register-pic-sekolah"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">REGISTRASI</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">PIC Sekolah</p>
            </a>

            {/* User Management */}
            <a
              href="/admin/user"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">MANAGEMENT</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">User List</p>
            </a>

            {/* Manajemen Dapur */}
            <a
              href="/admin/dapur"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">DRAFTER</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">Kelola Dapur</p>
            </a>

            {/* Manajemen Sekolah */}
            <a
              href="/admin/sekolah"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">DRAFTER</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">Kelola Sekolah</p>
            </a>

            {/* Laporan Tiketing */}
            <a
              href="/admin/tickets"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">HELPDESK</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">Tickets</p>
            </a>



            {/* Pengaturan Sistem */}
            <a
              href="/admin/settings"
              className="bg-white border-2 border-black p-5 hover:bg-black group transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mb-2">PREFERENCE</p>
              <p className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tighter">Settings</p>
            </a>
          </div>
        </div>

        {/* Recent Tickets Carousel */}
        {recentTickets.length > 0 && (
          <div className="bg-white border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-8">
            <div className="p-6 border-b-2 border-black bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-black">Tickets Terbaru</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 italic">
                Active Queue: {currentTicketIndex + 1} / {recentTickets.length}
              </span>
            </div>

            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              <div className="relative h-48">
                {recentTickets.map((ticket, index) => {
                  const createdDate = new Date(ticket.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  });

                  const isActive = index === currentTicketIndex;

                  return (
                    <div
                      key={ticket.id}
                      className={`absolute inset-0 p-8 transition-all duration-700 ease-in-out ${isActive
                        ? 'opacity-100 translate-x-0'
                        : index < currentTicketIndex
                          ? 'opacity-0 -translate-x-full'
                          : 'opacity-0 translate-x-full'
                        }`}
                    >
                      <div className="flex flex-col h-full border-l-4 border-l-black pl-6">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-gray-400 mb-1">{createdDate} | FROM: {ticket.user.name}</p>
                        <p className="font-black text-gray-900 uppercase tracking-tighter text-lg line-clamp-1">{ticket.judul}</p>
                        <p className="text-gray-500 text-xs mt-2 line-clamp-2 italic font-medium">{ticket.deskripsi}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="absolute right-6 bottom-6 flex gap-2">
                <button
                  onClick={() =>
                    setCurrentTicketIndex(
                      (prev) => (prev - 1 + recentTickets.length) % recentTickets.length
                    )
                  }
                  className="px-3 py-1 bg-white border border-black text-[9px] font-black tracking-widest hover:bg-black hover:text-white transition-all uppercase"
                >
                  PREV
                </button>
                <button
                  onClick={() => setCurrentTicketIndex((prev) => (prev + 1) % recentTickets.length)}
                  className="px-3 py-1 bg-white border border-black text-[9px] font-black tracking-widest hover:bg-black hover:text-white transition-all uppercase"
                >
                  NEXT
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 w-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${((currentTicketIndex + 1) / recentTickets.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Report Filter Modal */}
        {showReportModal && (
          <div className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black w-full max-w-md shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] my-auto relative z-[10000]">
              <div className="p-6 border-b-4 border-black bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter">Download Report</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Filter Periode & Dapur</p>
                </div>
                <button onClick={() => setShowReportModal(false)} className="text-black hover:scale-110 transition-transform">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">Dari Tanggal</label>
                    <input
                      type="date"
                      value={reportFilters.startDate}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-white border-2 border-black p-3 font-bold text-sm focus:bg-gray-50 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">Sampai Tanggal</label>
                    <input
                      type="date"
                      value={reportFilters.endDate}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-white border-2 border-black p-3 font-bold text-sm focus:bg-gray-50 outline-none"
                    />
                  </div>
                </div>

                {/* Dapur Selection with Search & Radio */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Pilih Unit Dapur</label>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari Dapur..."
                      value={kitchenSearchTerm}
                      onChange={(e) => setKitchenSearchTerm(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-black p-3 pl-10 font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                    />
                  </div>

                  {/* Checkbox List Container */}
                  <div className="border-2 border-black max-h-[200px] overflow-y-auto divide-y-2 divide-gray-100">
                    {/* Option ALL */}
                    <label className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-all ${reportFilters.selectedDapurIds.includes('all') ? 'bg-blue-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={reportFilters.selectedDapurIds.includes('all')}
                        onChange={() => {
                          setReportFilters(prev => ({
                            ...prev,
                            selectedDapurIds: ['all']
                          }));
                        }}
                        className="w-4 h-4 accent-black"
                      />
                      <span className="text-xs font-black uppercase tracking-tighter">SEMUA DAPUR (PILIH SEMUA)</span>
                    </label>

                    {/* Filtered Kitchen List */}
                    {loadingKitchens ? (
                      <div className="divide-y-2 divide-gray-50 bg-gray-50/30">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
                            <div className="w-4 h-4 bg-gray-200 rounded shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-gray-200 rounded w-1/2" />
                              <div className="h-2 bg-gray-100 rounded w-3/4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {kitchenListList
                          .filter(k => k.nama.toLowerCase().includes(kitchenSearchTerm.toLowerCase()))
                          .map(k => (
                            <label
                              key={k.id}
                              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-all ${reportFilters.selectedDapurIds.includes(k.id) ? 'bg-blue-50' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={reportFilters.selectedDapurIds.includes(k.id)}
                                onChange={() => {
                                  setReportFilters(prev => {
                                    let newIds = [...prev.selectedDapurIds].filter(id => id !== 'all');
                                    if (newIds.includes(k.id)) {
                                      newIds = newIds.filter(id => id !== k.id);
                                    } else {
                                      newIds.push(k.id);
                                    }
                                    if (newIds.length === 0) newIds = ['all'];
                                    return { ...prev, selectedDapurIds: newIds };
                                  });
                                }}
                                className="w-4 h-4 accent-black"
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-tighter">{k.nama}</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase">{k.alamat || 'No Address'}</span>
                              </div>
                            </label>
                          ))}

                        {kitchenListList.filter(k => k.nama.toLowerCase().includes(kitchenSearchTerm.toLowerCase())).length === 0 && (
                          <div className="p-8 text-center bg-gray-50">
                            <p className="text-[10px] font-bold text-gray-400 uppercase italic">Dapur tidak ditemukan.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-500 p-4 flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-900 leading-relaxed italic">
                    Laporan akan otomatis mencakup semua data sekolah dan presensi siswa yang dilayani oleh dapur yang dipilih.
                  </p>
                </div>

                <button
                  onClick={handleDownloadReport}
                  disabled={isGeneratingReport}
                  className="w-full h-14 relative bg-black text-white font-black uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 overflow-hidden"
                >
                  {isGeneratingReport ? (
                    <>
                      {/* Animated Progress Background */}
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300"
                        style={{ width: `${reportProgress}%` }}
                      ></div>
                      <span className="relative z-10 flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        PROCESSING {reportProgress}%
                      </span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      DOWNLOAD PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;