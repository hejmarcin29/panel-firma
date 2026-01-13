'use client';

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useRef } from "react";

export function SearchInput({ placeholder = "Szukaj produktu..." }: { placeholder?: string }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isPending, startTransition] = useTransition();

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    function handleSearch(term: string) {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (term) {
                params.set('q', term);
            } else {
                params.delete('q');
            }
            
            startTransition(() => {
                replace(`${pathname}?${params.toString()}`);
            });
        }, 300);
    }

    return (
        <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder={placeholder}
                className="pl-9 bg-white"
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get('q')?.toString()}
            />
             {isPending && (
                <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
             )}
        </div>
    );
}
