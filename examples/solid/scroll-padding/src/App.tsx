import { createVirtualizer } from '@tanstack/solid-virtual'
import { For, createSignal, onMount } from 'solid-js'

function App() {
  let parentRef!: HTMLDivElement
  let tableHeader!: HTMLTableSectionElement

  const [headerHeight, setHeaderHeight] = createSignal(0)
  onMount(() => setHeaderHeight(tableHeader.clientHeight))

  const rowVirtualizer = createVirtualizer({
    count: 10000,
    getScrollElement: () => parentRef,
    estimateSize: () => 35,
    overscan: 5,
    get paddingStart() {
      return headerHeight()
    },
    get scrollPaddingStart() {
      return headerHeight()
    },
  })

  return (
    <>
      <div>
        <button onClick={() => rowVirtualizer.scrollToIndex(40)}>
          Scroll to index 40
        </button>
        <button onClick={() => rowVirtualizer.scrollToIndex(20)}>
          Then scroll to index 20
        </button>
      </div>

      <br />
      <br />

      <div
        ref={parentRef}
        class="List"
        style={{
          height: '200px',
          width: '400px',
          overflow: 'auto',
        }}
      >
        <table
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
          }}
        >
          <thead ref={tableHeader}>
            <tr>
              <th>Index</th>
              <th>Key</th>
            </tr>
          </thead>
          <tbody>
            <For each={rowVirtualizer.getVirtualItems()}>
              {(virtualRow) => (
                <tr
                  class={virtualRow.index % 2 ? 'ListItemOdd' : 'ListItemEven'}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <td>{virtualRow.index}</td>
                  <td>{virtualRow.key}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default App
