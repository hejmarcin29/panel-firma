$ErrorActionPreference = "Stop"

# Konfiguracja
$RemoteHost = "b2b.primepodloga.pl"
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
$BackupFile = "$LocalBackupDir\backup_$Date.sql"

Write-Host "⏳ Rozpoczynam pobieranie backupu bazy danych z $RemoteHost..." -ForegroundColor Cyan

# Komenda do wykonania na serwerze:
# 1. Wczytuje zmienne z pliku .env (w tym DATABASE_URL)
# 2. Uruchamia pg_dump korzystając z tej zmiennej
# Używamy 'set -a; source .env; set +a' dla pewności wczytania zmiennych w bashu
$RemoteCommand = "cd $RemoteAppPath && set -a && source .env && set +a && pg_dump `$DATABASE_URL"

# Wykonanie SSH i zapisanie wyniku do pliku
# Używamy cmd /c aby uniknąć problemów z kodowaniem w PowerShell przy przekierowaniu strumienia
cmd /c "ssh $RemoteUser@$RemoteHost ""$RemoteCommand"" > ""$BackupFile"""

if ($LASTEXITCODE -eq 0) {
    $FileSize = (Get-Item $BackupFile).Length / 1MB
    $FileSizeFormatted = "{0:N2} MB" -f $FileSize
    Write-Host "✅ Backup zakończony sukcesem!" -ForegroundColor Green
    Write-Host "📁 Zapisano w: $BackupFile ($FileSizeFormatted)" -ForegroundColor Green
} else {
    Write-Host "❌ Wystąpił błąd podczas tworzenia backupu." -ForegroundColor Red
    if (Test-Path $BackupFile) { Remove-Item $BackupFile }
}
