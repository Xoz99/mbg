"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { useSekolahDataCache } from "@/lib/hooks/useSekolahDataCache"
import { Users, Loader, Camera, CheckCircle, School, X, CheckCircle2, Hash, XCircle, Sparkles, Zap, AlertTriangle, User, Users2, RefreshCw, Nfc } from "lucide-react"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

const AbsensiPenerima = () => {
  const [step, setStep] = useState<
    "camera-face" | "processing-face" | "rfid-scan" | "input-tray" | "confirm" | "camera-menu" | "submitting" | "result" | "duplicate-warning"
  >("camera-face")
  const [faceDetected, setFaceDetected] = useState(false)
  const [facePosition, setFacePosition] = useState<string>("") // 'too-dark', 'too-bright'
  const [countdown, setCountdown] = useState(5)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [facePhoto, setFacePhoto] = useState<string | null>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null) // { nama, kelas, nis, alergi }
  const [isScanning, setIsScanning] = useState(false)
  const [trayId, setTrayId] = useState("")
  const [menuPhoto, setMenuPhoto] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null) // { success: boolean, message: string, siswa?: any }

  const [authToken, setAuthToken] = useState("")
  const [sekolahId, setSekolahId] = useState("")
  const [keterangan, setKeterangan] = useState("")
  const [statusMakanan, setStatusMakanan] = useState<"habis" | "tidak_habis">("tidak_habis")
  
  // State Refs to avoid stale closures in intervals
  const trayIdRef = useRef(trayId)
  const stepRef = useRef(step)

  useEffect(() => { trayIdRef.current = trayId }, [trayId])
  useEffect(() => { stepRef.current = step }, [step])
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
  const [menuCountdown, setMenuCountdown] = useState(5) // Countdown untuk auto-capture foto makanan
  const [isMenuCountdownActive, setIsMenuCountdownActive] = useState(false) // Flag untuk countdown aktif
  const [foodConditionOk, setFoodConditionOk] = useState(false) // Flag kondisi foto makanan OK
  const [foodCondition, setFoodCondition] = useState<string>("") // Status kondisi: 'too-dark', 'too-bright', 'ok'
  const [preparationCountdown, setPreparationCountdown] = useState(10) // Countdown persiapan 10 detik
  const [isPreparationActive, setIsPreparationActive] = useState(false) // Flag preparation aktif

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
  const preparationIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
    if (step === "camera-face" && !isCameraActive && cameraReady) {
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
  }, [step, selectedCameraId, cameraReady])

  // Separate effect untuk start preparation countdown hanya sekali saat masuk camera-menu
  useEffect(() => {
    if (step === "camera-menu") {
      startPreparationCountdown()
    }

    return () => {
      stopPreparationCountdown()
    }
  }, [step])

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
          }
          // For camera-menu, food detection will start after preparation countdown
        }
      }
    } catch (err) {
      console.error("Error starting camera:", err)
      alert("Gagal mengakses kamera")
      setIsCameraActive(false)
    }
  }

  const stopCamera = (keepPreparation = false) => {
    stopFaceDetection()
    stopMenuCountdown()
    stopFoodDetection()
    if (!keepPreparation) {
      stopPreparationCountdown()
    }
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

  const startMenuCountdown = () => {
    setIsMenuCountdownActive(true)
    setMenuCountdown(5)
    let count = 5

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
    setMenuCountdown(5)
  }

  const startFoodDetection = () => {
    foodDetectionIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || step !== "camera-menu") return

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

  const startPreparationCountdown = () => {
    setIsPreparationActive(true)
    setPreparationCountdown(10)
    let count = 10

    preparationIntervalRef.current = setInterval(() => {
      count -= 1
      setPreparationCountdown(count)

      if (count <= 0) {
        stopPreparationCountdown()
        // Preparation selesai, mulai food detection
        startFoodDetection()
      }
    }, 1000)
  }

  const stopPreparationCountdown = () => {
    if (preparationIntervalRef.current) {
      clearInterval(preparationIntervalRef.current)
      preparationIntervalRef.current = null
    }
    setIsPreparationActive(false)
    setPreparationCountdown(10)
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

        const response = await fetch(`${API_BASE_URL}/api/rfid/latest?tipe=MASUK`, {
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
            
            // Critical Safety Checks:
            // 1. If we are no longer in the RFID scan step, STOP everything.
            if (stepRef.current !== "rfid-scan") {
              stopRfidPolling()
              return
            }

            // 2. If the state already has this ID, don't update/log again.
            if (trayIdFormatted === trayIdRef.current) return;

            console.log("[v0] RFID detected instantly:", trayIdFormatted)

            if (trayIdFormatted !== lastDetectedRfid) {
              lastDetectedRfid = trayIdFormatted
              console.log("[v0] Updating state with RFID:", trayIdFormatted)

              setTrayId(trayIdFormatted)
              // Stop polling immediately once we have a NEW valid ID
              stopRfidPolling()
              setStep("confirm")
            }
          }
        }
      } catch (err) {
        console.error("[RFID] Polling error:", err)
      }
    }

    // Interval is safe with empty dependencies because we use Refs now!
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
    
    // Proper Cleanup for the listener
    return () => stopRfidPolling()
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
    setPreparationCountdown(10)
    setIsPreparationActive(false)
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
    setCameraReady(false)
    setPreparationCountdown(10)
    setIsPreparationActive(false)
    setStep("camera-face")
  }

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

  return (
    <SekolahLayout currentPage="absensi">
      {/* Header */}
      <div className="mb-4 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Absensi MBG</h1>
            <p className="text-gray-600 mt-0.5 text-xs">Deteksi wajah & scan RFID makanan</p>
          </div>
        </div>
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

      {/* STEP 1: CAMERA FACE */}
      {step === "camera-face" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!cameraReady ? (
            <div className="p-12 text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mulai Absen Kamera</h2>
                <p className="text-gray-600 text-sm mb-1">Sistem akan mendeteksi wajah Anda secara otomatis</p>
                <p className="text-gray-500 text-xs">Pastikan wajah Anda terlihat jelas dan pencahayaan cukup</p>
              </div>

              <button
                onClick={() => setCameraReady(true)}
                className="px-6 py-3 bg-[#1B263A] text-white rounded-xl hover:bg-[#2A3749] transition-colors font-medium text-sm flex items-center justify-center gap-2 mx-auto"
              >
                <Camera className="w-5 h-5" />
                Mulai Absen
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
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`w-64 h-64 border-2 rounded-full transition-all duration-300 ${faceDetected
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

      {/* STEP 2: PROCESSING FACE */}
      {step === "processing-face" && (
        <div className="w-full bg-white rounded-xl border border-gray-100 p-12 text-center">
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
          <p className="text-gray-500 text-sm">Mohon tunggu sebentar</p>
        </div>
      )}

      {/* STEP 2.5: DUPLICATE WARNING */}
      {step === "duplicate-warning" && duplicateSiswaInfo && (
        <div className="w-full mx-auto">
          <div className="bg-white rounded-xl border border-red-500 overflow-hidden">
            {/* Header - Alert */}
            <div className="bg-red-50 px-5 py-3 border-b border-red-100">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <span className="text-sm font-bold text-red-800 block">SISWA SUDAH ABSEN</span>
                  <p className="text-xs text-red-600 mt-1">Siswa ini telah mencatat pengambilan makanan hari ini</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Student Info */}
              <div className="border border-red-100 bg-red-50/50 rounded-xl p-5 mb-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{duplicateSiswaInfo.nama}</h3>
                  <p className="text-sm text-gray-600">{duplicateSiswaInfo.kelas}</p>
                  <p className="text-xs text-gray-500">NIS: {duplicateSiswaInfo.nis}</p>
                </div>

                {/* Photo Comparison Grid */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-center">
                    {duplicateSiswaInfo.fotoUrl ? (
                      <img
                        src={duplicateSiswaInfo.fotoUrl || "/placeholder.svg"}
                        alt="Foto Siswa"
                        className="w-20 h-20 rounded-lg object-cover bg-white border border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <p className="text-xs font-semibold text-gray-500 mt-2">Foto Data Base</p>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <p className="text-[10px] text-red-600 font-bold uppercase">Duplikat</p>
                  </div>

                  <div className="text-center">
                    {facePhoto && (
                      <img
                        src={facePhoto || "/placeholder.svg"}
                        alt="Foto Validasi"
                        className="w-20 h-20 rounded-lg object-cover bg-white border border-gray-200"
                      />
                    )}
                    <p className="text-xs font-semibold text-gray-500 mt-2">Deteksi</p>
                  </div>
                </div>

                {duplicateSiswaInfo.alergi && duplicateSiswaInfo.alergi.length > 0 && (
                  <div className="mt-4 bg-red-50 rounded-lg p-3 border-l-4 border-red-500">
                    <p className="text-xs text-red-700 font-bold mb-1">Alergi Terdaftar</p>
                    <p className="text-sm text-red-800 font-medium">{duplicateSiswaInfo.alergi.join(", ")}</p>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6 text-sm text-amber-900">
                <p>
                  <span className="font-bold">{duplicateSiswaInfo.nama}</span> sudah tercatat absen hari ini.
                  <br />
                  Lanjutkan untuk menimpa, atau mulai ulang untuk scan siswa lain.
                </p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleReset()}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Mulai Ulang
                </button>
                <button
                  onClick={() => {
                    setSelectedSiswa(duplicateSiswaInfo)
                    setStep("rfid-scan")
                  }}
                  className="px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Lanjutkan
                </button>
              </div>
            </div>
          </div>
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
              <p className="text-sm text-gray-500 mb-1">{selectedSiswa.kelas}</p>
              <p className="text-xs text-gray-400 mb-4">NIS: {selectedSiswa.nis}</p>

              <div className="flex justify-center items-center gap-6 my-4">
                <div>
                  {selectedSiswa.fotoUrl ? (
                    <img
                      src={selectedSiswa.fotoUrl || "/placeholder.svg"}
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

              {selectedSiswa.alergi && selectedSiswa.alergi.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500 text-left mt-4">
                  <p className="text-xs text-red-700 font-bold">ALERGI TERDAFTAR</p>
                  <p className="text-sm text-red-800 font-medium mt-1">{selectedSiswa.alergi.join(", ")}</p>
                </div>
              )}
            </div>

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
              onClick={() => setStep("input-tray")}
              className="w-full text-center py-2 text-gray-500 hover:text-gray-900 transition-colors text-xs underline"
            >
              Input tray manual
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: INPUT TRAY ID */}
      {step === "input-tray" && selectedSiswa && (
        <div className="w-full mx-auto">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-[#1B263A] px-5 py-3">
              <div className="flex items-center gap-2">
                <Nfc className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">MASUKKAN ID TRAY</span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 border border-gray-100 bg-gray-50 p-4 rounded-xl">
                {selectedSiswa.fotoUrl ? (
                  <img
                    src={selectedSiswa.fotoUrl || "/placeholder.svg"}
                    alt="Foto Siswa"
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-0.5">{selectedSiswa.nama}</h3>
                  <p className="text-sm text-gray-500">{selectedSiswa.kelas} • NIS {selectedSiswa.nis}</p>
                </div>
              </div>

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
                    setSelectedSiswa(null)
                    setTrayId("")
                    setFacePhoto(null)
                    setPreparationCountdown(10)
                    setIsPreparationActive(false)
                    setStep("camera-face")
                  }}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleTraySubmit}
                  disabled={!trayId.trim()}
                  className="px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors text-sm font-medium disabled:opacity-50"
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
        <div className="w-full mx-auto">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-[#1B263A] px-5 py-3">
              <div className="flex items-center gap-2">
                <Nfc className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">KONFIRMASI TRAY</span>
              </div>
            </div>

            <div className="p-6 text-center">
              <Nfc className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500 mb-1">ID TRAY</p>
              <p className="text-3xl font-bold text-gray-900 font-mono mb-6">{trayId}</p>

              <p className="text-sm font-medium text-gray-700 mb-6">Lanjut ke foto makanan?</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleConfirmNo}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmYes}
                  className="px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors text-sm font-medium"
                >
                  Lanjut Kamera
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* STEP 6: CAMERA MENU */}
      {step === "camera-menu" && (
        <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Status Bar */}
          <div className="bg-[#1B263A] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
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
                      stopCamera(true) // Keep preparation countdown running
                      setTimeout(() => {
                        startCamera("environment", e.target.value)
                      }, 100)
                    }}
                    className="px-3 py-1.5 border border-gray-600 bg-gray-800 text-white rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                    title="Refresh cameras"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </>
              )}
              <span className="text-xs text-gray-400 font-mono">MENU DETECT</span>
            </div>
          </div>

          {/* Camera */}
          <div className="relative bg-black overflow-hidden w-full h-[350px] md:h-[450px]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Detection Overlay Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-96 h-64 border-2 rounded-xl transition-all duration-300 ${isPreparationActive
                  ? "border-blue-400 scale-100"
                  : foodConditionOk
                ? "border-emerald-400 scale-100"
              : "border-gray-500 opacity-50 scale-95"
          }`}
        >
              {/* Preparation Countdown */}
              {isPreparationActive && preparationCountdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                  <div className="text-white text-9xl font-bold animate-pulse">{preparationCountdown}</div>
                  <div className="text-white text-sm font-semibold bg-black/60 px-4 py-2 rounded-lg backdrop-blur">
                    Persiapan Frame
                  </div>
                </div>
              )}
              {/* Capture Countdown */}
              {!isPreparationActive && isMenuCountdownActive && menuCountdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-9xl font-bold animate-pulse">{menuCountdown}</div>
                </div>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            {isPreparationActive && (
              <div className="bg-blue-500/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Persiapan {preparationCountdown}s
              </div>
            )}

            {!isPreparationActive && foodConditionOk && (
              <div className="bg-emerald-500/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Kondisi Baik
              </div>
            )}

            {!isPreparationActive && !foodConditionOk && foodCondition && (
              <div className="bg-amber-500/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                {foodCondition === "too-dark" && "Terlalu gelap"}
                {foodCondition === "too-bright" && "Terlalu terang"}
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6">
            <button 
              onClick={(e) => { e.preventDefault(); capturePhoto(); }}
              className="bg-[#1B263A] hover:bg-[#2A3749] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-xl transition-all flex items-center gap-2 pointer-events-auto"
            >
              <Camera className="w-4 h-4" />
              Ambil Foto Manual
            </button>

            {availableCameras.length > 1 && (
              <button
                onClick={() => {
                  const currentIndex = availableCameras.findIndex((cam) => cam.deviceId === selectedCameraId)
                  const nextIndex = (currentIndex + 1) % availableCameras.length
                  const nextCamera = availableCameras[nextIndex]
                  setSelectedCameraId(nextCamera.deviceId)
                  stopCamera(true) // Keep preparation countdown running
                  setTimeout(() => {
                    startCamera("environment", nextCamera.deviceId)
                  }, 100)
                }}
                className="bg-white hover:bg-gray-50 text-[#1B263A] px-4 py-3 rounded-xl text-xs font-bold transition-all border border-gray-200 shadow-xl pointer-events-auto flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Ganti Kamera
              </button>
            )}
          </div>
        </div>
  </div>
  )
}

{/* STEP 7: SUBMITTING */ }
{
  step === "submitting" && (
    <div className="w-full bg-white rounded-xl border border-gray-100 p-12 text-center mx-auto">
      <Loader className="w-8 h-8 text-[#1B263A] animate-spin mx-auto mb-4" />
      <h2 className="text-lg font-bold text-gray-900 mb-1">Menyimpan Data...</h2>
      <p className="text-gray-500 text-sm">Sistem sedang merekam absensi</p>
    </div>
  )
}

{/* STEP 8: RESULT */ }
{
  step === "result" && (
    <div className="w-full mx-auto">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div
          className={`px-5 py-3 border-b ${validationResult?.success ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
        >
          <div className="flex items-center gap-2">
            {validationResult?.success ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">Berhasil Disimpan</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-800">Gagal Disimpan</span>
              </>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="text-center mb-4">
            {validationResult?.success ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            ) : (
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            )}
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {validationResult?.success ? "Absen Berhasil!" : "Gagal!"}
            </h2>
            <p className="text-gray-500 text-sm">{validationResult?.message}</p>
          </div>

          {validationResult?.success && validationResult?.siswa && (
            <div className="border border-gray-100 bg-gray-50 rounded-xl p-5 text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{validationResult.siswa.nama}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {validationResult.siswa.kelas} • NIS {validationResult.siswa.nis}
              </p>
              <div className="inline-block bg-white border border-gray-200 px-4 py-2 rounded-lg font-mono font-bold text-[#1B263A] mb-4">
                🍱 {trayId}
              </div>
              {validationResult.siswa.alergi && validationResult.siswa.alergi.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 text-left">
                  <p className="text-xs text-red-700 font-bold mb-1">Alergi Terdaftar</p>
                  <p className="text-sm text-red-800">{validationResult.siswa.alergi.join(", ")}</p>
                </div>
              )}
            </div>
          )}

          {(facePhoto || menuPhoto) && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {facePhoto && (
                <div>
                  <img
                    src={facePhoto || "/placeholder.svg"}
                    alt="Face"
                    className="w-full aspect-square object-cover rounded-xl border border-gray-200 bg-gray-50"
                  />
                  <p className="text-xs text-center font-medium text-gray-500 mt-2">Wajah</p>
                </div>
              )}
              {menuPhoto && (
                <div>
                  <img
                    src={menuPhoto || "/placeholder.svg"}
                    alt="Menu"
                    className="w-full aspect-square object-cover rounded-xl border border-gray-200 bg-gray-50"
                  />
                  <p className="text-xs text-center font-medium text-gray-500 mt-2">Makanan</p>
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <p className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
              Kembali otomatis dalam 5 detik
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
    </SekolahLayout>
  )
}

export default AbsensiPenerima
