## Stos technologiczny

- Next.js 15 (App Router, Turbopack)
- Tailwind CSS + shadcn/ui
- Drizzle ORM + SQLite (`data/panel.db`)

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja startuje pod adresem [http://localhost:3000](http://localhost:3000).

## Budowanie i start w trybie produkcyjnym

```bash
npm run build
npm run start
```

## Wdrożenie przez Docker Compose

1. Upewnij się, że w katalogu głównym istnieje plik `.env` z wymaganymi zmiennymi (np. klucze sesji, URL bazy).
2. uruchom build i start kontenera:

```bash
docker compose build
docker compose up -d
```

Serwis nasłuchuje na porcie `3000`. Wolumen `./data` jest montowany do `/app/data`, dzięki czemu baza SQLite pozostaje poza kontenerem.

## Aktualizacja schematu bazy

Do migracji używamy `drizzle-kit`:

```bash
npx drizzle-kit push
```

Migracje generują pliki w katalogu `drizzle/`. Baza działa na pliku `data/panel.db` (tworzy się automatycznie, jeśli brakuje).
