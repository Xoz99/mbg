"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { useSekolahDataCache } from "@/lib/hooks/useSekolahDataCache"
import { Users, Loader, Camera, CheckCircle, School, X, CheckCircle2, Hash, XCircle, Sparkles, Zap, AlertTriangle, User, Users2, RefreshCw } from "lucide-react"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demombgv1.xyz"

const AbsensiPenerima = () => {
  const [step, setStep] = useState<
    "camera-face" | "processing-face" | "rfid-scan" | "input-tray" | "confirm" | "camera-menu" | "submitting" | "result" | "duplicate-warning"
  >("camera-face") 
  const [faceDetected, setFaceDetected] = useState(false)
  const [facePosition, setFacePosition] = useState<string>("") // 'too-dark', 'too-bright'
  const [countdown, setCountdown] = useState(3)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [facePhoto, setFacePhoto] = useState<string | null>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null) // { nama, kelas, nis, alergi }
  const [isScanning, setIsScanning] = useState(false)
  const [trayId, setTrayId] = useState("")
  const [menuPhoto, setMenuPhoto] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null) // { success: boolean, message: string, siswa?: any }

  const [authToken, setAuthToken] = useState("")
  const [sekolahId, setSekolahId] = useState("")
  const [credentialsReady, setCredentialsReady] = useState(false)
  const [siswaData, setSiswaData] = useState<Array<any>>([])
  const [kelasData, setKelasData] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [absensiData, setAbsensiData] = useState<Array<any>>([]) // Tracking siswa yang sudah absen
  const [isDuplicate, setIsDuplicate] = useState(false) // Flag untuk duplicate warning
  const [duplicateSiswaInfo, setDuplicateSiswaInfo] = useState<any>(null) // Info siswa yang sudah absen
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]) // List semua kamera yang tersedia
  const [selectedCameraId, setSelectedCameraId] = useState<string>("") // ID kamera yang dipilih
  const [menuCountdown, setMenuCountdown] = useState(3) // Countdown untuk auto-capture foto makanan
  const [isMenuCountdownActive, setIsMenuCountdownActive] = useState(false) // Flag untuk countdown aktif
  const [foodConditionOk, setFoodConditionOk] = useState(false) // Flag kondisi foto makanan OK
  const [foodCondition, setFoodCondition] = useState<string>("") // Status kondisi: 'too-dark', 'too-bright', 'ok'

  // ✅ Callback ketika unified cache ter-update dari page lain (instant sync!)
  const handleCacheUpdate = useCallback((cachedData: any) => {
    console.log("🔄 [ABSENSI] Received cache update - updating siswa state instantly!")
    setSiswaData(cachedData.siswaData || [])
    setKelasData(cachedData.kelasData || [])
  }, [])

  const { loadData, refreshData } = useSekolahDataCache(handleCacheUpdate)

  const hasInitialized = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const rfidPollingRef = useRef<NodeJS.Timeout | null>(null)
  const menuCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const foodDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================
  // INITIALIZATION HOOKS
  // ============================================
  // ✅ EFFECT 1: Wait for sekolahId to be available
  useEffect(() => {
    if (typeof window === "undefined") return
    if (credentialsReady) return // Skip if already ready

    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const schoolId = localStorage.getItem("sekolahId")

    console.log("[ABSENSI] Check credentials - token:", token ? "EXISTS" : "MISSING", "schoolId:", schoolId ? "EXISTS" : "MISSING")

    if (!token) {
      console.error("[ABSENSI] ❌ Token not found")
      setError("Token tidak ditemukan")
      return
    }

    if (schoolId) {
      setAuthToken(token)
      setSekolahId(schoolId)
      // Both credentials are ready!
      console.log("[ABSENSI] ✅ Both credentials ready, setting flag")
      setCredentialsReady(true)
      return
    }

    // sekolahId not ready, set up polling
    console.log("[ABSENSI] sekolahId not ready, waiting for SekolahLayout...")
    const pollInterval = setInterval(() => {
      const newSchoolId = localStorage.getItem("sekolahId")
      if (newSchoolId) {
        console.log("[ABSENSI] ✅ sekolahId detected:", newSchoolId)
        setAuthToken(token)
        setSekolahId(newSchoolId)
        clearInterval(pollInterval)
        setCredentialsReady(true) // This will trigger EFFECT 2
      }
    }, 1000)

    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      console.error("[ABSENSI] ❌ sekolahId timeout after 10s")
      setError("Sekolah ID tidak ditemukan. Silakan login kembali.")
    }, 10000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [credentialsReady])

  // ✅ EFFECT 2: Fetch data when credentials are ready
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!credentialsReady) {
      console.log("[ABSENSI EFFECT 2] Waiting for credentialsReady flag...")
      return
    }

    if (!authToken || !sekolahId) {
      console.error("[ABSENSI EFFECT 2] ❌ Missing credentials even though flag is true!")
      return
    }

    if (hasInitialized.current) {
      console.log("[ABSENSI EFFECT 2] Already initialized, skipping")
      return
    }

    const fetchAllData = async () => {
      try {
        hasInitialized.current = true
        const cachedData = await loadData(sekolahId, authToken)

        if (cachedData) {
          setSiswaData(cachedData.siswaData || [])
          setKelasData(cachedData.kelasData || [])
          setError(null)
          console.log("✅ [ABSENSI] Data loaded successfully")
        }
      } catch (err) {
        console.error("❌ [ABSENSI] Error loading data:", err)
        setError(err instanceof Error ? err.message : "Gagal mengambil data")
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchAllData()
  }, [credentialsReady, authToken, sekolahId, loadData])

  // Enumerate cameras on mount
  useEffect(() => {
    enumerateCameras()
  }, [])

  useEffect(() => {
    if (step === "camera-face" && !isCameraActive) {
      startCamera("user")
    } else if (step === "camera-menu" && !isCameraActive) {
      // Re-enumerate cameras saat masuk step camera-menu untuk ensure terdeteksi
      enumerateCameras()

      // Untuk foto makanan, gunakan selectedCameraId jika ada
      if (selectedCameraId) {
        startCamera("environment", selectedCameraId)
      } else {
        startCamera("environment")
      }
    }

    return () => {
      stopCamera()
      stopFaceDetection()
    }
  }, [step, selectedCameraId])

  const stats = useMemo(() => {
    const total = siswaData.length
    const lakiLaki = siswaData.filter((s) => s.jenisKelamin === "LAKI_LAKI").length
    const perempuan = siswaData.filter((s) => s.jenisKelamin === "PEREMPUAN").length
    const uniqueKelas = new Set(siswaData.map((s) => s.kelas).filter((k) => k))
    const totalKelas = uniqueKelas.size
    const sudahAbsen = absensiData.length

    return { total, lakiLaki, perempuan, totalKelas, sudahAbsen }
  }, [siswaData, absensiData])

  // ✅ EFFECT 3: Setup listener untuk auto-reload dari unified cache (other tabs/windows)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!credentialsReady) return

    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const schoolId = localStorage.getItem("sekolahId")

    if (!token || !schoolId) return

    // Listen untuk cache updates dari unified hook (other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sekolah_unified_cache" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          // Update state dengan unified cache terbaru
          setSiswaData(data.siswaData || [])
          setKelasData(data.kelasData || [])
          console.log("✅ [UNIFIED SYNC] Auto-synced from another tab/window")
        } catch (err) {
          console.error("Error parsing unified cache:", err)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [credentialsReady])

  const fetchAbsensiToday = useCallback(async () => {
    if (!sekolahId || !authToken) return

    try {
      // Try multiple endpoint variations
      const endpoints = [
        `${API_BASE_URL}/api/pengambilan-makanan/today?sekolahId=${sekolahId}`,
        `${API_BASE_URL}/api/sekolah/${sekolahId}/pengambilan-makanan/today`,
        `${API_BASE_URL}/api/pengambilan-makanan?sekolahId=${sekolahId}&date=today`,
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            const absenList = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
            setAbsensiData(absenList)
            console.log("[ABSENSI TODAY] Loaded from", endpoint, ":", absenList.length, "records")
            return
          }
        } catch (e) {
          console.log("[ABSENSI TODAY] Endpoint failed:", endpoint)
          continue
        }
      }

      // If all endpoints fail, set empty array (still allow app to function)
      setAbsensiData([])
      console.log("[ABSENSI TODAY] All endpoints failed, using empty data")
    } catch (err) {
      console.error("[ABSENSI TODAY] Error fetching:", err)
      setAbsensiData([])
    }
  }, [sekolahId, authToken])

  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")
      setAvailableCameras(videoDevices)
      console.log("[CAMERA] Available cameras:", videoDevices)

      // Set default camera jika belum dipilih
      if (!selectedCameraId && videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId)
      }
    } catch (err) {
      console.error("Error enumerating cameras:", err)
    }
  }

  const startCamera = async (facingMode: "user" | "environment" = "user", deviceId?: string) => {
    try {
      setIsCameraActive(true)

      // Jika ada deviceId spesifik, gunakan itu. Kalau tidak, gunakan facingMode
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
          if (step === "camera-face") {
            startFaceDetection()
          } else if (step === "camera-menu") {
            // Start food condition detection
            startFoodDetection()
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
    stopMenuCountdown()
    stopFoodDetection()
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
      const ctx = canvas.getContext("2d")

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

  const startMenuCountdown = () => {
    setIsMenuCountdownActive(true)
    setMenuCountdown(3)
    let count = 3

    menuCountdownIntervalRef.current = setInterval(() => {
      count -= 1
      setMenuCountdown(count)

      if (count <= 0) {
        stopMenuCountdown()
        capturePhoto() // Auto capture foto makanan
      }
    }, 1000)
  }

  const stopMenuCountdown = () => {
    if (menuCountdownIntervalRef.current) {
      clearInterval(menuCountdownIntervalRef.current)
      menuCountdownIntervalRef.current = null
    }
    setIsMenuCountdownActive(false)
    setMenuCountdown(3)
  }

  const startFoodDetection = () => {
    foodDetectionIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || step !== "camera-menu") return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

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
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]
        totalBrightness += (r + g + b) / 3
      }
      const avgBrightness = totalBrightness / (imageData.data.length / 4)

      if (avgBrightness > 80 && avgBrightness < 180) {
        setFoodConditionOk(true)
        setFoodCondition("ok")

        if (!menuCountdownIntervalRef.current) {
          startMenuCountdown()
        }
      } else {
        setFoodConditionOk(false)
        setFoodCondition(avgBrightness < 80 ? "too-dark" : "too-bright")
        stopMenuCountdown()
      }
    }, 200)
  }

  const stopFoodDetection = () => {
    if (foodDetectionIntervalRef.current) {
      clearInterval(foodDetectionIntervalRef.current)
      foodDetectionIntervalRef.current = null
    }
    setFoodConditionOk(false)
    setFoodCondition("")
  }

  const capturePhoto = () => {
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
        validateFace(photoData)
      } else if (step === "camera-menu") {
        setMenuPhoto(photoData)
        stopCamera()
        submitPengambilanMakanan(photoData)
      }
    }
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

  const checkDuplicate = (siswaId: string): boolean => {
    return absensiData.some((record: any) => {
      const recordSiswaId = String(record.siswaId || record.siswa?.id || record.siswa?.siswaId || "")
      return recordSiswaId === String(siswaId)
    })
  }

  const validateFace = async (facePhotoData: string) => {
    setStep("processing-face")

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")

      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan. Silakan login kembali.")
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

      if (detectedSiswa && (detectedSiswa.siswaId || detectedSiswa.id || detectedSiswa.siswaId)) {
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

        let fotoUrl =
          detectedSiswa.fotoUrl ||
          detectedSiswa.foto ||
          detectedSiswa.fotoSiswa ||
          detectedSiswa.fotoProfil ||
          detectedSiswa.photoUrl ||
          detectedSiswa.photo ||
          detectedSiswa.profilePhoto ||
          detectedSiswa.profilePicture ||
          detectedSiswa.image ||
          detectedSiswa.imageUrl ||
          ""

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

        // Check apakah siswa sudah absen
        const isDuplicateAbsen = checkDuplicate(normalizedSiswa.id)

        // Cari siswa dari siswaData untuk mendapatkan foto yang benar
        const siswaFromList = siswaData.find((s: any) => String(s.id) === String(normalizedSiswa.id))
        const siswaToUse = siswaFromList ? { ...normalizedSiswa, ...siswaFromList } : normalizedSiswa

        if (isDuplicateAbsen) {
          setSelectedSiswa(siswaToUse)
          setDuplicateSiswaInfo(siswaToUse)
          setIsDuplicate(true)
          setStep("duplicate-warning")
        } else {
          setSelectedSiswa(siswaToUse)
          setIsDuplicate(false)
          setStep("rfid-scan")
        }
      } else {
        console.error("[VALIDATE FACE] Invalid response structure:", result)
        throw new Error("Data siswa tidak ditemukan. Pastikan wajah terdaftar di database.")
      }
    } catch (err) {
      console.error("[VALIDATE FACE] Error:", err)
      const errorMsg = err instanceof Error ? err.message : "Wajah tidak dikenali. Silakan coba lagi."
      alert(errorMsg)
      setFacePhoto(null)
      setStep("camera-face")
    }
  }

  const startRfidPolling = useCallback(() => {
    setIsScanning(true)
    let lastDetectedRfid = ""

    const pollRfid = async () => {
      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")

        const response = await fetch(`${API_BASE_URL}/api/rfid/latest`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const result = await response.json()
          const rfidData = result.data || result
          const detectedTrayId = rfidData.uid || rfidData.trayId || rfidData.idTray || rfidData.id

          if (detectedTrayId) {
            const trayIdFormatted = String(detectedTrayId).toUpperCase()
            console.log("[v0] RFID detected instantly:", trayIdFormatted)

            if (trayIdFormatted !== lastDetectedRfid) {
              lastDetectedRfid = trayIdFormatted
              console.log("[v0] Updating state with RFID:", trayIdFormatted)

              setTrayId(trayIdFormatted)
              stopRfidPolling()
              setStep("confirm")
            }
          }
        }
      } catch (err) {
        console.error("[RFID] Polling error:", err)
      }
    }

    rfidPollingRef.current = setInterval(pollRfid, 500)
    pollRfid()
  }, [])

  const stopRfidPolling = useCallback(() => {
    if (rfidPollingRef.current) {
      clearInterval(rfidPollingRef.current)
      rfidPollingRef.current = null
    }
    setIsScanning(false)
  }, [])

  useEffect(() => {
    if (step === "rfid-scan") {
      startRfidPolling()
    } else {
      stopRfidPolling()
    }
  }, [step, startRfidPolling, stopRfidPolling])

  const submitPengambilanMakanan = async (menuPhotoData: string) => {
    if (!selectedSiswa || !trayId) {
      alert("Data tidak lengkap!")
      return
    }

    setStep("submitting")

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")

      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan. Silakan login kembali.")
      }

      const fotoMakananBlob = await fetch(menuPhotoData).then((r) => r.blob())
      const fotoMakananFile = new File([fotoMakananBlob], "foto-makanan.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("siswaId", selectedSiswa.id)
      formData.append("idTray", trayId)
      formData.append("fotoMakanan", fotoMakananFile)

      const response = await fetch(`${API_BASE_URL}/api/pengambilan-makanan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Gagal submit pengambilan makanan")
      }

      setValidationResult({
        success: true,
        message: "Pengambilan makanan berhasil dicatat!",
        siswa: selectedSiswa,
        data: result.data,
      })
      setStep("result")

      // Refresh absensi data setelah submit
      setTimeout(() => {
        fetchAbsensiToday()
      }, 500)

      setTimeout(() => {
        handleReset()
      }, 5000)
    } catch (err) {
      console.error("Error submitting:", err)
      setValidationResult({
        success: false,
        message: err instanceof Error ? err.message : "Terjadi kesalahan",
      })
      setStep("result")

      setTimeout(() => {
        handleReset()
      }, 5000)
    }
  }

  const handleTraySubmit = () => {
    if (!trayId.trim()) {
      alert("ID Tray harus diisi!")
      return
    }
    setStep("confirm")
  }

  const handleConfirmYes = () => {
    setStep("camera-menu")
  }

  const handleConfirmNo = () => {
    setSelectedSiswa(null)
    setTrayId("")
    setFacePhoto(null)
    setStep("camera-face")
  }

  const handleReset = () => {
    stopCamera()
    setFacePhoto(null)
    setMenuPhoto(null)
    setSelectedSiswa(null)
    setTrayId("")
    setValidationResult(null)
    setIsDuplicate(false)
    setDuplicateSiswaInfo(null)
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
    <SekolahLayout currentPage="absensi">
      {/* Header */}
      <div className="mb-8 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Absensi MBG</h1>
            <p className="text-gray-600 mt-1 text-sm">Deteksi wajah & scan RFID makanan</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
        <StatCard
          title="Total Siswa"
          value={stats.total}
          subtitle="Siswa terdaftar"
          icon={Users}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Sudah Absen"
          value={stats.sudahAbsen}
          subtitle={`${stats.total > 0 ? Math.round((stats.sudahAbsen / stats.total) * 100) : 0}%`}
          icon={CheckCircle}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
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
        <StatCard
          title="Total Kelas"
          value={stats.totalKelas}
          subtitle="Kelas aktif"
          icon={School}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
      </div>

      {/* STEP 1: CAMERA FACE */}
{step === "camera-face" && (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    {/* Status Bar */}
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold text-white">Kamera Aktif</span>
      </div>
      <span className="text-xs text-gray-400 font-mono">STEP 1</span>
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
              ? "border-emerald-400 shadow-2xl shadow-emerald-400/40 scale-100"
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
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg animate-pulse">
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
  </div>
)}

     {/* STEP 2: PROCESSING FACE */}
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
        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-pulse opacity-20"></div>
        <div className="relative w-16 h-16 bg-gradient-to-br  from-blue-80 to-emerald-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Mengenali Wajah...</h2>
    <p className="text-gray-600 text-sm mb-6">Menganalisis dengan AI Detection Face</p>
    <div className="flex justify-center gap-1.5">
      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
      <div
        className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  </div>
)}

     {/* STEP 2.5: DUPLICATE WARNING */}
{step === "duplicate-warning" && duplicateSiswaInfo && (
  <div className="max-w-2xl mx-auto">
    <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden">
      {/* Header - Alert */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-white flex-shrink-0" />
          <div>
            <span className="text-sm font-bold text-white block">⚠️ SISWA SUDAH ABSEN</span>
            <p className="text-xs text-red-100 mt-1">Siswa ini telah mencatat pengambilan makanan hari ini</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Student Info */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 mb-8 border-2 border-red-200">
          {/* Header dengan Info */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900">{duplicateSiswaInfo.nama}</h3>
            <p className="text-sm text-gray-600">{duplicateSiswaInfo.kelas}</p>
            <p className="text-xs text-gray-500">NIS: {duplicateSiswaInfo.nis}</p>
          </div>

          {/* Photo Comparison Grid */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Foto Siswa dari Database - LEFT */}
            <div className="text-center">
              <p className="text-xs font-bold text-gray-600 mb-2">👤 Foto Siswa DB</p>
              {duplicateSiswaInfo.fotoUrl ? (
                <img
                  src={duplicateSiswaInfo.fotoUrl || "/placeholder.svg"}
                  alt="Foto Siswa"
                  className="w-28 h-28 rounded-full object-cover border-4 border-red-400 shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-200 border-4 border-red-400 flex items-center justify-center">
                  {duplicateSiswaInfo.jenisKelamin === "LAKI_LAKI" ? (
                    <Users2 className="w-14 h-14 text-gray-500" />
                  ) : (
                    <User className="w-14 h-14 text-gray-500" />
                  )}
                </div>
              )}
            </div>

            {/* Divider with Warning Icon */}
            <div className="flex flex-col items-center gap-1">
              <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
              <p className="text-xs text-red-600 font-semibold">Duplikat</p>
            </div>

            {/* Foto dari Kamera - RIGHT */}
            <div className="text-center">
              <p className="text-xs font-bold text-gray-600 mb-2">📷 Foto Deteksi</p>
              {facePhoto && (
                <img
                  src={facePhoto || "/placeholder.svg"}
                  alt="Foto Validasi"
                  className="w-28 h-28 rounded-full object-cover border-4 border-red-400 shadow-lg"
                />
              )}
            </div>
          </div>

          {duplicateSiswaInfo.alergi && duplicateSiswaInfo.alergi.length > 0 && (
            <div className="mt-4 bg-red-50 rounded-lg p-3 border-l-4 border-red-500">
              <p className="text-xs text-red-700 font-bold">⚠️ ALERGI TERDAFTAR</p>
              <p className="text-sm text-red-800 font-semibold mt-1">{duplicateSiswaInfo.alergi.join(", ")}</p>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-8">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-gray-900">{duplicateSiswaInfo.nama}</span> sudah tercatat absen pada hari ini.
            <br />
            <span className="text-xs text-gray-600 mt-2 block">Apakah Anda ingin melanjutkan atau memulai ulang dengan siswa lain?</span>
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              handleReset()
            }}
            className="px-6 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 transition-colors font-bold flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Mulai Ulang
          </button>
          <button
            onClick={() => {
              setSelectedSiswa(duplicateSiswaInfo)
              setStep("rfid-scan")
            }}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Lanjutkan Anyway
          </button>
        </div>
      </div>
    </div>
  </div>
)}

     {/* STEP 3: RFID SCAN */}
{step === "rfid-scan" && selectedSiswa && (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    {/* Success Header */}
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-white" />
        <span className="text-sm font-semibold text-white">Wajah Berhasil Dikenali</span>
      </div>
    </div>

    {/* Content */}
    <div className="p-8">
      {/* Student Info & Photo Comparison */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border-2 border-emerald-200">
        {/* Header dengan Info */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">{selectedSiswa.nama}</h3>
          <p className="text-sm text-gray-600">{selectedSiswa.kelas}</p>
          <p className="text-xs text-gray-500">NIS: {selectedSiswa.nis}</p>
        </div>

        {/* Photo Comparison Grid */}
        <div className="flex items-center justify-center gap-6 mb-4">
          {/* Foto Siswa dari Database - LEFT */}
          <div className="text-center">
            <p className="text-xs font-bold text-gray-600 mb-3">👤 Foto Siswa di DB</p>
            {selectedSiswa.fotoUrl ? (
              <img
                src={selectedSiswa.fotoUrl || "/placeholder.svg"}
                alt="Foto Siswa"
                className="w-32 h-32 rounded-full object-cover border-4 border-emerald-400 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-emerald-400 flex items-center justify-center">
                {selectedSiswa.jenisKelamin === "LAKI_LAKI" ? (
                  <Users2 className="w-16 h-16 text-gray-500" />
                ) : (
                  <User className="w-16 h-16 text-gray-500" />
                )}
              </div>
            )}
          </div>

          {/* Divider with Valid Icon */}
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-12 h-12 text-emerald-500 animate-pulse" />
            <p className="text-xs text-emerald-600 font-semibold">Valid</p>
          </div>

          {/* Foto dari Kamera - RIGHT */}
          <div className="text-center">
            <p className="text-xs font-bold text-gray-600 mb-3">📷 Foto Deteksi Wajah</p>
            {facePhoto && (
              <img
                src={facePhoto || "/placeholder.svg"}
                alt="Foto Validasi"
                className="w-32 h-32 rounded-full object-cover border-4 border-emerald-400 shadow-lg"
              />
            )}
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-lg p-3 mb-4 border-2 border-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">✓ Wajah cocok dengan data siswa di database</p>
          </div>
        </div>

        {selectedSiswa.alergi && selectedSiswa.alergi.length > 0 && (
          <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500">
            <p className="text-xs text-red-700 font-bold">⚠️ ALERGI TERDAFTAR</p>
            <p className="text-sm text-red-800 font-semibold mt-1">{selectedSiswa.alergi.join(", ")}</p>
          </div>
        )}
      </div>

      {/* RFID Scan Section */}
      <div className="text-center mb-8">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping"></div>
          <div className="absolute inset-2 border-4 border-emerald-500/50 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-xl">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4c-2.2 0-4 1.8-4 4h2c0-1.1.9-2 2-2s2 .9 2 2h2c0-2.2-1.8-4-4-4zm0-4c-3.3 0-6 2.7-6 6h2c0-2.2 1.8-4 4-4s4 1.8 4 4h2c0-3.3-2.7-6-6-6zm0-4C7.6 6 4 9.6 4 14h2c0-3.3 2.7-6 6-6s6 2.7 6 6h2c0-4.4-3.6-8-8-8z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Tempelkan RFID Tray</h3>
        <p className="text-gray-600 text-sm">Dekatkan tray ke pembaca RFID</p>

        {isScanning && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <span className="text-sm text-emerald-600 font-semibold ml-2">Menunggu scan...</span>
          </div>
        )}
      </div>

      {/* Manual Input Fallback */}
      <button
        onClick={() => setStep("input-tray")}
        className="w-full text-center py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm border border-gray-200"
      >
        atau input manual
      </button>
    </div>
  </div>
)}

      {/* STEP 4: INPUT TRAY ID */}
      {step === "input-tray" && selectedSiswa && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-white" />
                <span className="text-sm font-semibold text-white">MASUKKAN ID TRAY</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Student Info */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedSiswa.nama}</h3>
                <p className="text-sm text-gray-600">{selectedSiswa.kelas} • NIS {selectedSiswa.nis}</p>

                {/* Photo Comparison Grid */}
                <div className="flex items-center justify-center gap-3 my-4">
                  {/* Foto Siswa dari Database - LEFT */}
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-600 mb-2">👤 Foto Siswa DB</p>
                    {selectedSiswa.fotoUrl ? (
                      <img
                        src={selectedSiswa.fotoUrl || "/placeholder.svg"}
                        alt="Foto Siswa"
                        className="w-24 h-24 rounded-full object-cover border-3 border-emerald-400 shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 border-3 border-emerald-400 flex items-center justify-center">
                        {selectedSiswa.jenisKelamin === "LAKI_LAKI" ? (
                          <Users2 className="w-12 h-12 text-gray-500" />
                        ) : (
                          <User className="w-12 h-12 text-gray-500" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Divider with Valid Icon */}
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                    <p className="text-xs text-emerald-600 font-semibold">✓</p>
                  </div>

                  {/* Foto dari Kamera - RIGHT */}
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-600 mb-2">📷 Foto Deteksi</p>
                    {facePhoto && (
                      <img
                        src={facePhoto || "/placeholder.svg"}
                        alt="Foto Deteksi"
                        className="w-24 h-24 rounded-full object-cover border-3 border-emerald-400 shadow-md"
                      />
                    )}
                  </div>
                </div>

                {selectedSiswa.alergi && selectedSiswa.alergi.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500 mt-4">
                    <p className="text-xs text-red-700 font-bold">⚠️ ALERGI</p>
                    <p className="text-sm text-red-800">{selectedSiswa.alergi.join(", ")}</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">ID TRAY</label>
                <input
                  type="text"
                  value={trayId}
                  onChange={(e) => setTrayId(e.target.value.toUpperCase())}
                  placeholder="Contoh: TRAY001"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-mono text-center transition-all"
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setSelectedSiswa(null)
                    setTrayId("")
                    setFacePhoto(null)
                    setStep("camera-face")
                  }}
                  className="px-4 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Ulangi
                </button>
                <button
                  onClick={handleTraySubmit}
                  disabled={!trayId.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg text-white rounded-xl transition-all font-semibold disabled:opacity-50"
                >
                  Lanjut
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: CONFIRM */}
{step === "confirm" && (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    {/* Header */}
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
      <span className="text-sm font-semibold text-white">STEP 5 - KONFIRMASI DATA</span>
    </div>

    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Verifikasi Data</h2>

      {/* Photo Preview */}
      {facePhoto && (
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-gray-700 mb-3">Foto Wajah</p>
          <img
            src={facePhoto || "/placeholder.svg"}
            alt="Face preview"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 mx-auto shadow-lg"
          />
        </div>
      )}

      {/* Tray Info */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 border border-gray-200">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">🍱 ID TRAY</p>
        <p className="text-3xl font-bold text-gray-900 font-mono">{trayId}</p>
      </div>

      <p className="text-lg font-bold text-gray-900 text-center mb-8">Lanjut ke foto makanan?</p>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleConfirmNo}
          className="px-6 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 transition-colors font-bold flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Batal
        </button>
        <button
          onClick={handleConfirmYes}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Lanjut
        </button>
      </div>
    </div>
  </div>
)}
{/* STEP 6: CAMERA MENU */}
{step === "camera-menu" && (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    {/* Status Bar */}
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold text-white">Kamera Aktif</span>
      </div>

      {/* Camera Selector di Header */}
      <div className="flex items-center gap-3">
        {availableCameras.length > 0 && (
          <>
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value)
                stopCamera()
                setTimeout(() => {
                  startCamera("environment", e.target.value)
                }, 100)
              }}
              className="px-3 py-1.5 border border-gray-600 bg-gray-800 text-white rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {availableCameras.map((camera, index) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                enumerateCameras()
              }}
              className="p-1.5 text-white hover:text-emerald-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh cameras"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}
        <span className="text-xs text-gray-400 font-mono">STEP 6</span>
      </div>
    </div>

    {/* Camera */}
    <div className="relative bg-black overflow-hidden aspect-video">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Detection Overlay Guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-96 h-64 border-4 rounded-2xl transition-all duration-300 ${
            foodConditionOk
              ? "border-emerald-400 shadow-2xl shadow-emerald-400/40 scale-100"
              : "border-gray-500 animate-pulse scale-95"
          }`}
        >
          {/* Countdown in center */}
          {isMenuCountdownActive && menuCountdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-9xl font-bold animate-pulse">{menuCountdown}</div>
            </div>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="absolute top-6 right-6 space-y-3">
        {foodConditionOk && (
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg animate-pulse">
            <CheckCircle className="w-4 h-4" />
            Kondisi Baik
          </div>
        )}

        {!foodConditionOk && foodCondition && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
            {foodCondition === "too-dark" && "⚫ Terlalu Gelap"}
            {foodCondition === "too-bright" && "⚪ Terlalu Terang"}
          </div>
        )}
      </div>

      {/* Instruction */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
        <div className="bg-gray-900/90 backdrop-blur text-white px-6 py-3 rounded-full text-sm font-medium">
          {isMenuCountdownActive
            ? "📸 Mengambil foto..."
            : foodConditionOk
              ? "✓ Siap mengambil foto..."
              : "Atur pencahayaan makanan"}
        </div>
      </div>

      {/* Switch Camera Button - Floating */}
      {availableCameras.length > 1 && (
        <button
          onClick={() => {
            const currentIndex = availableCameras.findIndex((cam) => cam.deviceId === selectedCameraId)
            const nextIndex = (currentIndex + 1) % availableCameras.length
            const nextCamera = availableCameras[nextIndex]
            setSelectedCameraId(nextCamera.deviceId)
            stopCamera()
            setTimeout(() => {
              startCamera("environment", nextCamera.deviceId)
            }, 100)
          }}
          className="absolute bottom-6 right-6 bg-black/70 hover:bg-black/90 text-white px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-lg"
        >
          <Camera className="w-5 h-5" />
          Switch Camera
        </button>
      )}
    </div>

    {/* Info */}
    <div className="px-6 py-6 border-t border-gray-100">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          🍱 Tray: <span className="font-mono font-bold text-gray-900">{trayId}</span>
        </p>
        {isMenuCountdownActive ? (
          <p className="text-xs text-gray-500">
            📸 Mengambil foto dalam <span className="font-bold text-emerald-600">{menuCountdown} detik</span>
          </p>
        ) : foodConditionOk ? (
          <p className="text-xs text-emerald-600 font-semibold">
            ✓ Kondisi baik - Countdown akan dimulai...
          </p>
        ) : (
          <p className="text-xs text-amber-600 font-semibold">
            {foodCondition === "too-dark" && "⚫ Cahaya terlalu gelap - Tambah pencahayaan"}
            {foodCondition === "too-bright" && "⚪ Cahaya terlalu terang - Kurangi pencahayaan"}
            {!foodCondition && "📷 Menunggu kondisi optimal..."}
          </p>
        )}
      </div>
    </div>
  </div>
)}

