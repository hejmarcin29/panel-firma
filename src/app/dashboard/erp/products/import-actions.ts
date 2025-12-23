'use server';

import { db } from "@/lib/db";
import { erpProducts, erpAttributes, erpAttributeOptions, erpProductAttributes } from "@/lib/db/schema";
import { getAppSettings, appSettingKeys } from "@/lib/settings";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface WooCommerceProduct {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: string;
    regular_price: string;
    sale_price: string;
    status: string;
    stock_status: string;
    stock_quantity: number | null;
    images: { src: string }[];
    categories: { id: number; name: string }[];
    attributes: { id: number; name: string; options: string[] }[];
    dimensions: { length: string; width: string; height: string };
    weight: string;
    description: string;
}

async function getWooCredentials() {
    const settings = await getAppSettings([
        appSettingKeys.wooUrl,
        appSettingKeys.wooConsumerKey,
        appSettingKeys.wooConsumerSecret
    ]);

    const url = settings[appSettingKeys.wooUrl];
    const consumerKey = settings[appSettingKeys.wooConsumerKey];
    const consumerSecret = settings[appSettingKeys.wooConsumerSecret];

    if (!url || !consumerKey || !consumerSecret) {
        return null;
    }

    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    return { baseUrl, authHeader };
}

export interface WooAttribute {
    id: number;
    name: string;
    slug: string;
    type: string;
    order_by: string;
    has_archives: boolean;
}

export async function getWooAttributes() {
    const creds = await getWooCredentials();
    if (!creds) return { success: false, error: "Brak konfiguracji WooCommerce" };

    try {
        const response = await fetch(`${creds.baseUrl}/wp-json/wc/v3/products/attributes`, {
            headers: { 'Authorization': creds.authHeader },
            cache: 'no-store'
        });

        if (!response.ok) throw new Error(`Błąd API: ${response.statusText}`);
        
        const attributes = await response.json() as WooAttribute[];
        return { success: true, data: attributes };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Błąd pobierania atrybutów" };
    }
}

export type AttributeMapping = Record<string, { action: 'create' | 'map' | 'ignore', targetId?: string }>;

export async function importProductsFromWoo(mapping: AttributeMapping = {}) {
    const creds = await getWooCredentials();
    if (!creds) {
        return { success: false, error: "Brak konfiguracji WooCommerce w ustawieniach." };
    }

    let page = 1;
    const perPage = 50; // Fetch in chunks
    let importedCount = 0;

    try {
        while (true) {
            const response = await fetch(`${creds.baseUrl}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`, {
                headers: {
                    'Authorization': creds.authHeader
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Błąd pobierania produktów: ${response.statusText}`);
            }

            const productsData = await response.json() as WooCommerceProduct[];
            if (productsData.length === 0) {
                break;
            }

            for (const wooProduct of productsData) {
                // 1. Create/Update Product
                const [product] = await db.insert(erpProducts).values({
                    name: wooProduct.name,
                    sku: wooProduct.sku || `WOO-${wooProduct.id}`,
                    unit: 'szt', // Default
                    type: 'product',
                    description: wooProduct.description.replace(/<[^>]*>?/gm, ''), // Strip HTML
                    width: wooProduct.dimensions.width ? parseFloat(wooProduct.dimensions.width) : null,
                    height: wooProduct.dimensions.height ? parseFloat(wooProduct.dimensions.height) : null,
                    length: wooProduct.dimensions.length ? parseFloat(wooProduct.dimensions.length) : null,
                    weight: wooProduct.weight ? parseFloat(wooProduct.weight) : null,
                    status: wooProduct.status === 'publish' ? 'active' : 'archived',
                }).onConflictDoUpdate({
                    target: erpProducts.sku, // Assuming SKU is unique and we want to update by SKU
                    set: {
                        name: wooProduct.name,
                        description: wooProduct.description.replace(/<[^>]*>?/gm, ''),
                        status: wooProduct.status === 'publish' ? 'active' : 'archived',
                        updatedAt: new Date(),
                    }
                }).returning({ id: erpProducts.id });

                // 2. Handle Attributes
                for (const wooAttr of wooProduct.attributes) {
                    const mapRule = mapping[wooAttr.name] || { action: 'create' }; // Default to create if not mapped
                    
                    if (mapRule.action === 'ignore') continue;

                    let attributeId: string | undefined;

                    if (mapRule.action === 'map' && mapRule.targetId) {
                        attributeId = mapRule.targetId;
                    } else {
                        // 'create' or fallback
                        const existingAttr = await db.query.erpAttributes.findFirst({
                            where: eq(erpAttributes.name, wooAttr.name)
                        });

                        if (existingAttr) {
                            attributeId = existingAttr.id;
                        } else {
                            const [newAttr] = await db.insert(erpAttributes).values({
                                name: wooAttr.name,
                                type: 'select',
                            }).returning({ id: erpAttributes.id });
                            attributeId = newAttr.id;
                        }
                    }

                    if (!attributeId) continue;

                    // Handle Options and Assign to Product
                    for (const optionValue of wooAttr.options) {
                        // Find or create Option
                        let optionId: string;
                        const existingOption = await db.query.erpAttributeOptions.findFirst({
                            where: and(
                                eq(erpAttributeOptions.attributeId, attributeId),
                                eq(erpAttributeOptions.value, optionValue)
                            )
                        });

                        if (existingOption) {
                            optionId = existingOption.id;
                        } else {
                            const [newOption] = await db.insert(erpAttributeOptions).values({
                                attributeId: attributeId,
                                value: optionValue,
                            }).returning({ id: erpAttributeOptions.id });
                            optionId = newOption.id;
                        }

                        // Link Product to Attribute Option
                        // Check if already linked
                        const existingLink = await db.query.erpProductAttributes.findFirst({
                            where: and(
                                eq(erpProductAttributes.productId, product.id),
                                eq(erpProductAttributes.attributeId, attributeId),
                                eq(erpProductAttributes.optionId, optionId)
                            )
                        });

                        if (!existingLink) {
                            await db.insert(erpProductAttributes).values({
                                productId: product.id,
                                attributeId: attributeId,
                                optionId: optionId,
                            });
                        }
                    }
                }
                importedCount++;
            }
            page++;
        }

        revalidatePath("/dashboard/erp/products");
        revalidatePath("/dashboard/erp/attributes");
        return { success: true, count: importedCount };

    } catch (error) {
        console.error("Import failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Nieznany błąd importu" };
    }
}
