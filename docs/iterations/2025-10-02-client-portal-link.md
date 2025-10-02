# 2025-10-02 – Jednolity link klienta: Onboarding (90d) → Portal

Zakres:
- Ustalenie strategii jednego linku klienta, który zaczyna jako onboarding (90 dni ważności), a następnie staje się linkiem do portalu klienta (lista zleceń + statusy).
- Brak zmian w kodzie – dokumentacja decyzji i plan wdrożenia.

Powód:
- Spójne doświadczenie klienta, mniejsza liczba różnych linków i punktów wejścia.
- Lepsza kontrola bezpieczeństwa (rotacja/revoke linku portalu) i audyt (eventy domenowe).

Model danych:
- `client_invites` (istniejąca): `purpose = 'onboarding' | 'portal' | 'order_preview'`, `clientId`, `allowEdit`, `createdAt`, `expiresAt`, `usedAt`, `status`.
- (Faza 2, opcjonalnie) `client_portal_links`: stabilny `portalId` dla ścieżki `/public/k/[portalId]` + magic-link.

Trasy publiczne:
- Onboarding: `/public/klienci/[token]` (90 dni). API: `/api/public/klienci/[token]` (GET/POST).
- Portal: `/public/klient/[token]` (długowieczny, rotowalny). W przyszłości `/public/k/[portalId]` + magic-link.

Eventy domenowe (do wdrożenia):
- `client.onboarding.started`, `client.onboarding.completed`
- `client.portal.link.created`, `client.portal.link.revoked`, `client.portal.link.rotated`
- `client.portal.accessed`

Fazy wdrożenia:
1) Faza 1 (lekka):
   - TTL 90 dni dla onboardingu (expiresAt), po użyciu `usedAt=now`.
   - Po onboardingu automatycznie tworzymy invite `portal` (bez `expiresAt`).
   - Admin: rotacja/revoke linku portalu w szczegółach klienta.
2) Faza 2 (stabilny portalId):
   - Dodanie `client_portal_links` i przejście na `/public/k/[portalId]` + magic-link.
3) Faza 3: rozbudowa portalu (dokumenty, timeline, powiadomienia).

Smoke test (po implementacji):
1. Generacja linku onboarding: GET/POST działa; link wygasa po symulacji czasu.
2. Wypełnienie onboardingu: powstaje klient + generuje się link portalu.
3. Wejście w portal: widać dane klienta i jego zlecenia; rotacja linku blokuje stary.
