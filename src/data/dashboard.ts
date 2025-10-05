export const revenueTrend = [
  { month: "Sty", value: 28000, target: 25000 },
  { month: "Lut", value: 26000, target: 24500 },
  { month: "Mar", value: 32000, target: 27000 },
  { month: "Kwi", value: 29500, target: 28000 },
  { month: "Maj", value: 34000, target: 30000 },
  { month: "Cze", value: 36500, target: 31000 },
];

export const pipelineHealth = [
  { status: "Oczekiwanie", orders: 18 },
  { status: "W realizacji", orders: 26 },
  { status: "Do akceptacji", orders: 9 },
  { status: "Po montażu", orders: 12 },
];

export const channelPerformance = [
  { channel: "Rekomendacje", sprzedaż: 42, wizyty: 64 },
  { channel: "Partnerzy", sprzedaż: 55, wizyty: 72 },
  { channel: "Salony", sprzedaż: 48, wizyty: 60 },
  { channel: "Online", sprzedaż: 33, wizyty: 52 },
  { channel: "Architekci", sprzedaż: 27, wizyty: 40 },
];

export const regionalSales = [
  { region: "Mazowieckie", value: 84500, delta: 12.5 },
  { region: "Małopolskie", value: 67700, delta: 9.6 },
  { region: "Dolnośląskie", value: 53800, delta: -4.3 },
  { region: "Wielkopolskie", value: 48900, delta: 6.2 },
];

export const activeProjects = [
  { name: "Montaże", progress: 72, color: "hsl(var(--chart-1))" },
  { name: "Pomiary", progress: 54, color: "hsl(var(--chart-2))" },
  { name: "Dostawy", progress: 63, color: "hsl(var(--chart-3))" },
];

export const activityFeed = [
  {
    time: "12 min temu",
    title: "Nowe zlecenie",
    description: "Partner Studio Lux dodał zlecenie – etap: Przed pomiarem",
  },
  {
    time: "35 min temu",
    title: "Aktualizacja montażu",
    description: "Brygada #M-12 oznaczyła montaż jako zakończony",
  },
  {
    time: "1 h temu",
    title: "Zaliczka zaksięgowana",
    description: "Księgowość potwierdziła wpłatę dla zamówienia #ZL-1084",
  },
  {
    time: "2 h temu",
    title: "Zmiana statusu partnera",
    description: "GreenHome awansował na status: Aktywny",
  },
];
