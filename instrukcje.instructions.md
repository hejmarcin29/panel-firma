# Instrukcje dla Codex / Iteracje

Ten plik opisuje lekki proces dokumentowania iteracji i automatyczną walidację.

## Zasada główna

Każda merytoryczna iteracja (feature, refactor architektoniczny, migracja) MUSI zostawić ślad:

1. Wpis (1 linia) w `systemInfoPoints` (`src/i18n/pl.ts`). Format: `YYYY-MM-DD – [TAG] Krótki opis` gdzie TAG ∈ `[ZMIANA] [DECYZJA] [RYZYKO] [TODO] [UWAGA]`.
2. (Jeśli potrzebny kontekst > 1 zdanie) plik w `docs/iterations/YYYY-MM-DD-<slug>.md` według szablonu.
3. (Jeśli to długoterminowa decyzja) ADR w `docs/adr/`.
4. Aktualizacja `CHANGELOG.md` (sekcja daty) albo jawne "Brak wpisu do changelog (no-op)" w PR.

Brak nowego wpisu przy zmianie = uwaga w review.

## Skrypt walidacji

`npm run check:iteration` uruchamia `scripts/check-system-info.mjs` który:

- Sprawdza czy dzisiejsze commity dotykają `src/` lub `app/` bez wpisu datowanego na dziś.
- Ostrzega jeśli ostatni datowany wpis jest starszy niż 7 dni.

W CI / lokalnie przed push możesz odpalić:

```
npm run check:iteration
```

Kod wyjścia != 0 blokuje pipeline (brak wpisu).

## Husky (hooki git)

Dodane hooki:

- `pre-commit`: szybki lint.
- `pre-push`: `lint` + `check:iteration`.

Jeśli wyjątkowo trzeba ominąć (niezalecane) – można użyć `--no-verify`, np.: `git push --no-verify` (powinno być rzadko i z komentarzem w PR, dlaczego).

W przypadku błędu w hooku:

1. Sprawdź komunikat (najczęściej brak wpisu w `systemInfoPoints`).
2. Dodaj wpis / popraw linta.
3. Ponów commit/push.

## Szablon pliku iteracji

`docs/iterations/YYYY-MM-DD-slug.md`

```
# YYYY-MM-DD – Krótki tytuł

Zakres:
- ...

Powód:
- ...

Pliki:
- ...

Ryzyka / Uwagi:
- ...

TODO (planowane):
- [ ] ...

Smoke test:
1. ...
```

## ADR (Architecture Decision Record)

Plik: `docs/adr/ADR-XXXX-nazwa.md`
Numer rośnie sekwencyjnie. Zawiera: Context, Decision, Alternatives, Consequences, Follow-up.

## Eventy domenowe (skrót)

Tabela: `domain_events` (walidacja Zod w `emitDomainEvent`). Każdy nowy typ eventu: oceń czy potrzebny (`kryteria` w głównych instrukcjach). Przy dodaniu nowego typu:

- Dodaj walidację payloadu w `src/domain/events.ts`.
- Emituj w odpowiednich mutacjach.
- (Opcjonalnie) uzupełnij UI / opis w iteracji.

## Flow Definition of Done (rozszerzone)

- [ ] Kod + test smoke działa lokalnie.
- [ ] Wpis w `systemInfoPoints` dodany.
- [ ] (Jeśli istotne) plik w `docs/iterations/`.
- [ ] (Jeśli decyzja) ADR dodany lub zaktualizowany.
- [ ] `CHANGELOG.md` uzupełniony.
- [ ] `npm run check:iteration` przechodzi.
- [ ] Wydarzenia domenowe ocenione (dodano / uznano że brak potrzeby → dopisany TODO).

## 2025-09-29 – Zmiany w formularzu klienta (NOWE)

