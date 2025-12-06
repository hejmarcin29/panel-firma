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

echo "--- Uruchamianie Deploy v1 ---"

# Zainstaluj zależności
npm install

# Wygeneruj klienta bazy danych
npm run db:generate

# Zaaplikuj migracje bazy danych
# Używamy push zamiast migrate, aby uniknąć błędów "table already exists"
# gdy baza nie jest zsynchronizowana z historią migracji.
echo "Synchronizacja schematu (drizzle-kit push)..."
npm run db:push

# Zbuduj aplikację
# Ograniczamy zużycie pamięci poprzez zmniejszenie liczby wątków
export NEXT_CPU_COUNT=1
export NEXT_TELEMETRY_DISABLED=1

# Sprawdź czy jest swap (tylko informacyjnie)
if command -v free &> /dev/null; then
    if [ $(free | awk '/^Swap:/ {print $2}') -eq 0 ]; then
        echo "⚠️  OSTRZEŻENIE: Brak pliku wymiany (SWAP). Build może się nie udać."
    fi
fi

npm run build

# Zrestartuj aplikację (zakładając PM2)
echo "Restartowanie aplikacji..."
if command -v pm2 &> /dev/null; then
    pm2 restart panel || pm2 start npm --name "panel" -- start
    pm2 save
    echo "PM2: Aplikacja zrestartowana."
else
    echo "BŁĄD: Komenda 'pm2' nie została znaleziona."
    exit 1
fi

echo "Wdrożenie zakończone sukcesem!"
