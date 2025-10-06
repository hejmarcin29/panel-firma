'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { OrdersListItem } from '@/lib/orders'
import { orderStageBadgeClasses, orderStageLabels } from '@/lib/order-stage'

const numberFormatter = new Intl.NumberFormat('pl-PL', {
  maximumFractionDigits: 1,
})

export const ordersColumns: ColumnDef<OrdersListItem>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Zlecenie',
    cell: ({ row }) => {
      const value = row.original
      const displayNumber = value.orderNumber ?? value.id.slice(0, 7)

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Link
              href={`/zlecenia/${value.id}`}
              className="transition hover:text-primary"
              onClick={(event) => event.stopPropagation()}
            >
              #{displayNumber}
            </Link>
            {value.requiresAdminAttention ? (
              <Badge variant="outline" className="border-red-500/50 text-xs text-red-500">
                Wymaga uwagi
              </Badge>
            ) : null}
          </div>
          {value.title ? (
            <span className="text-xs text-muted-foreground">{value.title}</span>
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
          <span className="font-medium text-foreground">{value.clientName}</span>
          {(value.clientCity ?? value.partnerName) ? (
            <span className="text-xs text-muted-foreground">
              {[value.clientCity, value.partnerName].filter(Boolean).join(' • ')}
            </span>
          ) : null}
        </div>
      )
    },
  },
  {
    accessorKey: 'stage',
    header: 'Status',
    cell: ({ row }) => {
      const stage = row.original.stage
      return (
        <Badge
          variant="secondary"
          className={orderStageBadgeClasses[stage] ?? 'bg-muted text-foreground'}
        >
          {orderStageLabels[stage]}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'executionMode',
    header: 'Tryb',
    cell: ({ row }) => {
      const mode = row.original.executionMode
      const isDeliveryOnly = mode === 'DELIVERY_ONLY'
      const label = isDeliveryOnly ? 'Dostawa' : 'Montaż'
      const badgeClass = isDeliveryOnly
        ? 'border border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-200'
        : 'border border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-200'

      return <Badge className={`rounded-full px-3 py-1 text-xs ${badgeClass}`}>{label}</Badge>
    },
  },
  {
    accessorKey: 'declaredFloorArea',
    header: 'Powierzchnia [m²]',
    cell: ({ getValue }) => {
      const value = getValue<number | null>()
      if (!value) {
        return <span className="text-xs text-muted-foreground">Brak danych</span>
      }

      return <span>{numberFormatter.format(value)}</span>
    },
  },
  {
    accessorKey: 'pendingTasks',
    header: 'Zadania',
    cell: ({ getValue }) => {
      const value = getValue<number>() ?? 0
      if (value === 0) {
        return <span className="text-xs text-muted-foreground">Brak</span>
      }

      return (
        <Badge variant="outline" className="border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-200">
          {value} otwarte
        </Badge>
      )
    },
  },
  {
    accessorKey: 'stageChangedAt',
    header: 'Aktualizacja',
    cell: ({ getValue }) => {
      const value = getValue<Date>()
      if (!value) {
        return <span className="text-xs text-muted-foreground">—</span>
      }

      return (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-foreground">
            {formatDistanceToNow(value, { addSuffix: true, locale: pl })}
          </span>
          <span className="text-muted-foreground">
            {format(value, 'dd MMM yyyy, HH:mm', { locale: pl })}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'scheduledInstallationDate',
    header: 'Plan montażu',
    cell: ({ getValue }) => {
      const value = getValue<Date | null>()
      if (!value) {
        return <span className="text-xs text-muted-foreground">Nie zaplanowano</span>
      }

      return (
        <span className="text-sm font-medium text-foreground">
          {format(value, 'dd MMM', { locale: pl })}
        </span>
      )
    },
  },
]
