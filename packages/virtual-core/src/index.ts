import observeRect from '@reach/observe-rect'
import { memo } from './utils'

export * from './utils'

//

type ScrollAlignment = 'start' | 'center' | 'end' | 'auto'

interface ScrollToOptions {
  align: ScrollAlignment
}

type ScrollToOffsetOptions = ScrollToOptions

type ScrollToIndexOptions = ScrollToOptions

export interface Range {
  startIndex: number
  endIndex: number
  overscan: number
  count: number
}

type Key = number | string

interface Item {
  key: Key
  index: number
  start: number
  end: number
  size: number
}

interface Rect {
  width: number
  height: number
}

export interface VirtualItem<TItemElement> extends Item {
  measureElement: (el: TItemElement | null) => void
}

//

export const defaultKeyExtractor = (index: number) => index

export const defaultRangeExtractor = (range: Range) => {
  const start = Math.max(range.startIndex - range.overscan, 0)
  const end = Math.min(range.endIndex + range.overscan, range.count - 1)

  const arr = []

  for (let i = start; i <= end; i++) {
    arr.push(i)
  }

  return arr
}

export const observeElementRect = (
  instance: Virtualizer<any, any>,
  cb: (rect: Rect) => void,
) => {
  const observer = observeRect(instance.scrollElement as Element, (rect) => {
    cb(rect)
  })

  if (!instance.scrollElement) {
    return
  }

  cb(instance.scrollElement.getBoundingClientRect())

  observer.observe()

  return () => {
    observer.unobserve()
  }
}

export const observeWindowRect = (
  instance: Virtualizer<any, any>,
  cb: (rect: Rect) => void,
) => {
  const onResize = () => {
    cb({
      width: instance.scrollElement.innerWidth,
      height: instance.scrollElement.innerHeight,
    })
  }

  if (!instance.scrollElement) {
    return
  }

  onResize()

  instance.scrollElement.addEventListener('resize', onResize, {
    capture: false,
    passive: true,
  })

  return () => {
    instance.scrollElement.removeEventListener('resize', onResize)
  }
}

export const observeElementOffset = (
  instance: Virtualizer<any, any>,
  cb: (offset: number) => void,
) => {
  const onScroll = () =>
    cb(
      instance.scrollElement[
        instance.options.horizontal ? 'scrollLeft' : 'scrollTop'
      ],
    )

  if (!instance.scrollElement) {
    return
  }

  onScroll()

  instance.scrollElement.addEventListener('scroll', onScroll, {
    capture: false,
    passive: true,
  })

  return () => {
    instance.scrollElement.removeEventListener('scroll', onScroll)
  }
}

export const observeWindowOffset = (
  instance: Virtualizer<any, any>,
  cb: (offset: number) => void,
) => {
  const onScroll = () =>
    cb(
      instance.scrollElement[
        instance.options.horizontal ? 'scrollX' : 'scrollY'
      ],
    )

  if (!instance.scrollElement) {
    return
  }

  onScroll()

  instance.scrollElement.addEventListener('scroll', onScroll, {
    capture: false,
    passive: true,
  })

  return () => {
    instance.scrollElement.removeEventListener('scroll', onScroll)
  }
}

export const measureElement = (
  element: unknown,
  instance: Virtualizer<any, any>,
) => {
  return (element as Element).getBoundingClientRect()[
    instance.options.horizontal ? 'width' : 'height'
  ]
}

export const windowScroll = (
  offset: number,
  canSmooth: boolean,
  instance: Virtualizer<any, any>,
) => {
  ;(instance.scrollElement as Window)?.scrollTo({
    [instance.options.horizontal ? 'left' : 'top']: offset,
    behavior: canSmooth ? 'smooth' : undefined,
  })
}

export const elementScroll = (
  offset: number,
  canSmooth: boolean,
  instance: Virtualizer<any, any>,
) => {
  ;(instance.scrollElement as Element)?.scrollTo({
    [instance.options.horizontal ? 'left' : 'top']: offset,
    behavior: canSmooth ? 'smooth' : undefined,
  })
}

export interface VirtualizerOptions<
  TScrollElement = unknown,
  TItemElement = unknown,
> {
  // Required from the user
  count: number
  getScrollElement: () => TScrollElement
  estimateSize: (index: number) => number

  // Required from the framework adapter (but can be overridden)
  scrollToFn: (
    offset: number,
    canSmooth: boolean,
    instance: Virtualizer<TScrollElement, TItemElement>,
  ) => void
  observeElementRect: (
    instance: Virtualizer<TScrollElement, TItemElement>,
    cb: (rect: Rect) => void,
  ) => void | (() => void)
  observeElementOffset: (
    instance: Virtualizer<TScrollElement, TItemElement>,
    cb: (offset: number) => void,
  ) => void | (() => void)

  // Optional
  debug?: any
  initialRect?: Rect
  onChange?: (instance: Virtualizer<TScrollElement, TItemElement>) => void
  measureElement?: (
    el: TItemElement,
    instance: Virtualizer<TScrollElement, TItemElement>,
  ) => number
  overscan?: number
  horizontal?: boolean
  paddingStart?: number
  paddingEnd?: number
  scrollPaddingStart?: number
  scrollPaddingEnd?: number
  initialOffset?: number
  getItemKey?: (index: number) => Key
  rangeExtractor?: (range: Range) => number[]
  enableSmoothScroll?: boolean
}

