"use client"

import { useEffect, useState, useCallback } from "react"

export type RiwayatPengukuran = { bulan: string; tinggi: number; berat: number }

export type Siswa = {
  id: number
  nis: string
  nama: string
  kelas: string
  jenisKelamin?: "L" | "P"
  tanggalLahir?: string
  umur?: number
  tinggiBadan?: number
  beratBadan?: number
  imt?: number
  statusGizi?: "Normal" | "Gizi Kurang" | "Gizi Buruk"
  statusStunting?: "Normal" | "Stunted" | "Severely Stunted"
  alamat?: string
  namaOrtu?: string
  kontakOrtu?: string
  alergi?: string
  foto?: string
  absensiMakan?: number
  riwayatPengukuran?: RiwayatPengukuran[]
  // Absensi & registrasi
  registered?: boolean
  status?: "belum" | "sudah"
  waktuAbsen?: string | null
  statusMakan?: "habis" | "dibungkus" | null
  // Face descriptor placeholder
  faceDescriptor?: any
}

const LS_KEY = "siswa-list"

const seedData: Siswa[] = [
  // Sebagian sudah terdaftar, sebagian belum (registered=false)
  {
    id: 1,
    nis: "2024001",
    nama: "Ahmad Fauzi Rahman",
    kelas: "X-1",
    jenisKelamin: "L",
    tanggalLahir: "2008-05-15",
    umur: 16,
    tinggiBadan: 158,
    beratBadan: 45,
    imt: 18.0,
    statusGizi: "Normal",
    statusStunting: "Normal",
    alamat: "Jl. Merdeka No. 12, Karawang",
    namaOrtu: "Budi Rahman",
    kontakOrtu: "081234567890",
    alergi: "Tidak ada",
    foto: "👨",
    riwayatPengukuran: [
      { bulan: "Jan", tinggi: 155, berat: 43 },
      { bulan: "Feb", tinggi: 156, berat: 43.5 },
      { bulan: "Mar", tinggi: 157, berat: 44 },
      { bulan: "Apr", tinggi: 157.5, berat: 44.5 },
      { bulan: "Mei", tinggi: 158, berat: 45 },
    ],
    absensiMakan: 95,
    registered: true,
    status: "belum",
    waktuAbsen: null,
    statusMakan: null,
  },
  {
    id: 2,
    nis: "2024002",
    nama: "Siti Nurhaliza",
    kelas: "X-1",
    jenisKelamin: "P",
    tanggalLahir: "2008-08-20",
    umur: 16,
    tinggiBadan: 152,
    beratBadan: 42,
    imt: 18.2,
    statusGizi: "Normal",
    statusStunting: "Normal",
    alamat: "Jl. Sudirman No. 45, Karawang",
    namaOrtu: "Hendra Wijaya",
    kontakOrtu: "081298765432",
    alergi: "Kacang",
    foto: "👩",
    riwayatPengukuran: [
      { bulan: "Jan", tinggi: 150, berat: 40 },
      { bulan: "Feb", tinggi: 150.5, berat: 40.5 },
      { bulan: "Mar", tinggi: 151, berat: 41 },
      { bulan: "Apr", tinggi: 151.5, berat: 41.5 },
      { bulan: "Mei", tinggi: 152, berat: 42 },
    ],
    absensiMakan: 98,
    registered: true,
    status: "sudah",
    waktuAbsen: "11:35",
    statusMakan: "habis",
  },
  {
    id: 3,
    nis: "2024003",
    nama: "Budi Santoso",
    kelas: "X-2",
    jenisKelamin: "L",
    tanggalLahir: "2008-03-10",
    umur: 16,
    tinggiBadan: 148,
    beratBadan: 38,
    imt: 17.3,
    statusGizi: "Gizi Kurang",
    statusStunting: "Stunted",
    alamat: "Jl. Pahlawan No. 78, Karawang",
    namaOrtu: "Agus Santoso",
    kontakOrtu: "081345678901",
    alergi: "Tidak ada",
    foto: "👨",
    riwayatPengukuran: [
      { bulan: "Jan", tinggi: 146, berat: 36 },
      { bulan: "Feb", tinggi: 146.5, berat: 36.5 },
      { bulan: "Mar", tinggi: 147, berat: 37 },
      { bulan: "Apr", tinggi: 147.5, berat: 37.5 },
      { bulan: "Mei", tinggi: 148, berat: 38 },
    ],
    absensiMakan: 88,
    registered: false,
    status: "belum",
    waktuAbsen: null,
    statusMakan: null,
  },
  {
    id: 4,
    nis: "2024004",
    nama: "Dewi Lestari",
    kelas: "XI-1",
    jenisKelamin: "P",
    tanggalLahir: "2007-11-25",
    umur: 17,
    tinggiBadan: 160,
    beratBadan: 52,
    imt: 20.3,
    statusGizi: "Normal",
    statusStunting: "Normal",
    alamat: "Jl. Diponegoro No. 23, Karawang",
    namaOrtu: "Iwan Setiawan",
    kontakOrtu: "081456789012",
    alergi: "Seafood",
    foto: "👩",
    riwayatPengukuran: [
      { bulan: "Jan", tinggi: 159, berat: 50 },
      { bulan: "Feb", tinggi: 159.5, berat: 50.5 },
      { bulan: "Mar", tinggi: 159.5, berat: 51 },
      { bulan: "Apr", tinggi: 160, berat: 51.5 },
      { bulan: "Mei", tinggi: 160, berat: 52 },
    ],
    absensiMakan: 100,
    registered: true,
    status: "belum",
    waktuAbsen: null,
    statusMakan: null,
  },
  {
    id: 5,
    nis: "2024005",
    nama: "Rizky Pratama",
    kelas: "XI-2",
    jenisKelamin: "L",
    tanggalLahir: "2007-07-08",
    umur: 17,
    tinggiBadan: 165,
    beratBadan: 58,
    imt: 21.3,
    statusGizi: "Normal",
    statusStunting: "Normal",
    alamat: "Jl. Gatot Subroto No. 56, Karawang",
    namaOrtu: "Bambang Pratama",
    kontakOrtu: "081567890123",
    alergi: "Tidak ada",
    foto: "👨",
    riwayatPengukuran: [
      { bulan: "Jan", tinggi: 163, berat: 56 },
      { bulan: "Feb", tinggi: 163.5, berat: 56.5 },
      { bulan: "Mar", tinggi: 164, berat: 57 },
      { bulan: "Apr", tinggi: 164.5, berat: 57.5 },
      { bulan: "Mei", tinggi: 165, berat: 58 },
    ],
    absensiMakan: 92,
    registered: false,
    status: "belum",
    waktuAbsen: null,
    statusMakan: null,
  },
  {
    id: 6,
    nis: "2024006",
    nama: "Maya Kartika",
    kelas: "XII-1",
    jenisKelamin: "P",
    tanggalLahir: "2006-12-30",
    umur: 18,
    tinggiBadan: 145,
    beratBadan: 35,
    imt: 16.6,
    statusGizi: "Gizi Buruk",
    statusStunting: "Severely Stunted",
    alamat: "Jl. Ahmad Yani No. 89, Karawang",
    namaOrtu: "Susilo Kartika",
    kontakOrtu: "081678901234",
    alergi: "Susu",
    foto: "👩",
    riwayatPengukuran: [
      { bulan: "Jan", tinggi: 144, berat: 34 },
      { bulan: "Feb", tinggi: 144.5, berat: 34.2 },
      { bulan: "Mar", tinggi: 144.5, berat: 34.5 },
      { bulan: "Apr", tinggi: 145, berat: 34.8 },
      { bulan: "Mei", tinggi: 145, berat: 35 },
    ],
    absensiMakan: 85,
    registered: false,
    status: "belum",
    waktuAbsen: null,
    statusMakan: null,
  },
]

