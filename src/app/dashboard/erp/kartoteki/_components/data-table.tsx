"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  currentPage: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  currentPage,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = React.useState(searchParams.get("q") || "")
  const debouncedSearch = useDebounce(search, 500)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pageCount,
  })

  // Simple debounce effect
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedSearch) {
      params.set("q", debouncedSearch)
    } else {
      params.delete("q")
    }
    params.set("page", "1") // Reset to first page on search
    router.push(`?${params.toString()}`)
  }, [debouncedSearch, router, searchParams])

  const handlePageChange = (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", newPage.toString())
      router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4">
        <Input
          placeholder="Szukaj po nazwie lub SKU..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Brak wyników.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Poprzednia
        </Button>
        <div className="text-sm text-muted-foreground">
            Strona {currentPage} z {pageCount}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
        >
          Następna
        </Button>
      </div>
    </div>
  )
}
