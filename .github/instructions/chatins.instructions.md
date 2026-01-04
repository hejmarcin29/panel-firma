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
- **Responsywność (Desktop & Mobile):**
  - Każdy widok **MUSI** działać poprawnie i wyglądać estetycznie zarówno na desktopie, jak i na urządzeniach mobilnych.
  - Nie akceptujemy rozwiązań "tylko desktop" lub "tylko mobile" (chyba że specyfika funkcji to wymusza).
  - Testuj (symuluj) widoki na małych ekranach (iPhone SE/12) oraz dużych monitorach.

## Mobile UI Patterns (Mobile-First)
- **Edytory i Listy Szczegółowe:**
  - **Unikaj tabel na mobile:** Zamiast tabel, stosuj układ **Kart (Card Layout)**. Każdy wiersz danych (np. pozycja wyceny) powinien być osobną kartą.
  - **Grid wewnątrz Karty:** Układaj pola formularzy wewnątrz karty w siatce (`grid-cols-2` lub `grid-cols-3`), aby maksymalnie wykorzystać szerokość ekranu, ale uniknąć poziomego przewijania.
  - **Sticky Footer:** Główna akcja (np. "Zapisz") powinna być "przyklejona" do dołu ekranu (`fixed bottom-...`), ale **musi uwzględniać dolny pasek nawigacyjny** (`bottom-[calc(4rem+env(safe-area-inset-bottom))]`).
  - **Menu Kontekstowe:** Akcje drugorzędne (Usuń, Drukuj) chowaj w menu rozwijanym (Dropdown Menu) w nagłówku karty lub widoku.
  - **Nagłówki:** Na mobile stosuj uproszczone nagłówki.
  - **Scroll Snapping:** Stosuj naturalne zachowanie przewijania (`snap-stop: normal`), które pozwala na przewinięcie wielu elementów przy mocnym pociągnięciu (momentum), a jednocześnie precyzyjne zatrzymanie na elemencie przy wolnym przewijaniu. Unikaj wymuszania zatrzymania na każdym elemencie (`snap-always`), chyba że jest to krytyczne dla UX (np. stepper).

## Role i Uprawnienia (RBAC)
System posiada 3 główne role użytkowników:

1. **Administrator (`admin`)**:
   - Ma pełny dostęp do wszystkich modułów systemu.
   - Może zarządzać użytkownikami, ustawieniami, zamówieniami, produktami i pocztą.
   - Widzi wszystkie montaże i kalendarze.

2. **Montażysta (`installer`)**:
   - **Dostęp:** Pulpit, To Do, Zadania, Kalendarz, Montaże, Galeria.
   - **Brak dostępu:** Klienci, Zamówienia, Produkty, Poczta, Ustawienia.
   - **Zadania:** Realizuje montaże **oraz pomiary**, widzi szczegóły techniczne zlecenia, zmienia statusy montażu, **obsługuje ekspozytor mobilny**.

Przy tworzeniu nowych funkcjonalności dla Montażysty, pamiętaj o tych ograniczeniach.

## Task-Driven UI (Installer Role)
Dla roli Montażysty (`installer`) stosujemy interfejs zorientowany na zadania (Task-Driven UI), a nie na statusy.
- **Brak Dropdownów Statusu:** Montażysta nie wybiera statusu z listy. Widzi jedynie pasek postępu (read-only).
- **Jeden Przycisk Akcji:** System podpowiada jedną, główną akcję do wykonania w danym momencie (np. "Uruchom Asystenta Pomiaru").
- **Sekwencyjność:** Kolejne akcje (np. "Kosztorys") odblokowują się dopiero po wykonaniu poprzednich (np. "Zapisanie Pomiaru").
- **Cel:** Minimalizacja błędów i uproszczenie pracy w terenie.

## Dokumentacja Logiki Biznesowej
**WAŻNE:** Wszelkie zmiany w logice biznesowej, automatyzacjach, rolach czy przepływach pracy (workflows) muszą być odzwierciedlone w pliku:
`docs/business-logic.md`

Jako AI, masz obowiązek:
1. Sprawdzać ten plik przed implementacją nowych funkcji biznesowych.
2. Aktualizować ten plik, gdy wprowadzasz nowe automatyzacje lub zmieniasz zasady działania systemu.
3. Traktować ten plik jako "Single Source of Truth" dla zasad biznesowych.

## Automatyzacje (Automations)
- **Rejestracja:** Każda zaimplementowana automatyzacja musi zostać dodana do widoku ustawień: `/settings?tab=automations`.
- **Kategoryzacja:** Automatyzacje muszą być przypisane do odpowiednich kategorii (np. Montaże, Zamówienia, Klienci), aby utrzymać porządek w panelu administracyjnym.

