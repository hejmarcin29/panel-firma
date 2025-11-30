#!/bin/bash
set -e

# Przejdź do katalogu aplikacji
cd /srv/panel

# Pobierz najnowsze zmiany
git pull origin main

# Zainstaluj zależności
npm install

# Wygeneruj klienta bazy danych
npm run db:generate

# Zaaplikuj migracje bazy danych
# Używamy push, aby zsynchronizować schemat (dla SQLite)
npx drizzle-kit push

# Wyczyść cache Next.js (opcjonalne, ale pomaga przy problemach)
rm -rf .next

# Zbuduj aplikację
npm run build

# Zrestartuj aplikację (zakładając PM2)
# Jeśli używasz innej metody (np. systemd), dostosuj tę linię
if command -v pm2 &> /dev/null; then
    pm2 restart panel || pm2 start npm --name "panel" -- start
else
    echo "PM2 nie znaleziony. Pamiętaj o ręcznym restarcie aplikacji."
fi

echo "Wdrożenie zakończone sukcesem!"
