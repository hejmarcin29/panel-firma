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

import { createContractTemplate, updateContractTemplate, deleteContractTemplate, resetToDefaultTemplate } from '../contracts/actions';

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
    const [showPreview, setShowPreview] = useState(false);

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

    const handleReset = async () => {
        if (!confirm('Czy na pewno chcesz przywrócić domyślny szablon profesjonalny?')) return;
        setIsSaving(true);
        try {
            await resetToDefaultTemplate();
            toast.success('Przywrócono domyślny szablon');
        } catch (error) {
            toast.error('Błąd przywracania szablonu');
        } finally {
            setIsSaving(false);
        }
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
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                        <FileText className="mr-2 h-4 w-4" /> Przywróć Domyślny
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Nowy Szablon
                    </Button>
                </div>
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
                    <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="p-6 pb-2 shrink-0">
                            <DialogTitle>{editingTemplate ? 'Edytuj Szablon' : 'Nowy Szablon'}</DialogTitle>
                            <DialogDescription>
                                Dostępne zmienne: {'{{klient_nazwa}}'}, {'{{klient_adres}}'}, {'{{numer_wyceny}}'}, {'{{kwota_brutto}}'}, {'{{data_rozpoczecia}}'}, {'{{termin_zakonczenia}}'}, {'{{kwota_zaliczki}}'}, {'{{podpis_wykonawcy}}'}, {'{{logo_firmy}}'}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                                <div className="flex-1 flex flex-col gap-4 p-6 pt-2 overflow-hidden">
                                    <div className="flex gap-4 shrink-0">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
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
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-8">
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
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between shrink-0">
                                        <FormLabel>Treść umowy (HTML)</FormLabel>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setShowPreview(!showPreview)}
                                        >
                                            {showPreview ? 'Edytuj kod' : 'Podgląd'}
                                        </Button>
                                    </div>

                                    <div className="flex-1 border rounded-md overflow-hidden relative">
                                        {showPreview ? (
                                            <div className="absolute inset-0 overflow-auto bg-white p-8">
                                                <div 
                                                    className="prose max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: form.watch('content') }} 
                                                />
                                            </div>
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name="content"
                                                render={({ field }) => (
                                                    <FormItem className="h-full space-y-0">
                                                        <FormControl>
                                                            <Textarea 
                                                                placeholder="Treść umowy..." 
                                                                className="h-full resize-none font-mono text-sm p-4 border-0 focus-visible:ring-0 rounded-none" 
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>
                                <DialogFooter className="p-6 pt-2 shrink-0 bg-background border-t">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Anuluj
                                    </Button>
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
