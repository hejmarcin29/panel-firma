'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { FILTERS_CONFIG } from '@/lib/filter-config';
import { useProductFilters } from '@/hooks/use-product-filters';

interface FilterOption {
  name: string;
  slug: string;
  count: number;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableOptions: Record<string, FilterOption[]>; // Aggregations from backend
  totalProducts: number;
}

export function FilterModal({ isOpen, onClose, availableOptions, totalProducts }: FilterModalProps) {
  const { searchParams, setFilter } = useProductFilters();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Filtrowanie</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <Accordion type="multiple" defaultValue={['categories', 'brands', 'price']}>
              {FILTERS_CONFIG.map((filter) => (
                <AccordionItem key={filter.id} value={filter.id}>
                  <AccordionTrigger className="text-base font-medium">
                    {filter.label}
                  </AccordionTrigger>
                  <AccordionContent>
                    
                    {filter.type === 'checkbox' && (
                      <div className="space-y-3 pt-2">
                        {availableOptions[filter.id]?.map((option) => (
                          <div key={option.slug} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`${filter.id}-${option.slug}`}
                              checked={searchParams.get(filter.id)?.split(',').includes(option.slug)}
                              onCheckedChange={() => setFilter(filter.id, option.slug)}
                            />
                            <label 
                              htmlFor={`${filter.id}-${option.slug}`} 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {option.name}
                              <span className="ml-1 text-gray-400 font-normal">({option.count})</span>
                            </label>
                          </div>
                        ))}
                        {(!availableOptions[filter.id] || availableOptions[filter.id].length === 0) && (
                            <p className="text-sm text-gray-500">Brak opcji</p>
                        )}
                      </div>
                    )}

                    {filter.type === 'range' && (
                      <div className="px-2 py-6">
                         {/* Placeholder for range slider logic - needs min/max from aggregations */}
                         <Slider defaultValue={[0, 1000]} max={2000} step={10} />
                         <div className="flex justify-between text-xs mt-4 text-gray-500">
                           <span>0 zł</span>
                           <span>2000 zł</span>
                         </div>
                      </div>
                    )}

                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <SheetFooter className="p-6 border-t bg-gray-50 sm:justify-between gap-4">
            <Button variant="outline" onClick={() => {
                // Clear all filters logic could go here
            }}>
                Wyczyść
            </Button>
            <Button className="flex-1" onClick={onClose}>
                Pokaż {totalProducts} produktów
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
