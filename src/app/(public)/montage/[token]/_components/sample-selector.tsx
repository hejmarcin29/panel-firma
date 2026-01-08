"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { submitSampleRequest } from "../actions";
import { CheckCircle2, Package } from "lucide-react";

interface Product {
    id: string;
    name: string;
    sku: string;
    description: string | null;
}

interface SampleSelectorProps {
    token: string;
    samples: Product[];
}

export function SampleSelector({ token, samples }: SampleSelectorProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) {
            toast.error("Wybierz przynajmniej jedną próbkę.");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitSampleRequest(token, selectedIds);
            setIsSuccess(true);
            toast.success("Zamówienie złożone!");
        } catch (error) {
            console.error(error);
            toast.error("Wystąpił błąd. Spróbuj ponownie.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-bold text-green-900">Dziękujemy!</h2>
                <p className="text-lg text-muted-foreground max-w-md">
                    Twoje zamówienie na próbki zostało przyjęte. Poinformujemy Cię o wysyłce w osobnym powiadomieniu.
                </p>
                <div className="p-4 bg-muted rounded-lg mt-8">
                     <p className="text-sm font-medium">To okno możesz teraz zamknąć.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Wybierz Próbki Podłóg</h1>
                <p className="text-muted-foreground">Zaznacz interesujące Cię produkty, a my wyślemy je do Ciebie bezpłatnie.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {samples.map(sample => (
                    <Card 
                        key={sample.id} 
                        className={`cursor-pointer transition-all border-2 hover:border-primary/50 ${selectedIds.includes(sample.id) ? 'border-primary bg-primary/5' : 'border-transparent'}`}
                        onClick={() => toggleSelection(sample.id)}
                    >
                        <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                            <div className="flex-1">
                                <CardTitle className="text-base line-clamp-2">{sample.name}</CardTitle>
                                <p className="text-xs text-muted-foreground font-mono mt-1">{sample.sku}</p>
                            </div>
                            <Checkbox 
                                checked={selectedIds.includes(sample.id)}
                                onCheckedChange={() => toggleSelection(sample.id)}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-square bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                {/* Placeholder for image */}
                                <Package className="h-10 w-10 opacity-20" />
                            </div>
                            {sample.description && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {sample.description}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="sticky bottom-4 mx-auto max-w-md">
                <div className="bg-background/80 backdrop-blur-md border rounded-full p-2 shadow-2xl flex items-center justify-between pl-6 pr-2">
                    <div className="font-medium text-sm">
                        Wybrano: <span className="font-bold text-primary">{selectedIds.length}</span>
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting || selectedIds.length === 0} size="lg" className="rounded-full">
                        {isSubmitting ? "Wysyłanie..." : "Zamawiam Wybrane"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
