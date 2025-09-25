# Changelog

Format inspirowany "Keep a Changelog". Daty w UTC.

## [Unreleased]
- (dodawaj nowe wpisy tutaj przed wydaniem)

## 2025-09-25
### Changed
- Numeracja klient/zlecenie: dodano `clientNo` (od 10) oraz `orderNo` w formacie `<clientNo>_<seq>` (np. `10_1`).
- Przyjazne URL-e: `/klienci/nr/[clientNo]` oraz `/zlecenia/nr/[orderNo]` (z przekierowaniem do kanonicznych widoków). Dodatkowo `/zlecenia/nr/[orderNo]` akceptuje sufiks typu: `_m` (montaż) lub `_d` (dostawa); wyszukiwanie ignoruje sufiks.
### UI
- Widok klienta: „Nr klienta”, „Nr zlecenia” na kartach, przełącznik „Aktywne | Archiwum”. „Nr zlecenia” pokazuje sufiks `_m/_d` w zależności od typu.
- Dashboard: etykiety typu (Montaż/Dostawa) na listach, linkowanie po `orderNo` gdy dostępne; linki i widoczne numery mają sufiks `_m/_d`.
- Archiwum zleceń: w kolumnie ID wyświetlany `orderNo` (jeśli jest) obok skrótu UUID, z sufiksem `_m/_d`.

## 2025-09-24
### Added
- Event Store: tabela `domain_events`, emisja `client.created|updated|deleted`, `client.note.added`.
- Szczegółowy diff `changes[]` dla `client.updated` (schemaVersion=2).
### Changed
- Dialog Event Store pokazuje realne dane + diff.
### Documentation
- `systemInfoPoints` wpisy dla wdrożenia Event Store i diffu.
- Pliki: `docs/iterations/2025-09-24-event-store-diff.md`, `docs/adr/ADR-0001-event-store-strategy.md`.
