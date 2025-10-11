// app/dapur/scan/page.tsx
'use client';

import { useState, useMemo } from 'react';
import DapurLayout from '@/components/layout/DapurLayout';
import { 
  QrCode, Camera, CheckCircle, X, Clock, MapPin, Upload, 
  Truck, Package, AlertCircle, User, Calendar, FileText,
  Navigation, Phone, Image as ImageIcon, RefreshCw, Info,
  Boxes, ChefHat, School
} from 'lucide-react';

const QRCheckpointScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>('');
  const [scannedData, setScannedData] = useState<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Checkpoint types sesuai ERD
  const checkpointTypes = [
    { 
      id: 'COOKING_START', 
      label: 'Mulai Memasak', 
      icon: ChefHat, 
      color: 'bg-orange-500',
      description: 'Scan saat mulai proses memasak',
      requiresPhoto: true
    },
    { 
      id: 'COOKING_COMPLETE', 
      label: 'Selesai Memasak', 
      icon: CheckCircle, 
      color: 'bg-green-500',
      description: 'Scan saat makanan selesai dimasak',
      requiresPhoto: true
    },
    { 
      id: 'PACKING_START', 
      label: 'Mulai Packing', 
      icon: Package, 
      color: 'bg-blue-500',
      description: 'Scan saat mulai packaging',
      requiresPhoto: false
    },
    { 
      id: 'PACKING_COMPLETE', 
      label: 'Selesai Packing', 
      icon: Boxes, 
      color: 'bg-purple-500',
      description: 'Scan saat packing selesai',
      requiresPhoto: true
    },
    { 
      id: 'KITCHEN_TO_DRIVER', 
      label: 'Serah Terima ke Driver', 
      icon: Truck, 
      color: 'bg-indigo-500',
      description: 'Scan saat baki diserahkan ke driver',
      requiresPhoto: true
    },
    { 
      id: 'DRIVER_DEPARTURE', 
      label: 'Driver Berangkat', 
      icon: Navigation, 
      color: 'bg-cyan-500',
      description: 'Scan saat driver mulai perjalanan',
      requiresPhoto: true
    },
    { 
      id: 'DRIVER_TO_SCHOOL', 
      label: 'Dalam Perjalanan', 
      icon: Truck, 
      color: 'bg-blue-600',
      description: 'Scan checkpoint perjalanan (optional)',
      requiresPhoto: false
    },
    { 
      id: 'SCHOOL_RECEIVED', 
      label: 'Diterima Sekolah', 
      icon: School, 
      color: 'bg-green-600',
      description: 'Scan saat baki diterima sekolah',
      requiresPhoto: true
    },
    { 
      id: 'SCHOOL_TO_DRIVER_RETURN', 
      label: 'Pickup Baki Kosong', 
      icon: Package, 
      color: 'bg-yellow-600',
      description: 'Scan saat driver pickup baki kosong',
      requiresPhoto: true
    },
    { 
      id: 'DRIVER_TO_KITCHEN', 
      label: 'Kembali ke Dapur', 
      icon: Navigation, 
      color: 'bg-purple-600',
      description: 'Scan saat dalam perjalanan kembali',
      requiresPhoto: false
    },
    { 
      id: 'KITCHEN_RECEIVED', 
      label: 'Baki Diterima Dapur', 
      icon: CheckCircle, 
      color: 'bg-green-700',
      description: 'Scan saat baki kosong kembali ke dapur',
      requiresPhoto: true
    },
    { 
      id: 'WASHING_COMPLETE', 
      label: 'Selesai Cuci Baki', 
      icon: RefreshCw, 
      color: 'bg-blue-700',
      description: 'Scan saat baki selesai dicuci',
      requiresPhoto: false
    }
  ];

  // Sample scanned batches/trips for today
  const recentScans = useMemo(() => [
    {
      id: 'SCAN-001',
      timestamp: '2025-01-13 08:50',
      type: 'COOKING_START',
      batch: 'BATCH-2025-01-13-001',
      menu: 'Nasi Putih + Rendang Sapi',
      scannedBy: 'Bu Siti Aminah',
      location: 'Dapur Utama',
      photoUrl: '/photos/cooking1.jpg',
      notes: 'Mulai memasak batch pagi'
    },
    {
      id: 'SCAN-002',
      timestamp: '2025-01-13 10:15',
      type: 'COOKING_COMPLETE',
      batch: 'BATCH-2025-01-13-001',
      menu: 'Nasi Putih + Rendang Sapi',
      scannedBy: 'Bu Siti Aminah',
      location: 'Dapur Utama',
      photoUrl: '/photos/cooking-done1.jpg',
      notes: 'Masakan matang sempurna'
    },
    {
      id: 'SCAN-003',
      timestamp: '2025-01-13 10:45',
      type: 'KITCHEN_TO_DRIVER',
      batch: 'BATCH-2025-01-13-001',
      trip: 'TRIP-001 - SMAN 5 Karawang',
      scannedBy: 'Pak Budi',
      location: 'Loading Area Dapur',
      photoUrl: '/photos/handover1.jpg',
      notes: '10 keranjang, 485 baki'
    },
    {
      id: 'SCAN-004',
      timestamp: '2025-01-13 11:00',
      type: 'DRIVER_DEPARTURE',
      batch: 'BATCH-2025-01-13-001',
      trip: 'TRIP-001 - SMAN 5 Karawang',
      scannedBy: 'Pak Budi',
      location: 'Gerbang Dapur',
      photoUrl: '/photos/depart1.jpg',
      notes: 'Berangkat tepat waktu'
    },
    {
      id: 'SCAN-005',
      timestamp: '2025-01-13 11:35',
      type: 'SCHOOL_RECEIVED',
      batch: 'BATCH-2025-01-13-001',
      trip: 'TRIP-001 - SMAN 5 Karawang',
      scannedBy: 'Ibu Siti (PIC Sekolah)',
      location: 'SMAN 5 Karawang',
      photoUrl: '/photos/received1.jpg',
      notes: 'Diterima lengkap, kondisi baik'
    }
  ], []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanQR = () => {
    // Simulate QR scan
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      // Mock scanned data
      setScannedData({
        batchId: 'BATCH-2025-01-13-002',
        tripId: 'TRIP-004',
        school: 'SMK 1 Karawang',
        menu: 'Nasi Goreng Spesial',
        expectedTrays: 450,
        expectedBaskets: 9,
        driver: 'Pak Ahmad Yani'
      });
    }, 2000);
  };

  const handleSubmit = () => {
    if (!selectedCheckpoint) {
      alert('Pilih jenis checkpoint terlebih dahulu');
      return;
    }

    const checkpoint = checkpointTypes.find(c => c.id === selectedCheckpoint);
    if (checkpoint?.requiresPhoto && !photoFile) {
      alert('Checkpoint ini memerlukan foto evidence');
      return;
    }

    // Submit checkpoint data
    console.log({
      type: selectedCheckpoint,
      scannedData,
      photo: photoFile,
      notes,
      timestamp: new Date().toISOString(),
      location: 'Dapur Karawang',
      scannedBy: 'Bu Siti Aminah'
    });

    // Show success
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Reset form
      setSelectedCheckpoint('');
      setScannedData(null);
      setPhotoFile(null);
      setPhotoPreview('');
      setNotes('');
    }, 2000);
  };

  const selectedCheckpointData = checkpointTypes.find(c => c.id === selectedCheckpoint);

  return (
    <DapurLayout currentPage="scan">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">QR Checkpoint Scanner</h1>
        <p className="text-gray-600">Scan QR code untuk tracking delivery dan production checkpoints</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Scanner Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* QR Scanner */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-blue-600" />
              Scan QR Code
            </h3>

            <div className="mb-6">
              {!scannedData ? (
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                    {scanning ? (
                      <div className="text-center">
                        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                        <p className="text-white font-semibold">Scanning QR Code...</p>
                        <p className="text-white/70 text-sm mt-2">Arahkan kamera ke QR code</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <QrCode className="w-24 h-24 text-white/30 mb-4 mx-auto" />
                        <p className="text-white font-semibold mb-4">Siap untuk scan</p>
                        <button
                          onClick={handleScanQR}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold flex items-center gap-2 mx-auto"
                        >
                          <Camera className="w-5 h-5" />
                          Mulai Scan
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"></div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-green-900 text-lg mb-2">QR Code Berhasil di-Scan!</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-700">Batch ID:</span>
                          <span className="font-bold text-green-900">{scannedData.batchId}</span>
                        </div>
                        {scannedData.tripId && (
                          <div className="flex justify-between">
                            <span className="text-green-700">Trip ID:</span>
                            <span className="font-bold text-green-900">{scannedData.tripId}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-green-700">Menu:</span>
                          <span className="font-bold text-green-900">{scannedData.menu}</span>
                        </div>
                        {scannedData.school && (
                          <div className="flex justify-between">
                            <span className="text-green-700">Tujuan:</span>
                            <span className="font-bold text-green-900">{scannedData.school}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-green-700">Trays:</span>
                          <span className="font-bold text-green-900">{scannedData.expectedTrays} baki</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setScannedData(null)}
                        className="mt-4 text-sm text-green-700 hover:text-green-800 font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Scan Ulang
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Checkpoint Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Pilih Jenis Checkpoint <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {checkpointTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedCheckpoint(type.id)}
                      disabled={!scannedData}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedCheckpoint === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      } ${!scannedData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900">{type.label}</p>
                          {type.requiresPhoto && (
                            <span className="text-xs text-orange-600 font-semibold">📷 Wajib foto</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo Upload */}
            {selectedCheckpointData && (
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Upload Foto Evidence {selectedCheckpointData.requiresPhoto && <span className="text-red-500">*</span>}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  {photoPreview ? (
                    <div className="relative">
                      <img src={photoPreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                      <button
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview('');
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">Click untuk upload foto</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer font-semibold"
                      >
                        <Upload className="w-4 h-4 inline mr-2" />
                        Upload Foto
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Catatan (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan jika diperlukan..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!scannedData}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!scannedData || !selectedCheckpoint}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${
                !scannedData || !selectedCheckpoint
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg'
              }`}
            >
              <CheckCircle className="w-6 h-6" />
              Submit Checkpoint
            </button>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">Panduan Scan</p>
                <p className="text-sm text-white/80">Tips sukses scanning</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Pastikan QR code terlihat jelas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Pilih checkpoint type yang sesuai</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Upload foto jika wajib</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Tambahkan catatan jika perlu</span>
              </li>
            </ul>
          </div>

          {/* Recent Scans List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Scan Terbaru
            </h3>
            <div className="space-y-3">
              {recentScans.slice(0, 5).map((scan) => (
                <div key={scan.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 mb-1">
                        {checkpointTypes.find(t => t.id === scan.type)?.label}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">{scan.batch}</p>
                      {scan.trip && <p className="text-xs text-blue-600 mb-1">{scan.trip}</p>}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {scan.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Checkpoint Berhasil!</h3>
            <p className="text-gray-600 mb-4">Data checkpoint telah tersimpan dan terupdate di sistem</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Checkpoint Type:</p>
              <p className="font-bold text-gray-900">{selectedCheckpointData?.label}</p>
            </div>
          </div>
        </div>
      )}
    </DapurLayout>
  );
};

export default QRCheckpointScanner;