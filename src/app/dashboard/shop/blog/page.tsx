import { getPosts, deletePost } from './actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeletePostButton } from './_components/delete-post-button';
import { ImportButton } from './_components/import-button';

export default async function BlogListPage() {
    const posts = await getPosts();

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Blog</h3>
                    <p className="text-sm text-muted-foreground">
                        Zarządzanie artykułami i treściami w sklepie.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ImportButton />
                    <Button asChild>
                        <Link href="/dashboard/shop/blog/new">
                            <Plus className="mr-2 h-4 w-4" /> Dodaj wpis
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b bg-muted/50">
                            <th className="h-12 px-4 text-left align-middle font-medium">Zdjęcie</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Tytuł</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Data publikacji</th>
                            <th className="h-12 px-4 text-right align-middle font-medium">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                    Brak wpisów. Dodaj pierwszy artykuł!
                                </td>
                            </tr>
                        )}
                        {posts.map((post) => (
                            <tr key={post.id} className="border-b hover:bg-muted/50 transition-colors">
                                <td className="p-4 w-[100px]">
                                    {post.featuredImage ? (
                                        <img src={post.featuredImage} alt="" className="h-12 w-20 object-cover rounded-md bg-muted" />
                                    ) : (
                                        <div className="h-12 w-20 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                            Brak
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 font-medium">
                                    {post.title}
                                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                        /{post.slug}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {post.status === 'published' ? (
                                        <Badge className="bg-emerald-500 hover:bg-emerald-600">Opublikowany</Badge>
                                    ) : (
                                        <Badge variant="secondary">Szkic</Badge>
                                    )}
                                </td>
                                <td className="p-4 text-muted-foreground">
                                    {post.publishedAt ? post.publishedAt.toLocaleDateString() : '-'}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={`/blog/${post.slug}`} target="_blank" title="Podgląd">
                                                <Eye className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/dashboard/shop/blog/${post.id}`} title="Edytuj">
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <DeletePostButton id={post.id} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
