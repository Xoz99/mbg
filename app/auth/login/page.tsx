"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"

const LoginPage = () => {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://72.60.79.126:3000"

  // Hardcoded credentials
  const CSR_EMAIL = "csr@mbg.id"
  const CSR_PASSWORD = "123456"

  const PEMPROV_MAP: { [key: string]: string } = {
    "pemprovjabar@mbg.id": "Jawa Barat",
    "pemprovjateng@mbg.id": "Jawa Tengah",
    "pemprovjatim@mbg.id": "Jawa Timur",
    "pemprovbanten@mbg.id": "Banten",
    "pemprovdki@mbg.id": "DKI Jakarta",
    "pemprovbali@mbg.id": "Bali",
    "pemprovsumatera@mbg.id": "Sumatera Utara"
  }

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // CSR Login (Local)
      if (email === CSR_EMAIL && password === CSR_PASSWORD) {
        const csrUser = {
          id: "csr-001",
          email: email,
          name: "CSR Officer",
          role: "CSR",
          routeRole: "csr"
        }
        
        if (typeof window !== "undefined") {
          localStorage.setItem("mbg_user", JSON.stringify(csrUser))
          localStorage.setItem("authToken", "csr-token-dummy")
          localStorage.setItem("mbg_token", "csr-token-dummy")
          document.cookie = `mbg_token=csr-token-dummy; path=/; max-age=86400; SameSite=Lax`
        }
        
        router.push("/csr/dashboard")
        return
      }

      // Pemprov Login (Local)
      const province = PEMPROV_MAP[email.toLowerCase()]
      if (province && password === CSR_PASSWORD) {
        const pemprovUser = {
          id: "pemprov-001",
          email: email,
          name: `Pemerintah Provinsi ${province}`,
          role: "PEMPROV",
          routeRole: "pemprov",
          province: province
        }
        
        if (typeof window !== "undefined") {
          localStorage.setItem("mbg_user", JSON.stringify(pemprovUser))
          localStorage.setItem("authToken", "pemprov-token-dummy")
          localStorage.setItem("mbg_token", "pemprov-token-dummy")
          localStorage.setItem("userProvince", province)
          document.cookie = `mbg_token=pemprov-token-dummy; path=/; max-age=86400; SameSite=Lax`
        }
        
        router.push("/pemprov/dashboard")
        return
      }

      // API Login untuk role lain (Sekolah, Kementerian, Dapur)
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

        const roleMapping: { [key: string]: string } = {
          "PIC_DAPUR": "dapur",
          "PIC_SEKOLAH": "sekolah",
          "KEMENTERIAN": "kementerian",
          "ADMIN": "admin",
          "SUPERADMIN": "admin"
        }

        const userRole = roleMapping[apiRole] || apiRole.toLowerCase()

        if (typeof window !== "undefined") {
          const userDataWithRole = {
            ...userData,
            role: apiRole,
            routeRole: userRole
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
        }

        router.push(`/${userRole}/dashboard`)
      } else {
        setError(data.message || data.error || "Email atau password salah!")
        setIsLoading(false)
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.")
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (type: string) => {
    setError("")
    const credentials: { [key: string]: { email: string; password: string } } = {
      sekolah: { email: "picsekolah1@mbg.com", password: "password123" },
      kementerian: { email: "kementerian@mbg.id", password: "123456" },
      dapur: { email: "pic.dapur@mbg.id", password: "password123" },
      csr: { email: "csr@mbg.id", password: "123456" },
      pemprovjabar: { email: "pemprovjabar@mbg.id", password: "123456" }
    }
    
    if (credentials[type]) {
      setEmail(credentials[type].email)
      setPassword(credentials[type].password)
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
          <h2 className="text-xl font-bold text-gray-900 mb-6">Login</h2>

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

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3 text-center">Demo Credentials</p>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("sekolah")}
                  disabled={isLoading}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 font-medium text-xs disabled:opacity-50"
                >
                  Sekolah
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("kementerian")}
                  disabled={isLoading}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 font-medium text-xs disabled:opacity-50"
                >
                  Kementerian
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("dapur")}
                  disabled={isLoading}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 font-medium text-xs disabled:opacity-50"
                >
                  Dapur
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("csr")}
                  disabled={isLoading}
                  className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all border border-green-200 font-medium text-xs disabled:opacity-50"
                >
                  CSR
                </button>
              </div>

              <button
                type="button"
                onClick={() => fillDemoCredentials("pemprovjabar")}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all border border-purple-200 font-medium text-xs disabled:opacity-50"
              >
                Pemprov Jawa Barat
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          © 2025 Program Makan Bergizi Gratis
        </p>
      </div>
    </div>
  )
}

export default LoginPage