import {
  ActionIcon,
  Box,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { useEffect, useState } from 'react'

import { AddTaskModal, SelectedTask } from './components'
import { ToggleTheme } from './components/ToggleTheme'
import { useDoingTodo, useTodos } from './hooks'
import type { LogseqTask } from './types'

export default function App() {
  const [opened, setOpened] = useState(false)
  const [selectedTask, setSelectedTask] = useState<LogseqTask | null>(null)

  const { data: todos, isLoading } = useTodos()
  const doingMutation = useDoingTodo()

  useEffect(() => {
    const kbShortcut = (e: KeyboardEvent) => {
      if (e.key === 'a') {
        setOpened(true)
        e.preventDefault()
      }
    }
    if (!opened) {
      window.addEventListener('keydown', kbShortcut)
      return () => window.removeEventListener('keydown', kbShortcut)
    }
  }, [opened])

  const handleSelectedTask = (task: LogseqTask) => {
    setSelectedTask(task)
    doingMutation.mutate(task.uuid)
  }

  const getPriorityColor = (priority: string) => {
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

  return (
    <Container size="xs" mah="100vh" py="xl">
      {!selectedTask && (
        <Center>
          <ToggleTheme />
        </Center>
      )}

      {isLoading && (
        <Center mt="xl">
          <Loader type="dots" />
        </Center>
      )}

      {!isLoading && selectedTask ? (
        <SelectedTask
          selectedTask={selectedTask}
          setSelectedTask={setSelectedTask}
        />
      ) : (
        !isLoading && (
          <>
            <Stack
              gap={0}
              justify="center"
              h={todos?.length === 0 ? undefined : '100%'}
              mih="80vh"
            >
              {todos?.length === 0 ? (
                <Center h="50vh">
                  <Text c="dimmed">No tasks yet.</Text>
                </Center>
              ) : (
                todos?.map((task) => (
                  <Box key={task.uuid}>
                    <UnstyledButton
                      py="md"
                      w="100%"
                      onClick={() => handleSelectedTask(task)}
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          'var(--mantine-color-default-hover)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      <Group gap="md" align="center" wrap="nowrap">
                        <Box
                          w={4}
                          h={40}
                          bg={getPriorityColor(task.priority)}
                          style={{ borderRadius: 4, flexShrink: 0 }}
                        />
                        <Text
                          size="lg"
                          fw={500}
                          td={
                            task.status === 'Done' ? 'line-through' : undefined
                          }
                          c={task.status === 'Done' ? 'dimmed' : undefined}
                          opacity={task.status === 'Done' ? 0.5 : 1}
                          style={{ flex: 1 }}
                        >
                          {task['full-title']}
                        </Text>
                      </Group>
                    </UnstyledButton>
                    <Divider />
                  </Box>
                ))
              )}
            </Stack>

            <ActionIcon
              size={60}
              radius="xl"
              variant="filled"
              pos="fixed"
              bottom={40}
              right={40}
              onClick={() => setOpened(true)}
            >
              <Text size="xl" fw={700}>
                +
              </Text>
            </ActionIcon>
          </>
        )
      )}

      {!isLoading && <AddTaskModal opened={opened} setOpened={setOpened} />}
    </Container>
  )
}
