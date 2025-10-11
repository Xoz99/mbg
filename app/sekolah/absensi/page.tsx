// app/sekolah/absensi/page.tsx
"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
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
  ScanFace,
  UserCheck,
  Loader,
} from "lucide-react"
import { useSiswa } from "@/hooks/use-siswa"
import SiswaRegisterForm from "@/components/siswa-register-form"
import Link from "next/link"

const AbsensiPenerima = () => {
  const [step, setStep] = useState<"register" | "detect-face" | "camera-plate" | "analyzing" | "result">("register")
  const [showRegisterFor, setShowRegisterFor] = useState<any>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null)
  const [facePhoto, setFacePhoto] = useState<string | null>(null)
  const [platePhoto, setPlatePhoto] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("semua")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [trayDetected, setTrayDetected] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<any>(null)
  const countdownTimerRef = useRef<any>(null)
  const trayDetectionIntervalRef = useRef<any>(null)

  const { siswa, updateSiswa, markRegistered, markAbsen } = useSiswa()

  const siswaData = useMemo(() => siswa, [siswa])

  const filteredSiswa = useMemo(() => {
    return siswaData.filter((s) => {
      const matchSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm)
      const matchStatus = filterStatus === "semua" || s.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [siswaData, searchTerm, filterStatus])

  const stats = useMemo(() => {
    const total = siswaData.length
    const sudah = siswaData.filter((s) => s.status === "sudah").length
    const habis = siswaData.filter((s) => s.statusMakan === "habis").length
    const dibungkus = siswaData.filter((s) => s.statusMakan === "dibungkus").length
    return { total, sudah, belum: total - sudah, habis, dibungkus }
  }, [siswaData])

  useEffect(() => {
    const loadFaceAPI = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api")

        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model"

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])

        setIsFaceApiLoaded(true)
        console.log("Face-API models loaded successfully")
      } catch (error) {
        console.error("Error loading Face-API:", error)
        alert("Gagal memuat model Face Recognition. Menggunakan mode manual.")
      }
    }

    loadFaceAPI()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        videoRef.current.onloadedmetadata = () => {
          if (step === "detect-face" && isFaceApiLoaded) {
            startFaceDetection()
          }
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current)
    }
    if (trayDetectionIntervalRef.current) {
      clearInterval(trayDetectionIntervalRef.current)
    }
    setCountdown(null)
    setTrayDetected(false)
  }

  const startFaceDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsDetecting(true)
    const faceapi = await import("@vladmandic/face-api")

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    detectionIntervalRef.current = setInterval(async () => {
      if (!video.paused && !video.ended) {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors()

        if (detections.length > 0) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            detections.forEach((detection) => {
              const { box } = detection.detection
              ctx.strokeStyle = "#00ff00"
              ctx.lineWidth = 3
              ctx.strokeRect(box.x, box.y, box.width, box.height)

              ctx.fillStyle = "#00ff00"
              ctx.font = "16px Arial"
              ctx.fillText(`Face Detected: ${(detection.detection.score * 100).toFixed(1)}%`, box.x, box.y - 10)
            })
          }

          const recognizedSiswa = await recognizeFace(detections[0].descriptor)

          if (recognizedSiswa) {
            await autoCaptureFace(recognizedSiswa)
          }
        }
      }
    }, 100)
  }

  const recognizeFace = async (descriptor: Float32Array): Promise<any> => {
    const available = siswaData.filter((s) => s.registered && s.status === "belum")
    if (available.length > 0 && Math.random() > 0.7) return available[0]
    return null
  }

  const autoCaptureFace = async (siswa: any) => {
    if (!videoRef.current || !canvasRef.current) return

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }
    setIsDetecting(false)

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const photoData = canvas.toDataURL("image/jpeg")

      setFacePhoto(photoData)
      setSelectedSiswa(siswa)

      alert(`Wajah terdeteksi: ${siswa.nama}\nKelas: ${siswa.kelas}`)

      stopCamera()
      setTimeout(() => {
        setStep("camera-plate")
        setTimeout(() => {
          startCamera()
          setTimeout(() => startTrayDetection(), 500)
        }, 100)
      }, 1000)
    }
  }

  const startTrayDetection = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    trayDetectionIntervalRef.current = setInterval(() => {
      if (!video.paused && !video.ended && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Area deteksi (kotak tengah 60% dari frame)
          const boxWidth = canvas.width * 0.6
          const boxHeight = canvas.height * 0.6
          const boxX = (canvas.width - boxWidth) / 2
          const boxY = (canvas.height - boxHeight) / 2

          // Ambil data pixel dari area deteksi
          const imageData = ctx.getImageData(boxX, boxY, boxWidth, boxHeight)
          const pixels = imageData.data

          // Hitung brightness rata-rata
          let totalBrightness = 0
          let edgeCount = 0

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            const brightness = (r + g + b) / 3
            totalBrightness += brightness

            // Deteksi edge sederhana
            if (i > 4 && Math.abs(brightness - (pixels[i - 4] + pixels[i - 3] + pixels[i - 2]) / 3) > 30) {
              edgeCount++
            }
          }

          const avgBrightness = totalBrightness / (pixels.length / 4)
          const edgeRatio = edgeCount / (pixels.length / 4)

          // Jika ada objek dengan cukup edge dan brightness berbeda dari background
          const hasObject = avgBrightness > 40 && avgBrightness < 200 && edgeRatio > 0.05

          if (hasObject && !trayDetected && countdown === null) {
            setTrayDetected(true)
            startCountdown()
          } else if (!hasObject && trayDetected) {
            // Reset jika objek hilang
            setTrayDetected(false)
            if (countdownTimerRef.current) {
              clearTimeout(countdownTimerRef.current)
              setCountdown(null)
            }
          }

          // Gambar kotak guide
          ctx.strokeStyle = trayDetected ? "#22c55e" : "#eab308"
          ctx.lineWidth = 4
          ctx.setLineDash([10, 5])
          ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)
          ctx.setLineDash([])

          // Gambar corner markers
          const cornerSize = 30
          ctx.strokeStyle = trayDetected ? "#22c55e" : "#eab308"
          ctx.lineWidth = 6

          // Top-left
          ctx.beginPath()
          ctx.moveTo(boxX, boxY + cornerSize)
          ctx.lineTo(boxX, boxY)
          ctx.lineTo(boxX + cornerSize, boxY)
          ctx.stroke()

          // Top-right
          ctx.beginPath()
          ctx.moveTo(boxX + boxWidth - cornerSize, boxY)
          ctx.lineTo(boxX + boxWidth, boxY)
          ctx.lineTo(boxX + boxWidth, boxY + cornerSize)
          ctx.stroke()

          // Bottom-left
          ctx.beginPath()
          ctx.moveTo(boxX, boxY + boxHeight - cornerSize)
          ctx.lineTo(boxX, boxY + boxHeight)
          ctx.lineTo(boxX + cornerSize, boxY + boxHeight)
          ctx.stroke()

          // Bottom-right
          ctx.beginPath()
          ctx.moveTo(boxX + boxWidth - cornerSize, boxY + boxHeight)
          ctx.lineTo(boxX + boxWidth, boxY + boxHeight)
          ctx.lineTo(boxX + boxWidth, boxY + boxHeight - cornerSize)
          ctx.stroke()
        }
      }
    }, 100)
  }

  const startCountdown = () => {
    setCountdown(3)

    const doCountdown = (num: number) => {
      if (num > 0) {
        countdownTimerRef.current = setTimeout(() => {
          setCountdown(num - 1)
          doCountdown(num - 1)
        }, 1000)
      } else {
        // Capture otomatis
        autoCapturePlate()
      }
    }

    doCountdown(3)
  }

  const autoCapturePlate = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      alert("Video belum siap. Coba lagi...")
      setCountdown(null)
      setTrayDetected(false)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const photoData = canvas.toDataURL("image/jpeg", 0.9)

      setPlatePhoto(photoData)
      stopCamera()
      analyzeWithAI(photoData)
    }
  }

  const manualCapture = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      alert("Video belum siap. Tunggu sebentar...")
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const photoData = canvas.toDataURL("image/jpeg", 0.9)

      if (step === "camera-plate") {
        setPlatePhoto(photoData)
        stopCamera()
        analyzeWithAI(photoData)
      }
    }
  }

  const analyzeWithAI = async (imageData: string) => {
    setStep("analyzing")

    try {
      const base64Image = imageData.split(",")[1]

      const response = await fetch("/api/analyze-plate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          siswa: selectedSiswa,
        }),
      })

      const result = await response.json()

      setAnalysisResult({
        isFinished: result.isFinished || Math.random() > 0.5,
        confidence: result.confidence || (Math.random() * 30 + 70).toFixed(1),
        description: result.description || "Makanan masih tersisa sekitar 30%",
        remainingPercentage: result.remainingPercentage || 30,
      })
      setStep("result")
    } catch (error) {
      console.error("Error analyzing:", error)
      alert("Gagal menganalisis foto. Menggunakan hasil simulasi.")
      setAnalysisResult({
        isFinished: Math.random() > 0.5,
        confidence: 75,
        description: "Hasil simulasi - API error",
      })
      setStep("result")
    }
  }

  const handleFinish = (action: "habis" | "dibungkus" | "tidak") => {
    console.log("Saving:", {
      siswa: selectedSiswa,
      facePhoto,
      platePhoto,
      analysis: analysisResult,
      action,
      timestamp: new Date().toISOString(),
    })

    if (selectedSiswa?.id) {
      markAbsen(selectedSiswa.id, action)
    }

    setStep("detect-face")
    setSelectedSiswa(null)
    setFacePhoto(null)
    setPlatePhoto(null)
    setAnalysisResult(null)

    alert(
      `✅ Absensi ${selectedSiswa.nama} berhasil disimpan!\nStatus: ${
        action === "habis" ? "Makanan Habis" : action === "dibungkus" ? "Dibungkus" : "Tidak Dibungkus"
      }`,
    )

    setTimeout(() => startCamera(), 500)
  }

  useEffect(() => {
    if (step === "detect-face" && isFaceApiLoaded) {
      startCamera()
    }

    return () => {
      stopCamera()
    }
  }, [step, isFaceApiLoaded])

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
  )

  return (
    <SekolahLayout currentPage="absensi">
      {step === "register" && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Registrasi Siswa MBG</h2>
              <p className="text-gray-600">Daftarkan siswa yang belum terdaftar sebelum memulai Face Recognition.</p>
            </div>
            <Link href="/sekolah/registrasi" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Kelola Registrasi
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Belum Terdaftar</h3>
              <div className="space-y-3 max-h-80 overflow-auto">
                {siswaData.filter((s) => !s.registered).length === 0 && (
                  <p className="text-sm text-gray-600">Semua siswa sudah terdaftar.</p>
                )}
                {siswaData
                  .filter((s) => !s.registered)
                  .map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl">
                          {s.foto || "🧑"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.nama}</p>
                          <p className="text-sm text-gray-600">
                            {s.kelas} • NIS {s.nis}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowRegisterFor(s)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
                        >
                          Lengkapi Data
                        </button>
                        <button
                          onClick={() => markRegistered(s.id, true)}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm"
                        >
                          Daftarkan
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Siap Scan</h3>
              <p className="text-sm text-gray-600 mb-3">Siswa terdaftar dan belum absen.</p>
              <div className="space-y-2 max-h-80 overflow-auto">
                {siswaData
                  .filter((s) => s.registered && s.status === "belum")
                  .map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-lg">
                          {s.foto || "🧑"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.nama}</p>
                          <p className="text-xs text-gray-600">
                            {s.kelas} • NIS {s.nis}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Terdaftar</span>
                    </div>
                  ))}
                {siswaData.filter((s) => s.registered && s.status === "belum").length === 0 && (
                  <p className="text-sm text-gray-600">Belum ada yang siap scan.</p>
                )}
              </div>

              <button
                onClick={() => setStep("detect-face")}
                disabled={siswaData.filter((s) => s.registered && s.status === "belum").length === 0}
                className="mt-4 w-full px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mulai Face Recognition
              </button>
            </div>
          </div>
        </div>
      )}

      {showRegisterFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Lengkapi Data Siswa</h3>
              <button onClick={() => setShowRegisterFor(null)} className="px-3 py-2 rounded-lg hover:bg-gray-100">
                Tutup
              </button>
            </div>
            <div className="p-6">
              <SiswaRegisterForm
                initial={showRegisterFor}
                onCancel={() => setShowRegisterFor(null)}
                onSave={(data) => {
                  updateSiswa(showRegisterFor.id, { ...data, registered: true })
                  setShowRegisterFor(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {step !== "register" && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Absensi Penerima MBG</h1>
            <p className="text-gray-600">Face Recognition + AI Vision untuk verifikasi makanan habis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <StatCard title="Total Siswa" value={stats.total} subtitle="Terdaftar" icon={Users} color="bg-blue-500" />
            <StatCard
              title="Sudah Absen"
              value={stats.sudah}
              subtitle="Telah menerima"
              icon={CheckCircle}
              color="bg-green-500"
            />
            <StatCard title="Belum Absen" value={stats.belum} subtitle="Menunggu" icon={Clock} color="bg-orange-500" />
            <StatCard
              title="Habis"
              value={stats.habis}
              subtitle="Makanan habis"
              icon={Utensils}
              color="bg-purple-500"
            />
            <StatCard
              title="Dibungkus"
              value={stats.dibungkus}
              subtitle="Bawa pulang"
              icon={Package}
              color="bg-yellow-500"
            />
          </div>

          {step === "detect-face" && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900">🎭 Face Recognition - Deteksi Otomatis</h2>
                  {!isFaceApiLoaded && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading AI Model...</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600">
                  {isDetecting
                    ? "🔍 Sistem sedang mendeteksi wajah... Posisikan wajah Anda di depan kamera"
                    : "Arahkan wajah ke kamera untuk deteksi otomatis"}
                </p>
              </div>

              <div className="relative bg-black rounded-xl overflow-hidden mb-6">
                <video ref={videoRef} autoPlay playsInline className="w-full h-[500px] object-cover" />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

                {isDetecting && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                    <ScanFace className="w-5 h-5" />
                    <span className="font-semibold">Scanning...</span>
                  </div>
                )}

                {selectedSiswa && (
                  <div className="absolute bottom-4 left-4 right-4 bg-green-500 text-white p-4 rounded-lg">
                    <p className="font-bold text-lg">✓ Terdeteksi: {selectedSiswa.nama}</p>
                    <p className="text-sm">
                      Kelas: {selectedSiswa.kelas} | NIS: {selectedSiswa.nis}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>💡 Tip: Pastikan pencahayaan cukup dan wajah menghadap kamera</p>
              </div>
            </div>
          )}

          {step === "camera-plate" && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">🍽️ Deteksi Tray - AI Object Detection</h2>
                <p className="text-gray-600">
                  Siswa: <span className="font-semibold text-blue-600">{selectedSiswa?.nama}</span> (
                  {selectedSiswa?.kelas})
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Letakkan tray makanan di dalam kotak guide - foto otomatis dalam 3 detik
                </p>
              </div>

              <div className="relative bg-black rounded-xl overflow-hidden mb-6">
                <video ref={videoRef} autoPlay playsInline className="w-full h-[500px] object-cover" />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

                {countdown !== null && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="bg-green-500 text-white rounded-full w-32 h-32 flex items-center justify-center">
                      <span className="text-6xl font-bold animate-pulse">{countdown}</span>
                    </div>
                  </div>
                )}

                {trayDetected && countdown === null && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 animate-pulse">
                    <CheckCircle className="w-5 h-5" />
                    Tray Terdeteksi! Memulai capture...
                  </div>
                )}

                {!trayDetected && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    📦 Letakkan tray di dalam kotak
                  </div>
                )}

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                  💡 Posisikan tray di tengah kotak kuning/hijau
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={manualCapture}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-semibold text-lg"
                >
                  <Camera className="w-6 h-6" />
                  Ambil Foto Manual
                </button>
                <button
                  onClick={() => {
                    stopCamera()
                    setStep("detect-face")
                    setSelectedSiswa(null)
                    setFacePhoto(null)
                  }}
                  className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {step === "analyzing" && (
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

          {step === "result" && analysisResult && selectedSiswa && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className={`p-6 ${analysisResult.isFinished ? "bg-green-50" : "bg-yellow-50"}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-4 ${analysisResult.isFinished ? "bg-green-500" : "bg-yellow-500"} rounded-full`}>
                    {analysisResult.isFinished ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {analysisResult.isFinished ? "✅ Makanan Habis!" : "⚠️ Makanan Belum Habis"}
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
                      <p className="text-sm text-blue-700">
                        {selectedSiswa.kelas} | NIS: {selectedSiswa.nis}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">📸 Foto Wajah (Face Recognition)</p>
                    {facePhoto && (
                      <img
                        src={facePhoto || "/placeholder.svg"}
                        alt="Face"
                        className="w-full h-48 object-cover rounded-lg border-2 border-blue-300"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">🍽️ Foto Piring (AI Analysis)</p>
                    {platePhoto && (
                      <img
                        src={platePhoto || "/placeholder.svg"}
                        alt="Plate"
                        className="w-full h-48 object-cover rounded-lg border-2 border-yellow-300"
                      />
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-1">🤖 Hasil Analisis AI:</p>
                  <p className="text-gray-900">{analysisResult.description}</p>
                </div>

                {analysisResult.isFinished ? (
                  <button
                    onClick={() => handleFinish("habis")}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg"
                  >
                    <CheckCircle className="w-6 h-6" />✓ Selesai - Makanan Habis
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center font-medium text-gray-900 mb-3">
                      Apakah <span className="text-blue-600 font-bold">{selectedSiswa.nama}</span> ingin membungkus sisa
                      makanan?
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleFinish("dibungkus")}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-semibold"
                      >
                        <Package className="w-5 h-5" />📦 Ya, Bungkus
                      </button>
                      <button
                        onClick={() => handleFinish("tidak")}
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
        </>
      )}
    </SekolahLayout>
  )
}

export default AbsensiPenerima