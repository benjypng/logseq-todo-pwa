import { isSameDay, startOfDay } from 'date-fns'

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