export class Virtualizer<TScrollElement = unknown, TItemElement = unknown> {
  private unsubs: (void | (() => void))[] = []
  options!: Required<VirtualizerOptions<TScrollElement, TItemElement>>
  scrollElement: TScrollElement | null = null
  private measurementsCache: Item[] = []
  private itemMeasurementsCache: Record<Key, number> = {}
  private pendingMeasuredCacheIndexes: number[] = []
  private scrollRect: Rect
  private scrollOffset: number
  private destinationOffset: undefined | number
  private scrollCheckFrame!: ReturnType<typeof setTimeout>
  private measureElementCache: Record<
    number,
    (measurableItem: TItemElement | null) => void
  > = {}

  constructor(opts: VirtualizerOptions<TScrollElement, TItemElement>) {
    this.setOptions(opts)
    this.scrollRect = this.options.initialRect
    this.scrollOffset = this.options.initialOffset
  }

  setOptions = (opts: VirtualizerOptions<TScrollElement, TItemElement>) => {
    Object.entries(opts).forEach(([key, value]) => {
      if (typeof value === 'undefined') delete (opts as any)[key]
    })

    this.options = {
      debug: false,
      initialOffset: 0,
      overscan: 1,
      paddingStart: 0,
      paddingEnd: 0,
      scrollPaddingStart: 0,
      scrollPaddingEnd: 0,
      horizontal: false,
      getItemKey: defaultKeyExtractor,
      rangeExtractor: defaultRangeExtractor,
      enableSmoothScroll: true,
      onChange: () => {},
      measureElement,
      initialRect: { width: 0, height: 0 },
      ...opts,
    }
  }

  private notify = () => {
    this.options.onChange?.(this)
  }

  private cleanup = () => {
    this.unsubs.filter(Boolean).forEach((d) => d!())
    this.unsubs = []
  }

  _didMount = () => {
    return () => {
      this.cleanup()
    }
  }

  _willUpdate = () => {
    const scrollElement = this.options.getScrollElement()

    if (this.scrollElement !== scrollElement) {
      this.cleanup()

      this.scrollElement = scrollElement

      this.unsubs.push(
        this.options.observeElementRect(this, (rect) => {
          this.scrollRect = rect
          this.notify()
        }),
      )

      this.unsubs.push(
        this.options.observeElementOffset(this, (offset) => {
          this.scrollOffset = offset
          this.notify()
        }),
      )
    }
  }

  private getSize = () => {
    return this.scrollRect[this.options.horizontal ? 'width' : 'height']
  }

  private getMeasurements = memo(
    () => [
      this.options.count,
      this.options.paddingStart,
      this.options.getItemKey,
      this.itemMeasurementsCache,
    ],
    (count, paddingStart, getItemKey, measurementsCache) => {
      const min =
        this.pendingMeasuredCacheIndexes.length > 0
          ? Math.min(...this.pendingMeasuredCacheIndexes)
          : 0
      this.pendingMeasuredCacheIndexes = []

      const measurements = this.measurementsCache.slice(0, min)

      for (let i = min; i < count; i++) {
        const key = getItemKey(i)
        const measuredSize = measurementsCache[key]
        const start = measurements[i - 1]
          ? measurements[i - 1]!.end
          : paddingStart
        const size =
          typeof measuredSize === 'number'
            ? measuredSize
            : this.options.estimateSize(i)
        const end = start + size
        measurements[i] = { index: i, start, size, end, key }
      }

      this.measurementsCache = measurements
      return measurements
    },
    {
      key: process.env.NODE_ENV === 'development' && 'getMeasurements',
      debug: () => this.options.debug,
    },
  )

  private calculateRange = memo(
    () => [this.getMeasurements(), this.getSize(), this.scrollOffset],
    (measurements, outerSize, scrollOffset) => {
      return calculateRange({
        measurements,
        outerSize,
        scrollOffset,
      })
    },
    {
      key: process.env.NODE_ENV === 'development' && 'calculateRange',
      debug: () => this.options.debug,
    },
  )

  private getIndexes = memo(
    () => [
      this.options.rangeExtractor,
      this.calculateRange(),
      this.options.overscan,
      this.options.count,
    ],
    (rangeExtractor, range, overscan, count) => {
      return rangeExtractor({
        ...range,
        overscan,
        count: count,
      })
    },
    {
      key: process.env.NODE_ENV === 'development' && 'getIndexes',
    },
  )

