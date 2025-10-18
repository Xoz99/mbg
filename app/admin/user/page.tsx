"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/layout/AdminLayout"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Search,
  Mail,
  Phone,
  Shield,
  AlertCircle,
  Loader2,
  Download,
  Eye as EyeIcon,
  EyeOff,
  Check,
  ChevronDown,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://72.60.79.126:3000"

interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

const UserManagement = () => {
  const router = useRouter()
  const [authToken, setAuthToken] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState("semua")

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Selected user
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    password: "",
    role: "PIC_DAPUR",
  })
  const [showPassword, setShowPassword] = useState(false)

  // Role list
  const roles = [
    { value: "PIC_DAPUR", label: "PIC Dapur", color: "bg-blue-100 text-blue-700" },
    { value: "PIC_SEKOLAH", label: "PIC Sekolah", color: "bg-green-100 text-green-700" },
    { value: "KEMENTERIAN", label: "Kementerian", color: "bg-purple-100 text-purple-700" },
    { value: "ADMIN", label: "Admin", color: "bg-orange-100 text-orange-700" },
    { value: "SUPERADMIN", label: "Super Admin", color: "bg-red-100 text-red-700" },
  ]

  // Auth check
  useEffect(() => {
    const userData = localStorage.getItem("mbg_user")
    const token = localStorage.getItem("mbg_token") || localStorage.getItem("authToken")

    if (!userData || !token) {
      router.push("/auth/login")
      return
    }

    try {
      const user = JSON.parse(userData)
      const role = user.role || user.routeRole

      if (role !== "SUPERADMIN") {
        router.push("/auth/login")
        return
      }

      setAuthToken(token)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/auth/login")
    }
  }, [router])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!authToken) return

    try {
      setLoading(true)
      setError(null)

      // Coba endpoint dengan pattern yang sama seperti karyawan
      const endpoints = [
        `${API_BASE_URL}/api/user?page=1&limit=100`,
        `${API_BASE_URL}/api/users?page=1&limit=100`,
        `${API_BASE_URL}/api/auth/users?page=1&limit=100`,
      ]

      let response = null
      let lastError = null

      for (const endpoint of endpoints) {
        try {
          console.log("[FETCH] Trying endpoint:", endpoint)
          response = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            console.log("[FETCH] Success with endpoint:", endpoint)
            break
          } else {
            console.warn(`[FETCH] ${endpoint} returned ${response.status}`)
            lastError = new Error(`API Error: ${response.status}`)
          }
        } catch (err) {
          console.error(`[FETCH] Error trying ${endpoint}:`, err)
          lastError = err
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error("Semua endpoint user gagal")
      }

      const data = await response.json()
      console.log("Users response:", data)

      // Parse response dengan berbagai kemungkinan struktur
      let userList = []
      if (Array.isArray(data.data?.data)) {
        userList = data.data.data
      } else if (Array.isArray(data.data)) {
        userList = data.data
      } else if (Array.isArray(data)) {
        userList = data
      }

      console.log("Parsed users:", userList)
      setUsers(userList)
    } catch (err: any) {
      console.error("Fetch error:", err)
      setError(
        err.message ||
          "Gagal memload data user - cek endpoint /api/user, /api/users, atau /api/auth/users"
      )
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [authToken])

  // Fetch users saat authToken tersedia
  useEffect(() => {
    if (authToken) {
      fetchUsers()
    }
  }, [authToken, fetchUsers])

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const payload = {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      }

      const response = await fetch(`${API_BASE_URL}/api/user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log("Create success:", result)

      setFormData({ email: "", name: "", phone: "", password: "", role: "PIC_DAPUR" })
      setShowAddModal(false)
      await fetchUsers()
      alert("User berhasil ditambahkan!")
    } catch (err: any) {
      console.error("Create error:", err)
      alert(err.message || "Gagal menambah user")
    } finally {
      setLoading(false)
    }
  }

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      setLoading(true)

      const payload = {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
      }

      // Tambah password jika diisi
      if (formData.password) {
        ;(payload as any).password = formData.password
      }

      const response = await fetch(`${API_BASE_URL}/api/user/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log("Update success:", result)

      setFormData({ email: "", name: "", phone: "", password: "", role: "PIC_DAPUR" })
      setShowEditModal(false)
      setSelectedUser(null)
      await fetchUsers()
      alert("User berhasil diupdate!")
    } catch (err: any) {
      console.error("Update error:", err)
      alert(err.message || "Gagal mengupdate user")
    } finally {
      setLoading(false)
    }
  }

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return

    try {
      setLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      console.log("Delete success")
      await fetchUsers()
      alert("User berhasil dihapus!")
    } catch (err: any) {
      console.error("Delete error:", err)
      alert(err.message || "Gagal menghapus user")
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
      setDeleteTargetId(null)
    }
  }

  // Open edit modal
  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      phone: user.phone || "",
      password: "",
      role: user.role,
    })
    setShowEditModal(true)
  }

  // Filter dan search
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Search
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter role
    if (filterRole !== "semua") {
      filtered = filtered.filter((user) => user.role === filterRole)
    }

    return filtered
  }, [users, searchQuery, filterRole])

  // Stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      picDapur: users.filter((u) => u.role === "PIC_DAPUR").length,
      picSekolah: users.filter((u) => u.role === "PIC_SEKOLAH").length,
      admin: users.filter((u) => u.role === "ADMIN" || u.role === "SUPERADMIN").length,
    }
  }, [users])

  const getRoleConfig = (role: string) => {
    return roles.find((r) => r.value === role) || roles[0]
  }

  const StatCard = ({ title, value, color }: any) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className={`p-3 rounded-lg ${color} w-fit mb-3`}>
        <Users className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )

  if (loading && users.length === 0) {
    return (
      <AdminLayout currentPage="user">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout currentPage="user">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">User Management</h1>
            <p className="text-gray-600">Kelola pengguna sistem MBG</p>
          </div>
          <button
            onClick={() => {
              setFormData({ email: "", name: "", phone: "", password: "", role: "PIC_DAPUR" })
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-md"
          >
            <Plus className="w-5 h-5" />
            Tambah User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total User" value={stats.total} color="bg-blue-600" />
        <StatCard title="PIC Dapur" value={stats.picDapur} color="bg-green-600" />
        <StatCard title="PIC Sekolah" value={stats.picSekolah} color="bg-purple-600" />
        <StatCard title="Admin" value={stats.admin} color="bg-orange-600" />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="semua">Semua Role</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Nama</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Telepon</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Tidak ada user</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleConfig = getRoleConfig(user.role)
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{user.phone || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${roleConfig.color}`}>
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowDetailModal(true)
                            }}
                            className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTargetId(user.id)
                              setShowDeleteConfirm(true)
                            }}
                            className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Tambah User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telepon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="08xx xxx xxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Edit User</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telepon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password (kosongkan jika tidak diubah)</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit className="w-5 h-5" />}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus User?</h3>
              <p className="text-sm text-gray-600 mb-6">Tindakan ini tidak dapat dibatalkan.</p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteTargetId(null)
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={() => deleteTargetId && handleDeleteUser(deleteTargetId)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Detail User</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">Nama</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">{selectedUser.name}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Email</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {selectedUser.email}
                </p>
              </div>

              {selectedUser.phone && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">Telepon</label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {selectedUser.phone}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600">Role</label>
                <div className="mt-2">
                  {(() => {
                    const roleConfig = getRoleConfig(selectedUser.role)
                    return (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${roleConfig.color}`}>
                        <Shield className="inline w-3 h-3 mr-1" />
                        {roleConfig.label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {selectedUser.createdAt && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Dibuat: {new Date(selectedUser.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    openEditModal(selectedUser)
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default UserManagement