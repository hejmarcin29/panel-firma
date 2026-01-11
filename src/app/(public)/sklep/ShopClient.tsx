'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { ShoppingCart, LayoutGrid, Package, Settings, Logs } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from 'next/image';
import { submitShopOrder } from './actions';
import { toast } from 'sonner';

type Product = {
    id: string;
    name: string;
    sku: string | null;
    isShopVisible: boolean | null;
    isSampleAvailable: boolean | null;
    packageSizeM2: number | null;
    imageUrl: string | null;
    price: string | null;
};

type ShopClientProps = {
    products: Product[];
    customerData?: any; // Prefilled data
    token?: string;
};

type CartItem = {
    productId: string;
    productName: string;
    type: 'sample' | 'product';
    quantity: number; // packages/pieces
    area?: number; // m2
};

export default function ShopClient({ products, customerData, token }: ShopClientProps) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Filter products
    const sampleProducts = products.filter(p => p.isSampleAvailable);
    const panelProducts = products.filter(p => p.isShopVisible);

    const addToCart = (product: Product, type: 'sample' | 'product', amount: number) => {
        setCart(prev => {
            const existing = prev.find(i => i.productId === product.id && i.type === type);
            if (existing) {
                // Determine new quantity
                // For simplified logic: overwrite or add.
                // For sample: usually just 1 per type, but let's allow add.
                // For panels: recalculate packages.
                return prev.map(i => i.productId === product.id && i.type === type 
                    ? { ...i, quantity: i.quantity + amount } // Logic needs refinement for m2
                    : i
                );
            }
            // New item
            // Logic for calculating packages if product
            let quantity = amount;
            let area = 0;
            if (type === 'product' && product.packageSizeM2) {
                // amount is m2 input by user
                const neededM2 = amount;
                const pkgSize = product.packageSizeM2;
                const packages = Math.ceil(neededM2 / pkgSize);
                quantity = packages;
                area = packages * pkgSize;
            }

            return [...prev, {
                productId: product.id,
                productName: product.name,
                type,
                quantity,
                area: type === 'product' ? area : undefined,
            }];
        });
        setIsCartOpen(true);
        toast.success(`Dodano do koszyka: ${product.name}`);
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const checkout = async (formData: FormData) => {
        // Collect form data
        const data = {
            customer: {
                email: formData.get('email') as string,
                name: formData.get('name') as string,
                street: formData.get('street') as string,
                city: formData.get('city') as string,
                postalCode: formData.get('postalCode') as string,
                nip: formData.get('nip') as string,
                phone: formData.get('phone') as string,
            },
            items: cart,
            paymentMethod: cart.some(i => i.type === 'product') ? 'proforma' : 'tpay',
            referralToken: token,
        };

        const result = await submitShopOrder(data as any);
        if (result.success) {
            window.location.href = result.redirectUrl || '/sklep/dziekujemy';
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 pb-20 md:pb-0">
             <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-4 shadow-sm md:px-6">
                <div className="flex w-full items-center justify-between">
                    <span className="text-lg font-bold">Sklep PrimePodłoga</span>
                    
                    {/* Cart Trigger */}
                    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="relative">
                                <ShoppingCart className="h-5 w-5" />
                                {cart.length > 0 && (
                                    <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center rounded-full p-0">
                                        {cart.length}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[90vh] sm:side-right sm:h-full">
                            <SheetHeader>
                                <SheetTitle>Twój Koszyk</SheetTitle>
                            </SheetHeader>
                            <ScrollArea className="h-[calc(100vh-200px)] py-4">
                                {cart.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-10">Koszyk jest pusty</p>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start border-b pb-4">
                                                <div>
                                                    <p className="font-medium">{item.productName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.type === 'sample' ? 'Próbka' : 'Podłoga'} • {item.quantity} {item.type === 'product' ? 'pacz.' : 'szt.'}
                                                        {item.area && ` (${item.area.toFixed(2)} m²)`}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeFromCart(idx)}>Usuń</Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                            {cart.length > 0 && (
                                <div className="mt-4 space-y-4">
                                    <form action={checkout} className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium">Dane do zamówienia</h4>
                                            <input name="email" placeholder="Email" required className="w-full border p-2 rounded" defaultValue={customerData?.email} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input name="name" placeholder="Imię i Nazwisko / Firma" required className="w-full border p-2 rounded" defaultValue={customerData?.name} />
                                                <input name="phone" placeholder="Telefon" required className="w-full border p-2 rounded" defaultValue={customerData?.phone} />
                                            </div>
                                            <input name="street" placeholder="Ulica i nr" required className="w-full border p-2 rounded" defaultValue={customerData?.billingStreet} />
                                            <div className="grid grid-cols-2 gap-2">
                                                 <input name="postalCode" placeholder="Kod poczt." required className="w-full border p-2 rounded" defaultValue={customerData?.billingPostalCode} />
                                                 <input name="city" placeholder="Miasto" required className="w-full border p-2 rounded" defaultValue={customerData?.billingCity} />
                                            </div>
                                            <input name="nip" placeholder="NIP (opcjonalnie)" className="w-full border p-2 rounded" defaultValue={customerData?.taxId} />
                                        </div>
                                        <Button type="submit" className="w-full">
                                            {cart.some(i => i.type === 'product') ? 'Zamawiam i proszę o proformę' : 'Zamawiam i płacę online'}
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6">
                <Tabs defaultValue="samples" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:w-[400px] mb-8">
                        <TabsTrigger value="samples">Próbki</TabsTrigger>
                        <TabsTrigger value="panels">Panele</TabsTrigger>
                        <TabsTrigger value="settings">Ustawienia</TabsTrigger>
                    </TabsList>

                    <TabsContent value="samples" className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {sampleProducts.map(product => (
                                <div key={product.id} className="group relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
                                    <div className="aspect-square bg-neutral-100 relative">
                                        {product.imageUrl ? (
                                             <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-neutral-300">Brak zdjęcia</div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col p-3">
                                        <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>
                                        <div className="mt-auto pt-3">
                                            <Button size="sm" className="w-full" onClick={() => addToCart(product, 'sample', 1)}>
                                                Zamów próbkę
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="panels">
                         <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {panelProducts.map(product => (
                                <div key={product.id} className="flex flex-col rounded-lg border bg-white shadow-sm">
                                    <div className="aspect-video bg-neutral-100 relative rounded-t-lg overflow-hidden">
                                        {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />}
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <h3 className="font-bold text-lg">{product.name}</h3>
                                        {/* Simple Calculator UI */}
                                        <div className="bg-neutral-50 p-3 rounded text-sm space-y-2">
                                            <p className="font-medium text-neutral-500">Kalkulator zapotrzebowania</p>
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                const val = parseFloat((e.currentTarget.elements.namedItem('m2') as HTMLInputElement).value);
                                                if(val > 0) addToCart(product, 'product', val);
                                            }} className="flex gap-2">
                                                <input type="number" name="m2" step="0.01" className="bg-white border p-2 rounded w-24" placeholder="m²" required />
                                                <Button type="submit" size="sm" variant="secondary">Dodaj</Button>
                                            </form>
                                            <p className="text-xs text-muted-foreground">
                                                Pakowane po {product.packageSizeM2 || '?'} m². System zaokrągli do pełnych paczek.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {panelProducts.length === 0 && (
                                <p>Brak produktów w ofercie.</p>
                            )}
                         </div>
                    </TabsContent>

                    <TabsContent value="settings">
                        <div className="max-w-md mx-auto">
                            <h3 className="text-xl font-bold mb-4">Moje Ustawienia</h3>
                            <p className="text-muted-foreground mb-6">Uzupełnij swoje dane, aby szybciej składać zamówienia.</p>
                            
                            {/* Reuse checkout form logic or separate update action */}
                            <form action={checkout} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email (Identyfikator)</label>
                                    <input name="email" required className="w-full border p-2 rounded bg-neutral-100" defaultValue={customerData?.email} readOnly={!!customerData?.email} />
                                </div>
                                {/* Full form fields again... simplify for MVP */}
                                <Button type="submit" variant="outline" className="w-full" disabled>Aktualizacja danych (Wkrótce)</Button>
                            </form>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
