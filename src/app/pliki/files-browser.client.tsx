"use client"
import React from 'react'

type Obj = { key: string; size: number; lastModified: string | null }

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B','KB','MB','GB','TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'przed chwilą'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min temu`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h temu`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days} d temu`
  return d.toLocaleString()
}

export default function FilesBrowser() {
  const [prefix, setPrefix] = React.useState<string>('clients/')
  const [folders, setFolders] = React.useState<string[]>([])
  const [objects, setObjects] = React.useState<Obj[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [nextToken, setNextToken] = React.useState<string | null>(null)
  const [view, setView] = React.useState<'grid'|'list'>('grid')
  const [sortKey, setSortKey] = React.useState<'name'|'size'|'date'>('date')
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('desc')
  const [query, setQuery] = React.useState<string>('')
  const [uploading, setUploading] = React.useState<boolean>(false)
  const [mode, setMode] = React.useState<'browse'|'months'>('browse')
  const [monthFilter, setMonthFilter] = React.useState<string | null>(null) // 'YYYY-MM'
  const [clients, setClients] = React.useState<Array<{ id: string; name: string; clientNo: number | null }>>([])
  const [clientFilter, setClientFilter] = React.useState<string>('') // client id or ''

  // Helper: map UI "klienci/" to actual "clients/"
  const toInternalPrefix = (p: string) => p.replace(/^klienci\//, 'clients/')
  const toUiPrefix = (p: string) => p.replace(/^clients\//, 'klienci/')
  const plSegment = (seg: string) => {
    // map known categories to Polish UI
    switch (seg) {
      case 'clients': return 'klienci'
      case 'invoices': return 'faktury'
      case 'installs': return 'montaże'
      case 'contracts': return 'umowy'
      case 'protocols': return 'protokoły'
      case 'other': return 'inne'
      default: return seg
    }
  }

  type ListResp = { prefix: string; folders?: string[]; objects: Obj[]; nextToken?: string | null }
  const load = React.useCallback(async (p: string) => {
    setLoading(true); setError(null)
    try {
      const url = `/api/pliki/r2/list?prefix=${encodeURIComponent(p)}${mode==='months' ? '&recursive=1' : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      const json = (await res.json()) as ListResp
  if (!res.ok) throw new Error('Błąd pobierania listy')
      setFolders(json.folders || [])
      setObjects(json.objects || [])
      setPrefix(json.prefix || p)
      setNextToken(json.nextToken || null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Błąd'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [mode])

  React.useEffect(() => { load(prefix) }, [mode, load, prefix])

  React.useEffect(() => {
    // Load clients for dropdown (latest 200 active)
    type ClientsResp = { clients: Array<{ id: string; name: string; clientNo: number | null }> }
    fetch('/api/klienci').then(r=>r.json()).then((j: ClientsResp) => {
      setClients((j?.clients || []).map((c) => ({ id: c.id, name: c.name, clientNo: c.clientNo })))
    }).catch(()=>{})
  }, [])

  const crumbs = React.useMemo(() => {
    const parts = prefix.split('/').filter(Boolean)
    const items: { label: string; path: string }[] = []
    let acc = ''
    for (const part of parts) {
      acc += part + '/'
      const label = plSegment(part)
      items.push({ label, path: acc })
    }
    return items
  }, [prefix])

  const goFolder = (p: string) => { load(p) }
  const goUp = () => {
    const idx = prefix.slice(0, -1).lastIndexOf('/')
    const up = idx > 0 ? prefix.slice(0, idx + 1) : 'clients/'
    load(up)
  }

  const onDelete = async (key: string) => {
    if (!confirm('Usunąć plik? Tej operacji nie można cofnąć.')) return
    const res = await fetch(`/api/pliki/r2/object?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
    if (res.ok) {
      setObjects((prev) => prev.filter((o) => o.key !== key))
    } else {
      const j = await res.json().catch(() => ({}))
      alert(j?.error || 'Nie udało się usunąć pliku (tylko admin).')
    }
  }

  const onLoadMore = async () => {
    if (!nextToken) return
    setLoading(true)
    try {
      const url = `/api/pliki/r2/list?prefix=${encodeURIComponent(prefix)}&token=${encodeURIComponent(nextToken)}${mode==='months' ? '&recursive=1' : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      const json = (await res.json()) as ListResp
  if (!res.ok) throw new Error('Błąd pobierania listy')
      // CommonPrefixes zwykle puste przy kolejnych stronach; foldery zostawiamy jak były
      setObjects((prev) => prev.concat(json.objects || []))
      setNextToken(json.nextToken || null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Błąd'
      setError(msg)
    } finally { setLoading(false) }
  }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const onPickFiles = () => fileInputRef.current?.click()
  const onFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const pres = await fetch('/api/pliki/r2/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: file.type || 'application/octet-stream', size: file.size, prefix, filename: file.name })
        })
        const pj = await pres.json()
        if (!pres.ok) throw new Error(pj?.error || 'Błąd presign')
        const put = await fetch(pj.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } })
        if (!put.ok) throw new Error('Błąd wysyłania do R2')
        // Po wysyłce odśwież listę (najprościej) lub dopisz element
        setObjects((prev) => [{ key: pj.key as string, size: file.size, lastModified: new Date().toISOString() }, ...prev])
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Błąd uploadu'
      alert(msg)
    } finally {
      setUploading(false)
    }
  }

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (ev) => {
    ev.preventDefault()
    if (ev.dataTransfer?.files) await onFilesSelected(ev.dataTransfer.files)
  }

  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const toggleSelect = (key: string) => setSelected((s) => ({ ...s, [key]: !s[key] }))
  const clearSelection = () => setSelected({})
  const selectedKeys = React.useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected])
  const onBulkDelete = async () => {
    if (selectedKeys.length === 0) return
    if (!confirm(`Usunąć ${selectedKeys.length} plik(i)? Tej operacji nie można cofnąć.`)) return
    for (const key of selectedKeys) {
      const res = await fetch(`/api/pliki/r2/object?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (res.ok) {
        setObjects((prev) => prev.filter((o) => o.key !== key))
      }
    }
    clearSelection()
  }

  const onRename = async (obj: Obj) => {
    const current = obj.key
    const proposed = prompt('Nowa ścieżka (prefiks: klienci/… — wewnętrznie clients/):', toUiPrefix(current))
    if (!proposed || proposed === current) return
    const internalTo = toInternalPrefix(proposed)
    if (!internalTo.startsWith('clients/')) { alert('Ścieżka musi zaczynać się od klienci/ (clients/)'); return }
    const res = await fetch('/api/pliki/r2/move', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromKey: current, toKey: internalTo }) })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) { alert(j?.error || 'Błąd przenoszenia/zmiany nazwy (admin)'); return }
    setObjects((prev) => prev.map((o) => o.key === current ? { ...o, key: internalTo } : o))
  }

  const filteredSorted = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = objects
    if (q) list = list.filter((o) => o.key.toLowerCase().includes(q))
    if (monthFilter) list = list.filter((o) => {
      const m = (o.lastModified ? new Date(o.lastModified) : new Date()).toISOString().slice(0,7)
      return m === monthFilter
    })
    const cmp = (a: Obj, b: Obj) => {
      let v = 0
      if (sortKey === 'name') v = a.key.localeCompare(b.key)
      else if (sortKey === 'size') v = (a.size - b.size)
      else {
        const ad = a.lastModified ? new Date(a.lastModified).getTime() : 0
        const bd = b.lastModified ? new Date(b.lastModified).getTime() : 0
        v = ad - bd
      }
      return sortDir === 'asc' ? v : -v
    }
    return [...list].sort(cmp)
  }, [objects, query, sortKey, sortDir, monthFilter])

  const months = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const o of objects) {
      const m = (o.lastModified ? new Date(o.lastModified) : new Date()).toISOString().slice(0,7)
      map.set(m, (map.get(m) || 0) + 1)
    }
    return Array.from(map.entries()).sort((a,b)=> b[0].localeCompare(a[0])) // najnowsze najpierw
  }, [objects])

  // Nicer month picker: years with 12 months grid (PL labels)
  const monthNamesPlShort = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'] as const
  const monthsByYear = React.useMemo(() => {
    const yearMap = new Map<number, number[]>() // year -> counts[12]
    for (const [ym, count] of months) {
      const [yStr, mStr] = ym.split('-')
      const y = parseInt(yStr, 10)
      const mIdx = parseInt(mStr, 10) - 1
      if (!yearMap.has(y)) yearMap.set(y, Array.from({ length: 12 }, () => 0))
      const arr = yearMap.get(y)!
      arr[mIdx] = (arr[mIdx] || 0) + count
    }
    // sort years desc
    return Array.from(yearMap.entries()).sort((a,b)=> b[0]-a[0])
  }, [months])

  return (
    <div className="space-y-4">
      {/* Toolbar (sticky on mobile) */}
      <div className="flex flex-wrap items-center gap-3 sticky top-0 z-10 bg-[var(--pp-panel)]/80 backdrop-blur px-2 py-2 rounded">
        <div className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap no-scrollbar max-w-full">
          <button className="underline" onClick={goUp}>..</button>
          {crumbs.map((c, i) => (
            <span key={c.path} className="flex items-center gap-2">
              <button className="underline" onClick={() => goFolder(c.path)}>{c.label}</button>
              {i < crumbs.length - 1 && <span>/</span>}
            </span>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-sm w-full sm:w-auto">
          <select className="h-10 sm:h-8 rounded border px-2 min-w-[160px]" value={clientFilter} onChange={(e) => {
            const id = e.target.value; setClientFilter(id)
            if (!id) return
            const c = clients.find((x) => x.id === id)
            if (!c || !c.clientNo) return
            const slugName = (c.name || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'')
            const p = `clients/${c.clientNo}-${slugName}/`
            setMonthFilter(null)
            load(p)
          }} style={{ borderColor: 'var(--pp-border)' }}>
            <option value="">Wszyscy klienci</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.clientNo ? `${c.clientNo} — ${c.name}` : c.name}</option>
            ))}
          </select>
          <button className="h-10 sm:h-8 px-3 rounded border" onClick={() => setMode(mode==='browse' ? 'months' : 'browse')} style={{ borderColor: 'var(--pp-border)' }}>{mode === 'browse' ? 'Widok miesięcy' : 'Widok folderów'}</button>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szukaj…" className="h-10 sm:h-8 rounded border px-2 flex-1 min-w-[160px]" style={{ borderColor: 'var(--pp-border)' }} />
          <select className="h-10 sm:h-8 rounded border px-2 min-w-[160px]" value={`${sortKey}:${sortDir}`} onChange={(e) => {
            const [k, d] = e.target.value.split(':') as [string, string]
            if (k === 'name' || k === 'size' || k === 'date') setSortKey(k)
            if (d === 'asc' || d === 'desc') setSortDir(d)
          }} style={{ borderColor: 'var(--pp-border)' }}>
            <option value="date:desc">Najnowsze</option>
            <option value="date:asc">Najstarsze</option>
            <option value="name:asc">Nazwa A–Z</option>
            <option value="name:desc">Nazwa Z–A</option>
            <option value="size:asc">Rozmiar rosnąco</option>
            <option value="size:desc">Rozmiar malejąco</option>
          </select>
          <button className="h-10 sm:h-8 px-3 rounded border" onClick={() => setView(view === 'grid' ? 'list' : 'grid')} style={{ borderColor: 'var(--pp-border)' }}>{view === 'grid' ? 'Widok listy' : 'Widok siatki'}</button>
        </div>
      </div>

      {mode === 'months' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button className="h-8 px-3 rounded border text-sm" onClick={() => setMonthFilter(null)} style={{ borderColor: 'var(--pp-border)' }}>Wszystkie miesiące</button>
            <button className="h-8 px-3 rounded border text-sm" onClick={() => {
              const d = new Date(); const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; setMonthFilter(ym)
            }} style={{ borderColor: 'var(--pp-border)' }}>Bieżący</button>
            <button className="h-8 px-3 rounded border text-sm" onClick={() => {
              const d = new Date(); d.setMonth(d.getMonth()-1); const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; setMonthFilter(ym)
            }} style={{ borderColor: 'var(--pp-border)' }}>Poprzedni</button>
          </div>
          <div className="space-y-4">
            {monthsByYear.map(([year, counts]) => (
              <div key={year} className="space-y-2">
                <div className="font-medium">{year}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {counts.map((cnt, idx) => {
                    const ym = `${year}-${String(idx+1).padStart(2,'0')}`
                    const selected = monthFilter === ym
                    return (
                      <button key={idx} onClick={() => setMonthFilter(ym)} disabled={cnt===0}
                        className={["h-10 sm:h-9 px-3 rounded border text-sm text-left", selected ? 'bg-[var(--pp-primary-subtle-bg)]' : '', cnt===0 ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}
                        style={{ borderColor: 'var(--pp-border)' }}>
                        <div className="flex items-center justify-between">
                          <span>{monthNamesPlShort[idx]}</span>
                          <span className="opacity-70">{cnt}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload */}
      <div onDragOver={(e)=>e.preventDefault()} onDrop={onDrop} className="rounded border border-dashed p-3 sm:p-4 text-sm" style={{ borderColor: 'var(--pp-border)' }}>
        <div className="flex items-center gap-3">
          <button className="h-10 sm:h-8 px-3 rounded border" onClick={onPickFiles} disabled={uploading} style={{ borderColor: 'var(--pp-border)' }}>{uploading ? 'Wysyłanie…' : 'Dodaj pliki'}</button>
          <div className="opacity-70 hidden sm:block">lub przeciągnij i upuść tutaj</div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e)=> onFilesSelected(e.target.files)} />
        </div>
      </div>

      {loading && <div>Ładowanie…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {/* Folders (only in browse mode) */}
      {mode==='browse' && folders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {folders.map((f) => (
            <button key={f} onClick={() => goFolder(f)} className="border rounded p-3 text-left hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-border)' }}>
              <div className="font-medium">{plSegment(f.replace(prefix, '').replace(/\/$/, ''))}/</div>
              <div className="opacity-70 text-xs">folder</div>
            </button>
          ))}
        </div>
      )}

      {/* Objects */}
      {filteredSorted.length === 0 ? (
        <div className="opacity-70 text-sm">Brak plików.</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSorted.map((o) => {
            const name = o.key.slice(prefix.length)
            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(o.key)
            const isPdf = /\.pdf$/i.test(o.key)
            const previewUrl = `/api/pliki/r2/proxy?key=${encodeURIComponent(o.key)}`
            const isSelected = !!selected[o.key]
            return (
              <div key={o.key} className={["border rounded p-3 flex flex-col gap-2", isSelected ? 'bg-[var(--pp-primary-subtle-bg)]' : ''].join(' ')} style={{ borderColor: 'var(--pp-border)' }}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(o.key)} />
                  <div className="font-medium break-all" title={o.key}>{name}</div>
                </div>
                <div className="text-xs opacity-70">{formatBytes(o.size)}{ o.lastModified ? ` • ${formatRelative(o.lastModified)}` : ''}</div>
                <div className="aspect-video bg-[var(--pp-panel)] grid place-items-center overflow-hidden rounded">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={name} className="object-contain max-h-full" />
                  ) : isPdf ? (
                    <iframe src={previewUrl} className="w-full h-full" title={name} />
                  ) : (
                    <div className="text-xs opacity-70">Brak podglądu</div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <a className="underline" href={previewUrl} target="_blank" rel="noopener noreferrer">Podgląd</a>
                  <a className="underline" href={previewUrl} download> Pobierz </a>
                  <button className="underline" onClick={() => onRename(o)}>Zmień nazwę/Przenieś</button>
                  <button className="text-red-600 underline ml-auto" onClick={() => onDelete(o.key)}>Usuń</button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="border rounded" style={{ borderColor: 'var(--pp-border)' }}>
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs opacity-70" style={{ borderBottom: '1px solid var(--pp-border)' }}>
            <div className="col-span-7">Nazwa</div>
            <div className="col-span-2">Rozmiar</div>
            <div className="col-span-3">Zmodyfikowano</div>
          </div>
          <ul>
            {filteredSorted.map((o) => {
              const name = o.key.slice(prefix.length)
              const previewUrl = `/api/pliki/r2/proxy?key=${encodeURIComponent(o.key)}`
              const isSelected = !!selected[o.key]
              return (
                <li key={o.key} className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b" style={{ borderColor: 'var(--pp-border)' }}>
                  <div className="col-span-7 flex items-center gap-2">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(o.key)} />
                    <span className="break-all">{name}</span>
                  </div>
                  <div className="col-span-2 text-sm opacity-70">{formatBytes(o.size)}</div>
                  <div className="col-span-3 flex items-center gap-3 text-sm">
                    <span className="opacity-70">{formatRelative(o.lastModified)}</span>
                    <a className="underline" href={previewUrl} target="_blank" rel="noopener noreferrer">Podgląd</a>
                    <a className="underline" href={previewUrl} download>Pobierz</a>
                    <button className="underline" onClick={() => onRename(o)}>Zmień</button>
                    <button className="text-red-600 underline" onClick={() => onDelete(o.key)}>Usuń</button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Bulk actions + Load more */}
      <div className="flex flex-wrap items-center gap-3">
        <button className="h-10 sm:h-8 px-3 rounded border" onClick={onBulkDelete} disabled={selectedKeys.length === 0} style={{ borderColor: 'var(--pp-border)' }}>Usuń zaznaczone</button>
        <button className="h-10 sm:h-8 px-3 rounded border" onClick={clearSelection} disabled={selectedKeys.length === 0} style={{ borderColor: 'var(--pp-border)' }}>Wyczyść zaznaczenie</button>
        <div className="ml-auto" />
        {nextToken && (
          <button className="h-10 sm:h-8 px-3 rounded border" onClick={onLoadMore} style={{ borderColor: 'var(--pp-border)' }}>Wczytaj więcej…</button>
        )}
      </div>
    </div>
  )
}
