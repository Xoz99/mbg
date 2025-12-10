"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { useSekolahDataCache } from "@/lib/hooks/useSekolahDataCache"
import {
  Users,
  Loader,
  CheckCircle,
  X,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  User,
  Users2,
  AlertTriangle,
  Camera,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demombgv1.xyz"

// Skeleton Components
const SkeletonStatCard = () => (
  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse">
    <div className="h-10 w-10 bg-slate-300 rounded-xl mb-3"></div>
    <div className="h-3 w-24 bg-slate-300 rounded mb-2"></div>
    <div className="h-8 w-16 bg-slate-400 rounded mb-2"></div>
    <div className="h-3 w-20 bg-slate-300 rounded"></div>
  </div>
)

const SkeletonKelasCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="bg-slate-300 h-20"></div>
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-slate-200 rounded-lg"></div>
        <div className="h-20 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
      <div className="h-10 bg-slate-200 rounded-lg"></div>
    </div>
  </div>
)

const Presensi = () => {
  const [step, setStep] = useState<
    "kelas-selection" | "camera-face" | "processing-face" | "confirm" | "submitting" | "result"
  >("kelas-selection")

  const [faceDetected, setFaceDetected] = useState(false)
  const [facePosition, setFacePosition] = useState<string>("")
  const [countdown, setCountdown] = useState(3)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  const [authToken, setAuthToken] = useState("")
  const [sekolahId, setSekolahId] = useState("")
  const [credentialsReady, setCredentialsReady] = useState(false)

  const [selectedKelas, setSelectedKelas] = useState<any>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null)
  const [facePhoto, setFacePhoto] = useState<string | null>(null)

  const [validationResult, setValidationResult] = useState<any>(null)
  const [loadingSelectedKelas, setLoadingSelectedKelas] = useState(false)

  // Cache state
  const [cachedData, setCachedData] = useState<any>(null)

  // Use cache hook for kelas & siswa data
  const handleCacheUpdate = useCallback((data: any) => {
    setCachedData(data)
  }, [])
  const { loading: loadingCache, loadData } = useSekolahDataCache(handleCacheUpdate)

  const isFetchingRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const storedSekolahId = localStorage.getItem("sekolahId")

    if (storedToken) setAuthToken(storedToken)
    if (storedSekolahId) setSekolahId(storedSekolahId)

    if (storedToken && storedSekolahId) {
      setCredentialsReady(true)
    }
  }, [])

  // Load data from cache hook when credentials are ready
  useEffect(() => {
    if (credentialsReady && authToken && sekolahId && isFetchingRef.current === false) {
      isFetchingRef.current = true
      loadData(sekolahId, authToken)
        .then((data) => {
          setCachedData(data)
        })
        .catch((err) => {
          console.error("Error loading data:", err)
        })
        .finally(() => {
          isFetchingRef.current = false
        })
    }
  }, [credentialsReady, authToken, sekolahId, loadData])

  // Camera setup based on step
  useEffect(() => {
    if (step === "camera-face" && !isCameraActive && cameraReady) {
      startCamera("user")
    }

    return () => {
      if (step !== "camera-face") {
        stopCamera()
        stopFaceDetection()
      }
    }
  }, [step, cameraReady])

  const stats = useMemo(() => {
    if (!selectedKelas || !cachedData) return { total: 0, lakiLaki: 0, perempuan: 0 }

    const siswaDataToUse = Array.isArray(cachedData.siswaData) ? cachedData.siswaData : []
    const kelassiswa = siswaDataToUse.filter((siswa: any) => String(siswa.kelasId) === String(selectedKelas.id))
    const total = kelassiswa.length
    const lakiLaki = kelassiswa.filter((siswa: any) => siswa.jenisKelamin === "LAKI_LAKI").length
    const perempuan = kelassiswa.filter((siswa: any) => siswa.jenisKelamin === "PEREMPUAN").length

    return { total, lakiLaki, perempuan }
  }, [cachedData, selectedKelas])



  const handleKelasSelect = async (kelas: any) => {
    setSelectedKelas(kelas)
    setLoadingSelectedKelas(true)

    try {
      // Just move to camera step
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setLoadingSelectedKelas(false)
      setStep("camera-face")
    }
  }

  const startCamera = async (facingMode: "user" | "environment" = "user") => {
    try {
      setIsCameraActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        videoRef.current.onloadedmetadata = () => {
          if (step === "camera-face") {
            startFaceDetection()
          }
        }
      }
    } catch (err) {
      console.error("Error starting camera:", err)
      alert("Gagal mengakses kamera")
      setIsCameraActive(false)
    }
  }

  const stopCamera = () => {
    stopFaceDetection()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const startFaceDetection = () => {
    detectionIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || step !== "camera-face") return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })

      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const regionSize = 100

      const imageData = ctx.getImageData(centerX - regionSize, centerY - regionSize, regionSize * 2, regionSize * 2)

      let totalBrightness = 0
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]
        totalBrightness += (r + g + b) / 3
      }
      const avgBrightness = totalBrightness / (imageData.data.length / 4)

      if (avgBrightness > 80 && avgBrightness < 180) {
        setFaceDetected(true)
        setFacePosition("centered")

        if (!countdownIntervalRef.current) {
          startCountdown()
        }
      } else {
        setFaceDetected(false)
        setFacePosition(avgBrightness < 80 ? "too-dark" : "too-bright")
        stopCountdown()
      }
    }, 200)
  }

  const stopFaceDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    stopCountdown()
    setFaceDetected(false)
    setFacePosition("")
  }

  const startCountdown = () => {
    setCountdown(2)
    let count = 2

    countdownIntervalRef.current = setInterval(() => {
      count -= 1
      setCountdown(count)

      if (count <= 0) {
        stopCountdown()
        capturePhotoForValidation()
      }
    }, 500)
  }

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(2)
  }

  const capturePhotoForValidation = () => {
    if (!videoRef.current) return

    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      const photoData = canvas.toDataURL("image/jpeg", 0.8)
      setFacePhoto(photoData)
      stopCamera()
      validateFace(photoData)
    }
  }


  const validateFace = async (facePhotoData: string) => {
    setStep("processing-face")

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")

      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan")
      }

      const fotoBlob = await fetch(facePhotoData).then((r) => r.blob())
      const fotoFile = new File([fotoBlob], "foto.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("foto", fotoFile)

      const response = await fetch(`${API_BASE_URL}/api/face-recognition/detect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Wajah tidak dikenali")
      }

      const detectedSiswa = result.data?.siswa || result.siswa || result.data || result

      if (detectedSiswa && (detectedSiswa.siswaId || detectedSiswa.id)) {
        let alergiArray: string[] = []
        if (detectedSiswa.alergi) {
          if (Array.isArray(detectedSiswa.alergi)) {
            alergiArray = detectedSiswa.alergi
              .map((a: any) => {
                if (typeof a === "string") return a
                return String(a.namaAlergi || a.nama || a)
              })
              .filter((a: string) => a.trim())
          } else if (typeof detectedSiswa.alergi === "string") {
            alergiArray = detectedSiswa.alergi
              .split(",")
              .map((a: string) => a.trim())
              .filter((a: string) => a)
          }
        }

        let fotoUrl = detectedSiswa.fotoUrl || ""
        if (fotoUrl && !fotoUrl.startsWith("data:") && !fotoUrl.startsWith("http")) {
          fotoUrl = `${API_BASE_URL}${fotoUrl}`
        }

        const normalizedSiswa = {
          ...detectedSiswa,
          id: detectedSiswa.siswaId || detectedSiswa.id,
          kelas: typeof detectedSiswa.kelas === "object" ? detectedSiswa.kelas.nama : detectedSiswa.kelas,
          alergi: alergiArray,
          fotoUrl: fotoUrl,
        }

        const siswaDataToFind = cachedData?.siswaData || []
        const siswaFromList = siswaDataToFind.find((s: any) => String(s.id) === String(normalizedSiswa.id))
        const siswaToUse = siswaFromList ? { ...normalizedSiswa, ...siswaFromList } : normalizedSiswa

        setSelectedSiswa(siswaToUse)
        setStep("confirm")
      } else {
        throw new Error("Data siswa tidak ditemukan")
      }
    } catch (err) {
      console.error("Error validating face:", err)
      const errorMsg = err instanceof Error ? err.message : "Wajah tidak dikenali"
      alert(errorMsg)
      setFacePhoto(null)
      setStep("camera-face")
    }
  }

  const submitPresensi = async () => {
    if (!selectedSiswa || !selectedKelas) {
      alert("Data tidak lengkap!")
      return
    }

    setStep("submitting")

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")

      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan")
      }

      const url = `${API_BASE_URL}/api/kelas/${selectedKelas.id}/absensi/face-recognition`

      // Get today's date in Indonesia timezone (UTC+7)
      const now = new Date();
      const indonesiaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const year = indonesiaTime.getUTCFullYear();
      const month = String(indonesiaTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(indonesiaTime.getUTCDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;

      const payload = {
        siswaId: String(selectedSiswa.id),
        tanggal: todayString,
      }

      console.log("[PRESENSI] Submitting to endpoint:", url)
      console.log("[PRESENSI] With payload:", JSON.stringify(payload))

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      console.log("[PRESENSI] Response:", { status: response.status, result })

      if (!response.ok) {
        const errorMsg = result.message || result.error || `HTTP ${response.status}`
        console.error("[PRESENSI] Error:", errorMsg)
        throw new Error(errorMsg)
      }

      setValidationResult({
        success: true,
        message: "Presensi berhasil dicatat!",
        siswa: selectedSiswa,
        data: result.data,
      })
      setStep("result")

      setTimeout(() => {
        handleReset()
      }, 5000)
    } catch (err) {
      console.error("Error submitting presensi:", err)
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan"

      // Check if it's a duplicate attendance error
      const isDuplicate = errorMessage.includes("sudah melakukan absensi")

      setValidationResult({
        success: false,
        message: isDuplicate
          ? "⚠️ Siswa sudah presensi hari ini. Coba scan siswa yang lain atau ubah tanggal untuk test."
          : errorMessage,
      })
      setStep("result")

      setTimeout(() => {
        handleReset()
      }, isDuplicate ? 7000 : 5000)
    }
  }

  const handleReset = () => {
    stopCamera()
    setFacePhoto(null)
    setSelectedSiswa(null)
    setValidationResult(null)
    setCameraReady(false)
    setStep("camera-face")
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-3.5 rounded-xl ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <Zap className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-0.5">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
      </div>
    </div>
  )


  return (
    <SekolahLayout currentPage="presensi">
      {/* LOADING MODAL - WHEN SELECTING KELAS */}
      {loadingSelectedKelas && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-pulse opacity-20"></div>
                <Loader className="w-full h-full animate-spin text-blue-600 relative" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Mempersiapkan Kelas</h3>
              <p className="text-sm text-gray-600 text-center mb-4">Memuat data siswa dan presensi hari ini...</p>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: KELAS SELECTION */}
      {step === "kelas-selection" && !loadingSelectedKelas && (
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Presensi Siswa</h1>
            <p className="text-gray-600 mt-1 text-sm">Pilih kelas untuk mulai presensi dengan face recognition</p>
          </div>

          {loadingCache ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonKelasCard key={i} />
              ))}
            </div>
          ) : !cachedData || cachedData.kelasData.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada data kelas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cachedData.kelasData.map((kelas: any) => (
                <div
                  key={kelas.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-br from-[#1B263A] to-[#2A3749] px-5 py-4 text-white h-20 flex items-center">
                    <h3 className="text-2xl font-bold truncate">Kelas: {kelas.nama || 'Kelas'}</h3>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Laki-laki dan Perempuan */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-blue-600">{kelas.lakiLaki || 0}</p>
                        <p className="text-xs text-gray-600">Laki-laki</p>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <Users className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-pink-600">{kelas.perempuan || 0}</p>
                        <p className="text-xs text-gray-600">Perempuan</p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4 min-h-[56px]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Siswa</span>
                        <span className="font-semibold text-gray-900">{kelas.totalSiswa || 0} siswa</span>
                      </div>
                      {kelas.alergiCount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-600">Alergi</span>
                          <span className="font-semibold text-red-900">{kelas.alergiCount} siswa</span>
                        </div>
                      )}
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => handleKelasSelect(kelas)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mulai Presensi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedKelas && (
        <>
          {/* Header & Stats */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Presensi {selectedKelas.nama}</h1>
                <p className="text-gray-600 mt-1 text-sm">Deteksi wajah siswa untuk mencatat kehadiran</p>
              </div>
              <button
                onClick={() => {
                  setSelectedKelas(null)
                  setStep("kelas-selection")
                }}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold"
              >
                Ganti Kelas
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
            {loadingSelectedKelas ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <SkeletonStatCard key={i} />
                ))}
              </>
            ) : (
              <>
                <StatCard
                  title="Total Siswa"
                  value={stats.total}
                  subtitle="Siswa di kelas"
                  icon={Users}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                  title="Laki-laki"
                  value={stats.lakiLaki}
                  subtitle="Siswa"
                  icon={Users}
                  color="bg-gradient-to-br from-cyan-500 to-cyan-600"
                />
                <StatCard
                  title="Perempuan"
                  value={stats.perempuan}
                  subtitle="Siswa"
                  icon={Users}
                  color="bg-gradient-to-br from-rose-500 to-rose-600"
                />
              </>
            )}
          </div>

          {/* STEP: CAMERA FACE */}
          {step === "camera-face" && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {!cameraReady ? (
                // Button untuk mulai presensi
                <div className="p-12 text-center">
                  <div className="mb-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-[#D0B064] to-[#C9A355] rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
                      <Camera className="w-16 h-16 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Siap untuk Presensi?</h2>
                    <p className="text-gray-600 text-lg mb-2">Sistem akan mendeteksi wajah siswa secara otomatis</p>
                    <p className="text-gray-500 text-sm">Pastikan wajah terlihat jelas dan pencahayaan cukup</p>
                  </div>

                  <button
                    onClick={() => setCameraReady(true)}
                    className="px-10 py-4 bg-gradient-to-r from-[#D0B064] to-[#C9A355] hover:shadow-2xl text-white rounded-2xl transition-all font-bold text-lg flex items-center justify-center gap-3 mx-auto transform hover:scale-105"
                  >
                    <Camera className="w-6 h-6" />
                    Mulai Presensi
                  </button>
                </div>
              ) : (
                <>
                  {/* Status Bar */}
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-white">Kamera Aktif</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">DETEKSI WAJAH</span>
                  </div>

                  {/* Camera Container */}
                  <div className="relative bg-black overflow-hidden aspect-video">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Overlay Guide */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className={`w-64 h-64 border-4 rounded-full transition-all duration-300 ${
                          faceDetected
                            ? "border-[#D0B064] shadow-2xl shadow-[#D0B064]/40 scale-100"
                            : "border-gray-500 animate-pulse scale-95"
                        }`}
                      >
                        {faceDetected && countdown > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-white text-6xl font-bold animate-pulse">{countdown}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Badges */}
                    <div className="absolute top-6 right-6 space-y-3">
                      {faceDetected && (
                        <div className="bg-gradient-to-r from-[#D0B064] to-[#C9A355] text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg animate-pulse">
                          <CheckCircle className="w-4 h-4" />
                          Wajah Terdeteksi
                        </div>
                      )}

                      {!faceDetected && facePosition && (
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                          {facePosition === "too-dark" && "Terlalu gelap"}
                          {facePosition === "too-bright" && "Terlalu terang"}
                        </div>
                      )}
                    </div>

                    {/* Instruction */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gray-900/90 backdrop-blur text-white px-6 py-3 rounded-full text-sm font-medium">
                        {faceDetected ? "✓ Menangkap foto..." : "Posisikan wajah ke tengah"}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP: PROCESSING FACE */}
          {step === "processing-face" && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="mb-6">
                {facePhoto && (
                  <img
                    src={facePhoto || "/placeholder.svg"}
                    alt="Face"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mx-auto shadow-lg"
                  />
                )}
              </div>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#D0B064] rounded-full animate-pulse opacity-20"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-[#D0B064] to-[#C9A355] rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mengenali Wajah...</h2>
              <p className="text-gray-600 text-sm mb-6">Menganalisis dengan AI Detection Face</p>
              <div className="flex justify-center gap-1.5">
                <div className="w-2 h-2 bg-[#D0B064] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#D0B064] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-[#D0B064] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          )}

          {/* STEP: CONFIRM */}
          {step === "confirm" && selectedSiswa && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#D0B064] to-[#C9A355] px-6 py-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span className="text-sm font-semibold text-white">Wajah Berhasil Dikenali</span>
                </div>
              </div>

              <div className="p-8">
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 mb-8 border-2 border-[#D0B064]/30">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedSiswa.nama}</h3>
                  <p className="text-sm text-gray-600 mb-1">{selectedSiswa.kelas}</p>
                  <p className="text-xs text-gray-500 mb-4">NIS: {selectedSiswa.nis}</p>

                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-600 mb-2">👤 Foto DB</p>
                      {selectedSiswa.fotoUrl ? (
                        <img
                          src={selectedSiswa.fotoUrl || "/placeholder.svg"}
                          alt="Foto"
                          className="w-24 h-24 rounded-full object-cover border-4 border-[#D0B064] shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-[#D0B064] flex items-center justify-center">
                          {selectedSiswa.jenisKelamin === "LAKI_LAKI" ? (
                            <Users2 className="w-12 h-12 text-gray-500" />
                          ) : (
                            <User className="w-12 h-12 text-gray-500" />
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <CheckCircle className="w-8 h-8 text-[#D0B064]" />
                    </div>

                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-600 mb-2">📷 Deteksi</p>
                      {facePhoto && (
                        <img
                          src={facePhoto || "/placeholder.svg"}
                          alt="Foto Deteksi"
                          className="w-24 h-24 rounded-full object-cover border-4 border-[#D0B064] shadow-lg"
                        />
                      )}
                    </div>
                  </div>

                  {selectedSiswa.alergi && selectedSiswa.alergi.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500">
                      <p className="text-xs text-red-700 font-bold">ALERGI TERDAFTAR</p>
                      <p className="text-sm text-red-800 font-semibold mt-1">{selectedSiswa.alergi.join(", ")}</p>
                    </div>
                  )}
                </div>

                <p className="text-lg font-bold text-gray-900 text-center mb-8">Konfirmasi presensi?</p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleReset()}
                    className="px-6 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Batal
                  </button>
                  <button
                    onClick={() => submitPresensi()}
                    className="px-6 py-3 bg-gradient-to-r from-[#D0B064] to-[#C9A355] hover:shadow-lg text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Konfirmasi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP: SUBMITTING */}
          {step === "submitting" && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 bg-[#D0B064] rounded-full animate-ping opacity-20"></div>
                <Loader className="w-full h-full animate-spin text-[#D0B064] relative" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Menyimpan Presensi...</h2>
              <p className="text-gray-600 text-sm">Sistem sedang memproses informasi</p>
            </div>
          )}

          {/* STEP: RESULT */}
          {step === "result" && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div
                className={`bg-gradient-to-r ${
                  validationResult?.success ? "from-[#D0B064] to-[#C9A355]" : "from-red-500 to-red-600"
                } px-6 py-4`}
              >
                <div className="flex items-center gap-2">
                  {validationResult?.success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span className="text-sm font-semibold text-white">Presensi Tersimpan</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-white" />
                      <span className="text-sm font-semibold text-white">Gagal Tersimpan</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-8 text-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    validationResult?.success ? "bg-amber-100" : "bg-red-100"
                  }`}
                >
                  {validationResult?.success ? (
                    <CheckCircle2 className="w-12 h-12 text-[#D0B064]" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-600" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {validationResult?.success ? "Berhasil!" : "Gagal!"}
                </h2>
                <p className="text-gray-600">{validationResult?.message}</p>

                {validationResult?.success && validationResult?.siswa && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 my-6 border-2 border-[#D0B064]/30">
                    <p className="text-xs font-bold text-[#C9A355] mb-3">✓ PRESENSI TERSIMPAN</p>
                    <p className="text-xl font-bold text-gray-900 mb-1">{validationResult.siswa.nama}</p>
                    <p className="text-sm text-gray-600 mb-3">
                      {validationResult.siswa.kelas} • NIS {validationResult.siswa.nis}
                    </p>

                    {/* Tanggal Presensi */}
                    {validationResult?.data?.absensiKelas?.tanggal && (
                      <div className="mt-4 pt-4 border-t border-emerald-300 text-center">
                        <p className="text-xs text-gray-600 mb-1">Tanggal Presensi</p>
                        <p className="text-lg font-bold text-emerald-700">
                          {new Date(validationResult.data.absensiKelas.tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {validationResult.siswa.alergi && validationResult.siswa.alergi.length > 0 && (
                      <div className="pt-3 border-t border-emerald-300">
                        <p className="text-xs text-gray-700">Alergi: {validationResult.siswa.alergi.join(", ")}</p>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-center text-gray-500 text-xs">Kembali otomatis dalam 5 detik...</p>
              </div>
            </div>
          )}
        </>
      )}
    </SekolahLayout>
  )
}

export default Presensi