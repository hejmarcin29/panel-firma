import { notFound } from "next/navigation";
import { getSupplier, getSupplierProducts } from "../actions";
import { SupplierProductsTable, type Product } from "../_components/supplier-products-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Phone, Mail, Globe, MapPin, Building2 } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function SupplierDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const [supplier, products] = await Promise.all([
        getSupplier(id),
        getSupplierProducts(id)
    ]);

    if (!supplier) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/erp/suppliers">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
                        <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                            {supplier.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                        </Badge>
                    </div>
                    {supplier.shortName && (
                        <p className="text-muted-foreground">{supplier.shortName}</p>
                    )}
                </div>
            </div>

            <Tabs defaultValue="products" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="products">Cennik / Produkty</TabsTrigger>
                    <TabsTrigger value="details">Dane podstawowe</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Przypisane Produkty</CardTitle>
                            <CardDescription>
                                Zarządzaj cenami zakupu i kodami produktów u tego dostawcy.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SupplierProductsTable products={products as Product[]} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="details">
                     <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" /> Dane Firmowe
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-sm font-medium text-muted-foreground">NIP</div>
                                    <div className="col-span-2 text-sm">{supplier.nip || '-'}</div>

                                    <div className="text-sm font-medium text-muted-foreground">Konto Bankowe</div>
                                    <div className="col-span-2 text-sm font-mono">{supplier.bankAccount || '-'}</div>

                                    <div className="text-sm font-medium text-muted-foreground">Termin płatności</div>
                                    <div className="col-span-2 text-sm">{supplier.paymentTerms ? `${supplier.paymentTerms} dni` : '-'}</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" /> Kontakt
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {supplier.email ? <a href={`mailto:${supplier.email}`} className="hover:underline">{supplier.email}</a> : '-'}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {supplier.phone ? <a href={`tel:${supplier.phone}`} className="hover:underline">{supplier.phone}</a> : '-'}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    {supplier.website ? <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{supplier.website}</a> : '-'}
                                </div>
                                {(() => {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const address = supplier.address as any;
                                    if (!address) return null;

                                    return (
                                        <div className="pt-2 border-t mt-2">
                                            <div className="text-sm">
                                                {address.street}<br />
                                                {address.zip} {address.city}<br />
                                                {address.country}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                     </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
