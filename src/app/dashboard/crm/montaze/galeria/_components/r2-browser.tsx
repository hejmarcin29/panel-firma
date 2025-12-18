'use client';

import { useState, useEffect, useTransition } from 'react';
import { Folder, Home, FileText, Download, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getR2Items } from '../actions';
import { GalleryObject } from '@/lib/r2/storage';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface R2BrowserProps {
    initialPrefix?: string;
}

export function R2Browser({ initialPrefix = '' }: R2BrowserProps) {
    const [currentPrefix, setCurrentPrefix] = useState(initialPrefix);
    const [items, setItems] = useState<{ folders: string[], files: GalleryObject[] }>({ folders: [], files: [] });
    const [isPending, startTransition] = useTransition();
    const [history, setHistory] = useState<string[]>([]);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'images' | 'documents'>('all');

    const loadItems = (prefix: string) => {
        startTransition(async () => {
            try {
                const result = await getR2Items(prefix);
                setItems(result);
            } catch (error) {
                console.error("Failed to load R2 items", error);
            }
        });
    };

    useEffect(() => {
        loadItems(currentPrefix);
    }, [currentPrefix]);

    const handleFolderClick = (folderPrefix: string) => {
        setHistory([...history, currentPrefix]);
        setSearchQuery('');
        setCurrentPrefix(folderPrefix);
    };

    const handleBreadcrumbClick = (index: number) => {
        const segments = currentPrefix.split('/').filter(Boolean);
        const newPath = segments.slice(0, index + 1).join('/') + '/';
        
        setSearchQuery('');
        if (index === -1) {
             setCurrentPrefix('');
        } else {
             setCurrentPrefix(newPath);
        }
    };

    const getFolderName = (prefix: string) => {
        const parts = prefix.split('/').filter(Boolean);
        return parts[parts.length - 1];
    };

    const breadcrumbs = currentPrefix.split('/').filter(Boolean);

    // Filtering Logic
    const filteredFolders = items.folders.filter(folder => 
        getFolderName(folder).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFiles = items.files.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isImage = /\.(jpg|jpeg|png|gif|webp|avif|bmp)$/i.test(file.name);
        
        if (!matchesSearch) return false;

        if (filterType === 'images') return isImage;
        if (filterType === 'documents') return !isImage;
        
        return true;
    });

    return (
        <div className="space-y-4">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col gap-4 bg-muted/30 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink 
                                    className="cursor-pointer flex items-center gap-1"
                                    onClick={() => handleBreadcrumbClick(-1)}
                                >
                                    <Home className="h-4 w-4" />
                                    Root
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs.map((segment, index) => (
                                <div key={index} className="flex items-center">
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        {index === breadcrumbs.length - 1 ? (
                                            <BreadcrumbPage>{segment}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink 
                                                className="cursor-pointer"
                                                onClick={() => handleBreadcrumbClick(index)}
                                            >
                                                {segment}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </div>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                    <Button variant="ghost" size="icon" onClick={() => loadItems(currentPrefix)} disabled={isPending}>
                        <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Szukaj w tym folderze..." 
                            className="pl-9 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Tabs value={filterType} onValueChange={(v) => setFilterType(v as 'all' | 'images' | 'documents')} className="w-full sm:w-auto">
                        <TabsList>
                            <TabsTrigger value="all">Wszystkie</TabsTrigger>
                            <TabsTrigger value="images">Zdjęcia</TabsTrigger>
                            <TabsTrigger value="documents">Dokumenty</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Folders */}
                {filteredFolders.map((folder) => (
                    <Card 
                        key={folder} 
                        className="cursor-pointer hover:bg-accent/50 transition-colors border-dashed border-2"
                        onClick={() => handleFolderClick(folder)}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center h-full">
                            <Folder className="h-12 w-12 text-blue-400 fill-blue-400/20" />
                            <span className="text-sm font-medium truncate w-full" title={getFolderName(folder)}>
                                {getFolderName(folder)}
                            </span>
                        </CardContent>
                    </Card>
                ))}

                {/* Files */}
                {filteredFiles.map((file) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|avif|bmp)$/i.test(file.key);
                    return (
                        <Card key={file.key} className="group relative overflow-hidden hover:shadow-md transition-all">
                            <CardContent className="p-0 h-full">
                                <div className="aspect-square relative bg-muted/20 flex items-center justify-center overflow-hidden">
                                    {isImage ? (
                                        <Image 
                                            src={file.previewUrl} 
                                            alt={file.name} 
                                            fill 
                                            className="object-cover transition-transform group-hover:scale-105"
                                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                                        />
                                    ) : (
                                        <FileText className="h-12 w-12 text-slate-400" />
                                    )}
                                    
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="icon" variant="secondary" asChild className="h-8 w-8 rounded-full">
                                            <a href={file.previewUrl} target="_blank" rel="noopener noreferrer" download>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                
                {/* Empty State */}
                {!isPending && filteredFolders.length === 0 && filteredFiles.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        <div className="flex justify-center mb-3">
                            {searchQuery ? <Search className="h-12 w-12 opacity-20" /> : <Folder className="h-12 w-12 opacity-20" />}
                        </div>
                        <p>{searchQuery ? 'Brak wyników wyszukiwania' : 'Ten folder jest pusty'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
