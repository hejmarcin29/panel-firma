# Projekt panel (Next.js 15 + Drizzle + SQLite + shadcn)

Stack: Next.js (App Router), Tailwind v4 (minimal, pod shadcn), Drizzle ORM + SQLite (better-sqlite3), Auth.js (Credentials + Drizzle), Argon2id (@node-rs/argon2).

Nowe biblioteki (UI/UX): @tanstack/react-table, nprogress, @fullcalendar/react (+ daygrid, interaction), uploadthing (+ @uploadthing/react), yet-another-react-lightbox, pdfjs-dist.

## Stan systemu / Event store / Automatyzacje

Na dashboardzie znajduje się sekcja „Stan systemu” z trzema przyciskami:

- "Jak działa projekt" – lista kluczowych informacji (`systemInfoPoints` w `src/i18n/pl.ts`).
- "Event store" – (placeholder) przyszła lista zdarzeń domenowych emitowanych do outboxa (typ, czas, użytkownik, status). Obecnie puste – zostanie uzupełnione po wdrożeniu outbox/domain events.
- "Automatyzacje" – (placeholder) przyszły przegląd workflow / integracji (np. e-mail/SMS, generowanie dokumentów). Aktualnie wyświetla pusty stan.

Zasada iteracyjna (Definition of Done): każda merytoryczna iteracja dodaje przynajmniej jeden nowy wpis do `systemInfoPoints` (kluczowa zmiana / decyzja / ryzyko / TODO). Jeśli brak zmian – w opisie PR wpis "Brak nowego wpisu do Stanu systemu (no-op)".

Jeżeli w iteracji powstaje nowa automatyzacja lub nowy typ zdarzenia domenowego, należy:
1. Dodać/zmodyfikować wpis w `systemInfoPoints` (TAG `[ZMIANA]`, `[DECYZJA]` lub `[TODO]`).
2. Uzupełnić tłumaczenia / placeholdery paneli (jeżeli pojawiają się nowe kategorie).
3. W przyszłości (po wdrożeniu outboxa) – dopisać event do centralnej definicji (np. `src/domain/events.ts`) i upewnić się, że panel Event store go poprawnie prezentuje.

Format sugerowany wpisów: `YYYY-MM-DD – [TAG] Krótki opis`.

### Event Store (faza podstawowa wdrożona)
Zaimplementowano tabelę `domain_events` oraz emisję zdarzeń dla operacji na kliencie i notatkach:
- `client.created`, `client.updated` (lista `changedFields`), `client.deleted`, `client.note.added`.
Helper: `emitDomainEvent` w `src/domain/events.ts` (walidacja payloadu Zod + zapis). Endpoint podglądu: `GET /api/events` (ostatnie 100). Dialog „Event store” w dashboardzie pobiera teraz realne dane.

Kolejne kroki (przyszłość): outbox worker (forward), kategorie/filtry w UI, integracje (e-mail/SMS), alerty anomalii.

Najświeższe wpisy trzymamy na górze listy.

## UX decisions

Primary forms remain full pages (no modals/intercepting routes for now). See `docs/UX_DECISIONS.md` for context and future considerations.

## Szybki start (dev)
1. Skopiuj `.env.example` do `.env.local` i uzupełnij `NEXTAUTH_SECRET`.
2. Uruchom dev: `npm run dev`.
3. Ekran setup admina jest pod `/setup` (działa tylko po dodaniu logiki tworzenia konta).

## Migracje Drizzle
- Konfiguracja: `drizzle.config.ts`.
- Generowanie: `npx drizzle-kit generate` (po dodaniu definicji w `src/db/schema.ts`).
- Migracja: `npx drizzle-kit migrate`.

## Notatki
- Baza w pliku `./data/app.db` (tworzony automatycznie). Tryb WAL i `busy_timeout=5000` ustawione.
- Hashing: Argon2id (@node-rs/argon2). Wrapper w `src/lib/hash.ts`.
- Auth: route `app/api/auth/[...nextauth]/route.ts` (Credentials + DrizzleAdapter).
- Tailwind: konfiguracja w `postcss.config.mjs`, tokeny w `src/app/globals.css`.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Produkcja (self-host / Docker)

Wymagane zmienne środowiskowe (patrz `.env.example`):

- NEXTAUTH_URL – publiczny adres aplikacji (np. https://panel.twojadomena.pl)
- NEXTAUTH_SECRET – silny losowy sekret (min. 32 znaki)
- DATABASE_URL – dla SQLite: `file:./data/app.db`
 - UPLOADTHING_SECRET, UPLOADTHING_APP_ID – wymagane do wysyłek plików (uploadthing)

Budowa obrazu i uruchomienie:

1) Zbuduj obraz multi-stage (Next.js standalone):
	 - Dockerfile już dodany (Node 20 alpine, standalone output).
2) Uruchom docker-compose z wolumenem na `./data`:

```
docker compose up --build -d
```

Aktualizacje/migracje:
- Po zmianach w `src/db/schema.ts` wygeneruj migracje i zastosuj je przed buildem:
	- `npx drizzle-kit generate; npx drizzle-kit migrate`
- Przed większą zmianą zrób snapshot bazy: skopiuj `data/app.db` do `backups/`.

Uwagi:
- Obraz wykorzystuje `output=standalone`. Serwowanie odbywa się przez `node server.js` wewnątrz kontenera.
- SQLite jest OK dla małego zespołu. Dla produkcji z wieloma równoległymi zapisami rozważ migrację do Postgresa.

## Integracja: Kalendarz Google (plan)

