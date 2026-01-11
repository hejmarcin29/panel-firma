import { db } from "@/lib/db";
import { erpProducts } from "@/lib/db/schema";
import { like } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function DebugShopPage() {
  const productName = "Jagerndorf"; // Szukamy tego konkretnego
  
  const product = await db.query.erpProducts.findFirst({
    where: (products, { ilike }) => ilike(products.name, `%${productName}%`),
    with: {
      attributes: {
        with: {
          attribute: true, // Zobaczymy nazwę atrybutu (np. "Ilość w opakowaniu")
          option: true,    // Zobaczymy wartość ze słownika
        }
      },
      purchasePrices: true, // Zobaczymy ceny zakupu
      supplier: true,       // Zobaczymy dostawcę
    }
  });

  if (!product) {
    return (
      <div className="p-10 font-mono text-red-500">
        Nie znaleziono produktu o nazwie zawierającej "{productName}"
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Debug Produktu: {product.name}</h1>
      <pre className="bg-black text-green-400 p-4 rounded-lg overflow-auto text-xs font-mono max-w-[90vw]">
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  );
}
