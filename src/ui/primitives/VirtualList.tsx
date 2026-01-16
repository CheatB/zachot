/**
 * Виртуализированный список для оптимизации рендеринга больших списков.
 * 
 * Использует react-window для рендеринга только видимых элементов.
 */

import { FixedSizeList, ListChildComponentProps } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscanCount?: number
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className,
  overscanCount = 3,
}: VirtualListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  )

  return (
    <div className={className} style={{ height: '100%', width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            itemCount={items.length}
            itemSize={itemHeight}
            width={width}
            overscanCount={overscanCount}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  )
}
