"use client";
import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale from '@fullcalendar/core/locales/pl';
import type { EventInput } from '@fullcalendar/core';
import { useRouter } from 'next/navigation';

// Keep per-event tooltip and handlers to ensure proper cleanup
const tooltipStore = new WeakMap<HTMLElement, { tooltip: HTMLElement; onEnter: (e: MouseEvent) => void; onMove: (e: MouseEvent) => void; onLeave: (e: MouseEvent) => void; cancel: () => void }>();

type CalEvent = {
  id: string; title: string; start: string; href: string; kind: 'delivery'|'installation';
  clientName?: string | null; orderNo?: string | null; phone?: string | null; address?: string | null;
  checklistDoneCount?: number; installerId?: string | null;
  collision?: boolean; colliding?: { orderNo?: string | null; clientName?: string | null; href: string }[];
  googleSync?: 'synced'|'pending'|'error';
};

export default function CalendarClient({ events, initialView = 'dayGridMonth', initialDate }: { events: CalEvent[]; initialView?: 'dayGridMonth'|'dayGridWeek'; initialDate?: string }) {
  const router = useRouter();
  const evts = useMemo(() => events, [events]);
  // Simple PL public holidays generator for a given year (fixed dates; without moveable feasts beyond Easter)
  const holidays = useMemo<EventInput[]>(() => {
    const year = initialDate ? new Date(initialDate).getFullYear() : new Date().getFullYear();
    const fixed = [
      `${year}-01-01`, // Nowy Rok
      `${year}-05-01`, // Święto Pracy
      `${year}-05-03`, // Święto Konstytucji
      `${year}-08-15`, // Wniebowzięcie NMP
      `${year}-11-01`, // Wszystkich Świętych
      `${year}-11-11`, // Święto Niepodległości
      `${year}-12-25`, // Boże Narodzenie (I)
      `${year}-12-26`, // Boże Narodzenie (II)
    ];
    // Compute Easter Monday (Poniedziałek Wielkanocny)
    const easterMonday = (() => {
      // Anonymous Gregorian algorithm
      const y = year;
      const a = y % 19;
      const b = Math.floor(y / 100);
      const c = y % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31);
      const day = ((h + l - 7 * m + 114) % 31) + 1; // Easter Sunday
      const d0 = new Date(Date.UTC(y, month - 1, day + 1)); // Monday
      return d0.toISOString().slice(0, 10);
    })();
    fixed.push(easterMonday);
    return fixed.map(d => ({ start: d, display: 'background', title: 'Święto', color: 'rgba(176,36,23,0.06)' } satisfies EventInput));
  }, [initialDate]);

  return (
    <div className="p-3">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={initialView}
        initialDate={initialDate}
        height="auto"
        events={evts}
        eventSources={[{ events: holidays }]}
        headerToolbar={{ start: 'title', center: '', end: 'prev,next today' }}
        locales={[plLocale]}
        locale="pl"
        dayMaxEventRows={true}
        dayMaxEvents={3}
        eventClick={(info) => {
          const href = (info.event.extendedProps as { href?: string }).href;
          if (href) {
            info.jsEvent.preventDefault();
            router.push(href);
          }
        }}
        eventDidMount={(arg) => {
          // Kolor wg typu + delikatna animacja wejścia
          const kind = (arg.event.extendedProps as { kind?: CalEvent['kind'] }).kind;
          const el = arg.el as HTMLElement;
          el.style.transition = 'transform 160ms ease, background-color 160ms ease';
          el.classList.add('anim-enter');
          if (kind === 'installation') {
            el.style.backgroundColor = 'color-mix(in oklab, var(--pp-primary) 18%, transparent)';
            el.style.borderColor = 'var(--pp-primary)';
          } else if (kind === 'delivery') {
            el.style.backgroundColor = 'color-mix(in oklab, var(--pp-text) 12%, transparent)';
          }

          // Build tooltip
          const data = arg.event.extendedProps as CalEvent;
          const tooltip = document.createElement('div');
          tooltip.className = 'pointer-events-none fixed z-[100] hidden rounded-md border bg-[var(--pp-panel)] p-2 text-sm shadow-lg';
          tooltip.style.borderColor = 'var(--pp-border)';
          const parts: string[] = [];
          if (data.clientName || data.orderNo) parts.push(`<div class="font-medium">${data.clientName ?? ''}${data.orderNo ? ` • ${data.orderNo}` : ''}</div>`);
          if (data.address) parts.push(`<div class="opacity-80">${data.address}</div>`);
          if (data.phone) parts.push(`<div class="opacity-80">📞 ${data.phone}</div>`);
          if (typeof data.checklistDoneCount === 'number') parts.push(`<div class="mt-1 text-xs">Checklist: ${data.checklistDoneCount} ✓</div>`);
          // Google sync icon
          if (data.googleSync) {
            const icon = data.googleSync === 'synced' ? '✅' : data.googleSync === 'pending' ? '🕒' : '⚠️';
            parts.push(`<div class="mt-1 text-xs">Google: ${icon} ${data.googleSync}</div>`);
          }
          // Conflicts
          if (data.collision && data.colliding && data.colliding.length) {
            const lis = data.colliding.map(c => `<li><a href="${c.href}" class="underline">${c.orderNo ?? ''}</a> ${c.clientName ?? ''}</li>`).join('');
            parts.push(`<div class="mt-1 text-xs text-[--pp-warn]">⚠ kolizja</div><ul class="ml-4 list-disc">${lis}</ul>`);
          }
          tooltip.innerHTML = parts.join('');
          document.body.appendChild(tooltip);

          const onEnter = (e: MouseEvent) => {
            tooltip.classList.remove('hidden');
            const x = e.clientX + 12;
            const y = e.clientY + 12;
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
          };
          let raf = 0;
          const onMove = (e: MouseEvent) => {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
              const x = e.clientX + 12;
              const y = e.clientY + 12;
              tooltip.style.left = `${x}px`;
              tooltip.style.top = `${y}px`;
            });
          };
          const onLeave = () => { tooltip.classList.add('hidden'); };
          el.addEventListener('mouseenter', onEnter);
          el.addEventListener('mousemove', onMove);
          el.addEventListener('mouseleave', onLeave);
          tooltipStore.set(el, { tooltip, onEnter, onMove, onLeave, cancel: () => { if (raf) cancelAnimationFrame(raf); } });
        }}
        eventWillUnmount={(arg) => {
          const el = arg.el as HTMLElement;
          const rec = tooltipStore.get(el);
          if (rec) {
            el.removeEventListener('mouseenter', rec.onEnter);
            el.removeEventListener('mousemove', rec.onMove);
            el.removeEventListener('mouseleave', rec.onLeave);
            rec.cancel();
            if (rec.tooltip && rec.tooltip.remove) rec.tooltip.remove();
            tooltipStore.delete(el);
          }
        }}
      
      />
    </div>
  );
}
