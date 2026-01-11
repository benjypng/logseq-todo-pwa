import {
  Box,
  Button,
  Center,
  Divider,
  Drawer,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconSum } from '@tabler/icons-react'
import { format, isSameMonth } from 'date-fns'
import { useMemo } from 'react'

import { useExpense } from '../hooks/use-expense'

export const ExpenseList = () => {
  const { data: expenses, isLoading } = useExpense()
  const [opened, { open, close }] = useDisclosure(false)

  const currentMonthTotal = useMemo(() => {
    if (!expenses) return 0
    const now = new Date()
    return expenses
      .filter((expense) => isSameMonth(new Date(expense.createdAt), now))
      .reduce((sum, expense) => sum + Number(expense.value), 0)
  }, [expenses])

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader type="dots" />
      </Center>
    )
  }

  if (!expenses || expenses.length === 0) {
    return (
      <Center h="100%">
        <Text c="dimmed">No expenses recorded.</Text>
      </Center>
    )
  }

  return (
    <>
      <Button
        fullWidth
        variant="light"
        onClick={open}
        mb="md"
        leftSection={<IconSum size={16} />}
      >
        {format(new Date(), 'MMMM')} Summary
      </Button>

      <Stack gap={0} w="100%">
        {expenses.map((expense, index) => (
          <Box key={index} w="100%" mb="sm">
            <Group justify="space-between" align="center">
              <Text size="lg" fw={500}>
                {expense.label}
              </Text>
              <Text size="lg" fw={700} c="blue">
                ${expense.value}
              </Text>
            </Group>
            <Text size="sm" c="gray" mb="xs">
              {format(new Date(expense.createdAt), 'MMM do, yyyy')}
            </Text>
            <Divider />
          </Box>
        ))}
      </Stack>

      <Drawer
        opened={opened}
        onClose={close}
        position="top"
        title="Monthly Summary"
        padding="md"
        size="xs"
      >
        <Stack align="center" py="xl">
          <Title order={4} c="dimmed">
            {format(new Date(), 'MMMM yyyy')}
          </Title>
          <Text size="xl" fw={900} fz={40} c="blue">
            ${currentMonthTotal.toFixed(2)}
          </Text>
          <Text c="dimmed" size="sm">
            Total Spent
          </Text>
        </Stack>
      </Drawer>
    </>
  )
}
