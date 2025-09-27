"use client";
import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu';

export function CalendarFilters({ installers, selectedInstaller }: { installers: { id: string | null; name: string | null }[]; selectedInstaller?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (next: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(searchParams?.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`${pathname}?${sp.toString()}`);
  };

  const currentLabel = React.useMemo(() => {
    if (!selectedInstaller) return 'Wszyscy montażyści';
    const m = installers.find(i => i.id === selectedInstaller);
    return m?.name || 'Montażysta';
  }, [installers, selectedInstaller]);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu trigger={<span>Filtr: {currentLabel}</span>}>
        <div className="px-1 py-1 text-xs opacity-60">Montażysta</div>
        <DropdownItem onSelect={() => apply({ installer: undefined })}>Wszyscy montażyści</DropdownItem>
        <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
        {installers.map((i) => (
          <DropdownItem key={i.id ?? 'null'} onSelect={() => apply({ installer: i.id ?? undefined })}>
            {i.name || '(bez nazwy)'}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </div>
  );
}
