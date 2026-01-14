import { Suspense } from 'react';
import { getReviews } from "./actions";
import { ReviewForm } from "./_components/review-form";
import { ReviewsTable } from "./_components/reviews-table";
import { db } from "@/lib/db";
import { erpProducts } from "@/lib/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function ReviewsPage() {
    const [reviews, products] = await Promise.all([
        getReviews(),
        db.select({
            id: erpProducts.id,
            name: erpProducts.name
        }).from(erpProducts)
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Opinie o produktach</h2>
                    <p className="text-muted-foreground">
                        Zarządzaj opiniami klientów i dodawaj opinie ręcznie (migracja).
                    </p>
                </div>
                <ReviewForm products={products} />
            </div>
            
            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Wszystkie opinie</CardTitle>
                    <CardDescription>
                        Lista opinii pobranych ze sklepu oraz dodanych ręcznie.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Ładowanie opinii...</div>}>
                        <ReviewsTable reviews={reviews} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