- „Na firmę” implikuje preferencję faktury VAT. W UI usunięto osobny checkbox – `preferVatInvoice` ustawiany jest automatycznie (hidden input) na podstawie `buyerType`.
- Walidacja NIP (Zod `superRefine`): włączona, gdy `buyerType = 'company'`. Wymagane 10 cyfr i poprawna suma kontrolna (wagi `[6,5,7,2,3,4,5,6,7]`, modulo 11). Dodatkowo wymagamy `companyName`.
- Maska kodu pocztowego (UI): w `AddressFields` dodano opcjonalną maskę `00-000` (auto‑myślnik po 2 cyfrach). Walidacja regex `^[0-9]{2}-[0-9]{3}$` pozostaje w schemacie.
- Komponent `AddressFields`: używany w edycji klienta dla pola fakturowego. Nie rozbijamy adresu; label doprecyzowany: „Adres (ulica i numer, opcjonalnie lokal/piętro)”.

## 2025-09-29 – Dostawy: pozycje i kontrakty (NOWE)

- Model DB: `delivery_items` (Drizzle): `id` (pk), `slotId` (FK do slotu dostawy), `name` (text), `sqmCenti` (int – m² × 100), `packs` (int ≥ 0), `createdAt` (epoch ms).
- Jednostki: metry kw. zapisujemy jako centymetry kw. (`sqmCenti`) – suma i porównania są trywialne, bez błędów zmiennoprzecinkowych.
- RBAC: odczyt admin + montażysta (w zakresie swoich zleceń); modyfikacje (POST/PATCH/DELETE) – tylko admin.
- API:
  - `GET /api/zlecenia/[id]/dostawy/[slotId]/pozycje` – lista pozycji slotu.
  - `POST /api/zlecenia/[id]/dostawy/[slotId]/pozycje` – utworzenie pozycji; body: `{ name: string, sqmCenti: number, packs: number }` (Zod walidacja).
  - `PATCH /api/zlecenia/[id]/dostawy/[slotId]/pozycje/[itemId]` – częściowa aktualizacja.
  - `DELETE /api/zlecenia/[id]/dostawy/[slotId]/pozycje/[itemId]` – usunięcie pozycji.
- UI: edycja inline (onBlur → PATCH), usuwanie z `AlertDialog` (fokus na „Anuluj”), podsumowanie łącznej powierzchni (m² z `sqmCenti`).
- Rewalidacja: po mutacji odświeżamy szczegóły zlecenia (`/zlecenia/[id]`) i (jeśli zależne) listy/kalendarz.

## 2025-09-29 – Dni robocze dla dostaw (NOWE)

- Zasada: `plannedAt = orderPlacedAt + 5 dni roboczych`.
- Obecnie pomijamy weekendy i stałe święta PL: 1.01, 6.01, 1.05, 3.05, 15.08, 1.11, 11.11, 25.12, 26.12.
- [TODO] Ruchome święta: Poniedziałek Wielkanocny, Zesłanie Ducha Św., Boże Ciało – dodać do zestawu świąt w helperze.
- UX: dopóki użytkownik nie zmieni `plannedAt` ręcznie, data nadąża za zmianami `orderPlacedAt`; po ręcznej edycji wyłączamy auto‑sync.

## 2025-09-29 – R2: wbudowany menedżer plików (NOWE)

- RBAC: listowanie/preview wymaga zalogowania; mutacje (przeniesienie/zmiana nazwy/kasowanie) wyłącznie rola admin.
- Konwencja kluczy: `client/<clientId>/<YYYY-MM>/...` (miesiąc jako folder). Unikamy spacji i znaków narodowych w nazwach – preferuj `-`/`_`.
- API kontrakty:
  - `GET /api/pliki/r2/list?prefix=...` – stronicowane listowanie, walidacja prefiksu, zwraca klucze/rozmiar/mtime.
  - `POST /api/pliki/r2/move` – copy+delete (rename/move); admin‑only.
  - `DELETE /api/pliki/r2/object?key=...` – delete; admin‑only.
  - `POST /api/pliki/r2/presign` – podpis do uploadu z kontrolą rozmiaru i MIME.
  - `GET /api/pliki/r2/proxy?key=...` – serwerowy proxy preview z poprawnym `Content-Type`.
- UX: widoki lista/grid, sticky toolbar (filtry: klient, miesiąc), DnD upload, zaznaczanie wielu i kasowanie zbiorcze; wszystkie teksty po polsku.

## Rewalidacja cache po mutacjach (NOWE)

- Po każdej mutacji CRUD (klienci, zlecenia, dostawy, pozycje, pliki) wywołujemy `revalidatePath` lub `revalidateTag` dla widoków zależnych:
  - Szczegóły zlecenia: `/zlecenia/[id]`.
  - Listy/kalendarz, jeśli ich cache korzysta z modyfikowanych danych.

