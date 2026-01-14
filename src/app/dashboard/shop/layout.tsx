import { ShopNav } from './_components/shop-nav';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            <ShopNav />
            <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                {children}
            </div>
        </div>
    );
}
