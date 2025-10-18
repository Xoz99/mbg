// app/dapur/menu/components/WeeklyMenuHeader.tsx
import { Calendar } from "lucide-react"
import { WeeklyMenu } from "../types/menu"
import { SchoolProfile } from "../constants/schoolProfiles"
import { getStatusConfig } from "../utils/menuHelpers"

interface WeeklyMenuHeaderProps {
  weeklyMenu: WeeklyMenu
  selectedSchool: SchoolProfile
}

export function WeeklyMenuHeader({ weeklyMenu, selectedSchool }: WeeklyMenuHeaderProps) {
  const statusConfig = getStatusConfig(weeklyMenu.status)
  
  return (
    <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] rounded-2xl p-6 text-white mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6" />
            <h2 className="text-2xl font-bold">{weeklyMenu.id}</h2>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/30">
              <statusConfig.icon className="w-4 h-4" />
              {statusConfig.text}
            </span>
          </div>
          <p className="text-white/80 text-sm mb-1">
            Minggu {weeklyMenu.weekNumber} • {weeklyMenu.year}
          </p>
          <p className="text-white/70 text-sm">
            {weeklyMenu.startDate} s/d {weeklyMenu.endDate}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/70 mb-1">Sekolah</p>
          <p className="font-semibold">{selectedSchool.name}</p>
        </div>
      </div>
    </div>
  )
}