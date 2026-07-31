import { isSameDay, isSameWeek, startOfDay } from 'date-fns'

export function isToday(date: Date | null): boolean {
  if (!date) return false
  return isSameDay(date, startOfDay(new Date()))
}

export function formatScheduledDate(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const ddd = days[date.getDay()]
  return `${yyyy}-${mm}-${dd} ${ddd}`
}

const MONTHS_SHORT = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]

function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}

export function formatAnnadoDate(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${ordinal(date.getDate())}, ${date.getFullYear()}`
}

export function dueLabel(
  scheduledDate: Date | null,
  deadline: Date | null,
  now: Date = new Date(),
): string {
  const date = scheduledDate ?? deadline
  if (!date) return 'no date'
  if (isSameDay(date, now)) return 'today'
  if (startOfDay(date).getTime() < startOfDay(now).getTime()) return 'overdue'
  if (isSameWeek(date, now, { weekStartsOn: 1 })) return 'this week'
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`
}
