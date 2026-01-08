import { Input, Modal } from '@mantine/core'
import { Controller, useForm } from 'react-hook-form'

import { useAddTodo } from '../hooks'
import type { AddTaskModalProps, FormValues } from '../types'
import { getPriorityFromTask } from '../utils/get-priority-from-task'

export const AddTaskModal = ({ opened, setOpened }: AddTaskModalProps) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { task: '' },
  })
  const addMutation = useAddTodo()

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
      transitionProps={{ duration: 100 }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="task"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              {...field}
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
