"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, Loader2, LogIn, Building2, UserCheck } from "lucide-react"

const LoginPage = () => {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<"quick" | "form">("quick")

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://72.60.79.126:3000"

  // ============================================================
  // ⚠️ MODE BYPASS API - Set ke true untuk disable API calls
  // Set ke false untuk menggunakan API normal
  // ============================================================
  const USE_API_BYPASS = true
  // ============================================================

  const quickAccounts = [
    {
      id: "kementrian1",
      email: "kementrian@test.com",
      password: "kementrian123",
      title: "Kementerian Sosial",
      icon: Building2
    },
    {
      id: "kementrian2",
      email: "kemsos@gov.id",
      password: "password123",
      title: "Kementerian Pendidikan",
      icon: Building2
    },
    {
      id: "csr1",
      email: "csr@test.com",
      password: "csr123",
      title: "PT. Peduli Sosial Indonesia",
      icon: UserCheck
    },
    {
      id: "csr2",
      email: "csr.manager@company.com",
      password: "password123",
      title: "PT. Karya Baik Bersama",
      icon: UserCheck
    }
  ]

  // Mock data untuk bypass API
  const getMockLoginData = (loginEmail: string, loginPassword: string) => {
    if (loginEmail.includes("kementrian") || loginEmail.includes("kemsos")) {
      return {
        ok: true,
        data: {
          user: {
            id: "kementrian-001",
            email: loginEmail,
            name: "Admin Kementerian",
            role: "KEMENTRIAN",
            kementrianId: "kementrian-001",
            kementrian_id: "kementrian-001",
            department: "Kementerian Sosial",
            departemen: "Kementerian Sosial",
            kementrian: "Kementerian Sosial"
          },
          token: "bypass_token_kementrian_" + Date.now()
        }
      }
    } else if (loginEmail.includes("csr")) {
      return {
        ok: true,
        data: {
          user: {
            id: "csr-001",
            email: loginEmail,
            name: "Admin CSR",
            role: "CSR",
            csrId: "csr-001",
            csr_id: "csr-001",
            companyName: "PT. Peduli Sosial",
            company_name: "PT. Peduli Sosial",
            company: "PT. Peduli Sosial"
          },
          token: "bypass_token_csr_" + Date.now()
        }
      }
    } else {
      return {
        ok: false,
        data: {
          message: "Email tidak dikenali dalam mode bypass testing"
        }
      }
    }
  }

  const login = async (loginEmail: string, loginPassword: string) => {
    setError("")
    setIsLoading(true)

    try {
      let response: any
      let data: any

      // ===== BYPASS API LOGIC =====
      if (USE_API_BYPASS) {
        // Simulasi delay seperti API call
        await new Promise(resolve => setTimeout(resolve, 800))
        
        data = getMockLoginData(loginEmail, loginPassword)
        response = {
          ok: data.ok,
          status: data.ok ? 200 : 401
        }

        console.log("🔄 [BYPASS MODE] Login attempt:", { email: loginEmail, mode: "offline" })
      } else {
        // ===== NORMAL API CALL =====
        const apiResponse = await fetch(`${baseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password: loginPassword })
        })

        data = await apiResponse.json()
        response = apiResponse

        console.log("🌐 [API MODE] Login attempt:", { email: loginEmail, mode: "online" })
      }

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

        console.log("✅ Login sukses - Role:", apiRole, "- Redirect ke:", routePath)
        router.push(routePath)
      } else {
        setError(data.message || data.error || "Login gagal!")
        setIsLoading(false)
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.")
      console.error("Login error:", err)
      setIsLoading(false)
    }
  }

  const handleQuickLogin = (account: typeof quickAccounts[0]) => {
    login(account.email, account.password)
  }

  const handleFormLogin = (e: React.MouseEvent) => {
    e.preventDefault()
    login(email, password)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && email && password) {
      handleFormLogin(e as any)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0b1f3a] via-[#24364a] to-[#dfe4ea] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#dfe4ea] to-transparent" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 bg-blue-600 shadow-xl">
            <LogIn size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Makan Bergizi Gratis</h1>
          <p className="text-white/70 text-sm">Sistem Manajemen Program MBG</p>
          
          {/* Bypass Mode Indicator */}
          {USE_API_BYPASS && (
            <div className="mt-3 inline-block px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
              <p className="text-xs text-yellow-600 font-medium">🔄 Mode Offline (Bypass API)</p>
            </div>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setLoginMode("quick")}
              className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all ${
                loginMode === "quick"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Quick Login
            </button>
            <button
              onClick={() => setLoginMode("form")}
              className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all ${
                loginMode === "form"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Manual
            </button>
          </div>

          {/* Quick Login Mode */}
          {loginMode === "quick" && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Pilih Akun:</h3>
              <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                {quickAccounts.map((account) => {
                  const IconComponent = account.icon
                  return (
                    <button
                      key={account.id}
                      onClick={() => handleQuickLogin(account)}
                      disabled={isLoading}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-400 hover:shadow-md rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white flex-shrink-0">
                        <IconComponent size={24} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{account.title}</p>
                        <p className="text-xs text-gray-600">{account.email}</p>
                      </div>
                      {isLoading && (
                        <Loader2 size={18} className="animate-spin text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-4">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Form Login Mode */}
          {loginMode === "form" && (
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
                onClick={handleFormLogin}
                disabled={isLoading || !email || !password}
                className="w-full bg-[#0f2a4a] text-white py-3 rounded-lg font-semibold hover:bg-[#0d2340] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "Memproses..." : "Masuk"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          © 2025 Program Makan Bergizi Gratis
        </p>
      </div>
    </div>
  )
}

export default LoginPage