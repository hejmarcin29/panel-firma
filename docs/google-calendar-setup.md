# Instrukcja konfiguracji integracji z Kalendarzem Google

Ta integracja pozwala na automatyczne tworzenie wydarzeń w Twoim Kalendarzu Google, gdy dodasz lub zaktualizujesz montaż w panelu. Montażyści są automatycznie dodawani jako uczestnicy wydarzeń.

## Krok 1: Google Cloud Console (Konfiguracja "Robota")

1. Wejdź na stronę: [Google Cloud Console](https://console.cloud.google.com/).
2. Zaloguj się swoim kontem Google.
3. Na górnym pasku kliknij listę projektów i wybierz **"New Project"** (Nowy Projekt). Nazwij go np. `Panel-Firma`.
4. Po utworzeniu projektu, upewnij się, że jest wybrany na górnym pasku.

## Krok 2: Włączenie API

1. W menu po lewej wybierz **"APIs & Services"** -> **"Library"**.
2. W wyszukiwarce wpisz: `Google Calendar API`.
3. Kliknij w wynik i naciśnij przycisk **"Enable"** (Włącz).

## Krok 3: Tworzenie Konta Usługi (Service Account)

1. W menu po lewej wybierz **"APIs & Services"** -> **"Credentials"**.
2. Kliknij **"+ CREATE CREDENTIALS"** na górze i wybierz **"Service account"**.
3. **Service account details:**
   - Name: np. `panel-integracja`.
   - Kliknij "Create and Continue".
4. **Grant this service account access to project:**
   - Rola: Wybierz `Owner` (Właściciel) lub `Editor` (Edytor) - dla uproszczenia.
   - Kliknij "Continue".
5. Kliknij "Done".

## Krok 4: Pobranie Klucza (Hasła dla Robota)

1. Na liście "Service Accounts" (na dole strony Credentials) kliknij w nowo utworzone konto (np. `panel-integracja@...`).
2. Wejdź w zakładkę **"Keys"** (Klucze).
3. Kliknij **"ADD KEY"** -> **"Create new key"**.
4. Wybierz typ **JSON** i kliknij "Create".
5. **Pobierze się plik na Twój komputer.** To jest bardzo ważny plik, nie zgub go!

## Krok 5: Konfiguracja Panelu (Serwer)

Otwórz pobrany plik JSON w Notatniku. Znajdziesz tam pola `client_email` oraz `private_key`.

Musisz dodać te dane do pliku `.env` na serwerze (lub w panelu hostingu w sekcji zmiennych środowiskowych):

```env
# Adres e-mail robota (skopiuj z pliku JSON pole "client_email")
GOOGLE_CLIENT_EMAIL="panel-integracja@twoj-projekt.iam.gserviceaccount.com"

# Klucz prywatny (skopiuj z pliku JSON pole "private_key")
# WAŻNE: Skopiuj wszystko, od -----BEGIN PRIVATE KEY----- do -----END PRIVATE KEY-----
# Upewnij się, że znaki nowej linii (\n) są zachowane lub poprawnie wklejone.
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## Krok 6: Udostępnienie Kalendarza (Wpuszczenie Robota)

To jest krok, o którym najczęściej się zapomina!

1. Wejdź na [calendar.google.com](https://calendar.google.com/).
2. Po lewej stronie znajdź swój kalendarz (np. "Firma" lub Twoje Imię).
3. Kliknij trzy kropki obok nazwy -> **"Ustawienia i udostępnianie"**.
4. Zjedź do sekcji **"Udostępnij określonym osobom"**.
5. Kliknij **"+ Dodaj osoby"**.
6. W polu e-mail wklej **adres e-mail robota** (ten sam, co w `GOOGLE_CLIENT_EMAIL`, kończący się na `...iam.gserviceaccount.com`).
7. W uprawnieniach wybierz: **"Wprowadzanie zmian w wydarzeniach"**.
8. Kliknij "Wyślij" (lub Zapisz).

## Krok 7: Konfiguracja w Panelu (Aplikacja)

1. Zaloguj się do swojego Panelu Administratora.
2. Wejdź w **Ustawienia** -> **Integracje** -> **Kalendarz Google**.
3. Wpisz ID swojego kalendarza.
   - Jeśli używasz głównego kalendarza, to po prostu Twój adres Gmail.
   - ID kalendarza możesz też znaleźć w ustawieniach kalendarza Google w sekcji "Integrowanie kalendarza".
4. Kliknij Zapisz.

## Gotowe!

Teraz, gdy dodasz montaż z datą, system (używając klucza z Kroku 5) połączy się z Google, przedstawi się jako Robot (Krok 3) i poprosi o dodanie wpisu do Twojego kalendarza (do którego dostał dostęp w Kroku 6).
