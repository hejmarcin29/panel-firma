import { Suspense } from 'react';
import { getProducts } from './actions';
import { DataTable } from './_components/data-table';
import { columns } from './_components/columns';
import { ProductForm } from './_components/product-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function KartotekiPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
    const search = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;
    const perPage = 20;

    const { data, total, totalPages } = await getProducts(page, perPage, search);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kartoteki</h1>
                    <p className="text-muted-foreground">
                        Zarządzanie bazą towarową i usługową (niezależnie od sklepu).
                    </p>
                </div>
                <ProductForm />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista Indeksów</CardTitle>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Ładowanie...</div>}>
                        <DataTable 
                            columns={columns} 
                            data={data} 
                            pageCount={totalPages}
                            currentPage={page}
                        />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
