import { HeroSection } from "../_components/hero-section";
import { FeaturesSection } from "../_components/features-section";
import { CategoryGrid } from "../_components/category-grid";
import { getStoreProducts } from "../sklep/actions";
import { getShopConfig } from "@/app/dashboard/settings/shop/actions";
import { ProductCard } from "../_components/product-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MotionContainer } from "@/components/motion-container";

export default async function StorefrontHomePage() {
  const [latestProducts, shopConfig] = await Promise.all([
    getStoreProducts(4),
    getShopConfig()
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      
      <MotionContainer className="py-16 container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-playfair text-3xl font-bold">Nowości w ofercie</h2>
          <Link href="/sklep">
            <Button variant="outline">Zobacz wszystkie</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              showGrossPrices={shopConfig.showGrossPrices}
              vatRate={shopConfig.vatRate}
            />
          ))}
        </div>
      </MotionContainer>

      <MotionContainer delay={0.2}>
        <FeaturesSection />
      </MotionContainer>
      <MotionContainer delay={0.3}>
        <CategoryGrid />
      </MotionContainer>
      
      {/* Newsletter / CTA Section placeholder */}
      <MotionContainer delay={0.4} className="py-24 bg-emerald-900 text-white text-center">
        <div className="container max-w-2xl space-y-6">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold">
            Nie masz pewności co wybrać?
          </h2>
          <p className="text-emerald-100 text-lg">
            Zamów darmowy wzornik lub skonsultuj się z naszym ekspertem.
          </p>
          <div className="pt-4">
             {/* Placeholder for Newsletter component */}
             <Button variant="secondary" size="lg" asChild>
                <Link href="/kontakt">Zamów próbki</Link>
             </Button>
          </div>
        </div>
      </MotionContainer>
    </div>
  );
}
