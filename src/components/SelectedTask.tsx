import { ActionIcon, Badge, Stack, Text, Title } from '@mantine/core'
import { format } from 'date-fns'
import { useEffect } from 'react'

import { useDoneTodo } from '../hooks/use-tasks'
import type { SelectedTaskProps } from '../types'

export const SelectedTask = ({
  selectedTask,
  setSelectedTask,
}: SelectedTaskProps) => {
  const toggleMutation = useDoneTodo()

  const handleComplete = () => {
    if (selectedTask) {
      toggleMutation.mutate(selectedTask.uuid)
      setSelectedTask(null)
    }
  }

  useEffect(() => {
    const kbShortcut = (e: KeyboardEvent) => {
      if (e.key === 'd') {
        handleComplete()
        e.preventDefault()
      }
      if (e.key === 'Escape') {
        setSelectedTask(null)
      }
    }
    window.addEventListener('keydown', kbShortcut)
    return () => window.removeEventListener('keydown', kbShortcut)
  }, [handleComplete, setSelectedTask])

  return (
    <Stack
      pos="fixed"
      top={0}
      left={0}
      w="100%"
      h="100%"
      bg="white"
      justify="center"
      p={40}
    >
      <ActionIcon
        size={60}
        radius="xl"
        color="gray"
        variant="light"
        pos="fixed"
        top={40}
        right={40}
        onClick={() => setSelectedTask(null)}
      >
        <Text size="xl">✕</Text>
      </ActionIcon>
      <Stack align="start" gap="md">
        <Title order={1} size="h1" lh={1.2}>
          {selectedTask['full-title']}
        </Title>

        <Badge size="lg" variant="outline" color="gray" tt="uppercase">
          {format(selectedTask['created-at'], 'MMM do, yyyy')}
        </Badge>
      </Stack>
      <ActionIcon
        size={60}
        radius="xl"
        color="dark"
        variant="filled"
        pos="fixed"
        bottom={40}
        right={40}
        onClick={handleComplete}
      >
        <Text size="xl">✓</Text>
      </ActionIcon>
    </Stack>
  )
}
