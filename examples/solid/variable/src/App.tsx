import { createVirtualizer } from '@tanstack/solid-virtual'
import { For } from 'solid-js'

const rows = new Array(10000)
  .fill(true)
  .map(() => 25 + Math.round(Math.random() * 100))

const columns = new Array(10000)
  .fill(true)
  .map(() => 75 + Math.round(Math.random() * 100))

function App() {
  return (
    <div>
      <p>
        These components are using <strong>variable</strong> sizes. This means
        that each element has a unique, but knowable dimension at render time.
      </p>
      <br />
      <br />

      <h3>Rows</h3>
      <RowVirtualizerVariable />
      <br />
      <br />
      <h3>Columns</h3>
      <ColumnVirtualizerVariable />
      <br />
      <br />
      <h3>Grid</h3>
      <GridVirtualizerVariable />
      <br />
      <br />
      <h3>Masonry (vertical)</h3>
      <MasonryVerticalVirtualizerVariable />
      <br />
      <br />
      <h3>Masonry (horizontal)</h3>
      <MasonryHorizontalVirtualizerVariable />
    </div>
  )
}

function RowVirtualizerVariable() {
  let parentRef!: HTMLDivElement

  const rowVirtualizer = createVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef,
    estimateSize: (i) => rows[i],
    overscan: 5,
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

function ColumnVirtualizerVariable() {
  let parentRef!: HTMLDivElement

  const columnVirtualizer = createVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => parentRef,
    estimateSize: (i) => columns[i],
    overscan: 5,
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

function GridVirtualizerVariable() {
  let parentRef!: HTMLDivElement

  const rowVirtualizer = createVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef,
    estimateSize: (i) => rows[i],
    overscan: 5,
  })

  const columnVirtualizer = createVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => parentRef,
    estimateSize: (i) => columns[i],
    overscan: 5,
  })

  return (
    <>
      <div
        ref={parentRef}
        class="List"
        style={{
          height: '400px',
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

function MasonryVerticalVirtualizerVariable() {
  let parentRef!: HTMLDivElement

  const rowVirtualizer = createVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef,
    estimateSize: (i) => rows[i],
    overscan: 5,
    lanes: 4,
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
                  left: `${virtualRow.lane * 25}%`,
                  width: '25%',
                  height: `${rows[virtualRow.index]}px`,
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

function MasonryHorizontalVirtualizerVariable() {
  let parentRef!: HTMLDivElement

  const columnVirtualizer = createVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => parentRef,
    estimateSize: (i) => columns[i],
    overscan: 5,
    lanes: 4,
  })

  return (
    <>
      <div
        ref={parentRef}
        class="List"
        style={{
          width: '500px',
          height: '400px',
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
                  top: `${virtualColumn.lane * 25}%`,
                  left: 0,
                  height: '25%',
                  width: `${columns[virtualColumn.index]}px`,
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

export default App
