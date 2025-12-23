'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Download, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getWooAttributes, importProductsFromWoo, type WooAttribute, type AttributeMapping } from "../import-actions";
import { Badge } from "@/components/ui/badge";

interface ImportWizardProps {
    existingAttributes: { id: string; name: string }[];
}

export function ImportWizard({ existingAttributes }: ImportWizardProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'analyze' | 'map' | 'importing' | 'done'>('analyze');
    const [wooAttributes, setWooAttributes] = useState<WooAttribute[]>([]);
    const [mapping, setMapping] = useState<AttributeMapping>({});
    const [isLoading, setIsLoading] = useState(false);
    const [importResult, setImportResult] = useState<{ count: number } | null>(null);

    async function handleAnalyze() {
        setIsLoading(true);
        try {
            const result = await getWooAttributes();
            if (result.success && result.data) {
                setWooAttributes(result.data);
                
                // Pre-fill mapping
                const initialMapping: AttributeMapping = {};
                result.data.forEach(wa => {
                    // Try to find exact match by name
                    const match = existingAttributes.find(ea => ea.name.toLowerCase() === wa.name.toLowerCase());
                    if (match) {
                        initialMapping[wa.name] = { action: 'map', targetId: match.id };
                    } else {
                        initialMapping[wa.name] = { action: 'create' };
                    }
                });
                setMapping(initialMapping);
                setStep('map');
            } else {
                toast.error(result.error || "Nie udało się pobrać atrybutów z WP");
            }
        } catch {
            toast.error("Błąd połączenia");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleImport() {
        setStep('importing');
        try {
            const result = await importProductsFromWoo(mapping);
            if (result.success) {
                setImportResult({ count: result.count || 0 });
                setStep('done');
                toast.success("Import zakończony sukcesem");
            } else {
                toast.error(result.error || "Błąd importu");
                setStep('map'); // Go back on error
            }
        } catch {
            toast.error("Wystąpił błąd krytyczny");
            setStep('map');
        }
    }

    const updateMapping = (wooName: string, updates: Partial<{ action: 'create' | 'map' | 'ignore', targetId?: string }>) => {
        setMapping(prev => ({
            ...prev,
            [wooName]: { ...prev[wooName], ...updates }
        }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Importuj z WP
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px]">
                <DialogHeader>
                    <DialogTitle>Import Produktów z WooCommerce</DialogTitle>
                    <DialogDescription>
                        Kreator pomoże Ci zaimportować produkty i zmapować atrybuty.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 'analyze' && (
                        <div className="text-center py-8 space-y-4">
                            <p className="text-muted-foreground">
                                Kliknij poniżej, aby pobrać listę atrybutów ze sklepu i przygotować mapowanie.
                            </p>
                            <Button onClick={handleAnalyze} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Analizuj Sklep
                            </Button>
                        </div>
                    )}

                    {step === 'map' && (
                        <div className="space-y-4">
                            <div className="border rounded-md max-h-[60vh] overflow-y-auto relative">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                        <TableRow>
                                            <TableHead className="w-[35%]">Atrybut w WP</TableHead>
                                            <TableHead className="w-[200px]">Akcja</TableHead>
                                            <TableHead>Atrybut w Panelu</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {wooAttributes.map((wa) => (
                                            <TableRow key={wa.id}>
                                                <TableCell className="font-medium">
                                                    {wa.name} <span className="text-xs text-muted-foreground">({wa.slug})</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Select 
                                                        value={mapping[wa.name]?.action} 
                                                        onValueChange={(val) => updateMapping(wa.name, { action: val as 'create' | 'map' | 'ignore' })}
                                                    >
                                                        <SelectTrigger className="w-[140px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="create">Utwórz nowy</SelectItem>
                                                            <SelectItem value="map">Mapuj istniejący</SelectItem>
                                                            <SelectItem value="ignore">Ignoruj</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    {mapping[wa.name]?.action === 'map' && (
                                                        <Select 
                                                            value={mapping[wa.name]?.targetId} 
                                                            onValueChange={(val) => updateMapping(wa.name, { targetId: val })}
                                                        >
                                                            <SelectTrigger className="w-[200px]">
                                                                <SelectValue placeholder="Wybierz atrybut..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    <SelectLabel>Pola Systemowe</SelectLabel>
                                                                    <SelectItem value="__sys_width">Szerokość (Width)</SelectItem>
                                                                    <SelectItem value="__sys_height">Wysokość (Height)</SelectItem>
                                                                    <SelectItem value="__sys_length">Długość (Length)</SelectItem>
                                                                    <SelectItem value="__sys_weight">Waga (Weight)</SelectItem>
                                                                </SelectGroup>
                                                                <SelectGroup>
                                                                    <SelectLabel>Atrybuty</SelectLabel>
                                                                    {existingAttributes.map(ea => (
                                                                        <SelectItem key={ea.id} value={ea.id}>{ea.name}</SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                    {mapping[wa.name]?.action === 'create' && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Zostanie utworzony: {wa.name}
                                                        </Badge>
                                                    )}
                                                    {mapping[wa.name]?.action === 'ignore' && (
                                                        <span className="text-muted-foreground text-sm italic">Pomiń</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {wooAttributes.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                    Nie znaleziono globalnych atrybutów w WP. Produkty zostaną zaimportowane bez mapowania.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="text-center py-12 space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                            <h3 className="text-lg font-medium">Trwa importowanie produktów...</h3>
                            <p className="text-muted-foreground">To może potrwać kilka minut. Nie zamykaj tego okna.</p>
                        </div>
                    )}

                    {step === 'done' && (
                        <div className="text-center py-8 space-y-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                            <h3 className="text-xl font-bold">Gotowe!</h3>
                            <p className="text-muted-foreground">
                                Zaimportowano {importResult?.count} produktów.
                            </p>
                            <Button onClick={() => setOpen(false)}>Zamknij</Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 'map' && (
                        <Button onClick={handleImport}>
                            Rozpocznij Import <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
