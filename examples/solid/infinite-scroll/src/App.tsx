import { createInfiniteQuery } from '@tanstack/solid-query'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { For, Show, createEffect, createMemo } from 'solid-js'

async function fetchServerPage(limit: number, offset: number = 0) {
  const rows = new Array(limit)
    .fill(0)
    .map((_, i) => `Async loaded row #${i + offset * limit}`)

  await new Promise((r) => setTimeout(r, 500))

  return { rows, nextOffset: offset + 1 }
}

function App() {
  let parentRef!: HTMLDivElement

  const query = createInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchServerPage(10, pageParam),
    getNextPageParam: (_, groups) => groups.length,
    initialPageParam: 0,
  }))

  const allRows = createMemo(() =>
    query.data ? query.data.pages.flatMap((d) => d.rows) : [],
  )

  const rowVirtualizer = createVirtualizer({
    get count() {
      return query.hasNextPage ? allRows().length + 1 : allRows().length
    },
    getScrollElement: () => parentRef,
    estimateSize: () => 100,
    overscan: 5,
  })

  createEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse()
    if (!lastItem) return

    if (
      lastItem.index >= allRows().length - 1 &&
      query.hasNextPage &&
      !query.isFetchingNextPage
    ) {
      query.fetchNextPage()
    }
  })

  return (
    <div>
      <p>
        This infinite scroll example uses Solid Query's createInfiniteQuery
        function to fetch infinite data from a posts endpoint and then a
        rowVirtualizer is used along with a loader-row placed at the bottom of
        the list to trigger the next page to load.
      </p>
      <br />
      <br />

      <Show when={query.isLoading}>
        <p>Loading...</p>
      </Show>

      <Show when={query.isError}>
        <span>Error: {query.error?.message}</span>
      </Show>

      <Show when={query.isSuccess}>
        <div
          ref={parentRef}
          class="List"
          style={{
            height: '500px',
            width: '100%',
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
                  <Show
                    when={virtualRow.index > allRows().length - 1}
                    fallback={allRows()[virtualRow.index]}
                  >
                    <Show
                      when={query.hasNextPage}
                      fallback="Nothing more to load"
                    >
                      Loading more...
                    </Show>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={query.isFetching && !query.isFetchingNextPage}>
        <p>Background Updating...</p>
      </Show>
    </div>
  )
}

export default App
