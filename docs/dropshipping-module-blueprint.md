# Dropshipping Module Blueprint

## 1. End-to-End Workflow and Statuses

### 1.1 Core Order Lifecyle
| Sequence | Status Code | Label | Trigger & Actors | System Actions | Outgoing Notifications |
| --- | --- | --- | --- | --- | --- |
| 01 | `order.received` | Zamówienie przyjęte | Import z WooCommerce API / ręczne dodanie operatora | Tworzenie zamówienia, numer wewnętrzny, mapowanie pozycji | E-mail do operatora: nowe zamówienie (opcjonalnie do klienta potwierdzenie)|
| 02 | `order.pending_proforma` | Przygotowanie proformy | Operator rozpoczyna proces; zamówienie kompletne | Generowanie draftu proformy, weryfikacja danych klienta | Brak (ew. powiadomienie wewnętrzne)|
| 03 | `order.proforma_issued` | Proforma wystawiona | Klik "Wystaw proformę" → API wfirma | Zapis ID dokumentu, numer, PDF; link w panelu | E-mail do klienta z proformą + instrukcje płatności |
| 04 | `order.awaiting_payment` | Oczekiwanie na płatność | Automatycznie po 03 | Monitorowanie płatności (Alior API), ustawienie deadline | Automatyczne przypomnienie po X dniach |
| 05 | `order.paid` | Opłacone | Alior API match przelewu / ręczne potwierdzenie | Zapis identyfikatora transakcji, kwoty, daty | E-mail do klienta: potwierdzenie płatności |
| 06 | `order.advance_invoice` | FV zaliczkowa wystawiona | Operator zatwierdza wystawienie w panelu | API wfirma wystawia FV zaliczkową (często 100%); zapis ID, PDF | Kopia e-mail do klienta (ew. BCC księgowość) |
| 07 | `order.forwarded_to_supplier` | Zamówienie przekazane hurtowni | Operator używa akcji "Wyślij do hurtowni" | Generowanie szczegółów zamówienia, wysyłka e-mail do hurtowni | E-mail do hurtowni + do klienta status "W realizacji" |
| 08 | `order.fulfillment_confirmed` | Wysyłka potwierdzona | Hurtownia odpisuje (ręcznie) / link potwierdzający / import pliku | Aktualizacja numeru przesyłki, przewoźnik, data wysyłki | E-mail do klienta z numerem śledzenia |
| 09 | `order.final_invoice` | Faktura końcowa wystawiona | Operator zatwierdza po otrzymaniu potwierdzenia wysyłki | API wfirma: faktura końcowa, rozliczenie zaliczki | E-mail do klienta z finalną FV |
| 10 | `order.closed` | Zamówienie zamknięte | Automatycznie po 09 + zakończone wysyłki | Archiwizacja, raporty | Brak (opcjonalny e-mail z prośbą o opinię) |

### 1.2 Dokumenty i Ich Statusy
- `proforma`: `draft`, `issued`, `cancelled`
- `advance_invoice`: `issued`, `voided`
- `final_invoice`: `issued`, `corrected`

Każdy dokument przechowuje: ID z wfirma, numer, kwoty netto/brutto, walutę, datę wystawienia, link do PDF.

### 1.3 Płatności (Alior)
- Matchowanie na podstawie numeru proformy w tytule przelewu lub kwoty + NIP.
- Statusy płatności: `pending`, `matched`, `mismatch`, `refunded`.
- Retry mechanizm: odświeżenie wyciągu co 15 min; konflikty trafiają na listę zadań operatora.

### 1.4 Notyfikacje e-mail
- Powiadomienia klienta: przyjęcie zamówienia, proforma, potwierdzenie płatności, przekazanie do realizacji, wysyłka, faktura końcowa.
- Powiadomienia hurtowni: nowe zamówienie (z danymi klienta do wysyłki, dane fakturowe twojej firmy).
- Powiadomienia operatora: błędy integracji, brak matchu płatności, przekroczone SLA.
- Każdy szablon przechowywany z wersją i możliwością edycji (HTML + placeholdery).

## 2. Integracje i Kontrakty Danych

### 2.1 WooCommerce / WordPress
- **Wejście**: webhook `order.created`, `order.updated`; fallback cron co 15 min.
- **Pobierane pola**: order_id, status, totals, currency, customer (nazwa, e-mail, telefon, adres), pozycje (SKU, ilość, cena), metody płatności, notatki klienta.
- **Mapowanie**: do encji `Order` + `OrderItem`.
- **Ręczne dodawanie**: formularz w panelu odwzorowuje te same pola.

