import { notFound } from 'next/navigation';
import { getPostBySlug } from '../actions';
import Link from 'next/link';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Metadata } from 'next';

interface PageProps {
    params: Promise<{
        slug: string;
    }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: 'Artykuł nie znaleziony',
        }
    }

    return {
        title: post.metaTitle || `${post.title} | Blog PrimePodloga.pl`,
        description: post.metaDescription || post.excerpt || `Przeczytaj artykuł: ${post.title}`,
        openGraph: {
            title: post.title,
            description: post.excerpt || undefined,
            images: post.featuredImage ? [post.featuredImage] : [],
            type: 'article',
            publishedTime: post.publishedAt?.toISOString(),
        }
    }
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    // JSON-LD Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': post.title,
        'image': post.featuredImage ? [post.featuredImage] : [],
        'datePublished': post.publishedAt?.toISOString(),
        'dateModified': post.updatedAt?.toISOString(),
        'author': [{
            '@type': 'Organization',
            'name': 'PrimePodloga.pl',
            'url': 'https://primepodloga.pl'
        }]
    };

    return (
        <article className="min-h-screen bg-white pb-20">
            {/* JSON-LD Script */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hero Header with Image */}
             <div className="relative w-full h-[40vh] min-h-[400px] bg-gray-900 flex items-center justify-center overflow-hidden">
                {post.featuredImage && (
                    <div className="absolute inset-0 z-0">
                         <div className="absolute inset-0 bg-black/60 z-10" />
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img 
                            src={post.featuredImage} 
                            alt={post.title} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                
                <div className="container px-4 relative z-20 text-center text-white max-w-4xl mx-auto">
                    <Link href="/blog" className="inline-flex items-center text-sm mb-6 hover:text-emerald-300 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do bloga
                    </Link>
                    <h1 className="text-3xl md:text-5xl font-bold font-playfair leading-tight mb-6">
                        {post.title}
                    </h1>
                     <div className="flex items-center justify-center gap-6 text-sm md:text-base text-gray-300">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Niedawno'}
                        </div>
                        {post.author && (
                             <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {post.author.name || post.author.email}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container px-4 py-12 max-w-3xl mx-auto">
                <div 
                    className="prose prose-lg prose-emerald max-w-none prose-img:rounded-xl prose-headings:font-playfair"
                    dangerouslySetInnerHTML={{ __html: post.content || '' }}
                />
            </div>
            
        </article>
    );
}
