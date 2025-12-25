import { Metadata } from 'next';
import { HeroSection } from './_components/hero-section';
import { TechShowcase } from './_components/tech-showcase';
import { ProductGallery } from './_components/product-gallery';
import { Realizations } from './_components/realizations';
import { BenefitsGrid } from './_components/benefits-grid';
import { RegistrationForm } from './_components/registration-form';
import { ProcessSteps } from './_components/process-steps';
import { FAQ } from './_components/faq';
import { DesignerResources } from './_components/designer-resources';

export const metadata: Metadata = {
    title: 'Strefa Architekta | Współpraca B2B',
    description: 'Dołącz do programu partnerskiego dla architektów. Profesjonalny montaż, transparentne prowizje i dedykowany panel online.',
};

export default function WspolpracaPage() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <BenefitsGrid />
      <ProcessSteps />
      <TechShowcase />
      <ProductGallery />
      <Realizations />
      <DesignerResources />
      <FAQ />
      <RegistrationForm />
      
      {/* Simple Footer */}
      <footer className="bg-black text-white py-12 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
            <p className="text-gray-500">© 2025 Prime Podłoga. Wszystkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </main>
  );
}
