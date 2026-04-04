"use client"

import type React from "react"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import DapurLayout from "@/components/layout/DapurLayout"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase,
  Download,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-10 w-10 rounded-lg bg-gray-200 mb-3"></div>
    <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
    <div className="h-8 w-12 bg-gray-200 rounded mb-2"></div>
    <div className="h-3 w-24 bg-gray-100 rounded"></div>
  </div>
)

const SkeletonRow = () => (
  <tr>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex gap-2">
        <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </td>
  </tr>
)

function extractEmployeesList(payload: any): any[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) {
    // Handle nested data.data
    if (Array.isArray(payload.data.data)) return payload.data.data
    return payload.data
  }
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.result)) return payload.result
  if (Array.isArray(payload.rows)) return payload.rows
  if (Array.isArray(payload.content)) return payload.content

  const d = payload.data
  if (Array.isArray(d?.items)) return d.items
  if (Array.isArray(d?.results)) return d.results
  if (Array.isArray(d?.rows)) return d.rows
  if (Array.isArray(d?.data)) return d.data

  for (const key of Object.keys(payload)) {
    const val = (payload as any)[key]
    if (Array.isArray(val) && val.every((v: any) => typeof v === "object")) {
      return val
    }
  }

  return []
}

const DataKaryawan = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("semua")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)

  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dapurId, setDapurId] = useState("")
  const [authToken, setAuthToken] = useState("")

  const [formData, setFormData] = useState({
    nama: "",
    posisi: "",
    jenisKelamin: "LAKI_LAKI",
    status: "AKTIF",
  })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string>("")

  const isFetchingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchEmployees = useCallback(async () => {
    if (!dapurId || !authToken || isFetchingRef.current) {
      setError("Dapur ID atau Token tidak tersedia")
      setLoading(false)
      return
    }

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      isFetchingRef.current = true
      setError(null)
      setLoading(true)

      const statusParam = filterStatus !== "semua" ? `&status=${filterStatus}` : ""
      const url = `${API_BASE_URL}/api/dapur/${dapurId}/karyawan?page=1&limit=100${statusParam}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const list = extractEmployeesList(data)
      setEmployees(list)
      setError(null)
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Gagal memuat data karyawan")
        setEmployees([])
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [dapurId, authToken, filterStatus])

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
    let userObj: any = null

    try {
      userObj = JSON.parse(localStorage.getItem("mbg_user") || "null")
    } catch {
      userObj = null
    }

    const candidates = [
      localStorage.getItem("userDapurId"),
      localStorage.getItem("dapurId"),
      userObj?.dapurId,
      userObj?.dapur_id,
      userObj?.Dapur?.id,
      userObj?.dapur?.id,
      Array.isArray(userObj?.DapurUser) ? userObj?.DapurUser?.[0]?.dapurId : null,
    ].filter(Boolean) as string[]

    const foundDapurId = candidates[0] || ""

    if (storedToken && storedToken !== authToken) {
      setAuthToken(storedToken)
    }

    if (foundDapurId && foundDapurId !== dapurId) {
      setDapurId(foundDapurId)
    }

    if (!storedToken || !foundDapurId) {
      setError("Token atau Dapur ID tidak ditemukan. Silakan login kembali.")
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (dapurId && authToken) {
      fetchEmployees()
    }
  }, [dapurId, authToken, filterStatus, fetchEmployees])

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const formDataToSend = new FormData()
      formDataToSend.append("nama", formData.nama)
      formDataToSend.append("posisi", formData.posisi)
      formDataToSend.append("jenisKelamin", formData.jenisKelamin)
      formDataToSend.append("status", formData.status)

      if (fotoFile) {
        formDataToSend.append("foto", fotoFile)
      }

      const url = `${API_BASE_URL}/api/karyawan`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorData}`)
      }

      setFormData({ nama: "", posisi: "", jenisKelamin: "LAKI_LAKI", status: "AKTIF" })
      setFotoFile(null)
      setFotoPreview("")
      setShowAddModal(false)

      await fetchEmployees()
      alert("Karyawan berhasil ditambahkan!")
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menambah karyawan")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    try {
      setLoading(true)

      const formDataToSend = new FormData()
      formDataToSend.append("nama", formData.nama)
      formDataToSend.append("posisi", formData.posisi)
      formDataToSend.append("jenisKelamin", formData.jenisKelamin)
      formDataToSend.append("status", formData.status)

      if (fotoFile) {
        formDataToSend.append("foto", fotoFile)
      }

      const employeeId = editingEmployee.id || editingEmployee._id
      const url = `${API_BASE_URL}/api/karyawan/${employeeId}`

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      setFormData({ nama: "", posisi: "", jenisKelamin: "LAKI_LAKI", status: "AKTIF" })
      setFotoFile(null)
      setFotoPreview("")
      setShowEditModal(false)
      setEditingEmployee(null)
      await fetchEmployees()
      alert("Karyawan berhasil diupdate!")
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat update karyawan")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus karyawan ini?")) return

    try {
      setLoading(true)
      const url = `${API_BASE_URL}/api/karyawan/${id}`

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      await fetchEmployees()
      alert("Karyawan berhasil dihapus!")
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menghapus karyawan")
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (employee: any) => {
    setEditingEmployee(employee)
    setFormData({
      nama: employee.nama || employee.name || "",
      posisi: employee.posisi || employee.position || "",
      jenisKelamin: employee.jenisKelamin || "LAKI_LAKI",
      status: employee.status || "AKTIF",
    })
    setFotoPreview("")
    setFotoFile(null)
    setShowEditModal(true)
  }

  const filteredEmployees = useMemo(() => {
    let filtered = employees

    if (searchQuery) {
      filtered = filtered.filter(
        (emp) =>
          (emp.nama || emp.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (emp.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (emp.posisi || emp.position || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (filterStatus !== "semua") {
      filtered = filtered.filter((emp) => (emp.status || "").toUpperCase() === filterStatus)
    }

    return filtered
  }, [employees, searchQuery, filterStatus])

  const stats = useMemo(() => {
    const total = employees.length
    const active = employees.filter((e) => (e.status || "").toUpperCase() === "AKTIF").length
    const inactive = employees.filter((e) => (e.status || "").toUpperCase() === "TIDAK_AKTIF").length
    return { total, active, inactive }
  }, [employees])

  const getStatusConfig = (status: string) => {
    const configs = {
      AKTIF: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: UserCheck,
        text: "Aktif",
        dotColor: "bg-green-500",
      },
      TIDAK_AKTIF: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: UserX,
        text: "Tidak Aktif",
        dotColor: "bg-red-500",
      },
    }
    return configs[status as keyof typeof configs] || configs.AKTIF
  }

  const getJenisKelaminDisplay = (jenis: string) => {
    if (!jenis) return "-"
    if (jenis === "LAKI_LAKI") return "Laki-laki"
    if (jenis === "PEREMPUAN") return "Perempuan"
    return jenis
  }

  if (loading && employees.length === 0) {
    return (
      <DapurLayout currentPage="karyawan">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Data Karyawan</h1>
          <p className="text-sm text-gray-500">Kelola data staf dapur</p>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </DapurLayout>
    )
  }

  if (error && employees.length === 0) {
    return (
      <DapurLayout currentPage="karyawan">
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null)
                if (dapurId && authToken) fetchEmployees()
              }}
              className="px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] text-sm font-semibold transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </DapurLayout>
    )
  }

  return (
    <DapurLayout currentPage="karyawan">
      {/* Header + Stats in one compact row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Data Karyawan</h1>
          <p className="text-sm text-gray-500">Kelola data staf dapur</p>
          {/* Inline stats */}
          <div className="flex items-center gap-5 mt-3">
            <span className="text-sm text-gray-600">
              Total <span className="font-bold text-gray-900">{stats.total}</span>
            </span>
            <span className="text-sm text-gray-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Aktif <span className="font-bold text-gray-900">{stats.active}</span>
            </span>
            <span className="text-sm text-gray-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Non-aktif <span className="font-bold text-gray-900">{stats.inactive}</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Tambah
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1 relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari karyawan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {["semua", "AKTIF", "TIDAK_AKTIF"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === status
                  ? "bg-[#1B263A] text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {status === "semua" ? "Semua" : status === "AKTIF" ? "Aktif" : "Tidak Aktif"}
            </button>
          ))}
        </div>
      </div>

      {/* Employee List – Card style rows instead of plain table */}
      <div className="space-y-2">
        {filteredEmployees.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 font-medium">
              {employees.length > 0
                ? "Tidak ada hasil sesuai filter"
                : "Belum ada data karyawan"}
            </p>
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const statusConfig = getStatusConfig((emp.status || "").toUpperCase())
            return (
              <div
                key={emp.id || emp._id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all cursor-pointer group"
                onClick={() => setSelectedEmployee(emp)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {emp.fotoUrl || emp.foto ? (
                    <img src={emp.fotoUrl || emp.foto} alt={emp.nama} className="w-10 h-10 object-cover rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{emp.nama || emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.posisi || emp.position} · {getJenisKelaminDisplay(emp.jenisKelamin)}</p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                  <span className="text-xs font-semibold text-gray-600">{statusConfig.text}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(emp) }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id || emp._id) }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">Tambah Karyawan</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setFotoFile(null)
                  setFotoPreview("")
                  setFormData({ nama: "", posisi: "", jenisKelamin: "LAKI_LAKI", status: "AKTIF" })
                }}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                  placeholder="Masukkan nama karyawan"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Posisi</label>
                <input
                  type="text"
                  required
                  value={formData.posisi}
                  onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                  placeholder="Contoh: Koki, Staff Packing"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Kelamin</label>
                <select
                  value={formData.jenisKelamin}
                  onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                >
                  <option value="LAKI_LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="TIDAK_AKTIF">Tidak Aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Foto</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#D0B064] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFotoFile(file)
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setFotoPreview(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="hidden"
                    id="foto-input-add"
                  />
                  <label htmlFor="foto-input-add" className="cursor-pointer">
                    {fotoPreview ? (
                      <div className="flex items-center gap-3">
                        <img src={fotoPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{fotoFile?.name}</p>
                          <p className="text-xs text-gray-500">Klik untuk ubah foto</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <User className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-700 font-medium">Klik untuk upload foto</p>
                        <p className="text-xs text-gray-500">atau drag & drop</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFotoFile(null)
                    setFotoPreview("")
                    setFormData({ nama: "", posisi: "", jenisKelamin: "LAKI_LAKI", status: "AKTIF" })
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">Edit Karyawan</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingEmployee(null)
                  setFotoFile(null)
                  setFotoPreview("")
                }}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Posisi</label>
                <input
                  type="text"
                  required
                  value={formData.posisi}
                  onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Kelamin</label>
                <select
                  value={formData.jenisKelamin}
                  onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                >
                  <option value="LAKI_LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="TIDAK_AKTIF">Tidak Aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Update Foto (Opsional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#D0B064] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFotoFile(file)
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setFotoPreview(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="hidden"
                    id="foto-input-edit"
                  />
                  <label htmlFor="foto-input-edit" className="cursor-pointer">
                    {fotoPreview ? (
                      <div className="flex items-center gap-3">
                        <img src={fotoPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{fotoFile?.name}</p>
                          <p className="text-xs text-gray-500">Klik untuk ubah foto</p>
                        </div>
                      </div>
                    ) : editingEmployee.foto ? (
                      <div className="flex items-center gap-3">
                        <img src={editingEmployee.foto} alt="Current" className="w-16 h-16 object-cover rounded-lg" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Foto saat ini</p>
                          <p className="text-xs text-gray-500">Klik untuk ubah foto</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <User className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-700 font-medium">Klik untuk upload foto</p>
                        <p className="text-xs text-gray-500">atau drag & drop</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingEmployee(null)
                    setFotoFile(null)
                    setFotoPreview("")
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit className="w-5 h-5" />}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 rounded">
                  {selectedEmployee.fotoUrl || selectedEmployee.foto ? (
                    <img src={selectedEmployee.fotoUrl || selectedEmployee.foto} alt={selectedEmployee.nama} className="w-12 h-12 object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{selectedEmployee.nama || selectedEmployee.name}</h3>
                  <p className="text-sm text-gray-500">{selectedEmployee.posisi || selectedEmployee.position}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-4 border-b border-gray-100 pb-6">
                  {selectedEmployee.phone && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Telepon</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {selectedEmployee.phone}
                      </p>
                    </div>
                  )}
                  {selectedEmployee.email && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {selectedEmployee.email}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedEmployee.status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Jenis Kelamin</p>
                    <p className="text-sm font-semibold text-gray-900">{getJenisKelaminDisplay(selectedEmployee.jenisKelamin)}</p>
                  </div>
                  {selectedEmployee.createdAt && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tanggal Bergabung</p>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedEmployee.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  )}
                  {selectedEmployee.updatedAt && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Terakhir Update</p>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedEmployee.updatedAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  )}
                </div>

                {selectedEmployee.address && (
                  <div className="pt-2 pb-6 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Alamat</p>
                    <p className="text-sm text-gray-900 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      {selectedEmployee.address}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => {
                    setSelectedEmployee(null)
                    openEditModal(selectedEmployee)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#1B263A] text-[#1B263A] rounded hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  <Edit className="w-4 h-4" />
                  Edit Data
                </button>
                <button
                  onClick={() => {
                    setSelectedEmployee(null)
                    handleDeleteEmployee(selectedEmployee.id || selectedEmployee._id)
                  }}
                  className="px-5 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-bold"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DapurLayout>
  )
}

export default DataKaryawan