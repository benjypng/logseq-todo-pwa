import { useState } from 'react'

import { FocusMode } from './components/focus-mode'
import { TaskList } from './components/task-list'
import { useTasks } from './hooks/use-tasks'
import type { AppState } from './types'

export default function App() {
  const [state, setState] = useState<AppState>({ mode: 'list' })
  const { tasks, isLoading, error, refetch } = useTasks()

  const handleEnterFocus = (uuid: string) => {
    const task = tasks.find((t) => t.uuid === uuid)
    if (!task) return
    setState({ mode: 'focus', task })
  }

  const handleExitFocus = () => {
    setState({ mode: 'list' })
    refetch()
  }

  if (state.mode === 'focus') {
    return <FocusMode task={state.task} onExit={handleExitFocus} />
  }

  return (
    <TaskList
      tasks={tasks}
      isLoading={isLoading}
      error={error}
      onEnterFocus={handleEnterFocus}
      onRefetch={refetch}
    />
  )
}
