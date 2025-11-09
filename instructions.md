# Guidelines

## Komunikacja
- Rozmawiamy po polsku, krótko i konkretnie.
- Użytkownik oczekuje jasnego podsumowania zmian oraz listy następnych kroków.

## Tech stack
- Next.js 15 (App Router) + TypeScript + Turbopack.
- Tailwind 3.4 + shadcn/ui, pastelowa paleta zapisane w `src/app/globals.css`.
- Drizzle ORM z `@libsql/client`, baza plikowa `data/panel.db`.

## Architektura
- Layout aplikacyjny: `AppShell` (sidebar + topbar) obsługuje grupę tras `(app)`.
- Publiczne ekrany (`/logowanie`, `/setup`) funkcjonują w grupie `(public)` bez wymogu sesji.
- Strona `/setup` prowadzi jednorazowy formularz tworzący pierwszego administratora i loguje go po sukcesie.
- Mocki danych dashboardu w `src/data/dashboard.ts` – docelowo zastąpić realnymi zapytaniami.
- Alias `@/*` -> `src`, `@db` -> `db/index.ts`, `@db/*` -> `db/**/*`.

## Autoryzacja
- Tabele `users`, `sessions` w Drizzle – zobacz `db/schema.ts`.
- Funkcje pomocnicze w `src/lib/auth.ts` (hashowanie, sesje, `requireSession`, `requireRole`).
- Middleware pilnuje cookie `session`; walidacja właściwej sesji odbywa się dopiero w layoucie `(app)`.
- Publiczny setup (`/setup`) sprawdza liczbę użytkowników i pozwala utworzyć pierwszego admina (server action `setupAction`).
- Strona logowania (`/logowanie`) korzysta z server action `loginAction` i ustawia sesję po sukcesie.

## Domeny biznesowe
- `/panel` – przegląd KPI i statusów zamówień dropshipping (obecnie na mockach).
- `/dropshipping` – kolejka wysyłek magazynowych.
- `/produkty` – placeholder pod przyszły katalog.

## Workflow dev
- Nowy branch dla większych zmian (np. `feature/…`), commit po przejściu `npm run lint`.
- Migracje: `npm run db:generate` + `npm run db:push`. Baza przechowywana w `data/panel.db`.
- Po ukończeniu zadania aktualizuj dokumentację (ten plik + `.github/instructions`).

## Najbliższe zadania
1. Przygotować prosty seed danych startowych (np. skrypt Drizzle) i zasilić dashboard/testowe wpisy.
2. Rozpocząć CRUD klientów i partnerów (listy + formularze) z wykorzystaniem Drizzle.
3. Podpiąć realne zapytania do dashboardu KPI i tabel w `/panel`.
