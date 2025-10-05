# Wskazówki dla AI w projekcie `appgit`

## Komunikacja i ton
- Wszystkie komunikaty, odpowiedzi i aktualizacje kieruj do użytkownika wyłącznie po polsku, w przyjaznym i konkretnym tonie. Brak wyjątków od tej zasady.
- Jeśli odpowiedź miałaby zawierać fragment w innym języku (np. cytat, kod), wyjaśnij go po polsku i zaznacz, że fragment jest w oryginale.
- Unikaj zbędnego żargonu, stawiaj na zwięzłe podsumowania i jasno oznaczaj kolejne kroki.

## Architektura i kontekst
- Projekt stoi na **Next.js App Router 15.x** z Turbopackiem; widoki znajdziesz w `src/app/**`, domyślnie z polskimi slugami (`/zlecenia`, `/uzytkownicy`, `/setup`, `/logowanie`).
- Stylizacja opiera się o **Tailwind + shadcn/ui** (`src/components/ui/**`); trzymaj layouty na `gap-6`, karty na `rounded-2xl`/`border`/`p-6`, a dla większych modułów `rounded-3xl`.
- Używamy aliasów `@/*`. Logika domenowa żyje w `src/lib/**`, komponenty UI w `src/components/**`, mocki w `src/data/**`.
- Baza to **SQLite + Drizzle ORM** (`db/schema.ts`, `db/index.ts`); wszystkie wywołania DB wykonujemy po stronie serwera, komponenty klienckie nie importują `@db/index`.
- Projektowe ustalenia i roadmapa są w `instructions.md` – traktuj je jak spec i aktualizuj Copilot, gdy pojawią się nowe sekcje.

## Autoryzacja i sesje
- Mamy własne sesje oparte na tabelach `users` i `sessions`; token (losowe 32B) wysyłamy w ciasteczku `session`, a w bazie trzymamy jego skrót SHA-256.
- Hasła haszujemy przez `bcryptjs` i weryfikujemy `ensurePasswordPolicy`. Dostępne są `getCurrentSession()`, `getCurrentUser()`, `requireSession()` oraz `requireRole()` w `src/lib/auth.ts`.
- Logowanie i wylogowanie obsługują route handlers `src/app/api/auth/login/route.ts` oraz `src/app/api/auth/logout/route.ts`.
- `/setup` (server action w `src/app/setup/actions.ts`) zakłada pierwszego admina i ustawia sesję; `/logowanie` przekierowuje gotowego admina na `/zlecenia`.
- Tworząc nową trasę wymagającą logowania, wołaj `await requireSession()` na serwerze albo dopisz ścieżkę do listy publicznych tras w `layout.tsx`.

## UI i UX
- Celujemy w nowoczesny panel SaaS 2025: jasna paleta, pastelowe akcenty, miękkie cienie, szybkie skanowanie KPI.
- Copy, nagłówki, komunikaty i URL-e pisz po polsku; dla starych angielskich slugów zakładamy przekierowania.
- Korzystaj z gotowych komponentów shadcn (Card, Tabs, Badge, Dialog, Table itd.). Ikony dobieramy z `lucide-react`, a wykresy renderujemy przez helpery `@/components/ui/chart` (Recharts).
- Każdą tabelę budujemy na TanStack React Table (`@tanstack/react-table`) z filtrami, sortowaniem i opcjonalną paginacją.
- Zachowuj responsywność (grid/flex, breakpointy md/lg/xl), typografię `font-sans`, spacing: sekcje 24px, wnętrze kart 16px. Dodawaj wskaźniki trendów (`TrendingUp`/`TrendingDown`) i kolorowe badge dla zmian procentowych.
- Referencyjny layout dashboardu (sidebar + topbar + rząd kart KPI + sekcje analityczne jak na dostarczonym screenie) traktuj jako bazę – wszystkie nowe podstrony powinny dzielić ten sam styl kart, spacing i hierarchię nagłówków. Sidebar jest stały na desktopie, na mobile działa jako wysuwany panel.

