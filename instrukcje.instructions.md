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

## Tipy
- Najnowsze wpisy dopisuj na końcu (konsekwencja obecnego skryptu – patrzy na kolejność; ewentualnie można przełączyć na sort malejący później).
- Jeśli zmiana to tylko kosmetyczny styl/ESLint → można pominąć plik iteracji, ale wpis 1-liniowy nadal preferowany (TAG `[UWAGA]` / `[TODO]`).

---
Ten dokument ma być krótki i praktyczny – dopisuj kolejne sekcje, gdy pojawią się nowe automatyzacje lub zasady.
