'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Shield, 
    Ruler, 
    Hammer, 
    PenTool, 
    Users, 
    Mail, 
    Calendar,
    Search
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import Link from "next/link";

type TeamMember = {
    id: string;
    name: string | null;
    email: string;
    roles: string[];
    isActive: boolean;
    createdAt: Date;
    installerProfile?: unknown;
    architectProfile?: unknown;
    partnerProfile?: unknown;
};

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    admin: { label: 'Administrator', icon: Shield, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    measurer: { label: 'Montażysta (Legacy)', icon: Ruler, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    installer: { label: 'Montażysta', icon: Hammer, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    architect: { label: 'Architekt', icon: PenTool, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    partner: { label: 'Partner', icon: Users, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export function TeamList({ members }: { members: TeamMember[] }) {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    const filteredMembers = members.filter(member => {
        const matchesSearch = (member.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
                              member.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || member.roles.includes(roleFilter);
        return matchesSearch && matchesRole;
    });

    const getInitials = (name: string | null) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Szukaj pracownika..." 
                        className="pl-9 bg-background/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-full md:w-auto">
                    <TabsList className="grid w-full grid-cols-3 md:w-auto md:flex">
                        <TabsTrigger value="all">Wszyscy</TabsTrigger>
                        <TabsTrigger value="admin">Admin</TabsTrigger>
                        <TabsTrigger value="measurer">Pomiary</TabsTrigger>
                        <TabsTrigger value="installer">Montaże</TabsTrigger>
                        <TabsTrigger value="architect">Architekci</TabsTrigger>
                        <TabsTrigger value="partner">Partnerzy</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
                <AnimatePresence mode="popLayout">
                    {filteredMembers.map((member) => (
                        <motion.div
                            key={member.id}
                            variants={item}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-300 group border-zinc-200 dark:border-zinc-800">
                                <div className="h-24 bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 relative">
                                    <div className="absolute -bottom-10 left-6">
                                        <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.email}`} />
                                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        {member.isActive ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                                                Aktywny
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">
                                                Nieaktywny
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardContent className="pt-12 pb-6 px-6 space-y-4">
                                    <div>
                                        <h3 className="font-bold text-lg truncate" title={member.name || 'Bez nazwy'}>
                                            {member.name || 'Użytkownik'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Mail className="h-3 w-3" />
                                            <span className="truncate" title={member.email}>{member.email}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {member.roles.map(role => {
                                            const config = roleConfig[role] || { label: role, icon: User, color: 'bg-gray-100 text-gray-700' };
                                            const Icon = config.icon;
                                            return (
                                                <Badge key={role} variant="outline" className={cn("gap-1 border-0", config.color)}>
                                                    <Icon className="h-3 w-3" />
                                                    {config.label}
                                                </Badge>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Dołączył: {format(new Date(member.createdAt), 'd MMM yyyy', { locale: pl })}
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                        <Link href={`/dashboard/erp/zespol/${member.id}`} className="w-full">
                                            <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                Zobacz profil
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
            
            {filteredMembers.length === 0 && (
                <div className="text-center py-12">
                    <div className="bg-muted/50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Brak wyników</h3>
                    <p className="text-muted-foreground">Nie znaleziono pracowników spełniających kryteria.</p>
                </div>
            )}
        </div>
    );
}
