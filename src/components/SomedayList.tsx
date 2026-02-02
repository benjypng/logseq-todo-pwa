import { useDroppable } from '@dnd-kit/core'
import {
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable'
import { Box, Group, ScrollArea, Text } from '@mantine/core'

import type { LogseqTask } from '../types'
import { TaskCard } from './TaskCard'

interface SomedayListProps {
  tasks: LogseqTask[]
  onSelectTask: (task: LogseqTask) => void
}

export const SomedayList = ({ tasks, onSelectTask }: SomedayListProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'someday',
    data: { type: 'someday', date: null },
  })

  return (
    <Box
      ref={setNodeRef}
      style={{
        borderTop: '2px solid var(--mantine-color-default-border)',
        backgroundColor: isOver
          ? 'var(--mantine-color-blue-light)'
          : 'transparent',
        transition: 'background-color 0.15s ease',
      }}
    >
      <Box p="md" pb={8}>
        <Text
          fw={600}
          size="sm"
          tt="uppercase"
          c="dimmed"
          style={{ letterSpacing: 1 }}
        >
          Someday
        </Text>
      </Box>

      <ScrollArea h={160} p="md" pt={0}>
        <SortableContext
          items={tasks.map((t) => t.uuid)}
          strategy={horizontalListSortingStrategy}
        >
          <Group gap={12} wrap="wrap">
            {tasks.map((task) => (
              <Box key={task.uuid} w={200}>
                <TaskCard task={task} onSelect={onSelectTask} />
              </Box>
            ))}
            {tasks.length === 0 && (
              <Text size="sm" c="dimmed" fs="italic">
                Drag tasks here to unschedule them
              </Text>
            )}
          </Group>
        </SortableContext>
      </ScrollArea>
    </Box>
  )
}
