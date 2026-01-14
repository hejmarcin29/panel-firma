import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-6">
            <div className="border-b">
                <nav className="flex gap-4 px-4 pb-2">
                    <Link href="/dashboard/shop">
                        <Button variant="ghost">📊 Przegląd</Button>
                    </Link>
                    <Link href="/dashboard/shop/orders">
                        <Button variant="ghost">📋 Zamówienia</Button>
                    </Link>
                    <Link href="/dashboard/shop/offer">
                        <Button variant="ghost">🎛️ Oferta</Button>
                    </Link>
                    <Link href="/dashboard/shop/reviews">
                        <Button variant="ghost">⭐ Opinie</Button>
                    </Link>
                    <Link href="/dashboard/settings/shop">
                        <Button variant="ghost">⚙️ Konfiguracja</Button>
                    </Link>
                </nav>
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}
