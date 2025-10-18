// app/csr/laporan/page.tsx
'use client';
import { useState, useMemo } from 'react';
import CSRLayout from '@/components/layout/CSRLayout';
import {
  FileText, Download, Calendar, Users, DollarSign, 
  Package, Heart, TrendingUp, Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PDF Generation Function
const generatePDF = async (data: any) => {
  const element = document.createElement('div');
  element.innerHTML = generatePDFTemplate(data);
  element.style.position = 'absolute';
  element.style.left = '-10000px';
  element.style.width = '210mm';
  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    const fileName = `Laporan-${data.programName}-${data.periode}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(element);
  }
};

const generatePDFTemplate = (data: any): string => {
  return `
    <div style="font-family: 'Arial', sans-serif; padding: 40px; color: #333;">
      <!-- HEADER -->
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1B263A; padding-bottom: 30px;">
        <h1 style="color: #1B263A; font-size: 32px; margin: 0 0 15px 0; font-weight: bold;">LAPORAN PROGRAM CSR</h1>
        <h2 style="color: #D0B064; font-size: 24px; margin: 0 0 20px 0;">PROGRAM MAKAN BERGIZI GRATIS</h2>
        <div style="color: #666; font-size: 14px;">
          <p style="margin: 5px 0;"><strong>Organisasi CSR:</strong> ${data.namaCSR}</p>
          <p style="margin: 5px 0;"><strong>Periode:</strong> ${data.periode}</p>
          <p style="margin: 5px 0;"><strong>Tanggal Laporan:</strong> ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <!-- RINGKASAN DAMPAK PROGRAM -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1B263A; font-size: 18px; border-bottom: 2px solid #D0B064; padding-bottom: 10px; margin-bottom: 20px;">RINGKASAN DAMPAK PROGRAM</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold; width: 50%;">Total Siswa Terbantu</td>
            <td style="padding: 15px; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #10b981;">${data.totalSiswa.toLocaleString()} siswa</td>
          </tr>
          <tr>
            <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold;">Total Meals Diberikan</td>
            <td style="padding: 15px; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #3b82f6;">${data.totalMeals.toLocaleString()} porsi</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold;">Total Sekolah Didukung</td>
            <td style="padding: 15px; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #8b5cf6;">${data.totalSekolah} sekolah</td>
          </tr>
          <tr>
            <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold;">Budget Digunakan</td>
            <td style="padding: 15px; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #f59e0b;">Rp ${(data.budgetDigunakan / 1000000).toFixed(0)}M</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold;">Rata-rata Kepuasan Sekolah</td>
            <td style="padding: 15px; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #ec4899;">${data.kepuasan}%</td>
          </tr>
        </table>
      </div>

      <!-- DETAIL SEKOLAH YANG DIDUKUNG -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1B263A; font-size: 18px; border-bottom: 2px solid #D0B064; padding-bottom: 10px; margin-bottom: 20px;">DETAIL SEKOLAH YANG DIDUKUNG</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #1B263A; color: white;">
              <th style="padding: 12px; border: 1px solid #1B263A; text-align: left;">Nama Sekolah</th>
              <th style="padding: 12px; border: 1px solid #1B263A; text-align: center;">Siswa</th>
              <th style="padding: 12px; border: 1px solid #1B263A; text-align: center;">Meals</th>
              <th style="padding: 12px; border: 1px solid #1B263A; text-align: center;">Kepuasan</th>
            </tr>
          </thead>
          <tbody>
            ${data.sekolah.map((s: any, idx: number) => `
              <tr style="background: ${idx % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="padding: 12px; border: 1px solid #ddd;">${s.nama}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${s.siswa}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${s.meals.toLocaleString()}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #10b981; font-weight: bold;">${s.kepuasan}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- CAPAIAN PROGRAM -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1B263A; font-size: 18px; border-bottom: 2px solid #D0B064; padding-bottom: 10px; margin-bottom: 15px;">CAPAIAN & HASIL PROGRAM</h3>
        <ul style="color: #333; line-height: 1.8; margin-left: 20px;">
          <li>✓ Program telah berjalan selama ${data.lamanya} dan berhasil melayani ${data.totalSiswa.toLocaleString()} siswa</li>
          <li>✓ Memberikan ${data.totalMeals.toLocaleString()} porsi makanan bergizi yang seimbang</li>
          <li>✓ Mendukung ${data.totalSekolah} sekolah di berbagai wilayah</li>
          <li>✓ Meningkatkan kesehatan dan daya konsentrasi siswa di kelas</li>
          <li>✓ Rata-rata kepuasan dari sekolah mencapai ${data.kepuasan}%</li>
          <li>✓ Efisiensi budget: setiap siswa mendapat meal berkualitas dengan biaya optimal</li>
        </ul>
      </div>

      <!-- KESIMPULAN -->
      <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #1B263A; margin-top: 0;">KESIMPULAN</h4>
        <p style="margin: 10px 0; line-height: 1.6;">
          Program Makan Bergizi Gratis telah terbukti memberikan dampak positif yang signifikan terhadap kesejahteraan dan prestasi akademik siswa. 
          Dukungan dari ${data.namaCSR} melalui program ini telah membantu ribuan siswa mendapatkan akses ke makanan bergizi yang sebelumnya tidak terjangkau. 
          Program ini akan terus dilanjutkan dan dikembangkan untuk menjangkau lebih banyak siswa.
        </p>
      </div>

      <!-- FOOTER -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666;">
        <p style="margin: 5px 0;">Sistem Monitoring Beasiswa Makan Gratis</p>
        <p style="margin: 5px 0;">Laporan ini dibuat secara otomatis dan sah untuk disebarkan kepada stakeholder</p>
      </div>
    </div>
  `;
};

const CSRLaporanPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Data laporan yang tersedia
  const laporanList = useMemo(() => [
    {
      id: 1,
      namaPeriode: 'Laporan Bulan Desember 2024',
      periode: 'Desember 2024',
      namaCSR: 'PT Maju Bersama',
      totalSiswa: 3980,
      totalMeals: 125680,
      totalSekolah: 5,
      budgetDigunakan: 35000000,
      kepuasan: 94,
      lamanya: '18 bulan',
      sekolah: [
        { nama: 'SD Negeri Karawang 1', siswa: 850, meals: 25500, kepuasan: 96 },
        { nama: 'SD Negeri Karawang 2', siswa: 720, meals: 21600, kepuasan: 95 },
        { nama: 'SMP Negeri Bekasi', siswa: 1200, meals: 36000, kepuasan: 93 },
        { nama: 'SD Negeri Depok 1', siswa: 650, meals: 19500, kepuasan: 94 },
        { nama: 'SD Negeri Bogor Tengah', siswa: 560, meals: 16800, kepuasan: 92 }
      ]
    },
    {
      id: 2,
      namaPeriode: 'Laporan Kuartal IV 2024',
      periode: 'Q4 2024',
      namaCSR: 'PT Maju Bersama',
      totalSiswa: 3980,
      totalMeals: 370000,
      totalSekolah: 5,
      budgetDigunakan: 105000000,
      kepuasan: 93,
      lamanya: '18 bulan',
      sekolah: [
        { nama: 'SD Negeri Karawang 1', siswa: 850, meals: 76500, kepuasan: 95 },
        { nama: 'SD Negeri Karawang 2', siswa: 720, meals: 64800, kepuasan: 94 },
        { nama: 'SMP Negeri Bekasi', siswa: 1200, meals: 108000, kepuasan: 92 },
        { nama: 'SD Negeri Depok 1', siswa: 650, meals: 58500, kepuasan: 93 },
        { nama: 'SD Negeri Bogor Tengah', siswa: 560, meals: 50400, kepuasan: 91 }
      ]
    },
    {
      id: 3,
      namaPeriode: 'Laporan Semester I 2024',
      periode: 'Januari - Juni 2024',
      namaCSR: 'PT Maju Bersama',
      totalSiswa: 3980,
      totalMeals: 550000,
      totalSekolah: 5,
      budgetDigunakan: 165000000,
      kepuasan: 91,
      lamanya: '18 bulan',
      sekolah: [
        { nama: 'SD Negeri Karawang 1', siswa: 850, meals: 153000, kepuasan: 94 },
        { nama: 'SD Negeri Karawang 2', siswa: 720, meals: 129600, kepuasan: 93 },
        { nama: 'SMP Negeri Bekasi', siswa: 1200, meals: 216000, kepuasan: 91 },
        { nama: 'SD Negeri Depok 1', siswa: 650, meals: 117000, kepuasan: 92 },
        { nama: 'SD Negeri Bogor Tengah', siswa: 560, meals: 100800, kepuasan: 89 }
      ]
    }
  ], []);

  const filteredLaporan = useMemo(() => {
    if (!searchQuery) return laporanList;
    return laporanList.filter(l =>
      l.namaPeriode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.periode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [laporanList, searchQuery]);

  const handleDownload = async (laporan: any) => {
    try {
      await generatePDF(laporan);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silahkan coba lagi.');
    }
  };

  return (
    <CSRLayout currentPage="laporan">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Laporan Program</h2>
          <p className="text-gray-600">Laporan OUTPUT Program Makan Bergizi Gratis - Unduh dalam format PDF</p>
        </div>

        {/* Search -->
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari laporan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D0B064]"
            />
          </div>
        </div>

        {/* Laporan List */}
        <div className="space-y-4">
          {filteredLaporan.map((laporan) => (
            <div key={laporan.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{laporan.namaPeriode}</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">
                        <Users className="w-3 h-3 inline mr-1" />
                        Siswa Terbantu
                      </p>
                      <p className="text-lg font-bold text-green-700">{laporan.totalSiswa.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">
                        <Package className="w-3 h-3 inline mr-1" />
                        Meals Diberikan
                      </p>
                      <p className="text-lg font-bold text-blue-700">{(laporan.totalMeals/1000).toFixed(0)}K</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">
                        <Heart className="w-3 h-3 inline mr-1" />
                        Sekolah Didukung
                      </p>
                      <p className="text-lg font-bold text-purple-700">{laporan.totalSekolah}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">
                        <DollarSign className="w-3 h-3 inline mr-1" />
                        Budget Digunakan
                      </p>
                      <p className="text-lg font-bold text-orange-700">Rp {(laporan.budgetDigunakan/1000000).toFixed(0)}M</p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                      <p className="text-xs text-gray-600 mb-1">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        Kepuasan
                      </p>
                      <p className="text-lg font-bold text-pink-700">{laporan.kepuasan}%</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{laporan.periode}</span>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(laporan)}
                  className="px-6 py-3 bg-[#D0B064] text-white rounded-lg hover:bg-[#C9A355] font-semibold flex items-center gap-2 transition-all flex-shrink-0"
                >
                  <Download className="w-5 h-5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLaporan.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Tidak ada laporan yang sesuai dengan pencarian</p>
          </div>
        )}
      </div>
    </CSRLayout>
  );
};

export default CSRLaporanPage;