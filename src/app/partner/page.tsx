import { HeroSection } from './_components/hero-section';
import { TechShowcase } from './_components/tech-showcase';
import { BenefitsGrid } from './_components/benefits-grid';
import { RegistrationForm } from './_components/registration-form';
import { ProductGallery } from '../wspolpraca/_components/product-gallery';
import { Realizations } from '../wspolpraca/_components/realizations';
import { ProcessSteps } from '../wspolpraca/_components/process-steps';
import { FAQ } from '../wspolpraca/_components/faq';
import { DesignerResources } from '../wspolpraca/_components/designer-resources';

export default function PartnerPage() {
  return (
    <main className="min-h-screen bg-white selection:bg-emerald-100 selection:text-emerald-900">
      <HeroSection />
      <BenefitsGrid />
      <ProcessSteps />
      <TechShowcase />
      <ProductGallery />
      <Realizations />
      <DesignerResources />
      <FAQ />
      <RegistrationForm />
    </main>
  );
}
