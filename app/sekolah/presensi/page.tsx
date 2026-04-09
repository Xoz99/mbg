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
  User,
  Users2,
  AlertTriangle,
  Camera,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

// Skeleton Components
const SkeletonStatCard = () => (
  <div className="animate-pulse py-3">
    <div className="h-4 w-16 bg-slate-200 rounded mb-2" />
    <div className="h-7 w-12 bg-slate-200 rounded mb-1" />
    <div className="h-3 w-20 bg-slate-100 rounded" />
  </div>
)

const SkeletonKelasCard = () => (
  <div className="border border-gray-100 rounded-xl overflow-hidden animate-pulse">
    <div className="p-4 space-y-3">
      <div className="h-5 w-2/3 bg-slate-200 rounded" />
      <div className="h-4 w-1/3 bg-slate-100 rounded" />
      <div className="h-10 bg-slate-100 rounded mt-4" />
    </div>
  </div>
)

const Presensi = () => {
  const [step, setStep] = useState<
    "kelas-selection" | "camera-face" | "processing-face" | "confirm" | "submitting" | "result"
  >("kelas-selection")

  const [faceDetected, setFaceDetected] = useState(false)
  const [facePosition, setFacePosition] = useState<string>("")
  const [countdown, setCountdown] = useState(5)
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
    setCountdown(5)
    let count = 5

    countdownIntervalRef.current = setInterval(() => {
      count -= 1
      setCountdown(count)

      if (count <= 0) {
        stopCountdown()
        capturePhotoForValidation()
      }
    }, 1000)
  }

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(5)
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
    <div className="py-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {cachedData.kelasData.map((kelas: any) => (
                <div
                  key={kelas.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors"
                >
                  <div className="px-5 pt-5 pb-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Kelas: {kelas.nama || 'Kelas'}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Laki-laki</p>
                        <p className="text-xl font-bold text-gray-900">{kelas.lakiLaki || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Perempuan</p>
                        <p className="text-xl font-bold text-gray-900">{kelas.perempuan || 0}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Total Siswa</span>
                        <span className="font-medium text-gray-900">{kelas.totalSiswa || 0}</span>
                      </div>
                      {kelas.alergiCount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-red-500 text-xs">Alergi</span>
                          <span className="text-red-600 text-xs font-medium">{kelas.alergiCount} siswa</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-5 pb-4">
                    <button
                      onClick={() => handleKelasSelect(kelas)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-[#1B263A] text-[#1B263A] rounded-lg hover:bg-[#1B263A] hover:text-white transition-colors text-sm font-medium"
                    >
                      <Camera className="w-4 h-4" />
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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-6 gap-y-1 mb-8 border border-gray-100 rounded-xl p-5 bg-white">
            {loadingSelectedKelas ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <SkeletonStatCard key={i} />
                ))}
              </>
            ) : (
              <>
                <StatCard
                  title="Total Siswa"
                  value={stats.total}
                  subtitle="di kelas ini"
                  icon={Users}
                  color="text-[#1B263A]"
                />
                <StatCard
                  title="Laki-laki"
                  value={stats.lakiLaki}
                  subtitle="total siswa"
                  icon={User}
                  color="text-emerald-600"
                />
                <StatCard
                  title="Perempuan"
                  value={stats.perempuan}
                  subtitle="total siswa"
                  icon={User}
                  color="text-pink-600"
                />
              </>
            )}
          </div>

          {/* STEP: CAMERA FACE */}
          {step === "camera-face" && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {!cameraReady ? (
                <div className="p-12 text-center">
                  <div className="mb-8">
                    <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Camera className="w-10 h-10 text-gray-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Mulai Presensi Kamera</h2>
                    <p className="text-gray-600 text-sm mb-1">Sistem akan mendeteksi wajah siswa secara otomatis</p>
                    <p className="text-gray-500 text-xs">Pastikan wajah terlihat jelas dan pencahayaan cukup</p>
                  </div>

                  <button
                    onClick={() => setCameraReady(true)}
                    className="px-6 py-3 bg-[#1B263A] text-white rounded-xl hover:bg-[#2A3749] transition-colors font-medium text-sm flex items-center justify-center gap-2 mx-auto"
                  >
                    <Camera className="w-5 h-5" />
                    Mulai Kamera
                  </button>
                </div>
              ) : (
                <>
                  {/* Status Bar */}
                  <div className="bg-[#1B263A] px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-white">Kamera Aktif</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">FACE DETECT</span>
                  </div>

                  {/* Camera Container */}
                  <div className="relative bg-black overflow-hidden w-full h-[500px] md:h-[600px]">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Overlay Guide */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className={`w-64 h-64 border-2 rounded-full transition-all duration-300 ${
                          faceDetected
                            ? "border-emerald-400 scale-100"
                            : "border-gray-400 opacity-50 scale-95"
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
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                      {faceDetected && (
                        <div className="bg-emerald-500/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Terdeteksi
                        </div>
                      )}

                      {!faceDetected && facePosition && (
                        <div className="bg-amber-500/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                          {facePosition === "too-dark" && "Terlalu gelap"}
                          {facePosition === "too-bright" && "Terlalu terang"}
                        </div>
                      )}
                    </div>

                    {/* Instruction */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 w-full">
                      <div className="bg-gray-900/90 backdrop-blur text-white px-6 py-3 rounded-full text-sm font-medium">
                        {faceDetected ? "✓ Menangkap foto..." : "Posisikan wajah ke tengah"}
                      </div>

                      {!faceDetected && (
                        <button
                          onClick={(e) => { e.preventDefault(); capturePhotoForValidation(); }}
                          className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 py-2 rounded-lg text-xs font-bold transition-all border border-white/30 pointer-events-auto"
                        >
                          Ambil Foto Manual
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP: PROCESSING FACE */}
          {step === "processing-face" && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="mb-6">
                {facePhoto && (
                  <img
                    src={facePhoto || "/placeholder.svg"}
                    alt="Face"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 mx-auto"
                  />
                )}
              </div>
              <div className="flex justify-center mb-6">
                <Loader className="w-8 h-8 text-[#1B263A] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Memproses Wajah...</h2>
              <p className="text-sm text-gray-500">Mohon tunggu sebentar</p>
            </div>
          )}

          {/* STEP: CONFIRM */}
          {step === "confirm" && selectedSiswa && (
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm animate-in fade-in zoom-in duration-300">
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Wajah Dikenali</h2>
                </div>

                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{selectedSiswa.nama}</h3>
                  <div className="flex items-center justify-center gap-2 text-base text-gray-500 mb-10">
                    <span className="font-medium">{selectedSiswa.kelas}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="font-medium text-gray-400">NIS: {selectedSiswa.nis}</span>
                  </div>

                  <div className="flex justify-center items-center gap-8 md:gap-16">
                    <div className="relative group">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-3">Data Master</p>
                      <div className="relative">
                        {selectedSiswa.fotoUrl ? (
                          <img
                            src={selectedSiswa.fotoUrl || "/placeholder.svg"}
                            alt="Foto"
                            className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover bg-gray-50 border-2 border-white shadow-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                            <User className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="h-16 w-px bg-gradient-to-b from-transparent via-emerald-200 to-transparent"></div>
                    </div>

                    <div className="relative group">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-3">Scan Kamera</p>
                      <div className="relative">
                        {facePhoto && (
                          <img
                            src={facePhoto || "/placeholder.svg"}
                            alt="Foto Deteksi"
                            className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover bg-gray-50 border-2 border-white shadow-lg"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleReset()}
                    className="flex-1 px-6 py-4 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-all text-sm font-bold border border-gray-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => submitPresensi()}
                    className="flex-[1.5] px-6 py-4 bg-[#1B263A] text-white rounded-2xl hover:bg-[#2A3749] transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-[#1B263A]/20"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Konfirmasi Kehadiran
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
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden max-w-xl mx-auto shadow-sm">
              <div className="p-10 text-center">
                <div className="mb-8">
                  {validationResult?.success ? (
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                      <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {validationResult?.success ? "Presensi Berhasil!" : "Gagal Mencatat"}
                </h2>
                <p className="text-gray-500 mb-8">{validationResult?.message}</p>

                {validationResult?.success && validationResult?.siswa && (
                  <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50 text-left">
                    <p className="text-lg font-bold text-gray-900 mb-1">{validationResult.siswa.nama}</p>
                    <p className="text-sm text-gray-500">
                      {validationResult.siswa.kelas} <span className="mx-1.5">•</span> NIS {validationResult.siswa.nis}
                    </p>

                    {validationResult?.data?.absensiKelas?.tanggal && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Waktu Presensi</p>
                          <p className="font-semibold text-gray-800 text-sm">
                            {new Date(validationResult.data.absensiKelas.tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">
                          Selesai
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-10 flex flex-col items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-[#D0B064] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#D0B064] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-[#D0B064] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                  <p className="text-gray-400 text-xs font-medium">Melanjutkan otomatis dalam beberapa detik...</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </SekolahLayout>
  )
}

export default Presensi