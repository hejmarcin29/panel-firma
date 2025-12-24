import { HeroSection } from './_components/hero-section';
import { TechShowcase } from './_components/tech-showcase';
import { BenefitsGrid } from './_components/benefits-grid';
import { RegistrationForm } from './_components/registration-form';
import { ProductGallery } from '../wspolpraca/_components/product-gallery';

export default function PartnerPage() {
  return (
    <main className="min-h-screen bg-white selection:bg-emerald-100 selection:text-emerald-900">
      <HeroSection />
      <BenefitsGrid />
      <TechShowcase />
      <ProductGallery />
      <RegistrationForm />
    </main>
  );
}
