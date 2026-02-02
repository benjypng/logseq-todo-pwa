import {
  Badge,
  Box,
  Center,
  Group,
  Loader,
  ScrollArea,
  Text,
} from '@mantine/core'
import { format, isSameMonth } from 'date-fns'
import { useMemo } from 'react'

import { useExpense } from '../hooks/use-expense'

export const ExpenseList = () => {
  const { data: expenses, isLoading } = useExpense()

  const currentMonthTotal = useMemo(() => {
    if (!expenses) return 0
    const now = new Date()
    return expenses
      .filter((expense) => isSameMonth(new Date(expense.createdAt), now))
      .reduce((sum, expense) => sum + Number(expense.value), 0)
  }, [expenses])

  if (isLoading) {
    return (
      <Center h={140}>
        <Loader type="dots" />
      </Center>
    )
  }

  return (
    <ScrollArea h={140} p="md" pt={0}>
      <Group mb="sm" align="center">
        <Text size="sm" c="dimmed">
          {format(new Date(), 'MMMM')} total:
        </Text>
        <Badge size="lg" variant="light" color="blue">
          ${currentMonthTotal.toFixed(2)}
        </Badge>
      </Group>

      {(!expenses || expenses.length === 0) && (
        <Text size="sm" c="dimmed" fs="italic">
          No expenses recorded
        </Text>
      )}

      <Group gap={12} wrap="wrap">
        {expenses?.map((expense, index) => (
          <Box
            key={index}
            p={8}
            style={{
              borderRadius: 6,
              border: '1px solid var(--mantine-color-default-border)',
              minWidth: 150,
            }}
          >
            <Group justify="space-between" gap="xs">
              <Text size="sm" fw={500} style={{ flex: 1 }}>
                {expense.label}
              </Text>
              <Text size="sm" fw={700} c="blue">
                ${expense.value}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {format(new Date(expense.createdAt), 'MMM do')}
            </Text>
          </Box>
        ))}
      </Group>
    </ScrollArea>
  )
}
