export type InstallationStatus =
  | "Planowany"
  | "W toku"
  | "Do potwierdzenia"
  | "Zakończony"
  | "Opóźniony"
  | "Wstrzymany";

export type InstallationRecord = {
  order: string;
  client: string;
  segment: string;
  product: string;
  city: string;
  plannedDate: string;
  timeWindow: string;
  crew: string;
  status: InstallationStatus;
  progress: string;
  notes?: string;
  priority?: "wysoki" | "standard";
};

export const installations: InstallationRecord[] = [];
