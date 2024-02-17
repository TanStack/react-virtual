import { createWindowVirtualizer } from '@tanstack/solid-virtual'
import { For, createSignal, onMount } from 'solid-js'

function App() {
  return (
    <div>
      <p>
        In many cases, when implementing a virtualizer with a window as the
        scrolling element, developers often find the need to specify a
        "scrollMargin." The scroll margin is a crucial setting that defines the
        space or gap between the start of the page and the edges of the list.
      </p>
      <br />
      <br />
      <h3>Window scroller</h3>
      <Example />
    </div>
  )
}

function Example() {
  let listRef!: HTMLDivElement

  const [scrollMargin, setScrollMargin] = createSignal(0)
  onMount(() => setScrollMargin(listRef.offsetTop))

  const virtualizer = createWindowVirtualizer({
    count: 10000,
    estimateSize: () => 35,
    get scrollMargin() {
      return scrollMargin()
    },
  })

  return (
    <div ref={listRef} class="List">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <For each={virtualizer.getVirtualItems()}>
          {(virtualRow) => (
            <div
              class={virtualRow.index % 2 ? 'ListItemOdd' : 'ListItemEven'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${
                  virtualRow.start - virtualizer.options.scrollMargin
                }px)`,
              }}
            >
              Row {virtualRow.index}
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

export default App
