'use server';

import { db } from "@/lib/db";
import { erpProducts, erpSuppliers } from "@/lib/db/schema";
import { count, desc, eq, isNull } from "drizzle-orm";

export async function getDashboardStats() {
    // 1. Total Products
    const [productsCount] = await db.select({ count: count() }).from(erpProducts);
    
    // 2. Total Suppliers
    const [suppliersCount] = await db.select({ count: count() }).from(erpSuppliers);

    // 3. Products without Purchase Prices (Approximation: Products not in purchase_prices table)
    // This is a bit complex in SQL without a LEFT JOIN and checking for NULL.
    // For now, let's fetch all products and check relations, or use a raw query.
    // A simpler KPI might be "Active Products" or "Services".
    
    // Let's try to get products that have NO purchase prices.
    // We can do this by counting products where id NOT IN (select productId from erpPurchasePrices)
    // But Drizzle `notInArray` needs an array.
    
    // Alternative: Count of products with type 'service' vs 'goods'
    const [servicesCount] = await db.select({ count: count() })
        .from(erpProducts)
        .where(eq(erpProducts.type, 'service'));

    // 4. Recent Activity (Last 5 products)
    const recentProducts = await db.query.erpProducts.findMany({
        orderBy: [desc(erpProducts.createdAt)],
        limit: 5,
        with: {
            category: true
        }
    });

    // 5. Missing Data (Hygiene)
    // Products without category
    const [productsWithoutCategory] = await db.select({ count: count() })
        .from(erpProducts)
        .where(isNull(erpProducts.categoryId));

    return {
        productsCount: productsCount.count,
        suppliersCount: suppliersCount.count,
        servicesCount: servicesCount.count,
        productsWithoutCategory: productsWithoutCategory.count,
        recentProducts
    };
}
