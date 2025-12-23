'use client';

import { useProductFilters } from '@/hooks/use-product-filters';
import { Search, SlidersHorizontal, X, RefreshCw } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syncProductsAction } from '@/app/dashboard/erp/products/actions';
import { toast } from 'sonner';

export function ProductControlBar({ totalProducts, onOpenFilters }: { totalProducts: number, onOpenFilters: () => void }) {
  const { searchParams, setSingleFilter } = useProductFilters();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (searchParams.get('q') || '')) {
        setSingleFilter('q', searchTerm || null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, setSingleFilter, searchParams]);

  const currentScope = searchParams.get('scope') || 'public';

  const handleSync = async () => {
    setIsSyncing(true);
    try {
        await syncProductsAction();
        toast.success('Zsynchronizowano produkty');
        startTransition(() => {
            router.refresh();
        });
    } catch (error) {
        console.error(error);
        toast.error('Błąd synchronizacji');
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <div className="sticky top-[65px] md:top-[120px] z-30 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b shadow-sm pb-4 pt-4 px-5 space-y-4">
      
      {/* Zone A: Scope & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Scope Switch */}
        <Tabs value={currentScope} onValueChange={(val) => setSingleFilter('scope', val)} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="public">Publiczne</TabsTrigger>
            <TabsTrigger value="private">Prywatne</TabsTrigger>
            <TabsTrigger value="all">Wszystkie</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Szukaj po nazwie, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Zone B: Filters & Sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={onOpenFilters}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtry</span>
            {Array.from(searchParams.entries()).filter(([k]) => !['scope', 'q', 'page', 'sort'].includes(k)).length > 0 && (
               <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                 {Array.from(searchParams.entries()).filter(([k]) => !['scope', 'q', 'page', 'sort'].includes(k)).length}
               </span>
            )}
          </Button>
          
          <div className="hidden md:flex gap-2 overflow-x-auto">
             {Array.from(searchParams.entries()).map(([key, value]) => {
                if (['scope', 'q', 'page', 'sort'].includes(key)) return null;
                return (
                    <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-xs rounded-full">
                        {key}: {value}
                        <button onClick={() => setSingleFilter(key, null)}><X className="h-3 w-3" /></button>
                    </span>
                )
             })}
          </div>
        </div>

        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
                {totalProducts} produktów
            </span>
            
            <Select 
                value={searchParams.get('sort') || 'date_desc'} 
                onValueChange={(val) => setSingleFilter('sort', val)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sortuj" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="date_desc">Najnowsze</SelectItem>
                    <SelectItem value="price_asc">Cena: rosnąco</SelectItem>
                    <SelectItem value="price_desc">Cena: malejąco</SelectItem>
                    <SelectItem value="title_asc">Nazwa: A-Z</SelectItem>
                </SelectContent>
            </Select>

            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSync}
                disabled={isSyncing || isPending}
                title="Synchronizuj produkty"
            >
                <RefreshCw className={`h-4 w-4 ${isSyncing || isPending ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>
    </div>
  );
}
