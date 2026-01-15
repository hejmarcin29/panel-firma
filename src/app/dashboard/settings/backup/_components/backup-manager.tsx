'use client';

import { useState } from "react";
import { performDatabaseBackup, performCodeBackup, performFullBackup, getEnvFileContent } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2, Database, ShieldCheck, AlertTriangle, Key, FileCode, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface BackupFile {
    name: string;
    size: string;
    createdAt: Date;
}

export function BackupManager({ initialBackups }: { initialBackups: BackupFile[] }) {
    const [isBackingUpDb, setIsBackingUpDb] = useState(false);
    const [isBackingUpCode, setIsBackingUpCode] = useState(false);
    const [isBackingUpFull, setIsBackingUpFull] = useState(false);

    async function handleCreateBackupDb() {
        setIsBackingUpDb(true);
        try {
            const result = await performDatabaseBackup();
            if (result.success) {
                toast.success(result.message);
                window.location.reload(); 
            } else {
                toast.error("Błąd: " + result.message);
            }
        } catch (e) {
            toast.error("Wystąpił niespodziewany błąd.");
        } finally {
            setIsBackingUpDb(false);
        }
    }

    async function handleCreateBackupCode() {
        setIsBackingUpCode(true);
        try {
            const result = await performCodeBackup();
            if (result.success) {
                toast.success(result.message);
                window.location.reload(); 
            } else {
                toast.error("Błąd: " + result.message);
            }
        } catch (e) {
            toast.error("Wystąpił niespodziewany błąd.");
        } finally {
            setIsBackingUpCode(false);
        }
    }

    async function handleCreateFullBackup() {
        setIsBackingUpFull(true);
        try {
            const result = await performFullBackup();
            if (result.success) {
                toast.success(result.message);
                window.location.reload(); 
            } else {
                toast.error("Błąd: " + result.message);
            }
        } catch (e) {
            toast.error("Wystąpił niespodziewany błąd.");
        } finally {
            setIsBackingUpFull(false);
        }
    }

    async function handleDownloadEnv() {
        try {
            const content = await getEnvFileContent();
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `env_backup_${new Date().toISOString().slice(0,10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Pobrano plik konfiguracyjny .env");
        } catch (error) {
            toast.error("Nie udało się pobrać pliku .env");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                {/* HERO SECTION - PEŁNA KOPIA */}
                <Card className="border-indigo-200 bg-indigo-50/40 shadow-sm">
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <Package className="h-6 w-6 text-indigo-600" />
                            Pełna Kopia Systemu (All-in-One)
                        </CardTitle>
                        <CardDescription className="text-indigo-800/80">
                            Pobierz wszystko w jednej paczce: Kod źródłowy + Baza danych + Plik konfiguracyjny .env.
                            To zalecana metoda archiwizacji.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={handleCreateFullBackup} 
                            disabled={isBackingUpFull}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg shadow-md"
                        >
                            {isBackingUpFull ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Pakowanie całego systemu...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-5 w-5" />
                                    Utwórz i Pobierz Pełną Paczkę (.tar.gz)
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-emerald-100 bg-emerald-50/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Database className="h-4 w-4 text-emerald-600" />
                                Tylko Baza Danych
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                onClick={handleCreateBackupDb} 
                                disabled={isBackingUpDb}
                                variant="outline"
                                className="w-full border-emerald-200 hover:bg-emerald-100 text-emerald-800"
                            >
                                {isBackingUpDb ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>Utwórz .sql</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-100 bg-blue-50/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileCode className="h-4 w-4 text-blue-600" />
                                Tylko Kod
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                onClick={handleCreateBackupCode} 
                                disabled={isBackingUpCode}
                                variant="outline"
                                className="w-full border-blue-200 hover:bg-blue-100 text-blue-800"
                            >
                                {isBackingUpCode ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>Utwórz .tar.gz</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-100 bg-amber-50/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Key className="h-4 w-4 text-amber-600" />
                                Tylko .env
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                onClick={handleDownloadEnv} 
                                variant="outline"
                                className="w-full border-amber-200 hover:bg-amber-100 text-amber-900"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Pobierz
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Procedura Awaryjna (Disaster Recovery)</CardTitle>
                    <CardDescription>
                        Kompletny zestaw ratunkowy. Pobieraj wszystkie 3 elementy regularnie.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                    <p className="flex items-start gap-2">
                        <span className="font-bold text-foreground">1.</span>
                        Pobierz <span className="text-emerald-600 font-medium">Bazę Danych (.sql)</span> - zawiera Twoich klientów.
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">2.</span>
                        Pobierz <span className="text-blue-600 font-medium">Kod Źródłowy (.tar.gz)</span> - zawiera logikę panelu.
                    </p>
                     <p className="flex items-start gap-2">
                        <span className="font-bold text-amber-600">3.</span>
                        Pobierz <span className="text-amber-600 font-medium">Konfigurację (.env)</span> - zawiera hasła.
                    </p>
                    <p className="flex items-start gap-2 pt-2 border-t mt-2 text-xs">
                        W razie awarii: Rozpakuj kod, wgraj plik .env, wpisz <code>npm install</code>, a potem <code>npm run build</code>. Na końcu wgraj bazę danych.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Dostępne Kopie</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nazwa Pliku</TableHead>
                                <TableHead>Data utworzenia</TableHead>
                                <TableHead>Rozmiar</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialBackups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                        Brak kopii zapasowych. Utwórz pierwszą.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                initialBackups.map((file) => (
                                    <TableRow key={file.name}>
                                        <TableCell className="font-mono text-xs flex items-center gap-2">
                                            {file.name.includes('FULL') ? (
                                                <Package className="h-3 w-3 text-indigo-600" />
                                            ) : file.name.endsWith('.sql') ? (
                                                <Database className="h-3 w-3 text-emerald-600" />
                                            ) : (
                                                <FileCode className="h-3 w-3 text-blue-600" />
                                            )}
                                            {file.name}
                                        </TableCell>
                                        <TableCell>
                                            {format(file.createdAt, "d MMMM yyyy, HH:mm", { locale: pl })}
                                        </TableCell>
                                        <TableCell>{file.size}</TableCell>
                                        <TableCell className="text-right">
                                            <a download href={`/api/cron/backup/download?file=${file.name}`}>
                                                <Button size="sm" variant="outline">
                                                    <Download className="mr-2 h-3 w-3" />
                                                    Pobierz
                                                </Button>
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
