'use client';

import { StarRating } from "./star-rating";
import { AddReviewDialog } from "./add-review-dialog";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Review {
    id: string;
    authorName: string | null;
    rating: number;
    content: string | null;
    createdAt: Date;
    isVerified: boolean;
}

interface ProductReviewsProps {
    productId: string;
    productName: string;
    reviews: Review[];
}

export function ProductReviews({ productId, productName, reviews }: ProductReviewsProps) {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews 
        : 0;

    // Calculate distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    reviews.forEach(r => {
        const rounded = Math.round(r.rating);
        if (distribution[rounded] !== undefined) distribution[rounded]++;
    });

    return (
        <div id="opinie" className="scroll-mt-24 space-y-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
                
                {/* Summary Column */}
                <div className="shrink-0 lg:w-[320px] space-y-6">
                    <h2 className="text-2xl font-bold">Opinie klientów</h2>
                    
                    <div className="flex items-baseline gap-4">
                        <span className="text-5xl font-bold tracking-tight">
                            {averageRating.toFixed(1).replace('.', ',')}
                        </span>
                        <div className="flex flex-col">
                            <StarRating rating={averageRating} showCount={false} size="md" />
                            <span className="text-sm text-muted-foreground mt-1">
                                na podstawie {totalReviews} opinii
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = distribution[star] || 0;
                            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                            
                            return (
                                <div key={star} className="flex items-center gap-3 text-sm">
                                    <div className="flex items-center w-8 gap-1">
                                        <span className="font-medium">{star}</span> 
                                        <span className="text-muted-foreground text-xs">★</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                    <div className="w-8 text-right text-muted-foreground text-xs">
                                        {count}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <AddReviewDialog productId={productId} productName={productName} />
                </div>

                {/* Reviews List Column */}
                <div className="flex-1 space-y-8">
                    {reviews.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl p-8 text-center text-muted-foreground border border-dashed">
                            <p className="mb-4">Ten produkt nie ma jeszcze opinii.</p>
                            <p className="text-sm">Bądź pierwszy i podziel się swoimi wrażeniami!</p>
                        </div>
                    ) : (
                        <div className="space-y-6 divide-y">
                            {reviews.map((review) => (
                                <div key={review.id} className="pt-6 first:pt-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-100 rounded-full p-1.5">
                                                <User className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <span className="font-semibold text-gray-900">
                                                {review.authorName || 'Klient'}
                                            </span>
                                            {review.isVerified && (
                                                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 gap-1 text-[10px] h-5 px-1.5 font-normal">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Potwierdzony zakup
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(review.createdAt), "d MMMM yyyy", { locale: pl })}
                                        </span>
                                    </div>
                                    
                                    <StarRating rating={review.rating} showCount={false} size="sm" className="mb-3" />
                                    
                                    <p className="text-gray-700 leading-relaxed">
                                        {review.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
