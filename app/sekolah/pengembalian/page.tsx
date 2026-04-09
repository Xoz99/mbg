"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { AlertCircle, CheckCircle2, Loader, Sparkles, XCircle, Camera, RefreshCw, Nfc } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

const PengembalianMakanan = () => {
  const [authToken, setAuthToken] = useState("")
  const [credentialsReady, setCredentialsReady] = useState(false)

  // Step management
  const [step, setStep] = useState<"camera-face" | "processing-face" | "rfid-scan" | "camera-food" | "keterangan" | "submitting" | "result">("camera-face")

  // Face detection
  const [faceDetected, setFaceDetected] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [facePhoto, setFacePhoto] = useState<string | null>(null)
  const [foodPhoto, setFoodPhoto] = useState<string | null>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null)

  // Food detection
  const [foodConditionOk, setFoodConditionOk] = useState(false)
  const [foodCondition, setFoodCondition] = useState<string>("")
  const [foodCountdown, setFoodCountdown] = useState(3)
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
      setCredentialsReady(true)
      return
    }

    const pollInterval = setInterval(() => {
      const newSchoolId = localStorage.getItem("sekolahId")
      if (newSchoolId) {
        setAuthToken(token)
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
    setCountdown(3)
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
    setFoodCountdown(3)
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
    setCountdown(2)
    let count = 2
    countdownIntervalRef.current = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count <= 0) {
        stopCountdown()
        capturePhoto()
      }
    }, 500)
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
    setFoodCountdown(3)
    let count = 3
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
      } catch (err) {}
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
            <div className="relative bg-black h-[350px] md:h-[450px]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-64 h-64 border-2 rounded-full transition-all ${faceDetected ? "border-emerald-400" : "border-gray-500 opacity-50"}`}>
                  {faceDetected && countdown > 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-white text-6xl font-bold">{countdown}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                {availableCameras.length > 1 && (
                  <button onClick={switchCamera} className="p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all" title="Switch Camera">
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
                <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full text-white text-xs font-semibold">
                  {faceDetected ? "✓ Mengambil foto..." : "Posisikan wajah di lingkaran"}
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

      {step === "rfid-scan" && selectedSiswa && (
        <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden mx-auto shadow-sm">
          <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800">Wajah Teridentifikasi</span>
          </div>
          <div className="p-4">
            <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-6 rounded-2xl mb-6 border border-gray-100 shadow-sm">
              <div className="relative">
                <img src={selectedSiswa.fotoSiswa} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-white shadow-sm" alt="Student profile" />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-xl md:text-2xl font-black text-[#1B263A] tracking-tight mb-1">{selectedSiswa.nama}</h2>
                <p className="text-gray-400 text-[10px] font-extrabold uppercase tracking-widest">{selectedSiswa.kelas?.nama} • NIS {selectedSiswa.nis}</p>
                
                {selectedSiswa.pickupInfo ? (
                  <div className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md shadow-blue-200">
                    <Nfc className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-wider">KEMBALIKAN TRAY: {selectedSiswa.pickupInfo.idTray}</span>
                  </div>
                ) : (
                  <div className="mt-4 inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-tight">BELUM AMBIL MAKANAN HARI INI</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
              {!selectedSiswa.pickupInfo ? (
                <div className="px-8 flex flex-col items-center">
                   <XCircle className="w-12 h-12 text-red-400 mb-4" />
                   <h3 className="font-bold text-red-600">Tidak Bisa Kembalikan</h3>
                   <p className="text-xs text-slate-500 mt-2">Siswa ini tercatat belum melakukan pengambilan makanan hari ini.</p>
                   <button onClick={handleReset} className="mt-6 px-6 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">Coba Siswa Lain</button>
                </div>
              ) : !showManualInput ? (
                <>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                    <Nfc className="w-8 h-8 text-[#1B263A] animate-pulse" />
                  </div>
                  <h3 className="font-bold text-[#1B263A]">Tempelkan Tray RFID</h3>
                  <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Scanning...</p>
                  <button 
                    onClick={() => setShowManualInput(true)}
                    className="mt-6 text-[10px] text-[#1B263A] font-extrabold uppercase tracking-widest hover:underline"
                  >
                    Gunakan Input Manual
                  </button>
                </>
              ) : (
                <div className="w-full px-6">
                  <h3 className="font-bold text-[#1B263A] mb-4 text-sm">Input ID Tray Manual</h3>
                  {trayId && selectedSiswa.pickupInfo?.idTray && trayId !== selectedSiswa.pickupInfo.idTray && (
                    <div className="mb-4 bg-orange-50 border border-orange-200 p-2 rounded-lg flex items-center gap-2">
                       <AlertCircle className="w-4 h-4 text-orange-500" />
                       <p className="text-[10px] text-orange-700 font-bold uppercase">Tray Tidak Cocok! (Harusnya: {selectedSiswa.pickupInfo.idTray})</p>
                    </div>
                  )}
                  <input 
                    type="text"
                    value={trayId}
                    onChange={(e) => setTrayId(e.target.value.toUpperCase())}
                    className={`w-full p-4 border-2 rounded-2xl text-center font-mono font-black text-xl mb-4 transition-all outline-none ${trayId && selectedSiswa.pickupInfo?.idTray && trayId !== selectedSiswa.pickupInfo.idTray ? "border-orange-300 bg-orange-50" : "border-slate-200 focus:border-[#1B263A]"}`}
                    placeholder="CONTOH: TRAY-123"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setShowManualInput(false)
                        setTrayId("")
                      }}
                      className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-wider"
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
                      className="flex-[2] py-4 bg-[#1B263A] text-white rounded-xl font-bold text-xs shadow-lg shadow-slate-200 disabled:opacity-50 disabled:shadow-none"
                    >
                      Lanjutkan
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleReset} className="w-full mt-4 py-3 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all">Ulang Proses</button>
          </div>
        </div>
      )}

      {step === "camera-food" && selectedSiswa && (
        <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden mx-auto shadow-sm">
          <div className="bg-[#1B263A] px-4 py-3 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#D0B064]" />
              <span className="text-xs font-bold">Foto Makanan Sisa</span>
            </div>
            <span className="text-[10px] font-bold opacity-70 bg-white/10 px-2 py-0.5 rounded uppercase">TRAY: {trayId}</span>
          </div>
          <div className="relative h-[350px] md:h-[450px] bg-black text-white">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto z-20">
              {availableCameras.length > 1 && (
                <button onClick={switchCamera} className="p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all" title="Ganti Kamera">
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleReset} className="p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all" title="Reset">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {cameraError && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/80 backdrop-blur px-6 py-4 rounded-2xl text-white text-center shadow-xl border border-red-500/50 z-30 min-w-[240px]">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-bold text-sm">Error Kamera</p>
                <p className="text-[10px] opacity-90 mt-1 mb-4">{cameraError}</p>
                <button onClick={() => { setCameraError(null); startCamera("environment", selectedCameraId); }} className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold text-xs shadow-md">
                  Coba Lagi
                </button>
              </div>
            )}
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-80 h-60 border-2 rounded-2xl transition-all duration-300 ${isPreparationActive ? "border-[#D0B064] scale-100" : foodConditionOk ? "border-emerald-400 scale-100 shadow-[0_0_20px_rgba(52,211,153,0.3)]" : "border-white/30 opacity-50 scale-95"}`}>
                {(isPreparationActive || (isFoodCountdownActive && foodCountdown > 0)) && (
                  <div className="flex items-center justify-center h-full bg-black/20 rounded-2xl">
                    <div className="text-white text-8xl font-black drop-shadow-lg">
                      {isPreparationActive ? preparationCountdown : foodCountdown}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4 px-6">
              {!isPreparationActive && (
                <button 
                  onClick={(e) => { e.preventDefault(); capturePhoto(); }}
                  className="bg-[#D0B064] hover:bg-[#E0C074] text-[#1B263A] px-6 py-3 rounded-xl text-sm font-black shadow-xl transition-all flex items-center gap-2 pointer-events-auto transform hover:scale-105 active:scale-95"
                >
                  <Camera className="w-5 h-5" />
                  AMBIL FOTO SEKARANG
                </button>
              )}
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full px-8">
              <div className="bg-black/60 backdrop-blur px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider border border-white/10 text-center">
                {isPreparationActive ? "Persiapan Frame" : isFoodCountdownActive ? "📸 Mengambil Foto..." : foodConditionOk ? "Menangkap Makanan..." : "Atur Posisi Makanan"}
              </div>
              <button 
                onClick={capturePhoto}
                className="w-full max-w-xs py-3 bg-white text-[#1B263A] rounded-xl font-bold text-sm shadow-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Ambil Foto Manual
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
