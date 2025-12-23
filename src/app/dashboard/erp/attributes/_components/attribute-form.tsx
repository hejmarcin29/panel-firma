'use client';

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
    FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { createAttribute } from "../actions";
import { toast } from "sonner";

const formSchema = z.object({
    name: z.string().min(2, "Nazwa musi mieć min. 2 znaki"),
    type: z.string(),
    options: z.array(z.object({
        value: z.string().min(1, "Wartość nie może być pusta")
    })).optional()
});

interface AttributeFormProps {
    onSuccess?: () => void;
}

export function AttributeForm({ onSuccess }: AttributeFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "select",
            options: [{ value: "" }]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options"
    });

    const type = form.watch("type");

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await createAttribute({
                name: values.name,
                type: values.type,
                options: values.type === 'select' ? values.options?.map(o => o.value) : undefined
            });
            toast.success("Atrybut dodany");
            form.reset();
            onSuccess?.();
        } catch (error) {
            toast.error("Błąd podczas dodawania atrybutu");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nazwa Atrybutu</FormLabel>
                            <FormControl>
                                <Input placeholder="np. Klasa ścieralności, Kolor" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Typ Pola</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wybierz typ" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="select">Lista rozwijana (Słownik)</SelectItem>
                                    <SelectItem value="text">Tekst (Wpis ręczny)</SelectItem>
                                    <SelectItem value="number">Liczba</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {field.value === 'select' 
                                    ? "Użytkownik wybierze jedną z zdefiniowanych opcji." 
                                    : "Użytkownik wpisze wartość ręcznie."}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {type === 'select' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <FormLabel>Opcje do wyboru</FormLabel>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => append({ value: "" })}
                            >
                                <Plus className="mr-2 h-3 w-3" />
                                Dodaj opcję
                            </Button>
                        </div>
                        
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`options.${index}.value`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input placeholder={`Opcja ${index + 1}`} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Zapisywanie..." : "Utwórz Atrybut"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
