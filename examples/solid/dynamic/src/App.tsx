import { faker } from '@faker-js/faker'
import {
  createVirtualizer,
  createWindowVirtualizer,
} from '@tanstack/solid-virtual'
import { For, Show, createMemo, createSignal, onMount } from 'solid-js'

const randomNumber = (min: number, max: number) =>
  faker.datatype.number({ min, max })

const sentences = new Array(10000)
  .fill(true)
  .map(() => faker.lorem.sentence(randomNumber(20, 70)))

function App() {
  const pathname = location.pathname

  return (
    <div>
      <p>
        These components are using <strong>dynamic</strong> sizes. This means
        that each element's exact dimensions are unknown when rendered. An
        estimated dimension is used to get an a initial measurement, then this
        measurement is readjusted on the fly as each element is rendered.
      </p>
      <nav>
        <ul>
          <li>
            <a href="/">List</a>
          </li>
          <li>
            <a href="/window-list">List - window as scroller</a>
          </li>
          <li>
            <a href="/columns">Column</a>
          </li>
          <li>
            <a href="/grid">Grid</a>
          </li>
        </ul>
      </nav>
      <Show when={pathname === '/'}>
        <RowVirtualizerDynamic />
      </Show>
      <Show when={pathname === '/window-list'}>
        <RowVirtualizerDynamicWindow />
      </Show>
      <Show when={pathname === '/columns'}>
        <ColumnVirtualizerDynamic />
      </Show>
      <Show when={pathname === '/grid'}>
        <GridVirtualizerVariable />
      </Show>
    </div>
  )
}

