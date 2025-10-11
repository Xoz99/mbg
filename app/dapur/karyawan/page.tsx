// app/dapur/karyawan/page.tsx
'use client';

import { useState, useMemo } from 'react';
import DapurLayout from '@/components/layout/DapurLayout';
import { 
  Users, Plus, Edit, Trash2, Eye, X, Search, Filter,
  Phone, Mail, MapPin, Calendar, Clock, CheckCircle,
  AlertCircle, User, Briefcase, Award, TrendingUp,
  Download, Upload, UserCheck, UserX, Activity,
  ShieldCheck, Key, Image as ImageIcon
} from 'lucide-react';

const DataKaryawan = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [showAddModal, setShowAddModal] = useState(false);

  // Employee data - sesuai dengan ERD User yang role KITCHEN_PIC atau staff dapur
  const employees = useMemo(() => [
    {
      id: 'EMP-001',
      userId: 'user-001',
      name: 'Siti Aminah',
      email: 'siti.aminah@dapur-karawang.com',
      phone: '081234567890',
      role: 'KITCHEN_PIC',
      position: 'PIC Dapur',
      status: 'ACTIVE',
      joinDate: '2023-01-15',
      address: 'Jl. Veteran No. 123, Karawang',
      photoUrl: '/photos/staff1.jpg',
      shift: 'PAGI', // PAGI, SIANG, MALAM
      attendance: {
        present: 24,
        absent: 1,
        late: 2,
        percentage: 96
      },
      performance: {
        rating: 4.8,
        totalTasks: 156,
        completedTasks: 152,
        efficiency: 97
      },
      certifications: ['Food Safety', 'Kitchen Management', 'HACCP'],
      emergencyContact: {
        name: 'Ahmad Aminah',
        relation: 'Suami',
        phone: '081234567891'
      },
      notes: 'PIC Dapur dengan performa sangat baik'
    },
    {
      id: 'EMP-002',
      userId: 'user-002',
      name: 'Hendra Kusuma',
      email: 'hendra.k@dapur-karawang.com',
      phone: '081234567892',
      role: 'STAFF',
      position: 'Chef Tim A',
      status: 'ACTIVE',
      joinDate: '2023-03-20',
      address: 'Jl. Merdeka No. 45, Karawang',
      photoUrl: '/photos/staff2.jpg',
      shift: 'PAGI',
      attendance: {
        present: 25,
        absent: 0,
        late: 0,
        percentage: 100
      },
      performance: {
        rating: 4.9,
        totalTasks: 89,
        completedTasks: 89,
        efficiency: 100
      },
      certifications: ['Professional Chef', 'Food Safety'],
      emergencyContact: {
        name: 'Siti Kusuma',
        relation: 'Istri',
        phone: '081234567893'
      },
      notes: 'Chef terbaik, sangat berpengalaman'
    },
    {
      id: 'EMP-003',
      userId: 'user-003',
      name: 'Ahmad Dedi',
      email: 'ahmad.dedi@dapur-karawang.com',
      phone: '081234567894',
      role: 'STAFF',
      position: 'Chef Tim B',
      status: 'ACTIVE',
      joinDate: '2023-02-10',
      address: 'Jl. Pahlawan No. 67, Karawang',
      photoUrl: null,
      shift: 'PAGI',
      attendance: {
        present: 23,
        absent: 2,
        late: 3,
        percentage: 92
      },
      performance: {
        rating: 4.5,
        totalTasks: 78,
        completedTasks: 75,
        efficiency: 96
      },
      certifications: ['Food Safety'],
      emergencyContact: {
        name: 'Rina Ahmad',
        relation: 'Istri',
        phone: '081234567895'
      },
      notes: 'Performa baik, perlu peningkatan kedisiplinan'
    },
    {
      id: 'EMP-004',
      userId: 'user-004',
      name: 'Fatimah Zahra',
      email: 'fatimah.z@dapur-karawang.com',
      phone: '081234567896',
      role: 'STAFF',
      position: 'Chef Tim C',
      status: 'ACTIVE',
      joinDate: '2023-04-05',
      address: 'Jl. Proklamasi No. 89, Karawang',
      photoUrl: '/photos/staff4.jpg',
      shift: 'SIANG',
      attendance: {
        present: 24,
        absent: 1,
        late: 1,
        percentage: 96
      },
      performance: {
        rating: 4.7,
        totalTasks: 82,
        completedTasks: 80,
        efficiency: 98
      },
      certifications: ['Food Safety', 'Culinary Arts'],
      emergencyContact: {
        name: 'Umar Zahra',
        relation: 'Suami',
        phone: '081234567897'
      },
      notes: 'Chef berbakat dengan kreativitas tinggi'
    },
    {
      id: 'EMP-005',
      userId: 'user-005',
      name: 'Bambang Sutrisno',
      email: 'bambang.s@dapur-karawang.com',
      phone: '081234567898',
      role: 'STAFF',
      position: 'Staff Packing',
      status: 'ACTIVE',
      joinDate: '2023-05-12',
      address: 'Jl. Kartini No. 34, Karawang',
      photoUrl: null,
      shift: 'PAGI',
      attendance: {
        present: 25,
        absent: 0,
        late: 1,
        percentage: 100
      },
      performance: {
        rating: 4.6,
        totalTasks: 145,
        completedTasks: 142,
        efficiency: 98
      },
      certifications: ['Food Handling'],
      emergencyContact: {
        name: 'Dewi Sutrisno',
        relation: 'Istri',
        phone: '081234567899'
      },
      notes: 'Cepat dan teliti dalam packing'
    },
    {
      id: 'EMP-006',
      userId: 'user-006',
      name: 'Rina Wulandari',
      email: 'rina.w@dapur-karawang.com',
      phone: '081234567800',
      role: 'STAFF',
      position: 'Staff Packing',
      status: 'ACTIVE',
      joinDate: '2023-06-20',
      address: 'Jl. Sudirman No. 56, Karawang',
      photoUrl: '/photos/staff6.jpg',
      shift: 'PAGI',
      attendance: {
        present: 24,
        absent: 1,
        late: 2,
        percentage: 96
      },
      performance: {
        rating: 4.4,
        totalTasks: 138,
        completedTasks: 133,
        efficiency: 96
      },
      certifications: ['Food Handling'],
      emergencyContact: {
        name: 'Budi Wulandari',
        relation: 'Suami',
        phone: '081234567801'
      },
      notes: 'Pekerja keras dan bertanggung jawab'
    },
    {
      id: 'EMP-007',
      userId: 'user-007',
      name: 'Joko Widodo',
      email: 'joko.w@dapur-karawang.com',
      phone: '081234567802',
      role: 'STAFF',
      position: 'Staff Gudang',
      status: 'ON_LEAVE',
      joinDate: '2023-01-25',
      address: 'Jl. Diponegoro No. 78, Karawang',
      photoUrl: null,
      shift: 'PAGI',
      attendance: {
        present: 22,
        absent: 3,
        late: 1,
        percentage: 88
      },
      performance: {
        rating: 4.3,
        totalTasks: 95,
        completedTasks: 90,
        efficiency: 95
      },
      certifications: ['Warehouse Management'],
      emergencyContact: {
        name: 'Sri Widodo',
        relation: 'Istri',
        phone: '081234567803'
      },
      notes: 'Sedang cuti 3 hari (13-15 Jan)'
    },
    {
      id: 'EMP-008',
      userId: 'user-008',
      name: 'Eko Prasetyo',
      email: 'eko.p@dapur-karawang.com',
      phone: '081234567804',
      role: 'STAFF',
      position: 'Staff Gudang',
      status: 'ACTIVE',
      joinDate: '2023-07-10',
      address: 'Jl. Ahmad Yani No. 90, Karawang',
      photoUrl: null,
      shift: 'SIANG',
      attendance: {
        present: 23,
        absent: 2,
        late: 2,
        percentage: 92
      },
      performance: {
        rating: 4.2,
        totalTasks: 88,
        completedTasks: 84,
        efficiency: 95
      },
      certifications: ['Forklift Operator'],
      emergencyContact: {
        name: 'Ani Prasetyo',
        relation: 'Istri',
        phone: '081234567805'
      },
      notes: 'Terampil dalam mengelola stok'
    },
    {
      id: 'EMP-009',
      userId: 'user-009',
      name: 'Lina Marlina',
      email: 'lina.m@dapur-karawang.com',
      phone: '081234567806',
      role: 'STAFF',
      position: 'Staff Kebersihan',
      status: 'ACTIVE',
      joinDate: '2023-08-01',
      address: 'Jl. Veteran No. 12, Karawang',
      photoUrl: '/photos/staff9.jpg',
      shift: 'PAGI',
      attendance: {
        present: 25,
        absent: 0,
        late: 0,
        percentage: 100
      },
      performance: {
        rating: 4.8,
        totalTasks: 112,
        completedTasks: 112,
        efficiency: 100
      },
      certifications: ['Hygiene & Sanitation'],
      emergencyContact: {
        name: 'Rudi Marlina',
        relation: 'Suami',
        phone: '081234567807'
      },
      notes: 'Sangat rajin dan teliti dalam kebersihan'
    },
    {
      id: 'EMP-010',
      userId: 'user-010',
      name: 'Arief Rachman',
      email: 'arief.r@dapur-karawang.com',
      phone: '081234567808',
      role: 'STAFF',
      position: 'Staff QC',
      status: 'INACTIVE',
      joinDate: '2023-02-15',
      address: 'Jl. Merdeka No. 34, Karawang',
      photoUrl: null,
      shift: 'PAGI',
      attendance: {
        present: 15,
        absent: 10,
        late: 5,
        percentage: 60
      },
      performance: {
        rating: 3.2,
        totalTasks: 45,
        completedTasks: 38,
        efficiency: 84
      },
      certifications: [],
      emergencyContact: {
        name: 'Maya Rachman',
        relation: 'Istri',
        phone: '081234567809'
      },
      notes: 'Tidak aktif sejak Oktober 2024, performa menurun'
    }
  ], []);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (searchQuery) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRole !== 'semua') {
      filtered = filtered.filter(emp => emp.role === filterRole);
    }

    if (filterStatus !== 'semua') {
      filtered = filtered.filter(emp => emp.status === filterStatus);
    }

    return filtered;
  }, [employees, searchQuery, filterRole, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'ACTIVE').length;
    const onLeave = employees.filter(e => e.status === 'ON_LEAVE').length;
    const inactive = employees.filter(e => e.status === 'INACTIVE').length;
    const avgAttendance = Math.round(employees.reduce((acc, e) => acc + e.attendance.percentage, 0) / total);
    const avgPerformance = (employees.reduce((acc, e) => acc + e.performance.rating, 0) / total).toFixed(1);
    
    return { total, active, onLeave, inactive, avgAttendance, avgPerformance };
  }, [employees]);

  const getStatusConfig = (status: string) => {
    const configs = {
      ACTIVE: {
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: UserCheck,
        text: 'Aktif',
        dotColor: 'bg-green-500'
      },
      ON_LEAVE: {
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Clock,
        text: 'Cuti',
        dotColor: 'bg-yellow-500'
      },
      INACTIVE: {
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: UserX,
        text: 'Tidak Aktif',
        dotColor: 'bg-red-500'
      }
    };
    return configs[status as keyof typeof configs] || configs.ACTIVE;
  };

  const getRoleLabel = (role: string) => {
    return role === 'KITCHEN_PIC' ? 'PIC Dapur' : 'Staff';
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className={`p-2.5 rounded-lg ${color} mb-3 w-fit`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );

  return (
    <DapurLayout currentPage="karyawan">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Data Karyawan</h1>
            <p className="text-gray-600">Kelola data dan performa staff dapur</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-sm">
              <Download className="w-5 h-5" />
              Export
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Tambah Karyawan
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <StatCard 
          title="TOTAL KARYAWAN" 
          value={stats.total} 
          subtitle="staff dapur" 
          icon={Users} 
          color="bg-blue-600"
        />
        <StatCard 
          title="AKTIF" 
          value={stats.active} 
          subtitle="sedang bertugas"
          icon={UserCheck} 
          color="bg-green-600"
        />
        <StatCard 
          title="CUTI" 
          value={stats.onLeave} 
          subtitle="sedang off" 
          icon={Clock} 
          color="bg-yellow-600"
        />
        <StatCard 
          title="TIDAK AKTIF" 
          value={stats.inactive} 
          subtitle="resign/suspend" 
          icon={UserX} 
          color="bg-red-600"
        />
        <StatCard 
          title="AVG KEHADIRAN" 
          value={`${stats.avgAttendance}%`}
          subtitle="rata-rata" 
          icon={Calendar} 
          color="bg-purple-600"
        />
        <StatCard 
          title="AVG PERFORMA" 
          value={stats.avgPerformance}
          subtitle="rating 0-5" 
          icon={Award} 
          color="bg-orange-600"
        />
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau posisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D0B064] focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Role:</span>
            {['semua', 'KITCHEN_PIC', 'STAFF'].map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterRole === role
                    ? 'bg-[#D0B064] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role === 'semua' ? 'Semua' : getRoleLabel(role)}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Status:</span>
            {['semua', 'ACTIVE', 'ON_LEAVE', 'INACTIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-[#D0B064] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'semua' ? 'Semua' : 
                 status === 'ACTIVE' ? 'Aktif' : 
                 status === 'ON_LEAVE' ? 'Cuti' : 'Non-Aktif'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Karyawan</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Posisi</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Shift</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Kehadiran</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Performa</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((emp) => {
                const statusConfig = getStatusConfig(emp.status);
                
                return (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                          {emp.photoUrl ? (
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          ) : (
                            <User className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{emp.position}</p>
                      <p className="text-xs text-gray-500">{getRoleLabel(emp.role)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                        <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                        {statusConfig.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                        {emp.shift}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{emp.attendance.percentage}%</p>
                        <p className="text-xs text-gray-500">{emp.attendance.present}/{emp.attendance.present + emp.attendance.absent} hari</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-sm font-bold text-gray-900">{emp.performance.rating}</span>
                            <span className="text-yellow-500">★</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-yellow-500 h-1.5 rounded-full"
                              style={{ width: `${(emp.performance.rating / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="p-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedEmployee.name}</h3>
                  <p className="text-sm text-white/80">{selectedEmployee.position}</p>
                  {(() => {
                    const statusConfig = getStatusConfig(selectedEmployee.status);
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/30 mt-2">
                        <statusConfig.icon className="w-4 h-4" />
                        {statusConfig.text}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600">Telepon</p>
                      <p className="font-semibold text-gray-900">{selectedEmployee.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-purple-600">Email</p>
                      <p className="font-semibold text-gray-900 text-sm">{selectedEmployee.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
                  <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-green-600 mb-1">Kehadiran</p>
                  <p className="text-2xl font-bold text-green-900">{selectedEmployee.attendance.percentage}%</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 text-center">
                  <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-xs text-yellow-600 mb-1">Rating</p>
                  <p className="text-2xl font-bold text-yellow-900">{selectedEmployee.performance.rating}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                  <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-blue-600 mb-1">Efisiensi</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedEmployee.performance.efficiency}%</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 text-center">
                  <Briefcase className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs text-purple-600 mb-1">Tasks</p>
                  <p className="text-2xl font-bold text-purple-900">{selectedEmployee.performance.completedTasks}/{selectedEmployee.performance.totalTasks}</p>
                </div>
              </div>

              {/* Attendance Details */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Detail Kehadiran</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-xs font-semibold text-green-600">HADIR</span>
                    </div>
                    <p className="text-3xl font-bold text-green-900">{selectedEmployee.attendance.present}</p>
                    <p className="text-xs text-green-600 mt-1">hari</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <X className="w-5 h-5 text-red-600" />
                      <span className="text-xs font-semibold text-red-600">ABSEN</span>
                    </div>
                    <p className="text-3xl font-bold text-red-900">{selectedEmployee.attendance.absent}</p>
                    <p className="text-xs text-red-600 mt-1">hari</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-xs font-semibold text-yellow-600">TELAT</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-900">{selectedEmployee.attendance.late}</p>
                    <p className="text-xs text-yellow-600 mt-1">kali</p>
                  </div>
                </div>
              </div>

              {/* Employment Info */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Informasi Kepegawaian</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Role</p>
                        <p className="font-semibold text-gray-900">{getRoleLabel(selectedEmployee.role)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Shift</p>
                        <p className="font-semibold text-gray-900">{selectedEmployee.shift}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Tanggal Bergabung</p>
                        <p className="font-semibold text-gray-900">{selectedEmployee.joinDate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Alamat</p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedEmployee.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              {selectedEmployee.certifications.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-gray-600" />
                    Sertifikasi
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.certifications.map((cert: string, idx: number) => (
                      <span key={idx} className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-semibold">
                        🎓 {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border border-red-200">
                <h4 className="font-bold text-red-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Kontak Darurat
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-red-600 mb-1">Nama</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.emergencyContact.name}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-red-600 mb-1">Hubungan</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.emergencyContact.relation}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-red-600 mb-1">Telepon</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.emergencyContact.phone}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedEmployee.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-yellow-700 font-semibold mb-1 uppercase tracking-wide">Catatan</p>
                      <p className="text-sm text-yellow-900">{selectedEmployee.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-all font-bold shadow-md hover:shadow-lg">
                  <Edit className="w-5 h-5" />
                  Edit Data
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-md hover:shadow-lg">
                  <Calendar className="w-5 h-5" />
                  Lihat Jadwal
                </button>
                <button className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DapurLayout>
  );
};

export default DataKaryawan;