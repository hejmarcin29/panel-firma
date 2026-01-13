import { notFound } from 'next/navigation';
import { getProductBySlug } from './actions';
import { getShopConfig } from '@/app/dashboard/settings/shop/actions';
import { ProductGallery } from './_components/product-gallery';
import { FloorCalculator } from './_components/floor-calculator';

import { Check, Truck, ShieldCheck, HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PageProps {
    params: Promise<{
        slug: string;
    }>
}

export default async function ProductPage({ params }: PageProps) {
    const { slug } = await params;
    const [product, shopConfig] = await Promise.all([
        getProductBySlug(slug),
        getShopConfig()
    ]);

    if (!product) {
        notFound();
    }

    // Determine price display
    const price = product.salePrice ? parseFloat(product.salePrice) : (product.price ? parseFloat(product.price) : null);
    const regularPrice = product.regularPrice ? parseFloat(product.regularPrice) : null;
    const isOnSale = regularPrice && price && price < regularPrice;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container px-4 py-8 md:py-12">
                
                {/* Breadcrumbs Placeholder (Optional) */}
                <div className="mb-6 text-sm text-gray-500">
                    Sklep / Podłogi / {product.name}
                </div>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                    
                    {/* Left Column: Gallery */}
                    <div className="h-fit lg:sticky lg:top-24">
                        <ProductGallery 
                            mainImage={product.imageUrl}
                            galleryImages={product.images}
                            productName={product.name}
                        />
                    </div>

                    {/* Right Column: Details & Calculator */}
                    <div className="space-y-8">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                {product.stockQuantity && product.stockQuantity > 0 ? (
                                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                        Dostępny od ręki
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                        Na zamówienie
                                    </Badge>
                                )}
                                {product.unit && <Badge variant="secondary">{product.unit}</Badge>}
                            </div>

                            <h1 className="font-playfair text-3xl font-bold text-gray-900 md:text-4xl">
                                {product.name}
                            </h1>
                            <div className="mt-2 text-sm text-gray-500">SKU: {product.sku}</div>

                            <div className="mt-6 flex items-baseline gap-4">
                                <span className="text-4xl font-bold text-gray-900">
                                    {price ? formatCurrency(price) : 'Zapytaj o cenę'}
                                </span>
                                {isOnSale && regularPrice && (
                                    <span className="text-xl text-gray-400 line-through">
                                        {formatCurrency(regularPrice)}
                                    </span>
                                )}
                                {product.unit === 'm2' && <span className="text-lg text-gray-500">/ m²</span>}
                            </div>
                            
                            {/* Price disclaimer */}
                            {product.unit === 'm2' && (
                                <p className="mt-1 text-sm text-gray-500">
                                    Cena zawiera 23% VAT. Sprzedaż tylko na pełne opakowania.
                                </p>
                            )}
                        </div>

                        {/* Calculator Component */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <FloorCalculator 
                                product={{
                                    id: product.id,
                                    name: product.name,
                                    sku: product.sku,
                                    imageUrl: product.imageUrl
                                }}
                                pricePerM2={price || 50} 
                                packageSizeM2={product.packageSizeM2 || 2.2}
                                unit={product.unit || 'm2'}
                                isSampleAvailable={product.isSampleAvailable || false}
                                isPurchasable={product.isPurchasable || false}
                                samplePrice={shopConfig.samplePrice / 100}
                            />
                        </div>

                        {/* Value Props */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-emerald-600" />
                                <span>Szybka wysyłka (24h)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                <span>Gwarancja jakości</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-emerald-600" />
                                <span>30 dni na zwrot</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-emerald-600" />
                                <span>Pomoc w montażu</span>
                            </div>
                        </div>

                        {/* Description & Technical Data */}
                        <div className="pt-6">
                             <Accordion type="single" collapsible defaultValue="desc" className="w-full">
                                <AccordionItem value="desc">
                                    <AccordionTrigger>Opis Produktu</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="prose prose-sm text-gray-600 leading-relaxed max-w-none">
                                            {product.description || "Brak opisu."}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="specs">
                                    <AccordionTrigger>Dane Techniczne</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-4">
                                            {product.attributes.map((attr) => (
                                                <div key={attr.name} className="flex justify-between border-b border-gray-100 py-2 text-sm">
                                                    <span className="font-medium text-gray-700">{attr.name}</span>
                                                    <span className="text-gray-600">{attr.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="shipping">
                                    <AccordionTrigger>Dostawa i Płatność</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-sm text-gray-600">
                                            Oferujemy bezpieczną wysyłkę paletową ubezpieczoną na pełną wartość zamówienia.
                                            Koszt dostawy wyliczany jest w koszyku. Możliwy odbiór osobisty w naszym magazynie.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                             </Accordion>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
