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

## Tipy

- Najnowsze wpisy dopisuj na końcu (konsekwencja obecnego skryptu – patrzy na kolejność; ewentualnie można przełączyć na sort malejący później).
- Jeśli zmiana to tylko kosmetyczny styl/ESLint → można pominąć plik iteracji, ale wpis 1-liniowy nadal preferowany (TAG `[UWAGA]` / `[TODO]`).

---

Ten dokument ma być krótki i praktyczny – dopisuj kolejne sekcje, gdy pojawią się nowe automatyzacje lub zasady.

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