### 2.2 wfirma
- **Endpointy**: tworzenie proformy, faktury zaliczkowej, faktury końcowej, pobieranie dokumentu PDF.
- **Autoryzacja**: OAuth2 + token odświeżania, przechowywany szyfrowany.
- **Dane wysyłane**: dane kontrahenta, produkty z zamówienia, numer zamówienia jako opis, terminy płatności.
- **Odpowiedź**: ID dokumentu, numer, link do PDF.
- **Retry**: exponential backoff, log błędów.

### 2.3 Alior Bank API
- **Zakres**: pobranie historii transakcji, webhook dla nowych operacji.
- **Polityka danych**: przechowujemy wyłącznie niezbędne pola (data, kwota, tytuł, nadawca, numer rachunku).
- **Matchowanie**: heurystyka + ręczne przypisanie przez operatora w widoku płatności.

### 2.4 E-mail (SMTP / provider transakcyjny)
- **Szablony**: Markdown/HTML przechowywany w bazie, rendering server-side.
- **Logi**: status wysyłki, ID wiadomości, timestamp, adresaci.
- **Integracja**: provider z API (np. MailerSend) lub własny SMTP.

### 2.5 Hurtownia
- **Wyjście**: e-mail + załącznik PDF/CSV, w przyszłości API.
- **Wymagane pola**: dane klienta, adres wysyłki, numer telefonu, lista produktów (SKU, ilość), uwagi.
- **Zwrotnie**: numer przesyłki, przewoźnik, status wysyłki (ręczne wprowadzenie lub link potwierdzający).

## 3. Data Model Draft (Drizzle)

### 3.1 Encje Główne
- `orders`
  - `id` (UUID), `source` ("woocommerce", "manual"), `source_order_id`, `status`, `customer_id`, `total_net`, `total_gross`, `currency`, `created_at`, `expected_ship_date`.
- `order_items`
  - `id`, `order_id`, `sku`, `name`, `quantity`, `unit_price`, `tax_rate`.
- `customers`
  - `id`, `name`, `email`, `phone`, `billing_address`, `shipping_address`, `tax_id`.

### 3.2 Dokumenty
- `documents`
  - `id`, `order_id`, `type` ("proforma", "advance_invoice", "final_invoice"), `status`, `wfirma_id`, `number`, `issue_date`, `pdf_url`, `gross_amount`.
- `document_events`
  - log zmian statusu, timestamp, user_id.

### 3.3 Płatności
- `payments`
  - `id`, `order_id`, `status`, `amount`, `currency`, `payment_date`, `bank_operation_id`, `raw_reference`.
- `payment_matches`
  - `payment_id`, `confidence_score`, `matched_by` ("auto", "manual"), `notes`.

### 3.4 Fulfillment & Hurtownia
- `supplier_requests`
  - `id`, `order_id`, `status`, `sent_at`, `response_received_at`, `carrier`, `tracking_number`.
- `supplier_messages`
  - log komunikacji (wysłane/odebrane e-maile, notatki telefoniczne).

### 3.5 Notyfikacje i Logi
- `notifications`
  - `id`, `order_id`, `channel`, `template_code`, `recipient`, `status`, `sent_at`, `provider_message_id`.
- `integration_logs`
  - `id`, `integration` ("woocommerce", "wfirma", "alior", "email"), `level`, `message`, `meta`, `created_at`.

## 4. UX Outline

### 4.1 Dashboard
- Karty KPI: liczba zamówień w pipeline, wartość brutto, zamówienia wymagające akcji (płatność, dokument, wysyłka).
- Sekcja "Następne zadania": lista skrócona z przyciskami akcji (np. "Wystaw proformę").
- Wykres: trend sprzedaży (ostatnie 30 dni) + wykres statusów.

### 4.2 Lista Zamówień
- Widok tabelaryczny z kolumnami: numer, klient, status, kwoty, data, dokumenty (ikony), płatność (badge), hurtownia (badge).
- Filtrowanie po statusie, dacie, źródle, operatorze.
- Quick actions w wierszu (ikony) dla typowych przejść statusowych.

### 4.3 Szczegóły Zamówienia
- Layout dzielony: lewa kolumna timeline statusów (ikony + daty + wykonawca), prawa kolumna z kartami informacji.
- Sekcje: dane klienta, płatności, dokumenty (lista z linkami PDF), komunikacja (log e-mail), notatki.
- Panel akcji: przycisk "Wystaw proformę", "Potwierdź płatność", "Wyślij do hurtowni". Każdy przycisk otwiera modal z potwierdzeniem i szczegółami.
- Tab "Historia": log integracji i ręcznych akcji z możliwością filtrowania.

### 4.4 Kolejka Zadań (Task Queue)
- Widoczna z dowolnego miejsca (np. badge w navbarze).
- Segmentacja według typu zadania: płatność do potwierdzenia, dokument do wystawienia, błąd integracji.
- Każde zadanie łączy się z konkretnym zamówieniem i sugeruje następną akcję.