## Konfiguracja środowiska – R2 (NOWE)

Do `.env.local` / `.env.example` dodaj:

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
```

`R2_PUBLIC_BASE_URL` opcjonalne (gdy używamy wyłącznie serwerowego proxy preview). Limit rozmiaru uploadu i akceptowalne typy MIME wymuszamy po stronie serwera.

## Metadata i tytuły (NOWE)

- Nie eksportuj `metadata` z komponentów oznaczonych `"use client"` (Next 15 blokuje to). Ustawienia tytułu realizujemy wyłącznie w server components (layout lub `generateMetadata`).
- Globalny szablon tytułu utrzymujemy w `app/layout.tsx` (`title.default`, `title.template`).
- Dla tras statycznych (np. `/login`, `/ustawienia`, `/klienci/nowy`) używamy lokalnego `layout.tsx` z `export const metadata = { title: "..." }`.
- Dla tras dynamicznych (np. `/klienci/[id]`, `/zlecenia/[id]`) implementujemy `export async function generateMetadata({ params }: { params: Promise<{ id: string }> })` i pobieramy dane z DB (Drizzle) do złożenia tytułu, np. `Klient: Jan Kowalski` lub `Zlecenie 123 – Jan Kowalski`.
- Przykłady produkcyjne: patrz `app/klienci/[id]/layout.tsx` oraz `app/zlecenia/[id]/layout.tsx`.

## Tipy

- Najnowsze wpisy dopisuj na końcu (konsekwencja obecnego skryptu – patrzy na kolejność; ewentualnie można przełączyć na sort malejący później).
- Jeśli zmiana to tylko kosmetyczny styl/ESLint → można pominąć plik iteracji, ale wpis 1-liniowy nadal preferowany (TAG `[UWAGA]` / `[TODO]`).

---

Ten dokument ma być krótki i praktyczny – dopisuj kolejne sekcje, gdy pojawią się nowe automatyzacje lub zasady.

## Publiczne linki: Onboarding i Portal klienta (NOWE)

- Strategia jednego linku klienta:
  - Onboarding: jednorazowy link z ważnością 90 dni (purpose `onboarding` w `client_invites`), prowadzi do publicznego formularza danych i po użyciu jest oznaczany `usedAt`.
  - Portal klienta: po zakończeniu onboardingu generujemy link portalu (purpose `portal`, bez `expiresAt` – można rotować/revokować). Link prowadzi do podglądu klienta i jego zleceń.
- Trasy publiczne (faza 1):
  - Onboarding: `/public/klienci/[token]` (GET/POST API pod `/api/public/klienci/[token]`).
  - Portal: `/public/klient/[token]` (GET API zwraca dane klienta i listę zleceń). W przyszłości można przejść na ścieżkę stabilną `/public/k/[portalId]` + magic-link jako cookie.
- Bezpieczeństwo:
  - Tokeny losowe, możliwość rotacji i revoke przez admina; scoping tylko do `clientId` linku.
  - Onboarding: `expiresAt = now + 90d`. Portal: długowieczny, ale rotowalny.
- Eventy domenowe (do rozważenia i wdrożenia przy implementacji):
  - `client.onboarding.started`, `client.onboarding.completed`
  - `client.portal.link.created`, `client.portal.link.revoked`, `client.portal.link.rotated`
  - `client.portal.accessed`
- Phasing:
  - Faza 1: bazuj na istniejącej tabeli `client_invites` (purpose `onboarding`/`portal`), TTL 90d dla onboardingu.
  - Faza 2: stabilny `portalId` w osobnej tabeli + magic-link do sesji.

## Typy i lint – unikanie `any` (NOWE)

- Używaj helpera `getSession()` z `src/lib/auth-session.ts` zamiast bezpośrednich rzutowań `getServerSession(authOptions as any)`. Helper zwraca prosty `SessionLike` i izoluje różnice typów NextAuth.
- `catch`: stosuj `catch (e: unknown)` i zawężaj do `Error` (`e instanceof Error ? e.message : 'Błąd'`).
- `req.json()` / `fetch().json()`: traktuj jako `unknown` i waliduj Zod-em (`safeParse`), zamiast rzutowań `as any`.
- Filtry po roli (SQL): zamiast `role as any` użyj strażnika `isUserRole()` z helpera.
- Jeśli wyjątkowo musisz zderzyć się z typami NextAuth, dopuszczalny jest pojedynczy `// eslint-disable-next-line @typescript-eslint/no-explicit-any` TYLKO w helperze sesji (z datowanym TODO). W pozostałym kodzie `any` jest zakazany.

