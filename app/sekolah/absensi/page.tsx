// app/sekolah/absensi/page.tsx
'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import SekolahLayout from '@/components/layout/SekolahLayout';
import { 
  Camera,
  CheckCircle,
  Clock,
  Users,
  Utensils,
  Package,
  Trash2,
  RefreshCw,
  AlertCircle,
  Search,
  ScanFace,
  UserCheck,
  Loader
} from 'lucide-react';

const AbsensiPenerima = () => {
  const [step, setStep] = useState<'detect-face' | 'camera-plate' | 'analyzing' | 'result'>('detect-face');
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [platePhoto, setPlatePhoto] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<any>(null);

  // Dummy data siswa dengan face descriptors (simulasi)
  const siswaData = useMemo(() => [
    { 
      id: 1, 
      nis: '2024001', 
      nama: 'Ahmad Fauzi Rahman', 
      kelas: 'X-1', 
      foto: '👨', 
      status: 'belum', 
      waktuAbsen: null, 
      statusMakan: null,
      faceDescriptor: null // Will be replaced with actual descriptor
    },
    { 
      id: 2, 
      nis: '2024002', 
      nama: 'Siti Nurhaliza', 
      kelas: 'X-1', 
      foto: '👩', 
      status: 'sudah', 
      waktuAbsen: '11:35', 
      statusMakan: 'habis',
      faceDescriptor: null
    },
    { 
      id: 3, 
      nis: '2024003', 
      nama: 'Budi Santoso', 
      kelas: 'X-2', 
      foto: '👨', 
      status: 'sudah', 
      waktuAbsen: '11:38', 
      statusMakan: 'dibungkus',
      faceDescriptor: null
    },
    { 
      id: 4, 
      nis: '2024004', 
      nama: 'Dewi Lestari', 
      kelas: 'XI-1', 
      foto: '👩', 
      status: 'belum', 
      waktuAbsen: null, 
      statusMakan: null,
      faceDescriptor: null
    },
    { 
      id: 5, 
      nis: '2024005', 
      nama: 'Rizky Pratama', 
      kelas: 'XI-2', 
      foto: '👨', 
      status: 'belum', 
      waktuAbsen: null, 
      statusMakan: null,
      faceDescriptor: null
    },
  ], []);

  const filteredSiswa = useMemo(() => {
    return siswaData.filter(s => {
      const matchSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm);
      const matchStatus = filterStatus === 'semua' || s.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [siswaData, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = siswaData.length;
    const sudah = siswaData.filter(s => s.status === 'sudah').length;
    const habis = siswaData.filter(s => s.statusMakan === 'habis').length;
    const dibungkus = siswaData.filter(s => s.statusMakan === 'dibungkus').length;
    return { total, sudah, belum: total - sudah, habis, dibungkus };
  }, [siswaData]);

  // Load Face-API.js models
  useEffect(() => {
    const loadFaceAPI = async () => {
      try {
        const faceapi = await import('@vladmandic/face-api');
        
        // Load models from CDN
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        
        setIsFaceApiLoaded(true);
        console.log('Face-API models loaded successfully');
      } catch (error) {
        console.error('Error loading Face-API:', error);
        alert('Gagal memuat model Face Recognition. Menggunakan mode manual.');
      }
    };

    loadFaceAPI();
  }, []);

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Start face detection after video is ready
        videoRef.current.onloadedmetadata = () => {
          if (step === 'detect-face' && isFaceApiLoaded) {
            startFaceDetection();
          }
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  // Start Face Detection Loop
  const startFaceDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsDetecting(true);
    const faceapi = await import('@vladmandic/face-api');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    detectionIntervalRef.current = setInterval(async () => {
      if (!video.paused && !video.ended) {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          // Draw detection on canvas
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            detections.forEach(detection => {
              const { box } = detection.detection;
              ctx.strokeStyle = '#00ff00';
              ctx.lineWidth = 3;
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              
              // Draw confidence
              ctx.fillStyle = '#00ff00';
              ctx.font = '16px Arial';
              ctx.fillText(
                `Face Detected: ${(detection.detection.score * 100).toFixed(1)}%`,
                box.x,
                box.y - 10
              );
            });
          }

          // Recognize face (simplified - in production, match with stored descriptors)
          const recognizedSiswa = await recognizeFace(detections[0].descriptor);
          
          if (recognizedSiswa) {
            // Auto capture and proceed
            await autoCaptureFace(recognizedSiswa);
          }
        }
      }
    }, 100); // Check every 100ms
  };

  // Recognize Face (Mock - in production, compare with database)
  const recognizeFace = async (descriptor: Float32Array): Promise<any> => {
    // Mock recognition - randomly recognize a student
    // In production: Compare descriptor with stored face descriptors in database
    
    // Simulate face matching
    const availableSiswa = siswaData.filter(s => s.status === 'belum');
    if (availableSiswa.length > 0 && Math.random() > 0.7) {
      return availableSiswa[0]; // Return first available student for demo
    }
    return null;
  };

  // Auto Capture Face
  const autoCaptureFace = async (siswa: any) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Stop detection
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    setIsDetecting(false);

    // Capture photo
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg');
      
      setFacePhoto(photoData);
      setSelectedSiswa(siswa);
      
      // Show success message
      alert(`Wajah terdeteksi: ${siswa.nama}\nKelas: ${siswa.kelas}`);
      
      // Stop camera and move to plate photo
      stopCamera();
      setTimeout(() => {
        setStep('camera-plate');
        setTimeout(() => startCamera(), 100);
      }, 1000);
    }
  };

  // Manual Capture (if auto-detection fails)
  const manualCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg');
      
      if (step === 'camera-plate') {
        setPlatePhoto(photoData);
        stopCamera();
        analyzeWithAI(photoData);
      }
    }
  };

  // Analyze with ChatGPT Vision API
  const analyzeWithAI = async (imageData: string) => {
    setStep('analyzing');

    try {
      const base64Image = imageData.split(',')[1];

      const response = await fetch('/api/analyze-plate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          siswa: selectedSiswa
        }),
      });

      const result = await response.json();
      
      setAnalysisResult({
        isFinished: result.isFinished || Math.random() > 0.5,
        confidence: result.confidence || (Math.random() * 30 + 70).toFixed(1),
        description: result.description || 'Makanan masih tersisa sekitar 30%',
        remainingPercentage: result.remainingPercentage || 30
      });
      setStep('result');

    } catch (error) {
      console.error('Error analyzing:', error);
      alert('Gagal menganalisis foto. Menggunakan hasil simulasi.');
      setAnalysisResult({
        isFinished: Math.random() > 0.5,
        confidence: 75,
        description: 'Hasil simulasi - API error'
      });
      setStep('result');
    }
  };

  // Handle finish process
  const handleFinish = (action: 'habis' | 'dibungkus' | 'tidak') => {
    console.log('Saving:', {
      siswa: selectedSiswa,
      facePhoto,
      platePhoto,
      analysis: analysisResult,
      action,
      timestamp: new Date().toISOString()
    });

    // Reset
    setStep('detect-face');
    setSelectedSiswa(null);
    setFacePhoto(null);
    setPlatePhoto(null);
    setAnalysisResult(null);
    
    alert(`✅ Absensi ${selectedSiswa.nama} berhasil disimpan!\nStatus: ${
      action === 'habis' ? 'Makanan Habis' : 
      action === 'dibungkus' ? 'Dibungkus' : 'Tidak Dibungkus'
    }`);
    
    // Restart detection
    setTimeout(() => startCamera(), 500);
  };

  // Start detection on mount
  useEffect(() => {
    if (step === 'detect-face' && isFaceApiLoaded) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [step, isFaceApiLoaded]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );

  return (
    <SekolahLayout currentPage="absensi">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Absensi Penerima MBG</h1>
        <p className="text-gray-600">Face Recognition + AI Vision untuk verifikasi makanan habis</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total Siswa" value={stats.total} subtitle="Terdaftar" icon={Users} color="bg-blue-500" />
        <StatCard title="Sudah Absen" value={stats.sudah} subtitle="Telah menerima" icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Belum Absen" value={stats.belum} subtitle="Menunggu" icon={Clock} color="bg-orange-500" />
        <StatCard title="Habis" value={stats.habis} subtitle="Makanan habis" icon={Utensils} color="bg-purple-500" />
        <StatCard title="Dibungkus" value={stats.dibungkus} subtitle="Bawa pulang" icon={Package} color="bg-yellow-500" />
      </div>

      {/* Face Detection Step */}
      {step === 'detect-face' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                🎭 Face Recognition - Deteksi Otomatis
              </h2>
              {!isFaceApiLoaded && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading AI Model...</span>
                </div>
              )}
            </div>
            <p className="text-gray-600">
              {isDetecting 
                ? '🔍 Sistem sedang mendeteksi wajah... Posisikan wajah Anda di depan kamera'
                : 'Arahkan wajah ke kamera untuk deteksi otomatis'}
            </p>
          </div>

          <div className="relative bg-black rounded-xl overflow-hidden mb-6">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-full h-[500px] object-cover"
            />
            <canvas 
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
            
            {/* Detection indicator */}
            {isDetecting && (
              <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                <ScanFace className="w-5 h-5" />
                <span className="font-semibold">Scanning...</span>
              </div>
            )}

            {/* Selected student info */}
            {selectedSiswa && (
              <div className="absolute bottom-4 left-4 right-4 bg-green-500 text-white p-4 rounded-lg">
                <p className="font-bold text-lg">✓ Terdeteksi: {selectedSiswa.nama}</p>
                <p className="text-sm">Kelas: {selectedSiswa.kelas} | NIS: {selectedSiswa.nis}</p>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>💡 Tip: Pastikan pencahayaan cukup dan wajah menghadap kamera</p>
          </div>
        </div>
      )}

      {/* Plate Camera Step */}
      {step === 'camera-plate' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              🍽️ Foto Piring - Verifikasi Makanan Habis
            </h2>
            <p className="text-gray-600">
              Siswa: <span className="font-semibold text-blue-600">{selectedSiswa?.nama}</span> ({selectedSiswa?.kelas})
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Arahkan kamera ke piring untuk verifikasi dengan AI Vision
            </p>
          </div>

          <div className="relative bg-black rounded-xl overflow-hidden mb-6">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-full h-[500px] object-cover"
            />
            <div className="absolute inset-0 border-4 border-yellow-500 rounded-xl pointer-events-none"></div>
            
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-2 rounded-full font-semibold">
              📸 Arahkan ke Piring
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={manualCapture}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-semibold text-lg"
            >
              <Camera className="w-6 h-6" />
              Ambil Foto Piring
            </button>
            <button
              onClick={() => {
                stopCamera();
                setStep('detect-face');
                setSelectedSiswa(null);
                setFacePhoto(null);
              }}
              className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Analyzing */}
      {step === 'analyzing' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 animate-pulse">
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI Sedang Menganalisis...</h2>
          <p className="text-gray-600">GPT-4 Vision memeriksa foto piring Anda</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader className="w-4 h-4 animate-spin" />
            <span>Detecting food remnants...</span>
          </div>
        </div>
      )}

      {/* Result */}
      {step === 'result' && analysisResult && selectedSiswa && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className={`p-6 ${analysisResult.isFinished ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-4 ${analysisResult.isFinished ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}>
                {analysisResult.isFinished ? (
                  <CheckCircle className="w-8 h-8 text-white" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {analysisResult.isFinished ? '✅ Makanan Habis!' : '⚠️ Makanan Belum Habis'}
                </h2>
                <p className="text-gray-700">
                  Confidence: {analysisResult.confidence}% | 
                  {analysisResult.remainingPercentage && ` Sisa: ${analysisResult.remainingPercentage}%`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">{selectedSiswa.nama}</p>
                  <p className="text-sm text-blue-700">{selectedSiswa.kelas} | NIS: {selectedSiswa.nis}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">📸 Foto Wajah (Face Recognition)</p>
                {facePhoto && (
                  <img src={facePhoto} alt="Face" className="w-full h-48 object-cover rounded-lg border-2 border-blue-300" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">🍽️ Foto Piring (AI Analysis)</p>
                {platePhoto && (
                  <img src={platePhoto} alt="Plate" className="w-full h-48 object-cover rounded-lg border-2 border-yellow-300" />
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-1">🤖 Hasil Analisis AI:</p>
              <p className="text-gray-900">{analysisResult.description}</p>
            </div>

            {analysisResult.isFinished ? (
              <button
                onClick={() => handleFinish('habis')}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg"
              >
                <CheckCircle className="w-6 h-6" />
                ✓ Selesai - Makanan Habis
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-center font-medium text-gray-900 mb-3">
                  Apakah <span className="text-blue-600 font-bold">{selectedSiswa.nama}</span> ingin membungkus sisa makanan?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleFinish('dibungkus')}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-semibold"
                  >
                    <Package className="w-5 h-5" />
                    📦 Ya, Bungkus
                  </button>
                  <button
                    onClick={() => handleFinish('tidak')}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                  >
                    <Trash2 className="w-5 h-5" />
                    🗑️ Tidak
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SekolahLayout>
  );
};

export default AbsensiPenerima;