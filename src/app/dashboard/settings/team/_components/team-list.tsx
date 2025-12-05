'use client';

import { useTransition } from 'react';
import { MoreHorizontal, Shield, ShieldAlert, ShieldCheck, UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toggleEmployeeStatus, updateEmployeeRole } from '../actions';
import type { UserRole } from '@/lib/db/schema';

interface TeamMember {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
}

interface TeamListProps {
    members: TeamMember[];
    currentUserId: string;
}

const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    measurer: 'Pomiarowiec',
    installer: 'Montażysta',
};

const roleIcons: Record<UserRole, React.ReactNode> = {
    admin: <ShieldAlert className="h-4 w-4 text-red-600" />,
    measurer: <ShieldCheck className="h-4 w-4 text-blue-600" />,
    installer: <Shield className="h-4 w-4 text-green-600" />,
};

export function TeamList({ members, currentUserId }: TeamListProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusToggle = (userId: string, currentStatus: boolean) => {
    startTransition(async () => {
        try {
            await toggleEmployeeStatus(userId, !currentStatus);
        } catch (e) {
            console.error(e);
            alert('Wystąpił błąd podczas zmiany statusu.');
        }
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    startTransition(async () => {
        try {
            await updateEmployeeRole(userId, newRole as UserRole);
        } catch (e) {
            console.error(e);
            alert('Wystąpił błąd podczas zmiany roli.');
        }
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pracownik</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data dodania</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex flex-col">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    {roleIcons[member.role]}
                    <span>{roleLabels[member.role]}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={member.isActive ? 'default' : 'destructive'}>
                    {member.isActive ? 'Aktywny' : 'Zablokowany'}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(member.createdAt).toLocaleDateString('pl-PL')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={member.id === currentUserId || isPending}>
                      <span className="sr-only">Otwórz menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleStatusToggle(member.id, member.isActive)}>
                        {member.isActive ? 'Zablokuj dostęp' : 'Odblokuj dostęp'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <UserCog className="mr-2 h-4 w-4" />
                            Zmień rolę
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={member.role} onValueChange={(val) => handleRoleChange(member.id, val)}>
                                <DropdownMenuRadioItem value="admin">Administrator</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="measurer">Pomiarowiec</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="installer">Montażysta</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
