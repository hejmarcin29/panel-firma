import { HeroSection } from "../_components/hero-section";
import { FeaturesSection } from "../_components/features-section";
import { CategoryGrid } from "../_components/category-grid";

export default function StorefrontHomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <CategoryGrid />
      
      {/* Newsletter / CTA Section placeholder */}
      <section className="py-24 bg-emerald-900 text-white text-center">
        <div className="container max-w-2xl space-y-6">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold">
            Nie masz pewności co wybrać?
          </h2>
          <p className="text-emerald-100 text-lg">
            Zamów darmowy wzornik lub skonsultuj się z naszym ekspertem.
          </p>
          <div className="pt-4">
             {/* Placeholder for Newsletter component */}
          </div>
        </div>
      </section>
    </div>
  );
}