## Process Hub & Timeline (Widok Procesowy)
System posiada zaawansowany widok osi czasu procesu montażu (`MontageProcessTimeline`), który wizualizuje przeszłość, teraźniejszość i przyszłość zlecenia.

**Zasady aktualizacji:**
1.  **Nowe Statusy:** Jeśli dodajesz nowy status montażu (`MontageStatus`), musisz zaktualizować definicję kroków w konfiguracji Process Hub, aby status ten był poprawnie mapowany na osi czasu.
2.  **Nowe Automatyzacje:** Jeśli tworzysz nową automatyzację (np. "Wysłanie SMS po X"), dodaj informację o niej do definicji kroku, w którym występuje. Użytkownik musi widzieć na osi czasu, że system wykona tę akcję automatycznie (np. "🤖 System wyśle powiadomienie").
3.  **Nowe Akcje Użytkownika:** Jeśli dodajesz kluczową akcję (np. "Generowanie Protokołu"), rozważ dodanie jej jako "Checkpoint" na osi czasu, aby było widać, czy została wykonana (np. ✅ Protokół wygenerowany).
4.  **Aktorzy:** Przy każdym kroku określaj, kto jest "właścicielem" piłeczki (Klient, Biuro, Montażysta, System), aby wizualizacja jasno pokazywała, na kogo czekamy.

## Wizualizacja Procesu (Process Map / Flowchart)
Do wizualizacji skomplikowanych przepływów i zależności logicznych używamy biblioteki **React Flow**.
- **Cel:** Graficzne przedstawienie logiki biznesowej (Etapy jako bloki, Checkpointy jako punkty decyzyjne/romby).
- **Interaktywność:** Mapa w widoku szczegółów montażu służy do podglądu (read-only) i wskazuje aktywny etap (pulsowanie). Mapa w ustawieniach służy do analizy całego procesu.
- **Spójność:** Mapa jest generowana dynamicznie na podstawie `PROCESS_STEPS` z pliku `process-definition.ts`. Nie rysujemy jej "na sztywno" – musi odzwierciedlać kod.

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

### Auto-save vs Server Refresh (Race Condition)
Przy implementacji formularzy z auto-zapisem (Auto-save) w Next.js (Server Actions + `router.refresh()`), występuje ryzyko nadpisania lokalnego stanu przez dane z serwera w trakcie pisania.
- **Problem:** Użytkownik pisze -> Auto-save wysyła dane -> Server Action kończy się `revalidatePath` -> `router.refresh()` odświeża propsy komponentu -> `useEffect` nadpisuje stan lokalny starą/nową wartością z serwera, przerywając pisanie.
- **Rozwiązanie:** W `useEffect` synchronizującym stan z propsami, **NIE** dodawaj całego obiektu danych do tablicy zależności.
  - **Źle:** `useEffect(() => { setForm(data) }, [data])` - każde odświeżenie serwera resetuje formularz.
  - **Dobrze:** `useEffect(() => { setForm(data) }, [data.id])` - resetuj formularz TYLKO gdy zmienia się ID rekordu (np. nawigacja do innego montażu).
- **Zasada:** Stan lokalny formularza ma priorytet nad danymi z serwera w trakcie edycji. Synchronizacja z serwera powinna następować tylko przy inicjalizacji lub zmianie kontekstu (ID).

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
- **Domena:** Panel jest dostępny pod adresem `https://b2b.primepodloga.pl`.
- **Katalog Aplikacji:** Aplikacja na serwerze produkcyjnym (VPS) znajduje się w katalogu `/srv/panel/`.
- **Plik .env:** Plik konfiguracyjny `.env` (zawierający `DATABASE_URL` i inne sekrety) **MUSI** znajdować się w `/srv/panel/.env`.
- **PM2:** Procesy są zarządzane przez PM2 i uruchamiane z katalogu `/srv/panel/`.
- **Użytkownik:** Aplikacja działa na koncie `deploy`.
- **Baza Danych:** PostgreSQL. Connection string w `.env` musi używać użytkownika `panel_user` (nie `deploy`).

