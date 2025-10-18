// app/dapur/menu/components/MiniCalendar.tsx
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { useState, useMemo } from "react"
import { DayMenu } from "../types/menu"

interface MiniCalendarProps {
  dailyMenus: DayMenu[]
  onDateClick?: (date: string) => void
}

export function MiniCalendar({ dailyMenus, onDateClick }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Get dates that have menus
  const menuDates = useMemo(() => {
    return new Set(dailyMenus.map(menu => menu.date))
  }, [dailyMenus])

  // Calendar calculation
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  
  // Convert Sunday=0 to Monday=0
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1
  
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

  // Generate calendar grid - 6 weeks x 7 days = 42 cells
  const calendarDays = []
  
  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = adjustedStartDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isPrevMonth: true,
    })
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isPrevMonth: false,
    })
  }
  
  // Next month days to fill the grid (6 weeks)
  const remainingCells = 42 - calendarDays.length
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      isPrevMonth: false,
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const hasMenu = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return menuDates.has(dateStr)
  }

  const getMenuForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dailyMenus.find(menu => menu.date === dateStr)
  }

  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (hasMenu(day) && onDateClick) {
      onDateClick(dateStr)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#D0B064]" />
          <h3 className="font-bold text-gray-900">Kalender Menu</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - Fixed 6 weeks */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, index) => {
          const { day, isCurrentMonth, isPrevMonth } = item
          const today = isCurrentMonth && isToday(day)
          const hasMenuDay = isCurrentMonth && hasMenu(day)
          const menu = isCurrentMonth ? getMenuForDate(day) : null

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day, isCurrentMonth)}
              disabled={!hasMenuDay || !isCurrentMonth}
              className={`
                aspect-square rounded-lg text-sm font-medium transition-all relative flex items-center justify-center
                ${!isCurrentMonth ? "text-gray-300" : ""}
                ${today ? "ring-2 ring-[#D0B064] ring-offset-1" : ""}
                ${hasMenuDay && isCurrentMonth
                  ? "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer shadow-sm hover:shadow-md" 
                  : isCurrentMonth 
                    ? "text-gray-700 hover:bg-gray-50"
                    : "text-gray-300 cursor-default"
                }
              `}
              title={menu ? menu.menuName : undefined}
            >
              <span className="relative z-10">{day}</span>
              {hasMenuDay && isCurrentMonth && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600">Ada Menu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-[#D0B064]" />
          <span className="text-gray-600">Hari Ini</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-2xl font-bold text-blue-900">{menuDates.size}</p>
            <p className="text-xs text-blue-600 mt-0.5">Ada Menu</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-gray-900">{daysInMonth}</p>
            <p className="text-xs text-gray-600 mt-0.5">Hari (bulan ini)</p>
          </div>
        </div>
      </div>
    </div>
  )
}