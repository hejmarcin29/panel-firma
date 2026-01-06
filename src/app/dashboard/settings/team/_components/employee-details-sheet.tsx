'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { getStatusLabel } from "@/lib/montaze/statuses";

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

import { updateInstallerProfile, getInstallerMontages, updateArchitectProfile, getArchitectCommissions, updatePartnerProfile } from '../actions';
import type { UserRole, InstallerProfile, ArchitectProfile, PartnerProfile } from '@/lib/db/schema';

interface TeamMember {
    id: string;
    name: string | null;
    email: string;
    roles: UserRole[];
    isActive: boolean;
    createdAt: Date;
    installerProfile?: InstallerProfile | null;
    architectProfile?: ArchitectProfile | null;
    partnerProfile?: PartnerProfile | null;
}

interface EmployeeDetailsSheetProps {
    member: TeamMember | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const profileSchema = z.object({
    workScope: z.string().optional(),
    operationArea: z.string().optional(),
    rates: z.object({
        classicClick: z.coerce.number().min(0).optional(),
        classicGlue: z.coerce.number().min(0).optional(),
        herringboneClick: z.coerce.number().min(0).optional(),
        herringboneGlue: z.coerce.number().min(0).optional(),
    }).optional(),
    pricing: z.array(z.object({
        serviceName: z.string().min(1, "Nazwa usługi wymagana"),
        price: z.coerce.number().min(0, "Cena musi być dodatnia"),
        unit: z.string().min(1, "Jednostka wymagana"),
    })).optional(),
});

const architectProfileSchema = z.object({
    companyName: z.string().optional(),
    nip: z.string().optional(),
    bankAccount: z.string().optional(),
    commissionRate: z.coerce.number().min(0, "Stawka musi być dodatnia").optional(),
});

const partnerProfileSchema = z.object({
    companyName: z.string().optional(),
    nip: z.string().optional(),
    bankAccount: z.string().optional(),
    commissionRate: z.coerce.number().min(0, "Prowizja musi być dodatnia").max(100, "Prowizja max 100%").optional(),
});

export function EmployeeDetailsSheet({ member, open, onOpenChange }: EmployeeDetailsSheetProps) {
    const [activeTab, setActiveTab] = useState('general');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [montages, setMontages] = useState<any[]>([]);
    const [isLoadingMontages, setIsLoadingMontages] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [commissions, setCommissions] = useState<any[]>([]);
    const [isLoadingCommissions, setIsLoadingCommissions] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema) as Resolver<z.infer<typeof profileSchema>>,
        defaultValues: {
            workScope: '',
            operationArea: '',
            rates: {},
            pricing: [],
        },
    });

    const architectForm = useForm<z.infer<typeof architectProfileSchema>>({
        resolver: zodResolver(architectProfileSchema) as Resolver<z.infer<typeof architectProfileSchema>>,
        defaultValues: {
            companyName: '',
            nip: '',
            bankAccount: '',
            commissionRate: 0,
        },
    });

    const partnerForm = useForm<z.infer<typeof partnerProfileSchema>>({
        resolver: zodResolver(partnerProfileSchema) as Resolver<z.infer<typeof partnerProfileSchema>>,
        defaultValues: {
            companyName: '',
            nip: '',
            bankAccount: '',
            commissionRate: 0,
        },
    });

    const pricing = useWatch({ control: form.control, name: 'pricing' });

    useEffect(() => {
        if (member?.installerProfile) {
            form.reset({
                workScope: member.installerProfile.workScope || '',
                operationArea: member.installerProfile.operationArea || '',
                rates: member.installerProfile.rates || {},
                pricing: member.installerProfile.pricing || [],
            });
        } else {
            form.reset({
                workScope: '',
                operationArea: '',
                rates: {},
                pricing: [],
            });
        }

        if (member?.architectProfile) {
            architectForm.reset({
                companyName: member.architectProfile.companyName || '',
                nip: member.architectProfile.nip || '',
                bankAccount: member.architectProfile.bankAccount || '',
                commissionRate: member.architectProfile.commissionRate || 0,
            });
        } else {
            architectForm.reset({
                companyName: '',
                nip: '',
                bankAccount: '',
                commissionRate: 0,
            });
        }

        if (member?.partnerProfile) {
            partnerForm.reset({
                companyName: member.partnerProfile.companyName || '',
                nip: member.partnerProfile.nip || '',
                bankAccount: member.partnerProfile.bankAccount || '',
                commissionRate: member.partnerProfile.commissionRate || 0,
            });
        } else {
            partnerForm.reset({
                companyName: '',
                nip: '',
                bankAccount: '',
                commissionRate: 0,
            });
        }
    }, [member, form, architectForm, partnerForm]);

    useEffect(() => {
        if (open && member && member.roles.includes('installer') && activeTab === 'history') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoadingMontages(true);
            getInstallerMontages(member.id)
                .then(setMontages)
                .finally(() => setIsLoadingMontages(false));
        }

        if (open && member && member.roles.includes('architect') && activeTab === 'history') {
            setIsLoadingCommissions(true);
            getArchitectCommissions(member.id)
                .then(setCommissions)
                .finally(() => setIsLoadingCommissions(false));
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

    const onArchitectSubmit = (values: z.infer<typeof architectProfileSchema>) => {
        if (!member) return;
        
        startTransition(async () => {
            try {
                await updateArchitectProfile(member.id, values);
            } catch (error) {
                console.error(error);
            }
        });
    };

    const onPartnerSubmit = (values: z.infer<typeof partnerProfileSchema>) => {
        if (!member) return;
        
        startTransition(async () => {
            try {
                await updatePartnerProfile(member.id, values);
            } catch (error) {
                console.error(error);
            }
        });
    };

    if (!member) return null;

    const isInstaller = member.roles.includes('installer');
    const isArchitect = member.roles.includes('architect');
    const isPartner = member.roles.includes('partner');

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{member.name || member.email}</SheetTitle>
                    <SheetDescription>
                        Zarządzanie danymi pracownika
                    </SheetDescription>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 px-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">Ogólne</TabsTrigger>
                        <TabsTrigger value="profile" disabled={!isInstaller && !isArchitect && !isPartner}>
                            Profil
                        </TabsTrigger>
                        <TabsTrigger value="history" disabled={!isInstaller && !isArchitect && !isPartner}>
                            Historia
                        </TabsTrigger>
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
                        {isInstaller && (
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
                                                    className="min-h-25"
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

                                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                    <FormLabel className="text-base font-semibold">Stawki Podstawowe (PLN/m²)</FormLabel>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="rates.classicClick"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Klasycznie (Click)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0.00" {...field} onBlur={form.handleSubmit(onSubmit)} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="rates.classicGlue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Klasycznie (Klej)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0.00" {...field} onBlur={form.handleSubmit(onSubmit)} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="rates.herringboneClick"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Jodełka (Click)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0.00" {...field} onBlur={form.handleSubmit(onSubmit)} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="rates.herringboneGlue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Jodełka (Klej)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0.00" {...field} onBlur={form.handleSubmit(onSubmit)} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Cennik usług dodatkowych</FormLabel>
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
                        )}
                        {isArchitect && (
                            <Form {...architectForm}>
                                <form onChange={architectForm.handleSubmit(onArchitectSubmit)} className="space-y-4">
                                    <FormField
                                        control={architectForm.control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nazwa firmy</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nazwa firmy" {...field} onBlur={architectForm.handleSubmit(onArchitectSubmit)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={architectForm.control}
                                        name="nip"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>NIP</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="NIP" {...field} onBlur={architectForm.handleSubmit(onArchitectSubmit)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={architectForm.control}
                                        name="bankAccount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Numer konta</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Numer konta" {...field} onBlur={architectForm.handleSubmit(onArchitectSubmit)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={architectForm.control}
                                        name="commissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Stawka prowizji (PLN/m²)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="0.00" {...field} onBlur={architectForm.handleSubmit(onArchitectSubmit)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {isPending && <div className="text-xs text-muted-foreground">Zapisywanie...</div>}
                                </form>
                            </Form>
                        )}

                        {isPartner && (
                            <Form {...partnerForm}>
                                <form className="space-y-4">
                                    <h3 className="font-medium">Profil Partnera B2B</h3>
                                    <FormField
                                        control={partnerForm.control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nazwa firmy</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nazwa firmy" {...field} onBlur={partnerForm.handleSubmit(onPartnerSubmit)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={partnerForm.control}
                                        name="nip"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>NIP</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="NIP" {...field} onBlur={partnerForm.handleSubmit(onPartnerSubmit)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={partnerForm.control}
                                        name="bankAccount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Numer konta</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Numer konta" {...field} onBlur={partnerForm.handleSubmit(onPartnerSubmit)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={partnerForm.control}
                                        name="commissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Prowizja (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="10" {...field} onBlur={partnerForm.handleSubmit(onPartnerSubmit)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {isPending && <div className="text-xs text-muted-foreground">Zapisywanie...</div>}
                                </form>
                            </Form>
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        {isInstaller && (
                        isLoadingMontages ? (
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
                                                        <Badge variant="outline">{getStatusLabel(montage.status)}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )
                        )}
                        {isArchitect && (
                            isLoadingCommissions ? (
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
                                                <TableHead>Metraż</TableHead>
                                                <TableHead>Stawka</TableHead>
                                                <TableHead>Prowizja</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {commissions.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                        Brak historii prowizji
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                commissions.map((comm) => (
                                                    <TableRow key={comm.id}>
                                                        <TableCell>
                                                            {comm.createdAt ? new Date(comm.createdAt).toLocaleDateString('pl-PL') : '-'}
                                                        </TableCell>
                                                        <TableCell>{comm.montage?.clientName}</TableCell>
                                                        <TableCell>{comm.area} m²</TableCell>
                                                        <TableCell>{comm.rate} PLN</TableCell>
                                                        <TableCell>{(comm.amount / 100).toFixed(2)} PLN</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{comm.status}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )
                        )}
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
