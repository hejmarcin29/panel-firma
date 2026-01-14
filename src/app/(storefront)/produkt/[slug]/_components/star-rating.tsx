'use client';

import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number; // 0-5
    count?: number; // Number of reviews
    size?: "sm" | "md" | "lg";
    showCount?: boolean;
    className?: string;
    onClick?: () => void;
}

export function StarRating({ 
    rating, 
    count, 
    size = "sm", 
    showCount = true, 
    className,
    onClick 
}: StarRatingProps) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(<Star key={i} className="fill-amber-400 text-amber-400" />);
        } else if (i === fullStars && hasHalfStar) {
            stars.push(<StarHalf key={i} className="fill-amber-400 text-amber-400" />); // Lucide doesn't have native half-star filled perfectly usually, but let's assume standard Star with fill
            // Actually Lucide StarHalf is half-filled.
        } else {
            stars.push(<Star key={i} className="text-gray-300" />);
        }
    }

    const sizeClasses = {
        sm: "h-3.5 w-3.5",
        md: "h-5 w-5",
        lg: "h-6 w-6"
    };

    return (
        <div 
            className={cn("flex items-center gap-1.5", onClick && "cursor-pointer group", className)}
            onClick={onClick}
        >
            <div className="flex gap-0.5">
                {stars.map((star, idx) => (
                    <div key={idx} className={sizeClasses[size]}>
                        {star}
                    </div>
                ))}
            </div>
            {showCount && count !== undefined && (
                <span className={cn(
                    "text-muted-foreground", 
                    size === 'sm' ? "text-xs" : "text-sm",
                    onClick && "group-hover:text-primary transition-colors"
                )}>
                    ({count})
                </span>
            )}
        </div>
    );
}
