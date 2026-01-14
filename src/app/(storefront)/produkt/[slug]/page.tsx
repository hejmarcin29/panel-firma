import { notFound } from 'next/navigation';
import { getProductBySlug } from './actions';
import { getShopConfig } from '@/app/dashboard/settings/shop/actions';
import { ProductGallery } from './_components/product-gallery';
import { FloorCalculator } from './_components/floor-calculator';

import { Check, Truck, ShieldCheck, HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { getProductReviews } from './_components/reviews-actions';
import { ProductReviews } from './_components/product-reviews';
import { StarRating } from './_components/star-rating';

interface PageProps {
    params: Promise<{
        slug: string;
    }>
}

export default async function ProductPage({ params }: PageProps) {
    const { slug } = await params;
    
    // Fetch product first to get ID
    const product = await getProductBySlug(slug);

    if (!product) {
        notFound();
    }

    // Parallel fetch config and reviews using Product ID
    const [shopConfig, reviewsData] = await Promise.all([
        getShopConfig(),
        getProductReviews(product.id)
    ]);

    const reviews = reviewsData.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString()
    }));

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews 
        : 0;


    // Determine price display
    const price = product.salePrice ? parseFloat(product.salePrice) : (product.price ? parseFloat(product.price) : null);
    const regularPrice = product.regularPrice ? parseFloat(product.regularPrice) : null;
    const isOnSale = regularPrice && price && price < regularPrice;

    // JSON-LD Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.name,
        'image': product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []),
        'description': product.description?.replace(/<[^>]*>/g, '').slice(0, 300) || product.name,
        'sku': product.sku,
        'brand': {
            '@type': 'Brand',
            'name': product.brand?.name || 'PrimePodloga'
        },
        'offers': {
            '@type': 'Offer',
            'url': `https://primepodloga.pl/produkt/${product.slug}`,
            'priceCurrency': 'PLN',
            'price': price,
            'priceValidUntil': new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            'availability': (product.stockQuantity && product.stockQuantity > 0) ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
            'itemCondition': 'https://schema.org/NewCondition'
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="container px-4 py-8 md:py-12">
                
                {/* Breadcrumbs */}
                <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <a href="/sklep" className="hover:text-gray-900">Sklep</a>
                    <span>/</span>
                    {product.category ? (
                        <>
                            <a href={`/sklep?category=${product.category.slug}`} className="hover:text-gray-900">
                                {product.category.name}
                            </a>
                            <span>/</span>
                        </>
                    ) : (
                        <>
                            <span>Podłogi</span>
                            <span>/</span>
                        </>
                    )}
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
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
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {product.stockQuantity && product.stockQuantity > 0 ? (
                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                            Dostępny od ręki
                                        </Badge>
                                    ) : product.isPurchasable ? (
                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                            Wysyłka 3-7 dni
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-500">
                                            Na zamówienie
                                        </Badge>
                                    )}
                                    {product.collection && (
                                        <Badge variant="secondary" className="font-normal">
                                            Kolekcja: {product.collection.name}
                                        </Badge>
                                    )}
                                </div>
                                {product.brand && (
                                    <div className="text-right">
                                        <span className="text-xs text-muted-foreground block">Producent</span>
                                        <span className="font-semibold text-gray-900">{product.brand.name}</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="font-playfair text-3xl font-bold text-gray-900 md:text-4xl leading-tight">
                                {product.name}
                            </h1>
                            
                            <div className="mt-3 flex items-center gap-4">
                                <div className="text-sm text-gray-500 font-medium">SKU: {product.sku}</div>
                                {totalReviews > 0 && (
                                    <a href="#opinie" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                                        <div className="flex -space-x-1">
                                            <StarRating rating={averageRating} size="sm" showCount={false} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 underline decoration-gray-300 underline-offset-4 group-hover:text-gray-900 group-hover:decoration-gray-900 transition-all">
                                            Zobacz {totalReviews} opinii
                                        </span>
                                    </a>
                                )}
                            </div>

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
                                        <div className="prose prose-sm text-gray-600 leading-relaxed max-w-none space-y-4">
                                            {product.description ? (
                                                <div>{product.description}</div>
                                            ) : (
                                                <p className="italic">Brak szczegółowego opisu produktu.</p>
                                            )}
                                            
                                            {/* Auto-generated collection info */}
                                            {product.collection && (
                                                <div className="mt-6 rounded-lg bg-gray-50 p-4 border border-gray-100">
                                                    <h4 className="font-semibold text-gray-900 mb-2">O kolekcji {product.collection.name}</h4>
                                                    <p className="text-sm">
                                                        Ten produkt należy do kolekcji {product.collection.name} od producenta {product.brand?.name}. 
                                                        Charakteryzuje się ona spójnym wzornictwem i dopasowaną kolorystyką.
                                                        {product.collection.slug && (
                                                            <a href={`/sklep?collections=${product.collection.slug}`} className="block mt-2 font-medium text-emerald-600 hover:text-emerald-700">
                                                                Zobacz całą kolekcję &rarr;
                                                            </a>
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="specs">
                                    <AccordionTrigger>Dane Techniczne</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-4">
                                            {product.brand && (
                                                <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                                                    <span className="font-medium text-gray-700">Producent</span>
                                                    <span className="text-gray-600">{product.brand.name}</span>
                                                </div>
                                            )}
                                            {product.collection && (
                                                <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                                                    <span className="font-medium text-gray-700">Kolekcja</span>
                                                    <span className="text-gray-600">{product.collection.name}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                                                <span className="font-medium text-gray-700">Typ</span>
                                                <span className="text-gray-600">
                                                    {product.unit === 'm2' ? 'Podłoga / Wykończenie' : 'Akcesoria'}
                                                </span>
                                            </div>
                                            
                                            {/* Dynamic attributes */}
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

                {/* Reviews Section */}
                <div className="mt-16 md:mt-24 pt-16 border-t border-gray-200">
                    <ProductReviews 
                        productId={product.id} 
                        productName={product.name}
                        reviews={reviews}
                    />
                </div>
            </div>
        </div>
    );
}
