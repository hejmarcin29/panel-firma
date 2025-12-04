'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';

export function WpChangesSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zmiany WP (API)</CardTitle>
          <CardDescription>
            Konfiguracja automatycznych zmian w WordPress przez API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="enable-wp-changes">Włącz automatyczne zmiany</Label>
              <p className="text-sm text-muted-foreground">
                Zezwól aplikacji na wprowadzanie zmian w produktach WooCommerce.
              </p>
            </div>
            <Switch id="enable-wp-changes" disabled />
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Domyślne ustawienia produktów</h3>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="default-status">Domyślny status po edycji</Label>
                <Input id="default-status" placeholder="np. private" disabled />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="price-modifier">Modyfikator ceny (%)</Label>
                <Input id="price-modifier" type="number" placeholder="0" disabled />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Bezpieczeństwo</h3>
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="require-approval">Wymagaj zatwierdzenia zmian</Label>
                <p className="text-sm text-muted-foreground">
                  Każda zmiana musi zostać ręcznie zatwierdzona przez administratora.
                </p>
              </div>
              <Switch id="require-approval" checked disabled />
            </div>
          </div>

          <div className="pt-4">
            <Button disabled>Zapisz ustawienia</Button>
          </div>

        </CardContent>
      </Card>

      <Card className="bg-muted/50 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-5 w-5 text-blue-500" />
            Plan wdrożenia i możliwości (Notatka deweloperska)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2 text-foreground">Co trzeba zrobić, aby to działało (ToDo):</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Dodać nowe klucze konfiguracyjne w <code>src/lib/settings.ts</code> (np. <code>woo.auto_update_enabled</code>, <code>woo.price_modifier</code>).</li>
              <li>Podpiąć ten formularz pod <strong>Server Actions</strong>, aby zapisywał wartości w bazie danych.</li>
              <li>Zaimplementować funkcję <code>updateProduct</code> w <code>actions.ts</code>, która będzie pobierać te ustawienia przed wykonaniem zmiany.</li>
              <li>Dodać logikę "Safety Check" – jeśli włączone jest "Wymagaj zatwierdzenia", zmiany trafiają najpierw do kolejki (np. nowa tabela w bazie), a nie bezpośrednio do WooCommerce.</li>
            </ul>
          </div>
          
          <Separator className="bg-border/50" />

          <div>
            <h4 className="font-semibold mb-2 text-foreground">Możliwości API (co można tu jeszcze dodać):</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Masowa aktualizacja cen:</strong> Globalna podwyżka/obniżka o X% dla wybranej kategorii lub producenta.</li>
              <li><strong>Automatyzacja stanów:</strong> Automatyczne ustawianie statusu <code>private</code> (ukryty), gdy stan magazynowy spadnie do 0.</li>
              <li><strong>Zarządzanie SEO:</strong> Masowe generowanie meta-tytułów i opisów na podstawie szablonów (np. <code>[Nazwa] - Kup tanio w [Sklep]</code>).</li>
              <li><strong>Tagowanie nowości:</strong> Automatyczne dodawanie tagu "Nowość" dla produktów dodanych w ostatnich 7 dniach i usuwanie go po 30 dniach.</li>
              <li><strong>Synchronizacja zdjęć:</strong> Podmiana zdjęć w tle na zoptymalizowane wersje z R2/S3.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
