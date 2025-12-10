---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

## UI/UX Preferences
- Unikaj stałych pasków bocznych (sidebarów) w widokach sklepu.
- Do filtrowania preferuj rozwiązania typu Modal (okno dialogowe) lub Drawer (tymczasowy panel wysuwany), spójnie dla wersji desktop i mobile.
- Celem jest maksymalizacja przestrzeni na prezentację produktów (siatka na pełną szerokość).

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