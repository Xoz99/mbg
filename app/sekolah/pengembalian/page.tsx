"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { useSekolahDataCache } from "@/lib/hooks/useSekolahDataCache"
import { AlertCircle, CheckCircle, CheckCircle2, Loader, Sparkles, XCircle, Camera, RefreshCw, Nfc, User, Users, School } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

const PengembalianMakanan = () => {
  const [authToken, setAuthToken] = useState("")
  const [sekolahId, setSekolahId] = useState("")
  const [credentialsReady, setCredentialsReady] = useState(false)

  // Cache data state
  const [siswaData, setSiswaData] = useState<Array<any>>([])
  const [kelasData, setKelasData] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)

  // Step management
  const [step, setStep] = useState<"camera-face" | "processing-face" | "rfid-scan" | "camera-food" | "keterangan" | "submitting" | "result">("camera-face")

  // Face detection
  const [faceDetected, setFaceDetected] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [facePhoto, setFacePhoto] = useState<string | null>(null)
  const [foodPhoto, setFoodPhoto] = useState<string | null>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null)

  // Food detection
  const [foodConditionOk, setFoodConditionOk] = useState(false)
  const [foodCondition, setFoodCondition] = useState<string>("")
  const [foodCountdown, setFoodCountdown] = useState(5)
  const [isFoodCountdownActive, setIsFoodCountdownActive] = useState(false)
  const [isPreparationActive, setIsPreparationActive] = useState(false)
  const [preparationCountdown, setPreparationCountdown] = useState(5)

  // RFID & Keterangan
  const [isScanning, setIsScanning] = useState(false)
  const [trayId, setTrayId] = useState("")
  const [keterangan, setKeterangan] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const [statusMakanan, setStatusMakanan] = useState<"habis" | "tidak_habis">("habis")

  const [validationResult, setValidationResult] = useState<any>(null)

  // State Refs to avoid stale closures in intervals
  const trayIdRef = useRef(trayId)
  const stepRef = useRef(step)

  useEffect(() => { trayIdRef.current = trayId }, [trayId])
  useEffect(() => { stepRef.current = step }, [step])

  // Camera Management
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const rfidPollingRef = useRef<NodeJS.Timeout | null>(null)
  const foodDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const foodCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const preparationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize credentials
  useEffect(() => {
    if (typeof window === "undefined") return
    if (credentialsReady) return

    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const schoolId = localStorage.getItem("sekolahId")

    if (!token) {
      setError("Token tidak ditemukan")
      return
    }

    if (schoolId) {
      setAuthToken(token)
      setSekolahId(schoolId)
      setCredentialsReady(true)
      return
    }

    const pollInterval = setInterval(() => {
      const newSchoolId = localStorage.getItem("sekolahId")
      if (newSchoolId) {
        setAuthToken(token)
        setSekolahId(newSchoolId)
        clearInterval(pollInterval)
        setCredentialsReady(true)
      }
    }, 1000)

    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      setError("Sekolah ID tidak ditemukan. Silakan login kembali.")
    }, 10000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [credentialsReady])

  // Data Loading Logic
  const handleCacheUpdate = useCallback((cachedData: any) => {
    setSiswaData(cachedData.siswaData || [])
    setKelasData(cachedData.kelasData || [])
  }, [])

  const { loadData } = useSekolahDataCache(handleCacheUpdate)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!credentialsReady || !authToken || !sekolahId || hasInitialized.current) return

    const fetchAllData = async () => {
      try {
        hasInitialized.current = true
        const cachedData = await loadData(sekolahId, authToken)
        if (cachedData) {
          setSiswaData(cachedData.siswaData || [])
          setKelasData(cachedData.kelasData || [])
          setError(null)
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError(err instanceof Error ? err.message : "Gagal mengambil data")
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchAllData()
  }, [credentialsReady, authToken, sekolahId, loadData])

  const stats = useMemo(() => {
    const total = siswaData.length
    const lakiLaki = siswaData.filter((s) => s.jenisKelamin === "LAKI_LAKI").length
    const perempuan = siswaData.filter((s) => s.jenisKelamin === "PEREMPUAN").length
    const uniqueKelas = new Set(siswaData.map((s) => s.kelas).filter((k) => k))
    const totalKelas = uniqueKelas.size

    return { total, lakiLaki, perempuan, totalKelas }
  }, [siswaData])

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="py-1">
      <div className="flex items-center gap-2 mb-0.5">
        <Icon className={`w-3 h-3 ${color}`} />
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <p className="text-lg font-bold text-gray-900 mb-0">{value}</p>
      <p className="text-[10px] text-gray-400">{subtitle}</p>
    </div>
  )

  // Enumerate cameras on mount
  useEffect(() => {
    const enumerateCameras = async () => {
      try {
        // First try to get permission by calling getUserMedia once
        const stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((device) => device.kind === "videoinput")
        setAvailableCameras(videoDevices)

        // Pick the best default camera (prefer one that might be 'user' or just the first one)
        if (videoDevices.length > 0) {
          const stored = localStorage.getItem("preferred_camera_id");
          if (stored && videoDevices.some(d => d.deviceId === stored)) {
            setSelectedCameraId(stored);
          } else {
            setSelectedCameraId(videoDevices[0].deviceId)
          }
        }
      } catch (err) {
        console.error("Error enumerating cameras:", err)
      }
    }
    enumerateCameras()
  }, [])

  const switchCamera = () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex(d => d.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextId = availableCameras[nextIndex].deviceId;
    setSelectedCameraId(nextId);
    localStorage.setItem("preferred_camera_id", nextId);

    // Restart camera if active
    if (isCameraActive) {
      stopCamera();
      // useEffect will restart it
    }
  };

  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(5)
  }, [])

  const stopFaceDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    stopCountdown()
    setFaceDetected(false)
  }, [stopCountdown])

  const stopFoodCountdown = useCallback(() => {
    if (foodCountdownIntervalRef.current) {
      clearInterval(foodCountdownIntervalRef.current)
      foodCountdownIntervalRef.current = null
    }
    setIsFoodCountdownActive(false)
    setFoodCountdown(5)
  }, [])

  const stopFoodDetection = useCallback(() => {
    if (foodDetectionIntervalRef.current) {
      clearInterval(foodDetectionIntervalRef.current)
      foodDetectionIntervalRef.current = null
    }
    setFoodConditionOk(false)
    setFoodCondition("")
  }, [])

  const stopPreparationCountdown = useCallback(() => {
    if (preparationIntervalRef.current) {
      clearInterval(preparationIntervalRef.current)
      preparationIntervalRef.current = null
    }
    setIsPreparationActive(false)
    setPreparationCountdown(5)
  }, [])

  const stopCamera = useCallback(() => {
    stopFaceDetection()
    stopFoodDetection()
    stopFoodCountdown()
    stopPreparationCountdown()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }, [stopFaceDetection, stopFoodDetection, stopFoodCountdown, stopPreparationCountdown])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      const photoData = canvas.toDataURL("image/jpeg", 0.8)
      if (step === "camera-face") {
        setFacePhoto(photoData)
        stopCamera()
        // Start validation after stop camera to prevent state conflict
        setTimeout(() => validateFace(photoData), 100)
      } else if (step === "camera-food") {
        setFoodPhoto(photoData)
        stopCamera()
        setStep("keterangan")
      }
    }
  }, [step, stopCamera])

  const startCountdown = useCallback(() => {
    setCountdown(5)
    let count = 5
    countdownIntervalRef.current = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count <= 0) {
        stopCountdown()
        capturePhoto()
      }
    }, 1000)
  }, [stopCountdown, capturePhoto])

  const startFaceDetection = useCallback(() => {
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
        totalBrightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
      }
      const avgBrightness = totalBrightness / (imageData.data.length / 4)

      if (avgBrightness > 60 && avgBrightness < 200) {
        setFaceDetected(true)
        if (!countdownIntervalRef.current) startCountdown()
      } else {
        setFaceDetected(false)
        stopCountdown()
      }
    }, 200)
  }, [step, startCountdown, stopCountdown])

  const startFoodCountdown = useCallback(() => {
    setIsFoodCountdownActive(true)
    setFoodCountdown(5)
    let count = 5
    foodCountdownIntervalRef.current = setInterval(() => {
      count -= 1
      setFoodCountdown(count)
      if (count <= 0) {
        stopFoodCountdown()
        capturePhoto()
      }
    }, 1000)
  }, [stopFoodCountdown, capturePhoto])

  const startFoodDetection = useCallback(() => {
    foodDetectionIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || step !== "camera-food") return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })

      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const regionSize = 150
      const imageData = ctx.getImageData(centerX - regionSize, centerY - regionSize, regionSize * 2, regionSize * 2)

      let totalBrightness = 0
      for (let i = 0; i < imageData.data.length; i += 4) {
        totalBrightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
      }
      const avgBrightness = totalBrightness / (imageData.data.length / 4)

      if (avgBrightness > 60 && avgBrightness < 200) {
        setFoodConditionOk(true)
        setFoodCondition("ok")
        if (!foodCountdownIntervalRef.current) startFoodCountdown()
      } else {
        setFoodConditionOk(false)
        setFoodCondition(avgBrightness < 60 ? "too-dark" : "too-bright")
        stopFoodCountdown()
      }
    }, 200)
  }, [step, startFoodCountdown, stopFoodCountdown])

  const startPreparationCountdown = useCallback(() => {
    setIsPreparationActive(true)
    setPreparationCountdown(5)
    let count = 5
    preparationIntervalRef.current = setInterval(() => {
      count -= 1
      setPreparationCountdown(count)
      if (count <= 0) {
        stopPreparationCountdown()
        startFoodDetection()
      }
    }, 1000)
  }, [stopPreparationCountdown, startFoodDetection])

  const startCamera = async (facingMode: "user" | "environment" = "user", deviceId?: string) => {
    try {
      setIsCameraActive(true)
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? {
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
          : {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        videoRef.current.onloadedmetadata = () => {
          if (stepRef.current === "camera-face") {
            startFaceDetection()
          } else if (stepRef.current === "camera-food") {
            startPreparationCountdown()
          }
        }

        // Ensure play is called
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      }
    } catch (err: any) {
      console.error("Error starting camera:", err)
      setIsCameraActive(false)
      setCameraError(err.message || "Gagal mengakses kamera")
    }
  }

  const validateFace = async (facePhotoData: string) => {
    setStep("processing-face")
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
      if (!token) throw new Error("Token autentikasi tidak ditemukan.")

      const fotoBlob = await fetch(facePhotoData).then((r) => r.blob())
      const fotoFile = new File([fotoBlob], "foto.jpg", { type: "image/jpeg" })

      const formDataFace = new FormData()
      formDataFace.append("foto", fotoFile)

      const response = await fetch(`${API_BASE_URL}/api/face-recognition/detect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataFace,
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Wajah tidak dikenali")

      const detectedSiswa = result.data?.siswa || result.siswa || result.data || result

      // BACKUP: If backend didn't return pickupInfo, try to fetch it manually
      if (detectedSiswa && !detectedSiswa.pickupInfo) {
        try {
          const todayStr = new Date().toISOString().split('T')[0]
          const pickupResponse = await fetch(`${API_BASE_URL}/api/pengambilan-makanan?siswaId=${detectedSiswa.siswaId || detectedSiswa.id}&tanggal=${todayStr}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (pickupResponse.ok) {
            const pickupResult = await pickupResponse.json()
            const pickups = pickupResult.data?.data || pickupResult.data || []
            if (pickups.length > 0) {
              // Use the latest pickup from today
              detectedSiswa.pickupInfo = {
                id: pickups[0].id,
                idTray: pickups[0].idTray,
                tanggalPengambilan: pickups[0].tanggalPengambilan
              }
            }
          }
        } catch (fetchErr) {
          console.error("Failed to fetch backup pickup info:", fetchErr)
        }
      }

      if (detectedSiswa && (detectedSiswa.siswaId || detectedSiswa.id)) {
        let alergiArray: string[] = []
        if (detectedSiswa.alergi) {
          if (Array.isArray(detectedSiswa.alergi)) {
            alergiArray = detectedSiswa.alergi.map((a: any) => typeof a === "string" ? a : String(a.namaAlergi || a.nama || a)).filter((a: string) => a.trim())
          } else if (typeof detectedSiswa.alergi === "string") {
            alergiArray = detectedSiswa.alergi.split(",").map((a: string) => a.trim()).filter((a: string) => a)
          }
        }

        let fotoUrl = detectedSiswa.fotoUrl || detectedSiswa.foto || detectedSiswa.fotoSiswa || ""
        if (fotoUrl && !fotoUrl.startsWith("data:") && !fotoUrl.startsWith("http")) fotoUrl = `${API_BASE_URL}${fotoUrl}`

        setSelectedSiswa({
          ...detectedSiswa,
          id: detectedSiswa.siswaId || detectedSiswa.id,
          kelas: typeof detectedSiswa.kelas === "object" ? detectedSiswa.kelas.nama : detectedSiswa.kelas,
          alergi: alergiArray,
          fotoUrl: fotoUrl,
        })
        setStep("rfid-scan")
      } else {
        throw new Error("Siswa tidak ditemukan.")
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memproses wajah.")
      setFacePhoto(null)
      setStep("camera-face")
    }
  }

  const handleReset = useCallback(() => {
    stopCamera()
    setFacePhoto(null)
    setFoodPhoto(null)
    setSelectedSiswa(null)
    setValidationResult(null)
    setKeterangan("")
    setTrayId("")
    setShowManualInput(false)
    setCameraReady(false)
    setStep("camera-face")
  }, [stopCamera])

  const submitPengembalian = async () => {
    if (!selectedSiswa || !facePhoto || !foodPhoto || !trayId.trim()) return
    setStep("submitting")
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
      const foodBlob = await fetch(foodPhoto).then((r) => r.blob())
      const foodFile = new File([foodBlob], "foto-makanan.jpg", { type: "image/jpeg" })

      const fd = new FormData()
      fd.append("siswaId", selectedSiswa.id)
      fd.append("idTray", trayId)
      fd.append("fotoSisaMakanan", foodFile)
      fd.append("status", statusMakanan)
      if (keterangan.trim()) fd.append("keterangan", keterangan)

      const response = await fetch(`${API_BASE_URL}/api/pengembalian-makanan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Gagal submit")

      setValidationResult({ success: true, message: "Berhasil dicatat!", siswa: selectedSiswa })
      setStep("result")
      setTimeout(handleReset, 5000)
    } catch (err) {
      setValidationResult({ success: false, message: err instanceof Error ? err.message : "Terjadi kesalahan" })
      setStep("result")
      setTimeout(handleReset, 5000)
    }
  }

  const stopRfidPolling = useCallback(() => {
    if (rfidPollingRef.current) clearInterval(rfidPollingRef.current)
    setIsScanning(false)
  }, [])

  const startRfidPolling = useCallback(() => {
    setIsScanning(true)
    let lastDetectedRfid = ""

    // Prevent multiple intervals
    if (rfidPollingRef.current) clearInterval(rfidPollingRef.current)

    rfidPollingRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
        const response = await fetch(`${API_BASE_URL}/api/rfid/latest`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          const result = await response.json()
          const detectedTrayId = result.data?.uid || result.uid || result.trayId
          if (detectedTrayId) {
            const formatted = String(detectedTrayId).toUpperCase()

            // Critical Safety Checks:
            // 1. If we are no longer in the RFID scan step, STOP everything.
            if (stepRef.current !== "rfid-scan") {
              stopRfidPolling()
              return
            }

            // 2. If the state already has this ID, don't update/log again.
            if (formatted === trayIdRef.current) return;

            if (formatted !== lastDetectedRfid) {
              lastDetectedRfid = formatted

              // Validate against pickup info if available
              if (selectedSiswa?.pickupInfo && formatted !== selectedSiswa.pickupInfo.idTray) {
                if (!window.confirm(`Tray ID (${formatted}) tidak cocok dengan data pengambilan siswa ini (${selectedSiswa.pickupInfo.idTray}). Proses tetap dilanjutkan?`)) {
                  lastDetectedRfid = ""
                  return;
                }
              }

              setTrayId(formatted)
              stopRfidPolling()
              setStep("camera-food")
            }
          }
        }
      } catch (err) { }
    }, 500)
  }, [trayId])

  useEffect(() => {
    if (step === "camera-face" && !isCameraActive && cameraReady) {
      startCamera("user", selectedCameraId)
    } else if (step === "camera-food" && !isCameraActive) {
      if (selectedCameraId) {
        startCamera("environment", selectedCameraId)
      } else {
        startCamera("environment")
      }
    }

    return () => {
      stopCamera()
    }
  }, [step, selectedCameraId, cameraReady])

  useEffect(() => {
    if (step === "rfid-scan") {
      startRfidPolling()
    } else {
      stopRfidPolling()
    }
    return () => stopRfidPolling()
  }, [step, startRfidPolling, stopRfidPolling])

  return (
    <SekolahLayout currentPage="pengembalian">
      <div className="mb-4 pt-1">
        <h1 className="text-2xl font-bold text-gray-900">Pengembalian Makanan</h1>
        <p className="text-gray-600 mt-0.5 text-xs">Deteksi wajah & pilih status makanan</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mb-4 border border-gray-100 rounded-xl p-3 bg-white">
        <StatCard
          title="Total Siswa"
          value={stats.total}
          subtitle="terdaftar"
          icon={Users}
          color="text-[#1B263A]"
        />

        <StatCard
          title="Laki-laki"
          value={stats.lakiLaki}
          subtitle="siswa"
          icon={User}
          color="text-emerald-600"
        />
        <StatCard
          title="Perempuan"
          value={stats.perempuan}
          subtitle="siswa"
          icon={User}
          color="text-pink-600"
        />
        <StatCard
          title="Total Kelas"
          value={stats.totalKelas}
          subtitle="aktif"
          icon={School}
          color="text-amber-500"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <p className="text-xs font-semibold text-red-900">{error}</p>
        </div>
      )}

      {step === "camera-face" && (
        <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden mx-auto shadow-sm">
          {!cameraReady ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Camera className="w-10 h-10 text-[#1B263A]" />
              </div>
              <h2 className="text-xl font-bold mb-2">Scan Wajah</h2>
              <p className="text-gray-500 text-xs mb-6">Posisikan wajah di depan kamera</p>
              <button
                onClick={() => setCameraReady(true)}
                className="px-8 py-3 bg-[#1B263A] text-white rounded-xl font-bold text-sm mx-auto flex items-center gap-2 hover:bg-[#2A3749] transition-all"
              >
                Mulai Scan
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
              <div className="relative bg-black overflow-hidden w-full h-[350px] md:h-[450px]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-64 h-64 border-2 rounded-full transition-all duration-300 ${faceDetected ? "border-emerald-400 scale-100" : "border-gray-500 opacity-50 scale-95"}`}>
                    {faceDetected && countdown > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-6xl font-bold animate-pulse">{countdown}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  {faceDetected && (
                    <div className="bg-emerald-500/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Terdeteksi
                    </div>
                  )}
                </div>

                <div className="absolute top-4 left-4 flex gap-2">
                  {availableCameras.length > 1 && (
                    <button onClick={switchCamera} className="p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all font-bold text-xs" title="Switch Camera">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={handleReset} className="p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all" title="Reset">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                {cameraError && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/80 backdrop-blur px-6 py-4 rounded-2xl text-white text-center shadow-xl border border-red-500/50">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-bold text-sm">Error Kamera</p>
                    <p className="text-[10px] opacity-90 mt-1 mb-4">{cameraError}</p>
                    <button onClick={() => { setCameraError(null); startCamera("user", selectedCameraId); }} className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold text-xs">
                      Coba Lagi
                    </button>
                  </div>
                )}

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full">
                  <div className="bg-black/60 backdrop-blur px-6 py-3 rounded-full text-white text-sm font-medium">
                    {faceDetected ? "✓ Menangkap foto..." : "Posisikan wajah ke tengah"}
                  </div>

                  {!faceDetected && (
                    <button
                      onClick={(e) => { e.preventDefault(); capturePhoto(); }}
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

      {step === "processing-face" && (
        <div className="w-full bg-white rounded-xl border border-gray-100 p-12 text-center mx-auto shadow-sm">
          {facePhoto && <img src={facePhoto} className="w-24 h-24 rounded-full mx-auto mb-6 object-cover border-4 border-gray-100 shadow-sm transform scale-x-[-1]" />}
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-[#1B263A]" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Mengenali Wajah...</h2>
          <p className="text-gray-500 text-sm">Menganalisis data biometric</p>
        </div>
      )}

      {/* STEP 3: RFID SCAN */}
      {step === "rfid-scan" && selectedSiswa && (
        <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden mx-auto">
          <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">Wajah Dikenali</span>
            </div>
          </div>

          <div className="p-4">
            <div className="text-center border border-gray-100 bg-gray-50 rounded-xl p-3 mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedSiswa.nama}</h3>
              <p className="text-sm text-gray-500 mb-1">{selectedSiswa.kelas?.nama}</p>
              <p className="text-xs text-gray-400 mb-4">NIS: {selectedSiswa.nis}</p>

              <div className="flex justify-center items-center gap-6 my-4">
                <div>
                  {selectedSiswa.fotoSiswa ? (
                    <img
                      src={selectedSiswa.fotoSiswa || "/placeholder.svg"}
                      alt="Foto"
                      className="w-20 h-20 rounded-lg object-cover bg-white border border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Foto Data Base</p>
                </div>

                <div className="flex items-center gap-2 text-emerald-500">
                  <div className="w-4 h-px bg-emerald-200"></div>
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <div className="w-4 h-px bg-emerald-200"></div>
                </div>

                <div>
                  {facePhoto && (
                    <img
                      src={facePhoto || "/placeholder.svg"}
                      alt="Deteksi"
                      className="w-20 h-20 rounded-lg object-cover bg-white border border-gray-200"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-2">Deteksi</p>
                </div>
              </div>

              {!selectedSiswa.pickupInfo && (
                <div className="mt-4 inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-tight">BELUM ABSEN PENERIMA</span>
                </div>
              )}
            </div>

            {!selectedSiswa.pickupInfo ? (
              <div className="text-center mb-4">
                <button onClick={handleReset} className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  Coba Siswa Lain
                </button>
              </div>
            ) : !showManualInput ? (
              <>
                {/* RFID Scan Section */}
                <div className="text-center mb-6">
                  <div className="relative w-32 h-32 mx-auto mb-6 bg-white rounded-full flex flex-col items-center justify-center border-2 border-gray-100 shadow-xl shadow-gray-100/50">
                    {isScanning && (
                      <div className="absolute inset-0 border border-[#1B263A] rounded-full animate-ping opacity-20"></div>
                    )}
                    <Nfc className="w-8 h-8 text-[#1B263A]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Tempelkan RFID Tray</h3>
                  <p className="text-gray-500 text-xs">Dekatkan tray ke pembaca RFID</p>

                  {isScanning && (
                    <div className="mt-4 flex justify-center items-center gap-2">
                      <Loader className="w-4 h-4 text-[#1B263A] animate-spin" />
                      <span className="text-sm text-[#1B263A] font-medium">Menunggu scan...</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowManualInput(true)}
                  className="w-full text-center py-2 text-gray-500 hover:text-gray-900 transition-colors text-xs underline"
                >
                  Input tray manual
                </button>
              </>
            ) : (
              <div className="w-full">
                <div className="bg-[#1B263A] px-5 py-3 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <Nfc className="w-4 h-4 text-white" />
                    <span className="text-sm font-semibold text-white">MASUKKAN ID TRAY</span>
                  </div>
                </div>
                <div className="p-6 border border-gray-100 rounded-b-xl">
                  {trayId && selectedSiswa.pickupInfo?.idTray && trayId !== selectedSiswa.pickupInfo.idTray && (
                    <div className="mb-4 bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <p className="text-xs text-orange-700 font-bold">Tray Tidak Cocok! (Harusnya: {selectedSiswa.pickupInfo.idTray})</p>
                    </div>
                  )}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID TRAY</label>
                    <input
                      type="text"
                      value={trayId}
                      onChange={(e) => setTrayId(e.target.value.toUpperCase())}
                      placeholder="Contoh: TRAY001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#1B263A] focus:border-[#1B263A] font-mono text-lg transition-all"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowManualInput(false)
                        setTrayId("")
                      }}
                      className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        if (trayId.trim()) {
                          if (trayId !== selectedSiswa.pickupInfo?.idTray) {
                            if (!confirm(`Tray ID tidak cocok dengan data pengambilan (${selectedSiswa.pickupInfo?.idTray}). Tetap lanjutkan?`)) {
                              return;
                            }
                          }
                          stopRfidPolling()
                          setStep("camera-food")
                        }
                      }}
                      disabled={!trayId.trim()}
                      className="px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      Lanjut
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === "camera-food" && (
        <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Status Bar */}
          <div className="bg-[#1B263A] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-white">Kamera Aktif</span>
            </div>

            <div className="flex items-center gap-3">
              {availableCameras.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value)
                      localStorage.setItem("preferred_camera_id", e.target.value)
                      stopCamera()
                      // useEffect restarts it
                    }}
                    className="px-3 py-1.5 border border-gray-600 bg-gray-800 text-white rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                  >
                    {availableCameras.map((camera, index) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="bg-white/10 px-3 py-1 rounded text-[10px] font-mono text-white/70">
                TRAY: {trayId}
              </div>
            </div>
          </div>

          {/* Camera View */}
          <div className="relative bg-black h-[350px] md:h-[450px] overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlays */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-96 h-64 border-2 rounded-xl transition-all duration-300 ${isPreparationActive ? "border-blue-400 scale-100" : foodConditionOk ? "border-emerald-400 scale-100" : "border-gray-500 opacity-50 scale-95"}`}>
                {isPreparationActive && preparationCountdown > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="text-white text-8xl font-bold animate-pulse">{preparationCountdown}</div>
                    <div className="text-white text-xs font-semibold bg-black/60 px-4 py-2 rounded-lg backdrop-blur">
                      Persiapan Frame
                    </div>
                  </div>
                )}
                {isFoodCountdownActive && foodCountdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-9xl font-bold animate-pulse">{foodCountdown}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Instruction */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 w-full">
              <div className="bg-gray-900/90 backdrop-blur text-white px-6 py-3 rounded-full text-sm font-medium">
                {isPreparationActive ? "Mempersiapkan kamera..." : foodConditionOk ? "✓ Menangkap foto..." : "Arahkan kamera ke sisa makanan"}
              </div>
              
              {!isPreparationActive && (
                <button
                  onClick={capturePhoto}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 py-2 rounded-lg text-xs font-bold transition-all border border-white/30 pointer-events-auto"
                >
                  Ambil Foto Manual
                </button>
              )}
            </div>
            
            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={handleReset}
                className="p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all font-bold text-xs" 
                title="Reset"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "keterangan" && selectedSiswa && (
        <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden mx-auto shadow-sm">
          <div className="bg-[#1B263A] px-4 py-3 text-white">
            <h3 className="font-bold text-sm">Status Pengembalian</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
              {foodPhoto && <img src={foodPhoto} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />}
              <div>
                <h4 className="font-bold text-[#1B263A]">{selectedSiswa.nama}</h4>
                <p className="text-xs text-gray-500">TRAY ID: {trayId}</p>
              </div>
            </div>

            <p className="text-xs font-bold text-[#1B263A] mb-3 uppercase tracking-wider">Kondisi Makanan</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setStatusMakanan("habis")}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-2 ${statusMakanan === "habis" ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md ring-4 ring-emerald-500/10" : "bg-white border-gray-100 text-gray-400 hover:border-emerald-200"}`}
              >
                <CheckCircle2 className={`w-8 h-8 ${statusMakanan === "habis" ? "text-emerald-500" : "text-gray-200"}`} />
                <span className="font-bold text-sm">Habis</span>
              </button>
              <button
                onClick={() => setStatusMakanan("tidak_habis")}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-2 ${statusMakanan === "tidak_habis" ? "bg-amber-50 border-amber-500 text-amber-700 shadow-md ring-4 ring-amber-500/10" : "bg-white border-gray-100 text-gray-400 hover:border-amber-200"}`}
              >
                <AlertCircle className={`w-8 h-8 ${statusMakanan === "tidak_habis" ? "text-amber-500" : "text-gray-200"}`} />
                <span className="font-bold text-sm">Tersisa</span>
              </button>
            </div>

            <p className="text-xs font-bold text-[#1B263A] mb-3 uppercase tracking-wider">Catatan Tambahan</p>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Berikan alasan jika makanan bersisa..."
              className="w-full p-4 border border-gray-200 rounded-2xl text-sm mb-6 outline-none focus:ring-2 focus:ring-[#1B263A]/10 focus:border-[#1B263A] transition-all resize-none"
              rows={3}
            />
            <button onClick={submitPengembalian} className="w-full py-4 bg-[#1B263A] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:bg-[#2A3749] transition-all transform active:scale-[0.98]">Simpan Data</button>
          </div>
        </div>
      )}

      {step === "submitting" && (
        <div className="w-full bg-white rounded-xl border border-gray-100 p-16 text-center mx-auto shadow-sm">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-6 text-[#1B263A]" />
          <h2 className="text-xl font-bold text-[#1B263A] mb-2">Menyimpan Informasi</h2>
          <p className="text-gray-500 text-sm">Sedang memproses data pengembalian...</p>
        </div>
      )}

      {step === "result" && (
        <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden mx-auto shadow-sm">
          <div className={`p-12 text-center ${validationResult?.success ? "bg-emerald-50" : "bg-red-50"}`}>
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${validationResult?.success ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
              {validationResult?.success ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
            </div>
            <h2 className="font-black text-2xl text-[#1B263A] mb-2">{validationResult?.success ? "Berhasil Disimpan!" : "Gagal Menyimpan"}</h2>
            <p className="text-sm font-medium text-gray-600 mb-8 max-w-xs mx-auto">{validationResult?.message}</p>
            <button onClick={handleReset} className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all">Kembali</button>
          </div>
        </div>
      )}
    </SekolahLayout>
  )
}

export default PengembalianMakanan