- Logowanie pozostaje Credentials. Dodamy account-linking (OAuth) tylko do kalendarza.
- Wymagane w `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (projekt GCP, włączone Google Calendar API).
- Redirect URI (dev): `http://localhost:3000/api/auth/callback/google` (prod: `https://twojadomena.pl/api/auth/callback/google`).
- UI: Ustawienia montażysty → Integracje → Kalendarz Google (Połącz/Odłącz, wybór kalendarza, włącz/wyłącz sync).
- Admin: Ustawienia → Integracje (opis i statusy — read-only).

## Produkcyjny deploy na VPS (Docker + Caddy + SQLite)

Poniżej sprawdzona, prosta procedura uruchomienia produkcyjnego na własnym serwerze (HTTPS przez Caddy, baza SQLite w bind‑mouncie). Ten wariant jest lekki i bezobsługowy dla małego zespołu.

### Założenia
- VPS z Ubuntu 22.04+ i zainstalowanym Dockerem + Docker Compose.
- Domeny skierowane na serwer (rekord A/AAAA). Certyfikaty wystawi automatycznie Caddy (Let’s Encrypt).
- Trwałe dane w katalogu hosta: `/srv/prime/data` zmapowane do katalogu kontenera: `/data`.
- URL aplikacji: np. `https://b2b.primepodloga.pl`.

### Wymagane zmienne środowiskowe
- `NEXTAUTH_URL` – publiczny adres aplikacji (np. `https://b2b.primepodloga.pl`).
- `NEXTAUTH_SECRET` – silny, stabilny sekret (min. 32 losowe znaki) – nie zmieniaj między deployami.
- `DATABASE_URL` – plik w bind‑mouncie: `file:/data/panel.db`.

### docker-compose.yml (przykład)
Zapisz na serwerze obok repo:

```yaml
services:
  app:
    build: .
    environment:
      NEXTAUTH_URL: https://b2b.primepodloga.pl
      NEXTAUTH_SECRET: "wstaw-tu-silny-sekret"
      DATABASE_URL: file:/data/panel.db
    volumes:
      - /srv/prime/data:/data
    restart: unless-stopped

  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /srv/prime/caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped

volumes:
  caddy_data: {}
  caddy_config: {}
```

### Caddyfile (przykład)
Upewnij się, że montujesz plik→plik (nie katalog). Zapisz jako `/srv/prime/caddy/Caddyfile`:

```caddyfile
{
  admin off
}

b2b.primepodloga.pl {
  encode zstd gzip
  reverse_proxy app:3000

  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  }
}
```

### Pierwsze uruchomienie
1) Przygotuj katalogi:
```bash
sudo mkdir -p /srv/prime/data /srv/prime/caddy
```
2) Build i start:
```bash
docker compose build --progress=plain app
docker compose up -d app caddy
docker compose logs -f --tail=100 app caddy
```
3) Wejdź na `https://b2b.primepodloga.pl/`. Pierwszy raz: przekierowanie do `/login` (lub `/setup` jeśli brak użytkowników).
4) Jeśli zmieniałeś `NEXTAUTH_SECRET`, wyczyść cookies domeny (lub użyj trybu prywatnego).

Notatki techniczne:
- Migracje Drizzle uruchamia skrypt startowy (`migrate.mjs`) – bez ręcznej ingerencji.
- Baza działa w WAL, `busy_timeout=5000`, włączone `foreign_keys`.

### Backup/Snapshot bazy SQLite
Zalecane przed aktualizacją i cyklicznie:

```bash
sudo apt-get update && sudo apt-get install -y sqlite3
sudo mkdir -p /srv/prime/backups
sqlite3 /srv/prime/data/panel.db \
  ".backup '/srv/prime/backups/panel-$(date +%F-%H%M).db'"
```

Przywracanie (zatrzymaj aplikację):
```bash
docker compose down app
sqlite3 /srv/prime/data/panel.db \
  ".restore '/srv/prime/backups/panel-YYYY-MM-DD-HHMM.db'"
docker compose up -d app
```

Cron – nocny backup + retencja 14 dni (`/etc/cron.d/panel-db-backup`):
```cron
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

0 2 * * * root mkdir -p /srv/prime/backups && sqlite3 /srv/prime/data/panel.db \
  ".backup '/srv/prime/backups/panel-$(date +\%F-\%H\%M).db'" && \
  find /srv/prime/backups -type f -name 'panel-*.db' -mtime +14 -delete
```

### Bezpieczna aktualizacja (git pull → build → restart)
1) Zrób snapshot bazy (jak wyżej).
2) W katalogu repo na serwerze:
```bash
git fetch --all
git checkout beta  # jeśli używasz gałęzi beta
git pull --ff-only
docker compose build app
docker compose up -d app
docker compose logs -f --tail=100 app
```
3) Sanity check: strona główna ładuje się przez HTTPS; niezalogowany dostaje 302/307 do `/login`.

Ważne:
- Nie generuj migracji na serwerze – dodawaj je w repo i buduj obraz z migracjami.
- Nie zmieniaj mapowania `/srv/prime/data:/data` – to trwała baza.
- `NEXTAUTH_SECRET` musi być stabilny między deployami (zmiana unieważnia sesje).

### Rozwiązywanie problemów
- Caddy błąd „not a directory” dla Caddyfile: montuj PLiK → `/etc/caddy/Caddyfile:ro`.
- Nie ustawiaj zmiennej `CADDY_ADMIN=off` – użyj `admin off` w Caddyfile (blok globalny).
- `JWT_SESSION_ERROR` (Auth.js): ustaw prawidłowe `NEXTAUTH_URL` i `NEXTAUTH_SECRET`; restart + wyczyść cookies.
- „database is locked”: SQLite ma pojedynczego writera; aplikacja ustawia `busy_timeout`, ogranicz równoległe zapisy i używaj transakcji.
