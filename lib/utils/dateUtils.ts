/**
 * Centralized timezone-safe date utilities
 *
 * Problem: Using new Date().toISOString() causes timezone offset issues
 * because it converts to UTC. Instead, we use UTC components directly.
 *
 * Example:
 * - Local time: 19 Nov 2025, 23:30 (UTC+7)
 * - toISOString(): "2025-11-19T16:30:00.000Z" (wrong - shows 19 Nov in UTC, not local)
 * - getTodayDateString(): "2025-11-19" (correct - uses local UTC date)
 */

/**
 * Get today's date as YYYY-MM-DD in UTC-consistent format
 * Always uses UTC date components to avoid timezone offset issues
 */
export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse date string in UTC to avoid timezone confusion
 * Handles both YYYY-MM-DD and ISO datetime formats
 */
export function parseDateAsUTC(dateString: string): Date | null {
  if (!dateString) return null

  // If date-only format (YYYY-MM-DD), parse as UTC midnight
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day))
  }

  // Otherwise use standard Date parsing (works with ISO format)
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Extract date string from any date field in UTC-consistent format
 * Handles both YYYY-MM-DD and ISO datetime formats correctly
 */
export function extractDateString(dateField: string | Date): string | null {
  if (!dateField) return null

  // If it's a Date object, convert to string first
  let dateString = typeof dateField === 'string' ? dateField : dateField.toISOString()

  // If it's ISO datetime format (has T), take only the date part
  if (dateString.includes('T')) {
    const dateUTC = parseDateAsUTC(dateString)
    if (!dateUTC) return null
    // Use getUTCDate to ensure we get UTC components
    const year = dateUTC.getUTCFullYear()
    const month = String(dateUTC.getUTCMonth() + 1).padStart(2, '0')
    const day = String(dateUTC.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // If it's already YYYY-MM-DD format, return as-is
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString
  }

  // Fallback: try to parse as regular date and extract
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get date string in YYYY-MM-DD format from any date
 * Shorthand for extractDateString
 */
export function formatDateAsString(dateField: string | Date): string | null {
  return extractDateString(dateField)
}

/**
 * Compare two dates (as strings in YYYY-MM-DD format)
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1Str: string, date2Str: string): number {
  if (date1Str < date2Str) return -1
  if (date1Str > date2Str) return 1
  return 0
}

/**
 * Check if a date is within a range
 */
export function isDateInRange(dateStr: string, minDateStr: string, maxDateStr: string): boolean {
  return dateStr >= minDateStr && dateStr <= maxDateStr
}

/**
 * Get Monday of the current week in YYYY-MM-DD format (UTC-consistent)
 */
export function getMondayOfCurrentWeek(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff))

  const year = monday.getUTCFullYear()
  const month = String(monday.getUTCMonth() + 1).padStart(2, '0')
  const date = String(monday.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

/**
 * Get specific day of week (0=Sunday, 1=Monday, etc)
 */
export function getDayOfWeek(dateStr: string): number {
  const date = parseDateAsUTC(dateStr)
  if (!date) return -1
  return date.getUTCDay()
}

/**
 * Add days to a date string and return as YYYY-MM-DD
 */
export function addDaysToDateString(dateStr: string, days: number): string | null {
  const date = parseDateAsUTC(dateStr)
  if (!date) return null

  date.setUTCDate(date.getUTCDate() + days)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
