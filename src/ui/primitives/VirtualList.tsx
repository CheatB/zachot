/**
 * Виртуализированный список для оптимизации рендеринга больших списков.
 * 
 * Использует react-window для рендеринга только видимых элементов.
 */

import { FixedSizeList, ListChildComponentProps } from 'react-window'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  height?: number
  overscanCount?: number
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className,
  height = 600,
  overscanCount = 3,
}: VirtualListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  )

  return (
    <div className={className}>
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
        overscanCount={overscanCount}
      >
        {Row}
      </FixedSizeList>
    </div>
  )
}
