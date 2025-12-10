---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

## UI/UX Preferences
- Unikaj stałych pasków bocznych (sidebarów) w widokach sklepu.
- Do filtrowania preferuj rozwiązania typu Modal (okno dialogowe) lub Drawer (tymczasowy panel wysuwany), spójnie dla wersji desktop i mobile.
- Celem jest maksymalizacja przestrzeni na prezentację produktów (siatka na pełną szerokość).
- **Animacje i "Look & Feel" (Top 2025):**
  - Panel ma być przyjemny dla oka i płynny.
  - Stosuj subtelne animacje wejścia (fade-in, slide-up, staggered children) dla list, kart i widgetów (np. przy użyciu `framer-motion` lub `tailwindcss-animate`).
  - Elementy interaktywne powinny dawać natychmiastowy feedback wizualny.
  - Unikaj "sztywnych" przejść; interfejs ma "oddychać".

## Role i Uprawnienia (RBAC)
System posiada 3 główne role użytkowników:

1. **Administrator (`admin`)**:
   - Ma pełny dostęp do wszystkich modułów systemu.
   - Może zarządzać użytkownikami, ustawieniami, zamówieniami, produktami i pocztą.
   - Widzi wszystkie montaże i kalendarze.

2. **Pomiarowiec (`measurer`)**:
   - **Dostęp:** Pulpit, To Do, Zadania, Kalendarz, Montaże, Galeria.
   - **Brak dostępu:** Klienci, Zamówienia, Produkty, Poczta, Ustawienia.
   - **Zadania:** Przeprowadza pomiary u klientów, uzupełnia karty pomiarowe, dodaje zdjęcia z pomiarów.

3. **Montażysta (`installer`)**:
   - **Dostęp:** Pulpit, To Do, Zadania, Kalendarz, Montaże, Galeria.
   - **Brak dostępu:** Klienci, Zamówienia, Produkty, Poczta, Ustawienia.
   - **Zadania:** Realizuje montaże, widzi szczegóły techniczne zlecenia, zmienia statusy montażu.

Przy tworzeniu nowych funkcjonalności dla Pomiarowca lub Montażysty, pamiętaj o tych ograniczeniach.

## Dokumentacja Logiki Biznesowej
**WAŻNE:** Wszelkie zmiany w logice biznesowej, automatyzacjach, rolach czy przepływach pracy (workflows) muszą być odzwierciedlone w pliku:
`docs/business-logic.md`

Jako AI, masz obowiązek:
1. Sprawdzać ten plik przed implementacją nowych funkcji biznesowych.
2. Aktualizować ten plik, gdy wprowadzasz nowe automatyzacje lub zmieniasz zasady działania systemu.
3. Traktować ten plik jako "Single Source of Truth" dla zasad biznesowych.

## Instrukcje dla Użytkowników (User Manuals)
Przy tworzeniu lub modyfikowaniu ról użytkowników (np. Pomiarowiec, Montażysta, Partner), **ZAWSZE** pamiętaj o zapewnieniu im dostępu do instrukcji obsługi w panelu.
- Każda rola powinna mieć dedykowaną sekcję lub zakładkę "Pomoc" / "Instrukcja".
- Instrukcja ta powinna wyjaśniać, jak korzystać z dostępnych dla nich funkcji.
- Przy dodawaniu nowych funkcji dla danej roli, zaktualizuj również jej instrukcję.

## Interakcje i Zapisywanie Danych (Auto-save)
W panelu operacyjnym (Dashboard) stosujemy zasadę **Auto-save** zamiast ręcznych przycisków "Zapisz".
- **Edycja:** Wszelkie zmiany na istniejących rekordach mają być zapisywane automatycznie.
  - Pola tekstowe (`Input`, `Textarea`): Zapis po chwili bezczynności (debounce, np. 500-1000ms) lub przy `onBlur`.
  - Przełączniki (`Switch`, `Checkbox`) i Listy (`Select`): Zapis natychmiastowy przy zmianie wartości.
- **Tworzenie:** Dla nowych obiektów (np. "Nowy Klient") zachowujemy przycisk "Utwórz" / "Dodaj", aby uniknąć tworzenia pustych rekordów.
- **Feedback:** Użytkownik musi widzieć status operacji (np. mały wskaźnik "Zapisywanie...", "Zapisano" lub toast).
- **Usuwanie:** Operacje destrukcyjne nadal wymagają potwierdzenia.

## Widok TV (Wallboard)
Przy implementacji nowych, kluczowych funkcjonalności biznesowych (np. nowe statusy, ważne alerty, KPI), **ZAWSZE** rozważ ich uwzględnienie w widoku TV (`/tv`).
- Jeśli nowa funkcja wpływa na przepływ pracy (workflow), zaktualizuj logikę w `src/app/tv/actions.ts`.
- Widok TV ma służyć jako "centrum dowodzenia" dla hali/biura, więc musi odzwierciedlać najważniejsze zmiany w czasie rzeczywistym.

## Integralność Systemu i Analiza Wpływu
Przy każdej implementacji, modyfikacji lub naprawie błędu, **ZAWSZE** analizuj system jako całość.
- **Analiza Wsteczna:** Przed wprowadzeniem zmian zastanów się, czy nowa funkcjonalność nie narusza istniejącej logiki biznesowej, automatyzacji lub przepływów pracy (workflows).
- **Spójność Danych:** Upewnij się, że zmiany w strukturze danych lub statusach nie "psują" raportów, widoków KPI, widoku TV czy uprawnień użytkowników.
- **Zależności:** Sprawdź, czy modyfikowany komponent nie jest używany w innych, nieoczywistych miejscach (np. ten sam komponent w Dashboardzie i w widoku Klienta).
- **Cel:** Twoim zadaniem jest nie tylko "dowiezienie feature'a", ale zapewnienie, że cały ekosystem (Panel Admina, Panel Pracownika, TV, Automatyzacje) pozostaje spójny i stabilny.

## Konfiguracja Serwera i Wdrożenie
- **Katalog Aplikacji:** Aplikacja na serwerze produkcyjnym (VPS) znajduje się w katalogu `/srv/panel/`.
- **Plik .env:** Plik konfiguracyjny `.env` (zawierający `DATABASE_URL` i inne sekrety) **MUSI** znajdować się w `/srv/panel/.env`.
- **PM2:** Procesy są zarządzane przez PM2 i uruchamiane z katalogu `/srv/panel/`.
- **Użytkownik:** Aplikacja działa na koncie `deploy`.
- **Baza Danych:** PostgreSQL. Connection string w `.env` musi używać użytkownika `panel_user` (nie `deploy`).