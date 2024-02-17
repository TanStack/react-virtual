import { createVirtualizer } from '@tanstack/solid-virtual'
import { For } from 'solid-js'

function App() {
  return (
    <div>
      <p>
        Examples with additional <strong>padding</strong> applied to the start
        and the end of the scrolling area.
      </p>
      <br />
      <br />

      <h3>Rows</h3>
      <RowVirtualizerPadding />
      <br />
      <br />
      <h3>Columns</h3>
      <ColumnVirtualizerPadding />
      <br />
      <br />
      <h3>Grid</h3>
      <GridVirtualizerPadding />
    </div>
  )
}

function RowVirtualizerPadding() {
  let parentRef!: HTMLDivElement

  const rowVirtualizer = createVirtualizer({
    count: 10000,
    getScrollElement: () => parentRef,
    estimateSize: () => 35,
    paddingStart: 100,
    paddingEnd: 100,
  })

  return (
    <>
      <div
        ref={parentRef}
        class="List"
        style={{
          height: '200px',
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
            {(virtualRow) => (
              <div
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
                Row {virtualRow.index}
              </div>
            )}
          </For>
        </div>
      </div>
    </>
  )
}

function ColumnVirtualizerPadding() {
  let parentRef!: HTMLDivElement

  const columnVirtualizer = createVirtualizer({
    horizontal: true,
    count: 10000,
    getScrollElement: () => parentRef,
    estimateSize: () => 100,
    paddingStart: 100,
    paddingEnd: 100,
  })

  return (
    <>
      <div
        ref={parentRef}
        class="List"
        style={{
          width: '400px',
          height: '100px',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            width: `${columnVirtualizer.getTotalSize()}px`,
            height: '100%',
            position: 'relative',
          }}
        >
          <For each={columnVirtualizer.getVirtualItems()}>
            {(virtualColumn) => (
              <div
                class={virtualColumn.index % 2 ? 'ListItemOdd' : 'ListItemEven'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${virtualColumn.size}px`,
                  transform: `translateX(${virtualColumn.start}px)`,
                }}
              >
                Column {virtualColumn.index}
              </div>
            )}
          </For>
        </div>
      </div>
    </>
  )
}

function GridVirtualizerPadding() {
  let parentRef!: HTMLDivElement

  const rowVirtualizer = createVirtualizer({
    count: 10000,
    getScrollElement: () => parentRef,
    estimateSize: () => 35,
    paddingStart: 100,
    paddingEnd: 100,
  })

  const columnVirtualizer = createVirtualizer({
    horizontal: true,
    count: 10000,
    getScrollElement: () => parentRef,
    estimateSize: () => 100,
    paddingStart: 100,
    paddingEnd: 100,
  })

  return (
    <>
      <div
        ref={parentRef}
        class="List"
        style={{
          height: '500px',
          width: '500px',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: `${columnVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          <For each={rowVirtualizer.getVirtualItems()}>
            {(virtualRow) => (
              <For each={columnVirtualizer.getVirtualItems()}>
                {(virtualColumn) => (
                  <div
                    class={
                      virtualColumn.index % 2
                        ? virtualRow.index % 2 === 0
                          ? 'ListItemOdd'
                          : 'ListItemEven'
                        : virtualRow.index % 2
                          ? 'ListItemOdd'
                          : 'ListItemEven'
                    }
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${virtualColumn.size}px`,
                      height: `${virtualRow.size}px`,
                      transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                    }}
                  >
                    Cell {virtualRow.index}, {virtualColumn.index}
                  </div>
                )}
              </For>
            )}
          </For>
        </div>
      </div>
    </>
  )
}

export default App
