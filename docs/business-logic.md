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
| **Montażysta** | `installer` | Dostęp operacyjny: Pulpit, To Do, Zadania, Kalendarz, Montaże, Galeria. Realizuje montaże oraz pomiary (model hybrydowy). Obsługuje mobilny ekspozytor. | **BRAK DOSTĘPU** do danych wrażliwych: Baza Klientów, Zamówienia (ceny), Produkty, Poczta, Ustawienia globalne. |

## 2. Procesy Montażowe (Workflow)

### Statusy Montażu
1. **Lead** - Nowe zapytanie, jeszcze nie zweryfikowane.
2. **Oczekiwanie na Płatność (Nowy!)** - Handlowiec wymusił opłatę weryfikacyjną za pomiar. Zlecenie wstrzymane do czasu opłacenia przez klienta (Tpay).
3. **Przed pomiarem (Do umówienia)** - Zlecenie zaakceptowane (lub opłacone), oczekuje na kontakt ze strony montażysty w celu umówienia terminu.
4. **Przed zaliczką** - Pomiar wykonany, oferta wysłana, czekamy na wpłatę.
5. **Przed montażem** - Zaliczka zaksięgowana, materiał zamówiony/skompletowany, czekamy na termin montażu.
5. **Przed końcową fakturą** - Montaż zakończony, czekamy na rozliczenie końcowe.
6. **Zakończony** - Wszystko opłacone i zamknięte.

### Logistyka Materiałowa (Nowość)
System obsługuje dwa tryby dostawy materiałów, definiowane przez montażystę na etapie pomiaru lub przez biuro:
- **Dostawa Firmowa (Domyślna):** Magazyn/Kierowca dostarcza towar do klienta. Montażysta nie otrzymuje powiadomień o odbiorze.
- **Odbiór Własny (Installer Pickup):** Montażysta zobowiązany jest pobrać towar z magazynu. Aplikacja wyświetla alert "ZABIERZ TOWAR", jeśli status materiału to "Na magazynie".

## 3. Automatyzacje (Planowane/Obecne)

### Obecne:
- **Ukrywanie menu:** Menu boczne dynamicznie ukrywa sekcje na podstawie roli użytkownika (logika w `DashboardNav`).
- **Blokada stron:** Middleware/Layout sprawdza rolę i przekierowuje na stronę główną przy próbie wejścia w link bez uprawnień.

### Planowane (Do wdrożenia):
- **Powiadomienia SMS:** Automat wysyłający SMS do klienta dzień przed montażem.

## 4. Moduł ERP (Zakupy i Magazyn)

---
*Ostatnia aktualizacja: 20.12.2025*

## 5. UX/UI Procesu Pomiarowego (Mobile First)

### Umawianie Pomiaru
- **Interfejs:** Dwuetapowy (Wybór -> Potwierdzenie).
- **Stan Potwierdzenia:** Po wybraniu daty, montażysta widzi "Kartę Oczekiwania" z odliczaniem dni i instrukcją "Co dalej".
- **Integracja Kalendarza:** System generuje linki do Google Calendar.
- **Oś Czasu:** Wizualizacja zaplanowanego terminu na osi czasu procesu.

## 6. Automatyzacje w Procesie (Process Hub)

Zdefiniowane automatyzacje widoczne na osi czasu procesu:

### Lejki i Umawianie
- **Nowe Zgłoszenie:**
  - Powiadomienie Biura (Email/SMS) o nowym leadzie.
- **Oczekiwanie na Płatność (Pomiar):**
  - Trigger: Ręczne wymuszenie płatności przez Handlowca ("Zleć pomiar + Wymagaj płatności").
  - Akcja: Generowanie technicznego zamówienia w module Sklepu (produkt "Usługa Pomiaru").
  - Akcja Klienta: Opłacenie zamówienia przez Portal Klienta (Tpay).
  - Automatyzacja: Po zaksięgowaniu wpłaty, system automatycznie zmienia status na "Do umówienia" i powiadamia montażystę.
- **Do Umówienia:**
  - Powiadomienie Montażysty (SMS: Nowy klient do umówienia).
- **Pomiar Umówiony:**
  - Synchronizacja Kalendarza (Google Calendar).
  - Przypomnienie SMS dla klienta (24h przed).

### Wycena i Umowa
- **Po Pomiarze:** Start Wyceny (zmiana statusu po utworzeniu oferty).
- **Wycena w Toku:** Wysłanie Oferty (zmiana statusu po wysłaniu maila).
- **Podpis Klienta:** Automatyczna zmiana statusu na "Umowa Podpisana" po podpisie w panelu.
- **Umowa Podpisana:** Wystawienie Proformy (zmiana statusu na "Oczekiwanie na Zaliczkę" po dodaniu płatności).
- **Oczekiwanie na Zaliczkę:**
  - Przypomnienie o Płatności (SMS/Mail przypominający o braku wpłaty).
  - Zaksięgowanie Wpłaty (zmiana statusu na "Zaliczka Opłacona").

### Realizacja i Logistyka
- **Zaliczka Opłacona:**
  - Potwierdzenie Wpłaty (SMS/Mail do klienta).
  - Zapotrzebowanie ERP (utworzenie draftu zamówienia do dostawcy).
- **Materiały Zamówione:** Mail do Dostawcy (wysłanie zamówienia PDF).
- **Gotowe do Odbioru:** Powiadomienie o Odbiorze (SMS/Mail do klienta/montażysty).
- **Montaż Zaplanowany:** Przypomnienie o Montażu (SMS do klienta 48h przed).

### Finisz
- **Protokół Podpisany:** Generowanie draftu Faktury Końcowej.
- **Zakończone:** Prośba o Opinię (Mail z linkiem do Google Maps).
