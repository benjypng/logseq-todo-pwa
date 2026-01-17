import { Input, Modal } from '@mantine/core'
import { IconMoneybag, IconShoppingBag } from '@tabler/icons-react'
import { Controller, useForm } from 'react-hook-form'

import { useAddTodo } from '../hooks'
import { useAddExpense } from '../hooks/use-expense'
import type { AddTaskModalProps, FormValues } from '../types'
import { getPriorityFromTask, parseExpense } from '../utils'

export const AddTaskModal = ({ opened, setOpened }: AddTaskModalProps) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { task: '' },
  })

  const addTaskMutation = useAddTodo()
  const addExpenseMutation = useAddExpense()

  const onSubmit = (data: FormValues) => {
    if (!data.task.trim()) return

    if (data.task.includes('$')) {
      const parsedExpense = parseExpense(data.task)
      if (!parsedExpense) return

      addExpenseMutation.mutate(
        {
          label: parsedExpense.label,
          value: parsedExpense.value,
        },
        {
          onSuccess: () => {
            setOpened(false)
            reset()
          },
        },
      )
    } else {
      const type = data.task.includes('#errand') ? 'errand' : 'task'

      addTaskMutation.mutate(
        {
          task: data.task
            .toLowerCase()
            .replace('#errand', '')
            .replace('p0', '')
            .replace('p1', '')
            .replace('p1', '')
            .replace('p2', '')
            .replace('p4', ''),
          priority: getPriorityFromTask(data.task),
          type: type,
        },
        {
          onSuccess: () => {
            setOpened(false)
            reset()
          },
        },
      )
    }
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
          render={({ field }) => {
            const isExpense = field.value.includes('$')
            const isErrand = field.value.toLowerCase().includes('#errand')

            const renderLeftSection = () => {
              if (isExpense) {
                return <IconMoneybag />
              } else if (isErrand) {
                return <IconShoppingBag />
              }
              return null
            }

            return (
              <Input
                {...field}
                placeholder="What needs to be done?"
                variant="unstyled"
                size="xl"
                leftSection={renderLeftSection()}
              />
            )
          }}
        />
      </form>
    </Modal>
  )
}
