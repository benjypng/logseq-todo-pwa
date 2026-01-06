import '@mantine/core/styles.css'

import { useEffect, useRef, useState } from 'react'

import { useDoingTodo, useTodos } from './hooks'
import type { LogseqTask } from './types'
import {
  ActionIcon,
  Box,
  Center,
  Container,
  Divider,
  Loader,
  MantineProvider,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { AddTaskModal, SelectedTask } from './components'

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

  return (
    <MantineProvider>
      <Container size="xs" mah="100vh" py="xl">
        {isLoading && (
          <Center mt="xl">
            <Loader color="dark" type="dots" />
          </Center>
        )}

        {!isLoading && (
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
                    py="sm"
                    w="100%"
                    onClick={() => handleSelectedTask(task)}
                    td={task.status === 'Done' ? 'line-through' : undefined}
                    c={task.status === 'Done' ? 'dimmed' : undefined}
                    opacity={task.status === 'Done' ? 0.5 : 1}
                  >
                    <Text size="xl">{task['full-title']}</Text>
                  </UnstyledButton>
                  <Divider color="gray.2" />
                </Box>
              ))
            )}
          </Stack>
        )}

        {!isLoading && selectedTask ? (
          <SelectedTask
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
          />
        ) : (
          <>
            <ActionIcon
              size={60}
              radius="xl"
              color="dark"
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
        )}

        {!isLoading && <AddTaskModal opened={opened} setOpened={setOpened} />}
      </Container>
    </MantineProvider>
  )
}
