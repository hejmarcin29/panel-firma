'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { InstallationDeliveryListItem } from '@/lib/installation-deliveries'

const formatDate = (value: Date | null | undefined) => {
  if (!value) {
    return null
  }

  return format(value, 'dd MMM yyyy', { locale: pl })
}

export const installationDeliveriesColumns: ColumnDef<InstallationDeliveryListItem>[] = [
  {
    accessorKey: 'deliveryNumber',
    header: 'Dostawa',
    cell: ({ row }) => {
      const value = row.original
      const deliveryId = value.id.slice(0, 7).toUpperCase()
      const displayNumber = value.deliveryNumber || deliveryId

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {value.orderId ? (
              <Link
                href={`/zlecenia/${value.orderId}`}
                className="transition hover:text-primary"
                onClick={(event) => event.stopPropagation()}
              >
                #{displayNumber}
              </Link>
            ) : (
              <span>#{displayNumber}</span>
            )}
            {value.requiresAdminAttention ? (
              <Badge variant="outline" className="border-red-500/60 bg-red-500/10 text-xs text-red-500">
                Alert
              </Badge>
            ) : null}
          </div>
          {value.orderReference ? (
            <span className="text-xs text-muted-foreground">Zlecenie #{value.orderReference}</span>
          ) : null}
        </div>
      )
    },
  },
  {
    accessorKey: 'clientName',
    header: 'Klient',
    cell: ({ row }) => {
      const value = row.original
      return (
        <div className="flex flex-col text-sm">
          <span className="font-medium text-foreground">{value.clientName ?? 'Klient nieznany'}</span>
          {value.installationNumber ? (
            <span className="text-xs text-muted-foreground">Montaż #{value.installationNumber}</span>
          ) : null}
        </div>
      )
    },
  },
  {
    accessorKey: 'installationStatus',
    header: 'Status montażu',
    cell: ({ row }) => {
      const label = row.original.installationStatusLabel
      return label ? (
        <Badge variant="secondary" className="rounded-full bg-muted/60 px-3 py-1 text-xs">
          {label}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">Brak danych</span>
      )
    },
  },
  {
    accessorKey: 'stage',
    header: 'Status dostawy',
    cell: ({ row }) => (
      <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/5 px-3 py-1 text-xs text-primary">
        {row.original.stageLabel}
      </Badge>
    ),
  },
  {
    accessorKey: 'scheduledDate',
    header: 'Planowana data',
    cell: ({ getValue }) => {
      const value = getValue<Date | null>()
      const formatted = formatDate(value)
      return formatted ? (
        <span className="text-sm font-medium text-foreground">{formatted}</span>
      ) : (
        <span className="text-xs text-muted-foreground">Nie ustawiono</span>
      )
    },
  },
  {
    accessorKey: 'installationStart',
    header: 'Okno montażu',
    cell: ({ row }) => {
      const start = formatDate(row.original.installationStart)
      const end = formatDate(row.original.installationEnd)

      if (!start && !end) {
        return <span className="text-xs text-muted-foreground">Brak harmonogramu</span>
      }

      return (
        <div className="flex flex-col text-xs">
          {start ? <span className="font-medium text-foreground">Start: {start}</span> : null}
          {end ? <span className="text-muted-foreground">Koniec: {end}</span> : null}
        </div>
      )
    },
  },
]
