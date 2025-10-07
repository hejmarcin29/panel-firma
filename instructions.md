# Projekt Guidelines

## Komunikacja
- W korespondencji w repozytorium (w tym w rozmowach na czacie) używamy języka polskiego.

## Auth
- Autoryzację realizujemy własnym systemem sesji opartym na tabelach `users` i `sessions` w Drizzle. Token sesji to losowy ciąg (32B) przekazywany w ciasteczku `session`; w bazie zapisujemy jego skrót SHA-256.
- Kod auth trzymamy w `src/lib/auth/*` (hashing haseł, generowanie tokenów, pobieranie sesji, wymagane role) oraz w route handlers `src/app/api/auth/login/route.ts` i `src/app/api/auth/logout/route.ts`.
- Hasła przechowujemy jako bcrypt (`bcryptjs`), walidowane przez `ensurePasswordPolicy` (min. 8 znaków, bez skrótów). Helpers udostępniają `requireRole` oraz `getCurrentUser()` i `getCurrentSession()` dla server actions.

## UI
- Projektuj jak topowy panel admina 2025: nowoczesny SaaS look & feel, jasna paleta, szerokie marginesy, pastelowe akcenty i miękkie cienie; UX ma wspierać szybkie skanowanie KPI i klarowną hierarchię.
- Copy, etykiety i komunikaty w panelu piszemy po polsku; domyślne ścieżki App Routera również mają polskie slug'i (np. `/partnerzy`, `/monterzy`). Dla dawnych angielskich slugów dodajemy przekierowania.
- Stosujemy shadcn/ui + Tailwind; karty mają `rounded-2xl`, `border`, `p-6`, a layouty `gap-6`, wykorzystujemy komponenty z `src/components/ui/*` (Sidebar, Card, Tabs, Badge, Progress, Table, Dialog itd.).
- Każdą tabelę budujemy na bazie TanStack React Table (`@tanstack/react-table`) – dodajemy tę zależność przy pierwszym użyciu i reużywamy jej helperów do sortowania, filtrów i paginacji.
- Ikony pochodzą z `lucide-react`, wykresy z `recharts` przez helpery `@/components/ui/chart`, motyw obsługujemy przez `next-themes`.
- Zachowujemy responsywność (grid/flex, breakpointy min. md/lg/xl), dla list/sekcji trzymamy spacing: blok 24px, wnętrze kart 16px, typografia `font-sans`.
- Dodajemy kontekstowe wskaźniki trendów (`TrendingUp`, `TrendingDown`), kolorowe badge dla zmian procentowych, aliasy importów `@/*`, mockowe dane trzymamy lokalnie w pliku (chyba że ustalimy inaczej) i dbamy o dostępność (aria-labels, alt, semantyczne nagłówki).

## DB (Drizzle)
- Używamy Drizzle ORM z SQLite; schemat w `db/schema.ts`, klient w `db/index.ts`.
- Domyślna ścieżka bazy to `./data/panel.db`. Jeżeli katalog `data/` nie istnieje, tworzymy go przed uruchomieniem.
- Migracje generujemy i uruchamiamy wyłącznie przez `drizzle-kit`; bez użycia Prisma ani jego terminologii.
- 04.10.2025: tabela `partners` rozszerzona o status (`partnerStatuses`), segment, region, pola archiwizacji i kontaktu; nowa tabela `partner_status_history` zapisuje zmiany statusów. Dostępne helpery w `src/lib/partners.ts` umożliwiają pobieranie listy, metryk i historii zmian.
- 05.10.2025: przebudowa modelu danych pod MVP — nowe tabele `orders`, `order_status_history`, `measurement_adjustments`, `attachments`; `measurements`, `installations`, `deliveries`, `tasks` zyskały minimalistyczne schematy powiązane przez `order_id`.

