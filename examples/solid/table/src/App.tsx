import {
  ColumnDef,
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/solid-table'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { makeData, Person } from './makeData'

const data = makeData(50_000)

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
  },
  {
    accessorKey: 'firstName',
    cell: (info) => info.getValue(),
  },
  {
    accessorFn: (row) => row.lastName,
    id: 'lastName',
    cell: (info) => info.getValue(),
    header: () => 'Last Name',
  },
  {
    accessorKey: 'age',
    header: () => 'Age',
    size: 50,
  },
  {
    accessorKey: 'visits',
    header: () => 'Visits',
    size: 50,
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'progress',
    header: 'Profile Progress',
    size: 80,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: (info) => info.getValue<Date>().toLocaleString(),
  },
]

function App() {
  const [sorting, setSorting] = createSignal<SortingState>([])

  const table = createSolidTable({
    data,
    columns,
    state: {
      get sorting() {
        return sorting()
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  })

  let parentRef!: HTMLDivElement

  const rows = createMemo(() => table.getRowModel().rows)

  const rowVirtualizer = createVirtualizer({
    get count() {
      return rows().length
    },
    getScrollElement: () => parentRef,
    estimateSize: () => 34,
    overscan: 5,
  })

  return (
    <div>
      <p>
        For tables, the basis for the offset of the translate css function is
        from the row's initial position itself. Because of this, we need to
        calculate the translateY pixel count different and base it off the the
        index.
      </p>

      <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          <table>
            <thead>
              <For each={table.getHeaderGroups()}>
                {(headerGroup) => (
                  <tr>
                    <For each={headerGroup.headers}>
                      {(header) => (
                        <th
                          colSpan={header.colSpan}
                          style={{ width: `${header.getSize()}px` }}
                        >
                          <Show when={!header.isPlaceholder}>
                            <div
                              class="text-left"
                              classList={{
                                'cursor-pointer select-none':
                                  header.column.getCanSort(),
                              }}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          </Show>
                        </th>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </thead>
            <tbody>
              <For each={rowVirtualizer.getVirtualItems()}>
                {(virtualRow, index) => (
                  <tr
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${
                        virtualRow.start - index() * virtualRow.size
                      }px)`,
                    }}
                  >
                    <For each={rows()[virtualRow.index].getVisibleCells()}>
                      {(cell) => (
                        <td>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default App
