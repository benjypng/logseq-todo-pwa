import {
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable'
import { Box, Group, ScrollArea, Text } from '@mantine/core'

import type { LogseqTask } from '../types'
import { TaskCard } from './TaskCard'

interface ErrandsListProps {
  tasks: LogseqTask[]
  onSelectTask: (task: LogseqTask) => void
}

export const ErrandsList = ({ tasks, onSelectTask }: ErrandsListProps) => {
  return (
    <ScrollArea h={140} p="md" pt={0}>
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
              No errands
            </Text>
          )}
        </Group>
      </SortableContext>
    </ScrollArea>
  )
}
