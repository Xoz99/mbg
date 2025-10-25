"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, Loader2, Users } from "lucide-react"

const LoginPage = () => {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showDummyAccounts, setShowDummyAccounts] = useState(false)

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://72.60.79.126:3000"

  // Dummy Accounts untuk Testing
  const dummyAccounts = [
    {
      role: "CSR",
      email: "csr@test.com",
      password: "csr123",
      name: "PT. Peduli Sosial Indonesia",
      company: "PT. Peduli Sosial Indonesia"
    },
    {
      role: "CSR",
      email: "csr.manager@company.com",
      password: "password123",
      name: "PT. Karya Baik Bersama",
      company: "PT. Karya Baik Bersama"
    },
    {
      role: "KEMENTRIAN",
      email: "kementrian@test.com",
      password: "kementrian123",
      name: "Kementerian Sosial",
      department: "Kementerian Sosial RI"
    },
    {
      role: "KEMENTRIAN",
      email: "kemsos@gov.id",
      password: "password123",
      name: "Kementerian Pendidikan",
      department: "Kemendikbud RI"
    }
  ]

  const handleDummyLogin = (account: typeof dummyAccounts[0]) => {
    setEmail(account.email)
    setPassword(account.password)
    setShowDummyAccounts(false)
  }

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        let userData = null
        let token = null
        let apiRole = null

        if (data.data?.user) {
          userData = data.data.user
          token = data.data.token || data.token
          apiRole = data.data.user.role
        } else if (data.user) {
          userData = data.user
          token = data.token
          apiRole = data.user.role
        } else if (data.data) {
          userData = data.data
          token = data.token || data.data.token
          apiRole = data.data.role
        } else {
          userData = data
          token = data.token
          apiRole = data.role
        }

        if (!apiRole || !token) {
          setError("Data login tidak lengkap. Silakan hubungi administrator.")
          setIsLoading(false)
          return
        }

        // Tentukan route berdasarkan role
        let routePath = ""

        if (apiRole === "SUPERADMIN") {
          routePath = "/admin/dashboard"
        } else if (apiRole === "ADMIN") {
          routePath = "/adminbiasa/dashboard"
        } else if (apiRole === "PEMPROV") {
          routePath = "/pemprov/dashboard"
        } else if (apiRole === "CSR") {
          routePath = "/csr/dashboard"
        } else if (apiRole === "KEMENTRIAN") {
          routePath = "/kementrian/dashboard"
        } else if (apiRole === "DRIVER") {
          routePath = "/driver/dashboard"
        } else if (apiRole === "PIC_SEKOLAH") {
          routePath = "/sekolah/dashboard"
        } else if (apiRole === "PIC_DAPUR") {
          routePath = "/dapur/dashboard"
        } else {
          routePath = "/dashboard"
        }

        if (typeof window !== "undefined") {
          const userDataWithRole = {
            ...userData,
            role: apiRole
          }
          
          localStorage.setItem("mbg_user", JSON.stringify(userDataWithRole))
          localStorage.setItem("authToken", token)
          localStorage.setItem("mbg_token", token)
          document.cookie = `mbg_token=${token}; path=/; max-age=86400; SameSite=Lax`

          // Simpan data spesifik berdasarkan role
          if (apiRole === "PIC_DAPUR") {
            const dapurId = userData.dapurId || userData.dapur_id || userData.kitchenId || userData.Dapur?.id || userData.dapur?.id
            if (dapurId) {
              localStorage.setItem("userDapurId", dapurId)
            }
          }

          if (apiRole === "PIC_SEKOLAH") {
            const sekolahId = userData.sekolahId || userData.sekolah_id || userData.schoolId || userData.Sekolah?.id || userData.sekolah?.id
            if (sekolahId) {
              localStorage.setItem("userSekolahId", sekolahId)
            }
          }

          if (apiRole === "PEMPROV") {
            const provinsi = userData.provinsi || userData.province || userData.Provinsi
            if (provinsi) {
              localStorage.setItem("userProvince", provinsi)
            }
          }

          if (apiRole === "DRIVER") {
            const driverId = userData.driverId || userData.driver_id || userData.id
            if (driverId) {
              localStorage.setItem("userDriverId", driverId)
            }
          }

          if (apiRole === "CSR") {
            const csrId = userData.csrId || userData.csr_id || userData.id
            const companyName = userData.companyName || userData.company_name || userData.company
            if (csrId) {
              localStorage.setItem("userCsrId", csrId)
            }
            if (companyName) {
              localStorage.setItem("userCompany", companyName)
            }
          }

          if (apiRole === "KEMENTRIAN") {
            const kementrianId = userData.kementrianId || userData.kementrian_id || userData.id
            const department = userData.department || userData.departemen || userData.kementrian
            if (kementrianId) {
              localStorage.setItem("userKementrianId", kementrianId)
            }
            if (department) {
              localStorage.setItem("userDepartment", department)
            }
          }
        }

        router.push(routePath)
      } else {
        setError(data.message || data.error || "Email atau password salah!")
        setIsLoading(false)
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.")
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && email && password) {
      handleLogin(e as any)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0b1f3a] via-[#24364a] to-[#dfe4ea] flex items-center justify-center p-4">
      <img
        src="/logo/bgn_logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 mx-auto my-0 h-auto object-contain opacity-10 w-[1100px] md:w-[1400px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#dfe4ea] to-transparent"
      />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-4 bg-white shadow-xl">
            <img src="/logo/bgn_logo.png" alt="Logo BGN" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Makan Bergizi Gratis</h1>
          <p className="text-white/70 text-sm">Sistem Manajemen Program MBG</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Login</h2>
            <button
              onClick={() => setShowDummyAccounts(!showDummyAccounts)}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <Users size={16} />
              Dummy
            </button>
          </div>

          {showDummyAccounts && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-3">Akun Testing:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dummyAccounts.map((account, index) => (
                  <button
                    key={index}
                    onClick={() => handleDummyLogin(account)}
                    className="w-full text-left p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-600">{account.email}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {account.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all pr-12 text-gray-900"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              className="w-full bg-[#0f2a4a] text-white py-3 rounded-lg font-semibold hover:bg-[#0d2340] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          © 2025 Program Makan Bergizi Gratis
        </p>
      </div>
    </div>
  )
}

export default LoginPage