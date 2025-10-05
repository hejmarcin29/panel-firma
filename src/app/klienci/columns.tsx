"use client"

import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpRight, MapPin, UsersRound } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { ClientsListItem } from '@/lib/clients'

const numberFormatter = new Intl.NumberFormat('pl-PL')

export const clientsColumns: ColumnDef<ClientsListItem>[] = [
  {
    accessorKey: 'fullName',
    header: 'Klient',
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">#{row.original.clientNumber}</p>
        <p className="font-medium text-foreground">{row.original.fullName}</p>
        {row.original.city ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            {row.original.city}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: 'partnerName',
    header: 'Partner',
    cell: ({ row }) =>
      row.original.partnerName ? (
        <div className="flex items-center gap-2 text-sm">
          <UsersRound className="size-4 text-muted-foreground" aria-hidden />
          <span>{row.original.partnerName}</span>
        </div>
      ) : (
        <Badge variant="outline" className="text-xs">Bez partnera</Badge>
      ),
  },
  {
    accessorKey: 'totalOrders',
    header: 'Zlecenia',
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <span className="font-semibold text-foreground">{numberFormatter.format(row.original.totalOrders)}</span>
        <span className="text-xs text-muted-foreground">Aktywne: {numberFormatter.format(row.original.openOrders)}</span>
      </div>
    ),
  },
  {
    accessorKey: 'lastOrderAt',
    header: 'Ostatnia aktywność',
    cell: ({ row }) => {
      if (!row.original.lastOrderAt) {
        return <span className="text-sm text-muted-foreground">Brak danych</span>
      }

      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(row.original.lastOrderAt, { addSuffix: true, locale: pl })}
        </span>
      )
    },
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => (
      <Link
        href={`/klienci/${row.original.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Szczegóły
        <ArrowUpRight className="size-4" aria-hidden />
      </Link>
    ),
  },
]
