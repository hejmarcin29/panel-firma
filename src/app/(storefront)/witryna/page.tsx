import { HeroSection } from "../_components/hero-section";
import { FeaturesSection } from "../_components/features-section";
import { CategoryGrid } from "../_components/category-grid";
import { getExplorerProducts } from "../sklep/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MotionContainer } from "@/components/motion-container";
import { HeroProductExplorer } from "../_components/hero-product-explorer";
import { TrustBar } from "../_components/trust-bar";

export default async function StorefrontHomePage() {
  const explorerProducts = await getExplorerProducts();

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <TrustBar />
      
      {/* Hero Explorer - "Interactive Discovery" */}
      <HeroProductExplorer products={explorerProducts} />

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