function load(): Siswa[] {
  if (typeof window === "undefined") return seedData
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return seedData
    return JSON.parse(raw)
  } catch {
    return seedData
  }
}

function save(data: Siswa[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

export function useSiswa() {
  const [siswa, setSiswa] = useState<Siswa[]>(seedData)

  useEffect(() => {
    setSiswa(load())
  }, [])

  const persist = useCallback((updater: (prev: Siswa[]) => Siswa[]) => {
    setSiswa((prev) => {
      const next = updater(prev)
      save(next)
      return next
    })
  }, [])

  const addSiswa = useCallback(
    (data: Omit<Siswa, "id"> & Partial<Pick<Siswa, "id">>) => {
      persist((prev) => {
        const nextId = Math.max(0, ...prev.map((s) => s.id)) + 1
        const imt =
          data.tinggiBadan && data.beratBadan
            ? Number((data.beratBadan / Math.pow(data.tinggiBadan / 100, 2)).toFixed(1))
            : data.imt
        return [
          ...prev,
          {
            ...data,
            id: data.id || nextId,
            imt,
            registered: data.registered ?? true,
            status: data.status ?? "belum",
            waktuAbsen: data.waktuAbsen ?? null,
            statusMakan: data.statusMakan ?? null,
          } as Siswa,
        ]
      })
    },
    [persist],
  )

  const updateSiswa = useCallback(
    (id: number, patch: Partial<Siswa>) => {
      persist((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                ...patch,
                imt:
                  patch.tinggiBadan && (patch.beratBadan ?? s.beratBadan)
                    ? Number(
                        (
                          (patch.beratBadan ?? s.beratBadan!) / Math.pow((patch.tinggiBadan ?? s.tinggiBadan!) / 100, 2)
                        ).toFixed(1),
                      )
                    : s.imt,
              }
            : s,
        ),
      )
    },
    [persist],
  )

  const markRegistered = useCallback(
    (id: number, value = true) => {
      updateSiswa(id, { registered: value })
    },
    [updateSiswa],
  )

  const markAbsen = useCallback(
    (id: number, action: "habis" | "dibungkus" | "tidak") => {
      updateSiswa(id, {
        status: "sudah",
        waktuAbsen: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        statusMakan: action === "tidak" ? null : action,
      })
    },
    [updateSiswa],
  )

  return {
    siswa,
    setSiswa, // jika perlu
    addSiswa,
    updateSiswa,
    markRegistered,
    markAbsen,
  }
}
