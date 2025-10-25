'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DapurLayout from '@/components/layout/DapurLayout';
import { Truck, Search, CheckCircle, AlertCircle, Loader2, QrCode, Plus } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://72.60.79.126:3000";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
}

const AssignDriverPage = () => {
  const router = useRouter();
  const [dapurId, setDapurId] = useState<string>("");
  const [dapurName, setDapurName] = useState<string>("");
  const [assignedDrivers, setAssignedDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get auth token
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken") || "";
    }
    return "";
  };

  // Load dapur info
  useEffect(() => {
    const loadDapurInfo = async () => {
      try {
        setLoading(true);
        const token = getToken();
        
        const userData = localStorage.getItem('mbg_user');
        if (!userData) {
          router.push('/auth/login');
          return;
        }

        // Get dapur list
        const response = await fetch(`${API_BASE_URL}/api/dapur`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error('Gagal load dapur');

        const data = await response.json();
        const dapurList = Array.isArray(data) ? data : data?.data || [];
        
        if (dapurList.length > 0) {
          const dapur = dapurList[0];
          setDapurId(dapur.id);
          setDapurName(dapur.nama);
          setAssignedDrivers(dapur.drivers || []);
        }

        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDapurInfo();
  }, [router]);

  // Assign driver
  const handleAssignDriver = async () => {
    if (!selectedDriverId || !dapurId) {
      setError('Pilih driver terlebih dahulu');
      return;
    }

    try {
      setAssigning(true);
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}/assign-driver`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedDriverId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal assign driver');
      }

      setSuccess('Driver berhasil di-assign!');
      setSelectedDriverId("");
      
      // Reload dapur
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <DapurLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DapurLayout>
    );
  }

  return (
    <DapurLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-8 h-8 text-blue-600" />
            Assign Driver
          </h1>
          <p className="text-gray-600 mt-2">Dapur: <span className="font-semibold">{dapurName}</span></p>
        </div>

        {/* Error/Success */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Assignment Form */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Assign Driver</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver ID / Scan Barcode
                </label>
                <input
                  type="text"
                  placeholder="Input driver ID atau scan barcode..."
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {selectedDriverId && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ✓ Driver ID: <span className="font-semibold">{selectedDriverId}</span>
                  </p>
                </div>
              )}

              <button
                onClick={handleAssignDriver}
                disabled={!selectedDriverId || assigning}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                  selectedDriverId && !assigning
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                }`}
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Assign Driver
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right - Assigned Drivers */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Driver Assigned ({assignedDrivers.length})
            </h2>

            {assignedDrivers.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Belum ada driver</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignedDrivers.map((driver) => (
                  <div key={driver.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-900">{driver.name}</p>
                    <p className="text-xs text-green-700 mt-1">{driver.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DapurLayout>
  );
};

export default AssignDriverPage;