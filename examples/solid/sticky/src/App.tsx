import {
  createVirtualizer,
  defaultRangeExtractor,
} from '@tanstack/solid-virtual'
import { For, createSignal } from 'solid-js'

import { faker } from '@faker-js/faker'
import { findIndex, groupBy } from 'lodash'

const groupedNames = groupBy(
  Array.from({ length: 1000 })
    .map(() => faker.person.firstName())
    .sort(),
  (name) => name[0],
)
const groups = Object.keys(groupedNames)
const rows = groups.reduce(
  (acc, k) => [...acc, k, ...groupedNames[k]],
  [] as string[],
)
const stickyIndexes = groups.map((gn) => findIndex(rows, (n) => n === gn))

const isSticky = (index: number) => stickyIndexes.includes(index)

function App() {
  let parentRef!: HTMLDivElement

  const [activeStickyIndex, setActiveStickyIndex] = createSignal(0)

  const rowVirtualizer = createVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 50,
    overscan: 5,
    rangeExtractor: (range) => {
      const activeIndex = [...stickyIndexes]
        .reverse()
        .find((index) => range.startIndex >= index)!

      setActiveStickyIndex(activeIndex)

      const next = new Set([activeIndex, ...defaultRangeExtractor(range)])

      return [...next].sort((a, b) => a - b)
    },
  })

  const isActiveSticky = (index: number) => activeStickyIndex() === index

  return (
    <div
      ref={parentRef}
      class="List"
      style={{
        height: '300px',
        width: '400px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <For each={rowVirtualizer.getVirtualItems()}>
          {(virtualRow) => {
            return (
              <div
                style={{
                  ...(isSticky(virtualRow.index)
                    ? {
                        background: '#fff',
                        'border-bottom': '1px solid #ddd',
                        'z-index': 1,
                      }
                    : {}),
                  ...(isActiveSticky(virtualRow.index)
                    ? { position: 'sticky' }
                    : {
                        position: 'absolute',
                        transform: `translateY(${virtualRow.start}px)`,
                      }),
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                }}
              >
                {rows[virtualRow.index]}
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

export default App
