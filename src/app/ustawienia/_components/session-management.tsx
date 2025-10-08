'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  AlertTriangle,
  Clock,
  History,
  LogOut,
  MoreHorizontal,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  purgeExpiredSessionsAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
  revokeUserSessionsAction,
} from '../actions'
import { userRoleLabels } from '@/lib/user-roles'

type SessionClientEntry = {
  id: string
  userId: string
  username: string
  name: string | null
  role: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  updatedAt: string
  expiresAt: string
  tokenPreview: string
  isExpired: boolean
  isRecent: boolean
  isCurrent: boolean
}

export type SessionStats = {
  totalActive: number
  activeLast24h: number
  expired: number
  uniqueUsers: number
  currentUserSessions: number
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'EXPIRED'

type Props = {
  sessions: SessionClientEntry[]
  stats: SessionStats
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL: 'Wszystkie',
  ACTIVE: 'Aktywne',
  EXPIRED: 'Wygasłe',
}

function formatDateTime(value: string) {
  return format(new Date(value), 'dd.MM.yyyy, HH:mm', { locale: pl })
}

function formatRelative(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: pl })
}

function getStatusBadge(entry: SessionClientEntry) {
  if (entry.isExpired) {
    return (
      <Badge variant="outline" className="border-red-500/40 text-red-600 dark:text-red-300">
        Wygasła
      </Badge>
    )
  }

  if (entry.isRecent) {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-200 border-emerald-500/30">
        Aktywna
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-200">
      Aktywna (brak ostatniej aktywności)
    </Badge>
  )
}

function truncateUserAgent(value: string | null) {
  if (!value) {
    return 'Brak danych'
  }
  return value.length > 90 ? `${value.slice(0, 87)}…` : value
}

const roleAccentClasses: Record<string, string> = {
  ADMIN: 'bg-rose-500/15 text-rose-600 dark:text-rose-200 border-rose-500/30',
  MONTER: 'bg-amber-500/15 text-amber-600 dark:text-amber-200 border-amber-500/30',
  PARTNER: 'bg-blue-500/15 text-blue-600 dark:text-blue-200 border-blue-500/30',
}

