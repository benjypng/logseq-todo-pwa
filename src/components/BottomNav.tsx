import { ActionIcon, Box, Paper, Text, UnstyledButton } from '@mantine/core'
import {
  IconPlus,
  IconShoppingCart,
  IconSquareCheck,
} from '@tabler/icons-react'

import type { TaskType } from '../types'

interface BottomNavProps {
  activeTab: TaskType
  onTabChange: (tab: TaskType) => void
  onAdd: () => void
}

export function BottomNav({ activeTab, onTabChange, onAdd }: BottomNavProps) {
  return (
    <Paper
      pos="fixed"
      bottom={0}
      left={0}
      right={0}
      h={64}
      radius={0}
      withBorder
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
      }}
    >
      <UnstyledButton
        onClick={() => onTabChange('task')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          flex: 1,
          padding: '8px 0',
        }}
      >
        <IconSquareCheck
          size={20}
          color={
            activeTab === 'task'
              ? 'var(--mantine-color-gray-8)'
              : 'var(--mantine-color-dimmed)'
          }
        />
        <Text
          size="xs"
          fw={activeTab === 'task' ? 600 : 400}
          c={activeTab === 'task' ? 'dark' : 'dimmed'}
        >
          Tasks
        </Text>
      </UnstyledButton>

      <Box style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <ActionIcon
          size={52}
          radius="xl"
          variant="filled"
          style={{ marginTop: -26 }}
          onClick={onAdd}
          aria-label="Add new item"
        >
          <IconPlus size={28} />
        </ActionIcon>
      </Box>

      <UnstyledButton
        onClick={() => onTabChange('Errand')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          flex: 1,
          padding: '8px 0',
        }}
      >
        <IconShoppingCart
          size={20}
          color={
            activeTab === 'Errand'
              ? 'var(--mantine-color-gray-8)'
              : 'var(--mantine-color-dimmed)'
          }
        />
        <Text
          size="xs"
          fw={activeTab === 'Errand' ? 600 : 400}
          c={activeTab === 'Errand' ? 'dark' : 'dimmed'}
        >
          Errands
        </Text>
      </UnstyledButton>
    </Paper>
  )
}
