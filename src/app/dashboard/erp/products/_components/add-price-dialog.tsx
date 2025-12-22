'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { addProductPrice } from "../actions";
import { toast } from "sonner";

const formSchema = z.object({
    supplierId: z.string().min(1, "Wybierz dostawcę"),
    netPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Cena musi być większa od 0"),
    supplierSku: z.string().optional(),
    isDefault: z.boolean(),
});

interface AddPriceDialogProps {
    productId: string;
    suppliers: { id: string; name: string; shortName: string | null }[];
}

export function AddPriceDialog({ productId, suppliers }: AddPriceDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            supplierId: "",
            netPrice: "",
            supplierSku: "",
            isDefault: false,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await addProductPrice({
                productId,
                ...values,
                netPrice: parseFloat(values.netPrice),
            });
            toast.success("Cena dodana");
            setOpen(false);
            form.reset();
        } catch (error) {
            toast.error("Błąd podczas dodawania ceny");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj Cenę
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Dodaj cenę zakupu</DialogTitle>
                    <DialogDescription>
                        Przypisz dostawcę i ustal cenę zakupu dla tego produktu.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="supplierId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dostawca</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Wybierz dostawcę" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {suppliers.map((supplier) => (
                                                <SelectItem key={supplier.id} value={supplier.id}>
                                                    {supplier.shortName || supplier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="netPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cena Netto (PLN)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="supplierSku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kod u dostawcy</FormLabel>
                                        <FormControl>
                                            <Input placeholder="np. 77382" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="isDefault"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Główny dostawca
                                        </FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Ta cena będzie domyślnie używana w ofertach.
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
