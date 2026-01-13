'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor"; // Check if this export exists
import { upsertPost } from "../actions";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { Separator } from '@/components/ui/separator';

interface PostFormProps {
    initialData?: any;
}

export function PostForm({ initialData }: PostFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    
    // Form State
    const [title, setTitle] = useState(initialData?.title || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [status, setStatus] = useState(initialData?.status || 'draft');
    const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || '');
    const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
    
    // SEO
    const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
    const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');

    const generateSlug = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        // Auto-generate slug if it wasn't manually edited (or is empty) and we're creating
        if (!initialData && (!slug || slug === generateSlug(title))) {
            setSlug(generateSlug(newTitle));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        startTransition(async () => {
            try {
                await upsertPost({
                    id: initialData?.id,
                    title,
                    slug,
                    content,
                    status,
                    featuredImage,
                    excerpt,
                    metaTitle,
                    metaDescription,
                    // authorId TODO
                });
                toast.success('Zapisano wpis');
                router.push('/dashboard/shop/blog');
                router.refresh(); // Refresh list
            } catch (error) {
                console.error(error);
                toast.error('Błąd zapisu');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
            <div className="grid gap-6 p-6 border rounded-lg bg-white shadow-sm">
                <div className="grid gap-3">
                    <Label htmlFor="title">Tytuł artykułu</Label>
                    <Input 
                        id="title" 
                        value={title} 
                        onChange={handleTitleChange} 
                        placeholder="Np. Jak wybrać panele winylowe?" 
                        required 
                    />
                </div>

                <div className="grid gap-3">
                    <Label htmlFor="slug">Adres URL (slug)</Label>
                    <div className="flex items-center">
                        <span className="bg-gray-100 border border-r-0 rounded-l-md px-3 py-2 text-sm text-gray-500">
                            primepodloga.pl/blog/
                        </span>
                        <Input 
                            id="slug" 
                            value={slug} 
                            onChange={(e) => setSlug(e.target.value)} 
                            className="rounded-l-none"
                            placeholder="jak-wybrac-panele"
                            required
                        />
                    </div>
                </div>

                <div className="grid gap-3">
                    <Label>Treść</Label>
                    <div className="min-h-[400px] border rounded-md">
                        <RichTextEditor 
                            value={content} 
                            onChange={setContent} 
                        />
                    </div>
                </div>
                
                 <div className="grid gap-3">
                    <Label htmlFor="excerpt">Krótki opis (Wstęp)</Label>
                    <Textarea 
                        id="excerpt" 
                        value={excerpt} 
                        onChange={(e) => setExcerpt(e.target.value)} 
                        placeholder="Tekst wyświetlany na liście artykułów..."
                        rows={3}
                    />
                </div>
            </div>

            <div className="grid gap-6 p-6 border rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-medium">Ustawienia publikacji</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-3">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Szkic (Niepubliczny)</SelectItem>
                                <SelectItem value="published">Opublikowany (Widoczny)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="featuredImage">Zdjęcie główne (URL)</Label>
                        <Input 
                            id="featuredImage" 
                            value={featuredImage} 
                            onChange={(e) => setFeaturedImage(e.target.value)} 
                            placeholder="https://..." 
                        />
                        {featuredImage && (
                            <div className="mt-2 aspect-video w-40 rounded-md overflow-hidden bg-gray-100 border relative">
                                <img src={featuredImage} alt="Podgląd" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 p-6 border rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-medium">SEO (Google)</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-3">
                        <Label htmlFor="metaTitle">Tytuł SEO (Meta Title)</Label>
                        <Input 
                            id="metaTitle" 
                            value={metaTitle} 
                            onChange={(e) => setMetaTitle(e.target.value)} 
                            placeholder="Pozostaw puste, aby użyć tytułu artykułu" 
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="metaDescription">Opis SEO (Meta Description)</Label>
                        <Textarea 
                            id="metaDescription" 
                            value={metaDescription} 
                            onChange={(e) => setMetaDescription(e.target.value)} 
                            placeholder="Krótki opis widoczny w wynikach wyszukiwania..." 
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                 <Button type="button" variant="outline" onClick={() => router.back()}>
                    Anuluj
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Zapisywanie...' : 'Zapisz artykuł'}
                </Button>
            </div>
        </form>
    );
}
