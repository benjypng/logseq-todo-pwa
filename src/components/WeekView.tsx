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
import {
  ActionIcon,
  Box,
  Center,
  Drawer,
  Loader,
  SegmentedControl,
  Stack,
} from '@mantine/core'
import { IconChevronUp } from '@tabler/icons-react'
import { useState } from 'react'

import { useDoingTodo, useScheduledTodo, useTodos, useWeekView } from '../hooks'
import type { LogseqTask } from '../types'
import { DayColumn } from './DayColumn'
import { ErrandsList } from './ErrandsList'
import { ExpenseList } from './ExpenseList'
import { TaskCard } from './TaskCard'
import { WeekNavigation } from './WeekNavigation'

interface WeekViewProps {
  onSelectTask: (task: LogseqTask) => void
  daysToShow?: number
}

export const WeekView = ({ onSelectTask, daysToShow = 7 }: WeekViewProps) => {
  const { data: todos, isLoading } = useTodos()
  const scheduledMutation = useScheduledTodo()
  const doingMutation = useDoingTodo()
  const [bottomSection, setBottomSection] = useState<string>('errands')
  const [drawerOpened, setDrawerOpened] = useState(false)

  const {
    columns,
    weekLabel,
    weekOffset,
    errands,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    getTasksForDate,
  } = useWeekView(todos, daysToShow)

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

    if (!dropData || !dropData.date) return

    scheduledMutation.mutate({
      uuid: taskId,
      date: dropData.date,
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
            position: 'relative',
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

          <ActionIcon
            size="xl"
            radius="xl"
            variant="filled"
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={() => setDrawerOpened(true)}
          >
            <IconChevronUp size={24} />
          </ActionIcon>
        </Box>
      </Stack>

      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="bottom"
        size="400px"
        withCloseButton={false}
        styles={{
          body: { padding: 0, height: '100%' },
          content: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <Stack gap={0} h="100%">
          {/* Drag handle indicator */}
          <Center py="sm">
            <Box
              w={40}
              h={4}
              style={{
                backgroundColor: 'var(--mantine-color-default-border)',
                borderRadius: 2,
              }}
            />
          </Center>

          <Box px="md" pb="sm">
            <SegmentedControl
              value={bottomSection}
              onChange={setBottomSection}
              fullWidth
              data={[
                { label: 'Errands', value: 'errands' },
                { label: 'Expenses', value: 'expenses' },
              ]}
            />
          </Box>

          <Box style={{ flex: 1, overflow: 'hidden' }}>
            {bottomSection === 'errands' ? (
              <ErrandsList tasks={errands} onSelectTask={handleSelectTask} />
            ) : (
              <ExpenseList />
            )}
          </Box>
        </Stack>
      </Drawer>

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