function RowVirtualizerDynamic() {
  let parentRef!: HTMLDivElement

  const count = sentences.length

  const virtualizer = createVirtualizer({
    count,
    getScrollElement: () => parentRef,
    estimateSize: () => 45,
  })

  const items = virtualizer.getVirtualItems()

  return (
    <div>
      <button onClick={() => virtualizer.scrollToIndex(0)}>
        scroll to the top
      </button>
      <span style={{ padding: '0 4px' }} />
      <button onClick={() => virtualizer.scrollToIndex(count / 2)}>
        scroll to the middle
      </button>
      <span style={{ padding: '0 4px' }} />
      <button onClick={() => virtualizer.scrollToIndex(count - 1)}>
        scroll to the end
      </button>
      <hr />
      <div
        ref={parentRef}
        class="List"
        style={{
          height: '400px',
          width: '400px',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${items[0]?.start ?? 0}px)`,
            }}
          >
            <For each={items}>
              {(virtualRow) => {
                let ref!: HTMLDivElement
                onMount(() => virtualizer.measureElement(ref))

                return (
                  <div
                    ref={ref}
                    data-index={virtualRow.index}
                    class={
                      virtualRow.index % 2 ? 'ListItemOdd' : 'ListItemEven'
                    }
                  >
                    <div style={{ padding: '10px 0' }}>
                      <div>Row {virtualRow.index}</div>
                      <div>{sentences[virtualRow.index]}</div>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}

function RowVirtualizerDynamicWindow() {
  let listRef!: HTMLDivElement

  const [scrollMargin, setScrollMargin] = createSignal(0)
  onMount(() => setScrollMargin(listRef.offsetTop))

  const virtualizer = createWindowVirtualizer({
    count: sentences.length,
    estimateSize: () => 45,
    get scrollMargin() {
      return scrollMargin()
    },
  })

  const items = virtualizer.getVirtualItems()

  return (
    <div
      ref={listRef}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${
            (items[0]?.start ?? 0) - virtualizer.options.scrollMargin
          }px)`,
        }}
      >
        <For each={items}>
          {(virtualRow) => {
            let ref!: HTMLDivElement
            onMount(() => virtualizer.measureElement(ref))

            return (
              <div
                ref={ref}
                data-index={virtualRow.index}
                class={virtualRow.index % 2 ? 'ListItemOdd' : 'ListItemEven'}
              >
                <div style={{ padding: '10px 0' }}>
                  <div>Row {virtualRow.index}</div>
                  <div>{sentences[virtualRow.index]}</div>
                </div>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

function ColumnVirtualizerDynamic() {
  let parentRef!: HTMLDivElement

  const virtualizer = createVirtualizer({
    horizontal: true,
    count: sentences.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 45,
  })

  return (
    <div
      ref={parentRef}
      class="List"
      style={{
        width: '400px',
        height: '400px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          width: `${virtualizer.getTotalSize()}px`,
          height: '100%',
          position: 'relative',
        }}
      >
        <For each={virtualizer.getVirtualItems()}>
          {(virtualColumn) => {
            let ref!: HTMLDivElement
            onMount(() => virtualizer.measureElement(ref))

            return (
              <div
                ref={ref}
                data-index={virtualColumn.index}
                class={virtualColumn.index % 2 ? 'ListItemOdd' : 'ListItemEven'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  transform: `translateX(${virtualColumn.start}px)`,
                }}
              >
                <div
                  style={{
                    width: `${sentences[virtualColumn.index].length}px`,
                  }}
                >
                  <div>Column {virtualColumn.index}</div>
                  <div>{sentences[virtualColumn.index]}</div>
                </div>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

const generateColumns = (count: number) => {
  return new Array(count).fill(0).map((_, i) => {
    const key: string = i.toString()
    return {
      key,
      name: `Column ${i}`,
      width: randomNumber(75, 300),
    }
  })
}

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  count = 300,
) => {
  return new Array(count).fill(0).map((_, rowIndex) =>
    columns.reduce<string[]>((acc, _, colIndex) => {
      // simulate dynamic size cells
      const val = faker.lorem.lines(((rowIndex + colIndex) % 10) + 1)

      acc.push(val)

      return acc
    }, []),
  )
}

function GridVirtualizerVariable() {
  let parentRef!: HTMLDivElement

  const [scrollMargin, setScrollMargin] = createSignal(0)
  onMount(() => setScrollMargin(parentRef.offsetTop))

  const columns = generateColumns(30)
  const data = generateData(columns)

  const getColumnWidth = (index: number) => columns[index].width

  const virtualizer = createWindowVirtualizer({
    count: data.length,
    estimateSize: () => 350,
    overscan: 5,
    get scrollMargin() {
      return scrollMargin()
    },
  })

  const columnVirtualizer = createVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => parentRef,
    estimateSize: getColumnWidth,
    overscan: 5,
  })

  const columnItems = columnVirtualizer.getVirtualItems()

  const position = createMemo(() => {
    if (columnItems.length === 0) return [0, 0]
    return [
      columnItems[0].start,
      columnVirtualizer.getTotalSize() -
        columnItems[columnItems.length - 1].end,
    ]
  })

  return (
    <div
      ref={parentRef}
      style={{ 'overflow-y': 'auto', border: '1px solid #c8c8c8' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        <For each={virtualizer.getVirtualItems()}>
          {(row) => {
            let ref!: HTMLDivElement
            onMount(() => virtualizer.measureElement(ref))

            return (
              <div
                ref={ref}
                data-index={row.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: `translateY(${
                    row.start - virtualizer.options.scrollMargin
                  }px)`,
                  display: 'flex',
                }}
              >
                <div style={{ width: `${position()[0]}px` }} />
                <For each={columnVirtualizer.getVirtualItems()}>
                  {(column) => (
                    <div
                      style={{
                        'min-height':
                          row.index === 0 ? '50px' : `${row.size}px`,
                        width: `${getColumnWidth(column.index)}px`,
                        'border-bottom': '1px solid #c8c8c8',
                        'border-right': '1px solid #c8c8c8',
                        padding: '7px 12px',
                      }}
                    >
                      <Show
                        when={row.index !== 0}
                        fallback={<div>{columns[column.index].name}</div>}
                      >
                        <div>{data[row.index][column.index]}</div>
                      </Show>
                    </div>
                  )}
                </For>
                <div style={{ width: `${position()[1]}px` }} />
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

export default App
