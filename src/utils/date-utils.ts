import { format, isBefore, startOfDay } from 'date-fns'

/**
 * Parse Logseq journal day format (YYYYMMDD number) to Date
 */
export const parseJournalDay = (journalDay: number | null): Date | null => {
  if (!journalDay || journalDay <= 0) return null
  const str = String(journalDay)
  if (str.length !== 8) return null
  const year = Number.parseInt(str.slice(0, 4), 10)
  const month = Number.parseInt(str.slice(4, 6), 10) - 1
  const day = Number.parseInt(str.slice(6, 8), 10)
  return new Date(year, month, day)
}

/**
 * Format a Date to YYYY-MM-DD for use as a key
 */
export const formatDateKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Compute effective date with auto-rollover for overdue tasks
 * Uses scheduled date if available, otherwise journal date
 * If the date is in the past, it rolls over to today
 */
export const computeEffectiveDate = (
  journalDate: Date | null,
  scheduledDate: Date | null,
): Date | null => {
  const baseDate = scheduledDate ?? journalDate
  if (!baseDate) return null

  const today = startOfDay(new Date())
  if (isBefore(startOfDay(baseDate), today)) {
    return today
  }
  return startOfDay(baseDate)
}

/**
 * Format a date for Logseq page name (e.g., "Jan 2nd, 2025")
 */
export const formatLogseqDate = (date: Date): string => {
  return format(date, 'MMM do, yyyy')
}
