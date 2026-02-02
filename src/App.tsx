import { ActionIcon, Container, Group } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

import { AddTaskModal, SelectedTask, ToggleTheme, WeekView } from './components'
import type { LogseqTask } from './types'

export default function App() {
  const [opened, setOpened] = useState(false)
  const [selectedTask, setSelectedTask] = useState<LogseqTask | null>(null)

  useEffect(() => {
    const kbShortcut = (e: KeyboardEvent) => {
      if (e.key === 'a' && !opened && !selectedTask) {
        setOpened(true)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', kbShortcut)
    return () => window.removeEventListener('keydown', kbShortcut)
  }, [opened, selectedTask])

  if (selectedTask) {
    return (
      <Container size="xl" h="100dvh" py="xl">
        <SelectedTask
          selectedTask={selectedTask}
          setSelectedTask={setSelectedTask}
        />
      </Container>
    )
  }

  return (
    <Container
      size="xl"
      h="100dvh"
      p={0}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Group p="md" justify="space-between">
        <ToggleTheme />
      </Group>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <WeekView onSelectTask={setSelectedTask} />
      </div>

      <ActionIcon
        size={60}
        radius="xl"
        variant="filled"
        pos="fixed"
        bottom={20}
        right={20}
        style={{ zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        onClick={() => setOpened(true)}
      >
        <IconPlus />
      </ActionIcon>

      <AddTaskModal opened={opened} setOpened={setOpened} />
    </Container>
  )
}
