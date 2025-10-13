'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import Link from 'next/link'
import { Edit } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { InstallationsListItem } from '@/lib/installations'
import { installationStatusLabels } from '@/lib/installations/constants'
import { orderStageLabels } from '@/lib/order-stage'

const formatDate = (value: Date | null | undefined) => {
  if (!value) {
    return null
  }

  return format(value, 'dd MMM yyyy', { locale: pl })
}

export const installationsColumns: ColumnDef<InstallationsListItem>[] = [
  {
    accessorKey: 'installationNumber',
    header: 'Montaż',
    cell: ({ row }) => {
      const value = row.original
      const displayNumber = value.installationNumber || value.id.slice(0, 7)
      const locationLabel = value.addressCity ?? value.clientCity

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Link
              href={`/zlecenia/${value.orderId}`}
              className="transition hover:text-emerald-600"
              onClick={(event) => event.stopPropagation()}
            >
              #{displayNumber}
            </Link>
            {value.requiresAdminAttention ? (
              <Badge variant="outline" className="border-red-500/60 bg-red-500/10 text-xs text-red-500">
                Alert
              </Badge>
            ) : null}
          </div>
          {locationLabel ? (
            <span className="text-xs text-muted-foreground">{locationLabel}</span>
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
          {value.orderNumber ? (
            <span className="text-xs text-muted-foreground">
              Zlecenie #{value.orderNumber}{' '}
              {value.orderStage ? `• ${orderStageLabels[value.orderStage]}` : ''}
            </span>
          ) : null}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant="secondary" className="rounded-full bg-muted/60 px-3 py-1 text-xs">
          {installationStatusLabels[status]}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'scheduledStartAt',
    header: 'Plan start',
    cell: ({ getValue }) => {
      const value = getValue<Date | null>()
      const formatted = formatDate(value)
      return formatted ? (
        <span className="text-sm font-medium text-foreground">{formatted}</span>
      ) : (
        <span className="text-xs text-muted-foreground">Brak daty</span>
      )
    },
  },
  {
    accessorKey: 'actualStartAt',
    header: 'Rzeczywisty start',
    cell: ({ row }) => {
      const { actualStartAt, actualEndAt } = row.original
      const start = formatDate(actualStartAt)
      const end = formatDate(actualEndAt)

      if (!start && !end) {
        return <span className="text-xs text-muted-foreground">Nie zarejestrowano</span>
      }

      return (
        <div className="flex flex-col text-xs">
          {start ? <span className="font-medium text-foreground">{start}</span> : null}
          {end ? <span className="text-muted-foreground">→ {end}</span> : null}
        </div>
      )
    },
  },
  {
    accessorKey: 'assignedInstallerName',
    header: 'Ekipa',
    cell: ({ getValue }) => {
      const value = getValue<string | null>()
      return value ? (
        <span className="text-sm font-medium text-foreground">{value}</span>
      ) : (
        <span className="text-xs text-muted-foreground">Nie przypisano</span>
      )
    },
  },
  {
    id: 'actions',
    header: 'Akcje',
    cell: ({ row }) => {
      const installation = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/montaze/${installation.id}/edytuj`}>
              <Edit className="mr-1.5 size-3.5" />
              Edytuj
            </Link>
          </Button>
        </div>
      )
    },
  },
]
