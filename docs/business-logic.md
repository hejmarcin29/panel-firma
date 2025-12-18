# Dokumentacja Logiki Biznesowej i Automatyzacji

Ten plik służy jako "Single Source of Truth" dla zasad działania systemu. Każda zmiana w kodzie wpływająca na logikę biznesową musi być tutaj odnotowana.

## 1. Role i Uprawnienia (RBAC)

### Zasada "Jeden Admin"
- W systemie istnieje tylko **jeden** główny administrator.
- Adres email admina: `kontakt@primepodloga.pl`.
- Każdy inny użytkownik, nawet jeśli w bazie ma flagę admina, jest degradowany do roli `measurer` (pomiarowiec) przez skrypty naprawcze.

### Definicje Ról
| Rola | Kod | Uprawnienia | Ograniczenia |
|------|-----|-------------|--------------|
| **Administrator** | `admin` | Pełny dostęp do wszystkich modułów: Zamówienia, Klienci, Produkty, Poczta, Ustawienia, Montaże, Finanse. | Brak. |
| **Pomiarowiec** | `measurer` | Dostęp operacyjny: Pulpit, To Do, Zadania, Kalendarz, Montaże, Galeria. | **BRAK DOSTĘPU** do danych wrażliwych: Baza Klientów, Zamówienia (ceny), Produkty, Poczta, Ustawienia globalne. |
| **Montażysta** | `installer` | Tożsame z Pomiarowcem. Skupia się na realizacji zleceń. | Jak wyżej. |

## 2. Procesy Montażowe (Workflow)

### Statusy Montażu
1. **Lead** - Nowe zapytanie, jeszcze nie zweryfikowane.
2. **Przed pomiarem** - Zlecenie zaakceptowane, oczekuje na wizytę pomiarowca.
3. **Przed zaliczką** - Pomiar wykonany, oferta wysłana, czekamy na wpłatę.
4. **Przed montażem** - Zaliczka zaksięgowana, materiał zamówiony/skompletowany, czekamy na termin montażu.
5. **Przed końcową fakturą** - Montaż zakończony, czekamy na rozliczenie końcowe.
6. **Zakończony** - Wszystko opłacone i zamknięte.

## 3. Automatyzacje (Planowane/Obecne)

### Obecne:
- **Ukrywanie menu:** Menu boczne dynamicznie ukrywa sekcje na podstawie roli użytkownika (logika w `DashboardNav`).
- **Blokada stron:** Middleware/Layout sprawdza rolę i przekierowuje na stronę główną przy próbie wejścia w link bez uprawnień.

### Planowane (Do wdrożenia):
- **Prowizje Partnerów:** Automatyczne naliczanie prowizji dla architektów (Cennik Baza + X%).
- **Powiadomienia SMS:** Automat wysyłający SMS do klienta dzień przed montażem.

## 4. Moduł ERP (Zakupy i Magazyn)

### Zakupy (Purchase Orders)
- **Proces:** Tworzenie zamówienia (Draft) -> Wysłanie do dostawcy (Ordered) -> Przyjęcie towaru (Received).
- **Przyjęcie towaru:** Zmiana statusu na `received` automatycznie zwiększa stan magazynowy produktów (`stock_quantity`) oraz tworzy wpis w historii ruchów magazynowych (`warehouse_movements`).

### Magazyn (Warehouse)
- **Stany:** Oparte na polu `stock_quantity` w tabeli `products`.
- **Ruchy:** Każda zmiana stanu (zakup, sprzedaż, montaż, korekta) jest rejestrowana w `warehouse_movements`.
- **Integracja:**
  - Sprzedaż (Zamówienie): Zmniejsza stan.
  - Montaż: Zmniejsza stan (jeśli materiał pobrany z magazynu).

---
*Ostatnia aktualizacja: 18.12.2025*
