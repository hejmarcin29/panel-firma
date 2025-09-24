# Iteration Logs

Każda istotna iteracja (feature, refactor architektoniczny, migracja danych) powinna mieć:
1. Wpis (1 linia) w `systemInfoPoints` (`src/i18n/pl.ts`).
2. Plik w `docs/iterations/YYYY-MM-DD-<slug>.md` jeśli wymaga dodatkowego kontekstu (zakres, powód, pliki, ryzyka, TODO, smoke test).
3. (Opcjonalnie) ADR w `docs/adr/` jeżeli to decyzja długoterminowa.
4. Aktualizację `CHANGELOG.md` (sekcja daty). Jeśli brak merytorycznej zmiany – w PR napisać: "Brak wpisu do changelog (no-op)".

Minimalny szablon pliku iteracji:
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

Definition of Done (rozszerzenie): brak wpisu = uwaga w review.
