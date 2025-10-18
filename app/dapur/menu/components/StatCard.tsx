// app/dapur/menu/components/StatCard.tsx
import { LucideIcon, TrendingUp } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  color: string
  trend?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  return (
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
}