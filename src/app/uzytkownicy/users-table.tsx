'use client'

import * as React from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Users as UsersIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { RoleBreakdownEntry, UserListItem, UsersMetrics } from '@/lib/users'
import { userRoleLabels } from '@/lib/user-roles'

const ROLE_FILTER_ALL = 'ALL'

const roleAccentClasses: Record<string, string> = {
  ADMIN: 'bg-rose-500/15 text-rose-600 dark:text-rose-200 border-rose-500/30',
  MONTER: 'bg-amber-500/15 text-amber-600 dark:text-amber-200 border-amber-500/30',
  PARTNER: 'bg-blue-500/15 text-blue-600 dark:text-blue-200 border-blue-500/30',
}

function formatDate(value: Date | null) {
  if (!value) {
    return 'Nigdy'
  }

  return format(value, 'dd.MM.yyyy, HH:mm', { locale: pl })
}

function formatRelative(value: Date | null) {
  if (!value) {
    return 'brak logowań'
  }

  return formatDistanceToNow(value, { addSuffix: true, locale: pl })
}

function getActivityBadge(value: Date | null) {
  if (!value) {
    return <Badge variant="outline" className="border-border/60 text-muted-foreground">Nieaktywny</Badge>
  }

  const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  return value > thirtyDaysAgo ? (
    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-200 border-emerald-500/30">
      Aktywny
    </Badge>
  ) : (
    <Badge variant="outline" className="border-border/60 text-muted-foreground">
      Nieaktywny
    </Badge>
  )
}

export function UsersTable({
  metrics,
  roleBreakdown,
  users,
  className,
}: {
  metrics: UsersMetrics
  roleBreakdown: RoleBreakdownEntry[]
  users: UserListItem[]
  className?: string
}) {
  const [roleFilter, setRoleFilter] = React.useState<string>(ROLE_FILTER_ALL)
  const [query, setQuery] = React.useState('')

  const filteredUsers = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return users.filter((user) => {
      const matchesRole =
        roleFilter === ROLE_FILTER_ALL ? true : user.role === roleFilter

      if (!matchesRole) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack = [user.name ?? '', user.username, user.email, user.phone ?? '']
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [users, roleFilter, query])

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <Card className="border border-border/60">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Filtry</span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Szukaj po nazwisku, loginie lub e-mailu"
                className="w-full min-w-64"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rola" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLE_FILTER_ALL}>
                    Wszyscy ({metrics.totalUsers})
                  </SelectItem>
                  {roleBreakdown.map((entry) => (
                    <SelectItem key={entry.role} value={entry.role}>
                      {entry.label} ({entry.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
            <UsersIcon className="size-4 text-muted-foreground" aria-hidden />
            <span>
              Wyświetlono {filteredUsers.length} z {metrics.totalUsers}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-3xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Użytkownik</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead className="hidden md:table-cell">Rola</TableHead>
              <TableHead>Ostatnia aktywność</TableHead>
              <TableHead className="hidden lg:table-cell">Utworzono</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Brak użytkowników spełniających kryteria wyszukiwania.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="bg-background/60">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">
                        {user.name || 'Niepodane imię i nazwisko'}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {user.username}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <a href={`mailto:${user.email}`} className="text-foreground transition hover:text-primary">
                        {user.email}
                      </a>
                      {user.phone ? <span>{user.phone}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="outline"
                      className={cn(
                        'border text-xs font-medium uppercase tracking-wide',
                        roleAccentClasses[user.role] ?? ''
                      )}
                    >
                      {userRoleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        {getActivityBadge(user.lastLoginAt)}
                        {user.lastLoginAt ? (
                          <span className="text-xs text-muted-foreground">{formatRelative(user.lastLoginAt)}</span>
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(user.lastLoginAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
