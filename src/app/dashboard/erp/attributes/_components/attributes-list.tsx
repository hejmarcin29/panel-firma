'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, List, Type, Hash } from "lucide-react";
import { deleteAttribute } from "../actions";
import { toast } from "sonner";

interface Attribute {
    id: string;
    name: string;
    type: string | null;
    options: { id: string; value: string; order: number | null }[];
}

interface AttributesListProps {
    data: Attribute[];
}

export function AttributesList({ data }: AttributesListProps) {

    async function handleDelete(id: string) {
        if (!confirm("Czy na pewno chcesz usunąć ten atrybut?")) return;
        
        const result = await deleteAttribute(id);
        if (result.success) {
            toast.success("Atrybut usunięty");
        } else {
            toast.error(result.error || "Błąd usuwania");
        }
    }

    const getTypeIcon = (type: string | null) => {
        switch (type) {
            case 'select': return <List className="h-4 w-4" />;
            case 'number': return <Hash className="h-4 w-4" />;
            default: return <Type className="h-4 w-4" />;
        }
    };

    const getTypeName = (type: string | null) => {
        switch (type) {
            case 'select': return 'Lista (Słownik)';
            case 'number': return 'Liczba';
            case 'text': return 'Tekst';
            default: return type;
        }
    };

    if (data.length === 0) {
        return (
            <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                Brak zdefiniowanych atrybutów. Dodaj pierwszy, aby zacząć opisywać produkty.
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((attr) => (
                <Card key={attr.id} className="relative group">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    {attr.name}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1 text-xs">
                                    {getTypeIcon(attr.type)}
                                    {getTypeName(attr.type)}
                                </CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                onClick={() => handleDelete(attr.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {attr.type === 'select' ? (
                            <div className="flex flex-wrap gap-1">
                                {attr.options.length > 0 ? (
                                    attr.options.map((opt) => (
                                        <Badge key={opt.id} variant="secondary" className="text-xs font-normal">
                                            {opt.value}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">Brak opcji</span>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs text-muted-foreground italic">
                                Wartość wpisywana ręcznie
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
