'use server';

import { db } from '@/lib/db';
import { erpProducts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface ProductDetails {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    sku: string;
    price: string | null; // serialized decimal/text
    regularPrice: string | null;
    salePrice: string | null;
    unit: string | null;
    mountingMethod: string | null; // NEW
    floorPattern: string | null;   // NEW
    floorPatternSlug: string | null;   // NEW: for calculator waste settings
    wearClass: string | null;      // NEW
    wearLayerThickness: number | null; // NEW
    packageSizeM2: number | null;
    stockQuantity: number | null;
    isSampleAvailable: boolean | null;
    isPurchasable: boolean | null;
    imageUrl: string | null;
    brand: {
        name: string;
        imageUrl: string | null;
        slug: string | null;
    } | null;
    collection: {
        name: string;
        slug: string | null;
    } | null;
    category: {
        name: string;
        slug: string | null;
    } | null;
    attributes: {
        name: string;
        value: string;
    }[];
    images: {
        id: string;
        url: string;
        alt: string | null;
    }[];
}

export async function getProductBySlug(slug: string): Promise<ProductDetails | null> {
    const product = await db.query.erpProducts.findFirst({
        where: and(
            eq(erpProducts.slug, slug),
            // eq(erpProducts.isShopVisible, true) // Changed: Always fetch visible product (Catalog Mode)
        ),
        with: {
            brand: true,
            collection: true,
            category: true,
            mountingMethodDictionary: true,
            floorPatternDictionary: true,
            wearClassDictionary: true,
            attributes: {
                with: {
                    attribute: true,
                    option: true
                }
            },
            images: {
                orderBy: (images, { asc }) => [asc(images.order)]
            }
        }
    });

    if (!product) {
        return null;
    }

    // Process attributes to flatten the structure
    const transformedAttributes = product.attributes.map(pa => ({
        name: pa.attribute.name,
        value: pa.value || pa.option?.value || ''
    })).filter(a => a.value !== '');

    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        sku: product.sku,
        price: product.price,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        unit: product.unit,
        packageSizeM2: product.packageSizeM2,
        mountingMethod: product.mountingMethodDictionary?.name ?? product.mountingMethod,
        floorPattern: product.floorPatternDictionary?.name ?? product.floorPattern,
        floorPatternSlug: product.floorPatternDictionary?.slug ?? null,
        wearClass: product.wearClassDictionary?.name ?? product.wearClass,
        wearLayerThickness: product.wearLayerThickness,
        stockQuantity: product.stockQuantity,
        isSampleAvailable: product.isSampleAvailable,
        isPurchasable: product.isPurchasable,
        imageUrl: product.imageUrl,
        brand: product.brand,
        collection: product.collection,
        category: product.category,
        attributes: transformedAttributes,
        images: product.images
    };
}
