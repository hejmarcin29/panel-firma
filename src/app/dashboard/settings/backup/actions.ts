"use server";

import { readdir, stat } from "fs/promises";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { revalidatePath } from "next/cache";

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), "backups");

// Ensure backup directory exists (helper, though in server components we'd usually use fs.mkdir)
// We will rely on the performBackup to create it or assume it exists.

export async function getBackupsList() {
  try {
    const files = await readdir(BACKUP_DIR);
    const backups = await Promise.all(
      files
        .filter((file) => file.endsWith(".sql") || file.endsWith(".tar.gz"))
        .map(async (file) => {
          const stats = await stat(path.join(BACKUP_DIR, file));
          return {
            name: file,
            size: (stats.size / 1024 / 1024).toFixed(2) + " MB",
            createdAt: stats.birthtime,
          };
        })
    );
    // Sort identifying new ones first
    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    // Directory might not exist yet
    return [];
  }
}

export async function performCodeBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR);
    }
    
    // 1. Prepare filename and paths
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `backup_code_${timestamp}.tar.gz`;
    const outputPath = path.join(BACKUP_DIR, filename);

    // 2. Execute tar command
    // Exclude heavy/unnecessary folders: node_modules, .next, .git, backups (to avoid recursion)
    const command = `tar -czf "${outputPath}" --exclude=node_modules --exclude=.next --exclude=.git --exclude=backups .`;

    console.log("Starting code backup...");
    await execAsync(command);

    revalidatePath("/dashboard/settings/backup");
    return { success: true, filename, message: "Kopia kodu źródłowego (bez node_modules) została utworzona." };
  } catch (error) {
    console.error("Code backup failed:", error);
    return { success: false, message: error instanceof Error ? error.message : "Nieznany błąd podczas pakowania kodu." };
  }
}

export async function performDatabaseBackup() {
  try {
    // 1. Prepare filename and paths
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `backup_db_${timestamp}.sql`;
    const outputPath = path.join(BACKUP_DIR, filename);

    // Ensure dir exists
    if (!fs.existsSync(BACKUP_DIR)){
        fs.mkdirSync(BACKUP_DIR);
    }

    // 2. Parse Database Connection String
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined");
    }

    // 3. Execute pg_dump
    // PGPASSWORD env var is the safest way to pass password to pg_dump
    // Command: pg_dump --clean --if-exists --no-owner --no-privileges -f "output.sql" "connection_string"
    
    // We need to parse the DB URL to handle potential SSL requirements or specific pg_dump flags if needed.
    // However, pg_dump accepts the connection URI directly as a parameter.
    
    const command = `pg_dump "${connectionString}" -F p -f "${outputPath}" --clean --if-exists --no-owner --no-privileges`;

    console.log("Starting backup...");
    const { stderr } = await execAsync(command);
    
    if (stderr) {
       // pg_dump writes notices to stderr, it doesn't always mean error.
       console.log("Backup stderr (info):", stderr);
    }

    revalidatePath("/dashboard/settings/backup");
    return { success: true, filename, message: "Kopia zapasowa została utworzona pomyślnie." };

  } catch (error) {
    console.error("Backup failed:", error);
    return { success: false, message: error instanceof Error ? error.message : "Nieznany błąd podczas tworzenia kopii." };
  }
}

export async function getEnvFileContent() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        
        if (!fs.existsSync(envPath)) {
            // Try .env.local if .env doesn't exist
            const envLocalPath = path.join(process.cwd(), '.env.local');
            if (fs.existsSync(envLocalPath)) {
                return fs.readFileSync(envLocalPath, 'utf-8');
            }
            throw new Error("Nie znaleziono pliku .env ani .env.local");
        }
        
        return fs.readFileSync(envPath, 'utf-8');
    } catch {
        throw new Error("Błąd odczytu pliku konfiguracyjnego.");
    }
}

export async function performFullBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR);
    }
    
    // 1. Prepare filename and paths
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `backup_FULL_${timestamp}.tar.gz`;
    const outputPath = path.join(BACKUP_DIR, filename);
    const tempDbPath = path.join(BACKUP_DIR, "temp_full_db_snapshot.sql");

    // 2. Dump Database to temp file
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined");
    }
    const dbCommand = `pg_dump "${connectionString}" -F p -f "${tempDbPath}" --clean --if-exists --no-owner --no-privileges`;
    await execAsync(dbCommand);

    // 3. Execute tar command
    // We backup root (.) BUT we exclude 'backups' folder generally. 
    // However, we want to include the specific temp DB file we just created inside 'backups'.
    // tar can handle this by listing the file explicitly after the exclusions.
    // Note: We use relative path for the temp file to keep structure clean in archive.
    
    // On Windows/Git Bash, paths might need care. Using relative path from CWD.
    const relativeTempDbPath = path.relative(process.cwd(), tempDbPath);

    // Command structure: tar -czf output.tar.gz [excludes] . [include_file]
    const tarCommand = `tar -czf "${outputPath}" --exclude=node_modules --exclude=.next --exclude=.git --exclude=backups . "${relativeTempDbPath}"`;

    console.log("Starting FULL backup...");
    await execAsync(tarCommand);

    // 4. Cleanup temp file
    if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
    }

    revalidatePath("/dashboard/settings/backup");
    return { success: true, filename, message: "Pełna kopia (Kod + Baza + Env) została utworzona." };
  } catch (error) {
    console.error("Full backup failed:", error);
    return { success: false, message: error instanceof Error ? error.message : "Nieznany błąd podczas tworzenia pełnej kopii." };
  }
}
