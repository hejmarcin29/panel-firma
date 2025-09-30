"use client";
import dynamic from "next/dynamic";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  href: string;
  kind: "delivery" | "installation";
};

const CalendarClient = dynamic<{
  events: CalendarEvent[];
  initialView?: "dayGridMonth" | "dayGridWeek";
  initialDate?: string;
}>(() => import("./calendar.client").then((m) => m.default), { ssr: false });

export function CalendarRoot(props: {
  events: CalendarEvent[];
  initialView?: "dayGridMonth" | "dayGridWeek";
  initialDate?: string;
}) {
  return <CalendarClient {...props} />;
}
