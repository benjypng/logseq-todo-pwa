import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Box, Group, Text, UnstyledButton } from '@mantine/core'

import type { LogseqTask } from '../types'

interface TaskCardProps {
  task: LogseqTask
  onSelect: (task: LogseqTask) => void
}

const getPriorityColor = (priority: string, status: string) => {
  if (status === 'Doing') {
    return 'var(--mantine-color-teal-5)'
  }
  switch (priority) {
    case 'Urgent':
      return 'var(--mantine-color-red-6)'
    case 'High':
      return 'var(--mantine-color-orange-5)'
    case 'Medium':
      return 'var(--mantine-color-yellow-5)'
    case 'Low':
      return 'var(--mantine-color-blue-4)'
    default:
      return 'transparent'
  }
}

export const TaskCard = ({ task, onSelect }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.uuid,
    data: { task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  }

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      bg="var(--mantine-color-body)"
      mb={6}
      p={8}
      style={{
        ...style,
        borderRadius: 6,
        border: '1px solid var(--mantine-color-default-border)',
        boxShadow: isDragging
          ? '0 4px 12px rgba(0,0,0,0.15)'
          : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <UnstyledButton
        w="100%"
        onClick={() => onSelect(task)}
        style={{ touchAction: 'none' }}
      >
        <Group gap={8} align="flex-start" wrap="nowrap">
          <Box
            w={3}
            style={{
              minHeight: 20,
              alignSelf: 'stretch',
              borderRadius: 2,
              backgroundColor: getPriorityColor(task.priority, task.status),
              flexShrink: 0,
            }}
          />
          <Text
            size="sm"
            fw={500}
            td={task.status === 'Done' ? 'line-through' : undefined}
            c={task.status === 'Done' ? 'dimmed' : undefined}
            style={{
              flex: 1,
              wordBreak: 'break-word',
              lineHeight: 1.4,
            }}
          >
            {task['full-title']}
          </Text>
        </Group>
      </UnstyledButton>
    </Box>
  )
}
