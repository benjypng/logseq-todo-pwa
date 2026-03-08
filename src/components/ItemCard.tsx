import { ActionIcon, Box, Group, Text, UnstyledButton } from '@mantine/core'
import { IconCircle } from '@tabler/icons-react'

import type { LogseqTask } from '../types'

interface ItemCardProps {
  item: LogseqTask
  onSelect: (item: LogseqTask) => void
  onComplete: (uuid: string) => void
}

export function ItemCard({ item, onSelect, onComplete }: ItemCardProps) {
  return (
    <Group
      gap={12}
      px="md"
      py="sm"
      wrap="nowrap"
      style={{
        borderBottom: '1px solid var(--mantine-color-default-border)',
        alignItems: 'center',
      }}
    >
      <ActionIcon
        variant="subtle"
        radius="xl"
        size="md"
        color="gray"
        onClick={() => onComplete(item.uuid)}
        aria-label={`Complete: ${item['full-title']}`}
        style={{ flexShrink: 0 }}
      >
        <IconCircle size={22} />
      </ActionIcon>

      <UnstyledButton
        style={{ flex: 1, minWidth: 0 }}
        onClick={() => onSelect(item)}
      >
        <Box>
          <Text size="sm" lh={1.4} style={{ wordBreak: 'break-word' }}>
            {item['full-title']}
          </Text>
        </Box>
      </UnstyledButton>
    </Group>
  )
}
