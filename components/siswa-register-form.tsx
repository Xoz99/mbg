"use client"

import type React from "react"

import { useState } from "react"
import { Ruler, Weight, User, Phone, MapPin, AlertCircle } from "lucide-react"
import type { Siswa } from "@/hooks/use-siswa"

export default function SiswaRegisterForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Partial<Siswa>
  onCancel: () => void
  onSave: (data: Partial<Siswa>) => void
}) {
  const [form, setForm] = useState<Partial<Siswa>>({
    nis: initial?.nis || "",
    nama: initial?.nama || "",
    kelas: initial?.kelas || "X-1",
    jenisKelamin: initial?.jenisKelamin || "L",
    tanggalLahir: initial?.tanggalLahir || "",
    tinggiBadan: initial?.tinggiBadan,
    beratBadan: initial?.beratBadan,
    alamat: initial?.alamat || "",
    namaOrtu: initial?.namaOrtu || "",
    kontakOrtu: initial?.kontakOrtu || "",
    alergi: initial?.alergi || "",
    foto: initial?.foto || (initial?.jenisKelamin === "P" ? "👩" : "👨"),
  })

  const handleChange = (key: keyof Siswa, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nis || !form.nama) return
    onSave({
      ...form,
      registered: true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Identitas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">NIS</label>
          <input
            required
            value={form.nis || ""}
            onChange={(e) => handleChange("nis", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="2024xxx"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Nama</label>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{form.foto}</span>
            <input
              required
              value={form.nama || ""}
              onChange={(e) => handleChange("nama", e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Nama lengkap"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Kelas</label>
          <select
            value={form.kelas || "X-1"}
            onChange={(e) => handleChange("kelas", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="X-1">X-1</option>
            <option value="X-2">X-2</option>
            <option value="XI-1">XI-1</option>
            <option value="XI-2">XI-2</option>
            <option value="XII-1">XII-1</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Jenis Kelamin</label>
          <select
            value={form.jenisKelamin || "L"}
            onChange={(e) => handleChange("jenisKelamin", e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Tanggal Lahir</label>
          <input
            type="date"
            value={form.tanggalLahir || ""}
            onChange={(e) => handleChange("tanggalLahir", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Kesehatan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-gray-500" /> Tinggi Badan (cm)
          </label>
          <input
            type="number"
            min={30}
            max={220}
            value={form.tinggiBadan ?? ""}
            onChange={(e) => handleChange("tinggiBadan", Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="contoh: 158"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
            <Weight className="w-4 h-4 text-gray-500" /> Berat Badan (kg)
          </label>
          <input
            type="number"
            min={5}
            max={200}
            step="0.1"
            value={form.beratBadan ?? ""}
            onChange={(e) => handleChange("beratBadan", Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="contoh: 45"
          />
        </div>
      </div>

      {/* Kontak & Alamat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" /> Nama Orang Tua
          </label>
          <input
            value={form.namaOrtu || ""}
            onChange={(e) => handleChange("namaOrtu", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Nama orang tua"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" /> Kontak Orang Tua
          </label>
          <input
            value={form.kontakOrtu || ""}
            onChange={(e) => handleChange("kontakOrtu", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="08xxxxxxxxxx"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" /> Alamat
          </label>
          <input
            value={form.alamat || ""}
            onChange={(e) => handleChange("alamat", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Alamat lengkap"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-500" /> Alergi
          </label>
          <input
            value={form.alergi || ""}
            onChange={(e) => handleChange("alergi", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Contoh: Kacang, Seafood, Tidak ada"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Batal
        </button>
        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
          Simpan & Daftarkan
        </button>
      </div>
    </form>
  )
}
