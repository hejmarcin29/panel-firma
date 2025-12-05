#!/bin/bash
set -e

# Przejdź do katalogu aplikacji
cd /srv/panel

# Pobierz najnowsze zmiany (wymuś zgodność z repozytorium)
git fetch origin main
git reset --hard origin/main

# Zainstaluj zależności
npm install

# Wygeneruj klienta bazy danych
# npm run db:generate

# Zaaplikuj migracje bazy danych
# Używamy migrate, aby bezpiecznie aplikować zmiany z plików migracji
npm run db:migrate

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
