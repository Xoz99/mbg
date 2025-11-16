"use client"

import type React from "react"

import { useState, useMemo, memo, useEffect, useRef, useCallback } from "react"
import SekolahLayout from "@/components/layout/SekolahLayout"
import { useSekolahDataCache } from "@/lib/hooks/useSekolahDataCache"
import {
  Search,
  Eye,
  AlertTriangle,
  TrendingUp,
  User,
  Calendar,
  Ruler,
  Weight,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Camera,
  Upload,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demombgv1.xyz"

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 animate-pulse">
    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full w-24 mb-2"></div>
    <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded-lg w-16 mb-2"></div>
    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full w-32"></div>
  </div>
)

const SkeletonTableRow = () => (
  <tr className="border-b border-gray-100">
    <td className="py-4 px-4">
      <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-20"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-32"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-16"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-8"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-12"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-16"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-16"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-16"></div>
    </td>
  </tr>
)

const GrowthChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="bulan" stroke="#6b7280" style={{ fontSize: "12px" }} />
      <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
      <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }} />
      <Line
        type="monotone"
        dataKey="tinggi"
        stroke="#0ea5e9"
        strokeWidth={2.5}
        dot={{ fill: "#0ea5e9", r: 4 }}
        name="Tinggi (cm)"
      />
      <Line
        type="monotone"
        dataKey="berat"
        stroke="#ec4899"
        strokeWidth={2.5}
        dot={{ fill: "#ec4899", r: 4 }}
        name="Berat (kg)"
      />
    </LineChart>
  </ResponsiveContainer>
))

GrowthChart.displayName = "GrowthChart"

