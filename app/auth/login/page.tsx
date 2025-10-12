"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

const LoginPage = () => {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    setTimeout(() => {
      const users = [
        { email: "smanli@mbg.id", password: "123456", role: "sekolah", nama: "SDN 01 Jakarta" },
        { email: "kementerian@mbg.id", password: "123456", role: "kementerian", nama: "Admin Kemendikbud" },
        { email: "dapur@mbg.id", password: "123456", role: "dapur", nama: "Dapur MBG Jakarta Pusat" },
      ]

      const user = users.find((u) => u.email === email && u.password === password)

      if (user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("mbg_user", JSON.stringify(user))
          document.cookie = `mbg_user=${JSON.stringify(user)}; path=/; max-age=86400`
        }

        setIsLoading(false)
        router.push(`/${user.role}/dashboard`)
      } else {
        setError("Email atau password salah!")
        setIsLoading(false)
      }
    }, 500)
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
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              className="w-full bg-[#0f2a4a] text-white py-3 rounded-lg font-semibold hover:bg-[#0d2340] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Demo */}
          <div className="mt-6 pt-6 border-t border-gray-200">
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