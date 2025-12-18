'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createProduct } from '../actions';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Nazwa musi mieć co najmniej 2 znaki.",
  }),
  sku: z.string().optional(),
  unit: z.string(),
  vatRate: z.coerce.number().min(0).max(100),
  purchasePrice: z.coerce.number().min(0).optional(), // Input as PLN, convert to grosz
  description: z.string().optional(),
  stockQuantity: z.coerce.number().int(),
  attributes: z.array(z.object({
    name: z.string().min(1, "Nazwa atrybutu wymagana"),
    value: z.string().min(1, "Wartość wymagana")
  }))
});

export function ProductForm() {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sku: "",
      unit: "szt",
      vatRate: 23,
      stockQuantity: 0,
      attributes: []
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attributes"
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const purchasePriceGrosz = values.purchasePrice ? Math.round(values.purchasePrice * 100) : undefined;
      
      // Convert simple name/value pairs to WooCommerce compatible structure
      const formattedAttributes = values.attributes.map(attr => ({
        id: 0, // 0 indicates custom attribute
        name: attr.name,
        options: attr.value.split(',').map(s => s.trim()), // Allow comma separated values
        visible: true,
        variation: false
      }));

      await createProduct({
        ...values,
        purchasePrice: purchasePriceGrosz,
        attributes: formattedAttributes
      });
      
      toast.success("Produkt został dodany");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Wystąpił błąd podczas dodawania produktu");
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Dodaj Kartotekę
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nowa Kartoteka</DialogTitle>
          <DialogDescription>
            Dodaj nowy produkt lub usługę do bazy lokalnej.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Usługa montażu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>SKU / Kod</FormLabel>
                    <FormControl>
                        <Input placeholder="np. USL-001" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Jednostka</FormLabel>
                    <FormControl>
                        <Input placeholder="szt, m2, mb" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cena Zakupu (Netto PLN)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={(field.value as number) ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="vatRate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Stawka VAT (%)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} value={(field.value as number) ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="stockQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stan początkowy</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={(field.value as number) ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <FormLabel>Atrybuty (Cechy)</FormLabel>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => append({ name: '', value: '' })}
                    >
                        <Plus className="h-3 w-3 mr-1" /> Dodaj cechę
                    </Button>
                </div>
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start">
                            <FormField
                                control={form.control}
                                name={`attributes.${index}.name`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input placeholder="Nazwa (np. Kolor)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`attributes.${index}.value`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input placeholder="Wartość (np. Dąb)" {...field} />
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
                            >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">Brak zdefiniowanych atrybutów.</p>
                    )}
                </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis wewnętrzny</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Dodatkowe informacje..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Zapisz</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
