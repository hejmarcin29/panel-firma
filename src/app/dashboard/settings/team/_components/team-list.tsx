'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal, ShieldAlert, UserCog, LogIn, Settings2, Ruler, Hammer, PenTool, Users } from 'lucide-react';

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toggleEmployeeStatus, updateEmployeeRoles, impersonateUserAction } from '../actions';
import type { UserRole, InstallerProfile, ArchitectProfile } from '@/lib/db/schema';
import { EmployeeDetailsSheet } from './employee-details-sheet';
import { cn } from '@/lib/utils';

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
    partner: 'Partner B2B',
};

const roleIcons: Record<UserRole, React.ReactNode> = {
    admin: <ShieldAlert className="h-4 w-4 text-red-600" />,
    measurer: <Ruler className="h-4 w-4 text-blue-600" />,
    installer: <Hammer className="h-4 w-4 text-orange-600" />,
    architect: <PenTool className="h-4 w-4 text-purple-600" />,
    partner: <Users className="h-4 w-4 text-green-600" />,
};

function getInitials(name: string | null) {
    if (!name) return '??';
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function TeamList({ members, currentUserId }: TeamListProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Desktop Grouping
  const employees = members.filter(m => !m.roles.includes('architect'));
  const architects = members.filter(m => m.roles.includes('architect'));

  // Mobile Grouping
  const mobileGroups = {
    architects: members.filter(m => m.roles.includes('architect')),
    measurers: members.filter(m => m.roles.includes('measurer')),
    installers: members.filter(m => m.roles.includes('installer')),
    admins: members.filter(m => m.roles.includes('admin')),
  };

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((e as any)?.digest?.includes('NEXT_REDIRECT')) {
                return;
            }
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

  const MobileCard = ({ member }: { member: TeamMember }) => (
    <Card className="mb-3 overflow-hidden border-l-4 border-l-primary/20">
        <CardHeader className="flex flex-row items-start gap-4 p-4 pb-2 space-y-0">
            <Avatar className="h-10 w-10 border">
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base truncate">{member.name || 'Bez nazwy'}</CardTitle>
                    <Badge variant={member.isActive ? 'outline' : 'destructive'} className="text-[10px] h-5">
                        {member.isActive ? 'Aktywny' : 'Blokada'}
                    </Badge>
                </div>
                <CardDescription className="text-xs truncate">{member.email}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 pb-3">
            <div className="flex flex-wrap gap-1.5 mb-3">
                {member.roles.map(role => (
                    <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-1 font-normal">
                        {roleIcons[role]}
                        {roleLabels[role]}
                    </Badge>
                ))}
                {member.roles.length === 0 && <span className="text-xs text-muted-foreground italic">Brak ról</span>}
            </div>
        </CardContent>
        <CardFooter className="bg-muted/30 p-2 grid grid-cols-2 gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => {
                    setSelectedMember(member);
                    setIsSheetOpen(true);
                }}
            >
                <Settings2 className="mr-2 h-3 w-3" />
                Edytuj
            </Button>
            <Button 
                variant="default" 
                size="sm" 
                className="h-8 text-xs"
                disabled={member.id === currentUserId || isPending}
                onClick={() => handleImpersonate(member.id)}
            >
                <LogIn className="mr-2 h-3 w-3" />
                Zaloguj
            </Button>
        </CardFooter>
    </Card>
  );

  const renderMobileSection = (title: string, list: TeamMember[], colorClass: string) => {
    if (list.length === 0) return null;
    return (
        <div className="min-w-[85vw] sm:min-w-[350px] snap-center snap-always flex flex-col h-full">
            <div className={cn("sticky top-0 z-10 bg-background/95 backdrop-blur py-2 mb-2 border-b flex items-center justify-between", colorClass)}>
                <h3 className="font-semibold text-lg">{title}</h3>
                <Badge variant="secondary" className="ml-2">{list.length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto pb-4 pr-1">
                {list.map(m => <MobileCard key={m.id} member={m} />)}
            </div>
        </div>
    );
  };

  return (
    <>
        {/* Desktop View */}
        <div className="hidden md:block">
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
        </div>

        {/* Mobile View - Horizontal Slider */}
        <div className="md:hidden -mx-4">
            <div className="px-4 mb-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MoreHorizontal className="h-3 w-3" />
                    Przesuwaj w bok, aby zobaczyć inne grupy
                </p>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-6 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {renderMobileSection('Architekci', mobileGroups.architects, 'text-purple-600')}
                {renderMobileSection('Pomiarowcy', mobileGroups.measurers, 'text-blue-600')}
                {renderMobileSection('Montażyści', mobileGroups.installers, 'text-green-600')}
                {renderMobileSection('Administratorzy', mobileGroups.admins, 'text-red-600')}
            </div>
        </div>

        <EmployeeDetailsSheet 
            member={selectedMember} 
            open={isSheetOpen} 
            onOpenChange={setIsSheetOpen} 
        />
    </>
  );
}