export function SessionManagement({ sessions, stats }: Props) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL')
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL')
  const [query, setQuery] = React.useState('')
  const [pendingSessionId, setPendingSessionId] = React.useState<string | null>(null)
  const [pendingBulkAction, setPendingBulkAction] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const rolesInData = React.useMemo(() => {
    const unique = new Set<string>()
    for (const entry of sessions) {
      unique.add(entry.role)
    }
    return Array.from(unique)
  }, [sessions])

  const filteredSessions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return sessions.filter((session) => {
      if (statusFilter === 'ACTIVE' && session.isExpired) {
        return false
      }
      if (statusFilter === 'EXPIRED' && !session.isExpired) {
        return false
      }

      if (roleFilter !== 'ALL' && session.role !== roleFilter) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack = [
        session.username,
        session.name ?? '',
        session.ipAddress ?? '',
        session.userAgent ?? '',
        session.tokenPreview,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [sessions, statusFilter, roleFilter, query])

  const handleRevokeSession = React.useCallback(
    (sessionId: string) => {
      setPendingSessionId(sessionId)
      startTransition(async () => {
        try {
          const result = await revokeSessionAction({ sessionId })
          if (result.status === 'success') {
            toast.success(result.message)
            router.refresh()
          } else {
            toast.error(result.message)
          }
        } catch {
          toast.error('Nie udało się zakończyć sesji.')
        } finally {
          setPendingSessionId(null)
        }
      })
    },
    [router, startTransition],
  )

  const handleRevokeUserSessions = React.useCallback(
    (userId: string) => {
      setPendingSessionId(userId)
      startTransition(async () => {
        try {
          const result = await revokeUserSessionsAction({ userId })
          if (result.status === 'success') {
            toast.success(result.message)
            router.refresh()
          } else {
            toast.error(result.message)
          }
        } catch {
          toast.error('Nie udało się zakończyć sesji użytkownika.')
        } finally {
          setPendingSessionId(null)
        }
      })
    },
    [router, startTransition],
  )

  const handleBulkAction = React.useCallback(
    (action: 'others' | 'expired') => {
      setPendingBulkAction(action)
      startTransition(async () => {
        try {
          const result =
            action === 'others'
              ? await revokeOtherSessionsAction()
              : await purgeExpiredSessionsAction()

          if (result.status === 'success') {
            toast.success(result.message)
            router.refresh()
          } else {
            toast.error(result.message)
          }
        } catch {
          toast.error('Operacja nie powiodła się.')
        } finally {
          setPendingBulkAction(null)
        }
      })
    },
    [router, startTransition],
  )

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-border/60">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">Akcje administracyjne</CardTitle>
            <CardDescription>
              Zwalniaj sesje ręcznie, gdy wykryjesz podejrzaną aktywność lub gdy użytkownik zgłosi problem z dostępem.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('expired')}
              disabled={isPending && pendingBulkAction === 'expired'}
              className="inline-flex items-center gap-2 rounded-full border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
            >
              <Trash2 className="size-4" aria-hidden />
              Usuń wygasłe sesje
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkAction('others')}
              disabled={isPending && pendingBulkAction === 'others'}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90"
            >
              <RefreshCcw className="size-4" aria-hidden />
              Wyloguj pozostałe sesje
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="border border-border/60">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl font-semibold text-foreground">Historia sesji</CardTitle>
              <CardDescription>
                Przeglądaj aktywne logowania użytkowników, adresy IP oraz ostatnią aktywność. Zaznaczone rekordy oznaczają Twoje bieżące połączenie.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Szukaj po użytkowniku, IP lub agencie"
                className="w-full min-w-64 max-w-sm"
              />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Rola" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Wszystkie role</SelectItem>
                  {rolesInData.map((role) => (
                    <SelectItem key={role} value={role}>
                      {userRoleLabels[role as keyof typeof userRoleLabels] ?? role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-3 py-1">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden />
              Aktywne: {stats.totalActive}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-3 py-1">
              <History className="size-3.5 text-primary" aria-hidden />
              Ostatnie 24h: {stats.activeLast24h}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-3 py-1">
              <Clock className="size-3.5 text-primary" aria-hidden />
              Wygasłe: {stats.expired}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-3 py-1">
              <Users className="size-3.5 text-primary" aria-hidden />
              Unikalni użytkownicy: {stats.uniqueUsers}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-3 py-1">
              <UserCheck className="size-3.5 text-primary" aria-hidden />
              Twoje aktywne sesje: {stats.currentUserSessions}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="min-w-[200px]">Użytkownik</TableHead>
                  <TableHead className="min-w-[180px]">Adres IP i urządzenie</TableHead>
                  <TableHead className="min-w-[200px]">Ostatnia aktywność</TableHead>
                  <TableHead className="min-w-[180px]">Utworzono</TableHead>
                  <TableHead className="min-w-[160px] text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Brak sesji spełniających kryteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => {
                    const createdAt = formatDateTime(session.createdAt)
                    const updatedAt = formatDateTime(session.updatedAt)
                    const expiresAt = formatDateTime(session.expiresAt)
                    const relative = formatRelative(session.updatedAt)
                    const userLabel = userRoleLabels[session.role as keyof typeof userRoleLabels] ?? session.role
                    const isRowPending = isPending && pendingSessionId === session.id
                    const isUserPending = isPending && pendingSessionId === session.userId

                    return (
                      <TableRow
                        key={session.id}
                        className={cn(
                          'border-border/40 transition hover:bg-primary/5',
                          session.isCurrent && 'border-primary/50 bg-primary/5',
                        )}
                      >
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                {session.name ?? 'Nieznany użytkownik'}
                              </span>
                              {session.isCurrent ? (
                                <Badge className="bg-primary/15 text-primary border-primary/40">
                                  Twoja sesja
                                </Badge>
                              ) : null}
                            </div>
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {session.username}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'w-max border text-[11px] font-semibold uppercase',
                                roleAccentClasses[session.role] ?? 'border-border/60 text-muted-foreground',
                              )}
                            >
                              {userLabel}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          <div className="flex flex-col gap-1">
                            <span className="text-foreground">IP: {session.ipAddress ?? '—'}</span>
                            <span className="text-xs leading-snug text-muted-foreground/80">
                              {truncateUserAgent(session.userAgent)}
                            </span>
                            <span className="text-xs text-muted-foreground/70">
                              Oznaczenie: #{session.tokenPreview}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(session)}
                              {!session.isExpired ? (
                                <span className="text-xs text-muted-foreground/80">{relative}</span>
                              ) : null}
                            </div>
                            <span className="text-xs text-muted-foreground">Ostatnia aktywność: {updatedAt}</span>
                            <span className="text-xs text-muted-foreground">Wygaśnięcie: {expiresAt}</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          <div className="flex flex-col gap-1">
                            <span>{createdAt}</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                disabled={isPending && (isRowPending || isUserPending)}
                              >
                                <MoreHorizontal className="size-4" aria-hidden />
                                <span className="sr-only">Akcje</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleRevokeSession(session.id)}
                                disabled={session.isCurrent || (isPending && pendingSessionId === session.id)}
                              >
                                <LogOut className="mr-2 size-4" aria-hidden />
                                Zakończ sesję
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRevokeUserSessions(session.userId)}
                                disabled={session.isCurrent || (isPending && pendingSessionId === session.userId)}
                              >
                                <AlertTriangle className="mr-2 size-4" aria-hidden />
                                Wyloguj użytkownika (wszystkie sesje)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
