import { Input, Modal } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useAddTodo } from '../hooks'
import type { AddTaskModalProps, FormValues } from '../types'
import { getPriorityFromTask } from '../utils/get-priority-from-task'

export const AddTaskModal = ({ opened, setOpened }: AddTaskModalProps) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { task: '' },
  })
  const inputRef = useRef<HTMLInputElement | null>(null)
  const addMutation = useAddTodo()

  useEffect(() => {
    if (opened) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [opened])

  const onSubmit = (data: FormValues) => {
    if (!data.task.trim()) return

    addMutation.mutate(
      { task: data.task, priority: getPriorityFromTask(data.task) },
      {
        onSuccess: () => {
          setOpened(false)
          reset()
        },
      },
    )
  }

  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      withCloseButton={false}
      centered
      size="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="task"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              {...field}
              ref={(e) => {
                field.ref(e)
                inputRef.current = e
              }}
              data-autofocus
              placeholder="What needs to be done?"
              variant="unstyled"
              size="xl"
            />
          )}
        />
      </form>
    </Modal>
  )
}
