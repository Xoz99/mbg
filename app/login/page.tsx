'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Utensils, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const users = [
        { email: 'sekolah@mbg.id', password: '123456', role: 'sekolah', nama: 'SDN 01 Jakarta' },
        { email: 'kementerian@mbg.id', password: '123456', role: 'kementerian', nama: 'Admin Kemendikbud' },
        { email: 'dapur@mbg.id', password: '123456', role: 'dapur', nama: 'Dapur MBG Jakarta Pusat' }
      ];

      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Simpan ke localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('mbg_user', JSON.stringify(user));
          // Simpan ke cookie juga
          document.cookie = `mbg_user=${JSON.stringify(user)}; path=/; max-age=86400`;
        }
        
        setIsLoading(false);
        
        // Redirect ke dashboard
        router.push(`/${user.role}/dashboard`);
      } else {
        setError('Email atau password salah!');
        setIsLoading(false);
      }
    }, 500);
  };

  const fillDemoCredentials = (role: string) => {
    setEmail(`${role}@mbg.id`);
    setPassword('123456');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl mb-4 shadow-2xl shadow-green-200">
            <Utensils className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Project MBG</h1>
          <p className="text-gray-600">Makan Bergizi Gratis</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Login</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@mbg.id"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Login'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3 text-center font-medium">Demo Accounts (klik untuk isi otomatis)</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('sekolah')}
                className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 font-medium"
              >
                Sekolah
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('kementerian')}
                className="px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 font-medium"
              >
                Kementerian
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('dapur')}
                className="px-3 py-2 text-xs bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200 font-medium"
              >
                Dapur
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">Password semua: <code className="bg-gray-100 px-2 py-0.5 rounded">123456</code></p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 Program Makan Bergizi Gratis
        </p>
      </div>
    </div>
  );
};

export default LoginPage;