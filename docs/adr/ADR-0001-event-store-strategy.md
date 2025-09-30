# ADR-0001 Event Store Strategy

Date: 2025-09-24

## Context

Potrzeba śledzenia zmian domeny (audyt, przyszłe automatyzacje, integracje) w lekki sposób w lokalnym środowisku (SQLite), z możliwością ewolucji do bardziej złożonej architektury (outbox + worker + integracje zewnętrzne).

## Decision

Używamy tabeli relacyjnej `domain_events` (Drizzle + SQLite) z kolumnami meta (type, occurredAt, actor, entityType, entityId, payload JSON, schemaVersion). Emisja poprzez helper `emitDomainEvent` z walidacją Zod. Na razie: synchrony insert. UI (Event store dialog) odczytuje bezpośrednio ostatnie wpisy. Schemat payloadu wersjonowany `schemaVersion`.

## Status

Accepted.

## Alternatives Considered

- Natychmiastowe wprowadzenie brokera (Kafka / NATS) – zbyt ciężkie w obecnym scope lokalnego panelu.
- Logi tekstowe / console – brak struktury i trudne do raportowania.
- Bez eventów (tylko tabele domenowe) – utrudnia późniejsze automatyzacje i audyt historyczny.

## Consequences

- Strukturalny audyt i fundament pod automatyzacje.
- Prosty start (brak dodatkowych usług).

* Wymaga później implementacji outbox/worker do niezawodnej dostawy na zewnątrz.
* Potencjalny wzrost rozmiaru DB (konieczny cleanup / archiwizacja w przyszłości).

## Follow-up / Next Steps

- Dodać outbox status delivery (pending, delivered, failed).
- Emisja eventów logowania użytkowników.
- Panel filtrów i wyszukiwania eventów.
- Integracja z mechanizmem reguł / automatyzacji.
