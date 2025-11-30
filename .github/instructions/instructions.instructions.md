# Projekt: instrukcje zespołu

## Praca z bazą danych (Drizzle + SQLite)
- Schemat trzymamy w `src/lib/db/schema.ts`. Każda zmiana struktur tabel trafia najpierw tutaj.
- Po zakończeniu iteracji, jeśli zmieniałeś schemat, uruchom `npm run db:generate`, aby wygenerować migrację do folderu `drizzle/`.
- Sprawdź wygenerowaną migrację i gdy jest OK, zatwierdź ją w repozytorium razem ze zmianami w schemacie.
- Aby od razu zaktualizować lokalną bazę, użyj `npm run db:migrate`. Dzięki temu inni członkowie zespołu i środowiska CI/CD mogą potem zreplayować te same migracje.
- Gdy nie było zmian w schemacie podczas iteracji, migracji nie generujey.

## Zmienne środowiskowe
- Plik `.env` jest wersjonowany i zawiera bezpieczne wartości domyślne (bez sekretów).
- Po klonowaniu repo skopiuj `.env` do `.env.local` i uzupełnij sekrety oraz ustawienia specyficzne dla środowiska.
- `.env.local` jest ignorowany przez git – trzymaj w nim wszystko, czego nie chcemy w repo (tokeny, klucze, prod/stage URL).
- Next.js ładuje `.env.local` z wyższym priorytetem, więc nadpisuje wartości z `.env`.

## shadcn/ui
- Projekt ma zainicjalizowaną bibliotekę shadcn/ui (pełny zestaw komponentów w `src/components/ui`).
- Nowe komponenty pobieramy poleceniem `npx shadcn@latest add <nazwa>` – CLI doda pliki i zależności.
- Większość komponentów bazuje na Radix UI, dlatego pamiętaj o dostosowaniu importów (`@/components/ui/...`).
- Temat wprowadzony do `src/app/globals.css` korzysta z CSS variables; w razie zmiany kolorystyki aktualizujemy je w jednym miejscu.

## Kompaktowy interfejs panelu
- Dashboard prowadzimy w gęstszej siatce: domyślnie używamy mniejszych odstępów (`px-3.5`, `py-3`, `space-y-2.5`) i unikamy dużych marginesów (`p-6`+).
- Komponenty współdzielone (np. `Card`) powinny zachowywać spójne, zwarte paddingi, tak aby zmiany propagowały się globalnie.
- Formularze i listy trzymamy możliwie w jednej kolumnie gapu `2–3`, a odstępy między sekcjami redukujemy do `space-y-4` lub mniej.
- Przed dodaniem nowych widoków porównaj spacing z widokami zamówień i maili, żeby utrzymać jednolitą gęstość interfejsu.

## Przechowywanie załączników
- Załączniki do zamówień zapisujemy w R2 pod ścieżką `zamowienia/<slug_imie_nazwisko>/dokumenty` (slug z imienia i nazwiska klienta lub `klient` jako fallback).
- Załączniki do montaży zostawiamy w dotychczasowym formacie `montaze/<slug_imie_nazwisko>_montaz`.
- Nazwy plików zawsze sanitizujemy (`sanitizeFilename`) i pilnujemy limitu 25 MB na pojedynczy upload.

## Przydatne polecenia
- `npm run dev` – lokalny serwer Next.js.
- `npm run lint` – sprawdzenie lintem.
- `npm run db:studio` – podgląd danych i schematu przez Drizzle Studio.

## Unikanie błędów hydracji (Hydration Errors)
- W komponentach oznaczonych `'use client'` **NIGDY** nie używaj `new Date()` (bez argumentów), `Math.random()`, `window` ani `localStorage` bezpośrednio w ciele funkcji renderującej lub jako wartość początkowa `useState`.
- Powód: Wartości te będą inne na serwerze (podczas generowania HTML) i inne w przeglądarce (podczas hydracji), co powoduje błędy i "miganie" interfejsu.
- Rozwiązanie 1: Przekaż gotową wartość (np. datę) jako props z komponentu serwerowego (`page.tsx`).
- Rozwiązanie 2: Użyj `useEffect`, aby ustawić wartość dopiero po załadowaniu komponentu w przeglądarce.
