import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Box, Center, Loader, Stack } from '@mantine/core'
import { useState } from 'react'

import { useDoingTodo, useMoveTask, useTodos, useWeekView } from '../hooks'
import type { LogseqTask } from '../types'
import { DayColumn } from './DayColumn'
import { SomedayList } from './SomedayList'
import { TaskCard } from './TaskCard'
import { WeekNavigation } from './WeekNavigation'

interface WeekViewProps {
  onSelectTask: (task: LogseqTask) => void
}

export const WeekView = ({ onSelectTask }: WeekViewProps) => {
  const { data: todos, isLoading } = useTodos()
  const moveTaskMutation = useMoveTask()
  const doingMutation = useDoingTodo()

  const {
    columns,
    weekLabel,
    weekOffset,
    somedayTasks,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    getTasksForDate,
  } = useWeekView(todos)

  const [activeTask, setActiveTask] = useState<LogseqTask | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as LogseqTask | undefined
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)

    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const dropData = over.data.current as
      | { type: string; date: Date | null }
      | undefined

    if (!dropData) return

    const newDate = dropData.date

    moveTaskMutation.mutate({
      uuid: taskId,
      date: newDate,
    })
  }

  const handleSelectTask = (task: LogseqTask) => {
    doingMutation.mutate(task.uuid)
    onSelectTask(task)
  }

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader type="dots" />
      </Center>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Stack gap={0} h="100%" style={{ overflow: 'hidden' }}>
        <WeekNavigation
          weekLabel={weekLabel}
          weekOffset={weekOffset}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          onToday={goToToday}
        />

        <Box
          style={{
            flex: 1,
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            borderTop: '1px solid var(--mantine-color-default-border)',
            borderLeft: '1px solid var(--mantine-color-default-border)',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {columns.map((column) => (
            <DayColumn
              key={column.dateKey}
              column={column}
              tasks={getTasksForDate(column.dateKey)}
              onSelectTask={handleSelectTask}
            />
          ))}
        </Box>

        <SomedayList tasks={somedayTasks} onSelectTask={handleSelectTask} />
      </Stack>

      <DragOverlay>
        {activeTask ? (
          <Box w={180}>
            <TaskCard task={activeTask} onSelect={() => undefined} />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
