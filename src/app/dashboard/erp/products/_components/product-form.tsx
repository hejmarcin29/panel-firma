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
import { PRODUCT_UNITS } from "@/lib/constants";

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
    packageSizeM2: z.string()
        .optional()
        .refine(val => !val || /^\d+(\.\d{1,2})?$/.test(val), {
            message: "Format musi być 0.00 (np. 1.77)"
        }),
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
            // Create FormData to handle file
            const formData = new FormData();
            
            // Get file from input ref 
            const fileInput = document.querySelector('input[name="imageFile"]') as HTMLInputElement;
            if (fileInput?.files?.[0]) {
                formData.append('imageFile', fileInput.files[0]);
            }

            const payload = {
                ...values,
                width: values.width ? parseFloat(values.width) : null,
                height: values.height ? parseFloat(values.height) : null,
                length: values.length ? parseFloat(values.length) : null,
                weight: values.weight ? parseFloat(values.weight) : null,
                packageSizeM2: values.packageSizeM2 ? parseFloat(values.packageSizeM2) : null,
            };

            // @ts-ignore - FormData handling via server action binding is tricky in strict TS
            const result = await createProduct(payload, formData);
            
            if (result.success) {
                toast.success("Produkt utworzony");
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push(`/dashboard/erp/products/${result.id}`);
                }
                router.refresh();
            }
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
                
                <Card className="border-dashed bg-slate-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Zdjęcie Główne (Miniaturka)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 bg-white border rounded-md flex items-center justify-center">
                                <Plus className="h-6 w-6 text-muted-foreground opacity-50" />
                            </div>
                            <div className="space-y-2 flex-1">
                                <Input type="file" name="imageFile" accept="image/*" className="bg-white" />
                                <p className="text-[10px] text-muted-foreground">
                                    System automatycznie przekonwertuje plik na format WebP (Quality 90).
                                    Max rozdzielczość 2560px.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                <div className="flex gap-2">
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Wybierz jednostkę" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {PRODUCT_UNITS.map(u => (
                                            <SelectItem key={u.value} value={u.value}>{u.value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.watch('unit') === 'm2' && (
                                    <FormField
                                        control={form.control}
                                        name="packageSizeM2"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormControl>
                                                    <Input 
                                                        placeholder="m2 w paczce (np. 1.77)" 
                                                        {...field} 
                                                        onChange={(e) => {
                                                            let val = e.target.value.replace(',', '.');
                                                            // Allow only numbers and one dot
                                                            if (/^\d*\.?\d{0,2}$/.test(val)) {
                                                                field.onChange(val);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                </div>
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
