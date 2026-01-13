'use client';

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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProduct } from "../actions";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
    name: z.string().min(2, "Nazwa musi mieć min. 2 znaki"),
    sku: z.string().min(2, "SKU musi mieć min. 2 znaki"),
    unit: z.string(),
    type: z.enum(["product", "service"]),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    collectionId: z.string().optional(),
    description: z.string().optional(),
    leadTime: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    length: z.string().optional(),
    weight: z.string().optional(),
    attributes: z.array(z.object({
        attributeId: z.string().min(1, "Wybierz atrybut"),
        value: z.string().optional(),
        optionId: z.string().optional(),
    })).optional(),
});

interface Attribute {
    id: string;
    name: string;
    type: string | null;
    options: { id: string; value: string; order: number | null }[];
}

interface Category {
    id: string;
    name: string;
}

interface ProductFormProps {
    onSuccess?: () => void;
    availableAttributes?: Attribute[];
    availableCategories?: Category[];
    availableBrands?: { id: string; name: string }[];
    availableCollections?: { id: string; name: string; brandId: string | null }[];
}

export function ProductForm({ 
    onSuccess, 
    availableAttributes = [], 
    availableCategories = [],
    availableBrands = [],
    availableCollections = []
}: ProductFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            sku: "",
            unit: "szt",
            type: "product",
            attributes: [],
            brandId: "", // Default empty
            collectionId: "", // Default empty
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "attributes",
    });

    const selectedBrandId = form.watch("brandId");
    const filteredCollections = availableCollections.filter(c => 
        !c.brandId || (selectedBrandId && c.brandId === selectedBrandId)
    );

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await createProduct({
                ...values,
                width: values.width ? parseFloat(values.width) : null,
                height: values.height ? parseFloat(values.height) : null,
                length: values.length ? parseFloat(values.length) : null,
                weight: values.weight ? parseFloat(values.weight) : null,
            });
            toast.success("Produkt utworzony");
            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/dashboard/erp/products");
            }
            router.refresh();
        } catch (error) {
            toast.error("Błąd podczas tworzenia produktu");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    // Helper to get attribute details by ID
    const getAttribute = (id: string | undefined) => availableAttributes.find(a => a.id === id);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>Nazwa Produktu</FormLabel>
                                <FormControl>
                                    <Input placeholder="np. Panel Dąb Naturalny" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>SKU (Kod)</FormLabel>
                                <FormControl>
                                    <Input placeholder="np. P-001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}                        name="leadTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Czas realizacji</FormLabel>
                                <FormControl>
                                    <Input placeholder="np. 3-5 dni, 24h" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}                        name="unit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jednostka</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Wybierz jednostkę" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="szt">szt</SelectItem>
                                        <SelectItem value="m2">m2</SelectItem>
                                        <SelectItem value="mb">mb</SelectItem>
                                        <SelectItem value="kpl">kpl</SelectItem>
                                        <SelectItem value="opak">opak</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Typ</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Wybierz typ" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="product">Towar</SelectItem>
                                        <SelectItem value="service">Usługa</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Kategoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Wybierz kategorię" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="brandId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Marka</FormLabel>
                                <Select onValueChange={(value) => {
                                    field.onChange(value);
                                    form.setValue("collectionId", ""); // Reset collection on brand change
                                }} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Wybierz markę" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableBrands.map((brand) => (
                                            <SelectItem key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="collectionId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Kolekcja</FormLabel>
                                <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                    disabled={!selectedBrandId && filteredCollections.length === 0}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Wybierz kolekcję" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredCollections.map((col) => (
                                            <SelectItem key={col.id} value={col.id}>
                                                {col.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Opis</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Opis produktu..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Długość (cm)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="width"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Szerokość (cm)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Wysokość (cm)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Waga (kg)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Attributes Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Atrybuty Produktu</CardTitle>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ attributeId: "", value: "", optionId: "" })}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Dodaj Atrybut</span>
                                <span className="sm:hidden">Dodaj</span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => {
                            const selectedAttrId = form.watch(`attributes.${index}.attributeId`);
                            const selectedAttr = getAttribute(selectedAttrId);

                            return (
                                <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start border-b pb-4 sm:border-0 sm:pb-0 last:border-0">
                                    <FormField
                                        control={form.control}
                                        name={`attributes.${index}.attributeId`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1 w-full">
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Wybierz atrybut" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {availableAttributes.map((attr) => (
                                                            <SelectItem key={attr.id} value={attr.id}>
                                                                {attr.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {selectedAttr && (
                                        <div className="flex-1 w-full">
                                            {selectedAttr.type === 'select' ? (
                                                <FormField
                                                    control={form.control}
                                                    name={`attributes.${index}.optionId`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Wybierz wartość" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {selectedAttr.options.map((opt) => (
                                                                        <SelectItem key={opt.id} value={opt.id}>
                                                                            {opt.value}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            ) : (
                                                <FormField
                                                    control={form.control}
                                                    name={`attributes.${index}.value`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input 
                                                                    type={selectedAttr.type === 'number' ? 'number' : 'text'} 
                                                                    placeholder="Wartość" 
                                                                    {...field} 
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="self-end sm:self-auto"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </div>
                            );
                        })}
                        {fields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Brak przypisanych atrybutów.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? "Zapisywanie..." : "Utwórz Produkt"}
                </Button>
            </form>
        </Form>
    );
}
