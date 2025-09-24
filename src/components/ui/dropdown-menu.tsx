"use client"
import React, { useEffect, useRef, useState, useContext, createContext } from 'react'

type DropdownMenuProps = {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'start' | 'end'
}

const DropdownContext = createContext<{ close: () => void } | null>(null)

export function DropdownMenu({ trigger, children, align = 'start' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  return (
    <div className="relative inline-block" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10">
        {trigger}
      </button>
      {open && (
        <div className={`absolute z-50 mt-1 min-w-36 rounded border border-black/15 bg-white p-1 text-sm shadow-lg dark:border-white/15 dark:bg-neutral-900 ${align === 'end' ? 'right-0' : 'left-0'}`} role="menu">
          <DropdownContext.Provider value={{ close: () => setOpen(false) }}>
            {children}
          </DropdownContext.Provider>
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ onSelect, children }: { onSelect?: () => void; children: React.ReactNode }) {
  const ctx = useContext(DropdownContext)
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onSelect?.()
        ctx?.close()
      }}
      className="block w-full rounded px-2 py-1 text-left hover:bg-black/5 dark:hover:bg-white/10"
    >
      {children}
    </button>
  )
}
