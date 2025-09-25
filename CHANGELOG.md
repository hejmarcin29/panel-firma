# Changelog

Format inspirowany "Keep a Changelog". Daty w UTC.

## [Unreleased]
- (dodawaj nowe wpisy tutaj przed wydaniem)

## 2025-09-24
### Added
- Event Store: tabela `domain_events`, emisja `client.created|updated|deleted`, `client.note.added`.
- Szczegółowy diff `changes[]` dla `client.updated` (schemaVersion=2).
### Changed
- Dialog Event Store pokazuje realne dane + diff.
### Documentation
- `systemInfoPoints` wpisy dla wdrożenia Event Store i diffu.
- Pliki: `docs/iterations/2025-09-24-event-store-diff.md`, `docs/adr/ADR-0001-event-store-strategy.md`.
ff