'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal, Shield, ShieldAlert, ShieldCheck, UserCog, LogIn, Settings2 } from 'lucide-react';

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
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toggleEmployeeStatus, updateEmployeeRoles, impersonateUserAction } from '../actions';
import type { UserRole, InstallerProfile, ArchitectProfile } from '@/lib/db/schema';
import { EmployeeDetailsSheet } from './employee-details-sheet';

interface TeamMember {
    id: string;
    name: string | null;
    email: string;
    roles: UserRole[];
    isActive: boolean;
    createdAt: Date;
    installerProfile: InstallerProfile | null;
    architectProfile: ArchitectProfile | null;
}

interface TeamListProps {
    members: TeamMember[];
    currentUserId: string;
}

const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    measurer: 'Pomiarowiec',
    installer: 'Montażysta',
    architect: 'Architekt',
};

const roleIcons: Record<UserRole, React.ReactNode> = {
    admin: <ShieldAlert className="h-4 w-4 text-red-600" />,
    measurer: <ShieldCheck className="h-4 w-4 text-blue-600" />,
    installer: <Shield className="h-4 w-4 text-green-600" />,
    architect: <UserCog className="h-4 w-4 text-purple-600" />,
};

export function TeamList({ members, currentUserId }: TeamListProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const employees = members.filter(m => !m.roles.includes('architect'));
  const architects = members.filter(m => m.roles.includes('architect'));

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

  const handleRoleToggle = (userId: string, role: UserRole, currentRoles: UserRole[]) => {
    startTransition(async () => {
        try {
            let newRoles: UserRole[];
            if (currentRoles.includes(role)) {
                newRoles = currentRoles.filter(r => r !== role);
            } else {
                newRoles = [...currentRoles, role];
            }
            
            if (newRoles.length === 0) {
                alert('Użytkownik musi mieć przynajmniej jedną rolę.');
                return;
            }

            await updateEmployeeRoles(userId, newRoles);
        } catch (e) {
            console.error(e);
            alert('Wystąpił błąd podczas zmiany roli.');
        }
    });
  };

  const handleImpersonate = (userId: string) => {
    if (!confirm('Czy na pewno chcesz zalogować się jako ten użytkownik?')) return;
    
    startTransition(async () => {
        try {
            await impersonateUserAction(userId);
        } catch (e) {
            console.error(e);
            alert('Wystąpił błąd podczas logowania.');
        }
    });
  };

  const renderMembersTable = (list: TeamMember[]) => (
    <div className="rounded-md border">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data dodania</TableHead>
                <TableHead className="w-[50px]"></TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {list.map((member) => (
                <TableRow key={member.id}>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col gap-1">
                        {member.roles.map(role => (
                            <div key={role} className="flex items-center gap-2">
                                {roleIcons[role]}
                                <span className="text-sm">{roleLabels[role]}</span>
                            </div>
                        ))}
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
                        <DropdownMenuItem onClick={() => {
                            setSelectedMember(member);
                            setIsSheetOpen(true);
                        }}>
                            <Settings2 className="mr-2 h-4 w-4" />
                            Szczegóły
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusToggle(member.id, member.isActive)}>
                            {member.isActive ? 'Zablokuj dostęp' : 'Odblokuj dostęp'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <UserCog className="mr-2 h-4 w-4" />
                                <span className="ml-2">Zmień rolę</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuCheckboxItem 
                                    checked={member.roles.includes('admin')}
                                    onCheckedChange={() => handleRoleToggle(member.id, 'admin', member.roles)}
                                >
                                    Administrator
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem 
                                    checked={member.roles.includes('measurer')}
                                    onCheckedChange={() => handleRoleToggle(member.id, 'measurer', member.roles)}
                                >
                                    Pomiarowiec
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem 
                                    checked={member.roles.includes('installer')}
                                    onCheckedChange={() => handleRoleToggle(member.id, 'installer', member.roles)}
                                >
                                    Montażysta
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem 
                                    checked={member.roles.includes('architect')}
                                    onCheckedChange={() => handleRoleToggle(member.id, 'architect', member.roles)}
                                >
                                    Architekt
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleImpersonate(member.id)}>
                            <LogIn className="mr-2 h-4 w-4" />
                            Zaloguj jako
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
    </div>
  );

  return (
    <>
        <Tabs defaultValue="employees" className="w-full">
            <TabsList>
                <TabsTrigger value="employees">Pracownicy ({employees.length})</TabsTrigger>
                <TabsTrigger value="architects">Architekci ({architects.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="employees" className="mt-4">
                {renderMembersTable(employees)}
            </TabsContent>
            <TabsContent value="architects" className="mt-4">
                {renderMembersTable(architects)}
            </TabsContent>
        </Tabs>

        <EmployeeDetailsSheet 
            member={selectedMember} 
            open={isSheetOpen} 
            onOpenChange={setIsSheetOpen} 
        />
    </>
  );
}
