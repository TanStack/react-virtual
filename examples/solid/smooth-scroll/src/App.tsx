import {
  VirtualizerOptions,
  createVirtualizer,
  elementScroll,
} from '@tanstack/solid-virtual'
import { For, createSignal, onMount } from 'solid-js'

function App() {
  return (
    <div>
      <p>
        This smooth scroll example uses the <code>`scrollToFn`</code> to
        implement a custom scrolling function for the methods like{' '}
        <code>`scrollToIndex`</code> and <code>`scrollToOffset`</code>
      </p>
      <br />
      <br />

      <RowVirtualizer />
    </div>
  )
}

function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t
}

function generateRandomIndex() {
  return Math.floor(Math.random() * 10000)
}

function RowVirtualizer() {
  let parentRef!: HTMLDivElement
  let time = Date.now()

  const [scrollToFn, setScrollToFn] =
    createSignal<VirtualizerOptions<any, any>['scrollToFn']>()

  onMount(() => {
    setScrollToFn(() => (offset, canSmooth, instance) => {
      const duration = 1000
      const start = parentRef.scrollTop
      const startTime = (time = Date.now())

      const run = () => {
        if (time !== startTime) return
        const now = Date.now()
        const elapsed = now - startTime
        const progress = easeInOutQuint(Math.min(elapsed / duration, 1))
        const interpolated = start + (offset - start) * progress

        if (elapsed < duration) {
          elementScroll(interpolated, canSmooth, instance)
          requestAnimationFrame(run)
        } else {
          elementScroll(interpolated, canSmooth, instance)
        }
      }

      requestAnimationFrame(run)
    })
  })

  const rowVirtualizer = createVirtualizer({
    count: 10000,
    getScrollElement: () => parentRef,
    estimateSize: () => 35,
    get scrollToFn() {
      return scrollToFn()
    },
  })

  const [randomIndex, setRandomIndex] = createSignal(generateRandomIndex())

  return (
    <>
      <div>
        <button
          onClick={() => {
            rowVirtualizer.scrollToIndex(randomIndex())
            setRandomIndex(generateRandomIndex())
          }}
        >
          Scroll To Random Index ({randomIndex()})
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

export default App
