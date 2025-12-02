"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { BarChart3, Package, AlertCircle, CheckCircle2, Loader, Clock, Users, Sparkles, XCircle, Zap } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demombgv1.xyz"

const PengembalianMakanan = () => {
  const [authToken, setAuthToken] = useState("")
  const [credentialsReady, setCredentialsReady] = useState(false)

  // Step management
  const [step, setStep] = useState<"camera-face" | "processing-face" | "rfid-scan" | "camera-food" | "keterangan" | "submitting" | "result" | "statistics">("camera-face")

  // Face detection
  const [faceDetected, setFaceDetected] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [facePhoto, setFacePhoto] = useState<string | null>(null)
  const [foodPhoto, setFoodPhoto] = useState<string | null>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null)

  // RFID & Keterangan
  const [isScanning, setIsScanning] = useState(false)
  const [trayId, setTrayId] = useState("")
  const [keterangan, setKeterangan] = useState("")

  // Result
  const [validationResult, setValidationResult] = useState<any>(null)

  // Statistics
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const rfidPollingRef = useRef<NodeJS.Timeout | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize credentials
  useEffect(() => {
    if (typeof window === "undefined") return
    if (credentialsReady) return

    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const schoolId = localStorage.getItem("sekolahId")

    console.log("[PENGEMBALIAN] Check credentials - token:", token ? "EXISTS" : "MISSING", "schoolId:", schoolId ? "EXISTS" : "MISSING")

    if (!token) {
      console.error("[PENGEMBALIAN] ❌ Token not found")
      setError("Token tidak ditemukan")
      return
    }

    if (schoolId) {
      setAuthToken(token)
      setCredentialsReady(true)
      return
    }

    // sekolahId not ready, set up polling
    console.log("[PENGEMBALIAN] sekolahId not ready, waiting for SekolahLayout...")
    const pollInterval = setInterval(() => {
      const newSchoolId = localStorage.getItem("sekolahId")
      if (newSchoolId) {
        console.log("[PENGEMBALIAN] ✅ sekolahId detected:", newSchoolId)
        setAuthToken(token)
        clearInterval(pollInterval)
        setCredentialsReady(true)
      }
    }, 1000)

    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      console.error("[PENGEMBALIAN] ❌ sekolahId timeout after 10s")
      setError("Sekolah ID tidak ditemukan. Silakan login kembali.")
    }, 10000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [credentialsReady])

  useEffect(() => {
    if (step === "camera-face" && !isCameraActive) {
      startCamera("user")
    } else if (step === "camera-food" && !isCameraActive) {
      startCamera("environment")
    }

    return () => {
      stopCamera()
      stopFaceDetection()
    }
  }, [step])

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

        if (!countdownIntervalRef.current) {
          startCountdown()
        }
      } else {
        setFaceDetected(false)
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
  }

  const startCountdown = () => {
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
  }

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(2)
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
      } else if (step === "camera-food") {
        setFoodPhoto(photoData)
        stopCamera()
        setStep("keterangan")
      }
    }
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

      const formDataFace = new FormData()
      formDataFace.append("foto", fotoFile)

      const response = await fetch(`${API_BASE_URL}/api/face-recognition/detect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataFace,
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

        setSelectedSiswa(normalizedSiswa)
        setStep("rfid-scan")
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

  const submitPengembalian = async () => {
    if (!selectedSiswa || !facePhoto || !foodPhoto || !trayId.trim()) {
      alert("Data tidak lengkap!")
      return
    }

    setStep("submitting")

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")

      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan. Silakan login kembali.")
      }

      // Convert food photo to file
      const foodBlob = await fetch(foodPhoto).then((r) => r.blob())
      const foodFile = new File([foodBlob], "foto-makanan.jpg", { type: "image/jpeg" })

      const fd = new FormData()
      fd.append("siswaId", selectedSiswa.id)
      fd.append("idTray", trayId)
      fd.append("fotoSisaMakanan", foodFile)
      if (keterangan.trim()) {
        fd.append("keterangan", keterangan)
      }

      const response = await fetch(`${API_BASE_URL}/api/pengembalian-makanan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Gagal submit pengembalian makanan")
      }

      setValidationResult({
        success: true,
        message: "Pengembalian makanan berhasil dicatat!",
        siswa: selectedSiswa,
        data: result.data,
      })
      setStep("result")

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
            console.log("[PENGEMBALIAN] RFID detected:", trayIdFormatted)

            if (trayIdFormatted !== lastDetectedRfid) {
              lastDetectedRfid = trayIdFormatted
              setTrayId(trayIdFormatted)
              stopRfidPolling()
              setStep("camera-food")
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

  const handleReset = () => {
    stopCamera()
    stopRfidPolling()
    setFacePhoto(null)
    setFoodPhoto(null)
    setSelectedSiswa(null)
    setValidationResult(null)
    setKeterangan("")
    setTrayId("")
    setStep("camera-face")
  }

  const fetchStatistics = async () => {
    setStatsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pengembalian-makanan/statistics/today`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error("Gagal mengambil statistik")
      }

      const result = await response.json()
      setStats(result.data || result)
      console.log("[PENGEMBALIAN] Stats fetched:", result)
    } catch (err) {
      console.error("[PENGEMBALIAN] Error fetching stats:", err)
      setError(err instanceof Error ? err.message : "Gagal mengambil data statistik")
    } finally {
      setStatsLoading(false)
    }
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
    <SekolahLayout currentPage="pengembalian">
      {/* Header */}
      <div className="mb-8 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Pengembalian Makanan</h1>
            <p className="text-gray-600 mt-1 text-sm">Deteksi wajah & pilih status makanan</p>
          </div>
          <button
            onClick={() => {
              if (step !== "statistics") {
                fetchStatistics()
              }
              setStep(step === "statistics" ? "camera-face" : "statistics")
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            {step === "statistics" ? (
              <>
                <div className="w-5 h-5">📷</div>
                Kembali ke Scan
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                Lihat Statistik
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">{error}</p>
          </div>
        </div>
      )}

      {/* STEP 1: CAMERA FACE */}
      {step === "camera-face" && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-white">Kamera Aktif</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">STEP 1</span>
          </div>

          <div className="relative bg-black overflow-hidden aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

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

            <div className="absolute top-6 right-6 space-y-3">
              {faceDetected && (
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  Wajah Terdeteksi
                </div>
              )}
            </div>

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
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-full flex items-center justify-center">
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

      {/* STEP 3: RFID SCAN */}
      {step === "rfid-scan" && selectedSiswa && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold text-white">Wajah Berhasil Dikenali - Scan Tray RFID</span>
            </div>
          </div>

          <div className="p-8">
            {/* Student Info */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border-2 border-emerald-200">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedSiswa.nama}</h3>
                <p className="text-sm text-gray-600">{selectedSiswa.kelas}</p>
                <p className="text-xs text-gray-500">NIS: {selectedSiswa.nis}</p>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tempelkan Tray RFID</h3>
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

            {/* Ulang Button */}
            <button
              onClick={() => {
                setSelectedSiswa(null)
                setTrayId("")
                setFacePhoto(null)
                setStep("camera-face")
              }}
              className="w-full px-6 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
            >
              Ulang
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CAMERA FOOD */}
      {step === "camera-food" && selectedSiswa && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold text-white">Scan Foto Makanan Sisa</span>
            </div>
          </div>

          <div className="p-8">
            {/* Student Info & Tray Info */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border-2 border-emerald-200">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedSiswa.nama}</h3>
                <p className="text-sm text-gray-600">{selectedSiswa.kelas}</p>
                <p className="text-xs text-gray-500">NIS: {selectedSiswa.nis}</p>
              </div>

              <div className="pt-3 border-t border-emerald-300 mt-3">
                <p className="text-xs font-bold text-emerald-700 mb-1">ID TRAY</p>
                <p className="text-lg font-bold text-emerald-900">{trayId}</p>
              </div>

              {selectedSiswa.alergi && selectedSiswa.alergi.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500 mt-3">
                  <p className="text-xs text-red-700 font-bold">⚠️ ALERGI TERDAFTAR</p>
                  <p className="text-sm text-red-800 font-semibold mt-1">{selectedSiswa.alergi.join(", ")}</p>
                </div>
              )}
            </div>

            {/* Camera for food */}
            <div className="relative bg-black overflow-hidden aspect-video rounded-lg mb-6">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute top-6 left-6 bg-black/60 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Kamera Aktif
              </div>
            </div>

            {/* Button */}
            <button
              onClick={capturePhoto}
              disabled={!isCameraActive}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="text-xl">📷</span>
              Ambil Foto Makanan
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: KETERANGAN */}
      {step === "keterangan" && selectedSiswa && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span className="text-sm font-semibold text-white">Konfirmasi Data Pengembalian</span>
              </div>
            </div>

            <div className="p-8">
              {/* Student Info */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border-2 border-emerald-200">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{selectedSiswa.nama}</h3>
                  <p className="text-sm text-gray-600">{selectedSiswa.kelas}</p>
                  <p className="text-xs text-gray-500">NIS: {selectedSiswa.nis}</p>
                </div>

                <div className="pt-3 border-t border-emerald-300 mt-3">
                  <p className="text-xs font-bold text-emerald-700 mb-1">ID TRAY</p>
                  <p className="text-lg font-bold text-emerald-900">{trayId}</p>
                </div>

                {selectedSiswa.alergi && selectedSiswa.alergi.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500 mt-3">
                    <p className="text-xs text-red-700 font-bold">⚠️ ALERGI TERDAFTAR</p>
                    <p className="text-sm text-red-800 font-semibold mt-1">{selectedSiswa.alergi.join(", ")}</p>
                  </div>
                )}
              </div>

              {/* Photos Preview */}
              {(facePhoto || foodPhoto) && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {facePhoto && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Foto Wajah</p>
                      <img
                        src={facePhoto || "/placeholder.svg"}
                        alt="Face"
                        className="w-full rounded-xl border-2 border-gray-200 h-32 object-cover"
                      />
                    </div>
                  )}
                  {foodPhoto && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Foto Makanan</p>
                      <img
                        src={foodPhoto || "/placeholder.svg"}
                        alt="Food"
                        className="w-full rounded-xl border-2 border-gray-200 h-32 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Keterangan Input */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan (Opsional)</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Makanan tidak habis karena siswa tidak nafsu makan..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setSelectedSiswa(null)
                    setKeterangan("")
                    setFacePhoto(null)
                    setFoodPhoto(null)
                    setTrayId("")
                    setStep("camera-face")
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Ulang
                </button>
                <button
                  onClick={submitPengembalian}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg text-white rounded-xl transition-all font-semibold"
                >
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SUBMITTING */}
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

      {/* STEP 5: RESULT */}
      {step === "result" && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
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

            {validationResult?.success && validationResult?.siswa && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border-2 border-emerald-200">
                <p className="text-xs font-bold text-emerald-700 mb-3">✓ DATA TERSIMPAN</p>
                <p className="text-xl font-bold text-gray-900 mb-1">{validationResult.siswa.nama}</p>
                <p className="text-sm text-gray-600 mb-3">
                  {validationResult.siswa.kelas} • NIS {validationResult.siswa.nis}
                </p>
                <div className="pt-3 border-t border-emerald-300">
                  <p className="text-sm font-semibold text-emerald-700">
                    Status: {validationResult.status === "habis" ? "✅ Habis" : "⚠️ Tidak Habis"}
                  </p>
                </div>
              </div>
            )}

            {(facePhoto || foodPhoto) && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {facePhoto && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Foto Wajah</p>
                    <img
                      src={facePhoto || "/placeholder.svg"}
                      alt="Face"
                      className="w-full rounded-xl border-2 border-gray-200 max-h-64 object-cover"
                    />
                  </div>
                )}
                {foodPhoto && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Foto Makanan</p>
                    <img
                      src={foodPhoto || "/placeholder.svg"}
                      alt="Food"
                      className="w-full rounded-xl border-2 border-gray-200 max-h-64 object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            <p className="text-center text-gray-500 text-xs">Kembali otomatis dalam 5 detik...</p>
          </div>
        </div>
      )}

      {/* STEP 6: STATISTICS */}
      {step === "statistics" && (
        <div>
          {statsLoading ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Mengambil data statistik...</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Pengembalian"
                value={stats.totalPengembalian || 0}
                subtitle="Hari ini"
                icon={Package}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                title="Total Tray"
                value={stats.totalTray || 0}
                subtitle="Tray"
                icon={BarChart3}
                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
              <StatCard
                title="Siswa"
                value={stats.totalSiswa || 0}
                subtitle="Siswa"
                icon={Users}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <StatCard
                title="Update Terakhir"
                value={stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleTimeString("id-ID") : "-"}
                subtitle="Hari ini"
                icon={Clock}
                color="bg-gradient-to-br from-amber-500 to-amber-600"
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada data statistik tersedia</p>
            </div>
          )}
        </div>
      )}
    </SekolahLayout>
  )
}

export default PengembalianMakanan
