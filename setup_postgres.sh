#!/bin/bash
set -e

# Konfiguracja
DB_NAME="panel_firma"
DB_USER="panel_user"
# Generowanie losowego hasła (16 znaków)
DB_PASSWORD=$(openssl rand -base64 12)

echo "--- Instalacja PostgreSQL ---"

# 1. Aktualizacja i instalacja pakietów
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 2. Uruchomienie usługi
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Konfiguracja bazy danych
# Sprawdź czy użytkownik już istnieje
if sudo -u postgres psql -t -c '\du' | cut -d \| -f 1 | grep -qw "$DB_USER"; then
    echo "Użytkownik $DB_USER już istnieje. Pomijam tworzenie."
else
    echo "Tworzenie użytkownika $DB_USER..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
fi

# Sprawdź czy baza już istnieje
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Baza $DB_NAME już istnieje. Pomijam tworzenie."
else
    echo "Tworzenie bazy $DB_NAME..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
fi

echo ""
echo "--- SUKCES! ---"
echo "Twoja baza danych została skonfigurowana."
echo ""
echo "Skopiuj poniższy Connection String i wklej go do pliku .env:"
echo ""
echo "DATABASE_URL=\"postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME\""
echo ""
echo "Zapisz to hasło w bezpiecznym miejscu!"
