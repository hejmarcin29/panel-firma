'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { createContractTemplate, updateContractTemplate, deleteContractTemplate } from '../contracts/actions';

const formSchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana'),
    content: z.string().min(1, 'Treść jest wymagana'),
    isDefault: z.boolean(),
});

interface Template {
    id: string;
    name: string;
    content: string;
    isDefault: boolean | null;
}

export function ContractTemplatesManager({ templates }: { templates: Template[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            content: '',
            isDefault: false,
        },
    });

    const handleEdit = (template: Template) => {
        setEditingTemplate(template);
        form.reset({
            name: template.name,
            content: template.content,
            isDefault: template.isDefault || false,
        });
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        form.reset({
            name: '',
            content: '',
            isDefault: false,
        });
        setIsDialogOpen(true);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSaving(true);
        try {
            if (editingTemplate) {
                await updateContractTemplate(editingTemplate.id, values);
                toast.success('Zaktualizowano szablon');
            } else {
                await createContractTemplate(values);
                toast.success('Utworzono szablon');
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error('Wystąpił błąd');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return;
        try {
            await deleteContractTemplate(id);
            toast.success('Usunięto szablon');
        } catch {
            toast.error('Wystąpił błąd');
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Szablony Umów</CardTitle>
                    <CardDescription>Zarządzaj wzorami umów generowanych dla klientów.</CardDescription>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Nowy Szablon
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>Domyślny</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates.map((template) => (
                            <TableRow key={template.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {template.name}
                                </TableCell>
                                <TableCell>
                                    {template.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Domyślny</span>}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {templates.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    Brak szablonów. Dodaj pierwszy szablon.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingTemplate ? 'Edytuj Szablon' : 'Nowy Szablon'}</DialogTitle>
                            <DialogDescription>
                                Dostępne zmienne: {'{{klient_nazwa}}'}, {'{{klient_adres}}'}, {'{{numer_wyceny}}'}, {'{{kwota_brutto}}'}, {'{{data_rozpoczecia}}'}, {'{{termin_zakonczenia}}'}, {'{{kwota_zaliczki}}'}, {'{{podpis_wykonawcy}}'}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nazwa szablonu</FormLabel>
                                            <FormControl>
                                                <Input placeholder="np. Umowa Standardowa" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                                                    Ustaw jako domyślny
                                                </FormLabel>
                                                <FormDescription>
                                                    Ten szablon będzie wybierany automatycznie przy tworzeniu nowej umowy.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Treść umowy</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Treść umowy..." 
                                                    className="min-h-[400px] font-mono text-sm" 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Możesz używać Markdown do formatowania tekstu.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Zapisz
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
