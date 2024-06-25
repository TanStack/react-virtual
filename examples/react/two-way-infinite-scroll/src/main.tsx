import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
  UseInfiniteQueryResult,
  useInfiniteQuery,
} from '@tanstack/react-query'
import './index.css'
import { useWindowVirtualizer } from '@tanstack/react-virtual'

const queryClient = new QueryClient()

interface Page {
  rows: string[]
  nextOffset: number
}
async function fetchServerPage(
  limit: number,
  offset: number = 0,
): Promise<Page> {
  const rows = new Array(limit)
    .fill(0)
    .map((e, i) => `Async loaded row #${i + offset * limit}`)

  await new Promise((r) => setTimeout(r, 500))

  return { rows, nextOffset: offset + 1 }
}

function App() {
  const SCROLL_MARGIN = 200
  const MAX_PAGE_LENGTH = 5
  const ITEM_HEIGHT = 100
  const SENTRY_ITEM_LENGTH = 2
  const [dataPerPagePrefixSum, setDataPerPagePrefixSum] = useState<number[]>([
    0,
  ])
  const {
    status,
    data,
    error,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
    hasPreviousPage,
  }: UseInfiniteQueryResult<
    InfiniteData<Page, number>,
    Error
  > = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: async ({ pageParam }) => {
      const res = await fetchServerPage(10, pageParam)
      if (dataPerPagePrefixSum.length <= pageParam + 1) {
        setDataPerPagePrefixSum((prev) => [
          ...prev,
          (prev.slice(-1)[0] ?? 0) + res.rows.length,
        ])
      }
      return res
    },
    initialPageParam: 0,
    getNextPageParam: (_, __, lastPageParam) => {
      return lastPageParam + 1
    },
    getPreviousPageParam: (_, __, firstPageParam) => {
      if (firstPageParam <= 0) {
        return null
      }
      return firstPageParam - 1
    },
    maxPages: MAX_PAGE_LENGTH,
  })

  const allRows = data ? data.pages.flatMap((d) => d.rows) : []
  const minPageParam = data?.pageParams[0] ?? 0
  const maxPageParam = data?.pageParams.slice(-1)[0] ?? 0
  const minPageDataLength = dataPerPagePrefixSum[minPageParam] ?? 0
  const maxPageDataLength = dataPerPagePrefixSum[maxPageParam] ?? 0
  const maxDataLength = dataPerPagePrefixSum.slice(-1)[0] ?? 0
  const rowVirtualizer = useWindowVirtualizer({
    count: maxDataLength,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
    scrollMargin: SCROLL_MARGIN,
  })
  const virtualItems = rowVirtualizer.getVirtualItems()
  React.useEffect(() => {
    const firstItemKey = virtualItems[0]?.key as number | undefined
    const lastItemKey = virtualItems.slice(-1)[0]?.key as number | undefined
    if (
      firstItemKey &&
      firstItemKey < minPageDataLength + SENTRY_ITEM_LENGTH &&
      !isFetchingPreviousPage &&
      hasPreviousPage
    ) {
      fetchPreviousPage()
    }
    if (
      lastItemKey &&
      lastItemKey > maxPageDataLength - SENTRY_ITEM_LENGTH &&
      !isFetchingNextPage &&
      hasNextPage
    ) {
      fetchNextPage()
    }
  }, [
    virtualItems,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    minPageDataLength,
  ])
  return (
    <div>
      <p
        style={{
          height: SCROLL_MARGIN,
        }}
      >
        This code uses React Query and React Virtual to implement an interactive
        infinite scroll feature. Its main features include setting maxPages to
        limit the maximum number of pages, and fetching data from the server for
        the previous or next page when the user moves the scroll up or down.
        This saves memory and render costs.
      </p>

      {status === 'pending' ? (
        <p>Loading...</p>
      ) : status === 'error' ? (
        <span>Error: {(error as Error).message}</span>
      ) : (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const post = allRows[virtualRow.index - minPageDataLength]

            return (
              <div
                key={virtualRow.index}
                className={
                  virtualRow.index % 2 ? 'ListItemOdd' : 'ListItemEven'
                }
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {post == null ? 'loading' : post}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById('root'),
)
