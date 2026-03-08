import { Center, Loader, Text } from '@mantine/core'

import type { LogseqTask } from '../types'
import { ItemCard } from './ItemCard'

interface ItemListProps {
  items: LogseqTask[]
  isLoading: boolean
  onSelect: (item: LogseqTask) => void
  onComplete: (uuid: string) => void
}

export function ItemList({
  items,
  isLoading,
  onSelect,
  onComplete,
}: ItemListProps) {
  if (isLoading) {
    return (
      <Center h={200}>
        <Loader type="dots" />
      </Center>
    )
  }

  if (items.length === 0) {
    return (
      <Center h={200}>
        <Text c="dimmed" size="lg" fs="italic">
          All done!
        </Text>
      </Center>
    )
  }

  return (
    <div>
      {items.map((item) => (
        <ItemCard
          key={item.uuid}
          item={item}
          onSelect={onSelect}
          onComplete={onComplete}
        />
      ))}
    </div>
  )
}
