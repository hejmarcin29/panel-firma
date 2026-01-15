"use client";

import { useCartStore } from "@/lib/store/cart-store";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
import { MotionContainer, MotionItem } from "@/components/motion-container";

export default function CartPage() {
    const { items, updateQuantity, getTotalPrice } = useCartStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    if (items.length === 0) {
        return (
            <div className="container py-24 flex flex-col items-center justify-center space-y-6 text-center">
                <MotionContainer>
                    <div className="relative h-40 w-40 opacity-20 mx-auto">
                        <ShoppingBag className="h-full w-full" />
                    </div>
                </MotionContainer>
                <MotionContainer delay={0.1}>
                    <h1 className="text-3xl font-bold font-playfair">Twój koszyk jest pusty</h1>
                    <p className="text-muted-foreground text-lg">
                        Wygląda na to, że nie dodałeś jeszcze żadnych produktów do koszyka.
                    </p>
                    <div className="pt-6">
                        <Button size="lg" asChild>
                            <Link href="/sklep">Wróć do sklepu</Link>
                        </Button>
                    </div>
                </MotionContainer>
            </div>
        );
    }

    return (
        <div className="container py-16 space-y-12">
            <MotionContainer>
                <h1 className="text-3xl md:text-4xl font-bold font-playfair mb-8">Twój Koszyk</h1>
            </MotionContainer>

            <div className="grid lg:grid-cols-3 gap-12">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-6">
                    {items.map((item, index) => (
                        <MotionItem key={item.productId} delay={index * 0.1} className="flex flex-col sm:flex-row gap-6 p-6 bg-white border rounded-xl shadow-sm">
                            {/* Image */}
                            <div className="relative aspect-square h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-50 border">
                                {item.image ? (
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                        Brak zdjęcia
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">SKU: {item.sku}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-red-600"
                                        onClick={() => updateQuantity(item.productId, 0)}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg border">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-12 text-center font-medium">
                                            {item.quantity}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xl font-bold text-emerald-700">
                                            {formatCurrency(item.pricePerUnit * item.quantity)}
                                        </div>
                                        {item.quantity > 1 && (
                                            <div className="text-sm text-muted-foreground">
                                                {formatCurrency(item.pricePerUnit)} / szt.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {item.unit === 'm2' && item.packageSize && (
                                    <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md inline-block">
                                        Opakowanie: {item.packageSize} m² &bull; Razem: {(item.quantity * item.packageSize).toFixed(3)} m²
                                    </div>
                                )}
                            </div>
                        </MotionItem>
                    ))}
                </div>

                {/* Summary Sidebar */}
                <MotionContainer delay={0.3} className="h-fit space-y-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border space-y-6">
                        <h3 className="text-xl font-bold font-playfair">Podsumowanie</h3>
                        
                        <div className="space-y-3 pb-6 border-b border-gray-200">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Wartość produktów</span>
                                <span>{formatCurrency(getTotalPrice())}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Dostawa</span>
                                <span className="text-xs text-gray-500">(Obliczane w kolejnym kroku)</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <span className="text-lg font-bold text-gray-900">Do zapłaty</span>
                            <span className="text-2xl font-bold text-emerald-700">{formatCurrency(getTotalPrice())}</span>
                        </div>

                        <Button size="lg" className="w-full text-lg h-12" asChild>
                            <Link href="/checkout">Przejdź do kasy</Link>
                        </Button>
                        
                        <div className="text-center">
                            <Link href="/sklep" className="text-sm text-muted-foreground hover:text-black hover:underline">
                                Kontynuuj zakupy
                            </Link>
                        </div>
                    </div>

                    {/* Trust Signals Mini */}
                    <div className="bg-white p-6 rounded-2xl border flex flex-col gap-4 text-sm text-gray-600">
                        <div className="flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <span className="text-emerald-700 font-bold">1</span>
                            </div>
                            <span>Bezpieczne płatności SSL</span>
                        </div>
                         <div className="flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <span className="text-emerald-700 font-bold">2</span>
                            </div>
                            <span>Gwarancja dostawy na czas</span>
                        </div>
                    </div>
                </MotionContainer>
            </div>
        </div>
    );
}
