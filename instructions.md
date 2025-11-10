# Projekt: instrukcje zespołu

## Praca z bazą danych (Drizzle + SQLite)
- Schemat trzymamy w `src/lib/db/schema.ts`. Każda zmiana struktur tabel trafia najpierw tutaj.
- Po zakończeniu iteracji, jeśli zmieniałeś schemat, uruchom `npm run db:generate`, aby wygenerować migrację do folderu `drizzle/`.
- Sprawdź wygenerowaną migrację i gdy jest OK, zatwierdź ją w repozytorium razem ze zmianami w schemacie.
- Aby od razu zaktualizować lokalną bazę, użyj `npm run db:migrate`. Dzięki temu inni członkowie zespołu i środowiska CI/CD mogą potem zreplayować te same migracje.
- Gdy nie było zmian w schemacie podczas iteracji, migracji nie generujemy.

## Przydatne polecenia
- `npm run dev` – lokalny serwer Next.js.
- `npm run lint` – sprawdzenie lintem.
- `npm run db:studio` – podgląd danych i schematu przez Drizzle Studio.
