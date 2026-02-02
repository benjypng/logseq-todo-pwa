import { useCallback, useMemo, useState } from 'react'

import type { LogseqTask, TasksByDate } from '../types'
import {
  formatWeekLabel,
  generateWeekColumns,
  groupTasksByDate,
} from '../utils/date-utils'

export const useWeekView = (tasks: LogseqTask[] | undefined) => {
  const [weekOffset, setWeekOffset] = useState(0)

  const columns = generateWeekColumns(weekOffset)
  const weekLabel = formatWeekLabel(columns)

  // Separate tasks from errands
  const { tasksOnly, errands } = useMemo(() => {
    if (!tasks) return { tasksOnly: [], errands: [] }
    return {
      tasksOnly: tasks.filter((t) => t.taskType === 'task'),
      errands: tasks.filter((t) => t.taskType === 'Errand'),
    }
  }, [tasks])

  // Group only tasks (not errands) by date
  const tasksByDate: TasksByDate = useMemo(
    () => groupTasksByDate(tasksOnly),
    [tasksOnly],
  )

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
    errands,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    getTasksForDate,
  }
}
