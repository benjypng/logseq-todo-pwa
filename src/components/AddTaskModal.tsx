import { Modal, Input } from '@mantine/core'
import { Controller, useForm } from 'react-hook-form'
import type { AddTaskModalProps, FormValues } from '../types'
import { useAddTodo } from '../hooks'

export const AddTaskModal = ({ opened, setOpened }: AddTaskModalProps) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { task: '' },
  })
  const addMutation = useAddTodo()

  const onSubmit = (data: FormValues) => {
    if (!data.task.trim()) return
    addMutation.mutate(data.task, {
      onSuccess: () => {
        setOpened(false)
        reset()
      },
    })
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
              data-autofocus
              placeholder="What needs to be done?"
              variant="unstyled"
              size="xl"
              bdrs="lg"
            />
          )}
        />
      </form>
    </Modal>
  )
}