  getVirtualItems = memo(
    () => [
      this.getIndexes(),
      this.getMeasurements(),
      this.options.measureElement,
    ],
    (indexes, measurements, measureElement) => {
      const makeMeasureElement =
        (index: number) => (measurableItem: TItemElement | null) => {
          const item = this.measurementsCache[index]!

          if (!measurableItem) {
            return
          }

          const measuredItemSize = measureElement(measurableItem, this)
          const itemSize = this.itemMeasurementsCache[item.key] ?? item.size

          if (measuredItemSize !== itemSize) {
            if (item.start < this.scrollOffset) {
              if (
                process.env.NODE_ENV === 'development' &&
                this.options.debug
              ) {
                console.info('correction', measuredItemSize - itemSize)
              }

              if (!this.destinationOffset) {
                this._scrollToOffset(
                  this.scrollOffset + (measuredItemSize - itemSize),
                  false,
                )
              }
            }

            this.pendingMeasuredCacheIndexes.push(index)
            this.itemMeasurementsCache = {
              ...this.itemMeasurementsCache,
              [item.key]: measuredItemSize,
            }
            this.notify()
          }
        }

      const virtualItems: VirtualItem<TItemElement>[] = []

      const currentMeasureElements: typeof this.measureElementCache = {}

      for (let k = 0, len = indexes.length; k < len; k++) {
        const i = indexes[k]!
        const measurement = measurements[i]!

        const item = {
          ...measurement,
          measureElement: (currentMeasureElements[i] =
            this.measureElementCache[i] ?? makeMeasureElement(i)),
        }
        virtualItems.push(item)
      }

      this.measureElementCache = currentMeasureElements

      return virtualItems
    },
    {
      key: process.env.NODE_ENV === 'development' && 'getIndexes',
    },
  )

  scrollToOffset = (
    toOffset: number,
    { align }: ScrollToOffsetOptions = { align: 'start' },
  ) => {
    const attempt = () => {
      const offset = this.scrollOffset
      const size = this.getSize()

      if (align === 'auto') {
        if (toOffset <= offset) {
          align = 'start'
        } else if (toOffset >= offset + size) {
          align = 'end'
        } else {
          align = 'start'
        }
      }

      if (align === 'start') {
        this._scrollToOffset(toOffset, true)
      } else if (align === 'end') {
        this._scrollToOffset(toOffset - size, true)
      } else if (align === 'center') {
        this._scrollToOffset(toOffset - size / 2, true)
      }
    }

    attempt()
    requestAnimationFrame(() => {
      attempt()
    })
  }

  scrollToIndex = (
    index: number,
    { align, ...rest }: ScrollToIndexOptions = { align: 'auto' },
  ) => {
    const measurements = this.getMeasurements()
    const offset = this.scrollOffset
    const size = this.getSize()
    const { count } = this.options

    const measurement = measurements[Math.max(0, Math.min(index, count - 1))]

    if (!measurement) {
      return
    }

    if (align === 'auto') {
      if (measurement.end >= offset + size - this.options.scrollPaddingEnd) {
        align = 'end'
      } else if (
        measurement.start <=
        offset + this.options.scrollPaddingStart
      ) {
        align = 'start'
      } else {
        return
      }
    }

    const toOffset =
      align === 'end'
        ? measurement.end + this.options.scrollPaddingEnd
        : measurement.start - this.options.scrollPaddingStart

    this.scrollToOffset(toOffset, { align, ...rest })
  }

  getTotalSize = () =>
    (this.getMeasurements()[this.options.count - 1]?.end ||
      this.options.paddingStart) + this.options.paddingEnd

  private _scrollToOffset = (offset: number, canSmooth: boolean) => {
    clearTimeout(this.scrollCheckFrame)

    this.destinationOffset = offset
    this.options.scrollToFn(
      offset,
      this.options.enableSmoothScroll && canSmooth,
      this,
    )

    let scrollCheckFrame: ReturnType<typeof setTimeout>

    const check = () => {
      let lastOffset = this.scrollOffset
      this.scrollCheckFrame = scrollCheckFrame = setTimeout(() => {
        if (this.scrollCheckFrame !== scrollCheckFrame) {
          return
        }

        if (this.scrollOffset === lastOffset) {
          this.destinationOffset = undefined
          return
        }
        lastOffset = this.scrollOffset
        check()
      }, 100)
    }

    check()
  }

  measure = () => {
    this.itemMeasurementsCache = {}
    this.notify()
  }
}

const findNearestBinarySearch = (
  low: number,
  high: number,
  getCurrentValue: (i: number) => number,
  value: number,
) => {
  while (low <= high) {
    const middle = ((low + high) / 2) | 0
    const currentValue = getCurrentValue(middle)

    if (currentValue < value) {
      low = middle + 1
    } else if (currentValue > value) {
      high = middle - 1
    } else {
      return middle
    }
  }

  if (low > 0) {
    return low - 1
  } else {
    return 0
  }
}

function calculateRange({
  measurements,
  outerSize,
  scrollOffset,
}: {
  measurements: Item[]
  outerSize: number
  scrollOffset: number
}) {
  const count = measurements.length - 1
  const getOffset = (index: number) => measurements[index]!.start

  const startIndex = findNearestBinarySearch(0, count, getOffset, scrollOffset)
  let endIndex = startIndex

  while (
    endIndex < count &&
    measurements[endIndex]!.end < scrollOffset + outerSize
  ) {
    endIndex++
  }

  return { startIndex, endIndex }
}
