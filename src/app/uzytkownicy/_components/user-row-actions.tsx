'use client'

import { useState } from 'react'
import { KeyRound, MoreHorizontal, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserListItem } from '@/lib/users'

import { ChangePasswordDialog } from './change-password-dialog'
import { EditUserDialog } from './edit-user-dialog'

export function UserRowActions({ user }: { user: UserListItem }) {
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full border border-border/40 text-muted-foreground hover:text-primary"
            aria-label={`Akcje dla użytkownika ${user.username}`}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setEditOpen(true)
            }}
            className="gap-2"
          >
            <Pencil className="size-4" aria-hidden />
            <span>Edytuj dane</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setPasswordOpen(true)
            }}
            className="gap-2"
          >
            <KeyRound className="size-4" aria-hidden />
            <span>Zmień hasło</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog user={user} open={editOpen} onOpenChange={setEditOpen} hideTrigger />
      <ChangePasswordDialog user={user} open={passwordOpen} onOpenChange={setPasswordOpen} hideTrigger />
    </div>
  )
}
