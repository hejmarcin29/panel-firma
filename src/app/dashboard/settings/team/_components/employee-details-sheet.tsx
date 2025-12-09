'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { updateInstallerProfile, getInstallerMontages } from '../actions';
import type { UserRole, InstallerProfile } from '@/lib/db/schema';

interface TeamMember {
    id: string;
    name: string | null;
    email: string;
    roles: UserRole[];
    isActive: boolean;
    createdAt: Date;
    installerProfile?: InstallerProfile | null;
}

interface EmployeeDetailsSheetProps {
    member: TeamMember | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const profileSchema = z.object({
    workScope: z.string().optional(),
    operationArea: z.string().optional(),
    pricing: z.array(z.object({
        serviceName: z.string().min(1, "Nazwa usługi wymagana"),
        price: z.coerce.number().min(0, "Cena musi być dodatnia"),
        unit: z.string().min(1, "Jednostka wymagana"),
    })).optional(),
});

export function EmployeeDetailsSheet({ member, open, onOpenChange }: EmployeeDetailsSheetProps) {
    const [activeTab, setActiveTab] = useState('general');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [montages, setMontages] = useState<any[]>([]);
    const [isLoadingMontages, setIsLoadingMontages] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema) as Resolver<z.infer<typeof profileSchema>>,
        defaultValues: {
            workScope: '',
            operationArea: '',
            pricing: [],
        },
    });

    const pricing = useWatch({ control: form.control, name: 'pricing' });

    useEffect(() => {
        if (member?.installerProfile) {
            form.reset({
                workScope: member.installerProfile.workScope || '',
                operationArea: member.installerProfile.operationArea || '',
                pricing: member.installerProfile.pricing || [],
            });
        } else {
            form.reset({
                workScope: '',
                operationArea: '',
                pricing: [],
            });
        }
    }, [member, form]);

    useEffect(() => {
        if (open && member && member.roles.includes('installer') && activeTab === 'history') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoadingMontages(true);
            getInstallerMontages(member.id)
                .then(setMontages)
                .finally(() => setIsLoadingMontages(false));
        }
    }, [open, member, activeTab]);

    const onSubmit = (values: z.infer<typeof profileSchema>) => {
        if (!member) return;
        
        startTransition(async () => {
            try {
                await updateInstallerProfile(member.id, values);
            } catch (error) {
                console.error(error);
            }
        });
    };

    if (!member) return null;

    const isInstaller = member.roles.includes('installer');

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{member.name || member.email}</SheetTitle>
                    <SheetDescription>
                        Zarządzanie danymi pracownika
                    </SheetDescription>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">Ogólne</TabsTrigger>
                        <TabsTrigger value="profile" disabled={!isInstaller}>Profil Montażysty</TabsTrigger>
                        <TabsTrigger value="history" disabled={!isInstaller}>Historia</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 mt-4">
                        <div className="grid gap-2">
                            <div className="font-medium">Email</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                        <div className="grid gap-2">
                            <div className="font-medium">Role</div>
                            <div className="flex gap-2 flex-wrap">
                                {member.roles.map(role => (
                                    <Badge key={role} variant="secondary">{role}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="font-medium">Status</div>
                            <div>
                                <Badge variant={member.isActive ? "default" : "destructive"}>
                                    {member.isActive ? "Aktywny" : "Nieaktywny"}
                                </Badge>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="profile" className="space-y-4 mt-4">
                        <Form {...form}>
                            <form onChange={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="workScope"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Zakres prac</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Opisz zakres wykonywanych prac..." 
                                                    className="min-h-[100px]"
                                                    {...field} 
                                                    onBlur={form.handleSubmit(onSubmit)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="operationArea"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Obszar działania</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Opisz obszar działania..." 
                                                    {...field} 
                                                    onBlur={form.handleSubmit(onSubmit)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Cennik usług</FormLabel>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                const current = form.getValues('pricing') || [];
                                                form.setValue('pricing', [...current, { serviceName: '', price: 0, unit: '' }]);
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Dodaj
                                        </Button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {pricing?.map((_, index) => (
                                            <div key={index} className="flex gap-2 items-start">
                                                <FormField
                                                    control={form.control}
                                                    name={`pricing.${index}.serviceName`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input placeholder="Usługa" {...field} onBlur={form.handleSubmit(onSubmit)} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`pricing.${index}.price`}
                                                    render={({ field }) => (
                                                        <FormItem className="w-24">
                                                            <FormControl>
                                                                <Input type="number" placeholder="Cena" {...field} onBlur={form.handleSubmit(onSubmit)} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`pricing.${index}.unit`}
                                                    render={({ field }) => (
                                                        <FormItem className="w-20">
                                                            <FormControl>
                                                                <Input placeholder="J.m." {...field} onBlur={form.handleSubmit(onSubmit)} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const current = form.getValues('pricing') || [];
                                                        form.setValue('pricing', current.filter((_, i) => i !== index));
                                                        form.handleSubmit(onSubmit)();
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {isPending && <div className="text-xs text-muted-foreground">Zapisywanie...</div>}
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        {isLoadingMontages ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Klient</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {montages.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    Brak historii montaży
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            montages.map((montage) => (
                                                <TableRow key={montage.id}>
                                                    <TableCell>
                                                        {montage.createdAt ? new Date(montage.createdAt).toLocaleDateString('pl-PL') : '-'}
                                                    </TableCell>
                                                    <TableCell>{montage.clientName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{montage.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
