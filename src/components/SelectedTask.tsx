import {
  ActionIcon,
  Badge,
  Group,
  rem,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconLink } from '@tabler/icons-react'
import { format } from 'date-fns'
import { useCallback, useEffect } from 'react'

import { useDoneTodo, useGraph } from '../hooks'
import type { SelectedTaskProps } from '../types'

export const SelectedTask = ({
  selectedTask,
  setSelectedTask,
}: SelectedTaskProps) => {
  const toggleMutation = useDoneTodo()

  const { data: currGraphName } = useGraph()

  const handleComplete = useCallback(() => {
    if (selectedTask) {
      toggleMutation.mutate(selectedTask.uuid)
      setSelectedTask(null)
    }
  }, [selectedTask, setSelectedTask, toggleMutation])

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
      bg="body"
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

        <Group gap="xs">
          <Badge size="lg" variant="outline" color="gray" tt="uppercase">
            {format(selectedTask['created-at'], 'MMM do, yyyy')}
          </Badge>
          <ActionIcon
            component="a"
            href={`logseq://graph/${currGraphName}?block-id=${selectedTask.uuid}`}
            rel="noopener noreferrer"
            size={25}
            radius="lg"
            color="gray"
            variant="outline"
          >
            <IconLink style={{ width: rem(15), height: rem(15) }} />
          </ActionIcon>
        </Group>
      </Stack>
      <ActionIcon
        size={60}
        radius="xl"
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
