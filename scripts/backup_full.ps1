$ErrorActionPreference = "Stop"

# Konfiguracja
$RemoteHost = "b2b.primepodloga.pl"
$RemotePort = "7722"
$RemoteUser = "deploy"
$RemoteAppPath = "/srv/panel"
$LocalBackupDir = "backups"

# Tworzenie katalogu na backupy
if (!(Test-Path $LocalBackupDir)) {
    New-Item -ItemType Directory -Path $LocalBackupDir | Out-Null
    Write-Host "Utworzono katalog: $LocalBackupDir" -ForegroundColor Gray
}

# Generowanie nazwy pliku z datą
$Date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupDbFile = "$LocalBackupDir\backup_db_$Date.sql"
$BackupAppFile = "$LocalBackupDir\backup_app_$Date.tar.gz"

# ---------------------------------------------------------
# 1. BACKUP BAZY DANYCH
# ---------------------------------------------------------
Write-Host "⏳ [1/2] Pobieranie backupu bazy danych (port $RemotePort)..." -ForegroundColor Cyan

# Komenda: wczytaj .env i zrób pg_dump
$DbCommand = "cd $RemoteAppPath && set -a && source .env && set +a && pg_dump `$DATABASE_URL"

# Wykonanie SSH i zapis do pliku
cmd /c "ssh -p $RemotePort $RemoteUser@$RemoteHost ""$DbCommand"" > ""$BackupDbFile"""

if ($LASTEXITCODE -eq 0) {
    $DbSize = (Get-Item $BackupDbFile).Length / 1MB
    Write-Host ("   ✅ Baza pobrana: {0:N2} MB" -f $DbSize) -ForegroundColor Green
} else {
    Write-Host "   ❌ Błąd pobierania bazy!" -ForegroundColor Red
}

# ---------------------------------------------------------
# 2. BACKUP PLIKÓW APLIKACJI
# ---------------------------------------------------------
Write-Host "⏳ [2/2] Pobieranie plików aplikacji (tar.gz)..." -ForegroundColor Cyan
Write-Host "   Pomijam: node_modules, .next, .git, logi..." -ForegroundColor Gray

# Komenda: tar katalogu bieżącego z wykluczeniami
# Wykluczamy rzeczy, które można odtworzyć (node_modules, .next) lub są w repo (.git)
# Ale pobieramy .env, public, src itp.
$AppCommand = "cd $RemoteAppPath && tar -czf - --exclude=node_modules --exclude=.next --exclude=.git --exclude=npm-debug.log --exclude=*.log ."

# Wykonanie SSH i zapis do pliku (binarnie przez cmd /c >)
cmd /c "ssh -p $RemotePort $RemoteUser@$RemoteHost ""$AppCommand"" > ""$BackupAppFile"""

if ($LASTEXITCODE -eq 0) {
    $AppSize = (Get-Item $BackupAppFile).Length / 1MB
    Write-Host ("   ✅ Pliki pobrane: {0:N2} MB" -f $AppSize) -ForegroundColor Green
} else {
    Write-Host "   ❌ Błąd pobierania plików!" -ForegroundColor Red
}

# Podsumowanie
Write-Host "`n🎉 Backup zakończony!" -ForegroundColor Green
Write-Host "📂 Lokalizacja: $(Resolve-Path $LocalBackupDir)" -ForegroundColor Gray