## Workflow
- Po każdej iteracji zapisujemy ważne ustalenia (architektura, konwencje, workflow, zmiany w DB, server actions) w tym pliku; wpisy mają być krótkie, aktualizować istniejące punkty i korzystać z odpowiednich sekcji.
- Pliki z server actions zaczynają się od `"use server"`, przyjmują tylko `FormData`, a w komponentach klienckich używamy `action={fn}` bez `method` i `encType`.
- Każdy nowy ekran powinien mieć nagłówek (tytuł + opis), zestaw KPI cards oraz co najmniej jeden moduł analityczny (wykres/tabela/lista); po zmianach uruchamiamy `npm run lint` i dodajemy mockowe dane, gdy są potrzebne.
- Menedżer pakietów: **npm** (pnpm nie jest zainstalowany w środowisku). Do buildów i lintu używamy `npm run ...`; komendy `pnpm ...` zakończą się błędem.
- Produkcyjne wdrożenie na VPS-ie realizujemy przez `docker compose build` / `docker compose up -d` z wykorzystaniem plików `Dockerfile` i `docker-compose.yml`; wolumen `./data` montujemy do `/app/data`, aby zachować bazę SQLite poza kontenerem.
- Build produkcyjny opiera się o standardowy bundler Next.js (`npm run build` bez flagi `--turbopack`); Docker korzysta z wieloetapowego `Dockerfile`, który uruchamia `npm ci --include=dev`, `npm run build` i `npm prune --omit=dev`.
- Role użytkowników definiujemy w `src/lib/user-roles.ts` i re-eksportujemy z `db/schema.ts`; komponenty klienckie importują wyłącznie wersję z `lib`, aby uniknąć zależności od modułów Node.js.
- Każdy nowy ekran powinien mieć nagłówek (tytuł + opis), zestaw KPI cards oraz co najmniej jeden moduł analityczny (wykres/tabela/lista); po zmianach uruchamiamy `npm run lint` i dodajemy mockowe dane, gdy są potrzebne.
- Generujemy URL i UI po polsku!

## Moduł pomiarów (05.10.2025)
- `/pomiary` prezentuje dashboard z metrykami (łącznie, zaplanowane, po terminie, zrealizowane), rozkładem planowania dostaw oraz filtrowalną tabelą pomiarów.
- `/pomiary/nowy` udostępnia formularz wizji lokalnej z uploadem plików, walidacją Drizzle/Zod i integracją z `createMeasurementAction`.
- Zakładka **Pomiary** w szczegółach zlecenia agreguje statusy, plan dostawy i linki do modułu pomiarów; CTA „Dodaj pomiar” prowadzi do formularza z prefillowanym `orderId`.

## Panel zarządzania (05.10.2025)
- **Cele biznesowe**: koordynacja procesów montażowych, dostaw i sprzedaży; raporty operacyjne (liczba zleceń, m²) w ujęciu tyg./mies. oraz mini-ERP dla kart produktów.
- **Role i uprawnienia**:
	- *Admin*: pełny dostęp, zarządzanie katalogami, dokumentami i użytkownikami.
	- *Monter*: widzi własne zlecenia i pomiary, może raportować wyniki i zamykać montaż (protokół, zdjęcia, komentarz).
	- *Partner*: ma wgląd w klientów i zlecenia/dostawy przypisane do jego portfela.
- **Kluczowe encje**:
	- `clients` – dane do faktury, zgoda RODO, relacja 1:N ze zleceniami i dostawami.
	- `products` – typ panelu/listwy, model, cena (docelowo możliwość zasilania z WordPressa).
	- `orders` – zlecenia montażowe z etapami: *Przyjęto → Przed pomiarem → Przed wyceną → Oczekiwanie na zaliczkę → Przed dostawą → Przed montażem → Oczekiwanie na końcową → Koniec*.
	- `measurements` – pomiar m²/m.b., dodatkowe informacje, % docinek, termin dostawy (liczba dni przed montażem lub konkretna data), historia korekt.
	- `installations` – termin, adres montażu, powiązane modele paneli/listw, prace dodatkowe, protokoły i zdjęcia realizacji.
	- `deliveries` – oddzielne dostawy stand-alone oraz wysyłki powiązane ze zleceniem (bez częściowych realizacji).
	- `attachments` – umowy, protokoły, zdjęcia, przypinane do zleceń/pomiarów/montaży/dostaw.
- **Widoki aplikacji**:
	- Dashboard KPI (liczba zleceń, suma m², statusy wymagające reakcji).
	- Lista zleceń + szczegół z zakładkami: *Przegląd*, *Pomiar*, *Montaż*, *Dostawa*, *Dokumenty*, *Historia*.
	- Podstrona `dostawy` dla zamówień bez montażu; dostawy związane ze zleceniem widoczne w jego szczególe.
	- Rejestry: `klienci`, `produkty`, `użytkownicy` (opcjonalnie `partnerzy`).
	- Formularz „Nowy klient” ma listę źródeł pozyskania; wybranie opcji „Partner sprzedażowy” odblokowuje pole partnera do rozliczeń prowizyjnych.
- **Workflowy**:
	- Dodanie zlecenia → przypisanie pomiaru → raport z pomiaru → wycena/zaliczka → plan dostawy (jeśli potrzeba) → przypisanie montażu → zakończenie montażu.
	- Każde przejście statusu zapisujemy w historii; automatyzacje (generowanie wycen/umów) planujemy w kolejnych iteracjach.
- **Skala startowa**: ~5 zleceń dziennie, 5 użytkowników; jedna baza SQLite (Drizzle), brak osobnego środowiska testowego.