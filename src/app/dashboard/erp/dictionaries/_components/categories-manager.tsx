'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useTransition } from "react";
import { createCategory, deleteCategory } from "../actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
}

export function CategoriesManager({ initialData }: { initialData: Category[] }) {
    const [name, setName] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleAdd() {
        if (!name) return;
        startTransition(() => {
            createCategory(name)
                .then(() => {
                    toast.success("Kategoria dodana");
                    setName("");
                })
                .catch(() => toast.error("Błąd podczas dodawania kategorii"));
        });
    }

    function handleDelete(id: string) {
        if(!confirm("Czy na pewno chcesz usunąć tę kategorię?")) return;
        startTransition(() => {
            deleteCategory(id)
                .then(() => toast.success("Kategoria usunięta"))
                .catch((e) => toast.error(e.message));
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kategorie</CardTitle>
                <CardDescription>Zarządzaj drzewem kategorii produktów.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2 max-w-sm">
                    <Input 
                        placeholder="Nazwa kategorii..." 
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
                                        Brak zdefiniowanych kategorii.
                                    </TableCell>
                                </TableRow>
                            )}
                            {initialData.map((cat) => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} disabled={isPending}>
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
