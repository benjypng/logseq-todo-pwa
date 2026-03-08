import { Container, Group, Text } from '@mantine/core'
import { useEffect, useState } from 'react'

import { AddTaskModal, SelectedTask, ToggleTheme } from './components'
import { BottomNav } from './components/BottomNav'
import { ItemList } from './components/ItemList'
import { useDoneTodo, useTodos } from './hooks'
import type { LogseqTask, TaskType } from './types'

export default function App() {
  const [activeTab, setActiveTab] = useState<TaskType>('task')
  const [opened, setOpened] = useState(false)
  const [selectedTask, setSelectedTask] = useState<LogseqTask | null>(null)

  const { data: allTasks, isLoading } = useTodos()
  const doneMutation = useDoneTodo()

  const tasks = allTasks?.filter((t) => t.taskType === 'task') ?? []
  const errands = allTasks?.filter((t) => t.taskType === 'errand') ?? []
  const activeItems = activeTab === 'task' ? tasks : errands

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
      <SelectedTask
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
      />
    )
  }

  return (
    <Container
      p={0}
      h="100dvh"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Group
        px="md"
        py="sm"
        justify="space-between"
        style={{
          flexShrink: 0,
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Text fw={600} size="lg">
          {activeTab === 'task' ? 'Tasks' : 'Errands'}
        </Text>
        <ToggleTheme />
      </Group>

      <div
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 64 }}
      >
        <ItemList
          items={activeItems}
          isLoading={isLoading}
          onSelect={(task) => {
            setSelectedTask(task)
          }}
          onComplete={(uuid) => doneMutation.mutate(uuid)}
        />
      </div>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAdd={() => setOpened(true)}
      />

      <AddTaskModal
        opened={opened}
        setOpened={setOpened}
        activeTab={activeTab}
      />
    </Container>
  )
}
