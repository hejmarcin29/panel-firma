'use client';

import { Drawer } from 'vaul';
import { Menu, Search, History, Sparkles, ChevronRight, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useInteractionStore } from '@/store/interaction-store';
import { resendOrderLink } from './actions';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';

interface VisualCommandCenterProps {
    turnstileSiteKey?: string;
    bestsellers: {
        id: string;
        name: string;
        slug: string;
        imageUrl?: string | null;
        price?: number; // Optional if we want to show price
    }[];
}

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        turnstile: any;
        turnstileLoaded: () => void;
    }
}

export function VisualCommandCenter({ bestsellers, turnstileSiteKey }: VisualCommandCenterProps) {
    const [open, setOpen] = useState(false);
    const { visitedProducts } = useInteractionStore();
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusEmail, setStatusEmail] = useState('');
    const [isSendingLink, setIsSendingLink] = useState(false);
    
    // Cloudflare Turnstile State
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load Turnstile Script if key present
    useEffect(() => {
        if (!turnstileSiteKey || !open) return;

        const scriptId = 'cf-turnstile-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }

        const renderWidget = () => {
             if (window.turnstile && !turnstileWidgetId) {
                try {
                    const id = window.turnstile.render('#turnstile-container', {
                        sitekey: turnstileSiteKey,
                        theme: 'light',
                        callback: (token: string) => setTurnstileToken(token),
                        'expired-callback': () => setTurnstileToken(null),
                    });
                    setTurnstileWidgetId(id);
                } catch {
                    // Container might not be ready yet
                }
             }
        };

        // If script already loaded
        if (window.turnstile) {
            // Give a small delay for Drawer animation to finish rendering the container
            setTimeout(renderWidget, 500); 
        } else {
             // Poll for script load
             const interval = setInterval(() => {
                if (window.turnstile) {
                    clearInterval(interval);
                    renderWidget();
                }
             }, 100);
             return () => clearInterval(interval);
        }

        // Cleanup: remove widget or reset? 
        // Turnstile doesn't have a clean unmount for React without libs, 
        // but since we are in a Drawer, it might be fine.
    }, [turnstileSiteKey, open, turnstileWidgetId]);


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setOpen(false);
            router.push(`/sklep?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    const handleStatusCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusEmail.includes('@')) {
            toast.error("Wpisz poprawny adres e-mail");
            return;
        }

        if (turnstileSiteKey && !turnstileToken) {
            toast.error("Weryfikacja anty-spam nie powiodła się. Spróbuj odświeżyć.");
            return;
        }
        
        setIsSendingLink(true);
        try {
            const result = await resendOrderLink(statusEmail, turnstileToken || undefined);
            if (result.success) {
                toast.success(result.message || "Sprawdź swoją skrzynkę mailową");
                setStatusEmail('');
                // Reset turnstile if needed
                if (window.turnstile && turnstileWidgetId) {
                    window.turnstile.reset(turnstileWidgetId);
                    setTurnstileToken(null);
                }
            } else {
                toast.error(result.message || "Błąd wysyłania.");
            }
        } catch {
            toast.error("Wystąpił błąd. Spróbuj ponownie.");
        } finally {
            setIsSendingLink(false);
        }
    };


    // Helpler to parse image
    // Removed getImageUrl as we use imageUrl directly now


    return (
        <Drawer.Root open={open} onOpenChange={setOpen}>
            <Drawer.Trigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Menu</span>
                </Button>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[92vh] flex-col rounded-t-[10px] bg-background outline-none">
                    <div className="flex-1 rounded-t-[10px] bg-background p-4">
                        <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                        
                        {/* Search Section */}
                        <div className="mb-6">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Czego szukasz?"
                                    className="w-full rounded-xl border-0 bg-muted/50 py-3 pl-10 pr-4 text-base font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </form>
                        </div>

                        <ScrollArea className="h-[calc(100vh-220px)] pr-4">
                            <div className="space-y-8">
                                
                                {/* Quick Navigation */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Link 
                                        href="/sklep" 
                                        onClick={() => setOpen(false)}
                                        className="flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center transition-colors hover:bg-accent"
                                    >
                                        <span className="mb-1 text-2xl">🛍️</span>
                                        <span className="font-medium">Wszystkie produkty</span>
                                    </Link>
                                    <Link 
                                        href="/kolekcje" 
                                        onClick={() => setOpen(false)}
                                        className="flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center transition-colors hover:bg-accent"
                                    >
                                        <span className="mb-1 text-2xl">✨</span>
                                        <span className="font-medium">Kolekcje</span>
                                    </Link>
                                </div>

                                {/* Bestsellers */}
                                {bestsellers.length > 0 && (
                                    <section>
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 font-semibold text-foreground">
                                                <Sparkles className="h-4 w-4 text-amber-500" />
                                                Polecane
                                            </h3>
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {bestsellers.map((product) => (
                                                <Link 
                                                    key={product.id} 
                                                    href={`/produkt/${product.slug}`}
                                                    onClick={() => setOpen(false)}
                                                    className="relative flex min-w-[140px] snap-start flex-col gap-2 rounded-lg border bg-card p-2"
                                                >
                                                    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                                                        <Image
                                                            src={product.imageUrl || '/placeholder.png'}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover transition-transform hover:scale-105"
                                                            sizes="140px"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="line-clamp-2 text-xs font-medium">{product.name}</h4>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* History */}
                                {mounted && visitedProducts.length > 0 && (
                                    <section>
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 font-semibold text-foreground">
                                                <History className="h-4 w-4 text-blue-500" />
                                                Ostatnio oglądane
                                            </h3>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-auto px-2 py-0 text-xs text-muted-foreground"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    useInteractionStore.getState().clearHistory();
                                                }}
                                            >
                                                Wyczyść
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {visitedProducts.slice(0, 5).map((product) => (
                                                <Link 
                                                    key={product.id}
                                                    href={`/produkt/${product.slug}`}
                                                    onClick={() => setOpen(false)}
                                                    className="flex gap-3 rounded-lg border bg-card p-2 transition-colors hover:bg-accent"
                                                >
                                                    <div className="relative aspect-square w-12 overflow-hidden rounded-md bg-muted">
                                                        <Image
                                                            src={product.imageUrl || '/placeholder.png'}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="48px"
                                                        />
                                                    </div>
                                                    <div className="flex flex-1 flex-col justify-center">
                                                        <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground">Zobacz ponownie</p>
                                                    </div>
                                                    <ChevronRight className="my-auto h-4 w-4 text-muted-foreground/50" />
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Menu Links */}
                                <div className="space-y-1 pt-4">
                                     {/* Order Status Section */}
                                     <div className="mb-6 rounded-xl border bg-slate-50 p-4">
                                        <div className="mb-2 flex items-center gap-2 font-medium text-slate-800">
                                            <PackageSearch className="h-4 w-4" />
                                            Status zamówienia
                                        </div>
                                        <p className="mb-3 text-xs text-muted-foreground">
                                            Link do statusu masz w mailu. Zgubiłeś go? Podaj adres, wyślemy nowy.
                                        </p>
                                        <form onSubmit={handleStatusCheck} className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <Input 
                                                    type="email" 
                                                    placeholder="Twój e-mail" 
                                                    className="h-9 bg-white text-sm"
                                                    value={statusEmail}
                                                    onChange={(e) => setStatusEmail(e.target.value)}
                                                    required
                                                />
                                                <Button size="sm" type="submit" disabled={isSendingLink || (!!turnstileSiteKey && !turnstileToken)}>
                                                    {isSendingLink ? '...' : 'Wyślij'}
                                                </Button>
                                            </div>
                                            {/* Turnstile Container */}
                                            <div id="turnstile-container" className="mt-1 flex justify-center min-h-[65px]" />
                                        </form>
                                     </div>

                                     <Link href="/kontakt" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50">
                                        Kontakt
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                     </Link>
                                     <Link href="/blog" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50">
                                        Blog & Porady
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                     </Link>
                                     <Link href="/dlaczego-my" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50">
                                        Dlaczego My?
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                     </Link>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
