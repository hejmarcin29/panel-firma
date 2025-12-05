#!/bin/bash
set -e

# Przejdź do katalogu aplikacji
cd /srv/panel

# Pobierz najnowsze zmiany (wymuś zgodność z repozytorium)
git fetch origin main
git reset --hard origin/main

# Mechanizm samo-aktualizacji skryptu
# Jeśli skrypt został zaktualizowany przez git reset, musimy go przeładować,
# aby bash nie wykonywał starych instrukcji z bufora.
if [ -z "$DEPLOY_RELOADED" ]; then
    echo "Kod zaktualizowany. Restartowanie skryptu deploy..."
    export DEPLOY_RELOADED=true
    exec "$0" "$@"
fi

echo "--- Uruchamianie Deploy v2 (Fix DB + Push) ---"

# Zainstaluj zależności
npm install

# Wygeneruj klienta bazy danych
npm run db:generate

# Napraw strukturę bazy danych ręcznie (dla kolumn, które powodują błędy w push)
# Upewniamy się, że fix_db.js jest wykonywany
echo "Uruchamianie fix_db.js..."
node fix_db.js

# Zaaplikuj migracje bazy danych
# Używamy push, ponieważ historia migracji jest niespójna
echo "Synchronizacja schematu (drizzle-kit push)..."
npx drizzle-kit push

# Wyczyść cache Next.js (opcjonalne, ale pomaga przy problemach)
# Usuwamy folder .next (build) oraz cache Data Cache
rm -rf .next

# Zbuduj aplikację
npm run build

# Zrestartuj aplikację (zakładając PM2)
echo "Restartowanie aplikacji..."
if command -v pm2 &> /dev/null; then
    pm2 restart panel || pm2 start npm --name "panel" -- start
    pm2 save
    echo "PM2: Aplikacja zrestartowana."
else
    echo "BŁĄD: Komenda 'pm2' nie została znaleziona. Aplikacja działa na starym kodzie!"
    echo "Spróbuj dodać pełną ścieżkę do pm2 lub upewnij się, że jest w PATH."
    exit 1
fi

echo "Wdrożenie zakończone sukcesem!"
