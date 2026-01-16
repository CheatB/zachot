/**
 * Виртуализированный список для оптимизации рендеринга больших списков.
 * 
 * Использует react-window для рендеринга только видимых элементов.
 */

import * as ReactWindow from 'react-window'
import * as AutoSizerModule from 'react-virtualized-auto-sizer'

const { FixedSizeList } = ReactWindow
const { AutoSizer } = AutoSizerModule

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
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  )

  return (
    <div className={className} style={{ height: '100%', width: '100%' }}>
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
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
