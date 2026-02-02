import { ActionIcon, Group, Input, Modal, Stack, Text } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import {
  IconCalendar,
  IconMoneybag,
  IconShoppingBag,
  IconX,
} from '@tabler/icons-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useAddTodo } from '../hooks'
import { useAddExpense } from '../hooks/use-expense'
import type { AddTaskModalProps, FormValues } from '../types'
import { getPriorityFromTask, parseExpense } from '../utils'

export const AddTaskModal = ({ opened, setOpened }: AddTaskModalProps) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { task: '' },
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const addTaskMutation = useAddTodo()
  const addExpenseMutation = useAddExpense()

  const handleClose = () => {
    setOpened(false)
    reset()
    setSelectedDate(null)
  }

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
          onSuccess: handleClose,
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
          date: selectedDate,
        },
        {
          onSuccess: handleClose,
        },
      )
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={false}
      centered
      size="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      transitionProps={{ duration: 100 }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
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
                }
                if (isErrand) {
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

          <Group gap="xs" align="center">
            <DatePickerInput
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Today"
              leftSection={<IconCalendar size={16} />}
              clearable
              size="sm"
              styles={{
                input: {
                  width: 160,
                },
              }}
            />
            {selectedDate && (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setSelectedDate(null)}
                aria-label="Clear date"
              >
                <IconX size={14} />
              </ActionIcon>
            )}
            <Text size="xs" c="dimmed" ml="auto">
              Press Enter to add
            </Text>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
