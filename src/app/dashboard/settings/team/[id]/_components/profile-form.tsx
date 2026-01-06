
'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateInstallerProfile, updateArchitectProfile, updatePartnerProfile } from '../../actions';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProfileForm({ user }: { user: any }) {
    const isInstaller = user.roles.includes('installer');
    const isArchitect = user.roles.includes('architect');
    const isPartner = user.roles.includes('partner');

    if (isInstaller) return <InstallerForm user={user} />;
    if (isArchitect) return <ArchitectForm user={user} />;
    if (isPartner) return <PartnerForm user={user} />;

    return <div>Brak dostępnych ustawień profilu dla tej roli.</div>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InstallerForm({ user }: { user: any }) {
    const [isPending, startTransition] = useTransition();
    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            workScope: user.installerProfile?.workScope || '',
            operationArea: user.installerProfile?.operationArea || '',
            rates: user.installerProfile?.rates || {},
            pricing: user.installerProfile?.pricing || [],
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSubmit = (values: any) => {
        startTransition(async () => {
             try {
                await updateInstallerProfile(user.id, values);
                alert('Zapisano profil montażysty');
             } catch(e) { console.error(e); alert('Błąd'); }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
                 <FormField
                    control={form.control}
                    name="workScope"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Zakres prac</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="operationArea"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Obszar działania</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                    )}
                />
                {/* Rates would go here, simplified for brevity */}
                <Button disabled={isPending}>{isPending ? <Loader2 className="animate-spin" /> : 'Zapisz'}</Button>
            </form>
        </Form>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ArchitectForm({ user }: { user: any }) {
    const [isPending, startTransition] = useTransition();
    const form = useForm({
        resolver: zodResolver(architectProfileSchema),
        defaultValues: {
            companyName: user.architectProfile?.companyName || '',
            nip: user.architectProfile?.nip || '',
            bankAccount: user.architectProfile?.bankAccount || '',
            commissionRate: user.architectProfile?.commissionRate || 0,
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSubmit = (values: any) => {
         startTransition(async () => {
             // We need to preserve assignedProductIds
             const currentProfile = user.architectProfile || {};
             const newProfile = { ...currentProfile, ...values };
             try {
                await updateArchitectProfile(user.id, newProfile);
                alert('Zapisano profil architekta');
             } catch(e) { console.error(e); alert('Błąd'); }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem><FormLabel>Nazwa firmy</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                 <FormField control={form.control} name="nip" render={({ field }) => (
                    <FormItem><FormLabel>NIP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                 <FormField control={form.control} name="bankAccount" render={({ field }) => (
                    <FormItem><FormLabel>Nr konta</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                 <FormField control={form.control} name="commissionRate" render={({ field }) => (
                    <FormItem><FormLabel>Stawka prowizji (PLN/m2)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <Button disabled={isPending}>{isPending ? <Loader2 className="animate-spin" /> : 'Zapisz'}</Button>
            </form>
        </Form>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PartnerForm({ user }: { user: any }) {
    const [isPending, startTransition] = useTransition();
    const form = useForm({
        resolver: zodResolver(partnerProfileSchema),
        defaultValues: {
            companyName: user.partnerProfile?.companyName || '',
            nip: user.partnerProfile?.nip || '',
            bankAccount: user.partnerProfile?.bankAccount || '',
            commissionRate: user.partnerProfile?.commissionRate || 0,
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSubmit = (values: any) => {
        startTransition(async () => {
             try {
                await updatePartnerProfile(user.id, values);
                 alert('Zapisano profil partnera');
             } catch(e) { console.error(e); alert('Błąd'); }
        });
    };

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem><FormLabel>Nazwa firmy</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                 <FormField control={form.control} name="nip" render={({ field }) => (
                    <FormItem><FormLabel>NIP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                 <FormField control={form.control} name="bankAccount" render={({ field }) => (
                    <FormItem><FormLabel>Nr konta</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                 <FormField control={form.control} name="commissionRate" render={({ field }) => (
                    <FormItem><FormLabel>Prowizja (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <Button disabled={isPending}>{isPending ? <Loader2 className="animate-spin" /> : 'Zapisz'}</Button>
            </form>
        </Form>
    );
}
