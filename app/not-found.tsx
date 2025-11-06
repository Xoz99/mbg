// app/not-found.tsx
'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* 404 Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* Animated 404 */}
            {/* Floating truck icon */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="animate-bounce">
                <MapPin className="w-20 h-20 text-[#D0B064]" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center border border-gray-100">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Halaman Tidak Ditemukan
            </h2>
            <p className="text-gray-600 text-lg">
              Maaf, halaman yang Anda cari tidak ada atau belum dibuat karena belum resmi.
            </p>
          </div>

          {/* Suggestions */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Mungkin Anda mencari:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#D0B064] rounded-full"></span>
                Dashboard Sekolah atau Dapur
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#D0B064] rounded-full"></span>
                Halaman Monitoring Driver
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#D0B064] rounded-full"></span>
                Halaman Login atau Registrasi
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1B263A] to-[#2A3749] hover:from-[#2A3749] hover:to-[#1B263A] text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              <Home className="w-5 h-5" />
              Kembali ke Beranda
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl font-semibold transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Halaman Sebelumnya
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Butuh bantuan? Hubungi administrator sistem MBG.
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
      `}</style>
    </div>
  );
}