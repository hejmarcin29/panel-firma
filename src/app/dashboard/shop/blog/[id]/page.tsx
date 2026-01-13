import { PostForm } from '../_components/post-form';
import { getPost } from '../actions';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{
        id: string;
    }>
}

export default async function EditPostPage({ params }: PageProps) {
    const { id } = await params;
    const post = await getPost(id);

    if (!post) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Edycja artykułu</h3>
                <p className="text-sm text-muted-foreground">
                    Edytujesz: {post.title}
                </p>
            </div>
            <PostForm initialData={post} />
        </div>
    );
}