{/* STEP 7: SUBMITTING */}
{step === "submitting" && (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
    <div className="relative w-16 h-16 mx-auto mb-6">
      <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
      <Loader className="w-full h-full animate-spin text-emerald-600 relative" />
    </div>
    <h2 className="text-xl font-bold text-gray-900 mb-2">Menyimpan Data...</h2>
    <p className="text-gray-600 text-sm">Sistem sedang memproses informasi</p>
  </div>
)}

{/* STEP 8: RESULT */}
{step === "result" && (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    {/* Header */}
    <div
      className={`bg-gradient-to-r ${validationResult?.success ? "from-emerald-500 to-teal-600" : "from-red-500 to-red-600"} px-6 py-4`}
    >
      <div className="flex items-center gap-2">
        {validationResult?.success ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold text-white">Berhasil Disimpan</span>
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold text-white">Gagal Disimpan</span>
          </>
        )}
      </div>
    </div>

    {/* Content */}
    <div className="p-8">
      <div className="text-center mb-8">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            validationResult?.success ? "bg-emerald-100" : "bg-red-100"
          }`}
        >
          {validationResult?.success ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          ) : (
            <XCircle className="w-12 h-12 text-red-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {validationResult?.success ? "Berhasil!" : "Gagal!"}
        </h2>
        <p className="text-gray-600">{validationResult?.message}</p>
      </div>

      {/* Success Info */}
      {validationResult?.success && validationResult?.siswa && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border-2 border-emerald-200">
          <p className="text-xs font-bold text-emerald-700 mb-3">✓ DATA TERSIMPAN</p>
          <p className="text-xl font-bold text-gray-900 mb-1">{validationResult.siswa.nama}</p>
          <p className="text-sm text-gray-600 mb-3">
            {validationResult.siswa.kelas} • NIS {validationResult.siswa.nis}
          </p>
          <p className="text-lg font-mono font-bold text-emerald-700 mb-3">🍱 {trayId}</p>
          {validationResult.siswa.alergi && validationResult.siswa.alergi.length > 0 && (
            <div className="pt-3 border-t border-emerald-300">
              <p className="text-xs text-gray-700">⚠️ Alergi: {validationResult.siswa.alergi.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {/* Photo Grid */}
      {(facePhoto || menuPhoto) && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {facePhoto && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Foto Wajah</p>
              <img
                src={facePhoto || "/placeholder.svg"}
                alt="Face"
                className="w-full rounded-xl border-2 border-gray-200"
              />
            </div>
          )}
          {menuPhoto && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Foto Makanan</p>
              <img
                src={menuPhoto || "/placeholder.svg"}
                alt="Menu"
                className="w-full rounded-xl border-2 border-gray-200"
              />
            </div>
          )}
        </div>
      )}

      <p className="text-center text-gray-500 text-xs">Kembali otomatis dalam 5 detik...</p>
    </div>
  </div>
)}
    </SekolahLayout>
  )
}

export default AbsensiPenerima