## Struktura modułów i danych
- **Zlecenia**: front w `src/app/zlecenia/**`, logika w `src/lib/orders.ts`, etapy w `src/lib/order-stage.ts`. Statusy przechodzą: *Przyjęto → Przed pomiarem → Przed wyceną → Oczekiwanie na zaliczkę → Przed dostawą → Przed montażem → Oczekiwanie na końcową → Koniec*.
- **Użytkownicy**: `src/app/uzytkownicy/**` + helpery `src/lib/users.ts`; etykiety ról w `src/lib/user-roles.ts` są bezpieczne dla klientów.
- **Partnerzy, dostawy, pomiary, montaż, produkty** – kolejne moduły powielają układ: hero (tytuł + opis), 2–3 karty KPI, moduł analityczny (tabela/wykres) i listy szczegółowe.
- Kluczowe encje Drizzle: `clients`, `products`, `orders`, `measurements`, `installations`, `deliveries`, `attachments`, `partner_status_history`. Relacje opieramy na `order_id` oraz identyfikatorach partnerów/klientów.
- Role: *Admin* (pełny dostęp), *Monter* (własne zlecenia i raporty), *Partner* (przypisany portfel klientów/zleceń).

## Konwencje implementacyjne
- Server actions zaczynamy od `"use server"`, eksportujemy tylko async funkcje i przekazujemy je do formularzy `action={fn}`. Dane wejściowe to `FormData`.
- Komponenty klienckie oznaczaj `"use client"`. Jeśli potrzebują stałych z warstwy serwera (np. role), wyciągnij je do osobnego modułu bez zależności od DB.
- Logika domenowa (Drizzle, auth) zostaje po stronie serwera; komponenty `async` w App Routerze są OK, ale niech nie trafiają do bundla przeglądarki.
- Dane mockowane trzymaj w `src/data/**` i opisuj w `instructions.md`. Alias `@/` wykorzystuj do importów.

## Baza danych i migracje
- Drizzle ORM + SQLite – schemat w `db/schema.ts`, klient z konfiguracją w `db/index.ts`.
- Baza żyje w `./data/panel.db`; jeśli katalogu brakuje, utwórz go przed startem.
- Migracje generujemy/uruchamiamy tylko przez `drizzle-kit` (`npx drizzle-kit push`), bez użycia Prisma.
- Najnowsze zmiany: rozbudowana tabela `partners` (status, segment, region, archiwizacja, kontakt) + historia statusów, nowe modele `orders`, `order_status_history`, `measurement_adjustments`, `attachments`, uproszczone `measurements`, `installations`, `deliveries`, `tasks` spięte przez `order_id`.

## Workflow deweloperski
- Uruchomienie dev: `npm run dev` (Turbopack). Jeśli proces już działa, przed lintem/testami zatrzymaj go (`taskkill /F /IM node.exe` na Windows).
- Po każdej większej zmianie odpal `npm run lint`; nie mamy osobnych testów, więc lint to główna walidacja.
- Przy zmianach schematu usuń `data/panel.db` i wypchnij migracje `npx drizzle-kit push`.
- Nowy ekran = nagłówek (tytuł + opis), karty KPI, moduł analityczny (tabela/wykres/lista) + mockowe dane, jeśli backend jeszcze nie dostarcza wartości.
- Po każdej iteracji ważne ustalenia dopisujemy do `instructions.md`, a streszczenie trafia tutaj.

## Najczęstsze pułapki
- Błąd `Can't resolve 'fs'` oznacza, że komponent kliencki importuje moduł serwerowy – rozdziel dane i UI (patrz `userRoleLabels`).
- Nie zostawiaj użytkownika bez ścieżki: brak admina → `/setup`, brak sesji → `/logowanie`; pamiętaj o aktualizacji listy publicznych tras.
- Dodając tabele, doinstaluj i reużywaj TanStack React Table zamiast tworzyć własne implementacje.
- Pilnuj stylów (`rounded-3xl`, `border`, spacing), bo niespójne karty wybijają z design systemu.
- Server actions z `redirect()` zawsze przepuszczają wyjątek `NEXT_REDIRECT` dalej. W `catch` sprawdzaj `isRedirectError(error)` z `next/dist/client/components/redirect-error` i w razie true ponownie rzucaj błąd, zamiast zamieniać go na komunikat formularza.
