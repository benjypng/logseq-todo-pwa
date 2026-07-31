import { differenceInCalendarDays, isSameDay, startOfDay } from 'date-fns'

import type { TaskType } from '../types'

export interface CompletionRecord {
  uuid: string
  text: string
  taskType: TaskType
  whenLabel: string
  wasToday: boolean
  completedAt: number
}

export const COMPLETIONS_STORAGE_KEY = 'candy-completions-v1'
const MAX_AGE_DAYS = 366

export function pruneCompletions(
  records: CompletionRecord[],
  now: Date,
): CompletionRecord[] {
  return records.filter(
    (r) =>
      differenceInCalendarDays(now, new Date(r.completedAt)) <= MAX_AGE_DAYS,
  )
}

export function completionsOnDay(
  records: CompletionRecord[],
  day: Date,
): CompletionRecord[] {
  return records.filter((r) => isSameDay(new Date(r.completedAt), day))
}

export function addCompletion(
  records: CompletionRecord[],
  record: CompletionRecord,
): CompletionRecord[] {
  return [...records.filter((r) => r.uuid !== record.uuid), record]
}

export function removeCompletion(
  records: CompletionRecord[],
  uuid: string,
): CompletionRecord[] {
  return records.filter((r) => r.uuid !== uuid)
}

export function streakDays(records: CompletionRecord[], now: Date): number {
  const days = new Set(
    records.map((r) => startOfDay(new Date(r.completedAt)).getTime()),
  )
  const cursor = startOfDay(now)
  if (!days.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(cursor.getTime())) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function weekDots(records: CompletionRecord[], now: Date): boolean[] {
  const today = startOfDay(now)
  const mondayOffset = (today.getDay() + 6) % 7
  const dots: boolean[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(today)
    day.setDate(today.getDate() - mondayOffset + i)
    dots.push(completionsOnDay(records, day).length > 0)
  }
  return dots
}

export function loadCompletions(
  storage: Pick<Storage, 'getItem'> = localStorage,
): CompletionRecord[] {
  try {
    const raw = storage.getItem(COMPLETIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is CompletionRecord =>
        !!r &&
        typeof r.uuid === 'string' &&
        typeof r.text === 'string' &&
        typeof r.completedAt === 'number',
    )
  } catch {
    return []
  }
}

export function saveCompletions(
  records: CompletionRecord[],
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(COMPLETIONS_STORAGE_KEY, JSON.stringify(records))
  } catch {
    return
  }
}
