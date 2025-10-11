"use client"

import { useState, useRef, useEffect } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { Plus, Check, X, Camera, CheckCircle, AlertCircle, RotateCw } from "lucide-react"
import { useSiswa, type Siswa } from "@/hooks/use-siswa"
import SiswaRegisterForm from "@/components/siswa-register-form"

type FaceScanStep = "center" | "left" | "right" | "up" | "down" | "complete"

export default function RegistrasiSiswaPage() {
  const { siswa, addSiswa, updateSiswa, markRegistered } = useSiswa()
  const belumTerdaftar = siswa.filter((s) => !s.registered)
  const [openForm, setOpenForm] = useState<null | Partial<Siswa>>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanningFor, setScanningFor] = useState<Partial<Siswa> | null>(null)
  const [scanStep, setScanStep] = useState<FaceScanStep>("center")
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({})
  const [isFaceDetected, setIsFaceDetected] = useState(false)
  const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<any>(null)

  const scanSteps: { step: FaceScanStep; label: string; instruction: string; emoji: string }[] = [
    { step: "center", label: "Tengah", instruction: "Lihat lurus ke kamera", emoji: "👤" },
    { step: "left", label: "Kiri", instruction: "Putar wajah ke KIRI Anda", emoji: "👈" },
    { step: "right", label: "Kanan", instruction: "Putar wajah ke KANAN Anda", emoji: "👉" },
    { step: "up", label: "Atas", instruction: "Angkat dagu ke atas", emoji: "👆" },
    { step: "down", label: "Bawah", instruction: "Turunkan dagu ke bawah", emoji: "👇" },
  ]

  const currentStepIndex = scanSteps.findIndex((s) => s.step === scanStep)
  const currentStepInfo = scanSteps[currentStepIndex]

  useEffect(() => {
    const loadFaceAPI = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api")
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model"

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])

        setIsFaceApiLoaded(true)
        console.log("Face-API loaded for registration")
      } catch (error) {
        console.error("Error loading Face-API:", error)
        setIsFaceApiLoaded(true) // Fallback mode
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
          startFaceDetection()
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
    setIsFaceDetected(false)
  }

  const startFaceDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    detectionIntervalRef.current = setInterval(async () => {
      if (!video.paused && !video.ended && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null

        if (ctx && isFaceApiLoaded) {
          try {
            const faceapi = await import("@vladmandic/face-api")
            const detections = await faceapi
              .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
              .withFaceLandmarks()

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            if (detections.length > 0) {
              const detection = detections[0]
              const { box } = detection.detection

              // Draw bounding box
              ctx.strokeStyle = "#22c55e"
              ctx.lineWidth = 4
              ctx.strokeRect(box.x, box.y, box.width, box.height)

              // Draw confidence
              ctx.fillStyle = "#22c55e"
              ctx.font = "bold 18px Arial"
              ctx.fillText(`Wajah Terdeteksi: ${(detection.detection.score * 100).toFixed(0)}%`, box.x, box.y - 10)

              // Draw landmarks
              const landmarks = detection.landmarks.positions
              ctx.fillStyle = "#22c55e"
              landmarks.forEach((point: any) => {
                ctx.beginPath()
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
                ctx.fill()
              })

              if (!isFaceDetected) {
                setIsFaceDetected(true)
              }
            } else {
              setIsFaceDetected(false)
            }
          } catch (error) {
            console.error("Face detection error:", error)
          }
        } else if (ctx) {
          // Fallback: simple brightness detection
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const centerX = canvas.width / 2
          const centerY = canvas.height / 2
          const regionSize = 200

          const imageData = ctx.getImageData(
            centerX - regionSize / 2,
            centerY - regionSize / 2,
            regionSize,
            regionSize
          )
          const pixels = imageData.data
          let totalBrightness = 0

          for (let i = 0; i < pixels.length; i += 4) {
            const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
            totalBrightness += brightness
          }

          const avgBrightness = totalBrightness / (pixels.length / 4)
          const hasFace = avgBrightness > 40 && avgBrightness < 200

          if (hasFace && !isFaceDetected) {
            setIsFaceDetected(true)
          } else if (!hasFace && isFaceDetected) {
            setIsFaceDetected(false)
          }

          // Draw guide circle
          ctx.strokeStyle = hasFace ? "#22c55e" : "#eab308"
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.arc(centerX, centerY, 150, 0, 2 * Math.PI)
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
        capturePhoto()
      }
    }

    doCountdown(3)
  }

  const manualCapture = () => {
    capturePhoto()
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const tempCanvas = document.createElement("canvas")
    
    tempCanvas.width = video.videoWidth
    tempCanvas.height = video.videoHeight
    const ctx = tempCanvas.getContext("2d") as CanvasRenderingContext2D | null

    if (ctx) {
      // Flip horizontal untuk mirror effect
      ctx.translate(tempCanvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)
      
      const photoData = tempCanvas.toDataURL("image/jpeg", 0.9)

      setCapturedPhotos((prev) => ({
        ...prev,
        [scanStep]: photoData,
      }))

      // Move to next step
      const nextIndex = currentStepIndex + 1
      if (nextIndex < scanSteps.length) {
        setScanStep(scanSteps[nextIndex].step)
        setIsFaceDetected(false)
      } else {
        setScanStep("complete")
        stopCamera()
      }
    }
  }

  const handleStartScanning = (siswa: Partial<Siswa>) => {
    setScanningFor(siswa)
    setShowScanner(true)
    setScanStep("center")
    setCapturedPhotos({})
    setTimeout(() => startCamera(), 500)
  }

  const handleCloseScannerCamera = () => {
    stopCamera()
    setShowScanner(false)
    setScanningFor(null)
    setScanStep("center")
    setCapturedPhotos({})
  }

  const handleCompleteScan = () => {
    if (!scanningFor) return

    // Gunakan foto center sebagai foto utama
    const mainPhoto = capturedPhotos.center

    if (scanningFor.id) {
      // Update existing siswa
      updateSiswa(scanningFor.id, {
        ...scanningFor,
        foto: mainPhoto,
        facePhotos: capturedPhotos,
        registered: true,
      })
    } else {
      // Add new siswa
      const gender = (scanningFor.jenisKelamin || "L") as "L" | "P"
      addSiswa({
        ...(scanningFor as any),
        foto: mainPhoto,
        facePhotos: capturedPhotos,
        registered: true,
        status: "belum",
        waktuAbsen: null,
        statusMakan: null,
      })
    }

    alert(`✅ Face scanning ${scanningFor.nama} berhasil!\n5 foto wajah tersimpan untuk Face Recognition.`)
    handleCloseScannerCamera()
  }

  const handleRetakeScan = () => {
    setScanStep("center")
    setCapturedPhotos({})
    setTimeout(() => startCamera(), 500)
  }

  return (
    <SekolahLayout currentPage="registrasi">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Registrasi Siswa MBG</h1>
        <p className="text-gray-600">
          Daftarkan siswa dengan Face Scanning multi-angle untuk akurasi Face Recognition yang lebih baik.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Belum Terdaftar</h2>
          <button
            onClick={() => setOpenForm({})}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa Baru
          </button>
        </div>

        {belumTerdaftar.length === 0 ? (
          <p className="text-sm text-gray-600">Semua siswa sudah terdaftar.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {belumTerdaftar.map((s) => (
              <div key={s.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">
                    {s.foto || "🧑"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{s.nama}</p>
                    <p className="text-sm text-gray-600">
                      {s.kelas} • NIS {s.nis}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleStartScanning(s)}
                    className="w-full px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium inline-flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Scan Wajah (5 Angle)
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOpenForm(s)}
                      className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
                    >
                      Edit Data
                    </button>
                    <button
                      onClick={() => markRegistered(s.id, true)}
                      className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm inline-flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Tanpa Scan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form Input Data */}
      {openForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Lengkapi Data Siswa</h3>
              <button onClick={() => setOpenForm(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <SiswaRegisterForm
                initial={openForm}
                onCancel={() => setOpenForm(null)}
                onSave={(data) => {
                  if (openForm?.id) {
                    updateSiswa(openForm.id, { ...data, registered: true })
                  } else {
                    const gender = (data.jenisKelamin || "L") as "L" | "P"
                    const foto = data.foto || (gender === "P" ? "👩" : "👨")
                    addSiswa({
                      ...(data as any),
                      foto,
                      registered: true,
                      status: "belum",
                      waktuAbsen: null,
                      statusMakan: null,
                    })
                  }
                  setOpenForm(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Face Scanner */}
      {showScanner && scanningFor && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold">🎭 Face Scanning Multi-Angle</h3>
                <p className="text-sm text-blue-100">
                  Siswa: {scanningFor.nama} ({scanningFor.kelas})
                </p>
              </div>
              <button
                onClick={handleCloseScannerCamera}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {scanStep !== "complete" ? (
              <div className="p-6">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progress: {currentStepIndex + 1} / {scanSteps.length}
                    </span>
                    <span className="text-sm text-gray-600">{currentStepInfo?.label}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${((currentStepIndex + 1) / scanSteps.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-between mb-6">
                  {scanSteps.map((step, idx) => (
                    <div key={step.step} className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 border-2 transition-all ${
                          capturedPhotos[step.step]
                            ? "bg-green-500 border-green-500 text-white"
                            : scanStep === step.step
                              ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                              : "bg-gray-200 border-gray-300 text-gray-600"
                        }`}
                      >
                        {capturedPhotos[step.step] ? <CheckCircle className="w-6 h-6" /> : step.emoji}
                      </div>
                      <span className="text-xs text-gray-600 text-center">{step.label}</span>
                    </div>
                  ))}
                </div>

                {/* Camera View */}
                <div className="relative bg-black rounded-xl overflow-hidden mb-4" style={{ height: "500px" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none scale-x-[-1]"
                  />

                  {/* Instruction Overlay */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                    {currentStepInfo?.emoji} {currentStepInfo?.instruction}
                  </div>

                  {/* Status Indicator */}
                  <div
                    className={`absolute top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 ${
                      isFaceDetected ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                    }`}
                  >
                    {isFaceDetected ? (
                      <>
                        <CheckCircle className="w-4 h-4" />✓ Wajah Terdeteksi - Siap Capture
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />⚠️ Posisikan Wajah
                      </>
                    )}
                  </div>

                  {/* Loading Face API */}
                  {!isFaceApiLoaded && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm">
                      Loading Face Detection Model...
                    </div>
                  )}
                </div>

                {/* Manual Capture Button */}
                <div className="mb-4">
                  <button
                    onClick={manualCapture}
                    disabled={!isFaceDetected}
                    className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-3 transition-all"
                  >
                    <Camera className="w-6 h-6" />
                    {isFaceDetected ? `📸 Ambil Foto ${currentStepInfo?.label}` : "⏳ Menunggu Deteksi Wajah..."}
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium mb-2">📌 Petunjuk:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Posisikan wajah sesuai instruksi di layar</li>
                    <li>• Pastikan pencahayaan cukup dan wajah terlihat jelas</li>
                    <li>• Foto akan otomatis diambil setelah countdown 3 detik</li>
                    <li>• Jika wajah tidak terdeteksi, atur posisi Anda</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Complete - Review Photos */
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">✅ Scanning Selesai!</h3>
                  <p className="text-gray-600">
                    5 foto wajah dari berbagai angle telah berhasil diambil untuk {scanningFor.nama}
                  </p>
                </div>

                {/* Preview Photos */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                  {scanSteps.map((step) => (
                    <div key={step.step} className="text-center">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-500 mb-2">
                        {capturedPhotos[step.step] ? (
                          <img
                            src={capturedPhotos[step.step]}
                            alt={step.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl">
                            {step.emoji}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{step.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRetakeScan}
                    className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-5 h-5" />
                    Scan Ulang
                  </button>
                  <button
                    onClick={handleCompleteScan}
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 font-bold text-lg inline-flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-6 h-6" />
                    Simpan & Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SekolahLayout>
  )
}