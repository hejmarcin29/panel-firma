'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupplier, updateSupplier } from "../actions";
import { toast } from "sonner";

const formSchema = z.object({
    name: z.string().min(2, "Nazwa musi mieć min. 2 znaki"),
    shortName: z.string().optional(),
    nip: z.string().optional(),
    email: z.string().email("Niepoprawny email").optional().or(z.literal("")),
    phone: z.string().optional(),
    website: z.string().url("Niepoprawny URL").optional().or(z.literal("")),
    bankAccount: z.string().optional(),
    paymentTerms: z.string(),
    description: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    country: z.string(),
});

interface SupplierFormProps {
    onSuccess?: () => void;
    initialData?: any;
}

export function SupplierForm({ onSuccess, initialData }: SupplierFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            shortName: initialData?.shortName || "",
            nip: initialData?.nip || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            website: initialData?.website || "",
            bankAccount: initialData?.bankAccount || "",
            paymentTerms: initialData?.paymentTerms?.toString() || "14",
            description: initialData?.description || "",
            street: initialData?.address?.street || "",
            city: initialData?.address?.city || "",
            zip: initialData?.address?.zip || "",
            country: initialData?.address?.country || "Polska",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            if (initialData) {
                await updateSupplier(initialData.id, {
                    ...values,
                    paymentTerms: parseInt(values.paymentTerms),
                });
                toast.success("Dostawca zaktualizowany");
            } else {
                await createSupplier({
                    ...values,
                    paymentTerms: parseInt(values.paymentTerms),
                });
                toast.success("Dostawca utworzony");
            }
            
            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/dashboard/erp/suppliers");
            }
            router.refresh();
        } catch (error) {
            toast.error("Błąd podczas zapisu dostawcy");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Nazwa Pełna</FormLabel>
                                <FormControl>
                                    <Input placeholder="np. Hurtownia Budowlana XYZ Sp. z o.o." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="shortName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nazwa Skrócona</FormLabel>
                                <FormControl>
                                    <Input placeholder="np. Hurtownia XYZ" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="nip"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>NIP</FormLabel>
                                <FormControl>
                                    <Input placeholder="000-000-00-00" {...field} />
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
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="biuro@xyz.pl" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telefon</FormLabel>
                                <FormControl>
                                    <Input placeholder="+48 123 456 789" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="bankAccount"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Numer Konta</FormLabel>
                                <FormControl>
                                    <Input placeholder="PL..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="paymentTerms"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Termin płatności (dni)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium">Adres</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="street"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>Ulica i numer</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="zip"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kod pocztowy</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Miasto</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Uwagi</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Dodatkowe informacje..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Zapisywanie..." : "Utwórz Dostawcę"}
                </Button>
            </form>
        </Form>
    );
}
