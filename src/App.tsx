import { useState } from 'react'
import { useForm } from 'react-hook-form'
import './App.css'

import { useTodos, useAddTodo, useDoneTodo } from './hooks/use-tasks'
import type { LogseqTask } from './types'
import { format } from 'date-fns'

export default function App() {
  const [opened, setOpened] = useState(false)
  const [selectedTask, setSelectedTask] = useState<LogseqTask | null>(null)

  const { data: todos, isLoading } = useTodos()
  const addMutation = useAddTodo()
  const toggleMutation = useDoneTodo()

  const { register, handleSubmit, reset } = useForm<{ text: string }>()

  const onSubmit = (data: { text: string }) => {
    if (!data.text.trim()) return
    addMutation.mutate(data.text, {
      onSuccess: () => {
        setOpened(false)
        reset()
      },
    })
  }

  const handleComplete = () => {
    if (selectedTask) {
      toggleMutation.mutate(selectedTask.uuid)
      setSelectedTask(null)
    }
  }

  return (
    <div className="app-container">
      {selectedTask ? (
        <div className="focused-page">
          <button
            className="fab fab-top-right secondary"
            onClick={() => setSelectedTask(null)}
          >
            ✕
          </button>

          <div className="focused-content">
            <h1>{selectedTask['full-title']}</h1>
            <div
              className={`status-badge ${selectedTask.status.toLowerCase()}`}
            >
              {format(selectedTask['created-at'], 'MMM do, yyyy')}
            </div>
          </div>

          <button
            className="fab fab-bottom-right primary"
            onClick={handleComplete}
          >
            ✓
          </button>
        </div>
      ) : (
        <>
          {isLoading && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>Loading...</div>
          )}

          <div className="todo-list">
            {todos?.map((task) => (
              <div
                key={task.uuid}
                className={`task-item ${task.status.toLowerCase()}`}
                // OPEN FOCUS VIEW INSTEAD OF TOGGLING
                onClick={() => setSelectedTask(task)}
              >
                {task['full-title']}
              </div>
            ))}
          </div>

          {!isLoading && todos?.length === 0 && (
            <div className="empty-state">No tasks yet.</div>
          )}

          <button
            className="fab fab-bottom-right primary"
            onClick={() => setOpened(true)}
          >
            +
          </button>
        </>
      )}

      {opened && (
        <div className="modal-overlay" onClick={() => setOpened(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <input
                className="hero-input"
                autoFocus
                placeholder="What needs to be done?"
                autoComplete="off"
                {...register('text', { required: true })}
              />
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
