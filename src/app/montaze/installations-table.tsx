'use client'

import * as React from 'react'
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { InstallationsListItem } from '@/lib/installations'

interface InstallationsTableProps {
  columns: ColumnDef<InstallationsListItem>[]
  data: InstallationsListItem[]
  initialQuery?: string
}

export function InstallationsTable({ columns, data, initialQuery = '' }: InstallationsTableProps) {
  const [query, setQuery] = React.useState(initialQuery)
  const router = useRouter()

  React.useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const filteredData = React.useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return data
    }

    return data.filter((item) => {
      const tokens = [
        item.installationNumber,
        item.clientName ?? undefined,
        item.clientCity ?? undefined,
        item.orderNumber ?? undefined,
        item.assignedInstallerName ?? undefined,
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase())

      return tokens.some((token) => token.includes(normalized))
    })
  }, [query, data])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Harmonogram montaży</h2>
          <p className="text-sm text-muted-foreground">
            Kliknij wybrany montaż, aby przejść do szczegółów zlecenia i wprowadzić zmiany.
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtruj po numerze montażu, kliencie, lokalizacji..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card shadow-sm">
        {table.getRowModel().rows.length === 0 ? (
          <Empty className="border-0">
            <EmptyMedia variant="icon">
              <Search className="size-6" aria-hidden />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Brak montaży pasujących do filtra</EmptyTitle>
              <EmptyDescription>Spróbuj innego słowa kluczowego lub usuń filtr.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Wyczyść filtr..."
                className="max-w-xs"
              />
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const handleNavigate = () => {
                  router.push(`/zlecenia/${row.original.orderId}`)
                }

                const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleNavigate()
                  }
                }

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={handleNavigate}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    className="cursor-pointer transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring focus-visible:ring-emerald-500/40"
                    aria-label={`Przejdź do zlecenia powiązanego z montażem ${row.original.installationNumber}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
