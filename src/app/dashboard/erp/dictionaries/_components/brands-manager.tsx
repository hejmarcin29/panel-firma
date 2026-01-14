'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useTransition } from "react";
import { createBrand, deleteBrand, updateBrand, uploadBrandLogo } from "../actions";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SingleImageUpload } from "@/components/common/single-image-upload";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BrandsManager({ initialData }: { initialData: any[] }) {
    const [name, setName] = useState("");
    const [isPending, startTransition] = useTransition();
    const [editingBrand, setEditingBrand] = useState<{ id: string, name: string, imageUrl: string | null } | null>(null);

    function handleAdd() {
        if (!name) return;
        startTransition(() => {
            createBrand(name)
                .then(() => {
                    toast.success("Marka dodana");
                    setName("");
                })
                .catch(() => toast.error("Błąd podczas dodawania marki"));
        });
    }

    function handleDelete(id: string) {
        if(!confirm("Czy na pewno chcesz usunąć tę markę?")) return;
        startTransition(() => {
            deleteBrand(id)
                .then(() => toast.success("Marka usunięta"))
                .catch((e) => toast.error(e.message));
        });
    }

    function handleUpdate(id: string, updates: { name?: string, imageUrl?: string | null }) {
        startTransition(() => {
            updateBrand(id, updates)
                .then(() => {
                    toast.success("Marka zaktualizowana");
                    setEditingBrand(null);
                })
                .catch((e) => toast.error("Błąd aktualizacji: " + e.message));
        });
    }

    const handleUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return await uploadBrandLogo(formData);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Marki i Producenci</CardTitle>
                <CardDescription>Dodaj producentów podłóg, aby grupować po nich produkty.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2 max-w-sm">
                    <Input 
                        placeholder="Nazwa marki..." 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <Button onClick={handleAdd} disabled={isPending}>Dodaj</Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Logo</TableHead>
                                <TableHead>Nazwa</TableHead>
                                <TableHead className="w-[100px] text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                        Brak zdefiniowanych marek.
                                    </TableCell>
                                </TableRow>
                            )}
                            {initialData.map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell>
                                        {brand.imageUrl ? (
                                            <div className="relative h-10 w-16 overflow-hidden rounded bg-white border">
                                                <Image src={brand.imageUrl} alt={brand.name} fill className="object-contain p-1" />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-16 bg-muted/50 rounded flex items-center justify-center text-xs text-muted-foreground">
                                                Brak
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{brand.name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Dialog open={editingBrand?.id === brand.id} onOpenChange={(open) => !open && setEditingBrand(null)}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingBrand({
                                                        id: brand.id,
                                                        name: brand.name,
                                                        imageUrl: brand.imageUrl
                                                    })}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edytuj markę</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label>Nazwa</Label>
                                                            <Input 
                                                                value={editingBrand?.name || ''} 
                                                                onChange={(e) => setEditingBrand(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Logo</Label>
                                                            <div className="max-w-[200px]">
                                                                <SingleImageUpload 
                                                                    value={editingBrand?.imageUrl}
                                                                    onChange={(url) => setEditingBrand(prev => prev ? ({ ...prev, imageUrl: url }) : null)}
                                                                    onUpload={handleUpload}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setEditingBrand(null)}>Anuluj</Button>
                                                        <Button onClick={() => editingBrand && handleUpdate(brand.id, { name: editingBrand.name, imageUrl: editingBrand.imageUrl })}>
                                                            Zapisz
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(brand.id)} disabled={isPending}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
