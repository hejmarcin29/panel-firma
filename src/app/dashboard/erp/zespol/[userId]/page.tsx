import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { 
    User, 
    Mail, 
    Shield, 
    Ruler, 
    Hammer, 
    PenTool, 
    Users,
    Clock,
    Activity
} from 'lucide-react';

import { getUserDetails, getUserFinancials } from '../actions';
import { requireUser } from '@/lib/auth/session';
import { ImpersonateButton } from '../_components/impersonate-button';
import { ChangePasswordDialog } from '../_components/change-password-dialog';
import { DeleteUserButton } from '../_components/delete-user-button';
import { FinancialsSection } from '../_components/financials-section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    admin: { label: 'Administrator', icon: Shield, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    measurer: { label: 'Pomiarowiec', icon: Ruler, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    installer: { label: 'Montażysta', icon: Hammer, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    architect: { label: 'Architekt', icon: PenTool, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    partner: { label: 'Partner', icon: Users, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const currentUser = await requireUser();
    const isAdmin = currentUser.roles.includes('admin');
    
    let user;
    let financials = null;
    try {
        user = await getUserDetails(userId);
        financials = await getUserFinancials(userId, user.roles);
    } catch {
        notFound();
    }

    const getInitials = (name: string | null) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/erp/zespol">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Profil pracownika</h1>
                        <p className="text-muted-foreground">Szczegółowe informacje i historia aktywności.</p>
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <ChangePasswordDialog userId={user.id} userName={user.name || user.email} />
                        {currentUser.id !== user.id && (
                            <>
                                <ImpersonateButton userId={user.id} userName={user.name || user.email} />
                                <DeleteUserButton userId={user.id} userName={user.name || user.email} />
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-[350px_1fr]">
                {/* Left Column - User Info */}
                <div className="space-y-6">
                    <Card className="overflow-hidden">
                        <div className="h-32 bg-linear-to-br from-primary/10 to-primary/5 relative">
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} />
                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                        <CardContent className="pt-16 pb-6 text-center space-y-4">
                            <div>
                                <h2 className="text-xl font-bold">{user.name || 'Użytkownik'}</h2>
                                <div className="flex items-center justify-center gap-2 text-muted-foreground mt-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{user.email}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-2">
                                {user.roles.map(role => {
                                    const config = roleConfig[role] || { label: role, icon: User, color: 'bg-gray-100 text-gray-700' };
                                    const Icon = config.icon;
                                    return (
                                        <Badge key={role} variant="outline" className={`gap-1 border-0 ${config.color}`}>
                                            <Icon className="h-3 w-3" />
                                            {config.label}
                                        </Badge>
                                    );
                                })}
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Status</span>
                                    <Badge variant={user.isActive ? "default" : "destructive"} className="mt-1">
                                        {user.isActive ? "Aktywny" : "Nieaktywny"}
                                    </Badge>
                                </div>
                                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Dołączył</span>
                                    <span className="font-medium mt-1">
                                        {format(new Date(user.createdAt), 'd MMM yyyy', { locale: pl })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Info / Additional Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informacje systemowe</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">ID Użytkownika</span>
                                <span className="font-mono text-xs">{user.id}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Ostatnia aktualizacja</span>
                                <span>{format(new Date(user.updatedAt), 'd MMM yyyy HH:mm', { locale: pl })}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Activity & Details */}
                <div className="space-y-6">
                    
                    <FinancialsSection data={financials} roles={user.roles} />

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Aktywność i Zadania
                            </CardTitle>
                            <CardDescription>
                                Historia operacji i przypisane zadania w systemie.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <Clock className="h-12 w-12 mb-4 opacity-20" />
                                <h3 className="text-lg font-medium mb-1">Brak ostatniej aktywności</h3>
                                <p>Ten użytkownik nie wykonał jeszcze żadnych rejestrowanych akcji.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role Specific Info */}
                    {user.roles.includes('installer') && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Hammer className="h-5 w-5 text-orange-500" />
                                    Profil Montażysty
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    {user.installerProfile ? (
                                        <pre className="bg-muted p-4 rounded-lg overflow-auto">
                                            {JSON.stringify(user.installerProfile, null, 2)}
                                        </pre>
                                    ) : (
                                        <p>Brak skonfigurowanego profilu montażysty.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
