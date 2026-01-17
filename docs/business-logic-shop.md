# Moduł Sklep (Store) - Specyfikacja Biznesowa

## 1. Architektura i Dostęp
*   **Endpoint:** `/sklep` (dostępny publicznie lub przez link referencyjny).
*   **Brak Logowania:** Model "Gość" (Guest Checkout).
*   **Identyfikacja:** Mechanizm **"Find or Create"**. Przy checkoucie system sprawdza klienta po e-mailu.
    *   Istnieje? -> Podpina zamówienie do historii.
    *   Nie istnieje? -> Tworzy nowego klienta w `customers`.

## 2. Struktura Oferty (Frontend)
Interfejs podzielony na 3 główne filary (Tabs):

### A. PRÓBKI (Zakup Błyskawiczny)
*   **Asortyment:** Produkty posiadające flagę `is_sample_available = true`.
*   **Cena:** Zryczałtowana (globalna cena za sztukę + globalny koszt wysyłki zdefiniowane w Ustawieniach).
*   **Proces:** Koszyk -> Checkout -> Płatność natychmiastowa.
*   **Płatność:** Wyłącznie **Tpay** (BLIK/Przelew online).
*   **Status:** Po płatności wpada jako `OPŁACONE`.

### B. PANELE (Oferta Inwestycyjna)
*   **Asortyment:** Produkty posiadające flagę `is_shop_visible = true`.
*   **Jednostki:**
    *   Klient wprowadza ilość w **$m^2$**.
    *   System przelicza na pełne opakowania (używając atrybutu `package_size_m2`).
    *   System zaokrągla w górę (Ceiling).
    *   Koszyk wyświetla: *"X paczek (Y.YY m2)"*.
*   **Proces:** Koszyk -> Checkout -> Wybór dostawy.
*   **Płatność:** Wyłącznie **Przelew Tradycyjny (Proforma)**.
*   **Status:** Wpada jako `OCZEKUJE_NA_PROFORME` (`pending_proforma`).

### C. USTAWIENIA (Strefa Klienta)
Formularz umożliwiający klientowi (posiadaczowi linku) edycję swoich danych w systemie CRM.
*   **Dane rozliczeniowe:** Edycja NIP, Nazwy Firmy, Adresu (zmiana nadpisuje rekord klienta).
*   **Adresy dostawy:** Zarządzanie listą adresów wysyłki.

## 3. Panel Admina - Konfiguracja

### A. Ustawienia -> Integracje (Techniczne)
*   Klucze API Tpay (Client ID, Secret).
*   Tryb Sandbox (Włącz/Wyłącz).

### B. Ustawienia -> Sklep (Biznesowe)
*   **Globalne sterowanie:** Włącz/Wyłącz Sklep.
*   **Cennik Próbek:**
    *   Cena za 1 szt. próbki (PLN).
    *   Koszt wysyłki próbek (PLN).
*   **Dane Proformy:**
    *   Nazwa Banku.
    *   Numer Konta (wyświetlany klientowi po otrzymaniu proformy).

### C. Sklep -> Oferta (Zarządzanie Produktami)
Dedykowany widok (tabela) do szybkiego zarządzania widocznością produktów z bazy ERP.
*   Lista produktów pobrana z `erp_products`.
*   Kolumny Switch:
    1.  **Sprzedaż (Panele)** -> steruje flagą `is_shop_visible`.
    2.  **Próbki** -> steruje flagą `is_sample_available`.

## 4. Workflow Obsługi Zamówienia (Panele)
System wspiera proces manualnego wystawiania Proformy zewnętrznie.

1.  **Nowe Zamówienie:** Status `pending_proforma`.
2.  **Akcja Admina:** Przycisk "Wgraj Proformę".
3.  **Modal:**
    *   Upload pliku PDF.
    *   Pole tekstowe "Tytułem przelewu" (do wpisania numeru proformy).
4.  **Skutek:**
    *   Status -> `payment_pending`.
    *   Email do Klienta -> Treść z instrukcją płatności, załącznik PDF, wskazanie numeru do tytułu przelewu.

## 5. Model Danych (Zmiany)
*   **Tabela `orders`:**
    *   `source`: 'shop'.
    *   `payment_method`: 'tpay' | 'proforma'.
    *   `transfer_title`: text (dla numeru proformy).
*   **Tabela `erp_products`:**
    *   `is_shop_visible`: boolean (default false).
    *   `is_sample_available`: boolean (default false).
    *   `package_size_m2`: float (wymagane do kalkulatora paczek).

## 7. Numeracja Zamówień i Archiwizacja Dokumentów

### A. Identyfikacja Zamówień (Friendly ID)
System wykorzystuje dwuwarstwową identyfikację zamówień:
1.  **ID Techniczne (UUID):** Używane w bazie danych, w adresach URL (`/orders/3cbad...`) oraz relacjach. Gwarantuje unikalność i bezpieczeństwo.
2.  **Numer Zamówienia (Display ID):** Format czytelny dla klienta, używany w komunikacji, na fakturach i listach.
    *   **Format:** `ZM/{ROK}/{NR}` (np. `ZM/2026/015`).
    *   **Generowanie:** Nadawany automatycznie w momencie utworzenia zamówienia (lub zatwierdzenia koszyka).
    *   **Prezentacja:** Panel Admina i Panel Klienta wyświetlają wyłącznie Display ID.

### B. Przechowywanie Dokumentów (R2)
Pliki (proformy, faktury, etykiety) są przechowywane w chmurze (Cloudflare R2) w ustrukturyzowanych katalogach.
*   **Wzorzec Ścieżki:** `zamowienia/{ROK}/{DISPLAY_NUMBER}/{TYP}/{TIMESTAMP}_{NAZWA_PLIKU}`
*   **Zmienne:**
    *   `{ROK}`: Rok złożenia zamówienia (np. 2026).
    *   `{DISPLAY_NUMBER}`: Numer czytelny (np. ZM-2026-015). Jeśli brak, fallback do UUID.
    *   `{TYP}`: Kategoria dokumentu (`proformy`, `faktury`, `logistyka`).
*   **Obsługiwane typy:**
    *   **Proforma:** Wgrywana ręcznie przez administratora.
    *   **Faktura Końcowa:** Wgrywana ręcznie po wysyłce towaru.
    *   **Etykiety:** Generowane automatycznie (InPost) lub wgrywane ręcznie.
