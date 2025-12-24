
export type Stage = {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
};

export type Log = {
  id: string;
  date: string;
  time: string;
  user: string;
  action: string;
  type: 'info' | 'warning' | 'success' | 'error';
  stageId: string;
};

export const MOCK_STAGES: Stage[] = [
  { id: 'new', label: 'Nowe Zlecenie', status: 'completed', date: '20.12.2025' },
  { id: 'measure', label: 'Pomiar', status: 'completed', date: '22.12.2025' },
  { id: 'quote', label: 'Wycena', status: 'current', date: '24.12.2025' },
  { id: 'acceptance', label: 'Akceptacja', status: 'upcoming' },
  { id: 'realization', label: 'Realizacja', status: 'upcoming' },
  { id: 'done', label: 'Zakończone', status: 'upcoming' },
];

export const MOCK_LOGS: Log[] = [
  { id: '1', date: '20.12.2025', time: '09:00', user: 'System', action: 'Utworzono nowe zlecenie z formularza www', type: 'info', stageId: 'new' },
  { id: '2', date: '20.12.2025', time: '09:15', user: 'Anna Kowalska', action: 'Przypisano handlowca: Jan Nowak', type: 'info', stageId: 'new' },
  { id: '3', date: '21.12.2025', time: '14:30', user: 'Jan Nowak', action: 'Umówiono termin pomiaru na 22.12', type: 'success', stageId: 'measure' },
  { id: '4', date: '22.12.2025', time: '11:00', user: 'Marek Monter', action: 'Rozpoczęto pomiar u klienta', type: 'info', stageId: 'measure' },
  { id: '5', date: '22.12.2025', time: '12:45', user: 'Marek Monter', action: 'Zakończono pomiar. Dodano 15 zdjęć.', type: 'success', stageId: 'measure' },
  { id: '6', date: '22.12.2025', time: '13:00', user: 'System', action: 'Wygenerowano protokół pomiarowy PDF', type: 'info', stageId: 'measure' },
  { id: '7', date: '24.12.2025', time: '08:30', user: 'Jan Nowak', action: 'Rozpoczęto przygotowanie wyceny', type: 'info', stageId: 'quote' },
  { id: '8', date: '24.12.2025', time: '09:00', user: 'System', action: 'Wykryto brak dostępności produktu X', type: 'warning', stageId: 'quote' },
];
