import { useCallback, useState } from 'react'

import type { DayColumn, LogseqTask, TasksByDate } from '../types'
import {
  formatWeekLabel,
  generateWeekColumns,
  getDatelessTasks,
  groupTasksByDate,
} from '../utils/date-utils'

export const useWeekView = (tasks: LogseqTask[] | undefined) => {
  const [weekOffset, setWeekOffset] = useState(0)

  const columns = generateWeekColumns(weekOffset)
  const weekLabel = formatWeekLabel(columns)

  const tasksByDate: TasksByDate = tasks ? groupTasksByDate(tasks) : {}
  const somedayTasks: LogseqTask[] = tasks ? getDatelessTasks(tasks) : []

  const goToPreviousWeek = useCallback(() => {
    setWeekOffset((prev) => prev - 1)
  }, [])

  const goToNextWeek = useCallback(() => {
    setWeekOffset((prev) => prev + 1)
  }, [])

  const goToToday = useCallback(() => {
    setWeekOffset(0)
  }, [])

  const getTasksForDate = useCallback(
    (dateKey: string): LogseqTask[] => {
      return tasksByDate[dateKey] ?? []
    },
    [tasksByDate],
  )

  return {
    columns,
    weekLabel,
    weekOffset,
    tasksByDate,
    somedayTasks,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    getTasksForDate,
  }
}
