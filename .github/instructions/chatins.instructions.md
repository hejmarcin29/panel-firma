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

## Struktura i Konfiguracja Integracji
- **Lokalizacja w UI:** Wszelkie konfiguracje zewnętrznych usług i integracji (np. Google, WooCommerce, Poczta, Cloudflare) muszą znajdować się w sekcji "Ustawienia" -> "Integracje". Nie twórz dla nich osobnych głównych zakładek w Ustawieniach, chyba że jest to absolutnie konieczne.
- **Struktura plików:** Komponenty i akcje związane z integracjami powinny znajdować się w folderze `src/app/dashboard/settings/integrations/`. Zachowaj porządek w strukturze plików odpowiadający strukturze UI.