Checklist w PR:

- [ ] Brak `as any` poza helperem sesji.
- [ ] Wszystkie `catch` używają `unknown` + zawężenie.
- [ ] Parsy JSON z Zod.
- [ ] Brak `role as any`.

## UI – pełna adopcja shadcn/ui (NOWE)

Cel: maksymalnie wykorzystać shadcn/ui + Radix dla spójnego i pięknego UI.

### Zależności (wymagane)

- `@radix-ui/react-slot`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-tooltip`
- `sonner` (Toaster)

Te paczki są już dodane. Przy nowych komponentach korzystaj z odpowiedników shadcn (na bazie Radix) zamiast własnych implementacji.

### Zasady migracji komponentów

1. Dialogi/Alerty: zamień lokalny `AlertDialog` na shadcn `Dialog` + wariant destrukcyjny wg dokumentacji. Zapewnia pełną dostępność, focus trap i animacje.
2. Menu/kontekst: zamień lokalny `DropdownMenu` na shadcn `DropdownMenu` (Radix) z poprawną a11y i klawiaturą.
3. Toaster: przełącz `ToastProvider` na `sonner` i używaj `toast()` z wariantami (success/destructive). Zachowaj jednolity styling z tokenami (primary #b02417).
4. Slot/asChild: używaj `Slot` do przekazywania styli i semantyki bez zagnieżdżania zbędnych elementów.
5. Nowe UI: preferuj gotowe komponenty shadcn (Button/Input/Label/Textarea/Card już mamy – można dostosować styl), a dla złożonych (Sheet, Command, Breadcrumbs, DataTable) – wdrażaj iteracyjnie.

### Definition of Done (UI)

- [ ] Nowe elementy interaktywne bazują na shadcn/ui + Radix.
- [ ] Dialogi mają a11y (ESC, focus trap, role) – automatycznie przez Radix.
- [ ] Toastery używają `sonner` i są globalnie osadzone w `app/layout.tsx`.
- [ ] Styl zgodny z tokenami brandu (#b02417, antracyt) + przejścia 180–250ms.
- [ ] Usunięto duplikujące lokalne prymitywy po migracji (cleanup martwego kodu).

### Najbliższe migracje (kroki)

- Zamień `src/components/ui/alert-dialog.tsx` na shadcn `Dialog` + confirm variant.
- Zamień `src/components/ui/dropdown-menu.tsx` na shadcn `DropdownMenu`.
- Podmień `ToastProvider` w `app/layout.tsx` na `sonner` (`<Toaster />`) i przepnij `useToast()` na proxy do sonner (lub użyj bezpośrednio `toast`).

## Backend – Route Handlers + Drizzle (LESSONS LEARNED 2025-09-28)

Poniższe wnioski po incydencie z archiwizacją klienta i kaskadą zleceń.

1. Next.js App Router – params w API i podpis funkcji

- W części konfiguracji/środowisk Next 15 parametry dynamiczne w Route Handlers mogą być asynchroniczne.
- Jeżeli pojawia się komunikat „params should be awaited before using its properties”, użyj podpisu z `Promise` i `await`:
  - `export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) { const { id } = await ctx.params }`
- Dzięki temu unikamy błędu czasu wykonania przy dostępie do `params.id`.

2. Drizzle ORM + better-sqlite3 – transakcje i egzekucja

- Z adapterem `better-sqlite3` transakcje są synchroniczne:
  - Używaj `db.transaction((tx) => { ... })` bez `async/await` w callbacku. Callback nie może zwracać promisy – inaczej pojawi się błąd „Transaction function cannot return a promise”.
- Dla mutacji (`insert/update/delete`) wywołuj `.run()` na builderze, aby operacja faktycznie się wykonała:
  - `tx.update(table).set({...}).where(...).run()`.
- Kolumny czasu w schemacie `integer(..., { mode: 'timestamp_ms' })` akceptują `Date` – preferuj przekazywanie `new Date()` (Drizzle sam zamieni na ms). Po stronie API, do JSON wysyłaj wartości znormalizowane do epoch ms, aby uniknąć niespodzianek z typem `Date` w odpowiedzi.

3. Middleware a API

- Middleware służy do kontroli dostępu/nawigacji dla UI. Dla `/api/**` nie robimy przekierowań – mogą psuć odpowiedzi fetcha.
- Wyłączamy middleware dla całego `/api/**`, a autoryzację i uprawnienia egzekwujemy w handlerach (401/403/200).

4. Emisja eventów domenowych po mutacji – non‑fatal

- Emisja eventu nie może wysadzać odpowiedzi 200 po udanym zapisie do bazy.
- Owiń `emitDomainEvent(...)` w `try/catch` i loguj ostrzeżenie w razie błędu; odpowiedź API powinna pozostać 200.

5. Kaskadowe archiwum (kontrakt)

- Archiwizacja klienta ustawia `clients.archivedAt = now`, a także `orders.archivedAt = now` dla wszystkich zleceń danego klienta w jednej transakcji.
- Przy przywracaniu oba pola są zerowane (`null`). Operacje powinny być idempotentne.

6. UX na wypadek nietypowej odpowiedzi

- W krytycznych akcjach (archiwizuj/przywróć) warto mieć fallback: przy nie‑OK odpowiedzi wykonać kontrolny GET i, jeśli stan faktycznie się zmienił, pokazać zielony toast. Po ustabilizowaniu endpointów fallback może pozostać jako siatka bezpieczeństwa.

Checklist dla mutujących endpointów (API):

- [ ] Sprawdzenie sesji/roli na początku i zwrot 401/403 w JSON.
- [ ] Operacje w `db.transaction((tx) => { ... })` bez async/await.
- [ ] Każda `insert/update/delete` zakończona `.run()` (better-sqlite3).
- [ ] Zapisy czasów jako `new Date()` dla kolumn `timestamp_ms`; w odpowiedzi JSON – ms (number).
- [ ] Emisja eventu w `try/catch` (non‑fatal dla odpowiedzi).
- [ ] `return NextResponse.json({ ok: true }, { status: 200 })` na sukces.
- [ ] (Opcjonalnie) fallbackowy GET w kliencie dla lepszego UX.

## Mobile layout hygiene (NOWE)

Lekcje z naprawy subtelnego przycięcia prawej krawędzi na mobile (iOS/Android). Stosujemy jako standard w nowych widokach i podczas refaktorów.

1) Viewport (Next.js App Router)

- W `app/layout.tsx` eksportujemy `export const viewport`:
  - `width: 'device-width', initialScale: 1, viewportFit: 'cover'`.
  - Dodatkowo: `maximumScale: 1, userScalable: false` (eliminuje startowe autoprzybliżenie na iOS – opcjonalne, ale praktyczne w tym projekcie).

2) Globalne CSS (globals.css)

- `html, body { max-width: 100%; overflow-x: hidden }`.
- `html { -webkit-text-size-adjust: 100% }` (iOS nie powiększa samoczynnie tekstu).
- Jeżeli mamy globalny glow/tło: ograniczamy pseudo‑element `body::before` do szerokości viewportu (np. `inset: -20% 0 auto 0`).

3) Topbar i ciasne układy (flex)

- Zmniejsz padding poziomy na xs (np. `px-4 md:px-6`).
- Główny obszar wyszukiwarki: `flex-1 basis-0 min-w-0` — może się realnie ścisnąć.
- Prawa grupa przycisków: `flex-shrink-0`.
- Na bardzo małych ekranach preferuj ikonę zamiast tekstu (np. "Wyloguj" → ikona) lub przenieś część akcji do menu.

4) Sekcje hero z overlayem

- Na kontenerze sekcji dodaj `overflow-x-hidden` (chroni przed wystającym radialnym tłem/box-shadow).
- Nagłówek + kontrolki: na mobile `flex-col` i `flex-wrap`, na md+ `flex-row`.

5) Paginations / toolbary

- Dodaj `flex-wrap` i nie zakładaj, że wszystkie guziki zmieszczą się w jednym rzędzie.
- Tam, gdzie to możliwe, używaj krótszych etykiet lub przenieś część akcji do menu overflow.

6) Diagnostyka overflow

- W DevTools włącz outline scrollable areas i testuj na 390×844.
- Szukaj: `w-screen`, duże `min-w-*`, absolutnych overlay/gradientów bez clipa, długich tekstów bez łamania.
- Szybkie obejście: tymczasowo dodaj `outline:1px solid red` do podejrzanego kontenera.

7) Smoke test (DoD – mobile)

- [ ] Na 390×844 brak poziomego scrolla i brak ucięć nagłówka.
- [ ] Toolbary/paginacje zawijają się estetycznie.
- [ ] Topbar mieści się bez maskowania (bez `overflow-x-clip`).

## 2025-10-02 – Full‑width mobile + zero‑warnings (NOWE)

- Mobile full‑width: wszystkie główne widoki mają edge‑to‑edge na xs.
  - Globalnie: `<main>` w `app/layout.tsx` używa `px-0 md:px-6`.
  - Kontenery stron na mobile: `max-w-none p-0` (od md `md:max-w-… md:p-6`).
  - Dotyczy: Klienci (lista/szczegóły/nowy/edycja), Zlecenia (lista/szczegóły/nowy montaż), Montaże, Dostawy.
- Lint: polityka „zero warnings” jest wymuszana w pre-push; unikamy `any` i poprawiamy `prefer-const`/unused vars.
- Pamiętaj: po zmianach w `src/` dodaj 1‑linijkowy wpis do `systemInfoPoints` z dzisiejszą datą, inaczej `npm run check:iteration` zablokuje push.

## KeyValueRow – wiersz etykieta/wartość (NOWE)

Cel: spójny układ label/value w całej aplikacji oraz brak overflow na mobile.

- Komponent: `src/components/ui/key-value-row.tsx`
  - `KeyValueRow` – wrapper na wiersz: `flex items-center gap-3`.
    - Label: `opacity-60 shrink-0 basis-24`.
    - Value: `min-w-0 max-w-full flex items-center gap-2` (pozwala się ścisnąć i zawijać).
  - `BreakableText` – `span` z `break-words break-all` do długich ciągów.
- Zasady użycia:
  - Unikaj `justify-between` dla label/value – użyj `KeyValueRow` z `basis-24` dla etykiety.
  - Dla tekstów/linków, które mogą być długie (email, adres, source): owiń w `BreakableText`.
  - Wartość może zawierać przyciski (np. kopiuj) – dodawaj je jako dzieci `KeyValueRow` po tekście.
- Migracja: nowe/edytowane widoki powinny używać `KeyValueRow` zamiast ręcznego zestawu klas.

## Clickable rows/cards – nawigacja po kliknięciu (NOWE)

Cel: spójne UX „kliknij gdziekolwiek, żeby wejść w szczegóły” zarówno na listach desktopowych (wiersze tabeli), jak i na kartach mobilnych.

- Komponent: `src/components/clickable-card.client.tsx`
  - Służy do opakowania „karty” na stronach serwerowych (App Router). Zapewnia a11y (role=link, tabIndex=0, Enter/Spacja) i bezpieczną nawigację.
  - Wbudowana ochrona przed przechwyceniem kliknięć na elementach interaktywnych (A, BUTTON, INPUT, SELECT, TEXTAREA oraz `[role=button|link]`).
  - Można oznaczyć dowolny element `data-no-row-nav` aby wyłączyć nawigację z wiersza/karty dla jego poddrzewa.

- Tabele (desktop):
  - Jeżeli tabela jest komponentem klienckim (np. `OrdersTable`), dodaj `role="link" tabIndex=0 onClick onKeyDown` na `<tr>` i użyj tej samej funkcji strażnika co w `ClickableCard` (przerywaj traversal na `currentTarget`).
  - Nie rób handlerów w Server Components – zamiast tego deleguj do komponentu klientowego lub użyj `ClickableCard` gdzie to możliwe.

- Karty (mobile):
  - Na stronach serwerowych opakuj korzeń karty w `<ClickableCard href=...>` i pozostaw wewnętrzne `<Link>`/przyciski bez zmian – strażnik zadba o brak konfliktu.

- A11y i styl:
  - Root ma `cursor-pointer` + `focus-visible:ring-2 ring-[var(--pp-primary)]`.
  - Klawiatura: Enter/Spacja aktywują nawigację.

- Konwencja URL: dla zleceń używamy przyjaznych adresów z sufiksem typu, jeśli dostępny:
  - `/zlecenia/nr/${orderNo}_m` dla montaży, `/zlecenia/nr/${orderNo}_d` dla dostaw; fallback: `/zlecenia/${id}`.

- Testowanie (smoke):
  - Kliknięcie w tło wiersza/karty na desktop/mobile przenosi do szczegółów.
  - Kliknięcia w linki/przyciski wewnątrz NIE wywołują nawigacji z wiersza/karty.
  - Enter/Spacja na fokusowanym wierszu/kartcie działa.

## Rozdział typów: Montaż i Dostawa (NOWE)

Decyzja architektoniczna: nie używamy więcej ogólnego pojęcia „Zlecenia” w UI. Zamiast tego istnieją dwa odseparowane byty i widoki: „Montaż” oraz „Dostawa”.

- Trasy list i szczegółów:
  - Lista montaży: `/montaz`
  - Lista dostaw: `/dostawa`
  - Szczegóły (friendly): `/montaz/nr/[ORDERNO]_m`, `/dostawa/nr/[ORDERNO]_d`
  - Fallback po id: `/montaz/[id]`, `/dostawa/[id]`
  - Redirecty: stare `/zlecenia/...` przekierowujemy 301 do odpowiednich ścieżek (bez SEO – aplikacja prywatna; chodzi o zgodność linków).
- Nawigacja: w sidebarze osobne pozycje „Montaż” i „Dostawa”. Widok łączony „Zlecenia” nie wraca.
- Numeracja: zachowujemy istniejący format z sufiksem `_m` / `_d` w friendly URL i etykietach.
- RBAC: montażysta ma dostęp tylko do `/montaz` (swoje przypisane); brak dostępu do `/dostawa`.
- UI: każdy widok pokazuje wyłącznie własne pola (checklista/etapy, sekcje, akcje). Brak „ukrywania” rozumianego jako maskowanie – po prostu selekcja danych per typ.
- Przyszłość: „dostawy pod montaż” będą częścią widoku Montaż (osobna sekcja i model), nie osobnym „Zleceniem dostawy”.

W konsekwencji należy zaktualizować linki wewnętrzne, breadcrumbsy i dokumentację, a także dodać redirecty w App Router.

## Długie URL-e w tabelach (NOWE)

- Mobile (xs–sm): pokazuj pełny adres z klasami `break-all break-words` i mniejszym fontem (`text-xs`), dzięki czemu zawartość nie wymusza przewijania poziomego.
- Desktop (md+): zamiast pełnego adresu renderuj krótki, niebieski anchor „LINK” (lub ikonę łańcucha) z `href` i `title` zawierającym pełny URL.
  - Styl: `text-blue-600 hover:underline font-medium` (dark mode: `dark:text-blue-400`).
  - Kolumna z linkiem powinna mieć ograniczenie szerokości (`max-w-[220px]`, `truncate` jeżeli tekst występuje) lub po prostu sam anchor bez tekstu URL.
  - Tooltip `title` zapewnia dostęp do pełnego adresu na hover; na mobile pełny adres pozostaje widoczny.
  - Upewnij się, że komórka/wiersz ma `min-w-0`, a długie treści w innych kolumnach mogą się zawijać (`whitespace-normal`).

### Specjalne stany kolumny „Wygasa za” (historia linków)

- Portal klienta: posiada TTL (domyślnie 90 dni). W UI pokazujemy `X d (do YYYY-MM-DD)`; jeśli brak `expiresAt` (legacy), pokazujemy `—`.
- Onboarding i inne czasowe: `X d` lub `—` przy braku danych.

Admin API (portal): `POST /api/public/klient/portal/[clientId]?days=90` tworzy/rotuje link z podanym TTL (1..365 dni, domyślnie 90). Odpowiedź zawiera `expiresAt` (ms).

