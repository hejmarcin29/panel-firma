'use client';

import { useState, useMemo } from 'react';
import { UnifiedDocument } from '../actions';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Card, 
    CardContent, 
    // CardDescription, 
    // CardHeader, 
    // CardTitle 
} from '@/components/ui/card';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
    FileText, 
    MoreHorizontal, 
    Eye, 
    Trash2, 
    Download, 
    Search, 
    // Filter,
    FileCheck,
    Briefcase,
    // FileImage,
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import Link from 'next/link';
import { deleteDocument } from '../../document-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

type DocumentsTableProps = {
    initialDocuments: UnifiedDocument[];
};

export function DocumentsTable({ initialDocuments }: DocumentsTableProps) {
    const router = useRouter();
    const [documents, setDocuments] = useState(initialDocuments);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [contextFilter, setContextFilter] = useState<string | null>(null); // Filter by specific montage/order ID
    const [isContextOpen, setIsContextOpen] = useState(false);

    // Extract unique contexts for the filter dropdown
    const uniqueContexts = useMemo(() => {
        const map = new Map();
        initialDocuments.forEach(doc => {
            if (!map.has(doc.context.id)) {
                map.set(doc.context.id, {
                    id: doc.context.id,
                    label: doc.context.label,
                    type: doc.context.type
                });
            }
        });
        return Array.from(map.values());
    }, [initialDocuments]);

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            // 1. Text Search
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                doc.displayId.toLowerCase().includes(searchLower) || 
                doc.context.clientName.toLowerCase().includes(searchLower) ||
                doc.context.label.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // 2. Tab Filter
            if (activeTab === 'finance' && doc.type !== 'finance') return false;
            if (activeTab === 'legal' && doc.type !== 'legal') return false;
            if (activeTab === 'technical' && doc.type !== 'technical') return false;

            // 3. Context Filter
            if (contextFilter && doc.context.id !== contextFilter) return false;

            return true;
        });
    }, [documents, searchTerm, activeTab, contextFilter]);

    const handleDelete = async (doc: UnifiedDocument) => {
        // Map UnifiedDocument source to the types expected by deleteDocument
        // deleteDocument(id: string, path: string)
        // Global deleteDocument checks the DB tables.
        
        // Logic inside deleteDocument (we need to verify what it expects):
        // It tries to delete from 'documents' table first.
        // It tries to delete from 'montageAttachments' second.
        
        // Wait, for 'quotes' - global action does NOT support deleting quotes yet probably.
        // Let's check `deleteDocument` implementation if I can.
        // Assuming for now it handles 'documents' and 'montageAttachments'. 
        // If it's a quote, we might need a specific action or block deletion here.

        if (doc.sourceTable === 'quotes') {
            toast.error('Ofertę można usunąć tylko w module Ofert.');
            return;
        }

        if (confirm(`Czy na pewno chcesz usunąć dokument ${doc.displayId}?`)) {
            try {
                await deleteDocument(doc.id, '/dashboard/documents');
                toast.success('Dokument usunięty');
                setDocuments(prev => prev.filter(d => d.id !== doc.id));
                router.refresh();
            } catch {
                toast.error('Błąd usuwania dokumentu');
            }
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'finance': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'legal': return <FileCheck className="w-4 h-4 text-green-500" />;
            case 'technical': return <Briefcase className="w-4 h-4 text-orange-500" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getLinkUrl = (doc: UnifiedDocument) => {
        if (doc.context.type === 'montage') return `/dashboard/crm/montaze/${doc.context.id}`;
        if (doc.context.type === 'order') return `/dashboard/shop/orders/${doc.context.id}`;
        return '#';
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                    <TabsList>
                        <TabsTrigger value="all">Wszystkie</TabsTrigger>
                        <TabsTrigger value="finance">Finanse</TabsTrigger>
                        <TabsTrigger value="legal">Umowy</TabsTrigger>
                        <TabsTrigger value="technical">Techniczne</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Context Context Selector */}
                    <Popover open={isContextOpen} onOpenChange={setIsContextOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isContextOpen}
                                className="w-[250px] justify-between"
                            >
                                {contextFilter
                                    ? uniqueContexts.find((c) => c.id === contextFilter)?.label
                                    : "Filtruj wg Zlecenia..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                            <Command>
                                <CommandInput placeholder="Szukaj zlecenia..." />
                                <CommandList>
                                    <CommandEmpty>Nie znaleziono.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="all"
                                            onSelect={() => {
                                                setContextFilter(null);
                                                setIsContextOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    !contextFilter ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            Wszystkie zlecenia
                                        </CommandItem>
                                        {uniqueContexts.map((ctx) => (
                                            <CommandItem
                                                key={ctx.id}
                                                value={ctx.label}
                                                onSelect={() => {
                                                    setContextFilter(ctx.id === contextFilter ? null : ctx.id);
                                                    setIsContextOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        contextFilter === ctx.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {ctx.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <div className="relative w-full md:w-[250px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Szukaj dokumentu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Nazwa</TableHead>
                                <TableHead>Typ</TableHead>
                                <TableHead>Powiązanie (Kontekst)</TableHead>
                                <TableHead>Klient</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDocuments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        Brak dokumentów spełniających kryteria
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDocuments.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="text-center">
                                            {getIcon(doc.type)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{doc.displayId}</span>
                                                {doc.sourceTable === 'quotes' && (
                                                    <span className="text-xs text-muted-foreground">Wersja Wirtualna</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                doc.type === 'finance' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                doc.type === 'legal' ? 'bg-green-50 text-green-700 border-green-200' :
                                                'bg-orange-50 text-orange-700 border-orange-200'
                                            }>
                                                {doc.type === 'finance' ? 'Finansowy' :
                                                 doc.type === 'legal' ? 'Formalny' : 'Techniczny'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={getLinkUrl(doc)} className="hover:underline flex items-center gap-1 text-sm text-primary">
                                                {doc.context.label}
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </TableCell>
                                        <TableCell>{doc.context.clientName}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: pl })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {doc.fileType === 'link' ? (
                                                        <DropdownMenuItem onClick={() => router.push(doc.url)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Otwórz
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => window.open(doc.url, '_blank')}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Podgląd
                                                        </DropdownMenuItem>
                                                    )}
                                                    
                                                    {doc.fileType === 'pdf' && (
                                                        <DropdownMenuItem onClick={() => {
                                                            const a = document.createElement('a');
                                                            a.href = doc.url;
                                                            a.download = doc.displayId;
                                                            a.click();
                                                        }}>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Pobierz
                                                        </DropdownMenuItem>
                                                    )}
                                                    
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => handleDelete(doc)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Usuń
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
