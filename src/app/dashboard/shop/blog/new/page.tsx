import { PostForm } from '../_components/post-form';

export default function NewPostPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Nowy artykuł</h3>
                <p className="text-sm text-muted-foreground">
                    Tworzenie nowego wpisu na bloga.
                </p>
            </div>
            <PostForm />
        </div>
    );
}
