'use client'

import * as React from 'react'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { Filter, Search } from 'lucide-react'

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { OrdersListItem } from '@/lib/orders'
import type { UserRole } from '@/lib/user-roles'
import { getOrdersColumns } from './columns'

interface OrdersTableProps {
  userRole: UserRole
  data: OrdersListItem[]
}

const MODE_FILTERS = [
  { value: 'ALL', label: 'Wszystkie' },
  { value: 'INSTALLATION_ONLY', label: 'Montaże' },
  { value: 'DELIVERY_ONLY', label: 'Dostawy' },
] as const

type ModeFilter = (typeof MODE_FILTERS)[number]['value']

export function OrdersTable({ userRole, data }: OrdersTableProps) {
  const [query, setQuery] = React.useState('')
  const [modeFilter, setModeFilter] = React.useState<ModeFilter>('ALL')
  const router = useRouter()
  
  // Generuj kolumny na podstawie roli użytkownika
  const columns = React.useMemo(() => getOrdersColumns(userRole), [userRole])

  const modeCounts = React.useMemo(
    () =>
      data.reduce(
        (acc, item) => {
          if (item.executionMode === 'INSTALLATION_ONLY') {
            acc.INSTALLATION_ONLY += 1
          }
          if (item.executionMode === 'DELIVERY_ONLY') {
            acc.DELIVERY_ONLY += 1
          }
          acc.ALL += 1
          return acc
        },
        {
          ALL: 0,
          INSTALLATION_ONLY: 0,
          DELIVERY_ONLY: 0,
        } as Record<Exclude<ModeFilter, 'ALL'> | 'ALL', number>
      ),
    [data]
  )

  const filteredData = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return modeFilter === 'ALL'
        ? data
        : data.filter((item) => item.executionMode === modeFilter)
    }

    return data.filter((item) => {
      const matchesMode = modeFilter === 'ALL' ? true : item.executionMode === modeFilter
      if (!matchesMode) {
        return false
      }

      const tokens = [
        item.orderNumber,
        item.title,
        item.clientName,
        item.clientCity,
        item.partnerName,
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase())

      const modeTokens =
        item.executionMode === 'DELIVERY_ONLY'
          ? ['dostawa', 'delivery']
          : ['montaż', 'montaz', 'installation']

      return [...tokens, ...modeTokens].some((token) => token.includes(normalizedQuery))
    })
  }, [query, data, modeFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Lista zleceń</h2>
          <p className="text-sm text-muted-foreground">
            Wyszukaj klienta, numer zlecenia lub partnera, aby przejść do szczegółów workflowu.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col gap-1">
            <ButtonGroupText className="text-xs uppercase tracking-wide text-muted-foreground">
              <Filter className="size-3.5" aria-hidden /> Tryb zlecenia
            </ButtonGroupText>
            <ButtonGroup className="rounded-full border border-border/60 bg-muted/40 p-1">
              {MODE_FILTERS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setModeFilter(option.value)}
                  className={cn(
                    'rounded-full px-4 text-sm font-medium transition',
                    modeFilter === option.value
                      ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                      : 'text-muted-foreground hover:bg-background/60'
                  )}
                >
                  <span>{option.label}</span>
                  <span className="ml-2 text-xs font-semibold opacity-70">
                    {modeCounts[option.value as keyof typeof modeCounts]}
                  </span>
                </Button>
              ))}
            </ButtonGroup>
          </div>
          <div className="relative w-full sm:w-64 lg:w-72">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtruj po kliencie, numerze, partnerze..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card shadow-sm">
        {table.getRowModel().rows.length === 0 ? (
          <Empty className="border-0">
            <EmptyMedia variant="icon">
              <Search className="size-6" aria-hidden />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Brak zleceń pasujących do filtra</EmptyTitle>
              <EmptyDescription>
                Spróbuj zmienić frazę lub wyczyścić filtr, aby zobaczyć wszystkie rekordy.
              </EmptyDescription>
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
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const handleNavigate = () => {
                  router.push(`/zlecenia/${row.original.id}`)
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
                    className="cursor-pointer transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/40"
                    aria-label={`Przejdź do szczegółów zlecenia ${row.original.orderNumber ?? row.original.id}`}
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
