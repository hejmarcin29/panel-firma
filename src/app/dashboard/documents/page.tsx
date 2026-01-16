import { Suspense } from 'react';
import { getCompanyDocuments } from './actions';
import { DocumentsTable } from './_components/documents-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, FileCheck, Briefcase } from 'lucide-react';

export default async function DocumentsPage() {
    const documents = await getCompanyDocuments();

    // Calculate generic stats
    const stats = {
        finance: documents.filter(d => d.type === 'finance').length,
        legal: documents.filter(d => d.type === 'legal').length,
        technical: documents.filter(d => d.type === 'technical').length
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Archiwum Dokumentów</h2>
                    <p className="text-muted-foreground">
                        Centralny rejestr wszystkich dokumentów, umów i faktur w firmie.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Dokumenty Finansowe
                        </CardTitle>
                        <FileText className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.finance}</div>
                        <p className="text-xs text-muted-foreground">
                            Faktury, Proformy
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Umowy i Protokoły
                        </CardTitle>
                        <FileCheck className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.legal}</div>
                        <p className="text-xs text-muted-foreground">
                            Podpisane dokumenty
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Techniczne
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.technical}</div>
                        <p className="text-xs text-muted-foreground">
                            Szkice, Plany, Inne
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Suspense fallback={<div>Ładowanie dokumentów...</div>}>
                <DocumentsTable initialDocuments={documents} />
            </Suspense>
        </div>
    );
}
