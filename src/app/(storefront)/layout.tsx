import { StoreHeader } from "./_components/store-header";
import { MobileNav } from "./_components/mobile-nav";
import { StoreFooter } from "./_components/store-footer";
import { CartSheet } from "./_components/cart-sheet";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
      <StoreHeader />
      <main className="flex-1">
        {children}
      </main>
      <StoreFooter />
      <MobileNav />
      <CartSheet />
    </div>
  );
}
