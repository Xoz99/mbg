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

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("🔄 Attempting login to:", `${baseUrl}/api/auth/login`)
      
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })

      let data
      try {
        data = await response.json()
        console.log("📦 Raw API Response:", data)
      } catch (parseError) {
        console.error("❌ Parse error:", parseError)
        setError("Server mengembalikan response yang tidak valid.")
        setIsLoading(false)
        return
      }

      if (response.ok) {
        // Debug: Cek semua kemungkinan lokasi data
        console.log("🔍 Checking data locations:", {
          "data": data,
          "data.data": data.data,
          "data.user": data.user,
          "data.data.user": data.data?.user,
        })

        // Ekstrak user data dengan berbagai kemungkinan struktur
        let userData = null
        let token = null
        let apiRole = null

        // Coba berbagai struktur response
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

        console.log("📋 Extracted data:", { userData, token, apiRole })

        if (!apiRole) {
          console.error("❌ Role tidak ditemukan di response")
          setError("Data login tidak lengkap. Silakan hubungi administrator.")
          setIsLoading(false)
          return
        }

        if (!token) {
          console.error("❌ Token tidak ditemukan di response")
          setError("Token tidak ditemukan. Silakan hubungi administrator.")
          setIsLoading(false)
          return
        }

        // Mapping role dari API ke route
        const roleMapping: { [key: string]: string } = {
          "PIC_DAPUR": "dapur",
          "PIC_SEKOLAH": "sekolah",
          "KEMENTERIAN": "kementerian",
          "ADMIN": "admin",
          "SUPERADMIN": "admin"
        }

        const userRole = roleMapping[apiRole] || apiRole.toLowerCase()

        // Simpan data user ke localStorage
        if (typeof window !== "undefined") {
          const userDataWithMappedRole = {
            ...userData,
            role: apiRole,
            routeRole: userRole
          }
          
          console.log("💾 Saving to localStorage:", userDataWithMappedRole)
          
          // Simpan user data
          localStorage.setItem("mbg_user", JSON.stringify(userDataWithMappedRole))
          
          // Simpan token
          localStorage.setItem("authToken", token)
          localStorage.setItem("mbg_token", token)
          document.cookie = `mbg_token=${token}; path=/; max-age=86400; SameSite=Lax`
          
          console.log("✅ Token saved:", token.substring(0, 20) + "...")

          // Simpan dapur ID jika role adalah PIC_DAPUR
          if (apiRole === "PIC_DAPUR") {
            // Coba berbagai kemungkinan field name
            const dapurId = userData.dapurId 
              || userData.dapur_id 
              || userData.kitchenId
              || userData.Dapur?.id
              || userData.dapur?.id
            
            console.log("🔍 Looking for dapurId in:", {
              dapurId: userData.dapurId,
              dapur_id: userData.dapur_id,
              kitchenId: userData.kitchenId,
              "Dapur?.id": userData.Dapur?.id,
              "dapur?.id": userData.dapur?.id,
            })
            
            if (dapurId) {
              localStorage.setItem("userDapurId", dapurId)
              console.log("✅ Dapur ID saved:", dapurId)
            } else {
              console.warn("⚠️ Dapur ID tidak ditemukan di response. userData:", userData)
              // Jangan block login, tapi warn user
              console.warn("⚠️ Menu Planning mungkin tidak berfungsi tanpa Dapur ID")
            }
          }
          
          // Simpan sekolah ID jika role adalah PIC_SEKOLAH
          if (apiRole === "PIC_SEKOLAH") {
            const sekolahId = userData.sekolahId 
              || userData.sekolah_id 
              || userData.schoolId
              || userData.Sekolah?.id
              || userData.sekolah?.id
            
            if (sekolahId) {
              localStorage.setItem("userSekolahId", sekolahId)
              console.log("✅ Sekolah ID saved:", sekolahId)
            }
          }
          
          // Set cookie
          document.cookie = `mbg_user=${JSON.stringify(userDataWithMappedRole)}; path=/; max-age=86400; SameSite=Lax`
          
          console.log("✅ Login berhasil, redirecting to:", `/${userRole}/dashboard`)
        }

        // Redirect berdasarkan role
        router.push(`/${userRole}/dashboard`)
      } else {
        console.error("❌ Login failed:", data)
        setError(data.message || data.error || "Email atau password salah!")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("❌ Login error:", err)
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.")
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (role: string) => {
    setEmail(`${role}@mbg.id`)
    setPassword("123456")
    setError("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
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
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-4 bg-white shadow-xl">
            <img src="/logo/bgn_logo.png" alt="Logo BGN" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Makan Bergizi Gratis
          </h1>
          <p className="text-white/70 text-sm">
            Sistem Manajemen Program MBG
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Login</h2>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
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

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              className="w-full bg-[#0f2a4a] text-white py-3 rounded-lg font-semibold hover:bg-[#0d2340] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Demo */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3 text-center">Demo Credentials</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials("smanli")}
                disabled={isLoading}
                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 font-medium text-sm disabled:opacity-50"
              >
                Sekolah
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("kementerian")}
                disabled={isLoading}
                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 font-medium text-sm disabled:opacity-50"
              >
                Kementerian
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("dapur")}
                disabled={isLoading}
                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 font-medium text-sm disabled:opacity-50"
              >
                Dapur
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-white/60 mt-6">
          © 2025 Program Makan Bergizi Gratis
        </p>
      </div>
    </div>
  )
}

export default LoginPage