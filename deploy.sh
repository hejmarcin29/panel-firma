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

# Sprawdź i załaduj zmienne środowiskowe
if [ -f .env ]; then
  echo "Ładowanie zmiennych z .env..."
  export $(grep -v '^#' .env | xargs)
else
  echo "OSTRZEŻENIE: Brak pliku .env!"
fi

# Wygeneruj klienta bazy danych
npm run db:generate

# Zaaplikuj migracje bazy danych
echo "Aplikowanie migracji..."
npm run db:migrate

# Zbuduj aplikację
export NODE_OPTIONS="--max-old-space-size=4096"
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
