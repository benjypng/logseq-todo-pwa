import { ActionIcon, Button, Group, Text } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

interface WeekNavigationProps {
  weekLabel: string
  weekOffset: number
  onPreviousWeek: () => void
  onNextWeek: () => void
  onToday: () => void
}

export const WeekNavigation = ({
  weekLabel,
  weekOffset,
  onPreviousWeek,
  onNextWeek,
  onToday,
}: WeekNavigationProps) => {
  return (
    <Group justify="space-between" p="md">
      <Group gap="xs">
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={onPreviousWeek}
          aria-label="Previous week"
        >
          <IconChevronLeft size={20} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={onNextWeek}
          aria-label="Next week"
        >
          <IconChevronRight size={20} />
        </ActionIcon>
      </Group>

      <Text fw={600} size="lg">
        Week of {weekLabel}
      </Text>

      <Button
        variant={weekOffset === 0 ? 'filled' : 'light'}
        size="sm"
        onClick={onToday}
        disabled={weekOffset === 0}
      >
        Today
      </Button>
    </Group>
  )
}
