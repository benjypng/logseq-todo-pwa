import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Box, ScrollArea, Text } from '@mantine/core'

import type { LogseqTask } from '../types'
import { TaskCard } from './TaskCard'

interface ErrandsListProps {
  tasks: LogseqTask[]
  onSelectTask: (task: LogseqTask) => void
}

export const ErrandsList = ({ tasks, onSelectTask }: ErrandsListProps) => {
  return (
    <ScrollArea h="100%" p="md" pt={0}>
      <SortableContext
        items={tasks.map((t) => t.uuid)}
        strategy={verticalListSortingStrategy}
      >
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks.map((task) => (
            <Box key={task.uuid}>
              <TaskCard task={task} onSelect={onSelectTask} />
            </Box>
          ))}
          {tasks.length === 0 && (
            <Text size="sm" c="dimmed" fs="italic">
              No errands
            </Text>
          )}
        </Box>
      </SortableContext>
    </ScrollArea>
  )
}
