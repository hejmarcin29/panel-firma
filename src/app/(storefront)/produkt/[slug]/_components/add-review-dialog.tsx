'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitReview } from "./reviews-actions";
import { cn } from "@/lib/utils";

interface AddReviewDialogProps {
    productId: string;
    productName: string;
}

export function AddReviewDialog({ productId, productName }: AddReviewDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rating, setRating] = useState(5);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        try {
            await submitReview({
                productId,
                authorName: formData.get('name') as string,
                content: formData.get('content') as string,
                rating: rating,
            });
            toast.success("Dziękujemy! Opinia została wysłana do moderacji.");
            setOpen(false);
        } catch {
            toast.error("Wystąpił błąd podczas wysyłania opinii.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full md:w-auto">
                    Napisz opinię
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Napisz opinię</DialogTitle>
                    <DialogDescription>
                        Oceń produkt <span className="font-semibold">{productName}</span>. Twoja opinia pomoże innym klientom.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="space-y-6 py-4">
                    {/* Star Rating Select */}
                    <div className="flex flex-col items-center gap-2">
                        <Label>Twoja ocena</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRating(value)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star 
                                        className={cn(
                                            "h-8 w-8 transition-colors", 
                                            value <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                                        )} 
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                            {rating === 5 && "Rewelacja!"}
                            {rating === 4 && "Dobry produkt"}
                            {rating === 3 && "Przeciętny"}
                            {rating === 2 && "Słaby"}
                            {rating === 1 && "Nie polecam"}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="name">Imię / Pseudonim</Label>
                        <Input id="name" name="name" placeholder="np. Jan" required minLength={2} />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="content">Treść opinii</Label>
                        <Textarea 
                            id="content" 
                            name="content" 
                            placeholder="Co sądzisz o jakości, wyglądzie i montażu?" 
                            required 
                            minLength={5}
                            className="min-h-[100px]"
                        />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Wysyłanie..." : "Dodaj opinię"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
