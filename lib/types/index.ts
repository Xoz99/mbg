// User & Auth Types
export interface User {
    email: string;
    role: 'sekolah' | 'kementerian' | 'dapur';
    nama: string;
  }
  
  // Sekolah Types
  export interface Student {
    id: string;
    nama: string;
    kelas: string;
    nis: string;
    statusMakan: 'sudah' | 'belum';
    waktuAbsensi?: string;
    fotoUrl?: string;
  }
  
  export interface Kelas {
    id: string;
    nama: string;
    jumlahSiswa: number;
    waliKelas: string;
    tingkat: number;
  }
  
  export interface MenuFeedback {
    id: string;
    menuId: string;
    menuNama: string;
    rating: number;
    komentar: string;
    tanggal: string;
    siswaId: string;
    siswaNama: string;
  }
  
  export interface JadwalDistribusi {
    id: string;
    tanggal: string;
    waktu: string;
    menu: string;
    kelas: string[];
    status: 'scheduled' | 'ongoing' | 'completed';
  }
  
  // Kementerian Types
  export interface Dapur {
    id: string;
    nama: string;
    lokasi: { lat: number; lng: number };
    alamat: string;
    provinsi: string;
    kapasitas: number;
    sekolahDilayani: number;
    status: 'aktif' | 'nonaktif' | 'maintenance';
    rating: number;
  }
  
  export interface Sekolah {
    id: string;
    nama: string;
    lokasi: { lat: number; lng: number };
    alamat: string;
    jumlahSiswa: number;
    dapurId: string;
    dapurNama: string;
    provinsi: string;
    kota: string;
    status: 'aktif' | 'nonaktif';
  }
  
  export interface Kendaraan {
    id: string;
    platNomor: string;
    driverId: string;
    driverNama: string;
    lokasi: { lat: number; lng: number };
    tujuanSekolah: string;
    status: 'standby' | 'on_route' | 'delivered';
    estimasiTiba?: string;
  }
  
  export interface LaporanKonsumsi {
    provinsi: string;
    totalSiswa: number;
    siswaHadir: number;
    persentaseKehadiran: number;
    totalPorsi: number;
    sisaPorsi: number;
    efisiensi: number;
  }
  
  export interface Anggaran {
    id: string;
    provinsi: string;
    totalAnggaran: number;
    terpakai: number;
    persentase: number;
    bulan: string;
    tahun: number;
  }
  
  // Dapur Types
  export interface Menu {
    id: string;
    nama: string;
    kategori: 'pagi' | 'siang' | 'sore';
    deskripsi: string;
    bahan: string[];
    kalori: number;
    protein: number;
    karbohidrat: number;
    lemak: number;
    harga: number;
    fotoUrl?: string;
    rating: number;
    jumlahFeedback: number;
  }
  
  export interface StokBahan {
    id: string;
    namaBahan: string;
    kategori: 'sayuran' | 'protein' | 'karbohidrat' | 'bumbu' | 'lainnya';
    jumlah: number;
    satuan: string;
    hargaSatuan: number;
    expired: string;
    supplier: string;
    status: 'aman' | 'menipis' | 'habis' | 'expired';
  }
  
  export interface Driver {
    id: string;
    nama: string;
    platNomor: string;
    nomorTelepon: string;
    fotoUrl?: string;
    status: 'available' | 'on_duty' | 'off';
    totalDelivery: number;
    rating: number;
  }
  
  export interface RiwayatDriver {
    id: string;
    driverId: string;
    driverNama: string;
    tanggal: string;
    sekolahTujuan: string;
    waktuBerangkat: string;
    waktuSampai?: string;
    status: 'completed' | 'cancelled' | 'ongoing';
    jumlahPorsi: number;
  }
  
  export interface Baki {
    id: string;
    kodeBaki: string;
    sekolahId?: string;
    sekolahNama?: string;
    status: 'di_dapur' | 'di_sekolah' | 'transit' | 'rusak' | 'hilang';
    tanggalKeluar?: string;
    tanggalKembali?: string;
  }
  
  export interface RencanaProduksi {
    id: string;
    tanggal: string;
    menu: string;
    targetPorsi: number;
    sekolahTujuan: string[];
    bahanDibutuhkan: { nama: string; jumlah: number; satuan: string }[];
    status: 'planned' | 'in_production' | 'completed';
    pic: string;
  }
  
  // Chart Data Types
  export interface ChartData {
    name: string;
    value: number;
    [key: string]: string | number;
  }