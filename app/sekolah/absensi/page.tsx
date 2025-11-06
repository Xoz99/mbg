"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { Users, Loader, Camera, CheckCircle, School, X, CheckCircle2, Hash, XCircle, Sparkles, Zap } from "lucide-react"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demombgv1.xyz"

const AbsensiPenerima = () => {
  const [step, setStep] = useState<
    "camera-face" | "processing-face" | "rfid-scan" | "input-tray" | "confirm" | "camera-menu" | "submitting" | "result"
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
  const [siswaData, setSiswaData] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isFetchingRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const rfidPollingRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================
  // HOOKS
  // ============================================
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const storedSekolahId = localStorage.getItem("sekolahId")

    console.log(
      "[ABSENSI INIT] authToken:",
      storedToken ? "EXISTS (" + storedToken.substring(0, 20) + "...)" : "MISSING",
    )
    console.log("[ABSENSI INIT] sekolahId:", storedSekolahId)

    if (storedToken) setAuthToken(storedToken)
    if (storedSekolahId) setSekolahId(storedSekolahId)

    if (!storedToken || !storedSekolahId) {
      setLoading(false)
      setError("Token atau Sekolah ID tidak ditemukan")
    }
  }, [])

  useEffect(() => {
    if (step === "camera-face" && !isCameraActive) {
      startCamera("user")
    } else if (step === "camera-menu" && !isCameraActive) {
      startCamera("environment")
    }

    return () => {
      stopCamera()
      stopFaceDetection()
    }
  }, [step])

  const stats = useMemo(() => {
    const total = siswaData.length
    const lakiLaki = siswaData.filter((s) => s.jenisKelamin === "LAKI_LAKI").length
    const perempuan = siswaData.filter((s) => s.jenisKelamin === "PEREMPUAN").length
    const uniqueKelas = new Set(siswaData.map((s) => s.kelas).filter((k) => k))
    const totalKelas = uniqueKelas.size

    return { total, lakiLaki, perempuan, totalKelas }
  }, [siswaData])

  const fetchSiswa = useCallback(async () => {
    if (!sekolahId || !authToken || isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      setLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/siswa?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error(`API Error: ${response.status}`)

      const data = await response.json()

      const siswaList = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : data

      const normalizedList = siswaList.map((siswa: any) => {
        let kelasNama = ""
        if (typeof siswa.kelas === "string") {
          kelasNama = siswa.kelas
        } else if (siswa.kelas?.nama) {
          kelasNama = String(siswa.kelas.nama)
        } else if (siswa.kelasId?.nama) {
          kelasNama = String(siswa.kelasId.nama)
        }

        let alergiArray: string[] = []
        if (siswa.alergi) {
          if (Array.isArray(siswa.alergi)) {
            alergiArray = siswa.alergi
              .map((a: any) => String(a.namaAlergi || a.nama || a))
              .filter((a: string) => a.trim())
          } else if (typeof siswa.alergi === "string") {
            alergiArray = siswa.alergi
              .split(",")
              .map((a: string) => a.trim())
              .filter((a: string) => a)
          }
        }

        let fotoUrl = siswa.fotoUrl || ""
        if (fotoUrl && !fotoUrl.startsWith("data:") && !fotoUrl.startsWith("http")) {
          fotoUrl = `${API_BASE_URL}${fotoUrl}`
        }

        return {
          ...siswa,
          id: String(siswa.id || siswa._id || ""),
          nama: String(siswa.nama || ""),
          nis: String(siswa.nis || ""),
          kelas: kelasNama,
          kelasId: String(siswa.kelasId?.id || siswa.kelas?.id || ""),
          jenisKelamin: String(siswa.jenisKelamin || "LAKI_LAKI"),
          umur: Number(siswa.umur || 0),
          alergi: alergiArray,
          statusGizi: String(siswa.statusGizi || "NORMAL"),
          fotoUrl: fotoUrl,
        }
      })

      setSiswaData(normalizedList)
      setError(null)
    } catch (err) {
      console.error("Error fetching siswa:", err)
      setError(err instanceof Error ? err.message : "Gagal mengambil data siswa")
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [sekolahId, authToken])

  useEffect(() => {
    if (sekolahId && authToken) {
      fetchSiswa()
    }
  }, [sekolahId, authToken, fetchSiswa])

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
      if (!videoRef.current || !canvasRef.current) return

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
    setCountdown(3)
    let count = 3

    countdownIntervalRef.current = setInterval(() => {
      count -= 1
      setCountdown(count)

      if (count <= 0) {
        stopCountdown()
        capturePhoto()
      }
    }, 1000)
  }

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(3)
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

      const detectedSiswa = result.data?.siswa || result.siswa || result.data

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
        throw new Error("Wajah tidak dikenali. Silakan coba lagi.")
      }
    } catch (err) {
      console.error("[VALIDATE FACE] Error:", err)
      alert(err instanceof Error ? err.message : "Wajah tidak dikenali. Silakan coba lagi.")
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatCard
          title="Total Siswa"
          value={stats.total}
          subtitle="Siswa terdaftar"
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
          {faceDetected ? "✓ Tahan posisi..." : "Posisikan wajah ke tengah"}
        </div>
      </div>
    </div>

    {/* Manual Capture */}
    <div className="px-6 py-6 border-t border-gray-100">
      <button
        onClick={capturePhoto}
        disabled={!isCameraActive}
        className="w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
      >
        <Camera className="w-5 h-5" />
        Ambil Foto Manual
      </button>
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
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Validasi Wajah</h2>
    <p className="text-gray-600 text-sm mb-6">Menganalisis fitur wajah Anda...</p>
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
    {/* Success Header */}
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-white" />
        <span className="text-sm font-semibold text-white">Wajah Berhasil Dikenali</span>
      </div>
    </div>

    {/* Content */}
    <div className="p-8">
      {/* Student Info */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border-2 border-emerald-200">
        <div className="flex items-center gap-4 mb-4">
          {facePhoto && (
            <img
              src={facePhoto || "/placeholder.svg"}
              alt="Foto Validasi"
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{selectedSiswa.nama}</h3>
            <p className="text-sm text-gray-600">{selectedSiswa.kelas}</p>
            <p className="text-xs text-gray-500">NIS: {selectedSiswa.nis}</p>
          </div>
        </div>

        {selectedSiswa.alergi && selectedSiswa.alergi.length > 0 && (
          <div className="mt-4 bg-red-50 rounded-lg p-3 border-l-4 border-red-500">
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
                <div className="flex gap-4 mb-4">
                  {facePhoto && (
                    <img
                      src={facePhoto || "/placeholder.svg"}
                      alt="Foto"
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedSiswa.nama}</h3>
                    <p className="text-sm text-gray-600">{selectedSiswa.kelas}</p>
                    <p className="text-xs text-gray-500">NIS {selectedSiswa.nis}</p>
                  </div>
                </div>

                {selectedSiswa.alergi && selectedSiswa.alergi.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500">
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
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold text-white">Kamera Aktif</span>
      </div>
      <span className="text-xs text-gray-400 font-mono">STEP 6</span>
    </div>

    {/* Camera */}
    <div className="relative bg-black overflow-hidden aspect-video">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      <div className="absolute top-6 left-6 bg-black/60 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        Kamera Aktif
      </div>
    </div>

    {/* Info & Button */}
    <div className="px-6 py-6 border-t border-gray-100">
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600">
          🍱 Tray: <span className="font-mono font-bold text-gray-900">{trayId}</span>
        </p>
      </div>
      <button
        onClick={capturePhoto}
        disabled={!isCameraActive}
        className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Camera className="w-5 h-5" />
        Ambil Foto Makanan
      </button>
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