const Chip = ({ label, onDelete, variant = "default" }: any) => {
  const variants: { [key: string]: string } = {
    default: "bg-blue-100 text-blue-700 border-blue-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    error: "bg-red-100 text-red-700 border-red-200",
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${variants[variant]}`}
    >
      <span>{label}</span>
      {onDelete && (
        <button onClick={onDelete} className="hover:opacity-70 transition-opacity" title="Delete">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

const StatCard = ({ title, value, subtitle, color, icon: Icon }: any) => (
  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all">
    <div className="flex items-start justify-between mb-2">
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      {Icon && <Icon className={`w-5 h-5 ${color}`} />}
    </div>
    <p className={`text-3xl font-bold mb-1 ${color}`}>{value}</p>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </div>
)

const calculateIMT = (tinggiBadan: number, beratBadan: number): number => {
  if (!tinggiBadan || !beratBadan || tinggiBadan === 0) return 0
  const tinggiMeter = tinggiBadan / 100
  const imt = beratBadan / (tinggiMeter * tinggiMeter)
  return Number(imt.toFixed(2)) // Return as number, not string!
}

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    NORMAL: "bg-emerald-100 text-emerald-700 border-emerald-200",
    GIZI_KURANG: "bg-amber-100 text-amber-700 border-amber-200",
    GIZI_BURUK: "bg-red-100 text-red-700 border-red-200",
  }
  return colors[status] || "bg-gray-100 text-gray-700 border-gray-200"
}

const getStuntingColor = (status: string) => {
  const colors: { [key: string]: string } = {
    NORMAL: "bg-emerald-100 text-emerald-700",
    STUNTED: "bg-amber-100 text-amber-700",
    SEVERELY_STUNTED: "bg-red-100 text-red-700",
  }
  return colors[status] || "bg-gray-100 text-gray-700"
}

const displayStatusText = (status: string) => {
  const map: { [key: string]: string } = {
    NORMAL: "Normal",
    OBESITAS: "OBESITAS",
    GIZI_BURUK: "Gizi Buruk",
    STUNTED: "Stunted",
    SEVERELY_STUNTED: "Severely Stunted",
  }
  return map[status] || status
}

const DataSiswa = () => {
  const hasInitialized = useRef(false)
  const [siswaData, setSiswaData] = useState<any[]>([])
  const [kelasData, setKelasData] = useState<any[]>([])

  // ✅ Callback ketika unified cache ter-update dari page lain (instant sync!)
  const handleCacheUpdate = useCallback((cachedData: any) => {
    console.log("🔄 [SISWA] Received cache update from kelas page - updating state instantly!")
    setSiswaData(cachedData.siswaData || [])
    setKelasData(cachedData.kelasData || [])
  }, [])

  const { loading, error, loadData, updateCache } = useSekolahDataCache(handleCacheUpdate)

  const [credentialsReady, setCredentialsReady] = useState(false)

  // ✅ Update selectedSiswa saat siswaData berubah (keep it fresh!)
  useEffect(() => {
    if (selectedSiswa && siswaData.length > 0) {
      const updatedSelected = siswaData.find((s: any) => s.id === selectedSiswa.id)
      if (updatedSelected) {
        setSelectedSiswa(updatedSelected)
        console.log("✅ [SISWA] Updated selectedSiswa dengan data terbaru dari siswaData")
      }
    }
  }, [siswaData])
  const [submitting, setSubmitting] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterKelas, setFilterKelas] = useState("semua")
  const [filterStatus, setFilterStatus] = useState("semua")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null)

  const [formData, setFormData] = useState({
    nama: "",
    nis: "",
    kelasId: "",
    jenisKelamin: "LAKI_LAKI",
    umur: 7,
    tinggiBadan: 0,
    beratBadan: 0,
    alergi: [] as string[],
    fotoUrl: "",
  })

  const [alergiInput, setAlergiInput] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ✅ EFFECT 1: Wait for sekolahId to be available
  useEffect(() => {
    if (typeof window === "undefined") return
    if (credentialsReady) return // Skip if already ready

    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const schoolId = localStorage.getItem("sekolahId")

    console.log("[SISWA] Check credentials - token:", token ? "EXISTS" : "MISSING", "schoolId:", schoolId ? "EXISTS" : "MISSING")

    if (!token) {
      console.error("[SISWA] ❌ Token not found")
      return
    }

    if (schoolId) {
      // Both credentials are ready!
      console.log("[SISWA] ✅ Both credentials ready, setting flag")
      setCredentialsReady(true)
      return
    }

    // sekolahId not ready, set up polling
    console.log("[SISWA] sekolahId not ready, waiting for SekolahLayout...")
    const pollInterval = setInterval(() => {
      const newSchoolId = localStorage.getItem("sekolahId")
      if (newSchoolId) {
        console.log("[SISWA] ✅ sekolahId detected:", newSchoolId)
        clearInterval(pollInterval)
        setCredentialsReady(true) // This will trigger EFFECT 2
      }
    }, 1000)

    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      console.error("[SISWA] ❌ sekolahId timeout after 10s")
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
      console.log("[SISWA EFFECT 2] Waiting for credentialsReady flag...")
      return
    }

    const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    const schoolId = localStorage.getItem("sekolahId")

    // Double-check both are available
    if (!token || !schoolId) {
      console.error("[SISWA EFFECT 2] ❌ Missing credentials even though flag is true!")
      return
    }

    if (hasInitialized.current) {
      console.log("[SISWA EFFECT 2] Already initialized, skipping")
      return
    }

    const fetchAllData = async () => {
      try {
        hasInitialized.current = true
        const cachedData = await loadData(schoolId, token)

        if (cachedData) {
          setSiswaData(cachedData.siswaData || [])
          setKelasData(cachedData.kelasData || [])
          console.log("✅ [SISWA] Data loaded successfully")
        }
      } catch (err) {
        console.error("❌ [SISWA] Error loading data:", err)
      }
    }

    fetchAllData()
  }, [credentialsReady, loadData]) // Re-run when credentialsReady changes

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

  const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          ctx?.drawImage(img, 0, 0, width, height)

          const compressedBase64 = canvas.toDataURL("image/jpeg", quality)
          resolve(compressedBase64)
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("File harus berupa gambar!")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB!")
        return
      }

      try {
        const compressedBase64 = await compressImage(file, 400, 400, 0.8)
        const compressedSize = (compressedBase64.length * 3) / 4

        if (compressedSize > 500 * 1024) {
          alert("Foto terlalu besar setelah kompresi. Pilih foto yang lebih kecil.")
          return
        }

        setPhotoPreview(compressedBase64)
        setFormData((prev) => ({ ...prev, fotoUrl: compressedBase64 }))
      } catch (error) {
        console.error("Error processing photo:", error)
        alert("Gagal memproses foto. Coba foto lain.")
      }
    }
  }

  const handleRemovePhoto = () => {
    setPhotoPreview("")
    setFormData({ ...formData, fotoUrl: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }


  const handleCreateSiswa = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nama || !formData.nis || !formData.kelasId) {
      alert("Nama, NIS, dan Kelas harus diisi")
      return
    }

    try {
      setSubmitting(true)
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
      const sekolahId = localStorage.getItem("sekolahId")

      if (!authToken || !sekolahId) {
        alert("Token atau Sekolah ID tidak ditemukan")
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append("nama", formData.nama)
      formDataToSend.append("nis", formData.nis)
      formDataToSend.append("kelasId", formData.kelasId)
      formDataToSend.append("jenisKelamin", formData.jenisKelamin)
      formDataToSend.append("umur", formData.umur.toString())
      formDataToSend.append("tinggiBadan", formData.tinggiBadan.toString())
      formDataToSend.append("beratBadan", formData.beratBadan.toString())

      if (formData.fotoUrl) {
        try {
          const base64Response = await fetch(formData.fotoUrl)
          const blob = await base64Response.blob()
          const file = new File([blob], "foto-siswa.jpg", { type: "image/jpeg" })
          formDataToSend.append("foto", file)
        } catch (err) {
          console.error("Error converting photo:", err)
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/siswa`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      })

      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${responseText}`)
      }

      const data = JSON.parse(responseText)
      const siswaId = data.data?.id

      if (formData.alergi.length > 0 && siswaId) {
        try {
          for (const alergi of formData.alergi) {
            await fetch(`${API_BASE_URL}/api/siswa/${siswaId}/alergi`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ namaAlergi: alergi }),
            })
          }
        } catch (err) {
          console.error("[CREATE ALERGI] Error:", err)
        }
      }

      setFormData({
        nama: "",
        nis: "",
        kelasId: "",
        jenisKelamin: "LAKI_LAKI",
        umur: 7,
        tinggiBadan: 0,
        beratBadan: 0,
        alergi: [],
        fotoUrl: "",
      })
      setAlergiInput("")
      setPhotoPreview("")

      setShowAddModal(false)

      // ✅ Optimistic update: Add new siswa to local state immediately
      const newSiswa = {
        ...data.data,
        kelas: kelasData.find((k: any) => k.id === formData.kelasId)?.nama || "",
        imt: calculateIMT(formData.tinggiBadan, formData.beratBadan),
      }

      setSiswaData([...siswaData, newSiswa])

      // 🔄 Update unified cache (auto-sync to all pages - no broadcast needed!)
      updateCache(sekolahId, authToken, {
        siswaData: [...siswaData, newSiswa],
        kelasData: kelasData,
        absensiData: [],
      }, (freshData) => {
        // Update state dengan data fresh dari API
        setSiswaData(freshData.siswaData || [])
        setKelasData(freshData.kelasData || [])
        console.log("✅ [SISWA] State synced with fresh API data + auto-synced to kelas page!")
      })

      alert("Siswa berhasil ditambahkan!")
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSiswa = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSiswa) return

    try {
      setSubmitting(true)
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
      const sekolahId = localStorage.getItem("sekolahId")

      if (!authToken || !sekolahId) {
        alert("Token atau Sekolah ID tidak ditemukan")
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append("nama", formData.nama)
      formDataToSend.append("jenisKelamin", formData.jenisKelamin)
      formDataToSend.append("umur", formData.umur.toString())
      formDataToSend.append("tinggiBadan", formData.tinggiBadan.toString())
      formDataToSend.append("beratBadan", formData.beratBadan.toString())

      if (formData.fotoUrl && formData.fotoUrl !== selectedSiswa.fotoUrl) {
        try {
          const base64Response = await fetch(formData.fotoUrl)
          const blob = await base64Response.blob()
          const file = new File([blob], "foto-siswa.jpg", { type: "image/jpeg" })
          formDataToSend.append("foto", file)
        } catch (err) {
          console.error("Error converting photo:", err)
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/siswa/${selectedSiswa.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) throw new Error(`API Error: ${response.status}`)

      if (
        selectedSiswa.alergi.length !== formData.alergi.length ||
        !selectedSiswa.alergi.every((a: string, i: number) => a === formData.alergi[i])
      ) {
        try {
          const deletedAlergi = selectedSiswa.alergi.filter((oldAlergi: string) => !formData.alergi.includes(oldAlergi))

          const newAlergiList = formData.alergi.filter((newA: string) => !selectedSiswa.alergi.includes(newA))

          if (deletedAlergi.length > 0) {
            const detailResponse = await fetch(`${API_BASE_URL}/api/siswa/${selectedSiswa.id}`, {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            })

            if (detailResponse.ok) {
              const siswaDetail = await detailResponse.json()
              const siswaAlergiList = siswaDetail.data?.alergi || []

              for (const alergiName of deletedAlergi) {
                const alergiItem = siswaAlergiList.find(
                  (a: any) => a.namaAlergi === alergiName || a.nama === alergiName,
                )

                if (alergiItem) {
                  const alergiId = alergiItem.id || alergiItem._id

                  try {
                    let deleteRes = await fetch(`${API_BASE_URL}/api/alergi/${alergiId}`, {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                      },
                    })

                    if (!deleteRes.ok && deleteRes.status === 404) {
                      deleteRes = await fetch(`${API_BASE_URL}/api/siswa/${selectedSiswa.id}/alergi/${alergiId}`, {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${authToken}`,
                          "Content-Type": "application/json",
                        },
                      })
                    }

                    if (!deleteRes.ok && deleteRes.status === 404) {
                      deleteRes = await fetch(`${API_BASE_URL}/api/siswa/${selectedSiswa.id}/alergi`, {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${authToken}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          alergiId: alergiId,
                          namaAlergi: alergiName,
                        }),
                      })
                    }

                    if (!deleteRes.ok && deleteRes.status === 404) {
                      deleteRes = await fetch(`${API_BASE_URL}/api/alergi`, {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${authToken}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          id: alergiId,
                          siswaId: selectedSiswa.id,
                          namaAlergi: alergiName,
                        }),
                      })
                    }

                    if (!deleteRes.ok) {
                      console.error(`Failed to delete alergi "${alergiName}": ${deleteRes.status}`)
                    }
                  } catch (deleteErr) {
                    console.error(`Error deleting alergi "${alergiName}":`, deleteErr)
                  }
                }
              }
            }
          }

          if (newAlergiList.length > 0) {
            for (const alergi of newAlergiList) {
              try {
                await fetch(`${API_BASE_URL}/api/siswa/${selectedSiswa.id}/alergi`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ namaAlergi: alergi }),
                })
              } catch (addErr) {
                console.error(`Error adding alergi ${alergi}:`, addErr)
              }
            }
          }
        } catch (err) {
          console.error("Error updating alergi:", err)
        }
      }

      setShowEditModal(false)
      setSelectedSiswa(null)

      // ✅ Optimistic update: Update siswa in local state immediately
      const updatedSiswa = {
        ...selectedSiswa,
        ...formData,
        kelas: kelasData.find((k: any) => k.id === formData.kelasId)?.nama || selectedSiswa.kelas,
        imt: calculateIMT(formData.tinggiBadan, formData.beratBadan),
      }

      const updatedSiswaData = siswaData.map((s) => (s.id === selectedSiswa.id ? updatedSiswa : s))
      setSiswaData(updatedSiswaData)

      // 🔄 Update unified cache (auto-sync to all pages - no broadcast needed!)
      updateCache(sekolahId, authToken, {
        siswaData: updatedSiswaData,
        kelasData: kelasData,
        absensiData: [],
      }, (freshData) => {
        // Update state dengan data fresh dari API
        setSiswaData(freshData.siswaData || [])
        setKelasData(freshData.kelasData || [])
        console.log("✅ [SISWA] State synced with fresh API data + auto-synced to kelas page!")
      })

      alert("Data siswa berhasil diupdate!")
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSiswa = async (siswaId: string) => {
    if (!confirm("Yakin ingin menghapus siswa ini?")) return

    try {
      setSubmitting(true)
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
      const sekolahId = localStorage.getItem("sekolahId")

      if (!authToken || !sekolahId) {
        alert("Token atau Sekolah ID tidak ditemukan")
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/siswa/${siswaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error(`Delete failed: ${response.status}`)

      setShowDetailModal(false)
      setSelectedSiswa(null)

      // ✅ Optimistic update: Remove siswa from local state immediately
      const updatedSiswaData = siswaData.filter((s) => s.id !== siswaId)
      setSiswaData(updatedSiswaData)

      // 🔄 Update unified cache (auto-sync to all pages - no broadcast needed!)
      updateCache(sekolahId, authToken, {
        siswaData: updatedSiswaData,
        kelasData: kelasData,
        absensiData: [],
      }, (freshData) => {
        // Update state dengan data fresh dari API
        setSiswaData(freshData.siswaData || [])
        setKelasData(freshData.kelasData || [])
        console.log("✅ [SISWA] State synced with fresh API data + auto-synced to kelas page!")
      })

      alert("Siswa berhasil dihapus!")
    } catch (err) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredData = useMemo(() => {
    return siswaData.filter((siswa) => {
      const matchSearch = siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) || siswa.nis.includes(searchTerm)
      const matchKelas = filterKelas === "semua" || siswa.kelas === filterKelas
      const matchStatus = filterStatus === "semua" || siswa.statusGizi === filterStatus

      return matchSearch && matchKelas && matchStatus
    })
  }, [siswaData, searchTerm, filterKelas, filterStatus])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const stats = useMemo(() => {
    const total = siswaData.length
    const normal = siswaData.filter((s) => s.statusGizi === "NORMAL").length
    const giziKurang = siswaData.filter((s) => s.statusGizi === "GIZI_KURANG").length
    const giziBuruk = siswaData.filter((s) => s.statusGizi === "GIZI_BURUK").length
    const stunted = siswaData.filter((s) => s.statusStunting && s.statusStunting !== "NORMAL").length

    return { total, normal, giziKurang, giziBuruk, stunted }
  }, [siswaData])

  const handleOpenDetailModal = (siswa: any) => {
    setSelectedSiswa(siswa)
    setShowDetailModal(true)
  }

  const handleOpenEditModal = (siswa: any) => {
    setSelectedSiswa(siswa)

    let fotoForPreview = siswa.fotoUrl || ""

    if (fotoForPreview && !fotoForPreview.startsWith("data:") && !fotoForPreview.startsWith("http")) {
      fotoForPreview = `${API_BASE_URL}${fotoForPreview}`
    }

    setFormData({
      nama: siswa.nama,
      nis: siswa.nis,
      kelasId: siswa.kelasId,
      jenisKelamin: siswa.jenisKelamin,
      umur: siswa.umur,
      tinggiBadan: siswa.tinggiBadan,
      beratBadan: siswa.beratBadan,
      alergi: Array.isArray(siswa.alergi) ? siswa.alergi : [],
      fotoUrl: fotoForPreview,
    })
    setPhotoPreview(fotoForPreview)
    setAlergiInput("")
    setShowEditModal(true)
  }

  const handleAddAlergi = () => {
    if (alergiInput.trim() && !formData.alergi.includes(alergiInput.trim())) {
      setFormData({
        ...formData,
        alergi: [...formData.alergi, alergiInput.trim()],
      })
      setAlergiInput("")
    }
  }

  const handleRemoveAlergi = (alergiToRemove: string) => {
    setFormData({
      ...formData,
      alergi: formData.alergi.filter((a) => a !== alergiToRemove),
    })
  }

  const handleKeyPressAlergi = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddAlergi()
    }
  }

  if (loading && siswaData.length === 0) {
    return (
      <SekolahLayout currentPage="siswa">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Siswa</h1>
          <p className="text-gray-600 font-medium">Monitoring Gizi & Pencegahan Stunting</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Foto</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">NIS</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Nama Siswa</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Kelas</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">L/P</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Umur</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">TB</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">BB</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status Gizi</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, i) => (
                  <SkeletonTableRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SekolahLayout>
    )
  }

  if (error && siswaData.length === 0) {
    return (
      <SekolahLayout currentPage="siswa">
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4 font-semibold">{error}</p>
            <button
              onClick={() => {
                const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
                const schoolId = localStorage.getItem("sekolahId")
                if (schoolId && token) {
                  hasInitialized.current = false
                  setCredentialsReady(false)
                  setCredentialsReady(true)
                }
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </SekolahLayout>
    )
  }

  return (
    <SekolahLayout currentPage="siswa">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Siswa</h1>
          <p className="text-gray-600 font-medium">Monitoring Gizi & Pencegahan Stunting</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              nama: "",
              nis: "",
              kelasId: "",
              jenisKelamin: "LAKI_LAKI",
              umur: 7,
              tinggiBadan: 0,
              beratBadan: 0,
              alergi: [],
              fotoUrl: "",
            })
            setAlergiInput("")
            setPhotoPreview("")
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 px-5 py-3 bg-[#1B263A] text-white rounded-xl hover:bg-[#243B55] hover:shadow-lg hover:-translate-y-0.5 transition-all font-semibold shadow-md"
          >
          <Plus className="w-5 h-5" />
          Tambah Siswa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Siswa"
          value={stats.total}
          subtitle="Siswa terdaftar"
          color="text-cyan-600"
          icon={User}
        />
        <StatCard
          title="Gizi Normal"
          value={stats.normal}
          subtitle={`${stats.total > 0 ? Math.round((stats.normal / stats.total) * 100) : 0}% dari total`}
          color="text-emerald-600"
          icon={TrendingUp}
        />
        <StatCard
          title="Gizi Kurang"
          value={stats.giziKurang}
          subtitle="Perlu perhatian"
          color="text-amber-600"
          icon={AlertTriangle}
        />
        <StatCard
          title="Gizi Buruk"
          value={stats.giziBuruk}
          subtitle="Prioritas tinggi"
          color="text-red-600"
          icon={AlertCircle}
        />
        <StatCard
          title="Berisiko Stunting"
          value={stats.stunted}
          subtitle="Memerlukan intervensi"
          color="text-orange-600"
          icon={AlertTriangle}
        />
      </div>

      {stats.stunted > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 p-5 mb-6 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900 text-lg">Perhatian!</p>
              <p className="text-sm text-red-700 mt-1">
                Terdapat {stats.stunted} siswa berisiko stunting yang memerlukan perhatian khusus.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau NIS..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <select
              value={filterKelas}
              onChange={(e) => {
                setFilterKelas(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            >
              <option value="semua">Semua Kelas</option>
              {kelasData.map((kelas) => (
                <option key={kelas.id} value={String(kelas.nama || "")}>
                  {String(kelas.nama || "")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            >
              <option value="semua">Semua Status</option>
              <option value="NORMAL">Normal</option>
              <option value="OBESITAS">Obesitas</option>
              <option value="GIZI_BURUK">Gizi Buruk</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Foto</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">NIS</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Nama</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Kelas</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">L/P</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Umur</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">TB</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">BB</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((siswa) => {
                let fotoSrc = siswa.fotoUrl || ""
                if (fotoSrc && !fotoSrc.startsWith("data:") && !fotoSrc.startsWith("http")) {
                  fotoSrc = `${API_BASE_URL}${fotoSrc}`
                }

                return (
                  <tr key={siswa.id} className="border-b border-gray-100 hover:bg-cyan-50 transition-colors">
                    <td className="py-4 px-4">
                      {fotoSrc ? (
                        <img
                          src={fotoSrc || "/placeholder.svg"}
                          alt={siswa.nama}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center text-lg border-2 border-gray-200">
                          {siswa.jenisKelamin === "LAKI_LAKI" ? "👨" : "👩"}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 font-semibold">{siswa.nis}</td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{siswa.nama}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{siswa.kelas}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {siswa.jenisKelamin === "LAKI_LAKI" ? "L" : "P"}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{siswa.umur} th</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{siswa.tinggiBadan} cm</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{siswa.beratBadan} kg</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(siswa.statusGizi)}`}
                      >
                        {displayStatusText(siswa.statusGizi)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenDetailModal(siswa)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors text-sm font-medium border border-cyan-200"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                          Detail
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(siswa)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSiswa(siswa.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600 font-medium">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} siswa
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 font-semibold">
              Hal {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Siswa Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-[#1B263A] text-white px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-xl font-bold">Tambah Siswa Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSiswa} className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Foto Siswa (Opsional)</label>

                <div className="relative">
                  {photoPreview ? (
                    <div className="relative group">
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-cyan-200 shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Ganti Foto"
                        >
                          <Camera className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="w-32 h-32 rounded-full border-4 border-dashed border-cyan-300 flex flex-col items-center justify-center gap-2 hover:border-cyan-500 hover:bg-cyan-50 transition-all group"
                    >
                      <Upload className="w-8 h-8 text-cyan-400 group-hover:text-cyan-600" />
                      <span className="text-xs text-cyan-600 group-hover:text-cyan-700 font-medium">Upload Foto</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                <p className="text-xs text-gray-500 mt-2 text-center">Format: JPG, PNG, GIF (Max 2MB)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Siswa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    NIS <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="2024001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.kelasId}
                  onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">Pilih Kelas</option>
                  {kelasData.map((kelas) => (
                    <option key={kelas.id} value={String(kelas.id || "")}>
                      {String(kelas.nama || "")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Umur (tahun) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.umur}
                    onChange={(e) => setFormData({ ...formData, umur: Number.parseInt(e.target.value) || 7 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    min="5"
                    max="18"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tinggi Badan (cm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={formData.tinggiBadan}
                    onChange={(e) => setFormData({ ...formData, tinggiBadan: Number.parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="120.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Berat Badan (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={formData.beratBadan}
                    onChange={(e) => setFormData({ ...formData, beratBadan: Number.parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="22.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alergi (Opsional)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={alergiInput}
                    onChange={(e) => setAlergiInput(e.target.value)}
                    onKeyPress={handleKeyPressAlergi}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Ketik alergi dan tekan Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddAlergi}
                    className="px-4 py-2 bg-[#1B263A] text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                    Tambah
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {formData.alergi.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Belum ada alergi</p>
                  ) : (
                    formData.alergi.map((alergi, idx) => (
                      <Chip key={idx} label={alergi} variant="success" onDelete={() => handleRemoveAlergi(alergi)} />
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#1B263A] text-white rounded-xl hover:bg-[#24314d] hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Siswa Modal */}
      {showEditModal && selectedSiswa && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-[#1B263A] text-white px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-xl font-bold">Edit Data Siswa</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedSiswa(null)
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateSiswa} className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Foto Siswa (Opsional)</label>

                <div className="relative">
                  {photoPreview ? (
                    <div className="relative group">
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-cyan-200 shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Ganti Foto"
                        >
                          <Camera className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="w-32 h-32 rounded-full border-4 border-dashed border-cyan-300 flex flex-col items-center justify-center gap-2 hover:border-cyan-500 hover:bg-cyan-50 transition-all group"
                    >
                      <Upload className="w-8 h-8 text-cyan-400 group-hover:text-cyan-600" />
                      <span className="text-xs text-cyan-600 group-hover:text-cyan-700 font-medium">Upload Foto</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                <p className="text-xs text-gray-500 mt-2 text-center">Format: JPG, PNG, GIF (Max 2MB)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Siswa</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">NIS (Read Only)</label>
                  <input
                    type="text"
                    value={formData.nis}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-100 text-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Umur (tahun)</label>
                  <input
                    type="number"
                    value={formData.umur}
                    onChange={(e) => setFormData({ ...formData, umur: Number.parseInt(e.target.value) || 7 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    min="5"
                    max="18"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tinggi Badan (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tinggiBadan}
                    onChange={(e) => setFormData({ ...formData, tinggiBadan: Number.parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="120.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Berat Badan (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.beratBadan}
                    onChange={(e) => setFormData({ ...formData, beratBadan: Number.parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="22.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alergi</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={alergiInput}
                    onChange={(e) => setAlergiInput(e.target.value)}
                    onKeyPress={handleKeyPressAlergi}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Ketik alergi dan tekan Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddAlergi}
                    className="px-4 py-2 bg-[#1B263A] text-white rounded-xl hover:bg-[#243B55] hover:shadow-lg transition-all font-medium"
                    >
                    Tambah
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {formData.alergi.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Belum ada alergi</p>
                  ) : (
                    formData.alergi.map((alergi, idx) => (
                      <Chip key={idx} label={alergi} variant="success" onDelete={() => handleRemoveAlergi(alergi)} />
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedSiswa(null)
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#1B263A] text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSiswa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900">Detail Siswa</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
            <div className="flex items-start gap-6 bg-gradient-to-br from-[#1B263A] to-[#243B55] rounded-2xl p-6 text-white shadow-lg">
            <div className="flex-shrink-0">
                  {(() => {
                    let fotoSrc = selectedSiswa.fotoUrl || ""
                    if (fotoSrc && !fotoSrc.startsWith("data:") && !fotoSrc.startsWith("http")) {
                      fotoSrc = `${API_BASE_URL}${fotoSrc}`
                    }

                    return fotoSrc ? (
                      <img
                        src={fotoSrc || "/placeholder.svg"}
                        alt={selectedSiswa.nama}
                        className="w-28 h-28 rounded-full object-cover border-4 border-white/30 shadow-lg"
                      />
                    ) : (
                      <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center text-6xl border-4 border-white/30">
                        {selectedSiswa.jenisKelamin === "LAKI_LAKI" ? "👨" : "👩"}
                      </div>
                    )
                  })()}
                </div>
                <div className="flex-1">
                  <h4 className="text-3xl font-bold mb-3">{selectedSiswa.nama}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span>NIS: {selectedSiswa.nis}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{selectedSiswa.umur} tahun</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Kelas:</span>
                      <span>{selectedSiswa.kelas}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">L/P:</span>
                      <span>{selectedSiswa.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4 border-2 border-cyan-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Ruler className="w-5 h-5 text-cyan-600" />
                    <p className="text-sm font-bold text-cyan-900">Tinggi Badan</p>
                  </div>
                  <p className="text-3xl font-bold text-cyan-900">{selectedSiswa.tinggiBadan} cm</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border-2 border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Weight className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-900">Berat Badan</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900">{selectedSiswa.beratBadan} kg</p>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 border-2 border-pink-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-pink-600" />
                    <p className="text-sm font-bold text-pink-900">IMT</p>
                  </div>
                  <p className="text-3xl font-bold text-pink-900">
                    {typeof selectedSiswa.imt === "number" ? selectedSiswa.imt.toFixed(1) : Number(selectedSiswa.imt || 0).toFixed(1)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <p className="text-sm font-bold text-amber-900">Status Gizi</p>
                  </div>
                  <p className="text-sm font-bold text-amber-900">{displayStatusText(selectedSiswa.statusGizi)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border-2 border-emerald-200">
                  <p className="text-sm font-bold text-emerald-900 mb-2">Status Gizi</p>
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(selectedSiswa.statusGizi)}`}
                  >
                    {displayStatusText(selectedSiswa.statusGizi)}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200">
                  <p className="text-sm font-bold text-amber-900 mb-2">Status Stunting</p>
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStuntingColor(selectedSiswa.statusStunting)}`}
                  >
                    {displayStatusText(selectedSiswa.statusStunting)}
                  </span>
                </div>
              </div>

              {selectedSiswa.riwayatPengukuran && selectedSiswa.riwayatPengukuran.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Grafik Pertumbuhan</h4>
                  <GrowthChart data={selectedSiswa.riwayatPengukuran} />
                </div>
              )}

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Informasi Kesehatan</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Alergi</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSiswa.alergi.length === 0 ? (
                          <p className="font-medium text-gray-900">Tidak ada alergi</p>
                        ) : (
                          selectedSiswa.alergi.map((alergi: string, idx: number) => (
                            <Chip key={idx} label={alergi} variant="warning" />
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleOpenEditModal(selectedSiswa)
                      setShowDetailModal(false)
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#1B263A] to-[#243B55] text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm mt-4"
                    >
                    Edit Data Siswa
                  </button>

                  {selectedSiswa.statusGizi !== "NORMAL" && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mt-3">
                      <p className="text-sm font-bold text-amber-900 mb-1">⚠️ Catatan Penting</p>
                      <p className="text-sm text-amber-800">
                        Siswa memerlukan perhatian khusus dalam program gizi. Pastikan mendapatkan porsi yang sesuai dan
                        monitor perkembangan secara rutin.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SekolahLayout>
  )
}

export default DataSiswa
