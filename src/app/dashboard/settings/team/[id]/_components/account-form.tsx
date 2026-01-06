
'use client';

import { useState, useTransition } from 'react';
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
import { updateEmployeeCredentials } from '../../actions';

const accountSchema = z.object({
    name: z.string().min(2, "Nazwa musi mieć min. 2 znaki"),
    email: z.string().email("Nieprawidłowy adres email"),
    password: z.string().min(8, "Hasło musi mieć min. 8 znaków").optional().or(z.literal('')),
});

interface AccountFormProps {
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

export function AccountForm({ user }: AccountFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof accountSchema>>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: user.name || '',
            email: user.email,
            password: '',
        },
    });

    const onSubmit = (values: z.infer<typeof accountSchema>) => {
        startTransition(async () => {
            try {
                await updateEmployeeCredentials(user.id, {
                    name: values.name,
                    email: values.email,
                    password: values.password || undefined,
                });
                alert('Dane konta zostały zaktualizowane.');
                form.reset({ ...values, password: '' });
            } catch (error) {
                console.error(error);
                alert('Wystąpił błąd podczas aktualizacji danych konta.');
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imię i nazwisko</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Adres email</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nowe hasło (opcjonalnie)</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Pozostaw puste, aby nie zmieniać" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Zapisz zmiany
                    </Button>
                </div>
            </form>
        </Form>
    );
}
