// app/dapur/menu/page.tsx
"use client"

import { useState, useMemo } from "react"
import DapurLayout from "@/components/layout/DapurLayout"
import {
  Calendar,
  ChefHat,
  Plus,
  Edit,
  Copy,
  Eye,
  Check,
  X,
  Clock,
  Users,
  Flame,
  Apple,
  Drumstick,
  Wheat,
  Salad,
  Download,
  Upload,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
  ImageIcon,
  ShoppingBag,
  Send,
  ShieldAlert,
} from "lucide-react"

// Profil alergi rata-rata per sekolah (mock)
const SCHOOL_PROFILES = [
  {
    id: "school-1",
    name: "SDN Melati 01",
    restrictedAllergens: ["milk", "egg", "peanut", "fish", "seafood", "wheat", "soy"],
    averages: { milk: 8, egg: 12, peanut: 5, seafood: 4, fish: 9, wheat: 6, soy: 4 },
  },
  {
    id: "school-2",
    name: "SMP Harapan 02",
    restrictedAllergens: ["egg", "peanut", "seafood", "fish"],
    averages: { milk: 5, egg: 10, peanut: 7, seafood: 6, fish: 8, wheat: 3, soy: 3 },
  },
  {
    id: "school-3",
    name: "SMA Nusantara 03",
    restrictedAllergens: ["peanut", "seafood", "wheat"],
    averages: { milk: 4, egg: 6, peanut: 9, seafood: 7, fish: 5, wheat: 8, soy: 2 },
  },
] as const

type AllergenKey = "milk" | "egg" | "peanut" | "seafood" | "fish" | "wheat" | "soy"

const ALLERGEN_LABEL: Record<AllergenKey, string> = {
  milk: "Susu/Dairy",
  egg: "Telur",
  peanut: "Kacang",
  seafood: "Seafood/Kerang",
  fish: "Ikan",
  wheat: "Gandum/Gluten",
  soy: "Kedelai",
}

// keyword sederhana untuk mendeteksi bahan pemicu alergi dari nama/notes
const ALLERGEN_KEYWORDS: Record<AllergenKey, string[]> = {
  milk: ["susu", "dairy", "milk", "keju", "butter", "mentega", "yogurt", "santan"], // santan bukan dairy, namun sering jadi pengganti — tetap tampilkan info
  egg: ["telur", "egg"],
  peanut: ["kacang", "peanut", "tanah"],
  seafood: ["udang", "shrimp", "cumi", "squid", "kerang", "seafood", "kepiting", "crab"],
  fish: ["ikan", "tuna", "salmon", "bandeng", "nila", "gurame", "tongkol", "teri", "sarden", "lele"],
  wheat: ["gandum", "wheat", "tepung terigu", "gluten", "terigu", "roti", "mie"],
  soy: ["kedelai", "soy", "kecap", "tauco", "tempe", "tahu"],
}

function detectAllergensInText(text: string): AllergenKey[] {
  const lower = text.toLowerCase()
  const found = new Set<AllergenKey>()
  ;(Object.keys(ALLERGEN_KEYWORDS) as AllergenKey[]).forEach((key) => {
    if (ALLERGEN_KEYWORDS[key].some((kw) => lower.includes(kw))) {
      found.add(key)
    }
  })
  return Array.from(found)
}

function validateMenuAgainstSchool(menu: any, school: (typeof SCHOOL_PROFILES)[number]) {
  const issues: { ingredientId: string; ingredientName: string; allergens: AllergenKey[] }[] = []
  menu.ingredients.forEach((ing: any) => {
    const base = `${ing.name ?? ""} ${ing.notes ?? ""}`.trim()
    const matched = detectAllergensInText(base)
    const restricted = matched.filter((m) => school.restrictedAllergens.includes(m))
    if (restricted.length) {
      issues.push({ ingredientId: ing.id, ingredientName: ing.name, allergens: restricted })
    }
  })
  return { issues, hasRisk: issues.length > 0 }
}

