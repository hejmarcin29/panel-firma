import { Metadata } from 'next';
import { HeroSection } from './_components/hero-section';
import { TechShowcase } from './_components/tech-showcase';
import { ProductGallery } from './_components/product-gallery';
import { BenefitsGrid } from './_components/benefits-grid';
import { RegistrationForm } from './_components/registration-form';

export const metadata: Metadata = {
    title: 'Strefa Architekta | Współpraca B2B',
    description: 'Dołącz do programu partnerskiego dla architektów. Profesjonalny montaż, transparentne prowizje i dedykowany panel online.',
};

export default function WspolpracaPage() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <TechShowcase />
      <ProductGallery />
      <BenefitsGrid />
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
