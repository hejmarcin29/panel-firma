"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, sortLabels, type SortOption } from "../constants";

export function MontageSortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = (searchParams.get("sort") as SortOption) || SORT_OPTIONS.LAST_ACTIVITY;

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline-block">Sortuj:</span>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder="Sortowanie" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(SORT_OPTIONS).map((option) => (
            <SelectItem key={option} value={option} className="text-xs">
              {sortLabels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
