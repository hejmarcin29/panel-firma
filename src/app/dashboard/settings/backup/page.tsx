import { BackupManager } from "./_components/backup-manager";
import { getBackupsList } from "./actions";

export default async function BackupPage() {
    const backups = await getBackupsList();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Backup & Restore</h3>
                <p className="text-sm text-muted-foreground">
                    Zarządzaj kopiami zapasowymi bazy danych. Pamiętaj o regularnym pobieraniu kopii na dysk lokalny.
                </p>
            </div>
            
            <BackupManager initialBackups={backups} />
        </div>
    );
}
