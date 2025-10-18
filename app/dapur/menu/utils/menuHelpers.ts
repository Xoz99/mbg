// app/dapur/menu/utils/menuHelpers.ts
import { CheckCircle2, Clock, Edit, X } from "lucide-react"

export function getDayName(dayNumber: number): string {
  const days = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  return days[dayNumber] || ""
}

export function getDayNumberFromDate(iso: string): number {
  if (!iso) return 1
  const d = new Date(iso)
  const js = d.getDay()
  return js === 0 ? 6 : js
}

export function getStatusConfig(status: string) {
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

export function getDifficultyConfig(difficulty: string) {
  const configs = {
    EASY: { color: "bg-green-100 text-green-700", text: "Mudah", icon: "✓" },
    MEDIUM: { color: "bg-yellow-100 text-yellow-700", text: "Sedang", icon: "◐" },
    HARD: { color: "bg-red-100 text-red-700", text: "Sulit", icon: "⚠" },
  }
  return configs[difficulty as keyof typeof configs] || configs.MEDIUM
}