## Praca z Bazą Danych (PostgreSQL + Drizzle)
- **Nazewnictwo Tabel:** Nazwy tabel muszą być spójne z funkcją, którą pełnią. Unikaj nazw ogólnych lub mylących. Nazwa powinna jasno wskazywać na zawartość i przeznaczenie tabeli.
- **Soft Deletes (WAŻNE):** Wiele tabel (np. `montages`, `products`, `customers`, `quotes`) używa mechanizmu "Soft Delete" (kolumna `deletedAt`).
  - **Przy każdym zapytaniu `SELECT` (findMany, findFirst, select) MUSISZ jawnie filtrować usunięte rekordy:** `where: isNull(table.deletedAt)` (lub `and(..., isNull(table.deletedAt))`).
  - Wyjątkiem są tylko widoki administracyjne typu "Kosz" lub historia.
  - Zapomnienie o tym filtrze powoduje błędy w logice biznesowej (np. wyświetlanie usuniętych montaży w kalendarzu).
- **Unikaj `LIKE` na kolumnach JSON:** W PostgreSQL kolumny typu JSON (np. `roles`, `categories`) są strukturami danych, a nie tekstem. Używanie operatora `LIKE` (np. `WHERE roles LIKE '%admin%'`) prowadzi do błędów.
- **Preferuj `db.query`:** Korzystaj z API `db.query.table.findMany()` zamiast surowych zapytań SQL (`db.select().where(sql...)`). Drizzle automatycznie obsługuje mapowanie typów JSON na obiekty JS.
- **Filtrowanie w JS:** Dla małych zbiorów danych (np. lista użytkowników, statusy), bezpieczniej i czytelniej jest pobrać wszystkie rekordy i przefiltrować je w JavaScript (`.filter()`), zamiast tworzyć skomplikowane rzutowania typów w SQL.

## Praca z Produktami (ID vs Nazwa)
- **Zasada ID:** Wszelkie operacje na produktach (zapisywanie w pomiarach, wycenach, zamówieniach, logach materiałowych) **MUSZĄ** opierać się na `product_id` (ID z bazy danych), a nie na nazwie produktu.
- **Cel:** Zapewnienie spójności danych w przypadku zmiany nazwy produktu w sklepie/bazie.
- **Implementacja:**
  - W tabelach (np. `montages`, `quote_items`) przechowuj `product_id` (integer).
  - Nazwę produktu (`product_name`) można przechowywać dodatkowo jako "snapshot" w momencie zapisu (dla celów historycznych/czytelności), ale logika biznesowa (np. import do wyceny, stany magazynowe) musi korzystać z ID.
  - Przy pobieraniu danych (np. do edycji), zawsze odświeżaj informacje o produkcie (cena, atrybuty) na podstawie ID.

## Offline-First & Field Operations (Priorytet dla Mobile)
Aplikacja jest używana przez pracowników terenowych w miejscach o słabym zasięgu (piwnice, nowe budowy).
1.  **Krytyczne Widoki:** Widoki Montażu (`/dashboard/crm/montaze/[id]`) oraz Zadań muszą być projektowane tak, aby działały przy przerywanym połączeniu.
2.  **Data Fetching:** Dla danych, które muszą być dostępne offline (szczegóły zlecenia, checklisty), preferuj pobieranie danych po stronie klienta (Client Components + React Query) z włączonym cache'owaniem, zamiast renderowania wszystkiego na serwerze (RSC).
3.  **Optimistic UI:** Każda akcja użytkownika (np. odhaczenie checklisty) musi dawać natychmiastowy feedback wizualny ("Zrobione"), nawet jeśli serwer jeszcze nie potwierdził zapisu.
4.  **Graceful Degradation:** Jeśli funkcja wymaga 100% dostępu do sieci (np. generowanie PDF, wysyłka e-maila), przycisk musi być nieaktywny w trybie offline, z jasnym komunikatem dla użytkownika.
5.  **Unikaj Blokowania:** Nigdy nie blokuj interfejsu spinnerem "Ładowanie..." na dłużej niż to konieczne. Jeśli dane są w cache, pokaż je natychmiast, a w tle sprawdzaj aktualizacje (SWR - Stale While Revalidate).
6.  **Konflikty Danych:** Stosuj zasadę "Last Write Wins" (Ostatni Zapis Wygrywa). Jeśli pracownik zmieni status offline, a po odzyskaniu sieci wyśle go na serwer, system powinien przyjąć tę zmianę jako najnowszą, chyba że narusza to krytyczne reguły biznesowe.

## Komunikacja z Użytkownikiem (AI)
- **Zadawaj Pytania:** Jeśli nie jesteś pewien intencji użytkownika, brakuje Ci kontekstu lub zadanie jest niejednoznaczne - **ZADAJ PYTANIE**. Lepiej dopytać o szczegóły niż wprowadzić błędne zmiany.
- **Proaktywność:** Jeśli widzisz potencjalny problem w prośbie użytkownika (np. naruszenie spójności danych), poinformuj o tym i zaproponuj bezpieczniejsze rozwiązanie.
