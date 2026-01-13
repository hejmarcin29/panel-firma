'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useTransition } from "react";
import { createBrand, deleteBrand } from "../actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used, or use-toast if not

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BrandsManager({ initialData }: { initialData: any[] }) {
    const [name, setName] = useState("");
    const [isPending, startTransition] = useTransition();

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
                                <TableHead>Nazwa</TableHead>
                                <TableHead className="w-[100px]">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                        Brak zdefiniowanych marek.
                                    </TableCell>
                                </TableRow>
                            )}
                            {initialData.map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell className="font-medium">{brand.name}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(brand.id)} disabled={isPending}>
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
