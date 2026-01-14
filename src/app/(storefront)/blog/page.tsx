import Link from 'next/link';
import { getPublishedPosts } from './actions';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Blog | PrimePodloga.pl',
    description: 'Porady, inspiracje i wiedza na temat paneli winylowych i montażu podłóg.',
};

export default async function BlogPage() {
    const posts = await getPublishedPosts();

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-10">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold font-playfair mb-4">Blog & Porady</h1>
                    <p className="text-gray-600 text-lg">
                        Wiedza, inspiracje i praktyczne wskazówki od naszych ekspertów.
                    </p>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        Jeszcze nie dodaliśmy żadnych artykułów. Zajrzyj tu wkrótce!
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <Card key={post.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow border-gray-200">
                                <Link href={`/blog/${post.slug}`} className="block aspect-video overflow-hidden bg-gray-100 relative group">
                                    {post.featuredImage ? (
                                        <img 
                                            src={post.featuredImage} 
                                            alt={post.title} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                                            Brak zdjęcia
                                        </div>
                                    )}
                                </Link>
                                <CardHeader className="p-6 pb-3">
                                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium mb-3 uppercase tracking-wider">
                                        <CalendarIcon className="h-3 w-3" />
                                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Niedawno'}
                                    </div>
                                    <Link href={`/blog/${post.slug}`}>
                                        <h3 className="text-xl font-bold font-playfair hover:text-emerald-700 transition-colors line-clamp-2">
                                            {post.title}
                                        </h3>
                                    </Link>
                                </CardHeader>
                                <CardContent className="px-6 py-0 grow">
                                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                                        {post.excerpt || (post.content ? stripHtml(post.content).slice(0, 150) + '...' : '')}
                                    </p>
                                </CardContent>
                                <CardFooter className="p-6 pt-6 mt-auto">
                                    <Button variant="link" className="p-0 h-auto text-emerald-600 font-semibold hover:no-underline hover:text-emerald-700" asChild>
                                        <Link href={`/blog/${post.slug}`}>
                                            Czytaj więcej &rarr;
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function stripHtml(html: string) {
   return html.replace(/<[^>]*>?/gm, '');
}
