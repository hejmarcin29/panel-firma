import { notFound } from 'next/navigation';
import Image from 'next/image';
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
import { ProductViewTracker } from './_components/product-view-tracker'; // Added

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
    let price = product.salePrice ? parseFloat(product.salePrice) : (product.price ? parseFloat(product.price) : null);
    let regularPrice = product.regularPrice ? parseFloat(product.regularPrice) : null;

    // Apply VAT logic
    if (shopConfig.showGrossPrices) {
        const multiplier = 1 + ((shopConfig.vatRate || 23) / 100);
        if (price) price = price * multiplier;
        if (regularPrice) regularPrice = regularPrice * multiplier;
    }

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

    const trackerPrice = price || 0;
    const trackerImage = (Array.isArray(product.images) && product.images.length > 0) 
        ? (product.images[0] as string) 
        : (product.imageUrl as string || '');

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <ProductViewTracker product={{
                id: String(product.id),
                name: product.name,
                price: trackerPrice,
                slug: product.slug || '',
                imageUrl: trackerImage
            }} />
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
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className="text-xs text-muted-foreground">Producent</span>
                                        {product.brand.imageUrl ? (
                                            <div className="relative h-10 w-24" title={product.brand.name}>
                                                <Image 
                                                    src={product.brand.imageUrl} 
                                                    alt={product.brand.name} 
                                                    fill 
                                                    className="object-contain object-right"
                                                    sizes="96px"
                                                />
                                            </div>
                                        ) : (
                                            <span className="font-semibold text-gray-900">{product.brand.name}</span>
                                        )}
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
                                <div className="mt-1 space-y-1">
                                    <p className="text-sm text-gray-500">
                                        {shopConfig.showGrossPrices 
                                            ? `Cena zawiera ${shopConfig.vatRate}% VAT. Sprzedaż tylko na pełne opakowania.`
                                            : `Cena netto (+${shopConfig.vatRate}% VAT). Sprzedaż tylko na pełne opakowania.`
                                        }
                                    </p>
                                    {product.packageSizeM2 && product.packageSizeM2 > 0 && (
                                        <p className="text-sm text-gray-500 font-medium">
                                            (W opakowaniu: {product.packageSizeM2} m²)
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Calculator Component */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <FloorCalculator 
                                key={product.id}
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
                                mountingMethod={product.mountingMethod}
                                floorPattern={product.floorPattern}
                                floorPatternSlug={product.floorPatternSlug}
                                wasteRates={shopConfig.wasteRates}
                            />
                        </div>

                        {/* Value Props */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-emerald-600" />
                                <span>Bezpieczny transport</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                <span>Gwarancja jakości</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-emerald-600" />
                                <span>Dostawa na palecie</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-emerald-600" />
                                <span>Pomoc w montażu</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Description & Technical Data */}
                <div className="mt-16 pt-12 border-t border-gray-100">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                        
                        {/* LEFT COLUMN: Open Description (Storytelling) */}
                        <div className="lg:col-span-7 space-y-8">
                             <h2 className="text-3xl font-bold text-gray-900 font-playfair">Opis Produktu</h2>
                             <div className="prose prose-lg text-gray-600 leading-relaxed max-w-none">
                                {product.description ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                                ) : (
                                    <p className="italic text-gray-400">Ten produkt nie posiada jeszcze szczegółowego opisu.</p>
                                )}
                             </div>

                             {product.collection && (
                                <div className="mt-8 rounded-2xl bg-gray-50 p-8 border border-gray-100">
                                    <h4 className="font-semibold text-gray-900 mb-2 text-lg">O kolekcji {product.collection.name}</h4>
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        Ten produkt należy do kolekcji {product.collection.name} od producenta {product.brand?.name}. 
                                        Charakteryzuje się ona spójnym wzornictwem i dopasowaną kolorystyką, co pozwala na stworzenie harmonijnego wnętrza.
                                    </p>
                                    {product.collection.slug && (
                                        <a href={`/sklep?collections=${product.collection.slug}`} className="inline-flex items-center font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
                                            Zobacz pozostałe produkty z kolekcji <span className="ml-2">&rarr;</span>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* SPACER */}
                        <div className="hidden lg:block lg:col-span-1"></div>

                        {/* RIGHT COLUMN: Technical Specs (Sidebar) */}
                        <div className="lg:col-span-4 space-y-6">
                             <div className="sticky top-24 space-y-6">
                                <Accordion type="multiple" defaultValue={['specs', 'shipping']} className="w-full">
                                    <AccordionItem value="specs" className="border-b-0 mb-4 ">
                                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline transition-colors">
                                                <span className="text-lg font-semibold text-gray-900">Dane Techniczne</span>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-6 pb-6 pt-2">
                                                <div className="grid grid-cols-1 gap-y-3">
                                                    {product.brand && (
                                                        <div className="flex justify-between items-center py-2 text-sm border-b border-gray-50 last:border-0">
                                                            <span className="font-medium text-gray-500">Producent</span>
                                                            <span className="font-semibold text-gray-900">{product.brand.name}</span>
                                                        </div>
                                                    )}
                                                    {product.collection && (
                                                        <div className="flex justify-between items-center py-2 text-sm border-b border-gray-50 last:border-0">
                                                            <span className="font-medium text-gray-500">Kolekcja</span>
                                                            <span className="font-semibold text-gray-900">{product.collection.name}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center py-2 text-sm border-b border-gray-50 last:border-0">
                                                        <span className="font-medium text-gray-500">Typ</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {product.unit === 'm2' ? 'Podłoga / Wykończenie' : 'Akcesoria'}
                                                        </span>
                                                    </div>
                                                    
                                                    {product.attributes.map((attr) => (
                                                        <div key={attr.name} className="flex justify-between items-center py-2 text-sm border-b border-gray-50 last:border-0">
                                                            <span className="font-medium text-gray-500">{attr.name}</span>
                                                            <span className="font-semibold text-gray-900 text-right pl-4">{attr.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </div>
                                    </AccordionItem>

                                    <AccordionItem value="shipping" className="border-b-0">
                                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline transition-colors">
                                                <span className="text-lg font-semibold text-gray-900">Dostawa i Płatność</span>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-6 pb-6 pt-2">
                                                <div className="space-y-4 text-sm text-gray-600">
                                                    <div className="flex gap-4 items-start">
                                                        <div className="bg-emerald-50 p-2.5 rounded-lg shrink-0">
                                                            <Truck className="h-5 w-5 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 mb-0.5">Wysyłka Paletowa</p>
                                                            <p className="text-xs text-gray-500">Towar wysyłamy na solidnie zabezpieczonej palecie. Kurier posiada windę i wózek paletowy.</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4 items-start">
                                                        <div className="bg-emerald-50 p-2.5 rounded-lg shrink-0">
                                                            <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 mb-0.5">Ubezpieczenie 100%</p>
                                                            <p className="text-xs text-gray-500">Każda przesyłka jest ubezpieczona na pełną wartość zamówienia.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </div>
                                    </AccordionItem>
                                </Accordion>
                             </div>
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
