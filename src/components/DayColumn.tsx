import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Box, ScrollArea, Stack, Text } from '@mantine/core'

import type { DayColumn as DayColumnType, LogseqTask } from '../types'
import { TaskCard } from './TaskCard'

interface DayColumnProps {
  column: DayColumnType
  tasks: LogseqTask[]
  onSelectTask: (task: LogseqTask) => void
}

export const DayColumn = ({ column, tasks, onSelectTask }: DayColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.dateKey,
    data: { type: 'day', date: column.date },
  })

  return (
    <Box
      ref={setNodeRef}
      style={{
        flex: '1 0 0',
        minWidth: 140,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--mantine-color-default-border)',
        backgroundColor: isOver
          ? 'var(--mantine-color-blue-light)'
          : column.isToday
            ? 'var(--mantine-color-default-hover)'
            : 'transparent',
        transition: 'background-color 0.15s ease',
        scrollSnapAlign: 'start',
      }}
    >
      <Box
        p={12}
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
          textAlign: 'center',
        }}
      >
        <Text
          size="xs"
          fw={600}
          c={column.isToday ? 'blue' : column.isPast ? 'dimmed' : undefined}
          tt="uppercase"
          style={{ letterSpacing: 1 }}
        >
          {column.dayName}
        </Text>
        <Text
          size="xl"
          fw={column.isToday ? 700 : 500}
          c={column.isToday ? 'blue' : column.isPast ? 'dimmed' : undefined}
        >
          {column.dayNumber}
        </Text>
      </Box>

      <ScrollArea style={{ flex: 1 }} p={8}>
        <SortableContext
          items={tasks.map((t) => t.uuid)}
          strategy={verticalListSortingStrategy}
        >
          <Stack gap={0}>
            {tasks.map((task) => (
              <TaskCard key={task.uuid} task={task} onSelect={onSelectTask} />
            ))}
          </Stack>
        </SortableContext>
      </ScrollArea>
    </Box>
  )
}
