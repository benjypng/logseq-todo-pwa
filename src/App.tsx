import { useEffect, useState } from 'react'

import { FocusMode } from './components/focus-mode'
import { TaskList } from './components/task-list'
import { useTasks } from './hooks/use-tasks'
import type { Task } from './types'

type AppState = { mode: 'list' } | { mode: 'focus'; task: Task }

export default function App() {
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }, [])

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
