"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { pl } from "@/i18n/pl";

export function SystemStatusInfo() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [events, setEvents] = useState<any[] | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    if (eventOpen) {
      setEventsLoading(true);
      setEventsError(null);
      fetch('/api/events')
        .then(r => r.json())
        .then(data => { setEvents(data.events || []); })
        .catch(() => setEventsError('Błąd pobierania zdarzeń'))
        .finally(() => setEventsLoading(false));
    }
  }, [eventOpen]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => setInfoOpen(true)}>
        {pl.dashboard.systemInfoButton}
      </Button>
      <Button variant="outline" size="sm" onClick={() => setEventOpen(true)}>
        {pl.dashboard.eventStoreButton}
      </Button>
      <Button variant="outline" size="sm" onClick={() => setAutoOpen(true)}>
        {pl.dashboard.automationsButton}
      </Button>

      <AlertDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        title={pl.dashboard.systemInfoTitle}
        description={
          <div className="space-y-3 text-left">
            <p>{pl.dashboard.systemInfoDescription}</p>
            <ul className="list-disc space-y-1 pl-5">
              {pl.dashboard.systemInfoPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        }
        cancelText={pl.common.close}
        showConfirmButton={false}
      />

      <AlertDialog
        open={eventOpen}
        onOpenChange={setEventOpen}
        title={pl.dashboard.eventStoreTitle}
        description={
          <div className="space-y-3 text-left max-h-[60vh] overflow-y-auto pr-1">
            <p>{pl.dashboard.eventStoreDescription}</p>
            {eventsLoading && <div className="text-sm text-muted-foreground">Ładowanie…</div>}
            {eventsError && <div className="text-sm text-red-600">{eventsError}</div>}
            {!eventsLoading && !eventsError && (
              events && events.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {events.map(ev => (
                    <li key={ev.id} className="rounded border bg-background/60 px-2 py-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs opacity-60">{new Date(ev.occurredAt).toLocaleString()}</span>
                        <span className="font-semibold">{ev.type}</span>
                        {ev.actor && <span className="text-xs text-muted-foreground">{ev.actor}</span>}
                        {ev.entityType && ev.entityId && (
                          <span className="text-xs text-muted-foreground">{ev.entityType}:{ev.entityId.slice(0,8)}</span>
                        )}
                      </div>
                      {ev.payload && ev.payload.changedFields && (
                        <div className="text-xs mt-0.5 text-muted-foreground">changed: {ev.payload.changedFields.join(', ')}</div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded border bg-muted/30 p-3 text-sm">
                  {pl.dashboard.eventStoreEmpty}
                </div>
              )
            )}
          </div>
        }
        cancelText={pl.common.close}
        showConfirmButton={false}
      />

      <AlertDialog
        open={autoOpen}
        onOpenChange={setAutoOpen}
        title={pl.dashboard.automationsTitle}
        description={
          <div className="space-y-3 text-left">
            <p>{pl.dashboard.automationsDescription}</p>
            <div className="rounded border bg-muted/30 p-3 text-sm">
              {pl.dashboard.automationsEmpty}
            </div>
          </div>
        }
        cancelText={pl.common.close}
        showConfirmButton={false}
      />
    </div>
  );
}
