# Panel operacyjny – montaże + dropshipping

Nowe MVP panelu do zarządzania brygadami montażowymi i kanałem dropshipping paneli fotowoltaicznych. Projekt startuje od czystej bazy na Next.js 15 (App Router) z Tailwindem i Drizzle ORM.

## Stos technologiczny
- Next.js 15 (App Router) + TypeScript + Turbopack (`npm run dev`).
- Tailwind CSS 3.4 + shadcn/ui, niestandardowa paleta w `src/app/globals.css`.
- Drizzle ORM z `@libsql/client`, schemat w `db/schema.ts`, migracje w folderze `drizzle/`.
- Sesje logowania oparte o `bcryptjs` + tokeny SHA-256 (cookie `session`).

## Struktura UI
- Layout aplikacji (`src/components/layout/app-shell.tsx`) zapewnia sidebar + topbar i jest używany przez grupę tras `(app)`.
- Publiczne ekrany (np. logowanie) znajdują się w grupie `(public)` i nie wymagają sesji.
- Mocki danych dashboardu: `src/data/dashboard.ts` – zastąpić realnymi zapytaniami w kolejnych iteracjach.

## Dostępne widoki
- `/panel` – przegląd KPI i kolejka zadań.
- `/montaze` – podgląd harmonogramu montaży.
- `/dropshipping` – zamówienia magazynowe i status wysyłek.
- `/produkty` – placeholder katalogu produktów.
- `/logowanie` – formularz logowania z server action `loginAction`.

## Uruchomienie
```bash
npm install
npm run db:push   # utworzenie schematu w data/panel.db
npm run dev
```

## Następne kroki
1. Formularz setup pierwszego administratora.
2. CRUD klientów/partnerów oraz listy zamówień.
3. Podpięcie realnych danych do dashboardu i modułu dropshipping.
