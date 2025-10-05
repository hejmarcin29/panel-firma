import { asc, inArray } from "drizzle-orm";

import { db } from "@db/index";
import { products, type ProductType } from "@db/schema";

export type ProductSelectItem = {
  id: string;
  label: string;
  type: ProductType;
};

export async function listProductsForSelect(options?: { types?: ProductType[] }): Promise<ProductSelectItem[]> {
  const baseQuery = db
    .select({
      id: products.id,
      name: products.name,
      type: products.type,
      sku: products.sku,
      style: products.style,
    })
    .from(products)
    .orderBy(asc(products.name));

  const rows = options?.types?.length
    ? await baseQuery.where(inArray(products.type, options.types))
    : await baseQuery;

  return rows.map((row) => {
    const prefix = row.type === "PANEL" ? "Panel" : row.type === "BASEBOARD" ? "Listwa" : "Akcesorium";
    const details = [row.sku, row.style].filter(Boolean).join(" · ");
    return {
      id: row.id,
      label: details ? `${prefix}: ${row.name} (${details})` : `${prefix}: ${row.name}`,
      type: row.type,
    };
  });
}
