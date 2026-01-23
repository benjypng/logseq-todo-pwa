import {
  Box,
  Center,
  Divider,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'

import type { TaskListProps } from '../types'

export const TaskList = ({ tasks, type, onSelect }: TaskListProps) => {
  const filteredTasks = tasks?.filter((t) => t.taskType === type)

  const getPriorityColor = (priority: string, status: string) => {
    if (status === 'Doing') {
      return 'var(--mantine-color-teal-5)'
    }
    switch (priority) {
      case 'Urgent':
        return 'red.6'
      case 'High':
        return 'orange.5'
      case 'Medium':
        return 'yellow.5'
      case 'Low':
        return 'blue.4'
      default:
        return 'transparent'
    }
  }

  if (!filteredTasks || filteredTasks.length === 0) {
    return (
      <Center h="100%">
        <Text c="dimmed">No {type}s found.</Text>
      </Center>
    )
  }

  return (
    <Stack gap={0} w="100%" h="100%" justify="center">
      {filteredTasks.map((task) => (
        <Box key={task.uuid} w="100%">
          <UnstyledButton
            py="md"
            w="100%"
            onClick={() => onSelect(task)}
            style={{ transition: 'background-color 0.2s' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                'var(--mantine-color-default-hover)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
          >
            <Group gap="md" align="center" wrap="nowrap" w="100%">
              <Box
                w={4}
                h={40}
                bg={getPriorityColor(task.priority, task.status)}
                style={{
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              />
              <Text
                size="lg"
                fw={500}
                td={task.status === 'Done' ? 'line-through' : undefined}
                c={task.status === 'Done' ? 'dimmed' : undefined}
                opacity={task.status === 'Done' ? 0.5 : 1}
                style={{ flex: 1, wordBreak: 'break-word', lineHeight: 1.3 }}
              >
                {task['full-title']}
              </Text>
            </Group>
          </UnstyledButton>
          <Divider />
        </Box>
      ))}
    </Stack>
  )
}
