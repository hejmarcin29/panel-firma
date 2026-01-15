import { StoreHeader } from "./_components/store-header";
import { MobileNav } from "./_components/mobile-nav";
import { StoreFooter } from "./_components/store-footer";
import { CartSheet } from "./_components/cart-sheet";
import { getShopConfig } from "../dashboard/settings/shop/actions";
import { AnnouncementBar } from "./_components/announcement-bar";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getShopConfig();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
      <style>{`
        :root {
          --primary: ${config.primaryColor || '#b02417'};
          --ring: ${config.primaryColor || '#b02417'};
        }
      `}</style>
      <AnnouncementBar />
      <StoreHeader />
      <main className="flex-1">
        {children}
      </main>
      <StoreFooter />
      <MobileNav />
      <CartSheet showGrossPrices={config.showGrossPrices} />
    </div>
  );
}
