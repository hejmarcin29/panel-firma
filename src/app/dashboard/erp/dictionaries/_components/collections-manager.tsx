'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useTransition } from "react";
import { createCollection, deleteCollection } from "../actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner"; 

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CollectionsManager({ initialData, brands }: { initialData: any[], brands: any[] }) {
    const [name, setName] = useState("");
    const [brandId, setBrandId] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleAdd() {
        if (!name || !brandId) {
            toast.error("Wybierz markę i wpisz nazwę kolekcji");
            return;
        }
        startTransition(() => {
            createCollection(name, brandId)
                .then(() => {
                    toast.success("Kolekcja dodana");
                    setName("");
                })
                .catch(() => toast.error("Błąd podczas dodawania kolekcji"));
        });
    }

    function handleDelete(id: string) {
        if(!confirm("Czy na pewno chcesz usunąć tę kolekcję?")) return;
        startTransition(() => {
            deleteCollection(id)
                .then(() => toast.success("Kolekcja usunięta"))
                .catch((e) => toast.error(e.message));
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kolekcje</CardTitle>
                <CardDescription>Przypisz kolekcje do marek (np. &quot;Smaki Życia&quot; do &quot;Barlinek&quot;).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
                    <Select value={brandId} onValueChange={setBrandId}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Wybierz Markę" />
                        </SelectTrigger>
                        <SelectContent>
                            {brands.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input 
                        placeholder="Nazwa kolekcji..." 
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
                                <TableHead>Kolekcja</TableHead>
                                <TableHead>Marka</TableHead>
                                <TableHead className="w-[100px]">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                        Brak zdefiniowanych kolekcji.
                                    </TableCell>
                                </TableRow>
                            )}
                            {initialData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{item.brand?.name || '-'}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={isPending}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
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
