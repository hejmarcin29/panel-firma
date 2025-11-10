# Projekt: instrukcje zespołu

## Praca z bazą danych (Drizzle + SQLite)
- Schemat trzymamy w `src/lib/db/schema.ts`. Każda zmiana struktur tabel trafia najpierw tutaj.
- Po zakończeniu iteracji, jeśli zmieniałeś schemat, uruchom `npm run db:generate`, aby wygenerować migrację do folderu `drizzle/`.
- Sprawdź wygenerowaną migrację i gdy jest OK, zatwierdź ją w repozytorium razem ze zmianami w schemacie.
- Aby od razu zaktualizować lokalną bazę, użyj `npm run db:migrate`. Dzięki temu inni członkowie zespołu i środowiska CI/CD mogą potem zreplayować te same migracje.
- Gdy nie było zmian w schemacie podczas iteracji, migracji nie generujemy.
- Nowe formularze i funkcjonalności od razu łączymy z bazą — żadnych tymczasowych `useState`/mocków, dane mają trafiać do SQLite.

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

## Przydatne polecenia
- `npm run dev` – lokalny serwer Next.js.
- `npm run lint` – sprawdzenie lintem.
- `npm run db:studio` – podgląd danych i schematu przez Drizzle Studio.

## Git Hooks & pre-push
- Po sklonowaniu repo uruchom `npm run setup:hooks`, aby Git korzystał z katalogu `.githooks`.
- Hak `pre-push` odpala `npm run lint`, `npm run build` i `npm run db:generate`; w razie błędu push jest blokowany.
- Jeśli `db:generate` utworzy nowe migracje, commitnij je przed ponownym `git push`.
- W razie potrzeby możesz pominąć hak ustawiając `SKIP_PRE_PUSH=1` dla pojedynczego polecenia (`SKIP_PRE_PUSH=1 git push`).
- Pilnuj aktualnego `.env` – hak nie weryfikuje obecności zmiennych środowiskowych.
