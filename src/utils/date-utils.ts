import {
  addDays,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  startOfWeek,
} from 'date-fns'

import type { DayColumn, LogseqTask, TasksByDate } from '../types'

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
 * Generate an array of 7 DayColumn objects starting from a given week offset
 */
export const generateWeekColumns = (weekOffset: number): DayColumn[] => {
  const today = startOfDay(new Date())
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), {
    weekStartsOn: 1,
  })

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    return {
      date,
      dateKey: formatDateKey(date),
      dayName: format(date, 'EEE').toUpperCase(),
      dayNumber: date.getDate(),
      isToday: isSameDay(date, today),
      isPast: isBefore(date, today),
    }
  })
}

/**
 * Group tasks by their effective date
 */
export const groupTasksByDate = (tasks: LogseqTask[]): TasksByDate => {
  const grouped: TasksByDate = {}

  for (const task of tasks) {
    if (!task.effectiveDate) continue
    const key = formatDateKey(task.effectiveDate)
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(task)
  }

  return grouped
}

/**
 * Format date for display in week navigation
 */
export const formatWeekLabel = (weekColumns: DayColumn[]): string => {
  if (weekColumns.length === 0) return ''
  const firstDay = weekColumns[0]
  return format(firstDay.date, 'MMM d')
}

/**
 * Format a date for Logseq page name (e.g., "Jan 2nd, 2025")
 */
export const formatLogseqDate = (date: Date): string => {
  return format(date, 'MMM do, yyyy')
}