### 4.5 Konfiguracja Integracji
- Zakładki: WooCommerce, wfirma, Alior, E-mail.
- Formularze z polami API key/token, test połączenia, log ostatnich błędów.
- Wspólna sekcja harmonogramów (np. częstotliwość synchronizacji).

### 4.6 Wzorce UI (shadcn/ui)
- `Card`, `Tabs`, `Badge` dla statusów, `Table`, `Timeline` (bazowany na listach + ikonach), `Dialog` dla akcji, `Toaster` dla feedbacku.
- Kolorystyka: neutralne tło, akcent firmowy dla akcji głównych, statusy mapowane na kolory (np. proforma → amber, płatność → green, wysyłka → blue).
- Obowiązkowe stany ładowania i błędów (skeleton dla listy zamówień, toasty z błędami integracji).

## 5. Backlog i Następne Kroki
1. Validacja workflow z biznesem (czy sekwencja i notyfikacje są kompletne?).
2. Review i akceptacja kontraktów API oraz modelu danych (sekcje 6 i 7).
3. Przygotowanie makiet niskiej wierności na podstawie outline (Figma lub inny tool).
4. Definicja modułu powiadomień (szablony, logika wysyłek, fallback).
5. Zaplanowanie implementacji MVP (iteracje, kryteria ukończenia).

## 6. Kontrakty API (Drafty JSON)

### 6.1 WooCommerce → Panel (Webhook `order.created`)
```json
{
  "id": 13452,
  "number": "WC-2024-00045",
  "status": "processing",
  "currency": "PLN",
  "total": "1299.00",
  "payment_method": "przelew_bankowy",
  "date_created_gmt": "2024-05-21T09:14:00",
  "billing": {
    "first_name": "Jan",
    "last_name": "Kowalski",
    "company": "",
    "email": "jan@example.com",
    "phone": "+48500500500",
    "address_1": "ul. Kwiatowa 10",
    "city": "Warszawa",
    "postcode": "00-001",
    "country": "PL",
    "vat_number": "5213456789"
  },
  "shipping": {
    "first_name": "Jan",
    "last_name": "Kowalski",
    "address_1": "ul. Kwiatowa 10",
    "city": "Warszawa",
    "postcode": "00-001",
    "country": "PL"
  },
  "line_items": [
    {
      "id": 341,
      "sku": "SKU-123",
      "name": "Zestaw startowy",
      "quantity": 1,
      "price": "1299.00",
      "subtotal": "1299.00",
      "total": "1299.00",
      "taxes": [
        { "rate_id": 1, "total": "243.81" }
      ]
    }
  ],
  "meta_data": [
    { "key": "customer_note", "value": "Proszę o kontakt przed wysyłką" }
  ]
}
```

- Walidacja: webhook podpisany secret key, retry policy (WooCommerce 5 prób).
- Transformacja: mapowanie `billing`/`shipping` na osobne pola + wyprowadzenie `tax_id`.

### 6.2 Panel → wfirma (Proforma `POST /invoices/proforma`)
```json
{
  "invoice": {
    "kind": "proforma",
    "issue_date": "2024-05-21",
    "payment_date": "2024-05-24",
    "payment_kind": "transfer",
    "client_id": 9981,
    "client": {
      "name": "Jan Kowalski",
      "tax_id": "5213456789",
      "street": "ul. Kwiatowa 10",
      "city": "Warszawa",
      "postal": "00-001",
      "country": "PL"
    },
    "description": "Zamówienie DROPS-2024-00021",
    "items": [
      {
        "name": "Zestaw startowy",
        "quantity": 1,
        "unit": "szt",
        "price_net": 1055.19,
        "tax": 23,
        "price_gross": 1299.00
      }
    ],
    "total": 1299.00,
    "currency": "PLN"
  }
}
```

- Odpowiedź (200):
```json
{
  "invoice": {
    "id": 561231,
    "fullnumber": "PF/05/2024/213",
    "url": "https://app.wfirma.pl/documents/561231.pdf"
  }
}
```
- Błędy (4xx/5xx) logowane w `integration_logs` z payloadem (bez danych wrażliwych).

### 6.3 wfirma → Panel (Webhooks dokumentów)
- Event `document.issued` → uzupełnienie statusu dokumentu oraz numeru.
- Payload minimalny:
```json
{
  "event": "document.issued",
  "document_id": 561231,
  "document_type": "proforma",
  "fullnumber": "PF/05/2024/213",
  "issue_date": "2024-05-21"
}
```

