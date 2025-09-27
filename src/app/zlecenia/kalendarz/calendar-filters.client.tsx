"use client";
import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu';

type ViewMode = 'dayGridMonth' | 'dayGridWeek'

export function CalendarFilters({
  installers,
  selectedInstaller,
  kinds = ['installation','delivery'],
  statuses = ['planned','confirmed'],
  q = '',
  view = 'dayGridMonth',
}: {
  installers: { id: string | null; name: string | null }[];
  selectedInstaller?: string;
  kinds?: ('installation'|'delivery')[];
  statuses?: ('planned'|'confirmed')[];
  q?: string;
  view?: ViewMode;
}) {
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

  const applyKinds = (nextKinds: ('installation'|'delivery')[]) => {
    const v = nextKinds.length === 0 || nextKinds.length === 2 ? undefined : nextKinds.join(',');
    apply({ kinds: v });
  };

  const applyStatuses = (nextStatuses: ('planned'|'confirmed')[]) => {
    const v = nextStatuses.length === 0 || nextStatuses.length === 2 ? undefined : nextStatuses.join(',');
    apply({ statuses: v });
  };

  const setView = (vm: ViewMode) => apply({ view: vm });

  const [search, setSearch] = React.useState(q);
  React.useEffect(() => setSearch(q), [q]);

  const onSearchCommit = () => {
    const v = search.trim();
    apply({ q: v || undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Installer filter */}
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

      {/* Kind filter */}
      <DropdownMenu trigger={<span>Rodzaj: {kinds.length === 2 ? 'wszystko' : kinds[0] === 'installation' ? 'montaże' : 'dostawy'}</span>}>
        <div className="px-1 py-1 text-xs opacity-60">Rodzaj</div>
        <DropdownItem onSelect={() => applyKinds(['installation','delivery'])}>Wszystko</DropdownItem>
        <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
        <DropdownItem onSelect={() => applyKinds(['installation'])}>Tylko montaże</DropdownItem>
        <DropdownItem onSelect={() => applyKinds(['delivery'])}>Tylko dostawy</DropdownItem>
      </DropdownMenu>

      {/* Status filter */}
      <DropdownMenu trigger={<span>Status: {statuses.length === 2 ? 'plan./potw.' : statuses[0] === 'planned' ? 'planowane' : 'potwierdzone'}</span>}>
        <div className="px-1 py-1 text-xs opacity-60">Status</div>
        <DropdownItem onSelect={() => applyStatuses(['planned','confirmed'])}>Planowane + Potwierdzone</DropdownItem>
        <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
        <DropdownItem onSelect={() => applyStatuses(['planned'])}>Tylko planowane</DropdownItem>
        <DropdownItem onSelect={() => applyStatuses(['confirmed'])}>Tylko potwierdzone</DropdownItem>
      </DropdownMenu>

      {/* View switcher */}
      <div className="flex items-center gap-1 rounded border px-1 py-0.5" style={{ borderColor: 'var(--pp-border)' }}>
        <button aria-label="Widok miesiąc" className={`px-2 py-1 rounded ${view === 'dayGridMonth' ? 'bg-[var(--pp-primary)]/15' : ''}`} onClick={() => setView('dayGridMonth')}>Miesiąc</button>
        <button aria-label="Widok tydzień" className={`px-2 py-1 rounded ${view === 'dayGridWeek' ? 'bg-[var(--pp-primary)]/15' : ''}`} onClick={() => setView('dayGridWeek')}>Tydzień</button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearchCommit(); }}
          placeholder="Szukaj: klient / nr / adres"
          className="h-8 w-56 rounded border bg-transparent px-2 text-sm"
          style={{ borderColor: 'var(--pp-border)' }}
        />
        <button className="h-8 rounded border px-2 text-sm" style={{ borderColor: 'var(--pp-border)' }} onClick={onSearchCommit}>Szukaj</button>
        {q ? (
          <button className="h-8 rounded border px-2 text-sm" style={{ borderColor: 'var(--pp-border)' }} onClick={() => apply({ q: undefined })}>Wyczyść</button>
        ) : null}
      </div>
    </div>
  );
}
