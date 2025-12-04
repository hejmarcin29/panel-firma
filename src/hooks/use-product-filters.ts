import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function useProductFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Function to update URL
  const setFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === null) {
      params.delete(key);
    } else {
      // Logic: overwrite or append (for multiselect)
      // For checkboxes: brands=egibi,quick-step
      const current = params.get(key);
      if (current) {
         const values = current.split(',');
         if (values.includes(value)) {
             const newValues = values.filter(v => v !== value);
             if (newValues.length > 0) {
                 params.set(key, newValues.join(','));
             } else {
                 params.delete(key);
             }
         } else {
             params.set(key, [...values, value].join(','));
         }
      } else {
        params.set(key, value);
      }
    }

    // Reset page when filtering
    params.delete('page');

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const setSingleFilter = useCallback((key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) {
          params.delete(key);
      } else {
          params.set(key, value);
      }
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  return { searchParams, setFilter, setSingleFilter };
}