### 6.4 Alior Bank → Panel (Webhook nowej płatności)
```json
{
  "transaction": {
    "id": "TX-998123",
    "booking_date": "2024-05-21T13:02:00",
    "amount": 1299.00,
    "currency": "PLN",
    "counterparty_name": "Jan Kowalski",
    "counterparty_account": "PL61109010140000071219812874",
    "description": "PF/05/2024/213",
    "bank_reference": "1299/05/2024"
  }
}
```
- Reguły matchingu: regex wyłapujący numer proformy, fallback na wysokość kwoty ±1 PLN i dopasowanie klienta.
- Jeśli brak matchu: zadanie `payment.mismatch` w kolejce.

### 6.5 Panel → Hurtownia (E-mail + Załącznik JSON)
```json
{
  "order_id": "DROPS-2024-00021",
  "customer": {
    "name": "Jan Kowalski",
    "phone": "+48500500500",
    "email": "jan@example.com"
  },
  "shipping_address": {
    "street": "ul. Kwiatowa 10",
    "city": "Warszawa",
    "postal": "00-001",
    "country": "PL"
  },
  "items": [
    { "sku": "SKU-123", "name": "Zestaw startowy", "quantity": 1 }
  ],
  "remarks": "Proszę dorzucić instrukcję PDF"
}
```
- W treści e-maila streszczenie + link do panelu.
- Odbiór informacji zwrotnej przez link `POST /supplier-confirmation` (manualnie wprowadzany przez operatora dziś, później API).

## 7. Model Danych (Szczegóły)

### 7.1 Tabele i Klucze
- `orders`
  - PK: `id`
  - FK: `customer_id` → `customers.id`
  - Indeksy: `orders_status_idx` (status), `orders_source_idx` (source, source_order_id), `orders_created_at_idx` (created_at DESC).
- `order_items`
  - PK: `id`
  - FK: `order_id` → `orders.id`
  - Indeksy: `order_items_order_id_idx`.
- `customers`
  - PK: `id`
  - Unikalne: `email`, `tax_id` (NULLable, unikalność warunkowa).
- `documents`
  - PK: `id`
  - FK: `order_id`
  - Indeksy: `documents_type_idx`, `documents_wfirma_id_key` (unique), `documents_status_idx`.
- `document_events`
  - PK: `id`
  - FK: `document_id`
  - Indeksy: `document_events_document_id_idx`.
- `payments`
  - PK: `id`
  - FK: `order_id`
  - Unikalne: `bank_operation_id`
  - Indeksy: `payments_status_idx`, `payments_payment_date_idx`.
- `payment_matches`
  - PK: `id`
  - FK: `payment_id`
- `supplier_requests`
  - PK: `id`
  - FK: `order_id`
  - Indeksy: `supplier_requests_status_idx`.
- `supplier_messages`
  - PK: `id`
  - FK: `supplier_request_id`
- `notifications`
  - PK: `id`
  - Indeksy: `notifications_order_id_idx`, `notifications_template_code_idx`.
- `integration_logs`
  - PK: `id`
  - Indeksy: `integration_logs_integration_idx`, `integration_logs_created_at_idx`.

### 7.2 Kolumny (Typy i Opisy)
- `orders.status`: enum (`order.received` → `order.closed`).
- `orders.expected_ship_date`: nullable, wyliczane na podstawie SLA hurtowni.
- `order_items.tax_rate`: procent przechowywany jako DECIMAL(5,2).
- `documents.type`: enum (`proforma`, `advance_invoice`, `final_invoice`).
- `documents.pdf_url`: przechowywane jako signed URL (czasowe) lub ścieżka do storage (gdy kopiujemy PDF).
- `payments.status`: enum (`pending`, `matched`, `mismatch`, `refunded`).
- `payments.amount`: DECIMAL(12,2), waluta przechowywana w `payments.currency` (domyślnie PLN).
- `supplier_requests.status`: enum (`generated`, `sent`, `acknowledged`, `fulfilled`, `cancelled`).
- `notifications.status`: enum (`pending`, `sent`, `failed`).
- `integration_logs.meta`: JSON (przechowuje kontekst request/response bez danych wrażliwych).

### 7.3 Relacje i Cascades
- Usunięcie zamówienia (soft delete w przyszłości) → kaskadowe usunięcie `order_items`, `documents`, `payments`, `supplier_requests`, `notifications`.
- `document_events` i `supplier_messages` przechowują `actor_id` (user lub system) z powiązaniem do tabeli `users` (dodamy przy wdrożeniu auth).
- `payment_matches` powiązane 1:1 z `payments` (opcjonalne) dla przechowywania heurystyki.

### 7.4 Migracja Startowa (Plan)
1. Utworzenie wszystkich tabel głównych z polami podstawowymi.
2. Dodanie tabel logów (`integration_logs`, `notifications`).
3. Wprowadzenie enumów jako TypeScript union + helper w Drizzle.
4. Przygotowanie seedów: statusy, szablony e-mail (placeholder), przykładowe integracje testowe.

