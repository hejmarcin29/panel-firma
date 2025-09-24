# 2025-09-24 – Event Store diff (client.updated changes[])

Zakres:
- Dodano szczegółowy diff dla `client.updated` (payload.changes[]: field, before, after) + `schemaVersion=2`.

Powód:
- Redukcja szumu (wcześniej wszystkie pola jako changedFields, nawet bez realnej zmiany) i lepsza diagnoza.

Pliki:
- `src/app/api/klienci/[id]/route.ts` – obliczanie różnic poprzedni→nowy.
- `src/domain/events.ts` – rozszerzenie schematu payload o `changes`.
- `src/components/system-status-info.tsx` – wizualizacja diff (before → after, ∅ dla null/empty).
- `src/i18n/pl.ts` – wpis w systemInfoPoints.

Ryzyka / Uwagi:
- Minimalny wzrost rozmiaru payloadu.
- W przyszłości można wprowadzić mapowanie przyjaznych nazw pól.

TODO (planowane):
- [ ] Etykiety PL dla pól w diffie.
- [ ] Eventy logowania (user.login.success / failed).
- [ ] Outbox + status dostarczenia.

Smoke test:
1. Edycja klienta (zmiana tylko email) → Event store pokazuje pojedynczy diff w changes[].
2. Brak zmiany (submit bez modyfikacji) → brak nowego eventu.

Decyzja utrwalona także w `systemInfoPoints`.
