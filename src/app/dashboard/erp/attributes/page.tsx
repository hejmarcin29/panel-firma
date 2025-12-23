import { Suspense } from "react";
import { getAttributes } from "./actions";
import { AttributeSheet } from "./_components/attribute-sheet";
import { AttributesList } from "./_components/attributes-list";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AttributesPage() {
    const attributes = await getAttributes();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Atrybuty Produktów</h2>
                    <p className="text-muted-foreground">
                        Definiuj cechy produktów (np. Klasa ścieralności, Kolor, Wykończenie), aby zachować spójność danych.
                    </p>
                </div>
                <AttributeSheet />
            </div>

            <Suspense fallback={<AttributesSkeleton />}>
                <AttributesList data={attributes} />
            </Suspense>
        </div>
    );
}

function AttributesSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-[140px] rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-12 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-10 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