const MenuPlanning = () => {
  const [selectedWeek, setSelectedWeek] = useState("week-2")
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [selectedMenu, setSelectedMenu] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedSchoolId, setSelectedSchoolId] = useState("school-1")

  const selectedSchool = useMemo(
    () => SCHOOL_PROFILES.find((s) => s.id === selectedSchoolId) || SCHOOL_PROFILES[0],
    [selectedSchoolId],
  )

  const weeklyMenus = useMemo(
    () => [
      {
        id: "WM-2025-W2",
        weekNumber: 2,
        year: 2025,
        startDate: "2025-01-13",
        endDate: "2025-01-18",
        kitchenId: "kitchen-karawang-001",
        createdBy: { id: "user-001", name: "Bu Siti Aminah" },
        status: "APPROVED",
        approvedBy: "Manager Pusat",
        approvedAt: "2025-01-10",
        notes: "Menu minggu ke-2 Januari 2025",
        dailyMenus: [
          {
            id: "DM-2025-01-13",
            date: "2025-01-13",
            dayNumber: 1,
            menuName: "Nasi Putih + Rendang Sapi",
            description: "Rendang Sapi + Sayur Asem + Kerupuk + Pisang",
            cookingStartAt: "06:00",
            cookingEndAt: "08:30",
            samplePhotoUrl: "/photos/sample-rendang.jpg",
            documentedBy: { id: "user-001", name: "Bu Siti" },
            nutritionInfo: {
              kalori: 680,
              protein: 28,
              lemak: 22,
              karbohidrat: 85,
            },
            estimatedCost: 12500,
            expectedTrays: 5000,
            difficulty: "MEDIUM",
            ingredients: [
              { id: "1", name: "Beras", quantity: "850 kg", photoUrl: "/photos/beras.jpg", notes: "Beras IR64" },
              {
                id: "2",
                name: "Daging Sapi",
                quantity: "120 kg",
                photoUrl: "/photos/daging.jpg",
                notes: "Bagian has dalam",
              },
              {
                id: "3",
                name: "Sayur Asem Mix",
                quantity: "200 kg",
                photoUrl: null,
                notes: "Kacang panjang, labu siam, jagung",
              },
              { id: "4", name: "Bumbu Rendang", quantity: "35 kg", photoUrl: null, notes: "Bumbu halus" },
              { id: "5", name: "Kerupuk", quantity: "50 kg", photoUrl: null, notes: "Kerupuk udang" },
              { id: "6", name: "Pisang", quantity: "150 kg", photoUrl: null, notes: "Pisang ambon" },
            ],
            notes: "Daging harus empuk minimal 2 jam. Rendang jangan terlalu kering.",
          },
          {
            id: "DM-2025-01-14",
            date: "2025-01-14",
            dayNumber: 2,
            menuName: "Nasi Goreng Spesial",
            description: "Nasi Goreng + Ayam Suwir + Acar + Kerupuk + Jeruk",
            cookingStartAt: "06:00",
            cookingEndAt: "08:00",
            samplePhotoUrl: null,
            documentedBy: null,
            nutritionInfo: {
              kalori: 650,
              protein: 25,
              lemak: 20,
              karbohidrat: 82,
            },
            estimatedCost: 11000,
            expectedTrays: 5000,
            difficulty: "EASY",
            ingredients: [
              { id: "1", name: "Beras", quantity: "850 kg", photoUrl: null, notes: "Untuk nasi" },
              { id: "2", name: "Ayam", quantity: "180 kg", photoUrl: null, notes: "Ayam kampung" },
              { id: "3", name: "Bumbu Nasi Goreng", quantity: "45 kg", photoUrl: null, notes: "Bumbu lengkap" },
              { id: "4", name: "Acar", quantity: "80 kg", photoUrl: null, notes: "Timun, wortel, cabe" },
              { id: "5", name: "Kerupuk", quantity: "45 kg", photoUrl: null, notes: "Kerupuk putih" },
              { id: "6", name: "Jeruk", quantity: "200 kg", photoUrl: null, notes: "Jeruk manis" },
            ],
            notes: "Bumbu harus merata. Nasi jangan terlalu lembek.",
          },
          {
            id: "DM-2025-01-15",
            date: "2025-01-15",
            dayNumber: 3,
            menuName: "Nasi Kuning + Ayam Goreng",
            description: "Nasi Kuning + Ayam Goreng + Sambal Goreng Ati + Kerupuk + Pisang",
            cookingStartAt: "06:00",
            cookingEndAt: "08:30",
            samplePhotoUrl: null,
            documentedBy: null,
            nutritionInfo: {
              kalori: 720,
              protein: 30,
              lemak: 24,
              karbohidrat: 88,
            },
            estimatedCost: 13000,
            expectedTrays: 5000,
            difficulty: "MEDIUM",
            ingredients: [
              { id: "1", name: "Beras", quantity: "850 kg", photoUrl: null, notes: "Untuk nasi kuning" },
              { id: "2", name: "Ayam", quantity: "200 kg", photoUrl: null, notes: "Ayam broiler" },
              { id: "3", name: "Kunyit", quantity: "15 kg", photoUrl: null, notes: "Kunyit segar" },
              { id: "4", name: "Ati Ampela", quantity: "60 kg", photoUrl: null, notes: "Fresh" },
              { id: "5", name: "Kerupuk", quantity: "50 kg", photoUrl: null, notes: "Kerupuk udang" },
              { id: "6", name: "Pisang", quantity: "150 kg", photoUrl: null, notes: "Pisang raja" },
            ],
            notes: "Nasi kuning harus pulen dan wangi santan.",
          },
          {
            id: "DM-2025-01-16",
            date: "2025-01-16",
            dayNumber: 4,
            menuName: "Nasi Putih + Ikan Bakar",
            description: "Nasi Putih + Ikan Bakar + Sambal Terasi + Lalapan + Apel",
            cookingStartAt: "06:00",
            cookingEndAt: "08:30",
            samplePhotoUrl: null,
            documentedBy: null,
            nutritionInfo: {
              kalori: 640,
              protein: 26,
              lemak: 18,
              karbohidrat: 80,
            },
            estimatedCost: 11500,
            expectedTrays: 5000,
            difficulty: "MEDIUM",
            ingredients: [
              { id: "1", name: "Beras", quantity: "850 kg", photoUrl: null, notes: "Beras pulen" },
              { id: "2", name: "Ikan Bandeng", quantity: "250 kg", photoUrl: null, notes: "Ikan segar" },
              { id: "3", name: "Sambal Terasi", quantity: "40 kg", photoUrl: null, notes: "Sambal siap pakai" },
              { id: "4", name: "Sayur Lalapan", quantity: "120 kg", photoUrl: null, notes: "Kol, timun, kemangi" },
              { id: "5", name: "Apel", quantity: "180 kg", photoUrl: null, notes: "Apel fuji" },
            ],
            notes: "Ikan harus matang sempurna. Sambal jangan terlalu pedas.",
          },
          {
            id: "DM-2025-01-17",
            date: "2025-01-17",
            dayNumber: 5, // Jumat
            menuName: "Nasi + Soto Ayam",
            description: "Nasi Putih + Soto Ayam Kuning + Emping + Sambal + Pisang",
            cookingStartAt: "06:00",
            cookingEndAt: "08:00",
            samplePhotoUrl: null,
            documentedBy: null,
            nutritionInfo: {
              kalori: 630,
              protein: 24,
              lemak: 19,
              karbohidrat: 78,
            },
            estimatedCost: 10500,
            expectedTrays: 5000,
            difficulty: "EASY",
            ingredients: [
              { id: "1", name: "Beras", quantity: "850 kg", photoUrl: null, notes: "Beras putih" },
              { id: "2", name: "Ayam", quantity: "160 kg", photoUrl: null, notes: "Ayam kampung" },
              { id: "3", name: "Bumbu Soto", quantity: "50 kg", photoUrl: null, notes: "Bumbu lengkap" },
              { id: "4", name: "Emping", quantity: "45 kg", photoUrl: null, notes: "Emping melinjo" },
              { id: "5", name: "Pisang", quantity: "150 kg", photoUrl: null, notes: "Pisang kepok" },
            ],
            notes: "Menu ringan untuk Jumat. Kuah jangan terlalu berminyak.",
          },
          {
            id: "DM-2025-01-18",
            date: "2025-01-18",
            dayNumber: 6, // Sabtu
            menuName: "Nasi Putih + Ayam Geprek",
            description: "Nasi Putih + Ayam Geprek + Tempe Orek + Sayur + Jeruk",
            cookingStartAt: "06:00",
            cookingEndAt: "08:00",
            samplePhotoUrl: null,
            documentedBy: null,
            nutritionInfo: {
              kalori: 660,
              protein: 27,
              lemak: 21,
              karbohidrat: 80,
            },
            estimatedCost: 11200,
            expectedTrays: 4500,
            difficulty: "EASY",
            ingredients: [
              { id: "1", name: "Beras", quantity: "765 kg", photoUrl: null, notes: "Target lebih rendah sabtu" },
              { id: "2", name: "Ayam", quantity: "170 kg", photoUrl: null, notes: "Ayam broiler" },
              { id: "3", name: "Tempe", quantity: "80 kg", photoUrl: null, notes: "Tempe segar" },
              { id: "4", name: "Sayur Sop", quantity: "150 kg", photoUrl: null, notes: "Sayur mix" },
              { id: "5", name: "Jeruk", quantity: "180 kg", photoUrl: null, notes: "Jeruk peras" },
            ],
            notes: "Ayam geprek level sedang. Sambal jangan terlalu pedas untuk anak-anak.",
          },
        ],
      },
    ],
    [],
  )

  const currentWeeklyMenu = weeklyMenus[0] // For now, using first week

  const allergyRiskCount = useMemo(() => {
    return currentWeeklyMenu.dailyMenus.reduce((acc, m) => {
      const result = validateMenuAgainstSchool(m, selectedSchool)
      return acc + (result.hasRisk ? 1 : 0)
    }, 0)
  }, [currentWeeklyMenu, selectedSchool])

  // Stats
  const stats = useMemo(() => {
    const dailyMenus = currentWeeklyMenu.dailyMenus
    const totalTrays = dailyMenus.reduce((acc, m) => acc + m.expectedTrays, 0)
    const totalCost = dailyMenus.reduce((acc, m) => acc + m.estimatedCost * m.expectedTrays, 0)
    const avgKalori = Math.round(dailyMenus.reduce((acc, m) => acc + m.nutritionInfo.kalori, 0) / dailyMenus.length)
    const withPhotos = dailyMenus.filter((m) => m.samplePhotoUrl).length
    const totalIngredients = dailyMenus.reduce((acc, m) => acc + m.ingredients.length, 0)

    return {
      totalDays: dailyMenus.length,
      totalTrays,
      totalCost,
      avgKalori,
      withPhotos,
      totalIngredients,
      status: currentWeeklyMenu.status,
      allergyRiskCount,
    }
  }, [currentWeeklyMenu])

  const getStatusConfig = (status: string) => {
    const configs = {
      APPROVED: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: CheckCircle2,
        text: "Disetujui",
        dotColor: "bg-green-500",
      },
      PENDING: {
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: Clock,
        text: "Menunggu",
        dotColor: "bg-yellow-500 animate-pulse",
      },
      DRAFT: {
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: Edit,
        text: "Draft",
        dotColor: "bg-gray-500",
      },
      REJECTED: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: X,
        text: "Ditolak",
        dotColor: "bg-red-500",
      },
    }
    return configs[status as keyof typeof configs] || configs.DRAFT
  }

  const getDifficultyConfig = (difficulty: string) => {
    const configs = {
      EASY: { color: "bg-green-100 text-green-700", text: "Mudah", icon: "✓" },
      MEDIUM: { color: "bg-yellow-100 text-yellow-700", text: "Sedang", icon: "◐" },
      HARD: { color: "bg-red-100 text-red-700", text: "Sulit", icon: "⚠" },
    }
    return configs[difficulty as keyof typeof configs] || configs.MEDIUM
  }

  const getDayName = (dayNumber: number) => {
    const days = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    return days[dayNumber] || ""
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  )

  return (
    <DapurLayout currentPage="menu">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Menu Planning</h1>
            <p className="text-gray-600">Kelola menu mingguan dan daily menu dengan ingredients</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-sm">
              <Upload className="w-5 h-5" />
              Import Menu
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-colors font-semibold shadow-sm">
              <Plus className="w-5 h-5" />
              Menu Baru
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Menu Header */}
      <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] rounded-2xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6" />
              <h2 className="text-2xl font-bold">{currentWeeklyMenu.id}</h2>
              {(() => {
                const statusConfig = getStatusConfig(currentWeeklyMenu.status)
                return (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/30">
                    <statusConfig.icon className="w-4 h-4" />
                    {statusConfig.text}
                  </span>
                )
              })()}
            </div>
            <p className="text-white/80 text-sm mb-1">
              Minggu {currentWeeklyMenu.weekNumber} • {currentWeeklyMenu.year}
            </p>
            <p className="text-white/70 text-sm">
              {currentWeeklyMenu.startDate} s/d {currentWeeklyMenu.endDate}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70 mb-1">Dibuat oleh</p>
            <p className="font-semibold">{currentWeeklyMenu.createdBy.name}</p>
            {currentWeeklyMenu.status === "APPROVED" && (
              <>
                <p className="text-xs text-white/70 mt-2">Disetujui oleh</p>
                <p className="font-semibold text-green-300">{currentWeeklyMenu.approvedBy}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          title="TOTAL HARI"
          value={stats.totalDays}
          subtitle="menu (Sen-Sab)"
          icon={Calendar}
          color="bg-blue-600"
        />
        <StatCard
          title="TOTAL TARGET"
          value={stats.totalTrays.toLocaleString()}
          subtitle="trays minggu ini"
          icon={ChefHat}
          color="bg-green-600"
        />
        <StatCard
          title="EST. BIAYA"
          value={`Rp ${(stats.totalCost / 1000000).toFixed(1)}jt`}
          subtitle="total mingguan"
          icon={TrendingUp}
          color="bg-purple-600"
        />
        <StatCard
          title="RATA-RATA KALORI"
          value={`${stats.avgKalori}`}
          subtitle="kcal per porsi"
          icon={Flame}
          color="bg-orange-600"
        />
        <StatCard
          title="TOTAL BAHAN"
          value={stats.totalIngredients}
          subtitle="jenis ingredients"
          icon={ShoppingBag}
          color="bg-indigo-600"
        />
        <StatCard
          title="RISIKO ALERGI"
          value={allergyRiskCount}
          subtitle="hari berisiko (minggu ini)"
          icon={AlertCircle}
          color="bg-red-600"
        />
      </div>

      {/* Filter & View Toggle */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Periode:</span>
              <div className="flex gap-2">
                {[
                  { id: "week-1", label: "Minggu 1" },
                  { id: "week-2", label: "Minggu 2" },
                  { id: "week-3", label: "Minggu 3" },
                  { id: "week-4", label: "Minggu 4" },
                ].map((period) => (
                  <button
                    key={period.id}
                    onClick={() => setSelectedWeek(period.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedWeek === period.id
                        ? "bg-[#D0B064] text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sekolah */}
            <div className="h-6 w-px bg-gray-200 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Sekolah:</span>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {SCHOOL_PROFILES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ringkasan alergi sekolah */}
            <div className="flex items-center gap-2 flex-wrap">
              {(selectedSchool.restrictedAllergens as AllergenKey[]).map((al) => (
                <span
                  key={al}
                  className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold border border-red-200"
                >
                  {ALLERGEN_LABEL[al]} • {selectedSchool.averages[al]}%
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "calendar" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Menu Calendar/Grid View */}
      {viewMode === "calendar" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentWeeklyMenu.dailyMenus.map((menu) => {
            const difficultyConfig = getDifficultyConfig(menu.difficulty)
            const validation = validateMenuAgainstSchool(menu, selectedSchool)
            const hasRisk = validation.hasRisk

            return (
              <div
                key={menu.id}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all group
                  ${hasRisk ? "border-red-200 hover:border-red-300 hover:shadow-md" : "border-gray-100 hover:shadow-lg hover:border-[#D0B064]"}
                `}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <div>
                        <p className="font-bold text-lg">{getDayName(menu.dayNumber)}</p>
                        <p className="text-xs text-white/80">{menu.date}</p>
                      </div>
                    </div>
                    {menu.samplePhotoUrl && (
                      <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Photo
                      </span>
                    )}
                    {hasRisk && (
                      <span className="px-2 py-1 bg-red-100/20 rounded-full text-xs font-bold flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-red-700" />
                        Risiko Alergi
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  {/* Menu Name */}
                  <h3 className="font-bold text-gray-900 text-base mb-2 leading-tight min-h-[48px]">{menu.menuName}</h3>
                  <p className="text-xs text-gray-600 mb-3">{menu.description}</p>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyConfig.color}`}>
                      {difficultyConfig.icon} {difficultyConfig.text}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {menu.ingredients.length} bahan
                    </span>

                    {hasRisk ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Risiko Alergi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        Aman
                      </span>
                    )}
                  </div>

                  {/* Nutrition Info */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-orange-50 rounded-lg p-2 border border-orange-100 text-center">
                      <Flame className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                      <p className="text-xs text-orange-600 font-medium">{menu.nutritionInfo.kalori} kcal</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 text-center">
                      <Drumstick className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-blue-600 font-medium">{menu.nutritionInfo.protein}g</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 border border-green-100 text-center">
                      <Wheat className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-green-600 font-medium">{menu.nutritionInfo.karbohidrat}g</p>
                    </div>
                  </div>

                  {/* Info Detail */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-semibold text-gray-900">{menu.expectedTrays.toLocaleString()} trays</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Biaya/tray:</span>
                      <span className="font-semibold text-gray-900">Rp {menu.estimatedCost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Waktu masak:</span>
                      <span className="font-semibold text-gray-900">
                        {menu.cookingStartAt} - {menu.cookingEndAt}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedMenu(menu)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors text-sm font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      Detail
                    </button>
                    <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Hari/Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Menu</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Tingkat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Bahan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Biaya/Tray
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentWeeklyMenu.dailyMenus.map((menu) => {
                  const difficultyConfig = getDifficultyConfig(menu.difficulty)
                  const validation = validateMenuAgainstSchool(menu, selectedSchool)
                  const hasRisk = validation.hasRisk

                  return (
                    <tr key={menu.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900">{getDayName(menu.dayNumber)}</p>
                          <p className="text-xs text-gray-500">{menu.date}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm font-semibold text-gray-900">{menu.menuName}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-gray-500">🔥 {menu.nutritionInfo.kalori} kcal</span>
                            <span className="text-xs text-gray-500">🍗 {menu.nutritionInfo.protein}g</span>
                            {hasRisk ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 text-xs font-semibold">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Risiko Alergi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                <Check className="w-3.5 h-3.5" />
                                Aman
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyConfig.color}`}>
                          {difficultyConfig.icon} {difficultyConfig.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{menu.expectedTrays.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">trays</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                          <ShoppingBag className="w-3 h-3" />
                          {menu.ingredients.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">Rp {menu.estimatedCost.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          Total: Rp {((menu.estimatedCost * menu.expectedTrays) / 1000000).toFixed(1)}jt
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMenu(menu)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Detail
                          </button>
                          <button className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6" />
                  <div>
                    <p className="text-sm text-white/80">{selectedMenu.date}</p>
                    <h3 className="text-xl font-bold">{getDayName(selectedMenu.dayNumber)}</h3>
                  </div>
                  {selectedMenu.samplePhotoUrl && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      Sample Photo
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-semibold">{selectedMenu.menuName}</h4>
                <p className="text-sm text-white/70 mt-1">{selectedMenu.description}</p>
              </div>
              <button
                onClick={() => setSelectedMenu(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Nutrition Grid */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                  Informasi Gizi per Porsi
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 text-center">
                    <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-900">{selectedMenu.nutritionInfo.kalori}</p>
                    <p className="text-xs text-orange-600 mt-1">Kalori (kcal)</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                    <Drumstick className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{selectedMenu.nutritionInfo.protein}g</p>
                    <p className="text-xs text-blue-600 mt-1">Protein</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 text-center">
                    <Apple className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-900">{selectedMenu.nutritionInfo.lemak}g</p>
                    <p className="text-xs text-yellow-600 mt-1">Lemak</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
                    <Wheat className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-900">{selectedMenu.nutritionInfo.karbohidrat}g</p>
                    <p className="text-xs text-green-600 mt-1">Karbohidrat</p>
                  </div>
                </div>
              </div>

              {/* Production Info */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Info Produksi</h4>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <ChefHat className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Target Trays</p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {selectedMenu.expectedTrays.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Waktu Memasak</p>
                      <p className="font-semibold text-gray-900">
                        {selectedMenu.cookingStartAt} - {selectedMenu.cookingEndAt}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Info Biaya</h4>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-xs text-purple-600">Biaya per Tray</p>
                      <p className="font-bold text-purple-900 text-lg">
                        Rp {selectedMenu.estimatedCost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-xs text-purple-600">Total Biaya</p>
                      <p className="font-bold text-purple-900 text-lg">
                        Rp {(selectedMenu.estimatedCost * selectedMenu.expectedTrays).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3"></div>
              </div>

              {/* Validasi Alergi */}
              {(() => {
                const validation = validateMenuAgainstSchool(selectedMenu, selectedSchool)
                return (
                  <div
                    className={`${validation.hasRisk ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"} border rounded-xl p-4`}
                  >
                    <div className="flex items-start gap-3">
                      {validation.hasRisk ? (
                        <AlertCircle className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Check className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`text-xs font-semibold mb-1 uppercase tracking-wide ${validation.hasRisk ? "text-red-700" : "text-emerald-700"}`}
                        >
                          {validation.hasRisk ? "Validasi Alergi: Risiko Ditemukan" : "Validasi Alergi: Aman"}
                        </p>
                        {validation.hasRisk ? (
                          <ul className="list-disc pl-5 text-sm text-red-900 space-y-1">
                            {validation.issues.map((i) => (
                              <li key={i.ingredientId}>
                                {i.ingredientName}: {i.allergens.map((a) => ALLERGEN_LABEL[a]).join(", ")}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-emerald-900">
                            Tidak ada bahan yang terindikasi alergen untuk profil sekolah terpilih.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Bahan-Bahan / MenuIngredient */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                  Kebutuhan Bahan Baku ({selectedMenu.ingredients.length} items)
                </h4>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedMenu.ingredients.map((ingredient: any) => (
                      <div
                        key={ingredient.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {ingredient.photoUrl ? (
                              <ImageIcon className="w-6 h-6 text-blue-600" />
                            ) : (
                              <Salad className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{ingredient.name}</p>
                            {ingredient.notes && <p className="text-xs text-gray-500 mt-0.5">{ingredient.notes}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-900">{ingredient.quantity}</p>
                          {ingredient.photoUrl && (
                            <span className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                              <ImageIcon className="w-3 h-3" />
                              Photo
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Catatan */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-yellow-700 font-semibold mb-1 uppercase tracking-wide">Catatan Chef</p>
                    <p className="text-sm text-yellow-900">{selectedMenu.notes}</p>
                  </div>
                </div>
              </div>

              {/* Dokumentasi */}
              {selectedMenu.documentedBy && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Didokumentasikan oleh</p>
                      <p className="font-semibold text-gray-900">{selectedMenu.documentedBy.name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Alergi Info */}
              {selectedSchool && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-red-700 font-semibold mb-1 uppercase tracking-wide">Risiko Alergi</p>
                      <p className="text-sm text-red-900">Perhatikan alergi sekolah {selectedSchool.name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-all font-bold shadow-md hover:shadow-lg">
                  <Send className="w-5 h-5" />
                  Submit untuk Approval
                </button>
                <button className="px-5 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all font-bold">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold">
                  <Copy className="w-5 h-5" />
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
  )
}

export default MenuPlanning
