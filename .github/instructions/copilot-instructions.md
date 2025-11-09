# Wskazówki dla AI w projekcie `appgit`

## Komunikacja
- Wszelka komunikacja prowadzona jest po polsku, w tonie partnerskim i rzeczowym.
- Fragmenty kodu lub cytaty w innym języku zostawiamy w oryginale – pamiętaj, by dodać krótkie objaśnienie po polsku.

## Stos technologiczny
- Aplikacja opiera się o **Next.js 15 (App Router)**, z pakietem `next-themes` do motywu.
- Stylowanie realizujemy przez **Tailwind CSS 3.4** + **shadcn/ui** (`src/components/ui/**`). Komponenty mają miękkie krawędzie (`rounded-2xl`, w większych partiach `rounded-3xl`), spacing `gap-6`, pastelową paletę i jasny tryb jako domyślny.
- Alias `@/*` wskazuje na `src`, dodatkowo mamy alias `@db` dla `db/index.ts` oraz `@db/*` dla schematów.
- UI celuje w nowoczesny panel operacyjny 2025: jasne tło, pastelowe akcenty, miękkie cienie, dobre wskaźniki KPI (`TrendingUp`, `TrendingDown`).
- Wszelkie wykresy budujemy na `@/components/ui/chart` (Recharts) – na razie mamy placeholdery tabel.

## Domeny biznesowe
- **Panel główny (`/panel`)** – dashboard KPI i statusów zamówień dropshipping.
- **Dropshipping (`/dropshipping`)** – zamówienia magazynowe i wysyłki.
- **Produkty (`/produkty`)** – przygotowanie pod katalog paneli i usług.
- **Setup (`/setup`)** – jednorazowa konfiguracja pierwszego administratora po świeżej instalacji.

## Baza danych i Drizzle
- Używamy **Drizzle ORM (libSQL)**; klient znajduje się w `db/index.ts`, schemat w `db/schema.ts`, migracje w `./drizzle`.
- Połączenie lokalne: `DATABASE_URL=file:./data/panel.db`. Polecenia Drizzle odpalamy przez `npm run db:push` / `npm run db:generate` / `npm run db:studio`.
- Kluczowe tabele:
  - `users`, `sessions` (sesje hashowane SHA-256, cookie `session`, TTL 30 dni).
  - `clients`, `partners`, `products`, `orders`, `order_items`, `installations`, `shipments`, `order_status_history`, `inventory_snapshots`.
  - Statusy zamówień: `NOWE`, `PLANOWANE`, `W_REALIZACJI`, `WYSŁANE`, `ZREALIZOWANE`, `ANULOWANE`.
  - Role użytkowników: `ADMIN`, `MONTER`, `SPRZEDAZ` (etykiety w `src/lib/user-roles.ts`).

## Autoryzacja i sesje
- Hasła trzymamy jako `bcrypt` (`hashPassword`, `verifyPassword` w `src/lib/auth.ts`).
- `createSession()` zapisuje skrót tokenu (SHA-256) i ustawia cookie `session` (httpOnly, sameSite=lax, secure w produkcji).
- `requireSession()`/`requireRole()` walidują dostęp na warstwie serwera – każda chroniona strona (`(app)` group) wywołuje `await requireSession()` w layoucie.
- `middleware.ts` pilnuje obecności cookie `session`; publiczne ścieżki: `/logowanie`, `/setup`, `/api/auth`.

## UI i UX
- Layout aplikacyjny w `AppShell` (`src/components/layout/app-shell.tsx`) – sidebar + topbar, mobile via `Sheet`.
- Formy używają komponentów shadcn (`Input`, `Button`, `Label`), stany błędów sygnalizowane pastelową czerwienią.
- Karty KPI (`Card`) i sekcje analityczne (`Tabs`, `Table`) mają spójny spacing i pastelowe highlighty (`bg-success/15`, `bg-destructive/10`).
- Ikony: `lucide-react`. Wersja ciemna aktywowana przez `ThemeToggle`.

## Workflow
- Menedżer pakietów: **npm**. Po większych zmianach uruchamiamy `npm run lint`.
- Dev server: `npm run dev` (Turbopack).
- Przed wypchnięciem migracji upewnij się, że `data/panel.db` istnieje; dla świeżego środowiska odpal `npm run db:push`.
- Codziennie aktualizujemy `instructions.md` po ustaleniach domenowych.

## TODO / Roadmapa MVP
1. Przygotować seed startowy (np. skrypt Drizzle) i zasilić podstawowe dane testowe.
2. CRUD klientów i partnerów (widoki list + formularze).
3. Podpięcie realnych zapytań Drizzle (dashboard obecnie na mockach z `src/data/dashboard.ts`).
4. Integracja statusów zamówień z historią (`order_status_history`).
5. Kolejny krok: automatyzacja numeracji zamówień (prefiks `ORD-` / `DS-`).
