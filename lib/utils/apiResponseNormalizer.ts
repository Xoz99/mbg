/**
 * API Response Normalizer
 *
 * Problem: Backend returns ISO datetime with UTC+7 offset baked in
 * Example: "2025-11-19T17:00:00.000Z" actually means "2025-11-20 00:00 local time"
 *
 * Solution: Detect and normalize datetime fields before storing to cache
 */

/**
 * Normalize menu/daily data that has timezone offset issues
 * Fixes both tanggal (date) and jamMulai/jamSelesai (time) fields
 */
export function normalizeMenuData(menu: any): any {
  if (!menu) return menu

  const normalized = { ...menu }

  // ✅ Fix tanggal: "2025-11-19T17:00:00.000Z" → "2025-11-19"
  // The ISO datetime has UTC+7 baked in, so we need to extract the local date
  if (menu.tanggal && typeof menu.tanggal === 'string') {
    const normalizedDate = normalizeDateTime(menu.tanggal)
    if (normalizedDate) {
      normalized.tanggal = normalizedDate
    }
  }

  // ✅ Fix time fields if they exist
  // Note: jamMulai/jamSelesai are already stored as local time strings like "08:09"
  // API already returns correct local time values, so no normalization needed

  return normalized
}

/**
 * Normalize array of menu data
 */
export function normalizeMenuArray(menus: any[]): any[] {
  if (!Array.isArray(menus)) return menus
  return menus.map(normalizeMenuData)
}

/**
 * Normalize datetime that has UTC+7 offset baked in
 *
 * Example:
 * Input: "2025-11-19T17:00:00.000Z"
 * The actual local date should be "2025-11-19" but when parsed as UTC,
 * this becomes "2025-11-20" in UTC+7 timezone
 *
 * Output: "2025-11-19" (correct local date)
 */
export function normalizeDateTime(dateTimeString: string): string | null {
  if (!dateTimeString) return null

  // If already in YYYY-MM-DD format, return as-is
  if (dateTimeString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateTimeString
  }

  // If ISO datetime with T17:00:00 pattern (likely UTC+7 offset)
  if (dateTimeString.includes('T17:00:00')) {
    // This is the offset date - extract just the date part
    // "2025-11-19T17:00:00.000Z" → "2025-11-19"
    return dateTimeString.split('T')[0]
  }

  // For other ISO datetime formats, parse and extract date
  try {
    const date = new Date(dateTimeString)
    if (isNaN(date.getTime())) return null

    // Use UTC components to get the date part
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return null
  }
}

/**
 * Normalize entire dashboard data from API response
 */
export function normalizeDashboardData(data: any): any {
  if (!data) return data

  const normalized = { ...data }

  // Normalize todayMenu
  if (data.todayMenu) {
    normalized.todayMenu = normalizeMenuData(data.todayMenu)
  }

  // Normalize menuPlanningData if it has menu items
  if (Array.isArray(data.menuPlanningData)) {
    normalized.menuPlanningData = data.menuPlanningData.map((planning: any) => {
      const normalizedPlanning = { ...planning }
      // Some plannings might have menu data
      if (normalizedPlanning.menus && Array.isArray(normalizedPlanning.menus)) {
        normalizedPlanning.menus = normalizeMenuArray(normalizedPlanning.menus)
      }
      return normalizedPlanning
    })
  }

  return normalized
}

/**
 * Normalize menu-harian array from API
 */
export function normalizeMenuHarianArray(menus: any[]): any[] {
  if (!Array.isArray(menus)) return menus
  return menus.map((menu) => {
    const normalized = { ...menu }
    // Fix tanggal field
    if (menu.tanggal) {
      normalized.tanggal = normalizeDateTime(menu.tanggal) || menu.tanggal
    }
    return normalized
  })
}
