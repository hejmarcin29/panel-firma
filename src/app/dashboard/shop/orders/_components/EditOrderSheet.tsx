'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateOrderData } from '../actions';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pen, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddressData {
    name: string;
    street: string;
    postalCode: string;
    city: string;
    email: string;
    phone: string;
    taxId?: string;
}

interface EditOrderSheetProps {
    orderId: string;
    initialBilling: AddressData;
    initialShipping: AddressData;
}

export function EditOrderSheet({ orderId, initialBilling, initialShipping }: EditOrderSheetProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [billing, setBilling] = useState(initialBilling);
    const [shipping, setShipping] = useState(initialShipping);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateOrderData(orderId, {
                billing: {
                    ...billing,
                    taxId: billing.taxId || ''
                },
                shipping: shipping
            });
            toast.success('Dane zamówienia zostały zaktualizowane.');
            setOpen(false);
            router.refresh();
        } catch {
            toast.error('Wystąpił błąd podczas zapisywania danych.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Pen className="h-4 w-4" />
                <span className="sr-only">Edytuj</span>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Edycja Danych Zamówienia</SheetTitle>
                        <SheetDescription>
                            Zmień dane rozliczeniowe lub adres dostawy dla tego zamówienia.
                        </SheetDescription>
                    </SheetHeader>

                    <Tabs defaultValue="billing" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="billing">Dane Rozliczeniowe</TabsTrigger>
                            <TabsTrigger value="shipping">Adres Dostawy</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="billing" className="space-y-4">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Imię i Nazwisko / Nazwa Firmy</Label>
                                    <Input 
                                        value={billing.name} 
                                        onChange={(e) => setBilling({...billing, name: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>NIP (Opcjonalnie)</Label>
                                    <Input 
                                        value={billing.taxId || ''} 
                                        onChange={(e) => setBilling({...billing, taxId: e.target.value})} 
                                        placeholder="Tylko dla firm"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-2 col-span-2">
                                        <Label>Ulica i Numer</Label>
                                        <Input 
                                            value={billing.street} 
                                            onChange={(e) => setBilling({...billing, street: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kod Pocztowy</Label>
                                        <Input 
                                            value={billing.postalCode} 
                                            onChange={(e) => setBilling({...billing, postalCode: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Miejscowość</Label>
                                    <Input 
                                        value={billing.city} 
                                        onChange={(e) => setBilling({...billing, city: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input 
                                        value={billing.email} 
                                        onChange={(e) => setBilling({...billing, email: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefon</Label>
                                    <Input 
                                        value={billing.phone} 
                                        onChange={(e) => setBilling({...billing, phone: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="shipping" className="space-y-4">
                            <div className="p-3 bg-muted/30 rounded-md mb-4 text-sm text-muted-foreground">
                                Uwaga: Zmiana adresu dostawy tutaj nie zmienia etykiety, jeśli została już wygenerowana.
                            </div>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Odbiorca (Imię i Nazwisko)</Label>
                                    <Input 
                                        value={shipping.name} 
                                        onChange={(e) => setShipping({...shipping, name: e.target.value})} 
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-2 col-span-2">
                                        <Label>Ulica i Numer</Label>
                                        <Input 
                                            value={shipping.street} 
                                            onChange={(e) => setShipping({...shipping, street: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kod Pocztowy</Label>
                                        <Input 
                                            value={shipping.postalCode} 
                                            onChange={(e) => setShipping({...shipping, postalCode: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Miejscowość</Label>
                                    <Input 
                                        value={shipping.city} 
                                        onChange={(e) => setShipping({...shipping, city: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Odbiorcy</Label>
                                    <Input 
                                        value={shipping.email} 
                                        onChange={(e) => setShipping({...shipping, email: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefon Odbiorcy</Label>
                                    <Input 
                                        value={shipping.phone} 
                                        onChange={(e) => setShipping({...shipping, phone: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <SheetFooter className="mt-8">
                         <Button onClick={handleSave} disabled={isLoading} className="w-full">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Zapisywanie...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Zapisz Zmiany
                                </>
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
