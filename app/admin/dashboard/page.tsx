'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Building2, Users, Truck, Package, Loader2, Activity, AlertCircle
} from 'lucide-react';

const API_BASE_URL = "http://72.60.79.126:3000";

interface DashboardStats {
  totalDapur: number;
  totalSekolah: number;
  totalUser: number;
  totalDriver: number;
  totalKaryawan: number;
  dapurDenganPIC: number;
  dapurTanpaPIC: number;
  totalStok: number;
}

interface RecentActivity {
  id: string;
  type: 'dapur' | 'sekolah' | 'user' | 'distribusi';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

const AdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalDapur: 0,
    totalSekolah: 0,
    totalUser: 0,
    totalDriver: 0,
    totalKaryawan: 0,
    dapurDenganPIC: 0,
    dapurTanpaPIC: 0,
    totalStok: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Mock recent activities
  const mockActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'dapur',
      title: 'Dapur Baru Ditambahkan',
      description: 'Dapur MBG Cabang Bekasi telah ditambahkan ke sistem',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'success'
    },
    {
      id: '2',
      type: 'sekolah',
      title: 'Sekolah Terdaftar',
      description: 'SD Negeri 123 Jakarta berhasil terdaftar',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'success'
    },
    {
      id: '3',
      type: 'dapur',
      title: 'Dapur Tanpa PIC',
      description: '3 dapur masih belum memiliki PIC yang ditunjuk',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'warning'
    },
  ];

  useEffect(() => {
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
  }, [router]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!authToken) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch dapur
      const dapurRes = await fetch(`${API_BASE_URL}/api/dapur?page=1&limit=1000`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!dapurRes.ok) {
        throw new Error(`Failed to fetch dapur (${dapurRes.status})`);
      }

      const dapurData = await dapurRes.json();
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
      const totalStok = dapurList.reduce((sum: number, d: any) => sum + (d._count?.stokBahanBaku || 0), 0);

      // Fetch sekolah
      const sekolahRes = await fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=1000`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!sekolahRes.ok) {
        throw new Error(`Failed to fetch sekolah (${sekolahRes.status})`);
      }

      const sekolahData = await sekolahRes.json();
      let sekolahList = [];
      
      if (sekolahData.data?.data && Array.isArray(sekolahData.data.data)) {
        sekolahList = sekolahData.data.data;
      } else if (sekolahData.data && Array.isArray(sekolahData.data)) {
        sekolahList = sekolahData.data;
      }

      // Note: User endpoint not available in current API
      let userList = [];

      setStats({
        totalDapur: dapurList.length,
        totalSekolah: sekolahList.length,
        totalUser: userList.length,
        totalDriver,
        totalKaryawan,
        dapurDenganPIC,
        dapurTanpaPIC,
        totalStok,
      });

      setRecentActivities(mockActivities);
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
    }
  }, [authToken, fetchStats]);

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h lalu`;
    return `${Math.floor(diff / 86400)}d lalu`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'dapur':
        return <Building2 className="w-5 h-5" />;
      case 'sekolah':
        return <Users className="w-5 h-5" />;
      case 'user':
        return <Users className="w-5 h-5" />;
      case 'distribusi':
        return <Truck className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'info':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="dashboard">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-gray-600 mt-1">Overview sistem MBG secara keseluruhan</p>
          </div>

          {/* Main Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-20 mt-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-28 mt-2 animate-pulse"></div>
                  </div>
                  <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activities & List Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activities Skeleton */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
              </div>
              <div className="divide-y divide-gray-200">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-100 rounded w-64 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* List Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-1">Overview sistem MBG secara keseluruhan</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Dapur */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dapur</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalDapur}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.dapurDenganPIC} dengan PIC
                </p>
              </div>
              <div className="p-4 bg-blue-100 rounded-lg">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Sekolah */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sekolah</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalSekolah}</p>
                <p className="text-xs text-gray-500 mt-2">Terdaftar dalam sistem</p>
              </div>
              <div className="p-4 bg-green-100 rounded-lg">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total User */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pengguna</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalUser}</p>
                <p className="text-xs text-gray-500 mt-2">Aktif di sistem</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-lg">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Stok */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stok Bahan</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalStok}</p>
                <p className="text-xs text-gray-500 mt-2">Bahan baku tersedia</p>
              </div>
              <div className="p-4 bg-orange-100 rounded-lg">
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Driver */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Truck className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Driver</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDriver}</p>
              </div>
            </div>
          </div>

          {/* Karyawan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Karyawan</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalKaryawan}</p>
              </div>
            </div>
          </div>

          {/* PIC Status Warning */}
          {stats.dapurTanpaPIC > 0 && (
            <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-yellow-800 font-semibold">Dapur Tanpa PIC</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.dapurTanpaPIC}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activities & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Aktivitas Terbaru</h3>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{activity.title}</p>
                      <p className="text-gray-600 text-sm mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{getTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Dapur Terbaru</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {/* Show list of dapur */}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;